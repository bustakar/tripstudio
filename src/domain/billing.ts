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
  const fractionDigits = formatter.resolvedOptions().maximumFractionDigits ?? 2
  const amount = formatter.format(input.unitAmount / 10 ** fractionDigits)
  const interval =
    input.intervalCount === 1
      ? input.interval
      : `${input.intervalCount} ${input.interval}s`
  return `${amount} / ${interval}`
}
