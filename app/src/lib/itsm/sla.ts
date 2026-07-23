import type { SlaPolicy, SlaState, Ticket } from './types'

const AT_RISK_THRESHOLD = 0.25

// Terminal statuses no longer accrue SLA time.
const RESOLVED_STATUSES = new Set(['resolved', 'closed'])

export interface SlaInfo {
  state: SlaState
  dueAt: number
  remainingMs: number
  ratioRemaining: number
}

export function computeSla(
  ticket: Ticket,
  policy: SlaPolicy | undefined,
  now: number,
): SlaInfo {
  const created = new Date(ticket.createdAt).getTime()
  const resolutionMs = (policy?.resolutionMins ?? 8 * 60) * 60_000
  const dueAt = created + resolutionMs

  if (RESOLVED_STATUSES.has(ticket.status)) {
    const closedAt = ticket.resolvedAt ? new Date(ticket.resolvedAt).getTime() : now
    const met = closedAt <= dueAt
    return {
      state: met ? 'met' : 'breached',
      dueAt,
      remainingMs: dueAt - closedAt,
      ratioRemaining: 0,
    }
  }

  const remainingMs = dueAt - now
  const ratioRemaining = remainingMs / resolutionMs
  let state: SlaState = 'on_track'
  if (remainingMs <= 0) state = 'breached'
  else if (ratioRemaining <= AT_RISK_THRESHOLD) state = 'at_risk'

  return { state, dueAt, remainingMs, ratioRemaining }
}

export function formatDuration(ms: number): string {
  const abs = Math.abs(ms)
  const totalMins = Math.floor(abs / 60_000)
  const days = Math.floor(totalMins / (60 * 24))
  const hours = Math.floor((totalMins % (60 * 24)) / 60)
  const mins = totalMins % 60
  const parts: string[] = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (days === 0) parts.push(`${mins}m`)
  return parts.join(' ')
}

export function formatSlaTimer(info: SlaInfo): string {
  if (info.state === 'met') return 'Met'
  if (info.state === 'breached') return `${formatDuration(info.remainingMs)} over`
  return `${formatDuration(info.remainingMs)} left`
}
