import { useState } from 'react'
import { tasks, changedFiles } from '../data'
import { Check, PanelRight, Terminal } from '../icons'

type Tab = 'tasks' | 'changes'

function TaskItem({ label, done, active }: { label: string; done: boolean; active?: boolean }) {
  return (
    <div className={`flex items-start gap-2.5 rounded-lg px-2 py-1.5 ${active ? 'bg-surface-2' : ''}`}>
      <span
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border ${
          done ? 'border-success bg-success text-bg' : active ? 'border-running' : 'border-line-strong'
        }`}
      >
        {done && <Check width={11} height={11} strokeWidth={3} />}
        {active && !done && <span className="h-1.5 w-1.5 rounded-full bg-running animate-pulse" />}
      </span>
      <span
        className={`text-[12.5px] leading-snug ${
          done ? 'text-ink-muted line-through decoration-line-strong' : active ? 'text-ink' : 'text-ink-soft'
        }`}
      >
        {label}
      </span>
    </div>
  )
}

export default function TaskPanel() {
  const [tab, setTab] = useState<Tab>('tasks')
  const done = tasks.filter((t) => t.done).length
  const totalAdded = changedFiles.reduce((a, f) => a + f.added, 0)
  const totalRemoved = changedFiles.reduce((a, f) => a + f.removed, 0)

  return (
    <aside className="flex h-full w-[300px] shrink-0 flex-col border-l border-line-soft bg-surface">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <div className="flex items-center gap-1 rounded-lg bg-surface-2 p-0.5">
          <button
            onClick={() => setTab('tasks')}
            className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
              tab === 'tasks' ? 'bg-elevated text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
            }`}
          >
            Tasks
          </button>
          <button
            onClick={() => setTab('changes')}
            className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
              tab === 'changes' ? 'bg-elevated text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
            }`}
          >
            Changes
          </button>
        </div>
        <button className="flex h-7 w-7 items-center justify-center rounded-md text-ink-muted hover:bg-surface-2 hover:text-ink">
          <PanelRight width={16} height={16} />
        </button>
      </div>

      {tab === 'tasks' ? (
        <>
          <div className="px-4 pb-3 pt-1">
            <div className="mb-1.5 flex items-center justify-between text-[11.5px]">
              <span className="text-ink-muted">Progress</span>
              <span className="font-medium tabular-nums text-ink-soft">
                {done}/{tasks.length}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${(done / tasks.length) * 100}%` }}
              />
            </div>
          </div>
          <div className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
            {tasks.map((t) => (
              <TaskItem key={t.id} label={t.label} done={t.done} active={t.active} />
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 px-4 pb-3 pt-1 text-[11.5px]">
            <span className="text-ink-muted">{changedFiles.length} files</span>
            <span className="text-ink-faint">·</span>
            <span className="font-mono text-success">+{totalAdded}</span>
            <span className="font-mono text-error">−{totalRemoved}</span>
          </div>
          <div className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
            {changedFiles.map((f) => {
              const parts = f.path.split('/')
              const name = parts.pop()
              return (
                <button
                  key={f.path}
                  className="group flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-surface-2"
                >
                  <span className="min-w-0 flex-1 truncate font-mono text-[12px]">
                    <span className="text-ink-faint">{parts.join('/')}/</span>
                    <span className="text-ink-soft group-hover:text-ink">{name}</span>
                  </span>
                  <span className="font-mono text-[11px] text-success">+{f.added}</span>
                  <span className="font-mono text-[11px] text-error">−{f.removed}</span>
                </button>
              )
            })}
          </div>
        </>
      )}

      {/* Environment footer */}
      <div className="border-t border-line-soft px-4 py-3">
        <div className="flex items-center gap-2 text-[11.5px] text-ink-muted">
          <Terminal width={14} height={14} className="text-step-run" />
          <span className="font-mono">cloud · ubuntu-24.04 · node 22</span>
        </div>
      </div>
    </aside>
  )
}
