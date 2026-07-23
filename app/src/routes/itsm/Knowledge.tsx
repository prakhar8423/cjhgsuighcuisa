import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { BookOpen, Search } from 'lucide-react'
import { PageHeader } from '@/components/itsm/PageHeader'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useArticles } from '@/data'
import { cn } from '@/lib/utils'

const ALL = 'All'

export default function Knowledge() {
  const articles = useArticles()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState(ALL)

  const categories = useMemo(
    () => [ALL, ...Array.from(new Set(articles.map((a) => a.category)))],
    [articles],
  )

  const q = query.trim().toLowerCase()
  const results = useMemo(
    () =>
      articles.filter((a) => {
        if (category !== ALL && a.category !== category) return false
        if (!q) return true
        return `${a.title} ${a.body} ${a.tags.join(' ')}`.toLowerCase().includes(q)
      }),
    [articles, q, category],
  )

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Knowledge base"
        description="Self-service help articles agents and requesters can search and share."
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search titles, tags and content…" className="pl-9" />
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <Button
            key={c}
            variant={c === category ? 'default' : 'outline'}
            size="sm"
            className="rounded-full"
            onClick={() => setCategory(c)}
          >
            {c}
          </Button>
        ))}
      </div>

      {results.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card px-6 py-16 text-center">
          <div className="mx-auto mb-4 grid size-11 place-items-center rounded-lg bg-muted text-muted-foreground">
            <BookOpen className="size-5" />
          </div>
          <h2 className="font-heading text-base font-semibold">{q || category !== ALL ? 'No matching articles' : 'No articles yet'}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {q || category !== ALL ? 'Try a different search or category.' : 'Articles will appear here once published.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(19rem,1fr))]">
          {results.map((a) => (
            <Link
              key={a.id}
              to={`/knowledge/${a.id}`}
              className="group flex flex-col rounded-lg border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-accent/5"
            >
              <span className="text-xs font-medium text-primary">{a.category}</span>
              <h3 className="mt-1.5 font-heading text-base font-semibold text-balance group-hover:underline">{a.title}</h3>
              <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted-foreground text-pretty">{a.body}</p>
              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                {a.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className={cn('rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground')}>#{tag}</span>
                ))}
                <span className="ml-auto text-xs text-muted-foreground">{format(new Date(a.updatedAt), 'MMM d')}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
