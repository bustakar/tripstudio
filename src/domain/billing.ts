const stripeZeroDecimalCurrencies = new Set([
  'BIF',
  'CLP',
  'DJF',
  'GNF',
  'JPY',
  'KMF',
  'KRW',
  'MGA',
  'PYG',
  'RWF',
  'UGX',
  'VND',
  'VUV',
  'XAF',
  'XOF',
  'XPF',
])

export type BillingAccessStatus = 'free' | 'manage' | 'pro'

export function billingStatusFromSubscriptions(
  subscriptions: Array<{ status: string }>,
): BillingAccessStatus {
  if (
    subscriptions.some(
      ({ status }) => status === 'active' || status === 'trialing',
    )
  )
    return 'pro'
  return subscriptions.length > 0 ? 'manage' : 'free'
}

export function formatRecurringPrice(input: {
  currency: string
  unitAmount: number
  interval: string
  intervalCount: number
}) {
  const currency = input.currency.toUpperCase()
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  })
  const intlFractionDigits =
    formatter.resolvedOptions().maximumFractionDigits ?? 2
  const fractionDigits = stripeZeroDecimalCurrencies.has(currency)
    ? 0
    : Math.max(2, intlFractionDigits)
  const amount = formatter.format(input.unitAmount / 10 ** fractionDigits)
  const interval =
    input.intervalCount === 1
      ? input.interval
      : `${input.intervalCount} ${input.interval}s`
  return `${amount} / ${interval}`
}
