// Data layer — ALL data access for the app lives in this folder. This app uses
// local persistence (zustand + localStorage), so these hooks read from the
// store and the static reference tables. Components import from '@/data' only.
import { useMemo } from 'react'
import { useItsmStore } from '@/lib/store'
import { AGENTS, ARTICLES, CATEGORIES, REQUESTERS, SERVICES, SLA_POLICIES } from '@/lib/itsm/seed-static'
import type { Agent, Article, Category, Requester, Service, SlaPolicy, Ticket } from '@/lib/itsm/types'

export function useTickets(): Ticket[] {
  return useItsmStore((s) => s.tickets)
}

export function useTicketByKey(key: string): Ticket | undefined {
  const tickets = useTickets()
  return useMemo(() => tickets.find((t) => t.key === key), [tickets, key])
}

export function useAgents(): Agent[] {
  return AGENTS
}

export function useAgent(id: string | null | undefined): Agent | undefined {
  if (!id) return undefined
  return AGENTS.find((a) => a.id === id)
}

export function useRequesters(): Requester[] {
  return REQUESTERS
}

export function useRequester(id: string | null | undefined): Requester | undefined {
  if (!id) return undefined
  return REQUESTERS.find((r) => r.id === id)
}

export function useCategories(): Category[] {
  return CATEGORIES
}

export function useServices(): Service[] {
  return SERVICES
}

export function useArticles(): Article[] {
  return ARTICLES
}

export function useArticle(id: string | undefined): Article | undefined {
  if (!id) return undefined
  return ARTICLES.find((a) => a.id === id)
}

export function useSlaPolicies(): SlaPolicy[] {
  return SLA_POLICIES
}

export function useSlaPolicy(id: string | undefined): SlaPolicy | undefined {
  if (!id) return undefined
  return SLA_POLICIES.find((p) => p.id === id)
}

// Lookup maps (non-hook) for use inside components that already have the arrays.
export function agentById(id: string | null | undefined): Agent | undefined {
  if (!id) return undefined
  return AGENTS.find((a) => a.id === id)
}

export function requesterById(id: string | null | undefined): Requester | undefined {
  if (!id) return undefined
  return REQUESTERS.find((r) => r.id === id)
}

export function slaPolicyById(id: string | undefined): SlaPolicy | undefined {
  if (!id) return undefined
  return SLA_POLICIES.find((p) => p.id === id)
}
