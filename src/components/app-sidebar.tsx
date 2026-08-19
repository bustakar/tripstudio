import * as React from 'react'
import { FolderKanban, Map, Plug, Settings2 } from 'lucide-react'

import { NavMain } from '@/components/nav-main'
import { NavProjects } from '@/components/nav-projects'
import { NavUser } from '@/components/nav-user'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  projects: { id: string; title: string }[]
  user: { name: string; email: string; image?: string | null }
}

export function AppSidebar({ projects, user, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Map className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">TripStudio</span>
                  <span className="truncate text-xs">Travel projects</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={[
            { title: 'Projects', url: '/', icon: FolderKanban },
            { title: 'Connect', url: '/connect', icon: Plug },
            { title: 'Settings', url: '/settings', icon: Settings2 },
          ]}
        />
        <NavProjects
          projects={projects.map((project) => ({
            name: project.title,
            url: `/projects/${project.id}`,
            icon: Map,
          }))}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{ ...user, avatar: user.image ?? '' }} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
