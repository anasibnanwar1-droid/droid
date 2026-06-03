import { DatabaseSync } from 'node:sqlite'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { randomUUID } from 'node:crypto'
import type {
  AgentEvent,
  Project,
  RunStatus,
  Session,
  Turn,
} from '../shared/protocol.ts'

export class Store {
  private db: DatabaseSync

  constructor(file: string) {
    if (file !== ':memory:' && !existsSync(dirname(file))) {
      mkdirSync(dirname(file), { recursive: true })
    }
    this.db = new DatabaseSync(file)
    this.db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;')
    this.migrate()
  }

  private migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        path TEXT NOT NULL UNIQUE,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        provider TEXT NOT NULL,
        title TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS turns (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        prompt TEXT NOT NULL,
        status TEXT NOT NULL,
        started_at INTEGER NOT NULL,
        completed_at INTEGER
      );
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        turn_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        title TEXT,
        body TEXT,
        file TEXT,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS checkpoints (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        git_commit_before TEXT,
        branch_name TEXT,
        created_at INTEGER NOT NULL
      );
    `)
  }

  // ---- projects ----
  addProject(name: string, path: string): Project {
    const existing = this.db.prepare('SELECT * FROM projects WHERE path = ?').get(path) as
      | Record<string, unknown>
      | undefined
    if (existing) return rowToProject(existing)
    const p: Project = { id: randomUUID(), name, path, createdAt: Date.now() }
    this.db
      .prepare('INSERT INTO projects (id, name, path, created_at) VALUES (?, ?, ?, ?)')
      .run(p.id, p.name, p.path, p.createdAt)
    return p
  }

  listProjects(): Project[] {
    return (this.db.prepare('SELECT * FROM projects ORDER BY created_at').all() as Record<
      string,
      unknown
    >[]).map(rowToProject)
  }

  getProject(id: string): Project | undefined {
    const r = this.db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as
      | Record<string, unknown>
      | undefined
    return r ? rowToProject(r) : undefined
  }

  // ---- sessions ----
  createSession(projectId: string, provider: string, title: string): Session {
    const now = Date.now()
    const s: Session = {
      id: randomUUID(),
      projectId,
      provider: provider as Session['provider'],
      title,
      status: 'queued',
      createdAt: now,
      updatedAt: now,
    }
    this.db
      .prepare(
        'INSERT INTO sessions (id, project_id, provider, title, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
      .run(s.id, s.projectId, s.provider, s.title, s.status, s.createdAt, s.updatedAt)
    return s
  }

  listSessions(projectId: string): Session[] {
    return (
      this.db
        .prepare('SELECT * FROM sessions WHERE project_id = ? ORDER BY updated_at DESC')
        .all(projectId) as Record<string, unknown>[]
    ).map(rowToSession)
  }

  getSession(id: string): Session | undefined {
    const r = this.db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as
      | Record<string, unknown>
      | undefined
    return r ? rowToSession(r) : undefined
  }

  setSessionStatus(id: string, status: RunStatus) {
    this.db
      .prepare('UPDATE sessions SET status = ?, updated_at = ? WHERE id = ?')
      .run(status, Date.now(), id)
  }

  // ---- turns ----
  createTurn(sessionId: string, prompt: string): Turn {
    const t: Turn = {
      id: randomUUID(),
      sessionId,
      prompt,
      status: 'running',
      startedAt: Date.now(),
      completedAt: null,
    }
    this.db
      .prepare(
        'INSERT INTO turns (id, session_id, prompt, status, started_at, completed_at) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .run(t.id, t.sessionId, t.prompt, t.status, t.startedAt, t.completedAt)
    return t
  }

  setTurnStatus(id: string, status: RunStatus) {
    const completed = status === 'running' ? null : Date.now()
    this.db.prepare('UPDATE turns SET status = ?, completed_at = ? WHERE id = ?').run(status, completed, id)
  }

  listTurns(sessionId: string): Turn[] {
    return (
      this.db.prepare('SELECT * FROM turns WHERE session_id = ? ORDER BY started_at').all(sessionId) as Record<
        string,
        unknown
      >[]
    ).map(rowToTurn)
  }

  // ---- events ----
  addEvent(e: Omit<AgentEvent, 'id' | 'createdAt'> & { createdAt?: number }): AgentEvent {
    const full: AgentEvent = { id: randomUUID(), createdAt: e.createdAt ?? Date.now(), ...e }
    this.db
      .prepare(
        'INSERT INTO events (id, session_id, turn_id, kind, title, body, file, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .run(full.id, full.sessionId, full.turnId, full.kind, full.title ?? null, full.body ?? null, full.file ?? null, full.createdAt)
    return full
  }

  listEvents(sessionId: string): AgentEvent[] {
    return (
      this.db.prepare('SELECT * FROM events WHERE session_id = ? ORDER BY created_at').all(sessionId) as Record<
        string,
        unknown
      >[]
    ).map(rowToEvent)
  }

  // ---- checkpoints ----
  addCheckpoint(sessionId: string, commitBefore: string | null, branch: string | null) {
    this.db
      .prepare(
        'INSERT INTO checkpoints (id, session_id, git_commit_before, branch_name, created_at) VALUES (?, ?, ?, ?, ?)',
      )
      .run(randomUUID(), sessionId, commitBefore, branch, Date.now())
  }

  latestCheckpoint(sessionId: string): { commitBefore: string | null } | undefined {
    const r = this.db
      .prepare('SELECT git_commit_before FROM checkpoints WHERE session_id = ? ORDER BY created_at DESC LIMIT 1')
      .get(sessionId) as Record<string, unknown> | undefined
    return r ? { commitBefore: (r.git_commit_before as string | null) ?? null } : undefined
  }
}

function rowToProject(r: Record<string, unknown>): Project {
  return { id: r.id as string, name: r.name as string, path: r.path as string, createdAt: r.created_at as number }
}
function rowToSession(r: Record<string, unknown>): Session {
  return {
    id: r.id as string,
    projectId: r.project_id as string,
    provider: r.provider as Session['provider'],
    title: r.title as string,
    status: r.status as RunStatus,
    createdAt: r.created_at as number,
    updatedAt: r.updated_at as number,
  }
}
function rowToTurn(r: Record<string, unknown>): Turn {
  return {
    id: r.id as string,
    sessionId: r.session_id as string,
    prompt: r.prompt as string,
    status: r.status as RunStatus,
    startedAt: r.started_at as number,
    completedAt: (r.completed_at as number | null) ?? null,
  }
}
function rowToEvent(r: Record<string, unknown>): AgentEvent {
  return {
    id: r.id as string,
    sessionId: r.session_id as string,
    turnId: r.turn_id as string,
    kind: r.kind as AgentEvent['kind'],
    title: (r.title as string | null) ?? undefined,
    body: (r.body as string | null) ?? undefined,
    file: (r.file as string | null) ?? undefined,
    createdAt: r.created_at as number,
  }
}
