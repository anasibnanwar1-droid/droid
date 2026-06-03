import type { EventKind, RunStatus } from '../../shared/protocol'

export const statusMeta: Record<RunStatus, { label: string; color: string; dot: string }> = {
  queued: { label: 'Queued', color: 'var(--color-queued)', dot: 'var(--color-queued)' },
  running: { label: 'Running', color: 'var(--color-running)', dot: 'var(--color-running)' },
  review: { label: 'Needs review', color: 'var(--color-step-review)', dot: 'var(--color-step-review)' },
  done: { label: 'Accepted', color: 'var(--color-success)', dot: 'var(--color-success)' },
  reverted: { label: 'Reverted', color: 'var(--color-ink-muted)', dot: 'var(--color-ink-muted)' },
  error: { label: 'Error', color: 'var(--color-error)', dot: 'var(--color-error)' },
}

export const eventMeta: Record<EventKind, { label: string; color: string }> = {
  status: { label: 'Status', color: 'var(--color-ink-muted)' },
  message: { label: 'Droid', color: 'var(--color-ink-soft)' },
  plan: { label: 'Planned', color: 'var(--color-step-plan)' },
  search: { label: 'Explored', color: 'var(--color-step-search)' },
  tool: { label: 'Tool', color: 'var(--color-step-edit)' },
  edit: { label: 'Edited files', color: 'var(--color-step-edit)' },
  command: { label: 'Ran command', color: 'var(--color-step-run)' },
  stdout: { label: 'Output', color: 'var(--color-ink-muted)' },
  stderr: { label: 'stderr', color: 'var(--color-error)' },
  completed: { label: 'Completed', color: 'var(--color-success)' },
  error: { label: 'Error', color: 'var(--color-error)' },
}

export function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}
