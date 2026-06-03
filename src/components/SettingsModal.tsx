import { useState } from 'react'
import { store, useStore } from '../client/store'
import { Check } from '../icons'

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const providers = useStore((s) => s.providers)
  const projects = useStore((s) => s.projects)
  const error = useStore((s) => s.error)
  const [path, setPath] = useState('')

  const addProject = () => {
    const p = path.trim()
    if (!p) return
    store.send({ type: 'projects.add', path: p })
    setPath('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[12vh]" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-[var(--color-line-strong)] bg-[var(--color-surface)] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-medium text-[var(--color-ink)]">Settings</h2>
          <button onClick={onClose} className="text-[13px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
            Close
          </button>
        </div>

        {/* providers */}
        <section className="mt-4">
          <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
            Agent providers
          </h3>
          <ul className="mt-2 flex flex-col gap-1.5">
            {providers.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-[var(--radius)] border border-[var(--color-line)] bg-[var(--color-surface-2)] px-3 py-2"
              >
                <div>
                  <p className="text-[13px] text-[var(--color-ink)]">{p.displayName}</p>
                  {p.detail && <p className="text-[11px] text-[var(--color-ink-faint)]">{p.detail}</p>}
                </div>
                <span
                  className="flex items-center gap-1.5 text-[11.5px]"
                  style={{ color: p.available ? 'var(--color-success)' : 'var(--color-ink-faint)' }}
                >
                  <span
                    className="rounded-full"
                    style={{
                      width: 7,
                      height: 7,
                      border: `1.5px solid ${p.available ? 'var(--color-success)' : 'var(--color-ink-faint)'}`,
                    }}
                  />
                  {p.available ? 'Available' : 'Not found'}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] leading-relaxed text-[var(--color-ink-faint)]">
            Log in once with <span className="font-mono">droid</span> in your terminal — DROID never stores Factory API
            keys. Without the CLI, the built-in simulator runs so you can try the full flow.
          </p>
        </section>

        {/* add project */}
        <section className="mt-5">
          <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
            Add project
          </h3>
          <div className="mt-2 flex gap-2">
            <input
              value={path}
              onChange={(e) => setPath(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addProject()}
              placeholder="/absolute/path/to/git/repo"
              className="flex-1 rounded-[var(--radius)] border border-[var(--color-line)] bg-[var(--color-surface-2)] px-3 py-2 font-mono text-[12px] text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)] placeholder:text-[var(--color-ink-faint)]"
            />
            <button
              onClick={addProject}
              className="flex items-center gap-1.5 rounded-[var(--radius)] bg-[var(--color-accent)] px-3 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
            >
              <Check width={14} height={14} />
              Add
            </button>
          </div>
          {error && <p className="mt-1.5 text-[11.5px] text-[var(--color-error)]">{error}</p>}
          <ul className="mt-2 flex flex-col gap-1">
            {projects.map((p) => (
              <li key={p.id} className="truncate font-mono text-[11.5px] text-[var(--color-ink-muted)]" title={p.path}>
                {p.name} — {p.path}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
