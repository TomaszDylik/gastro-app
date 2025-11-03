import { stringify } from 'csv-stringify/sync'
export function toMonthlyCsv(
  rows: Array<{
    employee_name: string
    employee_id: string
    restaurant_id: string
    month: string
    hours_total: string
    hourly_rate_pln: string
    amount_total: string
  }>
) {
  const header = [
    'employee_name',
    'employee_id',
    'restaurant_id',
    'month(YYYY-MM)',
    'hours_total',
    'hourly_rate_pln',
    'amount_total',
  ]
  const data = rows.map((r) => [
    r.employee_name,
    r.employee_id,
    r.restaurant_id,
    r.month,
    r.hours_total,
    r.hourly_rate_pln,
    r.amount_total,
  ])
  return stringify([header, ...data])
}
