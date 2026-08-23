import { CreditCard, Sparkles } from 'lucide-react'

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useBillingStatus } from '@/lib/use-billing-status'

export function NavPlan({ onOpen }: { onOpen: () => void }) {
  const billing = useBillingStatus()
  if (billing === 'loading' || billing === 'unavailable') return null

  const pro = billing === 'pro'
  const Icon = pro ? CreditCard : Sparkles
  const label = pro ? 'Manage Pro' : 'Upgrade to Pro'

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton tooltip={label} onClick={onOpen}>
          <Icon />
          <span>{label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
