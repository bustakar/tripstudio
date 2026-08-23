import { useEffect, useState } from 'react'

import { authClient } from '@/lib/auth-client'
import { billingStatusFromSubscriptions } from '@/domain/billing'

export type BillingStatus =
  'loading' | 'free' | 'manage' | 'pro' | 'unavailable'

const checkoutRefreshAttempts = 5
const checkoutRefreshIntervalMs = 1_000

export function useBillingStatus() {
  const [status, setStatus] = useState<BillingStatus>('loading')

  useEffect(() => {
    let current = true
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    const checkoutSucceeded =
      new URLSearchParams(window.location.search).get('billing') === 'success'

    const refresh = async (attempt: number) => {
      try {
        const { data, error } = await authClient.subscription.list()
        if (!current) return
        if (error) throw error

        const nextStatus = billingStatusFromSubscriptions(data)
        if (
          checkoutSucceeded &&
          nextStatus === 'free' &&
          attempt < checkoutRefreshAttempts
        ) {
          retryTimer = setTimeout(
            () => void refresh(attempt + 1),
            checkoutRefreshIntervalMs,
          )
          return
        }

        setStatus(nextStatus)
      } catch {
        if (!current) return
        if (checkoutSucceeded && attempt < checkoutRefreshAttempts) {
          retryTimer = setTimeout(
            () => void refresh(attempt + 1),
            checkoutRefreshIntervalMs,
          )
          return
        }
        setStatus('unavailable')
      }
    }

    void refresh(0)
    return () => {
      current = false
      clearTimeout(retryTimer)
    }
  }, [])

  return status
}
