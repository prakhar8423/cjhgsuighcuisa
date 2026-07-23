import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
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
import {
  AXIS_TICK,
  ChartCard,
  ChartLegend,
  ChartTooltip,
  CURSOR_FILL,
  GRID_STROKE,
} from '@/components/itsm/charts/chart-kit'

const RANGES = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
] as const

const COMPLIANCE_GOOD = 90
const COMPLIANCE_WARN = 75

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
  const resolvedCount = useMemo(() => ranged.filter((t) => t.resolvedAt).length, [ranged])
  const complianceColor =
    compliance >= COMPLIANCE_GOOD
      ? 'var(--chart-1)'
      : compliance >= COMPLIANCE_WARN
        ? 'var(--chart-4)'
        : 'var(--destructive)'

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
            <Stat label="Avg. resolution time" value={avgMins ? formatDuration(avgMins * 60_000) : '—'} hint="from creation to resolution" />
            <Stat label="Tickets in range" value={String(ranged.length)} hint={`created in the last ${days} days`} />
            <Stat label="Resolved in range" value={String(resolvedCount)} hint="closed within the window" />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
            <ChartCard title="SLA compliance" description={`Resolved within target · last ${days} days`}>
              <div className="relative mx-auto grid place-items-center">
                <ResponsiveContainer width={200} height={200}>
                  <RadialBarChart
                    data={[{ name: 'SLA', value: compliance, fill: complianceColor }]}
                    startAngle={90}
                    endAngle={-270}
                    innerRadius={72}
                    outerRadius={96}
                  >
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar dataKey="value" cornerRadius={12} background={{ fill: CURSOR_FILL }} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-heading text-4xl font-semibold tabular-nums">{compliance}%</span>
                  <span className="text-xs text-muted-foreground">within SLA</span>
                </div>
              </div>
            </ChartCard>

            <ChartCard
              title="Open vs resolved"
              description="Ticket flow over the selected range"
              legend={<ChartLegend items={[{ label: 'Created', color: 'var(--chart-2)' }, { label: 'Resolved', color: 'var(--chart-1)' }]} />}
            >
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trend} margin={{ left: -18, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="g-created" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g-resolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                  <XAxis dataKey="date" tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={28} />
                  <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
                  <RTooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="created" name="Created" stroke="var(--chart-2)" fill="url(#g-created)" strokeWidth={2} activeDot={{ r: 4 }} />
                  <Area type="monotone" dataKey="resolved" name="Resolved" stroke="var(--chart-1)" fill="url(#g-resolved)" strokeWidth={2} activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Volume by category" description="Where tickets come from">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byCategory} layout="vertical" margin={{ left: 8, right: 24, top: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
                  <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="category" tick={AXIS_TICK} tickLine={false} axisLine={false} width={110} />
                  <RTooltip content={<ChartTooltip />} cursor={{ fill: CURSOR_FILL }} />
                  <Bar dataKey="count" name="Tickets" radius={[0, 6, 6, 0]} maxBarSize={26}>
                    <LabelList dataKey="count" position="right" className="fill-muted-foreground" fontSize={11} />
                    {byCategory.map((_, i) => (
                      <Cell key={i} fill={`var(--chart-${(i % 5) + 1})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Volume by agent" description="Open tickets currently assigned">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byAgent} margin={{ left: -18, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: string, i: number) => (byAgent[i]?.id === CURRENT_AGENT_ID ? 'You' : v.split(' ')[0])}
                    interval={0}
                  />
                  <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
                  <RTooltip content={<ChartTooltip />} cursor={{ fill: CURSOR_FILL }} />
                  <Bar dataKey="openCount" name="Open" radius={[6, 6, 0, 0]} maxBarSize={40}>
                    {byAgent.map((_, i) => (
                      <Cell key={i} fill={`var(--chart-${(i % 5) + 1})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
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
