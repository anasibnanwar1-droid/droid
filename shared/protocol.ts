// Wire protocol shared between the React frontend and the local Node backend.
// Keep this isomorphic (types + tiny helpers only) so both sides can import it.

export type RunStatus = 'queued' | 'running' | 'review' | 'done' | 'error' | 'reverted'

export type ProviderId = 'factory-droid' | 'simulated' | 'codex' | 'claude'

export interface ProviderInfo {
  id: ProviderId
  displayName: string
  available: boolean
  detail?: string
}

export interface Project {
  id: string
  name: string
  path: string
  createdAt: number
}

export interface Session {
  id: string
  projectId: string
  provider: ProviderId
  title: string
  status: RunStatus
  createdAt: number
  updatedAt: number
}

export interface Turn {
  id: string
  sessionId: string
  prompt: string
  status: RunStatus
  startedAt: number
  completedAt: number | null
}

// Normalized agent event kinds (provider-agnostic).
export type EventKind =
  | 'status'
  | 'message'
  | 'plan'
  | 'search'
  | 'tool'
  | 'edit'
  | 'command'
  | 'stdout'
  | 'stderr'
  | 'completed'
  | 'error'

export interface AgentEvent {
  id: string
  sessionId: string
  turnId: string
  kind: EventKind
  title?: string
  body?: string
  file?: string
  createdAt: number
}

export interface DiffFile {
  path: string
  status: 'added' | 'modified' | 'deleted'
  added: number
  removed: number
}

export interface FileDiff {
  path: string
  patch: string
}

// ---- Client -> Server ----
export type ClientMessage =
  | { type: 'projects.list' }
  | { type: 'projects.add'; path: string }
  | { type: 'sessions.list'; projectId: string }
  | { type: 'session.open'; sessionId: string }
  | { type: 'session.create'; projectId: string; title: string; prompt: string }
  | { type: 'turn.create'; sessionId: string; prompt: string }
  | { type: 'turn.cancel'; sessionId: string }
  | { type: 'review.diff'; sessionId: string }
  | { type: 'review.file'; sessionId: string; path: string }
  | { type: 'review.accept'; sessionId: string }
  | { type: 'review.revert'; sessionId: string }
  | { type: 'providers.list' }

// ---- Server -> Client ----
export type ServerMessage =
  | { type: 'projects'; projects: Project[] }
  | { type: 'sessions'; projectId: string; sessions: Session[] }
  | { type: 'session'; session: Session; turns: Turn[]; events: AgentEvent[] }
  | { type: 'turn'; turn: Turn }
  | { type: 'event'; event: AgentEvent }
  | { type: 'turn.status'; sessionId: string; turnId: string; status: RunStatus }
  | { type: 'session.status'; sessionId: string; status: RunStatus }
  | { type: 'diff'; sessionId: string; files: DiffFile[] }
  | { type: 'file'; sessionId: string; diff: FileDiff }
  | { type: 'providers'; providers: ProviderInfo[] }
  | { type: 'error'; message: string }

export const WS_PORT = 8787
