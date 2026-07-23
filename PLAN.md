# PLAN

## APP
- Name: Meridian Desk
- An IT Service Management (ITSM) tool for internal IT teams: an agent-facing service
  desk to triage incidents, fulfill service requests, track SLAs, and resolve issues
  with a built-in knowledge base.
- Target users: IT service-desk agents and team leads (primary); IT managers reviewing
  SLA/volume health (secondary).
- Primary device: desktop (dense queue work on wide monitors); fully responsive down to
  tablet/mobile for on-call triage.

## FEATURES

1. **Operations Dashboard**
   Landing view summarizing service-desk health. Shows KPI stat cards (Open incidents,
   Breaching SLA soon, Unassigned, Resolved today), a queue-by-status bar chart, a
   priority breakdown, a resolution-time trend line, an agent-workload list, and a
   recent-activity feed.
   *Acceptance:* every KPI is computed from live ticket data; charts use `var(--chart-*)`
   tokens; clicking a KPI card navigates to the Incidents queue pre-filtered to match
   (e.g. "Breaching SLA soon" → filter slaRisk = breaching). Loading shows skeletons;
   empty (no tickets seeded) shows a first-run panel.

2. **Incident Queue**
   Sortable, filterable table of all tickets (incidents + service requests). Columns:
   key (e.g. INC-1042), subject, requester, priority, status, assignee, category,
   SLA timer, updated. Filters: status, priority, assignee, category, type, and a free
   text search over key/subject/requester. Sort by any column; persist filters in the
   URL/store.
   *Acceptance:* filters combine (AND); search is debounced and case-insensitive; a
   priority/status change from a row action updates the row and any open detail without a
   full reload; empty-filter-result state offers "Clear filters". Loading = skeleton rows.

