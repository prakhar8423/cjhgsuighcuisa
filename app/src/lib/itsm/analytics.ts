import { differenceInMinutes, format, subDays } from 'date-fns'
import type { Priority, Status, Ticket } from './types'
import { STATUSES } from './types'
import { computeSla } from './sla'
import { SLA_POLICIES } from './seed-static'
import { STATUS_META } from './meta'

const OPEN_STATUSES = new Set<Status>(['open', 'in_progress', 'on_hold'])
const policyMap = new Map(SLA_POLICIES.map((p) => [p.id, p]))

export function isOpen(t: Ticket): boolean {
  return OPEN_STATUSES.has(t.status)
}

export function slaOf(t: Ticket, now: number) {
  return computeSla(t, policyMap.get(t.slaPolicyId), now)
}

export interface Kpis {
  open: number
  breachingSoon: number
  unassigned: number
  resolvedToday: number
}

export function computeKpis(tickets: Ticket[], now: number): Kpis {
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const todayMs = startOfToday.getTime()
  let open = 0
  let breachingSoon = 0
  let unassigned = 0
  let resolvedToday = 0
  for (const t of tickets) {
    if (isOpen(t)) {
      open += 1
      if (!t.assigneeId) unassigned += 1
      const s = slaOf(t, now).state
      if (s === 'at_risk' || s === 'breached') breachingSoon += 1
    }
    if (t.resolvedAt && new Date(t.resolvedAt).getTime() >= todayMs) resolvedToday += 1
  }
  return { open, breachingSoon, unassigned, resolvedToday }
}

export function countByStatus(tickets: Ticket[]) {
  return STATUSES.map((status) => ({
    status,
    label: STATUS_META[status].label,
    count: tickets.filter((t) => t.status === status).length,
    fill: STATUS_META[status].fill,
  }))
}

export function countByPriority(tickets: Ticket[]) {
  const order: Priority[] = ['critical', 'high', 'medium', 'low']
  return order.map((priority) => ({
    priority,
    count: tickets.filter((t) => isOpen(t) && t.priority === priority).length,
  }))
}

export function resolutionTrend(tickets: Ticket[], days: number) {
  const buckets: { date: string; resolved: number; created: number }[] = []
  for (let i = days - 1; i >= 0; i -= 1) {
    const day = subDays(new Date(), i)
    const key = format(day, 'MMM d')
    const dayStart = new Date(day).setHours(0, 0, 0, 0)
    const dayEnd = dayStart + 86_400_000
    const resolved = tickets.filter(
      (t) => t.resolvedAt && new Date(t.resolvedAt).getTime() >= dayStart && new Date(t.resolvedAt).getTime() < dayEnd,
    ).length
    const created = tickets.filter(
      (t) => new Date(t.createdAt).getTime() >= dayStart && new Date(t.createdAt).getTime() < dayEnd,
    ).length
    buckets.push({ date: key, resolved, created })
  }
  return buckets
}

export function avgResolutionMins(tickets: Ticket[]): number {
  const resolved = tickets.filter((t) => t.resolvedAt)
  if (resolved.length === 0) return 0
  const total = resolved.reduce(
    (sum, t) => sum + differenceInMinutes(new Date(t.resolvedAt as string), new Date(t.createdAt)),
    0,
  )
  return Math.round(total / resolved.length)
}

export function slaComplianceRate(tickets: Ticket[], now: number): number {
  const closed = tickets.filter((t) => t.resolvedAt)
  if (closed.length === 0) return 100
  const met = closed.filter((t) => slaOf(t, now).state === 'met').length
  return Math.round((met / closed.length) * 100)
}

export function volumeByCategory(tickets: Ticket[], categories: string[]) {
  return categories.map((name) => ({
    category: name,
    count: tickets.filter((t) => t.category === name).length,
  }))
}

export function workloadByAgent(
  tickets: Ticket[],
  agents: { id: string; name: string; avatarInitials: string }[],
) {
  return agents
    .map((a) => ({
      ...a,
      openCount: tickets.filter((t) => t.assigneeId === a.id && isOpen(t)).length,
    }))
    .sort((x, y) => y.openCount - x.openCount)
}

export function withinRange(tickets: Ticket[], days: number): Ticket[] {
  const cutoff = subDays(new Date(), days).getTime()
  return tickets.filter((t) => new Date(t.createdAt).getTime() >= cutoff)
}

export interface AgentPerformance {
  id: string
  name: string
  avatarInitials: string
  role: 'agent' | 'lead'
  resolved: number
  openCount: number
  avgResolutionMins: number
  slaCompliance: number
  score: number
}

// Composite performance score (0-100): SLA compliance weighted heaviest,
// then resolution volume (relative to the top performer) and speed.
export function agentPerformance(
  tickets: Ticket[],
  agents: { id: string; name: string; avatarInitials: string; role: 'agent' | 'lead' }[],
  now: number,
): AgentPerformance[] {
  const rows = agents.map((a) => {
    const assigned = tickets.filter((t) => t.assigneeId === a.id)
    const resolvedTickets = assigned.filter((t) => t.resolvedAt)
    return {
      id: a.id,
      name: a.name,
      avatarInitials: a.avatarInitials,
      role: a.role,
      resolved: resolvedTickets.length,
      openCount: assigned.filter((t) => isOpen(t)).length,
      avgResolutionMins: avgResolutionMins(resolvedTickets),
      slaCompliance: slaComplianceRate(resolvedTickets, now),
    }
  })

  const maxResolved = Math.max(1, ...rows.map((r) => r.resolved))
  const maxAvg = Math.max(1, ...rows.map((r) => r.avgResolutionMins))

  return rows
    .map((r) => {
      const volumeScore = (r.resolved / maxResolved) * 100
      const speedScore = r.avgResolutionMins === 0 ? 0 : (1 - r.avgResolutionMins / maxAvg) * 100
      const score = Math.round(r.slaCompliance * 0.5 + volumeScore * 0.3 + speedScore * 0.2)
      return { ...r, score }
    })
    .sort((x, y) => y.score - x.score)
}
