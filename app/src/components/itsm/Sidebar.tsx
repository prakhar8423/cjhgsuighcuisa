import { NavLink } from 'react-router-dom'
import { Award, BookOpen, LayoutDashboard, LifeBuoy, Package, Ticket, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { AGENTS } from '@/lib/itsm/seed-static'
import { CURRENT_AGENT_ID } from '@/lib/itsm/types'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/incidents', label: 'Incidents', icon: Ticket, end: false },
  { to: '/catalog', label: 'Service Catalog', icon: Package, end: false },
  { to: '/knowledge', label: 'Knowledge Base', icon: BookOpen, end: false },
  { to: '/reports', label: 'SLA & Reports', icon: TrendingUp, end: false },
  { to: '/top-agents', label: 'Top Agents', icon: Award, end: false },
] as const

const me = AGENTS.find((a) => a.id === CURRENT_AGENT_ID)!

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="grid size-9 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
          <LifeBuoy className="size-5" />
        </span>
        <div className="leading-tight">
          <p className="font-heading text-base font-semibold">Meridian Desk</p>
          <p className="text-xs text-muted-foreground">Service management</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-2">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/80',
              )
            }
          >
            <Icon className="size-4.5 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center gap-3 border-t border-sidebar-border px-4 py-4">
        <Avatar className="size-9">
          <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
            {me.avatarInitials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-medium">{me.name}</p>
          <p className="truncate text-xs text-muted-foreground capitalize">{me.role} · Service desk</p>
        </div>
      </div>
    </div>
  )
}
