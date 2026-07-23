import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useItsmStore, useUiStore } from '@/lib/store'
import type { NewTicketInput } from '@/lib/store'
import { useAgents, useCategories, useRequesters } from '@/data'
import { PRIORITIES, TICKET_TYPES } from '@/lib/itsm/types'
import type { Priority, TicketType } from '@/lib/itsm/types'
import { PRIORITY_META, TYPE_META } from '@/lib/itsm/meta'
import { CATEGORY_NAMES } from '@/lib/itsm/seed-static'

const UNASSIGNED = 'unassigned'

type FormState = Omit<NewTicketInput, 'assigneeId'> & { assigneeId: string }

const EMPTY: FormState = {
  type: 'incident',
  subject: '',
  description: '',
  requesterId: '',
  category: CATEGORY_NAMES[0],
  priority: 'medium',
  assigneeId: UNASSIGNED,
}

export function CreateTicketDialog() {
  const open = useUiStore((s) => s.createOpen)
  const prefill = useUiStore((s) => s.createPrefill)
  const closeCreate = useUiStore((s) => s.closeCreate)
  const createTicket = useItsmStore((s) => s.createTicket)
  const navigate = useNavigate()

  const agents = useAgents()
  const requesters = useRequesters()
  const categories = useCategories()

  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<{ subject?: string; requesterId?: string }>({})

  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY, ...prefill, assigneeId: prefill?.assigneeId ?? UNASSIGNED } as FormState)
      setErrors({})
    }
  }, [open, prefill])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit() {
    const nextErrors: typeof errors = {}
    if (!form.subject.trim()) nextErrors.subject = 'Subject is required.'
    if (!form.requesterId) nextErrors.requesterId = 'Select a requester.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const created = createTicket({
      type: form.type,
      subject: form.subject.trim(),
      description: form.description.trim(),
      requesterId: form.requesterId,
      category: form.category,
      priority: form.priority,
      assigneeId: form.assigneeId === UNASSIGNED ? null : form.assigneeId,
    })
    closeCreate()
    toast.success(`${created.key} created`, { description: created.subject })
    navigate(`/incidents/${created.key}`)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? null : closeCreate())}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">New ticket</DialogTitle>
          <DialogDescription>Log an incident or a service request for the desk.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {TICKET_TYPES.map((t) => (
                <Button
                  key={t}
                  type="button"
                  variant={form.type === t ? 'default' : 'outline'}
                  onClick={() => update('type', t as TicketType)}
                  className="justify-start"
                >
                  {TYPE_META[t].label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={form.subject}
              onChange={(e) => update('subject', e.target.value)}
              placeholder="Short summary of the issue or request"
              aria-invalid={!!errors.subject}
            />
            {errors.subject && <p className="text-xs text-destructive">{errors.subject}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Add any detail that helps triage"
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label>Requester</Label>
            <Select value={form.requesterId} onValueChange={(v) => update('requesterId', v)}>
              <SelectTrigger aria-invalid={!!errors.requesterId}>
                <SelectValue placeholder="Select an employee" />
              </SelectTrigger>
              <SelectContent>
                {requesters.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name} · {r.department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.requesterId && <p className="text-xs text-destructive">{errors.requesterId}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => update('category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => update('priority', v as Priority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>{PRIORITY_META[p].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Assignee</Label>
            <Select value={form.assigneeId} onValueChange={(v) => update('assigneeId', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={closeCreate}>Cancel</Button>
          <Button onClick={handleSubmit}>Create ticket</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
