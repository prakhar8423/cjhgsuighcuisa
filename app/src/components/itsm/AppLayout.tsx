import type { ReactNode } from 'react'
import { Menu, Moon, Plus, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { SidebarNav } from './Sidebar'
import { GlobalSearch } from './GlobalSearch'
import { useUiStore } from '@/lib/store'
import { useThemeStore } from '@/lib/itsm/use-theme'

export function AppLayout({ children }: { children: ReactNode }) {
  const openCreate = useUiStore((s) => s.openCreate)
  const mode = useThemeStore((s) => s.mode)
  const toggleTheme = useThemeStore((s) => s.toggle)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border lg:block">
        <SidebarNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarNav />
            </SheetContent>
          </Sheet>

          <div className="flex flex-1 justify-start">
            <GlobalSearch />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {mode === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>
          <Button onClick={() => openCreate()} className="gap-2">
            <Plus className="size-4" />
            <span className="hidden sm:inline">New ticket</span>
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
