import { useEffect, useState } from 'react'
import { store, useStore } from '../client/store'
import { Check, FileText, Undo } from '../icons'
import type { DiffFile } from '../../shared/protocol'

export function ReviewPane() {
  const session = useStore((s) => s.session)
  const diffFiles = useStore((s) => s.diffFiles)
  const fileDiffs = useStore((s) => s.fileDiffs)
  const [selected, setSelected] = useState<string | null>(null)

  // The shown file is the user's pick, falling back to the first changed file.
  const shown = selected ?? diffFiles[0]?.path ?? null

  // Refresh the diff whenever the open session changes (this component is keyed
  // by session id, so it remounts and `selected` resets to null naturally).
  useEffect(() => {
    if (session) store.send({ type: 'review.diff', sessionId: session.id })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Lazily fetch the patch for whichever file is shown (no setState here).
  useEffect(() => {
    if (shown && session && !fileDiffs[shown]) store.send({ type: 'review.file', sessionId: session.id, path: shown })
  }, [shown, session, fileDiffs])

  if (!session) return <aside className="hidden w-[360px] shrink-0 border-l border-[var(--color-line)] xl:block" />

  const reviewable = session.status === 'review'
  const totals = diffFiles.reduce((a, f) => ({ added: a.added + f.added, removed: a.removed + f.removed }), {
    added: 0,
    removed: 0,
  })

  const openFile = (path: string) => setSelected(path)

  return (
    <aside className="flex h-full w-[360px] shrink-0 flex-col border-l border-[var(--color-line)] bg-[var(--color-surface)]">
      <header className="flex items-center justify-between border-b border-[var(--color-line)] px-4 py-3">
        <div>
          <h2 className="text-[13px] font-medium text-[var(--color-ink)]">Review changes</h2>
          <p className="text-[11px] text-[var(--color-ink-faint)]">
            {diffFiles.length} file{diffFiles.length === 1 ? '' : 's'}
            {diffFiles.length > 0 && (
              <>
                {' · '}
                <span className="text-[var(--color-success)]">+{totals.added}</span>{' '}
                <span className="text-[var(--color-error)]">−{totals.removed}</span>
              </>
            )}
          </p>
        </div>
      </header>

      {diffFiles.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-6 text-center">
          <p className="text-[12.5px] leading-relaxed text-[var(--color-ink-faint)]">
            {session.status === 'done'
              ? 'Changes accepted and committed.'
              : session.status === 'reverted'
                ? 'Changes were reverted.'
                : 'No file changes yet. They’ll appear here once Droid edits files.'}
          </p>
        </div>
      ) : (
        <>
          {/* file list */}
          <ul className="max-h-[40%] overflow-y-auto border-b border-[var(--color-line)] px-2 py-2">
            {diffFiles.map((f) => (
              <FileRow key={f.path} file={f} active={f.path === shown} onClick={() => openFile(f.path)} />
            ))}
          </ul>
          {/* diff viewer */}
          <div className="min-h-0 flex-1 overflow-auto bg-[var(--color-bg)]">
            {shown && fileDiffs[shown] ? (
              <DiffView patch={fileDiffs[shown]} />
            ) : (
              <p className="px-4 py-4 text-[12px] text-[var(--color-ink-faint)]">Select a file to view its diff.</p>
            )}
          </div>
        </>
      )}

      {/* actions */}
      <div className="border-t border-[var(--color-line)] p-3">
        <div className="flex gap-2">
          <button
            onClick={() => store.send({ type: 'review.accept', sessionId: session.id })}
            disabled={!reviewable || diffFiles.length === 0}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius)] bg-[var(--color-accent)] py-2 text-[13px] font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Check width={14} height={14} />
            Accept
          </button>
          <button
            onClick={() => store.send({ type: 'review.revert', sessionId: session.id })}
            disabled={!reviewable || diffFiles.length === 0}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[var(--color-line-strong)] py-2 text-[13px] font-medium text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Undo width={14} height={14} />
            Revert
          </button>
        </div>
        <p className="mt-2 px-0.5 text-[11px] leading-relaxed text-[var(--color-ink-faint)]">
          Accept commits the diff. Revert restores the checkpoint. To revise, ask Droid in the composer.
        </p>
      </div>
    </aside>
  )
}

function FileRow({ file, active, onClick }: { file: DiffFile; active: boolean; onClick: () => void }) {
  const tag = { added: 'A', modified: 'M', deleted: 'D' }[file.status]
  const tagColor = { added: 'var(--color-success)', modified: 'var(--color-running)', deleted: 'var(--color-error)' }[
    file.status
  ]
  return (
    <li>
      <button
        onClick={onClick}
        className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors ${
          active ? 'bg-[var(--color-surface-3)]' : 'hover:bg-[var(--color-surface-2)]'
        }`}
      >
        <span className="font-mono text-[11px] font-semibold" style={{ color: tagColor }}>
          {tag}
        </span>
        <FileText width={13} height={13} className="shrink-0 text-[var(--color-ink-faint)]" />
        <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-[var(--color-ink-soft)]" title={file.path}>
          {file.path}
        </span>
        <span className="shrink-0 font-mono text-[10.5px]">
          <span className="text-[var(--color-success)]">+{file.added}</span>{' '}
          <span className="text-[var(--color-error)]">−{file.removed}</span>
        </span>
      </button>
    </li>
  )
}

function DiffView({ patch }: { patch: string }) {
  const lines = patch.split('\n')
  return (
    <pre className="px-3 py-2 font-mono text-[11.5px] leading-[1.55]">
      {lines.map((line, i) => {
        let color = 'var(--color-ink-muted)'
        let bg = 'transparent'
        if (line.startsWith('+') && !line.startsWith('+++')) {
          color = 'var(--color-success)'
          bg = 'rgba(93, 214, 160, 0.07)'
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          color = 'var(--color-error)'
          bg = 'rgba(240, 114, 106, 0.07)'
        } else if (line.startsWith('@@')) {
          color = 'var(--color-info)'
        } else if (line.startsWith('diff ') || line.startsWith('index ') || line.startsWith('+++') || line.startsWith('---')) {
          color = 'var(--color-ink-faint)'
        }
        return (
          <div key={i} style={{ color, background: bg }} className="whitespace-pre-wrap px-1">
            {line || ' '}
          </div>
        )
      })}
    </pre>
  )
}
