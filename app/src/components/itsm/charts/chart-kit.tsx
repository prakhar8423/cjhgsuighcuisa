import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Shared visual language for every chart in the app: one card wrapper, one
// tooltip style, one legend treatment, one set of axis defaults.

export const AXIS_TICK = { fontSize: 11, fill: 'var(--muted-foreground)' } as const
export const GRID_STROKE = 'var(--border)'
export const CURSOR_FILL = 'color-mix(in oklch, var(--muted), transparent 40%)'

type TooltipRow = { name?: string; value?: number | string; color?: string; dataKey?: string }

export function ChartTooltip({
  active,
  payload,
  label,
  valueSuffix = '',
}: {
  active?: boolean
  payload?: TooltipRow[]
  label?: string | number
  valueSuffix?: string
}) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-lg border bg-popover/95 px-3 py-2 text-xs shadow-md backdrop-blur">
      {label !== undefined && <p className="mb-1.5 font-medium text-popover-foreground">{label}</p>}
      <ul className="space-y-1">
        {payload.map((row, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="size-2 rounded-full" style={{ backgroundColor: row.color }} />
            <span className="text-muted-foreground">{row.name}</span>
            <span className="ml-auto font-medium tabular-nums text-popover-foreground">
              {row.value}
              {valueSuffix}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export type LegendItem = { label: string; color: string; value?: number | string }

export function ChartLegend({ items, className }: { items: LegendItem[]; className?: string }) {
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5', className)}>
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: it.color }} />
          {it.label}
          {it.value !== undefined && <span className="font-medium tabular-nums text-foreground">{it.value}</span>}
        </li>
      ))}
    </ul>
  )
}

export function ChartCard({
  title,
  description,
  legend,
  children,
  className,
}: {
  title: string
  description?: string
  legend?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('flex flex-col rounded-xl border bg-card p-5', className)}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-heading text-base font-semibold">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {legend}
      </div>
      <div className="flex-1">{children}</div>
    </section>
  )
}
