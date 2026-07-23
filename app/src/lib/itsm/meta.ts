import type { Priority, Status, TicketType, SlaState } from './types'

// Status vocabulary. Colors expressed as oklch tokens (used via inline CSS custom
// props on the badge, never raw Tailwind color literals). Each status carries a
// distinct, semantically meaningful hue per the design system.
export const STATUS_META: Record<
  Status,
  { label: string; fill: string; on: string }
> = {
  open: { label: 'Open', fill: 'oklch(0.55 0.09 220)', on: 'oklch(0.99 0.01 220)' },
  in_progress: { label: 'In progress', fill: 'oklch(0.62 0.13 85)', on: 'oklch(0.99 0.01 85)' },
  on_hold: { label: 'On hold', fill: 'oklch(0.5 0.07 285)', on: 'oklch(0.99 0.01 285)' },
  resolved: { label: 'Resolved', fill: 'oklch(0.55 0.12 150)', on: 'oklch(0.99 0.01 150)' },
  closed: { label: 'Closed', fill: 'oklch(0.55 0.01 110)', on: 'oklch(0.99 0.01 110)' },
}

export const PRIORITY_META: Record<
  Priority,
  { label: string; fill: string; on: string }
> = {
  low: { label: 'Low', fill: 'oklch(0.6 0.01 110)', on: 'oklch(0.99 0.01 110)' },
  medium: { label: 'Medium', fill: 'oklch(0.55 0.09 220)', on: 'oklch(0.99 0.01 220)' },
  high: { label: 'High', fill: 'oklch(0.62 0.13 70)', on: 'oklch(0.99 0.01 70)' },
  critical: { label: 'Critical', fill: 'oklch(0.55 0.2 27)', on: 'oklch(0.99 0.01 27)' },
}

export const SLA_META: Record<
  SlaState,
  { label: string; fill: string; on: string }
> = {
  on_track: { label: 'On track', fill: 'oklch(0.55 0.12 150)', on: 'oklch(0.99 0.01 150)' },
  at_risk: { label: 'At risk', fill: 'oklch(0.62 0.13 70)', on: 'oklch(0.99 0.01 70)' },
  breached: { label: 'Breached', fill: 'oklch(0.55 0.2 27)', on: 'oklch(0.99 0.01 27)' },
  met: { label: 'Met', fill: 'oklch(0.55 0.01 110)', on: 'oklch(0.99 0.01 110)' },
}

export const TYPE_META: Record<TicketType, { label: string; short: string }> = {
  incident: { label: 'Incident', short: 'INC' },
  request: { label: 'Service request', short: 'SR' },
}

export const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
] as const
