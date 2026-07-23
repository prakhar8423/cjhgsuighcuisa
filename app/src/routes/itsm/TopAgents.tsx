import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts'
import { Crown, Medal } from 'lucide-react'
import { PageHeader } from '@/components/itsm/PageHeader'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useAgents, useTickets } from '@/data'
import { useNow } from '@/lib/itsm/use-now'
import { agentPerformance, type AgentPerformance } from '@/lib/itsm/analytics'
import { formatDuration } from '@/lib/itsm/sla'
import { cn } from '@/lib/utils'
import { CURRENT_AGENT_ID } from '@/lib/itsm/types'

const PODIUM_COUNT = 3
const MINS_MS = 60_000

const TOOLTIP_STYLE = {
  background: 'var(--popover)',
  border: '1px solid var(--border)',
  borderRadius: '0.375rem',
  fontSize: '12px',
  color: 'var(--popover-foreground)',
}

function formatAvg(mins: number): string {
  if (mins === 0) return '—'
  return formatDuration(mins * MINS_MS)
}

export default function TopAgents() {
  const tickets = useTickets()
  const agents = useAgents()
  const now = useNow()

  const ranked = useMemo(() => agentPerformance(tickets, agents, now), [tickets, agents, now])

  const withActivity = ranked.filter((r) => r.resolved > 0 || r.openCount > 0)
  const podium = withActivity.slice(0, PODIUM_COUNT)
  const chartData = withActivity.slice(0, 8).map((r) => ({ name: r.name.split(' ')[0], score: r.score }))

  return (
    <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Top performing agents"
        description="Ranked by a composite score of SLA compliance, resolution volume and speed."
      />

      {withActivity.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <p className="font-heading text-lg font-medium">No agent activity yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Assign and resolve tickets to see the leaderboard populate.
          </p>
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {podium.map((a, i) => (
              <PodiumCard key={a.id} agent={a} rank={i + 1} />
            ))}
          </section>

          <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,22rem)]">
            <LeaderboardTable rows={withActivity} />
            <section className="space-y-3">
              <h2 className="font-heading text-sm font-semibold text-muted-foreground">Score comparison</h2>
              <div className="h-72 rounded-lg border p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <CartesianGrid horizontal={false} stroke="var(--border)" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={72}
                      tick={{ fontSize: 12, fill: 'var(--foreground)' }}
                    />
                    <RTooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'var(--muted)' }} />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={i === 0 ? 'var(--chart-1)' : 'var(--chart-2)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  )
}

const RANK_META = [
  { icon: Crown, tint: 'text-chart-1', ring: 'ring-2 ring-[var(--chart-1)]' },
  { icon: Medal, tint: 'text-muted-foreground', ring: 'ring-1 ring-border' },
  { icon: Medal, tint: 'text-muted-foreground', ring: 'ring-1 ring-border' },
] as const

function PodiumCard({ agent, rank }: { agent: AgentPerformance; rank: number }) {
  const meta = RANK_META[rank - 1] ?? RANK_META[2]
  const Icon = meta.icon
  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card p-5 transition-colors hover:bg-accent/40">
      <div className="relative">
        <Avatar className={cn('size-14', meta.ring)}>
          <AvatarFallback className="bg-secondary text-base font-semibold">{agent.avatarInitials}</AvatarFallback>
        </Avatar>
        <span className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full bg-background">
          <Icon className={cn('size-5', meta.tint)} />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-heading font-semibold">{agent.name}</p>
          {agent.id === CURRENT_AGENT_ID && <Badge variant="secondary">You</Badge>}
        </div>
        <p className="text-xs capitalize text-muted-foreground">{agent.role} · #{rank}</p>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="font-heading text-2xl font-semibold tabular-nums">{agent.score}</span>
          <span className="text-xs text-muted-foreground">score</span>
        </div>
      </div>
    </div>
  )
}

function LeaderboardTable({ rows }: { rows: AgentPerformance[] }) {
  return (
    <section className="space-y-3">
      <h2 className="font-heading text-sm font-semibold text-muted-foreground">Full ranking</h2>
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">#</th>
              <th className="px-4 py-2.5 font-medium">Agent</th>
              <th className="px-4 py-2.5 text-right font-medium">Resolved</th>
              <th className="px-4 py-2.5 text-right font-medium">Open</th>
              <th className="px-4 py-2.5 text-right font-medium">Avg. time</th>
              <th className="px-4 py-2.5 text-right font-medium">SLA</th>
              <th className="px-4 py-2.5 text-right font-medium">Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a, i) => (
              <tr key={a.id} className="border-b last:border-0 transition-colors hover:bg-muted/30">
                <td className="px-4 py-3 tabular-nums text-muted-foreground">{i + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="size-7">
                      <AvatarFallback className="bg-secondary text-xs font-semibold">
                        {a.avatarInitials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{a.name}</span>
                    {a.id === CURRENT_AGENT_ID && <Badge variant="secondary">You</Badge>}
                  </div>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{a.resolved}</td>
                <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{a.openCount}</td>
                <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                  {formatAvg(a.avgResolutionMins)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{a.slaCompliance}%</td>
                <td className="px-4 py-3 text-right font-heading font-semibold tabular-nums">{a.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
