'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isValidSession, setIsValidSession] = useState(false)

  useEffect(() => {
    // Sprawdź czy użytkownik przyszedł z linku resetującego
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setIsValidSession(!!session)
    }
    checkSession()
  }, [])

  const validatePassword = (pass: string): string | null => {
    if (pass.length < 8) {
      return 'Hasło musi mieć minimum 8 znaków'
    }
    if (!/[A-Z]/.test(pass)) {
      return 'Hasło musi zawierać przynajmniej jedną wielką literę'
    }
    if (!/[0-9]/.test(pass)) {
      return 'Hasło musi zawierać przynajmniej jedną cyfrę'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    // Walidacja
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: '❌ Hasła nie są identyczne' })
      setLoading(false)
      return
    }

    const validationError = validatePassword(password)
    if (validationError) {
      setMessage({ type: 'error', text: `❌ ${validationError}` })
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) throw error

      setMessage({
        type: 'success',
        text: '✅ Hasło zostało zmienione! Za chwilę zostaniesz przekierowany do logowania...',
      })

      // Redirect po 2 sekundach
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (error: any) {
      console.error('Reset password error:', error)
      setMessage({
        type: 'error',
        text: `❌ Błąd: ${error.message}`,
      })
      setLoading(false)
    }
  }

  if (!isValidSession) {
    return (
      <main className="container mx-auto max-w-md p-6">
        <div className="rounded-lg bg-white p-6 shadow-md text-center">
          <h2 className="mb-4 text-xl font-semibold text-red-600">Nieprawidłowy link</h2>
          <p className="mb-4 text-gray-600">
            Link resetujący hasło jest nieprawidłowy lub wygasł. Spróbuj ponownie.
          </p>
          <Link
            href="/forgot-password"
            className="inline-block rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Wyślij nowy link
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto max-w-md p-6">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">Gastro Schedules</h1>
        <p className="mt-2 text-gray-600">Ustaw nowe hasło</p>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-xl font-semibold">Nowe hasło</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Nowe hasło
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Minimum 8 znaków"
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500">
              Hasło musi zawierać min. 8 znaków, wielką literę i cyfrę
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Potwierdź hasło
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Wpisz hasło ponownie"
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
            {loading ? 'Zapisywanie...' : 'Zmień hasło'}
          </button>
        </form>
      </div>
    </main>
  )
}
