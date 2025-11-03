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
    return <div className="text-center py-12">Ładowanie firm...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Moje Firmy 🏭</h2>
        <a
          href="/owner/companies/new"
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          + Dodaj firmę
        </a>
      </div>

      {companies.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 mb-4">Nie masz jeszcze żadnych firm</p>
          <a
            href="/owner/companies/new"
            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Utwórz pierwszą firmę
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{company.name}</h3>
          <p className="text-sm text-gray-500">
            Utworzona: {new Date(company.createdAt).toLocaleDateString('pl-PL')}
          </p>
        </div>
        <span className="text-3xl">🏭</span>
      </div>

      <div className="flex items-center gap-2 text-gray-600 mb-4">
        <span className="text-lg">🍽️</span>
        <span className="text-sm">
          {company.restaurantsCount} {company.restaurantsCount === 1 ? 'restauracja' : 'restauracji'}
        </span>
      </div>

      <div className="flex gap-2">
        <a
          href={`/owner/companies/${company.id}`}
          className="flex-1 text-center px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
        >
          Szczegóły
        </a>
        <a
          href={`/owner/restaurants?companyId=${company.id}`}
          className="flex-1 text-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
        >
          Restauracje
        </a>
      </div>
    </div>
  )
}
