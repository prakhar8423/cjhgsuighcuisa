import { useMemo } from 'react'
import { ShieldCheck } from 'lucide-react'
import { PageHeader } from '@/components/itsm/PageHeader'
import { PriorityBadge } from '@/components/itsm/StatusBadge'
import { useSlaPolicies, useTickets } from '@/data'
import { computeSla, formatDuration } from '@/lib/itsm/sla'
import { slaPolicyById } from '@/data'
import type { SlaPolicy, Ticket } from '@/lib/itsm/types'

const OPEN_STATUSES = new Set(['open', 'in_progress', 'pending'])

type PolicyStats = {
  policy: SlaPolicy
  active: number
  breached: number
  atRisk: number
  compliance: number
}

function buildStats(policies: SlaPolicy[], tickets: Ticket[], now: number): PolicyStats[] {
  return policies.map((policy) => {
    const scoped = tickets.filter((t) => t.slaPolicyId === policy.id)
    const active = scoped.filter((t) => OPEN_STATUSES.has(t.status)).length
    let breached = 0
    let atRisk = 0
    let met = 0
    let terminal = 0
    for (const t of scoped) {
      const info = computeSla(t, slaPolicyById(t.slaPolicyId), now)
      if (info.state === 'breached') breached += 1
      else if (info.state === 'at_risk') atRisk += 1
      else if (info.state === 'met') {
        met += 1
        terminal += 1
      }
    }
    const compliance = terminal > 0 ? Math.round((met / terminal) * 100) : 100
    return { policy, active, breached, atRisk, compliance }
  })
}

export default function Slas() {
  const policies = useSlaPolicies()
  const tickets = useTickets()
  const now = Date.now()

  const stats = useMemo(() => buildStats(policies, tickets, now), [policies, tickets, now])

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="SLA Policies"
        description="Response and resolution targets applied to tickets by priority, with live compliance across the current queue."
      />

      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(20rem,1fr))]">
        {stats.map(({ policy, active, breached, atRisk, compliance }) => (
          <section
            key={policy.id}
            className="rounded-xl border bg-card p-5 transition-colors hover:border-foreground/20"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h2 className="font-heading text-lg font-semibold tracking-tight">{policy.name}</h2>
                <PriorityBadge priority={policy.priority} />
              </div>
              <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
                <ShieldCheck className="size-4.5" />
              </span>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  First response
                </dt>
                <dd className="mt-1 font-heading text-xl font-semibold tabular-nums">
                  {formatDuration(policy.responseMins * 60_000)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Resolution
                </dt>
                <dd className="mt-1 font-heading text-xl font-semibold tabular-nums">
                  {formatDuration(policy.resolutionMins * 60_000)}
                </dd>
              </div>
            </dl>

            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Resolved within target</span>
                <span className="font-semibold tabular-nums">{compliance}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500"
                  style={{ width: `${compliance}%` }}
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm">
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground tabular-nums">{active}</span> active
              </span>
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground tabular-nums">{atRisk}</span> at risk
              </span>
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground tabular-nums">{breached}</span> breached
              </span>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
