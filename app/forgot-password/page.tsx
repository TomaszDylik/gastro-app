'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      setMessage({
        type: 'success',
        text: '✅ Link resetujący został wysłany na Twój email! Sprawdź swoją skrzynkę pocztową.',
      })
      setEmail('')
    } catch (error: any) {
      console.error('Forgot password error:', error)
      setMessage({
        type: 'error',
        text: `❌ Błąd: ${error.message}`,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container mx-auto max-w-md p-6">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">Gastro Schedules</h1>
        <p className="mt-2 text-gray-600">Resetowanie hasła</p>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-xl font-semibold">Zapomniałeś hasła?</h2>
        <p className="mb-4 text-sm text-gray-600">
          Wpisz swój adres email, a wyślemy Ci link do zresetowania hasła.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Adres email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="twoj@email.pl"
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              disabled={loading}
            />
          </div>

          {message && (
            <div
              className={`rounded p-3 text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800'
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Wysyłanie...' : 'Wyślij link resetujący'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link href="/login" className="text-sm text-blue-600 hover:underline">
            ← Powrót do logowania
          </Link>
        </div>
      </div>
    </main>
  )
}
