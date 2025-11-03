'use client'

import { useState, useEffect } from 'react'

interface WeeklyReport {
  id: string
  weekStart: string
  restaurantName: string
  totalHours: number
  totalAmount: number
  employeeCount: number
}

interface MonthlyReport {
  id: string
  periodMonth: string
  restaurantName: string
  totalHours: number
  totalAmount: number
  employeeCount: number
}

export default function OwnerReportsPage() {
  const [view, setView] = useState<'weekly' | 'monthly'>('weekly')
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([])
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReports()
  }, [view])

  const loadReports = async () => {
    try {
      setLoading(true)
      if (view === 'weekly') {
        // TODO: Implement GET /api/owner/reports/weekly
        const response = await fetch('/api/owner/reports/weekly')
        if (response.ok) {
          const data = await response.json()
          setWeeklyReports(data.reports)
        }
      } else {
        // TODO: Implement GET /api/owner/reports/monthly
        const response = await fetch('/api/owner/reports/monthly')
        if (response.ok) {
          const data = await response.json()
          setMonthlyReports(data.reports)
        }
      }
    } catch (error) {
      console.error('Error loading reports:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Raporty 📊</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setView('weekly')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              view === 'weekly'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📅 Tygodniowe
          </button>
          <button
            onClick={() => setView('monthly')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              view === 'monthly'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📈 Miesięczne
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Ładowanie raportów...</div>
      ) : view === 'weekly' ? (
        <WeeklyReportsView reports={weeklyReports} />
      ) : (
        <MonthlyReportsView reports={monthlyReports} />
      )}
    </div>
  )
}

function WeeklyReportsView({ reports }: { reports: WeeklyReport[] }) {
  if (reports.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <p className="text-gray-500">Brak raportów tygodniowych</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tydzień
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Restauracja
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Godziny
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Kwota (PLN)
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Pracowników
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Akcje
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {reports.map((report) => (
            <tr key={report.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {new Date(report.weekStart).toLocaleDateString('pl-PL')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {report.restaurantName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                {report.totalHours.toFixed(2)} h
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                {report.totalAmount.toFixed(2)} PLN
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                {report.employeeCount}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                <a
                  href={`/api/reports/weekly/export?id=${report.id}&format=xlsx`}
                  className="text-purple-600 hover:text-purple-800 font-medium"
                >
                  📥 Pobierz
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MonthlyReportsView({ reports }: { reports: MonthlyReport[] }) {
  if (reports.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <p className="text-gray-500">Brak raportów miesięcznych</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Miesiąc
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Restauracja
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Godziny
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Kwota (PLN)
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Pracowników
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Akcje
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {reports.map((report) => (
            <tr key={report.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {new Date(report.periodMonth).toLocaleDateString('pl-PL', {
                  year: 'numeric',
                  month: 'long',
                })}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {report.restaurantName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                {report.totalHours.toFixed(2)} h
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                {report.totalAmount.toFixed(2)} PLN
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                {report.employeeCount}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                <a
                  href={`/api/reports/monthly/export?id=${report.id}&format=xlsx`}
                  className="text-purple-600 hover:text-purple-800 font-medium"
                >
                  📥 Pobierz
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
