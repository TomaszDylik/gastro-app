'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Copy, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'

interface Restaurant {
  id: string
  name: string
  inviteToken: string | null
}

export default function SettingsPage() {
  const params = useParams()
  const restaurantId = params.restaurantId as string

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadRestaurant()
  }, [restaurantId])

  const loadRestaurant = async () => {
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}`)
      if (!res.ok) throw new Error('Failed to load restaurant')
      const data = await res.json()
      setRestaurant(data)
    } catch (err) {
      setError('Nie udało się załadować restauracji')
    } finally {
      setLoading(false)
    }
  }

  const generateToken = async () => {
    setGenerating(true)
    setError('')
    try {
      const res = await fetch(`/api/manager/${restaurantId}/regenerate-token`, {
        method: 'POST',
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to generate token')
      }

      const data = await res.json()
      setRestaurant((prev) => prev ? { ...prev, inviteToken: data.token } : null)
    } catch (err: any) {
      setError(err.message || 'Nie udało się wygenerować tokenu')
    } finally {
      setGenerating(false)
    }
  }

  const copyToken = async () => {
    if (!restaurant?.inviteToken) return
    
    try {
      await navigator.clipboard.writeText(restaurant.inviteToken)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      setError('Nie udało się skopiować tokenu')
    }
  }

  if (loading) {
    return (
      <main className="container mx-auto max-w-6xl p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-4xl mb-4">⏳</div>
            <div className="text-xl font-semibold text-gray-700">Ładowanie...</div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto max-w-6xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">⚙️ Ustawienia</h1>

      {/* Token Management */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-xl font-semibold mb-4">🔗 Token dołączania pracowników</h2>
        <p className="text-gray-600 mb-6">
          Token umożliwia pracownikom samodzielne dołączenie do restauracji. 
          Możesz go udostępnić pracownikom, a oni będą mogli użyć go do dołączenia do zespołu.
        </p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {restaurant?.inviteToken ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aktualny token:
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                  <code className="flex-1 text-lg font-mono text-gray-900">
                    {restaurant.inviteToken}
                  </code>
                  <button
                    onClick={copyToken}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Kopiuj token"
                  >
                    {copySuccess ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                </div>
                <button
                  onClick={generateToken}
                  disabled={generating}
                  className="px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                >
                  <RefreshCw className={`w-5 h-5 ${generating ? 'animate-spin' : ''}`} />
                  {generating ? 'Generowanie...' : 'Wygeneruj nowy'}
                </button>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">📋 Instrukcja dla pracowników:</h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Zaloguj się do aplikacji lub utwórz konto</li>
                <li>Przejdź do ustawień profilu</li>
                <li>Wybierz "Dołącz do restauracji"</li>
                <li>Wpisz token: <code className="px-2 py-1 bg-blue-100 rounded font-mono">{restaurant.inviteToken}</code></li>
                <li>Zatwierdź - zostaniesz dodany do zespołu!</li>
              </ol>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Uwaga:</strong> Po wygenerowaniu nowego tokenu, stary token przestanie działać. 
                Wszyscy pracownicy będą musieli użyć nowego tokenu.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Brak aktywnego tokenu. Wygeneruj nowy token, aby umożliwić pracownikom dołączenie.</p>
            <button
              onClick={generateToken}
              disabled={generating}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Generowanie...' : 'Wygeneruj token'}
            </button>
          </div>
        )}
      </div>

      {/* Other Settings Placeholder */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-xl font-semibold mb-4">⚙️ Inne ustawienia</h2>
        <p className="text-gray-600">
          Dodatkowe ustawienia restauracji - w przygotowaniu
        </p>
      </div>
    </main>
  )
}
