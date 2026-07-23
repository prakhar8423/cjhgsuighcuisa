export const TICKET_TYPES = ['incident', 'request'] as const
export type TicketType = (typeof TICKET_TYPES)[number]

export const PRIORITIES = ['low', 'medium', 'high', 'critical'] as const
export type Priority = (typeof PRIORITIES)[number]

export const STATUSES = ['open', 'in_progress', 'on_hold', 'resolved', 'closed'] as const
export type Status = (typeof STATUSES)[number]

export const WORKLOG_KINDS = [
  'comment',
  'status',
  'assignment',
  'priority',
  'created',
  'link',
] as const
export type WorklogKind = (typeof WORKLOG_KINDS)[number]

export const SLA_STATES = ['on_track', 'at_risk', 'breached', 'met'] as const
export type SlaState = (typeof SLA_STATES)[number]

export interface WorklogEntry {
  id: string
  ticketId: string
  authorId: string
  kind: WorklogKind
  body: string
  createdAt: string
}

export interface Ticket {
  id: string
  key: string
  type: TicketType
  subject: string
  description: string
  requesterId: string
  assigneeId: string | null
  category: string
  priority: Priority
  status: Status
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
  slaPolicyId: string
  linkedArticleIds: string[]
  worklog: WorklogEntry[]
}

export interface Agent {
  id: string
  name: string
  email: string
  avatarInitials: string
  role: 'agent' | 'lead'
}

export interface Requester {
  id: string
  name: string
  email: string
  department: string
}

export interface Category {
  id: string
  name: string
  icon: string
}

export interface SlaPolicy {
  id: string
  name: string
  priority: Priority
  responseMins: number
  resolutionMins: number
}

export interface Service {
  id: string
  name: string
  description: string
  categoryId: string
  icon: string
  fulfillmentTime: string
  subjectTemplate: string
}

export interface Article {
  id: string
  title: string
  category: string
  tags: string[]
  body: string
  updatedAt: string
  relatedIds: string[]
}

export const CURRENT_AGENT_ID = 'agent-you'
