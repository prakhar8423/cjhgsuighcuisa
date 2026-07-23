import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ShieldCheck } from 'lucide-react'
import { PageHeader } from '@/components/itsm/PageHeader'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAgents, useTickets } from '@/data'
import { cn } from '@/lib/utils'
import { CURRENT_AGENT_ID } from '@/lib/itsm/types'
import type { Agent, Status, Ticket } from '@/lib/itsm/types'

const OPEN_STATUSES: Status[] = ['open', 'in_progress', 'on_hold']
const RESOLVED_STATUSES: Status[] = ['resolved', 'closed']

const ROLE_FILTERS = [
  { value: 'all', label: 'Everyone' },
  { value: 'lead', label: 'Leads' },
  { value: 'agent', label: 'Agents' },
] as const

type RoleFilter = (typeof ROLE_FILTERS)[number]['value']

interface PersonStats {
  agent: Agent
  open: number
  resolved: number
}

function buildStats(agents: Agent[], tickets: Ticket[]): PersonStats[] {
  return agents.map((agent) => {
    const assigned = tickets.filter((t) => t.assigneeId === agent.id)
    return {
      agent,
      open: assigned.filter((t) => OPEN_STATUSES.includes(t.status)).length,
      resolved: assigned.filter((t) => RESOLVED_STATUSES.includes(t.status)).length,
    }
  })
}

export default function People() {
  const agents = useAgents()
  const tickets = useTickets()
  const [role, setRole] = useState<RoleFilter>('all')

  const stats = useMemo(() => buildStats(agents, tickets), [agents, tickets])
  const visible = role === 'all' ? stats : stats.filter((s) => s.agent.role === role)

  return (
    <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="People"
        description="The service desk team and their live ticket workload."
        actions={
          <div className="flex gap-1 rounded-md bg-muted p-1">
            {ROLE_FILTERS.map((f) => (
              <Button
                key={f.value}
                size="sm"
                variant={role === f.value ? 'default' : 'ghost'}
                className="h-7 px-3"
                onClick={() => setRole(f.value)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        }
      />

      {visible.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <p className="font-heading text-lg font-medium">No one to show</p>
          <p className="mt-1 text-sm text-muted-foreground">Try a different role filter.</p>
        </div>
      ) : (
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(20rem,1fr))]">
          {visible.map((s) => (
            <PersonCard key={s.agent.id} stats={s} />
          ))}
        </div>
      )}
    </div>
  )
}

function PersonCard({ stats }: { stats: PersonStats }) {
  const { agent, open, resolved } = stats
  const isYou = agent.id === CURRENT_AGENT_ID

  return (
    <article className="flex flex-col gap-5 rounded-xl border bg-card p-5 transition-colors hover:border-primary/40">
      <div className="flex items-start gap-3">
        <Avatar className="size-11">
          <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
            {agent.avatarInitials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium">{agent.name}</p>
            {isYou && <Badge variant="secondary" className="h-5 px-1.5 text-[11px]">You</Badge>}
          </div>
          <p
            className={cn(
              'mt-0.5 inline-flex items-center gap-1 text-xs capitalize',
              agent.role === 'lead' ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            {agent.role === 'lead' && <ShieldCheck className="size-3.5" />}
            {agent.role}
          </p>
        </div>
      </div>

      <a
        href={`mailto:${agent.email}`}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <Mail className="size-3.5 shrink-0" />
        <span className="truncate">{agent.email}</span>
      </a>

      <div className="mt-auto flex items-center justify-between border-t pt-4">
        <div className="flex gap-6">
          <Stat label="Open" value={open} />
          <Stat label="Resolved" value={resolved} />
        </div>
        <Button asChild variant="ghost" size="sm" className="h-8">
          <Link to={`/incidents?assignee=${agent.id}`}>View queue</Link>
        </Button>
      </div>
    </article>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-heading text-2xl font-semibold tabular-nums leading-none">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
