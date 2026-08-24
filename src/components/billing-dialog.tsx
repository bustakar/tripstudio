import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { authClient } from '@/lib/auth-client'
import { useBillingStatus } from '@/lib/use-billing-status'
import { getProPlanPrice } from '@/server/billing-functions'

export function BillingDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const billing = useBillingStatus()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [price, setPrice] = useState<string | null>(null)
  const pro = billing === 'pro'
  const canManage = pro || billing === 'manage'

  useEffect(() => {
    if (!open || billing !== 'free') return
    let current = true
    setPrice(null)
    void getProPlanPrice()
      .then((configuredPrice) => {
        if (current) setPrice(configuredPrice)
      })
      .catch(() => {
        if (current) setPrice('Price shown in checkout')
      })
    return () => {
      current = false
    }
  }, [billing, open])

  async function continueToBilling() {
    setPending(true)
    setError(null)
    const returnUrl = `${window.location.origin}/?upgrade=pro`
    const { error: billingError } = canManage
      ? await authClient.subscription.billingPortal({ returnUrl })
      : await authClient.subscription.upgrade({
          plan: 'pro',
          successUrl: `${returnUrl}&billing=success`,
          cancelUrl: `${returnUrl}&billing=cancelled`,
        })

    if (billingError) {
      setError(
        billingError.message ??
          (canManage
            ? 'Billing management is unavailable.'
            : 'Checkout could not be started.'),
      )
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {pro
              ? 'Trip Studio Pro'
              : canManage
                ? 'Manage billing'
                : 'Upgrade to Pro'}
          </DialogTitle>
          <DialogDescription>
            {pro
              ? 'Your Trip Studio Pro subscription is active.'
              : canManage
                ? 'Update your payment method or subscription.'
                : 'Subscribe to Trip Studio Pro.'}
          </DialogDescription>
        </DialogHeader>
        {!canManage && (
          <div className="grid gap-5 py-2">
            <div>
              <span className="text-3xl font-semibold">
                {price ?? 'Loading price…'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="size-4" />
              Trip Studio Pro
            </div>
          </div>
        )}
        {billing === 'unavailable' && (
          <Alert variant="destructive">
            <AlertDescription>
              Billing status is temporarily unavailable.
            </AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <Button
            className="w-full"
            disabled={
              pending || billing === 'loading' || billing === 'unavailable'
            }
            onClick={continueToBilling}
          >
            {pending
              ? 'Opening…'
              : canManage
                ? 'Manage billing'
                : 'Upgrade to Pro'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
