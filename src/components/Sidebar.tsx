import type { RunStatus, Session } from '../data'
import { sessions } from '../data'
import { Plus, Search, Layers, Settings } from '../icons'

const statusColor: Record<RunStatus, string> = {
  running: 'text-running',
  review: 'text-info',
  done: 'text-success',
  queued: 'text-queued',
  error: 'text-error',
}

const statusLabel: Record<RunStatus, string> = {
  running: 'Running',
  review: 'Needs review',
  done: 'Done',
  queued: 'Queued',
  error: 'Failed',
}

function StatusDot({ status }: { status: RunStatus }) {
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      {status === 'running' && (
        <span className="absolute inline-flex h-full w-full rounded-full bg-running opacity-60 animate-ping" />
      )}
      <span className={`relative inline-flex h-2 w-2 rounded-full ${statusColor[status]}`} style={{ background: 'currentColor' }} />
    </span>
  )
}

function SessionRow({ session, active }: { session: Session; active: boolean }) {
  return (
    <button
      className={`group w-full rounded-lg px-2.5 py-2 text-left transition-colors ${
        active ? 'bg-surface-3' : 'hover:bg-surface-2'
      }`}
    >
      <div className="flex items-center gap-2">
        <StatusDot status={session.status} />
        <span
          className={`flex-1 truncate text-[13px] font-medium ${
            active ? 'text-ink' : 'text-ink-soft group-hover:text-ink'
          }`}
        >
          {session.title}
        </span>
        <span className="text-[11px] tabular-nums text-ink-faint">{session.updated}</span>
      </div>
      <div className="mt-1 flex items-center gap-1.5 pl-4">
        <span className="truncate font-mono text-[11px] text-ink-muted">{session.repo}</span>
        <span className="text-ink-faint">·</span>
        <span className={`text-[11px] ${statusColor[session.status]}`}>{statusLabel[session.status]}</span>
      </div>
      {session.status === 'running' && session.progress != null && (
        <div className="mt-2 ml-4 h-[3px] overflow-hidden rounded-full bg-surface-3">
          <div
            className="h-full rounded-full bg-running transition-all"
            style={{ width: `${Math.round(session.progress * 100)}%` }}
          />
        </div>
      )}
    </button>
  )
}

export default function Sidebar({ activeId }: { activeId: string }) {
  return (
    <aside className="flex h-full w-[272px] shrink-0 flex-col border-r border-line-soft bg-surface">
      {/* Brand + workspace */}
      <div className="flex items-center gap-2.5 px-4 pb-3 pt-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-bg">
          <span className="text-[15px] font-bold leading-none">◆</span>
        </div>
        <div className="flex-1">
          <div className="text-[13px] font-semibold leading-tight text-ink">Forge</div>
          <div className="text-[11px] leading-tight text-ink-muted">anwar-labs</div>
        </div>
        <button className="flex h-6 w-6 items-center justify-center rounded text-ink-muted hover:bg-surface-2 hover:text-ink">
          <Search width={15} height={15} />
        </button>
      </div>

      {/* New run */}
      <div className="px-3 pb-3">
        <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-[13px] font-semibold text-bg transition-colors hover:bg-accent-hover">
          <Plus width={15} height={15} strokeWidth={2.2} />
          New run
        </button>
      </div>

      {/* Sessions */}
      <div className="flex items-center justify-between px-4 pb-1.5 pt-1">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
          <Layers width={13} height={13} />
          Sessions
        </div>
        <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-ink-muted">
          {sessions.length}
        </span>
      </div>

      <div className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
        {sessions.map((s) => (
          <SessionRow key={s.id} session={s} active={s.id === activeId} />
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2.5 border-t border-line-soft px-3 py-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-3 text-[12px] font-semibold text-ink-soft">
          A
        </div>
        <div className="flex-1 leading-tight">
          <div className="text-[12px] font-medium text-ink">Anas</div>
          <div className="text-[11px] text-ink-muted">Pro workspace</div>
        </div>
        <button className="flex h-7 w-7 items-center justify-center rounded-md text-ink-muted hover:bg-surface-2 hover:text-ink">
          <Settings width={16} height={16} />
        </button>
      </div>
    </aside>
  )
}
