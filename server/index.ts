import { createServer } from 'node:http'
import { homedir } from 'node:os'
import { basename, join } from 'node:path'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { WebSocketServer, WebSocket } from 'ws'
import { Store } from './db.ts'
import * as git from './git.ts'
import { listProviders, pickProvider } from './providers/index.ts'
import type { RunHandle } from './providers/types.ts'
import type { ClientMessage, ServerMessage } from '../shared/protocol.ts'
import { WS_PORT } from '../shared/protocol.ts'

const DATA_DIR = join(homedir(), '.droid-workspace')
const store = new Store(join(DATA_DIR, 'droid.db'))
const activeRuns = new Map<string, RunHandle>()

seedSampleProject()

const server = createServer()
const wss = new WebSocketServer({ server })

function send(ws: WebSocket, msg: ServerMessage) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg))
}
function broadcast(msg: ServerMessage) {
  const data = JSON.stringify(msg)
  for (const c of wss.clients) if (c.readyState === WebSocket.OPEN) c.send(data)
}

wss.on('connection', (ws) => {
  send(ws, { type: 'projects', projects: store.listProjects() })
  ws.on('message', (raw) => {
    let msg: ClientMessage
    try {
      msg = JSON.parse(raw.toString())
    } catch {
      return send(ws, { type: 'error', message: 'bad message' })
    }
    handle(ws, msg).catch((e) => send(ws, { type: 'error', message: String(e?.message ?? e) }))
  })
})

async function handle(ws: WebSocket, msg: ClientMessage) {
  switch (msg.type) {
    case 'projects.list':
      return send(ws, { type: 'projects', projects: store.listProjects() })

    case 'projects.add': {
      if (!existsSync(msg.path)) return send(ws, { type: 'error', message: 'Path does not exist' })
      if (!(await git.isGitRepo(msg.path)))
        return send(ws, { type: 'error', message: 'Not a git repository' })
      store.addProject(basename(msg.path), msg.path)
      return broadcast({ type: 'projects', projects: store.listProjects() })
    }

    case 'sessions.list':
      return send(ws, { type: 'sessions', projectId: msg.projectId, sessions: store.listSessions(msg.projectId) })

    case 'providers.list':
      return send(ws, { type: 'providers', providers: await listProviders() })

    case 'session.open': {
      const session = store.getSession(msg.sessionId)
      if (!session) return send(ws, { type: 'error', message: 'No such session' })
      send(ws, { type: 'session', session, turns: store.listTurns(session.id), events: store.listEvents(session.id) })
      await sendDiff(session.id)
      return
    }

    case 'session.create': {
      const project = store.getProject(msg.projectId)
      if (!project) return send(ws, { type: 'error', message: 'No such project' })
      const provider = await pickProvider()
      const session = store.createSession(project.id, provider.id, msg.title || msg.prompt.slice(0, 60))
      const before = await git.headSha(project.path)
      const branch = await git.currentBranch(project.path)
      store.addCheckpoint(session.id, before, branch)
      broadcast({ type: 'sessions', projectId: project.id, sessions: store.listSessions(project.id) })
      send(ws, { type: 'session', session, turns: [], events: [] })
      await runTurn(session.id, project.path, msg.prompt)
      return
    }

    case 'turn.create': {
      const session = store.getSession(msg.sessionId)
      if (!session) return send(ws, { type: 'error', message: 'No such session' })
      const project = store.getProject(session.projectId)!
      await runTurn(session.id, project.path, msg.prompt)
      return
    }

    case 'turn.cancel': {
      activeRuns.get(msg.sessionId)?.cancel()
      activeRuns.delete(msg.sessionId)
      store.setSessionStatus(msg.sessionId, 'review')
      return broadcast({ type: 'session.status', sessionId: msg.sessionId, status: 'review' })
    }

    case 'review.diff':
      return sendDiff(msg.sessionId)

    case 'review.file': {
      const session = store.getSession(msg.sessionId)
      if (!session) return
      const project = store.getProject(session.projectId)!
      return send(ws, { type: 'file', sessionId: session.id, diff: await git.fileDiff(project.path, msg.path) })
    }

    case 'review.accept': {
      const session = store.getSession(msg.sessionId)
      if (!session) return
      const project = store.getProject(session.projectId)!
      await git.commitAll(project.path, `DROID: ${session.title}`)
      store.setSessionStatus(session.id, 'done')
      broadcast({ type: 'session.status', sessionId: session.id, status: 'done' })
      return sendDiff(session.id)
    }

    case 'review.revert': {
      const session = store.getSession(msg.sessionId)
      if (!session) return
      const project = store.getProject(session.projectId)!
      const cp = store.latestCheckpoint(session.id)
      await git.revertToCheckpoint(project.path, cp?.commitBefore ?? null)
      store.setSessionStatus(session.id, 'reverted')
      broadcast({ type: 'session.status', sessionId: session.id, status: 'reverted' })
      return sendDiff(session.id)
    }
  }
}

async function runTurn(sessionId: string, repoPath: string, prompt: string) {
  const turn = store.createTurn(sessionId, prompt)
  store.setSessionStatus(sessionId, 'running')
  broadcast({ type: 'turn', turn })
  broadcast({ type: 'turn.status', sessionId, turnId: turn.id, status: 'running' })
  broadcast({ type: 'session.status', sessionId, status: 'running' })

  const provider = await pickProvider()
  const handle = await Promise.resolve(
    provider.run({ repoPath, prompt, sessionId }, (e) => {
      const stored = store.addEvent({ sessionId, turnId: turn.id, ...e })
      broadcast({ type: 'event', event: stored })
      if (e.kind === 'completed') finish('review')
      else if (e.kind === 'error') finish('error')
    }),
  )
  activeRuns.set(sessionId, handle)

  function finish(status: 'review' | 'error') {
    activeRuns.delete(sessionId)
    store.setTurnStatus(turn.id, status === 'review' ? 'done' : 'error')
    store.setSessionStatus(sessionId, status)
    broadcast({ type: 'turn.status', sessionId, turnId: turn.id, status: status === 'review' ? 'done' : 'error' })
    broadcast({ type: 'session.status', sessionId, status })
    sendDiff(sessionId)
  }
}

async function sendDiff(sessionId: string) {
  const session = store.getSession(sessionId)
  if (!session) return
  const project = store.getProject(session.projectId)
  if (!project) return
  const files = await git.changedFiles(project.path)
  broadcast({ type: 'diff', sessionId, files })
}

function seedSampleProject() {
  if (store.listProjects().length > 0) return
  const sample = join(DATA_DIR, 'sample-project')
  try {
    if (!existsSync(sample)) {
      mkdirSync(sample, { recursive: true })
      writeFileSync(join(sample, 'README.md'), '# Sample Project\n\nA demo repo for DROID tasks.\n')
      writeFileSync(join(sample, 'index.js'), "export const greet = (n) => `hi ${n}`\n")
      const g = (args: string[]) => execFileSync('git', ['-C', sample, ...args], { stdio: 'ignore' })
      g(['init', '-b', 'main'])
      g(['add', '-A'])
      g(['-c', 'user.email=droid@local', '-c', 'user.name=DROID', 'commit', '-m', 'init sample project'])
    }
    store.addProject('sample-project', sample)
  } catch {
    /* best-effort seed */
  }
}

server.listen(WS_PORT, () => {
  console.log(`[droid] backend listening on ws://localhost:${WS_PORT}`)
})
