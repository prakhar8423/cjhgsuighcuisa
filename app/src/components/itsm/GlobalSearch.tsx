import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useArticles, useTickets } from '@/data'
import { StatusBadge } from './StatusBadge'

const MAX_RESULTS = 6

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const tickets = useTickets()
  const articles = useArticles()

  const q = query.trim().toLowerCase()
  const ticketResults = useMemo(() => {
    if (!q) return []
    return tickets
      .filter((t) => `${t.key} ${t.subject}`.toLowerCase().includes(q))
      .slice(0, MAX_RESULTS)
  }, [tickets, q])
  const articleResults = useMemo(() => {
    if (!q) return []
    return articles.filter((a) => a.title.toLowerCase().includes(q)).slice(0, 3)
  }, [articles, q])

  function go(path: string) {
    setOpen(false)
    setQuery('')
    navigate(path)
  }

  const hasResults = ticketResults.length > 0 || articleResults.length > 0

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-9 w-full max-w-sm justify-start gap-2 text-muted-foreground font-normal"
        >
          <Search className="size-4" />
          Search tickets, articles…
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(28rem,90vw)] p-0">
        <div className="border-b p-2">
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by key, subject or article title"
            className="h-9 border-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <ScrollArea className="max-h-80">
          {!q && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Start typing to search the service desk.
            </p>
          )}
          {q && !hasResults && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No matches for “{query}”.
            </p>
          )}
          {ticketResults.length > 0 && (
            <div className="p-1">
              <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground">Tickets</p>
              {ticketResults.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => go(`/incidents/${t.key}`)}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent/10"
                >
                  <span className="font-mono text-xs text-muted-foreground">{t.key}</span>
                  <span className="flex-1 truncate">{t.subject}</span>
                  <StatusBadge status={t.status} />
                </button>
              ))}
            </div>
          )}
          {articleResults.length > 0 && (
            <div className="border-t p-1">
              <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground">Knowledge base</p>
              {articleResults.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => go(`/knowledge/${a.id}`)}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent/10"
                >
                  <span className="flex-1 truncate">{a.title}</span>
                  <span className="text-xs text-muted-foreground">{a.category}</span>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
