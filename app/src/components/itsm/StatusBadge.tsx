import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import { PRIORITY_META, SLA_META, STATUS_META } from '@/lib/itsm/meta'
import type { Priority, SlaState, Status } from '@/lib/itsm/types'

type SolidStyle = CSSProperties & { '--fill': string; '--on': string }

function solid(fill: string, on: string): SolidStyle {
  return { '--fill': fill, '--on': on, backgroundColor: 'var(--fill)', color: 'var(--on)' }
}

function softStyle(fill: string): CSSProperties {
  return {
    backgroundColor: `color-mix(in oklch, ${fill}, transparent 86%)`,
    color: fill,
  }
}

const PILL = 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap'
const DOT = 'inline-block size-1.5 rounded-full'

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const m = STATUS_META[status]
  return (
    <span className={cn(PILL, className)} style={softStyle(m.fill)}>
      <span className={DOT} style={{ backgroundColor: m.fill }} />
      {m.label}
    </span>
  )
}

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  const m = PRIORITY_META[priority]
  const isStrong = priority === 'critical'
  return (
    <span
      className={cn(PILL, className)}
      style={isStrong ? solid(m.fill, m.on) : softStyle(m.fill)}
    >
      {!isStrong && <span className={DOT} style={{ backgroundColor: m.fill }} />}
      {m.label}
    </span>
  )
}

export function SlaBadge({ state, label, className }: { state: SlaState; label: string; className?: string }) {
  const m = SLA_META[state]
  const isStrong = state === 'breached'
  return (
    <span
      className={cn(PILL, 'tabular-nums', className)}
      style={isStrong ? solid(m.fill, m.on) : softStyle(m.fill)}
    >
      {label}
    </span>
  )
}
