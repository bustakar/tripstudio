import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { AppSidebar } from '@/components/app-sidebar'
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
  return (
    <SidebarProvider>
      <AppSidebar projects={projects} user={user} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="text-sm font-medium">Trip Studio</span>
        </header>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}
