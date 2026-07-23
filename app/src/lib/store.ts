import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Priority, Status, Ticket, TicketType, WorklogEntry, WorklogKind } from './itsm/types'
import { CURRENT_AGENT_ID } from './itsm/types'
import { AGENTS, SLA_BY_PRIORITY } from './itsm/seed-static'
import { generateSeedTickets } from './itsm/seed-tickets'
import { PRIORITY_META, STATUS_META } from './itsm/meta'

const STORAGE_KEY = 'meridian-desk-v1'

export interface NewTicketInput {
  type: TicketType
  subject: string
  description: string
  requesterId: string
  category: string
  priority: Priority
  assigneeId: string | null
}

function nextKey(tickets: Ticket[], type: TicketType): string {
  const prefix = type === 'incident' ? 'INC' : 'SR'
  const nums = tickets
    .filter((t) => t.key.startsWith(prefix))
    .map((t) => Number.parseInt(t.key.split('-')[1] ?? '0', 10))
  const max = nums.length ? Math.max(...nums) : 1000
  return `${prefix}-${max + 1}`
}

function makeEntry(
  ticketId: string,
  kind: WorklogKind,
  body: string,
): WorklogEntry {
  return {
    id: `${ticketId}-w-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ticketId,
    authorId: CURRENT_AGENT_ID,
    kind,
    body,
    createdAt: new Date().toISOString(),
  }
}

interface ItsmState {
  tickets: Ticket[]
  createTicket: (input: NewTicketInput) => Ticket
  updateTicketFields: (id: string, fields: Partial<Pick<Ticket, 'subject' | 'description' | 'category' | 'requesterId'>>) => void
  setStatus: (id: string, status: Status) => void
  setPriority: (id: string, priority: Priority) => void
  setAssignee: (id: string, assigneeId: string | null) => void
  addComment: (id: string, body: string) => void
  linkArticle: (id: string, articleId: string) => void
  unlinkArticle: (id: string, articleId: string) => void
  resetDemoData: () => void
}

function patch(tickets: Ticket[], id: string, fn: (t: Ticket) => Ticket): Ticket[] {
  return tickets.map((t) => (t.id === id ? fn(t) : t))
}

export const useItsmStore = create<ItsmState>()(
  persist(
    (set, get) => ({
      tickets: generateSeedTickets(),

      createTicket: (input) => {
        const tickets = get().tickets
        const key = nextKey(tickets, input.type)
        const id = `tkt-${Date.now()}`
        const now = new Date().toISOString()
        const created = makeEntry(id, 'created', 'Ticket created')
        const ticket: Ticket = {
          id,
          key,
          type: input.type,
          subject: input.subject,
          description: input.description,
          requesterId: input.requesterId,
          assigneeId: input.assigneeId,
          category: input.category,
          priority: input.priority,
          status: 'open',
          createdAt: now,
          updatedAt: now,
          resolvedAt: null,
          slaPolicyId: SLA_BY_PRIORITY[input.priority],
          linkedArticleIds: [],
          worklog: [created],
        }
        set({ tickets: [ticket, ...tickets] })
        return ticket
      },

      updateTicketFields: (id, fields) =>
        set({
          tickets: patch(get().tickets, id, (t) => ({
            ...t,
            ...fields,
            slaPolicyId: t.slaPolicyId,
            updatedAt: new Date().toISOString(),
          })),
        }),

      setStatus: (id, status) =>
        set({
          tickets: patch(get().tickets, id, (t) => {
            if (t.status === status) return t
            const now = new Date().toISOString()
            const resolvedAt =
              status === 'resolved' || status === 'closed'
                ? t.resolvedAt ?? now
                : null
            return {
              ...t,
              status,
              resolvedAt,
              updatedAt: now,
              worklog: [...t.worklog, makeEntry(t.id, 'status', `Status changed to ${STATUS_META[status].label}`)],
            }
          }),
        }),

      setPriority: (id, priority) =>
        set({
          tickets: patch(get().tickets, id, (t) => {
            if (t.priority === priority) return t
            return {
              ...t,
              priority,
              slaPolicyId: SLA_BY_PRIORITY[priority],
              updatedAt: new Date().toISOString(),
              worklog: [...t.worklog, makeEntry(t.id, 'priority', `Priority changed to ${PRIORITY_META[priority].label}`)],
            }
          }),
        }),

      setAssignee: (id, assigneeId) =>
        set({
          tickets: patch(get().tickets, id, (t) => {
            if (t.assigneeId === assigneeId) return t
            const name = assigneeId
              ? AGENTS.find((a) => a.id === assigneeId)?.name ?? 'someone'
              : null
            return {
              ...t,
              assigneeId,
              updatedAt: new Date().toISOString(),
              worklog: [
                ...t.worklog,
                makeEntry(t.id, 'assignment', name ? `Assigned to ${name}` : 'Unassigned'),
              ],
            }
          }),
        }),

      addComment: (id, body) =>
        set({
          tickets: patch(get().tickets, id, (t) => ({
            ...t,
            updatedAt: new Date().toISOString(),
            worklog: [...t.worklog, makeEntry(t.id, 'comment', body)],
          })),
        }),

      linkArticle: (id, articleId) =>
        set({
          tickets: patch(get().tickets, id, (t) => {
            if (t.linkedArticleIds.includes(articleId)) return t
            return {
              ...t,
              linkedArticleIds: [...t.linkedArticleIds, articleId],
              updatedAt: new Date().toISOString(),
              worklog: [...t.worklog, makeEntry(t.id, 'link', 'Linked a knowledge base article')],
            }
          }),
        }),

      unlinkArticle: (id, articleId) =>
        set({
          tickets: patch(get().tickets, id, (t) => ({
            ...t,
            linkedArticleIds: t.linkedArticleIds.filter((a) => a !== articleId),
            updatedAt: new Date().toISOString(),
          })),
        }),

      resetDemoData: () => set({ tickets: generateSeedTickets() }),
    }),
    { name: STORAGE_KEY },
  ),
)

// ---- UI-only store (dialogs, filters) ----

export interface QueueFilters {
  search: string
  status: Status | 'all'
  priority: Priority | 'all'
  assigneeId: string | 'all'
  category: string | 'all'
  type: TicketType | 'all'
}

export const DEFAULT_FILTERS: QueueFilters = {
  search: '',
  status: 'all',
  priority: 'all',
  assigneeId: 'all',
  category: 'all',
  type: 'all',
}

interface UiState {
  createOpen: boolean
  createPrefill: Partial<NewTicketInput> | null
  filters: QueueFilters
  openCreate: (prefill?: Partial<NewTicketInput>) => void
  closeCreate: () => void
  setFilters: (patch: Partial<QueueFilters>) => void
  clearFilters: () => void
}

export const useUiStore = create<UiState>((set) => ({
  createOpen: false,
  createPrefill: null,
  filters: DEFAULT_FILTERS,
  openCreate: (prefill) => set({ createOpen: true, createPrefill: prefill ?? null }),
  closeCreate: () => set({ createOpen: false, createPrefill: null }),
  setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
  clearFilters: () => set({ filters: DEFAULT_FILTERS }),
}))
