import type { EventKind, ProviderId } from '../../shared/protocol.ts'

export interface RawEvent {
  kind: EventKind
  title?: string
  body?: string
  file?: string
}

export interface StartInput {
  repoPath: string
  prompt: string
  sessionId: string
}

export interface RunHandle {
  cancel(): void
}

export interface AgentProvider {
  id: ProviderId
  displayName: string
  detect(): Promise<{ available: boolean; detail?: string }>
  // Streams normalized events; resolves when the run completes.
  run(input: StartInput, onEvent: (e: RawEvent) => void): Promise<RunHandle> | RunHandle
}
