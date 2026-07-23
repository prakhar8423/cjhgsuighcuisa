import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PageHeader } from '@/components/itsm/PageHeader'
import { Button } from '@/components/ui/button'
import { useAgents, useCategories, useTickets } from '@/data'
import { useNow } from '@/lib/itsm/use-now'
import {
  avgResolutionMins,
  resolutionTrend,
  slaComplianceRate,
  volumeByCategory,
  withinRange,
  workloadByAgent,
} from '@/lib/itsm/analytics'
import { formatDuration } from '@/lib/itsm/sla'
import { CURRENT_AGENT_ID } from '@/lib/itsm/types'

const RANGES = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
] as const

const TOOLTIP_STYLE = {
  background: 'var(--popover)',
  border: '1px solid var(--border)',
  borderRadius: '0.375rem',
  fontSize: '12px',
  color: 'var(--popover-foreground)',
}

export default function Reports() {
  const tickets = useTickets()
  const categories = useCategories()
  const agents = useAgents()
  const now = useNow()
  const [days, setDays] = useState<number>(30)

  const ranged = useMemo(() => withinRange(tickets, days), [tickets, days])
  const compliance = useMemo(() => slaComplianceRate(ranged, now), [ranged, now])
  const avgMins = useMemo(() => avgResolutionMins(ranged), [ranged])
  const trend = useMemo(() => resolutionTrend(tickets, days), [tickets, days])
  const byCategory = useMemo(
    () => volumeByCategory(ranged, categories.map((c) => c.name)),
    [ranged, categories],
  )
  const byAgent = useMemo(() => workloadByAgent(tickets, agents), [tickets, agents])

  const notEnough = ranged.length === 0

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="SLA & reports"
        description="Compliance, resolution speed and volume across the service desk."
        actions={
          <div className="flex rounded-md border p-0.5">
            {RANGES.map((r) => (
              <Button
                key={r.value}
                variant={days === r.value ? 'default' : 'ghost'}
                size="sm"
                className="h-7"
                onClick={() => setDays(r.value)}
              >
                {r.label}
              </Button>
            ))}
          </div>
        }
      />

      {notEnough ? (
        <div className="rounded-lg border border-dashed bg-card px-6 py-16 text-center">
          <h2 className="font-heading text-base font-semibold">Not enough data yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">No tickets were created in the last {days} days.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="SLA compliance" value={`${compliance}%`} hint="of resolved tickets met their SLA" />
            <Stat label="Avg. resolution time" value={avgMins ? formatDuration(avgMins * 60_000) : '—'} hint="from creation to resolution" />
            <Stat label="Tickets in range" value={String(ranged.length)} hint={`created in the last ${days} days`} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-lg border bg-card p-5">
              <h2 className="mb-4 font-heading text-base font-semibold">Open vs resolved</h2>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={trend} margin={{ left: -20, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="g-created" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g-resolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <RTooltip contentStyle={TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="created" name="Created" stroke="var(--chart-2)" fill="url(#g-created)" strokeWidth={2} />
                  <Area type="monotone" dataKey="resolved" name="Resolved" stroke="var(--chart-1)" fill="url(#g-resolved)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </section>

            <section className="rounded-lg border bg-card p-5">
              <h2 className="mb-4 font-heading text-base font-semibold">Volume by category</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byCategory} layout="vertical" margin={{ left: 40, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} width={100} />
                  <RTooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'var(--muted)' }} />
                  <Bar dataKey="count" name="Tickets" radius={[0, 4, 4, 0]} fill="var(--chart-1)" />
                </BarChart>
              </ResponsiveContainer>
            </section>
          </div>

          <section className="rounded-lg border bg-card p-5">
            <h2 className="mb-4 font-heading text-base font-semibold">Volume by agent (all-time open)</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byAgent} margin={{ left: -20, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: string, i: number) => (byAgent[i]?.id === CURRENT_AGENT_ID ? 'You' : v.split(' ')[0])}
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <RTooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'var(--muted)' }} />
                <Bar dataKey="openCount" name="Open" radius={[4, 4, 0, 0]}>
                  {byAgent.map((_, i) => (
                    <Cell key={i} fill={`var(--chart-${(i % 5) + 1})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </section>
        </>
      )}
    </div>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-heading text-3xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}
