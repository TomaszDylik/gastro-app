'use client'

import { useState, useEffect } from 'react'

interface Company {
  id: string
  name: string
  createdAt: string
  restaurantsCount: number
}

export default function OwnerCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCompanies()
  }, [])

  const loadCompanies = async () => {
    try {
      setLoading(true)
      // TODO: Implement GET /api/owner/companies
      const response = await fetch('/api/owner/companies')
      if (response.ok) {
        const data = await response.json()
        setCompanies(data.companies)
      }
    } catch (error) {
      console.error('Error loading companies:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="py-12 text-center">Ładowanie firm...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Moje Firmy 🏭</h2>
        <a
          href="/owner/companies/new"
          className="rounded-lg bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700"
        >
          + Dodaj firmę
        </a>
      </div>

      {companies.length === 0 ? (
        <div className="rounded-lg bg-white p-12 text-center shadow-md">
          <p className="mb-4 text-gray-500">Nie masz jeszcze żadnych firm</p>
          <a
            href="/owner/companies/new"
            className="inline-block rounded-lg bg-purple-600 px-6 py-3 text-white transition-colors hover:bg-purple-700"
          >
            Utwórz pierwszą firmę
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      )}
    </div>
  )
}

function CompanyCard({ company }: { company: Company }) {
  return (
    <div className="rounded-lg bg-white p-6 shadow-md transition-shadow hover:shadow-lg">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{company.name}</h3>
          <p className="text-sm text-gray-500">
            Utworzona: {new Date(company.createdAt).toLocaleDateString('pl-PL')}
          </p>
        </div>
        <span className="text-3xl">🏭</span>
      </div>

      <div className="mb-4 flex items-center gap-2 text-gray-600">
        <span className="text-lg">🍽️</span>
        <span className="text-sm">
          {company.restaurantsCount}{' '}
          {company.restaurantsCount === 1 ? 'restauracja' : 'restauracji'}
        </span>
      </div>

      <div className="flex gap-2">
        <a
          href={`/owner/companies/${company.id}`}
          className="flex-1 rounded-lg bg-purple-100 px-3 py-2 text-center text-sm font-medium text-purple-700 transition-colors hover:bg-purple-200"
        >
          Szczegóły
        </a>
        <a
          href={`/owner/restaurants?companyId=${company.id}`}
          className="flex-1 rounded-lg bg-blue-100 px-3 py-2 text-center text-sm font-medium text-blue-700 transition-colors hover:bg-blue-200"
        >
          Restauracje
        </a>
      </div>
    </div>
  )
}
