import { Link, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useArticle, useArticles } from '@/data'

export default function ArticleDetail() {
  const { id = '' } = useParams()
  const article = useArticle(id)
  const all = useArticles()

  if (!article) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="font-heading text-xl font-semibold">Article not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">This article may have been moved or removed.</p>
        <Button asChild variant="outline" className="mt-6"><Link to="/knowledge">Back to knowledge base</Link></Button>
      </div>
    )
  }

  const related = all.filter((a) => article.relatedIds.includes(a.id))
  const paragraphs = article.body.split('\n').filter(Boolean)

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <Button asChild variant="ghost" size="sm" className="mb-6 gap-1.5 -ml-2">
        <Link to="/knowledge"><ArrowLeft className="size-4" /> Knowledge base</Link>
      </Button>

      <article>
        <span className="text-sm font-medium text-primary">{article.category}</span>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-balance">{article.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Updated {format(new Date(article.updatedAt), 'MMMM d, yyyy')}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {article.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">#{tag}</span>
          ))}
        </div>

        <Separator className="my-8" />

        <div className="max-w-[68ch] space-y-4">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-[0.95rem] leading-7 text-pretty">{p}</p>
          ))}
        </div>
      </article>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-3 font-heading text-sm font-semibold">Related articles</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {related.map((a) => (
              <li key={a.id}>
                <Link
                  to={`/knowledge/${a.id}`}
                  className="block rounded-lg border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/5"
                >
                  <span className="text-xs font-medium text-primary">{a.category}</span>
                  <p className="mt-1 font-medium text-pretty">{a.title}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
