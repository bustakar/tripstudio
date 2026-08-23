import { useEffect, useState } from 'react'

import { authClient } from '@/lib/auth-client'

export type BillingStatus = 'loading' | 'free' | 'pro' | 'unavailable'

export function useBillingStatus() {
  const [status, setStatus] = useState<BillingStatus>('loading')

  useEffect(() => {
    let current = true
    void authClient.subscription.list().then(({ data, error }) => {
      if (!current) return
      if (error) return setStatus('unavailable')
      setStatus(
        data.some(
          (subscription) =>
            subscription.status === 'active' ||
            subscription.status === 'trialing',
        )
          ? 'pro'
          : 'free',
      )
    })
    return () => {
      current = false
    }
  }, [])

  return status
}
