import { useSyncExternalStore } from 'react'
import { WS_PORT } from '../../shared/protocol'
import type {
  AgentEvent,
  ClientMessage,
  DiffFile,
  Project,
  ProviderInfo,
  ServerMessage,
  Session,
  Turn,
} from '../../shared/protocol'

export interface AppState {
  connected: boolean
  projects: Project[]
  sessionsByProject: Record<string, Session[]>
  activeProjectId: string | null
  activeSessionId: string | null
  session: Session | null
  turns: Turn[]
  events: AgentEvent[]
  diffFiles: DiffFile[]
  fileDiffs: Record<string, string>
  providers: ProviderInfo[]
  error: string | null
}

const initial: AppState = {
  connected: false,
  projects: [],
  sessionsByProject: {},
  activeProjectId: null,
  activeSessionId: null,
  session: null,
  turns: [],
  events: [],
  diffFiles: [],
  fileDiffs: {},
  providers: [],
  error: null,
}

class Store {
  private state: AppState = initial
  private listeners = new Set<() => void>()
  private ws: WebSocket | null = null
  private queue: ClientMessage[] = []
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return
    const ws = new WebSocket(`ws://localhost:${WS_PORT}`)
    this.ws = ws
    ws.onopen = () => {
      this.set({ connected: true, error: null })
      this.queue.splice(0).forEach((m) => ws.send(JSON.stringify(m)))
      this.send({ type: 'providers.list' })
      this.send({ type: 'projects.list' })
    }
    ws.onclose = () => {
      this.set({ connected: false })
      this.scheduleReconnect()
    }
    ws.onerror = () => ws.close()
    ws.onmessage = (ev) => this.onMessage(JSON.parse(ev.data) as ServerMessage)
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, 1000)
  }

  send(msg: ClientMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg))
    else this.queue.push(msg)
  }

  private onMessage(msg: ServerMessage) {
    switch (msg.type) {
      case 'projects': {
        const activeProjectId = this.state.activeProjectId ?? msg.projects[0]?.id ?? null
        this.set({ projects: msg.projects, activeProjectId })
        if (activeProjectId) this.send({ type: 'sessions.list', projectId: activeProjectId })
        break
      }
      case 'sessions':
        this.set({
          sessionsByProject: { ...this.state.sessionsByProject, [msg.projectId]: msg.sessions },
        })
        break
      case 'session':
        this.set({
          activeSessionId: msg.session.id,
          session: msg.session,
          turns: msg.turns,
          events: msg.events,
          fileDiffs: {},
        })
        break
      case 'turn':
        if (msg.turn.sessionId === this.state.activeSessionId && !this.state.turns.some((t) => t.id === msg.turn.id))
          this.set({ turns: [...this.state.turns, msg.turn] })
        break
      case 'event':
        if (msg.event.sessionId === this.state.activeSessionId)
          this.set({ events: [...this.state.events, msg.event] })
        break
      case 'turn.status':
        if (msg.sessionId === this.state.activeSessionId)
          this.set({ turns: this.state.turns.map((t) => (t.id === msg.turnId ? { ...t, status: msg.status } : t)) })
        break
      case 'session.status':
        this.patchSessionStatus(msg.sessionId, msg.status)
        break
      case 'diff':
        if (msg.sessionId === this.state.activeSessionId) this.set({ diffFiles: msg.files })
        break
      case 'file':
        if (msg.sessionId === this.state.activeSessionId)
          this.set({ fileDiffs: { ...this.state.fileDiffs, [msg.diff.path]: msg.diff.patch } })
        break
      case 'providers':
        this.set({ providers: msg.providers })
        break
      case 'error':
        this.set({ error: msg.message })
        break
    }
  }

  private patchSessionStatus(sessionId: string, status: Session['status']) {
    const next: Partial<AppState> = {}
    if (this.state.session?.id === sessionId) next.session = { ...this.state.session, status }
    const sb = this.state.sessionsByProject
    const updated: Record<string, Session[]> = {}
    for (const [pid, list] of Object.entries(sb))
      updated[pid] = list.map((s) => (s.id === sessionId ? { ...s, status } : s))
    next.sessionsByProject = updated
    this.set(next)
  }

  // ---- intent helpers ----
  selectProject(projectId: string) {
    this.set({ activeProjectId: projectId, activeSessionId: null, session: null, turns: [], events: [], diffFiles: [] })
    this.send({ type: 'sessions.list', projectId })
  }
  openSession(sessionId: string) {
    this.send({ type: 'session.open', sessionId })
  }
  createSession(projectId: string, title: string, prompt: string) {
    this.send({ type: 'session.create', projectId, title, prompt })
  }

  private set(patch: Partial<AppState>) {
    this.state = { ...this.state, ...patch }
    this.listeners.forEach((l) => l())
  }
  getState = () => this.state
  subscribe = (l: () => void) => {
    this.listeners.add(l)
    return () => this.listeners.delete(l)
  }
}

export const store = new Store()

export function useStore<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
  )
}
