import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { format, formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import {
  ArrowLeft,
  BookOpen,
  CircleUser,
  Link2,
  MessageSquare,
  Plus,
  ShieldAlert,
  Tag,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { StatusBadge, PriorityBadge } from '@/components/itsm/StatusBadge'
import { SlaCell } from '@/components/itsm/SlaCell'
import { useAgents, useArticles, useTicketByKey } from '@/data'
import { agentById, requesterById, slaPolicyById } from '@/data'
import { useItsmStore } from '@/lib/store'
import { useNow } from '@/lib/itsm/use-now'
import { PRIORITIES, STATUSES } from '@/lib/itsm/types'
import type { WorklogEntry } from '@/lib/itsm/types'
import { PRIORITY_META, STATUS_META, TYPE_META } from '@/lib/itsm/meta'

const UNASSIGNED = 'unassigned'

export default function TicketDetail() {
  const { key = '' } = useParams()
  const ticket = useTicketByKey(key)
  const navigate = useNavigate()
  const now = useNow()

  const agents = useAgents()
  const articles = useArticles()
  const setStatus = useItsmStore((s) => s.setStatus)
  const setPriority = useItsmStore((s) => s.setPriority)
  const setAssignee = useItsmStore((s) => s.setAssignee)
  const addComment = useItsmStore((s) => s.addComment)
  const linkArticle = useItsmStore((s) => s.linkArticle)
  const unlinkArticle = useItsmStore((s) => s.unlinkArticle)

  const [comment, setComment] = useState('')

  const timeline = useMemo(
    () => (ticket ? [...ticket.worklog].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : []),
    [ticket],
  )

  if (!ticket) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="font-heading text-xl font-semibold">Ticket not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">We couldn’t find a ticket with key “{key}”.</p>
        <Button asChild variant="outline" className="mt-6"><Link to="/incidents">Back to queue</Link></Button>
      </div>
    )
  }

  const requester = requesterById(ticket.requesterId)
  const policy = slaPolicyById(ticket.slaPolicyId)
  const linkedArticles = articles.filter((a) => ticket.linkedArticleIds.includes(a.id))

  function handleComment() {
    const text = comment.trim()
    if (!text) return
    addComment(ticket!.id, text)
    setComment('')
    toast.success('Comment added')
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <Button variant="ghost" size="sm" className="mb-4 gap-1.5 -ml-2" onClick={() => navigate('/incidents')}>
        <ArrowLeft className="size-4" /> Queue
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-mono">{ticket.key}</span>
            <span>·</span>
            <span>{TYPE_META[ticket.type].label}</span>
          </div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance">{ticket.subject}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <SlaCell ticket={ticket} now={now} />
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-8">
          <section className="rounded-lg border bg-card p-5">
            <h2 className="mb-2 font-heading text-sm font-semibold text-muted-foreground">Description</h2>
            <p className="text-sm leading-relaxed text-pretty">{ticket.description || 'No description provided.'}</p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-sm font-semibold">Add a comment</h2>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share an update, ask the requester a question…"
              rows={3}
            />
            <div className="mt-2 flex justify-end">
              <Button size="sm" onClick={handleComment} disabled={!comment.trim()} className="gap-1.5">
                <MessageSquare className="size-4" /> Comment
              </Button>
            </div>
          </section>

          <section>
            <h2 className="mb-4 font-heading text-sm font-semibold">Activity</h2>
            <ol className="space-y-4">
              {timeline.map((entry) => (
                <TimelineItem key={entry.id} entry={entry} />
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-5">
          <div className="rounded-lg border bg-card p-5">
            <h2 className="mb-4 font-heading text-sm font-semibold">Properties</h2>
            <div className="space-y-4 text-sm">
              <PropRow label="Status">
                <Select value={ticket.status} onValueChange={(v) => setStatus(ticket.id, v as never)}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </PropRow>
              <PropRow label="Priority">
                <Select value={ticket.priority} onValueChange={(v) => setPriority(ticket.id, v as never)}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{PRIORITY_META[p].label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </PropRow>
              <PropRow label="Assignee">
                <Select value={ticket.assigneeId ?? UNASSIGNED} onValueChange={(v) => setAssignee(ticket.id, v === UNASSIGNED ? null : v)}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                    {agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </PropRow>
              <Separator />
              <MetaRow icon={CircleUser} label="Requester" value={requester ? `${requester.name} · ${requester.department}` : '—'} />
              <MetaRow icon={Tag} label="Category" value={ticket.category} />
              <MetaRow icon={ShieldAlert} label="SLA policy" value={policy?.name ?? '—'} />
              <MetaRow icon={undefined} label="Created" value={format(new Date(ticket.createdAt), 'MMM d, yyyy · h:mm a')} />
              <MetaRow icon={undefined} label="Updated" value={formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })} />
              {ticket.resolvedAt && (
                <MetaRow icon={undefined} label="Resolved" value={format(new Date(ticket.resolvedAt), 'MMM d, yyyy · h:mm a')} />
              )}
            </div>
          </div>

          <div className="rounded-lg border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-heading text-sm font-semibold">Linked articles</h2>
              <LinkArticlePopover
                linkedIds={ticket.linkedArticleIds}
                onLink={(id) => { linkArticle(ticket.id, id); toast.success('Article linked') }}
              />
            </div>
            {linkedArticles.length === 0 ? (
              <p className="text-xs text-muted-foreground">No articles linked yet.</p>
            ) : (
              <ul className="space-y-2">
                {linkedArticles.map((a) => (
                  <li key={a.id} className="flex items-center gap-2 rounded-md bg-muted/60 px-2.5 py-1.5">
                    <BookOpen className="size-3.5 shrink-0 text-muted-foreground" />
                    <Link to={`/knowledge/${a.id}`} className="flex-1 truncate text-xs hover:underline">{a.title}</Link>
                    <button type="button" aria-label="Unlink article" onClick={() => unlinkArticle(ticket.id, a.id)} className="text-muted-foreground hover:text-foreground">
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

function PropRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[5rem_1fr] items-center gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

function MetaRow({ icon: Icon, label, value }: { icon?: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {Icon && <Icon className="size-3.5" />}{label}
      </span>
      <span className="text-right text-xs font-medium text-pretty">{value}</span>
    </div>
  )
}

const KIND_ICON: Record<WorklogEntry['kind'], React.ComponentType<{ className?: string }>> = {
  comment: MessageSquare,
  status: ShieldAlert,
  assignment: CircleUser,
  priority: Tag,
  created: Plus,
  link: Link2,
}

function TimelineItem({ entry }: { entry: WorklogEntry }) {
  const Icon = KIND_ICON[entry.kind]
  const author = agentById(entry.authorId) ?? requesterById(entry.authorId)
  const isComment = entry.kind === 'comment'
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
          <span className="font-medium">{author?.name ?? 'System'}</span>
          {!isComment && <span className="text-muted-foreground">{entry.body.toLowerCase()}</span>}
          <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}</span>
        </div>
        {isComment && (
          <p className="mt-1 rounded-md bg-muted/60 px-3 py-2 text-sm leading-relaxed">{entry.body}</p>
        )}
      </div>
    </li>
  )
}

function LinkArticlePopover({ linkedIds, onLink }: { linkedIds: string[]; onLink: (id: string) => void }) {
  const articles = useArticles()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const available = articles.filter(
    (a) => !linkedIds.includes(a.id) && a.title.toLowerCase().includes(q.toLowerCase()),
  )
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs"><Plus className="size-3.5" /> Link</Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <div className="border-b p-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search articles…"
            className="w-full bg-transparent px-2 py-1 text-sm outline-none"
            aria-label="Search articles"
          />
        </div>
        <div className="max-h-60 overflow-y-auto p-1">
          {available.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground">No articles found.</p>
          ) : (
            available.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => { onLink(a.id); setOpen(false); setQ('') }}
                className="block w-full truncate rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent/10"
              >
                {a.title}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
