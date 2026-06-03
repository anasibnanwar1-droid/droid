import { useState } from 'react'
import { store, useStore } from '../client/store'

const SUGGESTIONS = [
  'Polish the dashboard UI',
  'Add unit tests for the parser',
  'Fix the failing build',
  'Refactor the auth module',
]

export function NewTaskModal({ onClose }: { onClose: () => void }) {
  const activeProjectId = useStore((s) => s.activeProjectId)
  const projects = useStore((s) => s.projects)
  const [prompt, setPrompt] = useState('')
  const project = projects.find((p) => p.id === activeProjectId)

  const start = () => {
    const text = prompt.trim()
    if (!text || !activeProjectId) return
    const title = text.length > 60 ? text.slice(0, 57) + '…' : text
    store.createSession(activeProjectId, title, text)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[18vh]" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-[var(--color-line-strong)] bg-[var(--color-surface)] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-[15px] font-medium text-[var(--color-ink)]">New task</h2>
        <p className="mt-0.5 text-[12px] text-[var(--color-ink-muted)]">
          Delegating to Factory Droid in{' '}
          <span className="font-mono text-[var(--color-ink-soft)]">{project?.name ?? 'no project'}</span>
        </p>
        <textarea
          autoFocus
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) start()
            if (e.key === 'Escape') onClose()
          }}
          rows={4}
          placeholder="Describe the task — e.g. “add a dark-mode toggle to settings”"
          className="mt-3 w-full resize-none rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] px-3 py-2.5 text-sm leading-relaxed text-[var(--color-ink)] outline-none transition-colors focus:border-[var(--color-accent)] placeholder:text-[var(--color-ink-faint)]"
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setPrompt(s)}
              className="rounded-full border border-[var(--color-line)] px-2.5 py-1 text-[11.5px] text-[var(--color-ink-muted)] transition-colors hover:border-[var(--color-line-strong)] hover:text-[var(--color-ink-soft)]"
            >
              {s}
            </button>
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-[var(--radius)] px-3 py-2 text-[13px] text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-ink)]"
          >
            Cancel
          </button>
          <button
            onClick={start}
            disabled={!prompt.trim() || !activeProjectId}
            className="rounded-[var(--radius)] bg-[var(--color-accent)] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-30"
          >
            Start task
          </button>
        </div>
      </div>
    </div>
  )
}
