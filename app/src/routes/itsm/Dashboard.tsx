import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AlertTriangle, CheckCircle2, Inbox, UserX } from 'lucide-react'
import { PageHeader } from '@/components/itsm/PageHeader'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { useAgents, useTickets } from '@/data'
import { useUiStore } from '@/lib/store'
import { useNow } from '@/lib/itsm/use-now'
import {
  computeKpis,
  countByPriority,
  countByStatus,
  resolutionTrend,
  workloadByAgent,
} from '@/lib/itsm/analytics'
import { PRIORITY_META } from '@/lib/itsm/meta'
import { CURRENT_AGENT_ID } from '@/lib/itsm/types'
import { requesterById } from '@/data'
import {
  AXIS_TICK,
  ChartCard,
  ChartLegend,
  ChartTooltip,
  CURSOR_FILL,
  GRID_STROKE,
} from '@/components/itsm/charts/chart-kit'

const TREND_DAYS = 14
const RECENT_LIMIT = 6

export default function Dashboard() {
  const tickets = useTickets()
  const agents = useAgents()
  const openCreate = useUiStore((s) => s.openCreate)
  const navigate = useNavigate()
  const now = useNow()

  const kpis = useMemo(() => computeKpis(tickets, now), [tickets, now])
  const byStatus = useMemo(() => countByStatus(tickets), [tickets])
  const byPriority = useMemo(() => countByPriority(tickets), [tickets])
  const priorityPie = useMemo(
    () => byPriority.filter((p) => p.count > 0).map((p) => ({ ...p, label: PRIORITY_META[p.priority].label, fill: PRIORITY_META[p.priority].fill })),
    [byPriority],
  )
  const openTotal = useMemo(() => byPriority.reduce((s, p) => s + p.count, 0), [byPriority])
  const trend = useMemo(() => resolutionTrend(tickets, TREND_DAYS), [tickets])
  const workload = useMemo(() => workloadByAgent(tickets, agents).slice(1), [tickets, agents])
  const recent = useMemo(
    () => [...tickets].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, RECENT_LIMIT),
    [tickets],
  )

  if (tickets.length === 0) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-lg bg-primary/10 text-primary">
          <Inbox className="size-6" />
        </div>
        <h1 className="font-heading text-xl font-semibold">No tickets yet</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your service desk is empty. Log the first incident to get started.
        </p>
        <Button className="mt-6" onClick={() => openCreate()}>Create your first ticket</Button>
      </div>
    )
  }

  const cards = [
    { key: 'open', label: 'Open incidents', value: kpis.open, icon: Inbox, to: '/incidents?status=open', tone: 'oklch(0.55 0.09 220)' },
    { key: 'breach', label: 'Breaching SLA soon', value: kpis.breachingSoon, icon: AlertTriangle, to: '/incidents?sla=risk', tone: 'oklch(0.55 0.2 27)' },
    { key: 'unassigned', label: 'Unassigned', value: kpis.unassigned, icon: UserX, to: '/incidents?assignee=none', tone: 'oklch(0.62 0.13 70)' },
    { key: 'resolved', label: 'Resolved today', value: kpis.resolvedToday, icon: CheckCircle2, to: '/incidents?status=resolved', tone: 'oklch(0.55 0.12 150)' },
  ] as const

  const maxWorkload = Math.max(1, ...workload.map((w) => w.openCount))

  return (
    <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Operations dashboard 12344"
        description="A live read on service-desk health across incidents, requests and SLAs."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ key, label, value, icon: Icon, to, tone }) => (
          <button
            key={key}
            type="button"
            onClick={() => navigate(to)}
            className="group flex items-center justify-between rounded-lg border bg-card p-5 text-left transition-colors hover:border-primary/40 hover:bg-accent/5"
          >
            <div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-2 font-heading text-3xl font-semibold tabular-nums">{value}</p>
            </div>
            <span
              className="grid size-10 place-items-center rounded-md"
              style={{ backgroundColor: `color-mix(in oklch, ${tone}, transparent 88%)`, color: tone }}
            >
              <Icon className="size-5" />
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard
          title="Resolution trend"
          description={`Created vs resolved over the last ${TREND_DAYS} days`}
          className="lg:col-span-2"
          legend={<ChartLegend items={[{ label: 'Created', color: 'var(--chart-2)' }, { label: 'Resolved', color: 'var(--chart-1)' }]} />}
        >
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={trend} margin={{ left: -18, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="d-created" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="d-resolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="date" tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
              <RTooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="created" name="Created" stroke="var(--chart-2)" strokeWidth={2} fill="url(#d-created)" activeDot={{ r: 4 }} />
              <Area type="monotone" dataKey="resolved" name="Resolved" stroke="var(--chart-1)" strokeWidth={2} fill="url(#d-resolved)" activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Open by priority" description="Active tickets awaiting work">
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={priorityPie} dataKey="count" nameKey="label" innerRadius={44} outerRadius={64} paddingAngle={2} strokeWidth={0}>
                    {priorityPie.map((d) => <Cell key={d.priority} fill={d.fill} />)}
                  </Pie>
                  <RTooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-heading text-2xl font-semibold tabular-nums">{openTotal}</span>
                <span className="text-[11px] text-muted-foreground">open</span>
              </div>
            </div>
            <ChartLegend
              className="flex-col items-start gap-2"
              items={byPriority.map((p) => ({ label: PRIORITY_META[p.priority].label, color: PRIORITY_META[p.priority].fill, value: p.count }))}
            />
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Queue by status" description="Tickets across the workflow">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byStatus} margin={{ left: -18, right: 8, top: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} interval={0} />
              <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
              <RTooltip content={<ChartTooltip />} cursor={{ fill: CURSOR_FILL }} />
              <Bar dataKey="count" name="Tickets" radius={[6, 6, 0, 0]} maxBarSize={44}>
                {byStatus.map((d) => (
                  <Cell key={d.status} fill={d.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <section className="flex flex-col rounded-xl border bg-card p-5">
          <h2 className="mb-1 font-heading text-base font-semibold">Agent workload</h2>
          <p className="mb-4 text-sm text-muted-foreground">Open tickets per agent</p>
          <ul className="space-y-3">
            {workload.map((a) => (
              <li key={a.id} className="flex items-center gap-3">
                <Avatar className="size-8">
                  <AvatarFallback className="text-xs">{a.avatarInitials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate">{a.id === CURRENT_AGENT_ID ? 'You' : a.name}</span>
                    <span className="tabular-nums text-muted-foreground">{a.openCount}</span>
                  </div>
                  <Progress value={(a.openCount / maxWorkload) * 100} className="mt-1 h-1.5" />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-base font-semibold">Recent activity</h2>
            <Button asChild variant="ghost" size="sm"><Link to="/incidents">View all</Link></Button>
          </div>
          <ul className="space-y-3">
            {recent.map((t) => (
              <li key={t.id}>
                <Link
                  to={`/incidents/${t.key}`}
                  className="flex items-start gap-3 rounded-md p-2 transition-colors hover:bg-accent/5"
                >
                  <span className="mt-0.5 font-mono text-xs text-muted-foreground">{t.key}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{t.subject}</span>
                    <span className="text-xs text-muted-foreground">
                      {requesterById(t.requesterId)?.name} · updated {formatDistanceToNow(new Date(t.updatedAt), { addSuffix: true })}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

