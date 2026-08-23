import { useEffect, useState } from 'react'

import { authClient } from '@/lib/auth-client'
import { billingStatusFromSubscriptions } from '@/domain/billing'

export type BillingStatus =
  'loading' | 'free' | 'manage' | 'pro' | 'unavailable'

export function useBillingStatus() {
  const [status, setStatus] = useState<BillingStatus>('loading')

  useEffect(() => {
    let current = true
    void authClient.subscription.list().then(({ data, error }) => {
      if (!current) return
      if (error) return setStatus('unavailable')
      setStatus(billingStatusFromSubscriptions(data))
    })
    return () => {
      current = false
    }
  }, [])

  return status
}
