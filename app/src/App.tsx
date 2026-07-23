import type { ReactNode } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Login from '@/routes/Login'
import ForgotPassword from '@/routes/ForgotPassword'
import UpdatePassword from '@/routes/UpdatePassword'
import Dashboard from '@/routes/itsm/Dashboard'
import Incidents from '@/routes/itsm/Incidents'
import TicketDetail from '@/routes/itsm/TicketDetail'
import Catalog from '@/routes/itsm/Catalog'
import Knowledge from '@/routes/itsm/Knowledge'
import ArticleDetail from '@/routes/itsm/ArticleDetail'
import Reports from '@/routes/itsm/Reports'
import TopAgents from '@/routes/itsm/TopAgents'
import { AppLayout } from '@/components/itsm/AppLayout'
import { CreateTicketDialog } from '@/components/itsm/CreateTicketDialog'
import { useApplyTheme } from '@/lib/itsm/use-theme'

function Shell({ children }: { children: ReactNode }) {
  useApplyTheme()
  return (
    <AppLayout>
      {children}
      <CreateTicketDialog />
    </AppLayout>
  )
}

// BrowserRouter (clean URLs, no #). The mount path is never hardcoded here — the engine
// bakes it in as Vite's `base` (VITE_APP_BASE, see vite.config.ts) and the app reads it
// back as BASE_URL, so one value covers every slot it serves. A deploy build bakes '/'
// (the app's domain root → basename normalizes to undefined = root); a preview slot bakes
// its /agent-api/… path. The trailing slash goes because react-router rejects '/a/b'
// against basename '/a/b/'.
const APP_BASE = import.meta.env.BASE_URL
const basename = (APP_BASE.startsWith('/') ? APP_BASE.replace(/\/+$/, '') : '') || undefined

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="/" element={<Shell><Dashboard /></Shell>} />
        <Route path="/incidents" element={<Shell><Incidents /></Shell>} />
        <Route path="/incidents/:key" element={<Shell><TicketDetail /></Shell>} />
        <Route path="/catalog" element={<Shell><Catalog /></Shell>} />
        <Route path="/knowledge" element={<Shell><Knowledge /></Shell>} />
        <Route path="/knowledge/:id" element={<Shell><ArticleDetail /></Shell>} />
        <Route path="/reports" element={<Shell><Reports /></Shell>} />
        <Route path="/top-agents" element={<Shell><TopAgents /></Shell>} />
        <Route
          path="*"
          element={
            <main className="flex min-h-screen items-center justify-center">
              <p className="text-muted-foreground">Page not found.</p>
            </main>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
