import { store, useStore } from '../client/store'
import { statusMeta, timeAgo } from '../lib/ui'
import { Folder, Plus, ChevronDown } from '../icons'

export function Sidebar({ onNewTask, onOpenSettings }: { onNewTask: () => void; onOpenSettings: () => void }) {
  const projects = useStore((s) => s.projects)
  const activeProjectId = useStore((s) => s.activeProjectId)
  const sessionsByProject = useStore((s) => s.sessionsByProject)
  const activeSessionId = useStore((s) => s.activeSessionId)
  const connected = useStore((s) => s.connected)

  const project = projects.find((p) => p.id === activeProjectId) ?? null
  const sessions = activeProjectId ? sessionsByProject[activeProjectId] ?? [] : []

  return (
    <aside className="flex h-full w-[272px] shrink-0 flex-col border-r border-[var(--color-line)] bg-[var(--color-surface)]">
      {/* project switcher */}
      <div className="app-no-drag px-3 pt-3">
        <label className="mb-1 block px-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
          Project
        </label>
        <div className="relative">
          <Folder className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]" />
          <select
            value={activeProjectId ?? ''}
            onChange={(e) => store.selectProject(e.target.value)}
            className="w-full appearance-none rounded-[var(--radius)] border border-[var(--color-line)] bg-[var(--color-surface-2)] py-2 pl-8 pr-8 text-sm text-[var(--color-ink)] outline-none transition-colors hover:border-[var(--color-line-strong)] focus:border-[var(--color-accent)]"
          >
            {projects.length === 0 && <option value="">No projects</option>}
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]" />
        </div>
        {project && (
          <p className="mt-1 truncate px-1 font-mono text-[11px] text-[var(--color-ink-faint)]" title={project.path}>
            {project.path}
          </p>
        )}
      </div>

      {/* New task — prominent, single primary action */}
      <div className="app-no-drag px-3 pb-2 pt-3">
        <button
          onClick={onNewTask}
          disabled={!project}
          className="flex w-full items-center justify-center gap-2 rounded-[var(--radius)] bg-[var(--color-accent)] py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus width={15} height={15} />
          New task
        </button>
      </div>

      {/* sessions */}
      <div className="mt-1 flex min-h-0 flex-1 flex-col">
        <div className="px-4 pb-1 pt-2 text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
          Sessions
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          {sessions.length === 0 ? (
            <p className="px-2 py-6 text-center text-[13px] leading-relaxed text-[var(--color-ink-faint)]">
              No sessions yet.
              <br />
              Create a task to get started.
            </p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {sessions.map((s) => {
                const meta = statusMeta[s.status]
                const active = s.id === activeSessionId
                return (
                  <li key={s.id}>
                    <button
                      onClick={() => store.openSession(s.id)}
                      className={`app-no-drag group flex w-full flex-col gap-1 rounded-[var(--radius)] px-2.5 py-2 text-left transition-colors ${
                        active ? 'bg-[var(--color-surface-3)]' : 'hover:bg-[var(--color-surface-2)]'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`truncate text-[13px] ${active ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-soft)]'}`}
                        >
                          {s.title}
                        </span>
                      </span>
                      <span className="flex items-center gap-1.5 text-[11px] text-[var(--color-ink-faint)]">
                        <span
                          className="rounded-full"
                          style={{ width: 7, height: 7, border: `1.5px solid ${meta.dot}` }}
                        />
                        <span style={{ color: meta.color }}>{meta.label}</span>
                        <span className="text-[var(--color-ink-faint)]">· {timeAgo(s.updatedAt)}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {/* footer */}
      <div className="app-no-drag flex items-center justify-between border-t border-[var(--color-line)] px-3 py-2.5">
        <button
          onClick={onOpenSettings}
          className="text-[13px] text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-ink)]"
        >
          Settings
        </button>
        <span className="flex items-center gap-1.5 text-[11px] text-[var(--color-ink-faint)]">
          <span
            className="rounded-full"
            style={{
              width: 7,
              height: 7,
              border: `1.5px solid ${connected ? 'var(--color-success)' : 'var(--color-error)'}`,
            }}
          />
          {connected ? 'Connected' : 'Offline'}
        </span>
      </div>
    </aside>
  )
}
