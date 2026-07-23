import { useMemo, useState } from 'react'
import { Clock, Search } from 'lucide-react'
import { PageHeader } from '@/components/itsm/PageHeader'
import { DynIcon } from '@/components/itsm/DynIcon'
import { Input } from '@/components/ui/input'
import { useCategories, useServices } from '@/data'
import { useUiStore } from '@/lib/store'

export default function Catalog() {
  const categories = useCategories()
  const services = useServices()
  const openCreate = useUiStore((s) => s.openCreate)
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const grouped = useMemo(() => {
    return categories
      .map((cat) => ({
        cat,
        items: services.filter(
          (s) => s.categoryId === cat.id && `${s.name} ${s.description}`.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.items.length > 0)
  }, [categories, services, q])

  function request(category: string, subject: string) {
    openCreate({ type: 'request', category, subject, priority: 'medium' })
  }

  return (
    <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Service catalog"
        description="Browse requestable services. Submitting a request opens a pre-filled service ticket."
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search services…" className="pl-9" />
      </div>

      {grouped.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card px-6 py-16 text-center">
          <h2 className="font-heading text-base font-semibold">No services match</h2>
          <p className="mt-1 text-sm text-muted-foreground">Try a different search term.</p>
        </div>
      ) : (
        grouped.map(({ cat, items }) => (
          <section key={cat.id} className="space-y-4">
            <div className="flex items-center gap-2">
              <DynIcon name={cat.icon} className="size-4 text-muted-foreground" />
              <h2 className="font-heading text-base font-semibold">{cat.name}</h2>
              <span className="text-xs text-muted-foreground">{items.length}</span>
            </div>
            <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(16rem,1fr))]">
              {items.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => request(cat.name, s.subjectTemplate)}
                  className="group flex flex-col rounded-lg border bg-card p-5 text-left transition-colors hover:border-primary/40 hover:bg-accent/5"
                >
                  <span className="mb-3 grid size-10 place-items-center rounded-md bg-primary/10 text-primary">
                    <DynIcon name={s.icon} className="size-5" />
                  </span>
                  <span className="font-medium">{s.name}</span>
                  <span className="mt-1 flex-1 text-sm text-muted-foreground text-pretty">{s.description}</span>
                  <span className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3.5" /> {s.fulfillmentTime}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
