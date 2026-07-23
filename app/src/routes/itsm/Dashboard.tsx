import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
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
  const trend = useMemo(() => resolutionTrend(tickets, TREND_DAYS), [tickets])
  const workload = useMemo(() => workloadByAgent(tickets, agents), [tickets, agents])
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
        title="Operations dashboard"
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
        <section className="rounded-lg border bg-card p-5 lg:col-span-2">
          <h2 className="font-heading text-base font-semibold">Resolution trend</h2>
          <p className="mb-4 text-sm text-muted-foreground">Created vs resolved over the last {TREND_DAYS} days.</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trend} margin={{ left: -20, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <RTooltip contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="created" name="Created" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="resolved" name="Resolved" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </section>

        <section className="rounded-lg border bg-card p-5">
          <h2 className="font-heading text-base font-semibold">Open by priority</h2>
          <p className="mb-4 text-sm text-muted-foreground">Active tickets awaiting work.</p>
          <div className="space-y-3">
            {byPriority.map(({ priority, count }) => {
              const total = byPriority.reduce((s, p) => s + p.count, 0) || 1
              return (
                <div key={priority} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span>{PRIORITY_META[priority].label}</span>
                    <span className="tabular-nums text-muted-foreground">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${(count / total) * 100}%`, backgroundColor: PRIORITY_META[priority].fill }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-lg border bg-card p-5">
          <h2 className="font-heading text-base font-semibold">Queue by status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byStatus} margin={{ left: -20, right: 8, top: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} interval={0} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <RTooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'var(--muted)' }} />
              <Bar dataKey="count" name="Tickets" radius={[4, 4, 0, 0]}>
                {byStatus.map((d) => (
                  <Cell key={d.status} fill={d.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className="rounded-lg border bg-card p-5">
          <h2 className="font-heading text-base font-semibold">Agent workload</h2>
          <p className="mb-4 text-sm text-muted-foreground">Open tickets per agent.</p>
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

        <section className="rounded-lg border bg-card p-5">
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

const TOOLTIP_STYLE = {
  background: 'var(--popover)',
  border: '1px solid var(--border)',
  borderRadius: '0.375rem',
  fontSize: '12px',
  color: 'var(--popover-foreground)',
}
