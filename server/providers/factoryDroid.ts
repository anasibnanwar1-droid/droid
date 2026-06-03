import { execFile, spawn } from 'node:child_process'
import { promisify } from 'node:util'
import type { AgentProvider, RawEvent, RunHandle, StartInput } from './types.ts'

const pexec = promisify(execFile)

// Adapter around Factory's `droid exec`. The user logs in once via `droid`,
// so this app never stores Factory API keys.
//
//   droid exec --output-format debug "<task>"
//
// `debug` emits structured/streaming output we map onto normalized events.
export const factoryDroidProvider: AgentProvider = {
  id: 'factory-droid',
  displayName: 'Factory Droid',

  async detect() {
    try {
      const { stdout } = await pexec('droid', ['--version'])
      return { available: true, detail: stdout.trim() }
    } catch {
      return { available: false, detail: 'droid CLI not found on PATH' }
    }
  },

  run({ repoPath, prompt }: StartInput, onEvent: (e: RawEvent) => void): RunHandle {
    const child = spawn('droid', ['exec', '--output-format', 'debug', prompt], {
      cwd: repoPath,
      env: process.env,
      shell: false,
    })

    onEvent({ kind: 'status', title: 'Droid started', body: `droid exec in ${repoPath}` })

    child.stdout.on('data', (chunk: Buffer) => mapDroidChunk(chunk.toString(), onEvent))
    child.stderr.on('data', (chunk: Buffer) => onEvent({ kind: 'stderr', body: chunk.toString() }))
    child.on('error', (err) => onEvent({ kind: 'error', title: 'Spawn failed', body: String(err) }))
    child.on('close', (code) => {
      onEvent(
        code === 0
          ? { kind: 'completed', title: 'Droid completed' }
          : { kind: 'error', title: `Droid exited with code ${code}` },
      )
    })

    return { cancel: () => child.kill('SIGTERM') }
  },
}

// Best-effort mapping of `droid exec --output-format debug` lines to events.
// Falls back to raw stdout so nothing is ever lost.
function mapDroidChunk(text: string, onEvent: (e: RawEvent) => void) {
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    try {
      const obj = JSON.parse(trimmed) as Record<string, unknown>
      const t = String(obj.type ?? obj.event ?? '')
      if (t.includes('tool') || t.includes('command')) {
        onEvent({ kind: 'command', title: String(obj.name ?? 'Tool'), body: stringify(obj) })
        continue
      }
      if (t.includes('edit') || t.includes('file') || t.includes('patch')) {
        onEvent({ kind: 'edit', title: 'Edited files', body: stringify(obj), file: String(obj.path ?? obj.file ?? '') })
        continue
      }
      if (t.includes('message') || t.includes('assistant') || t.includes('text')) {
        onEvent({ kind: 'message', body: String(obj.text ?? obj.message ?? stringify(obj)) })
        continue
      }
      onEvent({ kind: 'stdout', body: stringify(obj) })
    } catch {
      onEvent({ kind: 'stdout', body: trimmed })
    }
  }
}

function stringify(o: unknown): string {
  try {
    return JSON.stringify(o)
  } catch {
    return String(o)
  }
}