3. **Create / Edit Ticket**
   Dialog (or side sheet) to log a new incident or edit an existing one: subject
   (required), description, requester, category (select), priority (select), type
   (incident | service request), assignee (select, optional). Validates subject
   non-empty and requester selected.
   *Acceptance:* new tickets get an auto-generated key (INC-#### / SR-####), status
   `open`, created/updated timestamps, and a default SLA policy by priority; a worklog
   entry "Ticket created" is added; on save a success toast fires and the queue updates.
   Invalid submit shows inline field errors and does not close.

4. **Ticket Detail & Worklog**
   Full view of one ticket: header (key, subject, type, status/priority badges, SLA
   timer), a two-column layout with the description + chronological activity timeline
   (status changes, comments, assignment changes) on the left and a properties panel
   (status, priority, assignee, category, requester, dates, SLA policy) on the right.
   Agents post comments, change status/priority/assignee inline, and link KB articles.
   *Acceptance:* every property change appends a timestamped worklog entry and updates
   `updatedAt`; resolving a ticket stamps `resolvedAt` and stops the SLA timer; comment
   requires non-empty text; linked KB articles render as navigable chips.

5. **SLA Tracking**
   Each ticket carries an SLA policy (response + resolution targets by priority). A live
   timer shows time-remaining or overdue; tickets are classified `on-track`,
   `at-risk` (<25% remaining), or `breached`. Surfaced as badges in the queue, detail,
   and dashboard.
   *Acceptance:* SLA state is derived from priority policy, createdAt, and now; breached
   tickets show a destructive badge; the dashboard "Breaching soon" count = at-risk +
   not-yet-breached. Timers are computed with date-fns, no per-second interval churn
   beyond a single ticking clock.

6. **Service Catalog**
   Grid of requestable services grouped by category (e.g. Hardware, Access, Software,
   Onboarding). Each service card has an icon, name, short description, and typical
   fulfillment time. Requesting a service opens the Create Ticket dialog pre-filled
   (type = service request, category, subject template).
   *Acceptance:* categories render as sections; submitting a request creates an SR ticket
   visible in the queue; empty search state within catalog is handled.

7. **Knowledge Base**
   Searchable list of help articles with category filter and full-text search over
   title/body/tags. Article detail shows title, category, tags, body (rendered
   paragraphs), last-updated, and related articles. Articles are linkable from tickets.
   *Acceptance:* search filters live; article view is readable at 65–75ch; "no results"
   and "no articles yet" states differ; article can be attached to a ticket from detail.

8. **SLA & Reports**
   Analytics view: SLA compliance rate (gauge/percentage), resolution-time trend over
   time, ticket volume by category (bar), volume by agent, and open-vs-resolved over the
   selected range. Range selector (7 / 30 / 90 days).
   *Acceptance:* all charts recompute on range change; each chart handles the empty state;
   percentages and durations are formatted (e.g. "94% within SLA", "4h 12m avg").

## SCREENS
- **/** Dashboard — KPI cards, charts, workload, activity feed. Empty: first-run "No
  tickets yet — create your first incident or seed demo data" panel.
- **/incidents** Incident Queue — filter bar + data table. Empty (filtered): "No tickets
  match — Clear filters". Empty (none): create-first prompt.
- **/incidents/:key** Ticket Detail — timeline + properties + comments. Not-found state
  for bad key.
- **/catalog** Service Catalog — categorized service cards. Empty search: "No services
  match".
- **/knowledge** Knowledge Base — search + article list. Empty/no-results states.
- **/knowledge/:id** Article — readable body + related. Not-found state.
- **/reports** SLA & Reports — charts with range selector. Empty: "Not enough data yet".
- Global: left sidebar nav (Dashboard, Incidents, Catalog, Knowledge, Reports), top bar
  with global search + "New ticket" button + theme toggle. Loading states = skeletons
  everywhere; error state = inline retry card.

## DATA MODEL & STATE
- **PERSISTENCE: local** — all data lives in the browser via localStorage, managed by a
  zustand store; seeded on first run. No backend.
- **AUTH: public** — no sign-in; a single-agent demo tool. A current-agent identity is
  simulated (a fixed "You" agent) for assignment/worklog attribution. No login page.

Entities (localStorage shapes):
- **Ticket**: `id`, `key` (INC-#### / SR-####), `type` ('incident' | 'request'),
  `subject`, `description`, `requesterId`, `assigneeId | null`, `category`,
  `priority` ('low' | 'medium' | 'high' | 'critical'),
  `status` ('open' | 'in_progress' | 'on_hold' | 'resolved' | 'closed'),
  `createdAt`, `updatedAt`, `resolvedAt | null`, `slaPolicyId`, `linkedArticleIds[]`,
  `worklog: WorklogEntry[]`.
- **WorklogEntry**: `id`, `ticketId`, `authorId`, `kind` ('comment' | 'status' |
  'assignment' | 'priority' | 'created' | 'link'), `body`, `createdAt`.
- **Agent**: `id`, `name`, `email`, `avatarInitials`, `role` ('agent' | 'lead'),
  `openCount` (derived).
- **Requester** (employee): `id`, `name`, `email`, `department`.
- **Category**: `id`, `name`, `icon`.
- **SlaPolicy**: `id`, `name`, `priority`, `responseMins`, `resolutionMins`.
- **Service** (catalog item): `id`, `name`, `description`, `categoryId`, `icon`,
  `fulfillmentTime`, `subjectTemplate`.
- **Article** (KB): `id`, `title`, `category`, `tags[]`, `body`, `updatedAt`,
  `relatedIds[]`.

Seed data (realistic, plentiful):
- **40+ tickets** across all statuses/priorities/types, spread over the last ~60 days
  with varied timestamps so charts and SLA timers look alive; each with 1–6 worklog
  entries. Mix of resolved (with resolvedAt) and active.
- **8 agents** (with role mix), **20+ requesters** across departments, **6 categories**,
  **4 SLA policies** (one per priority), **12+ catalog services**, **15+ KB articles**
  with tags and cross-links. Dates via date-fns, durations formatted human-readably.

## COMPONENTS (shadcn/ui)
- Layout: Sidebar (custom nav), `Sheet` (mobile nav / ticket create), `Separator`,
  `ScrollArea`, `Avatar`, `DropdownMenu`, `Tooltip`, `Button`, theme toggle.
- Queue: `Table`, `Input` (search), `Select`, `Badge`, `Skeleton`, `Popover`, `Command`
  (global search), `Pagination` (or virtualized list).
- Ticket detail: `Tabs`, `Textarea`, `Badge`, `Avatar`, `Card`, `Separator`, `Dialog`.
- Create/edit: `Dialog` / `Sheet`, `Label`, `Input`, `Textarea`, `Select`, form errors.
- Catalog: `Card`, `Input`, category headings.
- Knowledge: `Input`, `Badge`, `Card`, prose article layout.
- Reports: recharts (Bar, Line, area/gauge) with `var(--chart-1..5)`, `Tabs`/`Select`
  for range, `Card` wrappers.
- Feedback: `sonner` toasts, `AlertDialog` for destructive confirms (close/delete).

## DESIGN SYSTEM

- **Color mode:** Light. Scene: an agent triages a dense ticket queue over an 8-hour
  shift on a wide monitor in a lit open-plan IT office — light mode reduces the
  "everything glows" fatigue of dark UI during all-day data scanning and keeps status
  colors legible. Dark mode ships as a toggle (`.dark` token swap) for late/on-call use.
- **Color strategy:** Restrained — tinted neutrals + a grounded olive primary; semantic
  status colors carry the queue. Deliberately avoids the blue-SaaS / cyan-on-dark ITSM
  cliché.
- **Palette (OKLCH, light):**
  - Primary (olive/moss): `oklch(0.52 0.11 118)`, on-primary `oklch(0.99 0.01 110)`.
  - Accent (terracotta / dry-stone): `oklch(0.55 0.13 46)`, on-accent `oklch(0.99 0.01 60)`.
  - Background pure white `oklch(1 0 0)`; card `oklch(0.995 0.004 110)`;
    sidebar `oklch(0.975 0.01 110)`.
  - Foreground/ink `oklch(0.24 0.012 110)` (≥7:1 on white); muted-foreground
    `oklch(0.5 0.014 110)` (≥4.5:1). Neutrals tinted ~0.008–0.012 chroma toward the
    olive hue (110–118) for cohesion — near-achromatic, NOT warm cream.
  - Border/input `oklch(0.9 0.008 110)`.
- **Semantic colors (status vocabulary):**
  - Open → info blue `oklch(0.55 0.09 220)`.
  - In progress → accent/amber-gold `oklch(0.72 0.13 85)`.
  - On hold → muted slate `oklch(0.5 0.07 285)`.
  - Resolved / success → emerald `oklch(0.58 0.12 150)` (kept cooler/brighter than the
    olive primary so they never read as the same green).
  - Closed → neutral gray.
  - Critical / SLA breached → destructive red `oklch(0.55 0.2 27)`; SLA at-risk → amber.
  - Priority: low=neutral, medium=blue, high=amber, critical=red.
- **Contrast:** all body text ≥4.5:1; badge/pill labels use white text on saturated
  fills (olive/terracotta/blue/amber-dark/red), dark text only on pale fills. Verified
  against AA.
- **Chart ramp (deliberate multi-hue, not tints of one):** chart-1 olive `118`,
  chart-2 terracotta `46`, chart-3 blue `220`, chart-4 gold `85`, chart-5 violet `285`.
- **Font:** Headings **Zilla Slab** (a sturdy, mechanical slab serif — operational and
  precise without going monospace); body/UI **Hanken Grotesk** (a humanist sans with
  excellent small-size legibility for dense tables and labels). A genuine contrast axis
  (slab serif + humanist sans), neither a reflex face. UI scale is a fixed rem scale,
  ratio ~1.2; data/tables run denser. Prose (KB articles) capped 65–75ch.
- **Layout:** Persistent left sidebar (nav + agent identity) that collapses to a `Sheet`
  on mobile; top bar with global command search, "New ticket", and theme toggle. Content
  is dense and table-forward; airier on dashboard/catalog. Dark mode via `.dark` token
  swap only (no per-component overrides).
- **Corner radius:** `0.25rem` — crisp and operational; dense tables and controls want
  tight, precise corners over friendly rounding. Pills/badges stay fully rounded.
- **Motion:** 150–250ms ease-out on state changes (row updates, dialog open, badge
  changes); skeletons for loading, not spinners; SLA timer updates on a single ticking
  clock. Respects `prefers-reduced-motion`. No decorative motion.

## NOTES
- Resolved with sensible defaults (user gave no preferences): scope = agent-facing
  service desk covering incident management, service catalog (service requests), SLA
  tracking, knowledge base, and reporting — a complete v1 ITSM tool rather than a single
  narrow slice.
- Non-goals for v1: multi-tenant orgs, real email ingestion, change/problem/asset (CMDB)
  modules, and real authentication — the app is a single-agent local demo. Vocabulary
  (incident, service request, SLA, knowledge base, catalog) is preserved as standard
  ITSM terms.
- Persistence is local (localStorage + zustand); a "Reset demo data" action re-seeds.
