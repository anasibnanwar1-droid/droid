import { useState } from 'react'
import { useStore } from '../client/store'
import { ChevronDown, ChevronRight, Terminal } from '../icons'

// Secondary, collapsible raw log — terminal is NOT the primary surface.
export function LogsDrawer() {
  const [open, setOpen] = useState(false)
  const events = useStore((s) => s.events)
  const raw = events.filter((e) => e.kind === 'stdout' || e.kind === 'stderr' || e.kind === 'command')

  return (
    <div className="border-t border-[var(--color-line)] bg-[var(--color-surface)]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-6 py-2 text-[12px] text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-ink-soft)]"
      >
        {open ? <ChevronDown width={14} height={14} /> : <ChevronRight width={14} height={14} />}
        <Terminal width={14} height={14} />
        Raw log
        <span className="text-[var(--color-ink-faint)]">({raw.length})</span>
      </button>
      {open && (
        <div className="max-h-52 overflow-auto border-t border-[var(--color-line-soft)] bg-[var(--color-bg)] px-6 py-3">
          {raw.length === 0 ? (
            <p className="font-mono text-[11.5px] text-[var(--color-ink-faint)]">No raw output yet.</p>
          ) : (
            <pre className="whitespace-pre-wrap font-mono text-[11.5px] leading-relaxed text-[var(--color-ink-soft)]">
              {raw.map((e) => `${e.title ? `› ${e.title}\n` : ''}${e.body ?? ''}`).join('\n')}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
