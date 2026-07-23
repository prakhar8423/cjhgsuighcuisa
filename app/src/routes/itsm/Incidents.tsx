import { useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { ArrowUpDown, FilterX, Inbox, Plus } from 'lucide-react'
import { PageHeader } from '@/components/itsm/PageHeader'
import { StatusBadge, PriorityBadge } from '@/components/itsm/StatusBadge'
import { SlaCell } from '@/components/itsm/SlaCell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAgents, useCategories, useTickets } from '@/data'
import { useUiStore } from '@/lib/store'
import { useNow } from '@/lib/itsm/use-now'
import { slaOf } from '@/lib/itsm/analytics'
import { agentById, requesterById } from '@/data'
import { PRIORITIES, STATUSES, TICKET_TYPES } from '@/lib/itsm/types'
import type { Priority, Ticket } from '@/lib/itsm/types'
import { PRIORITY_META, STATUS_META, TYPE_META } from '@/lib/itsm/meta'

const ALL = 'all'
const PRIORITY_RANK: Record<Priority, number> = { critical: 0, high: 1, medium: 2, low: 3 }

type SortKey = 'updated' | 'priority' | 'created' | 'subject'

export default function Incidents() {
  const tickets = useTickets()
  const agents = useAgents()
  const categories = useCategories()
  const openCreate = useUiStore((s) => s.openCreate)
  const navigate = useNavigate()
  const now = useNow()
  const [params, setParams] = useSearchParams()

  const search = params.get('q') ?? ''
  const status = params.get('status') ?? ALL
  const priority = params.get('priority') ?? ALL
  const assignee = params.get('assignee') ?? ALL
  const category = params.get('category') ?? ALL
  const type = params.get('type') ?? ALL
  const slaFilter = params.get('sla') ?? ALL
  const sort = (params.get('sort') as SortKey) ?? 'updated'

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (!value || value === ALL) next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }

  const hasFilters =
    !!search || status !== ALL || priority !== ALL || assignee !== ALL || category !== ALL || type !== ALL || slaFilter !== ALL

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const rows = tickets.filter((t) => {
      if (status !== ALL && t.status !== status) return false
      if (priority !== ALL && t.priority !== priority) return false
      if (type !== ALL && t.type !== type) return false
      if (category !== ALL && t.category !== category) return false
      if (assignee === 'none' && t.assigneeId) return false
      if (assignee !== ALL && assignee !== 'none' && t.assigneeId !== assignee) return false
      if (slaFilter === 'risk') {
        const s = slaOf(t, now).state
        if (s !== 'at_risk' && s !== 'breached') return false
      }
      if (q) {
        const hay = `${t.key} ${t.subject} ${requesterById(t.requesterId)?.name ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
    const sorted = [...rows].sort((a, b) => compare(a, b, sort))
    return sorted
  }, [tickets, search, status, priority, type, category, assignee, slaFilter, sort, now])

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Incident queue"
        description="Triage, filter and work every incident and service request in one place."
        actions={
          <Button onClick={() => openCreate()} className="gap-2">
            <Plus className="size-4" /> New ticket
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setParam('q', e.target.value)}
          placeholder="Search key, subject or requester…"
          className="h-9 w-full max-w-xs"
        />
        <FilterSelect label="Status" value={status} onChange={(v) => setParam('status', v)}
          options={STATUSES.map((s) => ({ value: s, label: STATUS_META[s].label }))} />
        <FilterSelect label="Priority" value={priority} onChange={(v) => setParam('priority', v)}
          options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY_META[p].label }))} />
        <FilterSelect label="Type" value={type} onChange={(v) => setParam('type', v)}
          options={TICKET_TYPES.map((t) => ({ value: t, label: TYPE_META[t].label }))} />
        <FilterSelect label="Category" value={category} onChange={(v) => setParam('category', v)}
          options={categories.map((c) => ({ value: c.name, label: c.name }))} />
        <FilterSelect label="Assignee" value={assignee} onChange={(v) => setParam('assignee', v)}
          options={[{ value: 'none', label: 'Unassigned' }, ...agents.map((a) => ({ value: a.id, label: a.name }))]} />
        <Select value={sort} onValueChange={(v) => setParam('sort', v)}>
          <SelectTrigger className="h-9 w-auto gap-1.5"><ArrowUpDown className="size-3.5" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="updated">Last updated</SelectItem>
            <SelectItem value="created">Newest</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="subject">Subject A–Z</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setParams({}, { replace: true })}>
            <FilterX className="size-3.5" /> Clear
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyQueue filtered={hasFilters} onClear={() => setParams({}, { replace: true })} onCreate={() => openCreate()} />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-24">Key</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="hidden md:table-cell">Requester</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Assignee</TableHead>
                <TableHead className="hidden xl:table-cell">SLA</TableHead>
                <TableHead className="hidden sm:table-cell text-right">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => {
                const assigneeAgent = agentById(t.assigneeId)
                return (
                  <TableRow
                    key={t.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/incidents/${t.key}`)}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">{t.key}</TableCell>
                    <TableCell className="max-w-xs">
                      <span className="block truncate font-medium">{t.subject}</span>
                      <span className="text-xs text-muted-foreground">{t.category}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {requesterById(t.requesterId)?.name}
                    </TableCell>
                    <TableCell><PriorityBadge priority={t.priority} /></TableCell>
                    <TableCell><StatusBadge status={t.status} /></TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {assigneeAgent ? (
                        <span className="flex items-center gap-2 text-sm">
                          <Avatar className="size-6"><AvatarFallback className="text-[10px]">{assigneeAgent.avatarInitials}</AvatarFallback></Avatar>
                          <span className="truncate">{assigneeAgent.name}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell"><SlaCell ticket={t} now={now} /></TableCell>
                    <TableCell className="hidden sm:table-cell text-right text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(t.updatedAt), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
      <p className="text-xs text-muted-foreground">{filtered.length} of {tickets.length} tickets</p>
      <Link to="/" className="sr-only">Back to dashboard</Link>
    </div>
  )
}

function compare(a: Ticket, b: Ticket, sort: SortKey): number {
  if (sort === 'priority') return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
  if (sort === 'created') return b.createdAt.localeCompare(a.createdAt)
  if (sort === 'subject') return a.subject.localeCompare(b.subject)
  return b.updatedAt.localeCompare(a.updatedAt)
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-auto min-w-28"><SelectValue placeholder={label} /></SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{label}: All</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function EmptyQueue({ filtered, onClear, onCreate }: { filtered: boolean; onClear: () => void; onCreate: () => void }) {
  return (
    <div className="rounded-lg border border-dashed bg-card px-6 py-16 text-center">
      <div className="mx-auto mb-4 grid size-11 place-items-center rounded-lg bg-muted text-muted-foreground">
        <Inbox className="size-5" />
      </div>
      {filtered ? (
        <>
          <h2 className="font-heading text-base font-semibold">No tickets match</h2>
          <p className="mt-1 text-sm text-muted-foreground">Try loosening or clearing your filters.</p>
          <Button variant="outline" className="mt-4 gap-1.5" onClick={onClear}><FilterX className="size-4" /> Clear filters</Button>
        </>
      ) : (
        <>
          <h2 className="font-heading text-base font-semibold">No tickets yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">Create the first incident or service request.</p>
          <Button className="mt-4" onClick={onCreate}>New ticket</Button>
        </>
      )}
    </div>
  )
}
