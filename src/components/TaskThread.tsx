import { useEffect, useRef, useState } from 'react'
import { store, useStore } from '../client/store'
import { eventMeta, statusMeta } from '../lib/ui'
import { ArrowUp, Dot, Spinner, Stop } from '../icons'
import type { AgentEvent, Turn } from '../../shared/protocol'

export function TaskThread() {
  const session = useStore((s) => s.session)
  const turns = useStore((s) => s.turns)
  const events = useStore((s) => s.events)
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const running = session?.status === 'running' || session?.status === 'queued'

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [events.length, turns.length])

  if (!session) {
    return (
      <section className="flex min-w-0 flex-1 items-center justify-center">
        <div className="max-w-sm text-center">
          <h2 className="text-[15px] font-medium text-[var(--color-ink-soft)]">No task open</h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--color-ink-muted)]">
            Pick a session on the left, or start a new task to delegate work to Droid and review the result here.
          </p>
        </div>
      </section>
    )
  }

  const submit = () => {
    const text = draft.trim()
    if (!text || running) return
    store.send({ type: 'turn.create', sessionId: session.id, prompt: text })
    setDraft('')
  }

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-[var(--color-bg)]">
      {/* task header */}
      <header className="flex items-center justify-between border-b border-[var(--color-line)] px-6 py-3">
        <div className="min-w-0">
          <h1 className="truncate text-[15px] font-medium text-[var(--color-ink)]">{session.title}</h1>
          <p className="text-[11px] text-[var(--color-ink-faint)]">Fast Task · Factory Droid</p>
        </div>
        <StatusPill status={session.status} />
      </header>

      {/* timeline */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          {turns.map((turn) => (
            <TurnBlock key={turn.id} turn={turn} events={events.filter((e) => e.turnId === turn.id)} />
          ))}
          {running && <ThinkingRow />}
        </div>
      </div>

      {/* composer */}
      <div className="border-t border-[var(--color-line)] px-6 py-4">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-end gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] px-3 py-2 transition-colors focus-within:border-[var(--color-line-strong)]">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit()
              }}
              rows={1}
              placeholder={running ? 'Droid is working…' : 'Ask Droid to revise, or describe a follow-up…'}
              className="max-h-40 min-h-[24px] flex-1 resize-none bg-transparent py-1 text-sm leading-relaxed text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)]"
            />
            {running ? (
              <button
                onClick={() => store.send({ type: 'turn.cancel', sessionId: session.id })}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-3)] text-[var(--color-ink-soft)] transition-colors hover:text-[var(--color-error)]"
                title="Stop"
              >
                <Stop width={13} height={13} />
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={!draft.trim()}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent)] text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-30"
                title="Send (⌘↵)"
              >
                <ArrowUp width={15} height={15} />
              </button>
            )}
          </div>
          <p className="mt-1.5 px-1 text-[11px] text-[var(--color-ink-faint)]">⌘↵ to send · changes appear in the review pane</p>
        </div>
      </div>
    </section>
  )
}

function TurnBlock({ turn, events }: { turn: Turn; events: AgentEvent[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      {/* user prompt */}
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-[var(--color-surface-3)] px-3.5 py-2 text-[13px] leading-relaxed text-[var(--color-ink)]">
          {turn.prompt}
        </div>
      </div>
      {/* agent events */}
      <div className="flex flex-col gap-1.5">
        {events.map((e) => (
          <EventRow key={e.id} event={e} />
        ))}
      </div>
    </div>
  )
}

function EventRow({ event }: { event: AgentEvent }) {
  const meta = eventMeta[event.kind]
  const mono = event.kind === 'command' || event.kind === 'stdout' || event.kind === 'stderr'
  return (
    <div className="animate-fade-up flex gap-2.5">
      <div className="mt-1.5 flex w-3 shrink-0 justify-center">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-[12px] font-medium" style={{ color: meta.color }}>
          {event.title ?? meta.label}
        </span>
        {event.body && (
          <div
            className={
              mono
                ? 'mt-1 overflow-x-auto whitespace-pre-wrap rounded-md border border-[var(--color-line-soft)] bg-[var(--color-surface)] px-2.5 py-2 font-mono text-[11.5px] leading-relaxed text-[var(--color-ink-soft)]'
                : 'mt-0.5 whitespace-pre-wrap text-[12.5px] leading-relaxed text-[var(--color-ink-muted)]'
            }
          >
            {event.body}
          </div>
        )}
      </div>
    </div>
  )
}

function ThinkingRow() {
  return (
    <div className="flex items-center gap-2 px-1 py-1 text-[12px] text-[var(--color-ink-muted)]">
      <Spinner width={13} height={13} className="text-[var(--color-running)]" />
      Droid is working…
    </div>
  )
}

function StatusPill({ status }: { status: Turn['status'] }) {
  const meta = statusMeta[status]
  return (
    <span
      className="flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium"
      style={{ borderColor: 'var(--color-line)', color: meta.color }}
    >
      <Dot width={8} height={8} style={{ color: meta.dot }} />
      {meta.label}
    </span>
  )
}
