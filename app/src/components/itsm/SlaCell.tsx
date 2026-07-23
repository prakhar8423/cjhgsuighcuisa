import { slaPolicyById } from '@/data'
import { computeSla, formatSlaTimer } from '@/lib/itsm/sla'
import type { Ticket } from '@/lib/itsm/types'
import { SlaBadge } from './StatusBadge'

export function SlaCell({ ticket, now }: { ticket: Ticket; now: number }) {
  const info = computeSla(ticket, slaPolicyById(ticket.slaPolicyId), now)
  return <SlaBadge state={info.state} label={formatSlaTimer(info)} />
}
