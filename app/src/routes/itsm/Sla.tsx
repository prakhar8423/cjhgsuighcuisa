import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from 'recharts'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { PageHeader } from '@/components/itsm/PageHeader'
import { SlaBadge } from '@/components/itsm/StatusBadge'
import { useSlaPolicies, useTickets } from '@/data'
import { useNow } from '@/lib/itsm/use-now'
import {
  atRiskTickets,
  complianceByPolicy,
  slaStateBreakdown,
  slaComplianceRate,
} from '@/lib/itsm/analytics'
import { formatDuration, formatSlaTimer } from '@/lib/itsm/sla'
import { SLA_META, PRIORITY_META } from '@/lib/itsm/meta'
import { CURSOR_FILL } from '@/components/itsm/charts/chart-kit'

const COMPLIANCE_GOOD = 90
const COMPLIANCE_WARN = 75
const AT_RISK_LIMIT = 8

function complianceColor(pct: number): string {
  if (pct >= COMPLIANCE_GOOD) return 'var(--chart-1)'
  if (pct >= COMPLIANCE_WARN) return 'var(--chart-4)'
  return 'var(--destructive)'
}

export default function Sla() {
  const tickets = useTickets()
  const policies = useSlaPolicies()
  const now = useNow()

  const compliance = useMemo(
    () => slaComplianceRate(tickets.filter((t) => t.resolvedAt), now),
    [tickets, now],
  )
  const breakdown = useMemo(() => slaStateBreakdown(tickets, now), [tickets, now])
  const atRisk = useMemo(() => atRiskTickets(tickets, now), [tickets, now])
  const byPolicy = useMemo(() => complianceByPolicy(tickets, policies, now), [tickets, policies, now])

  const openTotal = breakdown.reduce((sum, b) => sum + b.count, 0)

  return (
    <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Service level agreements"
        description="Live SLA health, policy targets and the tickets that need attention now."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_1fr]">
        <section className="rounded-xl border bg-card p-5">
          <h2 className="font-heading text-base font-semibold">Overall compliance</h2>
          <p className="text-sm text-muted-foreground">Resolved tickets meeting target</p>
          <div className="relative mx-auto mt-4 grid place-items-center">
            <ResponsiveContainer width={200} height={200}>
              <RadialBarChart
                data={[{ name: 'SLA', value: compliance, fill: complianceColor(compliance) }]}
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
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-sm font-semibold text-muted-foreground">Open tickets by SLA state</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {breakdown.map((b) => {
              const meta = SLA_META[b.state]
              const share = openTotal === 0 ? 0 : Math.round((b.count / openTotal) * 100)
              return (
                <div key={b.state} className="rounded-lg border bg-card p-5">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: meta.fill }} />
                    <p className="text-sm text-muted-foreground">{meta.label}</p>
                  </div>
                  <p className="mt-3 font-heading text-3xl font-semibold tabular-nums">{b.count}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{share}% of open tickets</p>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section className="space-y-3">
          <h2 className="font-heading text-sm font-semibold text-muted-foreground">Policy targets & compliance</h2>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">Policy</th>
                  <th className="px-4 py-2.5 font-medium">Priority</th>
                  <th className="px-4 py-2.5 text-right font-medium">Response</th>
                  <th className="px-4 py-2.5 text-right font-medium">Resolution</th>
                  <th className="px-4 py-2.5 text-right font-medium">Compliance</th>
                </tr>
              </thead>
              <tbody>
                {byPolicy.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">{PRIORITY_META[p.priority].label}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {formatDuration(p.responseMins * 60_000)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {formatDuration(p.resolutionMins * 60_000)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className="font-heading font-semibold tabular-nums"
                        style={{ color: p.resolved === 0 ? 'var(--muted-foreground)' : complianceColor(p.compliance) }}
                      >
                        {p.resolved === 0 ? '—' : `${p.compliance}%`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-sm font-semibold text-muted-foreground">Needs attention</h2>
          {atRisk.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-14 text-center">
              <div className="grid size-10 place-items-center rounded-full bg-secondary">
                <AlertTriangle className="size-5 text-muted-foreground" />
              </div>
              <p className="font-medium">Everything on track</p>
              <p className="text-sm text-muted-foreground">No open tickets are at risk or breached.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {atRisk.slice(0, AT_RISK_LIMIT).map(({ ticket, info }) => (
                <li key={ticket.id}>
                  <Link
                    to={`/incidents/${ticket.key}`}
                    className="group flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/40"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{ticket.subject}</p>
                      <p className="text-xs text-muted-foreground">{ticket.key}</p>
                    </div>
                    <SlaBadge state={info.state} label={formatSlaTimer(info)} />
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
