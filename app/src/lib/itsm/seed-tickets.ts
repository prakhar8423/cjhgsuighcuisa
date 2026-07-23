import type { Priority, Status, Ticket, TicketType, WorklogEntry } from './types'
import { CURRENT_AGENT_ID } from './types'
import { AGENTS, CATEGORY_NAMES, REQUESTERS, SLA_BY_PRIORITY } from './seed-static'

const NOW = Date.parse('2026-07-23T11:00:00.000Z')
const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

type Spec = {
  type: TicketType
  subject: string
  description: string
  category: string
  priority: Priority
  status: Status
  ageHours: number
  reqIdx: number
  agentIdx: number | null
  comments: string[]
  articleIds?: string[]
}

const INCIDENT_SUBJECTS: Array<[string, string, string, Priority]> = [
  ['Cannot connect to VPN from home', 'User reports the VPN client fails to authenticate after the last update. Error 812 shown.', 'Network', 'high'],
  ['Outlook keeps crashing on launch', 'Mail client closes immediately after the splash screen. Reproducible on every restart.', 'Email & Comms', 'medium'],
  ['Laptop will not power on', 'No lights, no fan. Battery may be dead or charger faulty.', 'Hardware', 'high'],
  ['Shared drive access denied', 'User lost access to the Finance shared folder this morning.', 'Access & Identity', 'medium'],
  ['Payroll system down for whole team', 'Nobody in Finance can log in to the payroll portal ahead of the run.', 'Software', 'critical'],
  ['Wi-Fi drops every few minutes', 'Connection on the 3rd floor east wing is intermittent.', 'Network', 'medium'],
  ['Screen flickering on external monitor', 'Monitor flickers when using the docking station.', 'Hardware', 'low'],
  ['Account locked out repeatedly', 'User is locked out several times a day despite correct password.', 'Access & Identity', 'medium'],
  ['Phishing email reported', 'Suspicious email impersonating the CEO requesting gift cards.', 'Access & Identity', 'critical'],
  ['Printer on 2nd floor offline', 'The shared printer shows offline for everyone nearby.', 'Hardware', 'low'],
  ['Cannot send external email', 'Outbound email to external domains bounces with a 550 error.', 'Email & Comms', 'high'],
  ['Slow performance on design app', 'Adobe suite lags badly since the recent OS update.', 'Software', 'medium'],
  ['Zoom audio not working', 'Microphone not detected in video calls after driver update.', 'Software', 'medium'],
  ['Docking station not charging laptop', 'Laptop no longer charges through the dock, only direct.', 'Hardware', 'medium'],
  ['Two-factor codes not arriving', 'MFA SMS codes are delayed or never delivered.', 'Access & Identity', 'high'],
  ['Website portal returns 500 error', 'Internal expense portal throws a server error on submit.', 'Software', 'high'],
  ['Mailbox full, cannot receive', 'User mailbox at quota; new mail is being rejected.', 'Email & Comms', 'medium'],
  ['Keyboard keys sticking', 'Several keys on the laptop keyboard are unresponsive.', 'Hardware', 'low'],
  ['Guest Wi-Fi not working in lobby', 'Visitors cannot connect to the guest network today.', 'Network', 'low'],
  ['Data export failing in CRM', 'Sales cannot export reports; export button spins forever.', 'Software', 'medium'],
]

const REQUEST_SUBJECTS: Array<[string, string, string, Priority]> = [
  ['New laptop for incoming hire', 'Standard laptop needed for a new engineer starting Monday.', 'Hardware', 'medium'],
  ['Additional monitor request', 'Second 24-inch monitor for a hybrid workstation.', 'Hardware', 'low'],
  ['VPN access for contractor', 'Remote VPN access for a 3-month contractor engagement.', 'Access & Identity', 'medium'],
  ['Office 365 license', 'Assign an Office 365 seat to a transferring employee.', 'Software', 'low'],
  ['Access to Marketing shared drive', 'Grant read/write access to the Marketing folder.', 'Access & Identity', 'low'],
  ['Adobe Creative Cloud license', 'Design suite license for a new brand designer.', 'Software', 'medium'],
  ['New hire onboarding — Sales', 'Full IT setup for a new sales rep starting next week.', 'Onboarding', 'high'],
  ['Distribution list creation', 'Create ops-alerts@meridian.io for the operations team.', 'Email & Comms', 'low'],
  ['Software install: Tableau', 'Install Tableau Desktop for the analytics team.', 'Software', 'medium'],
  ['Guest Wi-Fi for client visit', 'Temporary guest credentials for a client workshop.', 'Network', 'low'],
  ['Ergonomic keyboard and mouse', 'Ergonomic peripherals recommended by occupational health.', 'Hardware', 'low'],
  ['Password reset assistance', 'User needs help resetting an expired domain password.', 'Access & Identity', 'medium'],
  ['Docking station request', 'Docking station for a returning hybrid employee.', 'Hardware', 'low'],
  ['New security group membership', 'Add user to the Finance-Approvers security group.', 'Access & Identity', 'medium'],
]

