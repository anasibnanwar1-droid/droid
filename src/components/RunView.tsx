import { useState } from 'react'
import type { StepKind, TimelineItem } from '../data'
import { timeline } from '../data'
import { ArrowUp, ChevronDown, ChevronRight, GitBranch } from '../icons'

const stepMeta: Record<StepKind, { label: string; color: string }> = {
  plan: { label: 'Plan', color: 'text-step-plan' },
  edit: { label: 'Edit', color: 'text-step-edit' },
  run: { label: 'Run', color: 'text-step-run' },
  review: { label: 'Review', color: 'text-step-review' },
  search: { label: 'Search', color: 'text-step-search' },
}

function CodeBlock({ lang, lines }: { lang: string; lines: string[] }) {
  return (
    <div className="mt-2.5 overflow-hidden rounded-lg border border-line bg-bg">
      <div className="flex items-center justify-between border-b border-line-soft px-3 py-1.5">
        <span className="font-mono text-[10.5px] uppercase tracking-wider text-ink-muted">{lang}</span>
      </div>
      <pre className="overflow-x-auto px-3 py-2.5">
        <code className="font-mono text-[12px] leading-relaxed text-ink-soft">
          {lines.map((l, i) => (
            <div key={i} className={l.startsWith('$') ? 'text-step-run' : undefined}>
              {l}
            </div>
          ))}
        </code>
      </pre>
    </div>
  )
}

function UserMessage({ item }: { item: TimelineItem }) {
  return (
    <div className="animate-fade-up">
      <div className="mb-1.5 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-3 text-[11px] font-semibold text-ink-soft">
          A
        </div>
        <span className="text-[12.5px] font-semibold text-ink">{item.title}</span>
        <span className="text-[11px] text-ink-faint">{item.time}</span>
      </div>
      <div className="ml-8 rounded-xl rounded-tl-sm border border-line bg-surface px-3.5 py-2.5 text-[13.5px] leading-relaxed text-ink-soft">
        {item.body}
      </div>
    </div>
  )
}

function AgentStep({ item }: { item: TimelineItem }) {
  const meta = item.kind ? stepMeta[item.kind] : null
  const [open, setOpen] = useState(!item.collapsedByDefault)
  const hasDetail = Boolean(item.code)

  return (
    <div className="animate-fade-up">
      <div className="flex gap-3">
        {/* rail */}
        <div className="flex flex-col items-center pt-1">
          <span className={`h-2.5 w-2.5 rounded-full ${meta?.color ?? 'text-accent'}`} style={{ background: 'currentColor' }} />
          <span className="mt-1 w-px flex-1 bg-line" />
        </div>
        {/* content */}
        <div className="flex-1 pb-5">
          <div className="flex items-center gap-2">
            {meta && (
              <span className={`text-[11px] font-semibold uppercase tracking-wide ${meta.color}`}>{meta.label}</span>
            )}
            <span className="text-[13px] font-medium text-ink">{item.title}</span>
            <span className="text-[11px] text-ink-faint">{item.time}</span>
          </div>
          {item.body && <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{item.body}</p>}

          {item.diff && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-1">
              <span className="font-mono text-[11.5px] text-ink-soft">{item.diff.file}</span>
              <span className="font-mono text-[11px] text-success">+{item.diff.added}</span>
              <span className="font-mono text-[11px] text-error">−{item.diff.removed}</span>
            </div>
          )}

          {hasDetail && (
            <>
              {item.collapsedByDefault && (
                <button
                  onClick={() => setOpen((v) => !v)}
                  className="mt-2 flex items-center gap-1 text-[12px] text-ink-muted transition-colors hover:text-ink"
                >
                  {open ? <ChevronDown width={14} height={14} /> : <ChevronRight width={14} height={14} />}
                  {open ? 'Hide output' : 'Show output'}
                </button>
              )}
              {open && item.code && <CodeBlock lang={item.code.lang} lines={item.code.lines} />}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function WorkingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center pt-1">
        <span className="h-2.5 w-2.5 rounded-full bg-accent animate-pulse-ring" />
      </div>
      <div className="flex items-center gap-2 pt-0.5">
        <span className="text-[13px] font-medium text-ink">Persisting tokens via existing store</span>
        <span className="flex gap-0.5">
          <span className="h-1 w-1 animate-caret rounded-full bg-accent" />
        </span>
      </div>
    </div>
  )
}

function ModePill({ mode }: { mode: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-line bg-surface px-2 py-0.5 text-[11px] font-medium text-ink-soft">
      <span className="h-1.5 w-1.5 rounded-full bg-info" />
      {mode}
    </span>
  )
}

export default function RunView() {
  return (
    <main className="flex h-full min-w-0 flex-1 flex-col bg-bg">
      {/* Run header */}
      <header className="flex items-center gap-3 border-b border-line-soft px-6 py-3.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-[15px] font-semibold text-ink">Add OAuth device-flow login</h1>
            <span className="inline-flex items-center gap-1 rounded-md bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-running animate-pulse" />
              Running
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-[12px] text-ink-muted">
            <span className="font-mono">droid/api</span>
            <span className="text-ink-faint">·</span>
            <span className="inline-flex items-center gap-1 font-mono">
              <GitBranch width={13} height={13} />
              feat/device-flow
            </span>
          </div>
        </div>
        <ModePill mode="Cloud" />
        <button className="rounded-lg border border-line bg-surface px-3 py-1.5 text-[12.5px] font-medium text-ink-soft transition-colors hover:border-line-strong hover:text-ink">
          Open diff
        </button>
        <button className="rounded-lg bg-surface-2 px-3 py-1.5 text-[12.5px] font-medium text-ink transition-colors hover:bg-surface-3">
          Pause
        </button>
      </header>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="mx-auto max-w-3xl space-y-5">
          {timeline.map((item) =>
            item.role === 'user' ? <UserMessage key={item.id} item={item} /> : <AgentStep key={item.id} item={item} />,
          )}
          <WorkingIndicator />
        </div>
      </div>

      {/* Composer */}
      <div className="px-6 pb-5">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-line bg-surface p-2.5 transition-colors focus-within:border-line-strong">
            <textarea
              rows={1}
              placeholder="Steer the agent, add context, or queue a follow-up…"
              className="block w-full resize-none bg-transparent px-2 py-1 text-[13.5px] text-ink placeholder:text-ink-faint focus:outline-none"
            />
            <div className="flex items-center justify-between pt-1.5">
              <div className="flex items-center gap-1.5">
                <button className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium text-ink-soft transition-colors hover:bg-surface-2">
                  Claude Sonnet 4.6
                  <ChevronDown width={13} height={13} className="text-ink-muted" />
                </button>
                <button className="rounded-md px-2 py-1 text-[12px] font-medium text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink">
                  Cloud
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden items-center gap-1 font-mono text-[11px] text-ink-faint sm:flex">
                  ⌘ + ↵ to send
                </span>
                <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-ink transition-colors hover:bg-accent-hover">
                  <ArrowUp width={17} height={17} strokeWidth={2.2} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
