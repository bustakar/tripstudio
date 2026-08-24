import { useEffect, useState } from 'react'
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { AppSidebar } from '@/components/app-sidebar'
import { BillingDialog } from '@/components/billing-dialog'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { getSession } from '@/lib/auth-functions'
import { listTripPlans } from '@/server/trip-plan-functions'

export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ location }) => {
    const session = await getSession()
    if (!session)
      throw redirect({ to: '/sign-in', search: { redirect: location.href } })
    return { user: session.user }
  },
  loader: () => listTripPlans(),
  component: AppLayout,
})

function AppLayout() {
  const projects = Route.useLoaderData()
  const { user } = Route.useRouteContext()
  const [billingOpen, setBillingOpen] = useState(false)

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('upgrade') === 'pro')
      setBillingOpen(true)
  }, [])

  function changeBillingOpen(open: boolean) {
    setBillingOpen(open)
    if (open) return
    const url = new URL(window.location.href)
    if (!url.searchParams.has('upgrade')) return
    url.searchParams.delete('upgrade')
    window.history.replaceState(window.history.state, '', url)
  }

  return (
    <SidebarProvider>
      <AppSidebar
        projects={projects}
        user={user}
        onOpenBilling={() => setBillingOpen(true)}
      />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="text-sm font-medium">Trip Studio</span>
        </header>
        <Outlet />
      </SidebarInset>
      <BillingDialog open={billingOpen} onOpenChange={changeBillingOpen} />
    </SidebarProvider>
  )
}