const STATUS_CYCLE: Status[] = ['open', 'in_progress', 'on_hold', 'resolved', 'closed', 'in_progress', 'resolved', 'open']

function buildSpecs(): Spec[] {
  const specs: Spec[] = []
  INCIDENT_SUBJECTS.forEach(([subject, description, category, priority], i) => {
    const status = STATUS_CYCLE[i % STATUS_CYCLE.length]
    specs.push({
      type: 'incident',
      subject,
      description,
      category,
      priority,
      status,
      ageHours: 3 + i * 17,
      reqIdx: i % REQUESTERS.length,
      agentIdx: status === 'open' ? null : (i % (AGENTS.length - 1)) + 1,
      comments:
        status === 'open'
          ? []
          : ['Investigating the reported issue now.', 'Reproduced on a test machine — applying a fix.'].slice(
              0,
              (i % 2) + 1,
            ),
      articleIds: i % 3 === 0 ? ['kb-1'] : undefined,
    })
  })
  REQUEST_SUBJECTS.forEach(([subject, description, category, priority], i) => {
    const status = STATUS_CYCLE[(i + 3) % STATUS_CYCLE.length]
    specs.push({
      type: 'request',
      subject,
      description,
      category,
      priority,
      status,
      ageHours: 8 + i * 23,
      reqIdx: (i + 5) % REQUESTERS.length,
      agentIdx: status === 'open' ? null : (i % (AGENTS.length - 1)) + 1,
      comments: status === 'open' ? [] : ['Approved — proceeding with fulfillment.'],
    })
  })
  return specs
}

function makeWorklog(ticketId: string, spec: Spec, createdAt: number): WorklogEntry[] {
  const entries: WorklogEntry[] = []
  let t = createdAt
  const author = spec.agentIdx == null ? CURRENT_AGENT_ID : AGENTS[spec.agentIdx].id
  entries.push({
    id: `${ticketId}-w0`,
    ticketId,
    authorId: spec.reqIdx >= 0 ? `req-${spec.reqIdx + 1}` : CURRENT_AGENT_ID,
    kind: 'created',
    body: 'Ticket created',
    createdAt: new Date(t).toISOString(),
  })
  if (spec.agentIdx != null) {
    t += 20 * MIN
    entries.push({
      id: `${ticketId}-wa`,
      ticketId,
      authorId: CURRENT_AGENT_ID,
      kind: 'assignment',
      body: `Assigned to ${AGENTS[spec.agentIdx].name}`,
      createdAt: new Date(t).toISOString(),
    })
  }
  spec.comments.forEach((body, i) => {
    t += (i + 1) * HOUR
    entries.push({
      id: `${ticketId}-wc${i}`,
      ticketId,
      authorId: author,
      kind: 'comment',
      body,
      createdAt: new Date(t).toISOString(),
    })
  })
  return entries
}

export function generateSeedTickets(): Ticket[] {
  return buildSpecs().map((spec, i) => {
    const prefix = spec.type === 'incident' ? 'INC' : 'SR'
    const key = `${prefix}-${1000 + i + 1}`
    const id = `tkt-${i + 1}`
    const createdAt = NOW - spec.ageHours * HOUR
    const isResolved = spec.status === 'resolved' || spec.status === 'closed'
    const resolvedAt = isResolved ? createdAt + Math.min(spec.ageHours * 0.6, 30) * HOUR : null
    const worklog = makeWorklog(id, spec, createdAt)
    const updatedAt = worklog[worklog.length - 1].createdAt
    return {
      id,
      key,
      type: spec.type,
      subject: spec.subject,
      description: spec.description,
      requesterId: `req-${spec.reqIdx + 1}`,
      assigneeId: spec.agentIdx == null ? null : AGENTS[spec.agentIdx].id,
      category: CATEGORY_NAMES.includes(spec.category) ? spec.category : CATEGORY_NAMES[0],
      priority: spec.priority,
      status: spec.status,
      createdAt: new Date(createdAt).toISOString(),
      updatedAt,
      resolvedAt: resolvedAt ? new Date(resolvedAt).toISOString() : null,
      slaPolicyId: SLA_BY_PRIORITY[spec.priority],
      linkedArticleIds: spec.articleIds ?? [],
      worklog,
    }
  })
}

export { NOW as SEED_NOW }
