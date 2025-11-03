import * as XLSX from 'xlsx'
import Papa from 'papaparse'

/**
 * Export formats for Polish reports
 * 
 * Format PL (detailed - daily):
 * id_pracownika, imie_nazwisko, id_restauracji, nazwa_restauracji,
 * data, wejscie, wyjscie, godziny, stawka_pln, kwota_pln,
 * zrodlo, zatwierdzil, zatwierdzone_o, uwagi
 * 
 * Format PL (monthly aggregate):
 * id_pracownika, imie_nazwisko, id_restauracji, nazwa_restauracji,
 * miesiac, suma_godzin, stawka_pln, suma_kwota_pln
 */

export interface DailyExportRow {
  id_pracownika: string
  imie_nazwisko: string
  id_restauracji: string
  nazwa_restauracji: string
  data: string
  wejscie: string
  wyjscie: string
  godziny: number
  stawka_pln: number
  kwota_pln: number
  zrodlo: string
  zatwierdzil: string | null
  zatwierdzone_o: string | null
  uwagi: string | null
}

export interface MonthlyExportRow {
  id_pracownika: string
  imie_nazwisko: string
  id_restauracji: string
  nazwa_restauracji: string
  miesiac: string
  suma_godzin: number
  stawka_pln: number
  suma_kwota_pln: number
}

/**
 * Generate CSV from data rows
 */
export function generateCSV<T extends Record<string, any>>(data: T[]): string {
  if (data.length === 0) {
    return ''
  }

  const csv = Papa.unparse(data, {
    header: true,
    delimiter: ',',
    newline: '\n'
  })

  return csv
}

/**
 * Generate XLSX from data rows
 */
export function generateXLSX<T extends Record<string, any>>(
  data: T[],
  sheetName: string = 'Raport'
): Buffer {
  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(data)

  // Create workbook
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  // Generate buffer
  const buffer = XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx'
  })

  return buffer
}

/**
 * Format TimeEntry for daily export
 */
export function formatDailyExport(params: {
  timeEntries: Array<{
    id: string
    clockIn: Date
    clockOut: Date | null
    adjustmentMinutes: number
    source: string
    reason: string | null
    approvedByUserId: string | null
    approvedAt: Date | null
    membership: {
      userId: string
      restaurantId: string
      hourlyRateManagerPLN?: number | null
      user: {
        name: string | null
        email?: string | null
        hourlyRateDefaultPLN?: number | null
      }
      restaurant: {
        name: string
      }
    }
  }>
  approverNames?: Map<string, string>
}): DailyExportRow[] {
  const { timeEntries, approverNames = new Map() } = params

  return timeEntries.map(entry => {
    const userName = entry.membership.user.name || entry.membership.user.email || 'Unknown'
    const restaurantName = entry.membership.restaurant.name

    // Calculate hours
    const hours = entry.clockOut
      ? (entry.clockOut.getTime() - entry.clockIn.getTime()) / (1000 * 60 * 60) + entry.adjustmentMinutes / 60
      : 0

    // Get effective rate
    const rate = entry.membership.hourlyRateManagerPLN || entry.membership.user.hourlyRateDefaultPLN || 0

    const amount = hours * Number(rate)

    return {
      id_pracownika: entry.membership.userId,
      imie_nazwisko: userName,
      id_restauracji: entry.membership.restaurantId,
      nazwa_restauracji: restaurantName,
      data: entry.clockIn.toISOString().split('T')[0],
      wejscie: entry.clockIn.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
      wyjscie: entry.clockOut?.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) || '',
      godziny: Math.round(hours * 100) / 100,
      stawka_pln: Math.round(Number(rate) * 100) / 100,
      kwota_pln: Math.round(amount * 100) / 100,
      zrodlo: entry.source,
      zatwierdzil: entry.approvedByUserId ? approverNames.get(entry.approvedByUserId) || entry.approvedByUserId : null,
      zatwierdzone_o: entry.approvedAt?.toISOString() || null,
      uwagi: entry.reason
    }
  })
}

/**
 * Format monthly aggregates for export
 */
export function formatMonthlyExport(params: {
  restaurantId: string
  restaurantName: string
  monthlyData: Array<{
    userId: string
    userName: string
    totalHours: number
    totalAmount: number
    hourlyRate: number
  }>
  month: string
}): MonthlyExportRow[] {
  const { restaurantId, restaurantName, monthlyData, month } = params

  return monthlyData.map(emp => ({
    id_pracownika: emp.userId,
    imie_nazwisko: emp.userName,
    id_restauracji: restaurantId,
    nazwa_restauracji: restaurantName,
    miesiac: month,
    suma_godzin: Math.round(emp.totalHours * 100) / 100,
    stawka_pln: Math.round(emp.hourlyRate * 100) / 100,
    suma_kwota_pln: Math.round(emp.totalAmount * 100) / 100
  }))
}
