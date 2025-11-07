'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { redirectByRole } from '@/lib/redirect-by-role'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [loginMethod, setLoginMethod] = useState<'password' | 'email' | 'phone'>('password')
  const [userRole, setUserRole] = useState<'employee' | 'manager'>('employee')

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // Zaloguj przez Supabase Auth z PKCE flow (używa callback URL)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      if (!data.user) throw new Error('Nie udało się zalogować')

      console.log('✅ Login successful, user:', data.user.email)

      // Przekierowanie na podstawie roli użytkownika
      const redirectPath = await redirectByRole()
      router.push(redirectPath)
      router.refresh()
    } catch (error: any) {
      console.error('❌ Login error:', error)
      setMessage(`❌ Błąd: ${error.message}`)
      setLoading(false)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
      setMessage('✅ Sprawdź swoją skrzynkę e-mail! Wysłaliśmy Ci magiczny link.')
    } catch (error: any) {
      setMessage(`❌ Błąd: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
      })

      if (error) throw error
      setMessage('✅ Sprawdź swój telefon! Wysłaliśmy Ci kod OTP.')
    } catch (error: any) {
      setMessage(`❌ Błąd: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container mx-auto max-w-md p-6">
      <h1 className="mb-6 text-center text-2xl font-bold">Gastro Schedules</h1>

      <div className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-xl font-semibold">Logowanie</h2>

        {/* Wybór roli */}
        <div className="mb-6 rounded-lg bg-gray-50 p-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">Loguję się jako:</label>
          <div className="flex gap-2">
            <button
              onClick={() => setUserRole('employee')}
              className={`flex-1 rounded px-4 py-2 ${
                userRole === 'employee'
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-300 bg-white text-gray-700'
              }`}
            >
              👤 Pracownik
            </button>
            <button
              onClick={() => setUserRole('manager')}
              className={`flex-1 rounded px-4 py-2 ${
                userRole === 'manager'
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-300 bg-white text-gray-700'
              }`}
            >
              👔 Manager
            </button>
          </div>
        </div>

        {/* Przełącznik metody logowania */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setLoginMethod('password')}
            className={`flex-1 rounded px-4 py-2 text-sm ${
              loginMethod === 'password' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            🔑 Hasło
          </button>
          <button
            onClick={() => setLoginMethod('email')}
            className={`flex-1 rounded px-4 py-2 text-sm ${
              loginMethod === 'email' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            📧 Link
          </button>
          <button
            onClick={() => setLoginMethod('phone')}
            className={`flex-1 rounded px-4 py-2 text-sm ${
              loginMethod === 'phone' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            📱 SMS
          </button>
        </div>

        {/* Formularz Hasło */}
        {loginMethod === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label htmlFor="email-pwd" className="mb-1 block text-sm font-medium text-gray-700">
                Adres e-mail
              </label>
              <input
                id="email-pwd"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="twoj@email.com"
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                Hasło
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Logowanie...' : 'Zaloguj się'}
            </button>

            <div className="text-center">
              <Link
                href="/forgot-password"
                className="text-sm text-blue-600 hover:underline"
              >
                Zapomniałeś hasła?
              </Link>
            </div>
          </form>
        )}

        {/* Formularz E-mail */}
        {loginMethod === 'email' && (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                Adres e-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="twoj@email.com"
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Wysyłanie...' : 'Wyślij magiczny link'}
            </button>
          </form>
        )}

        {/* Formularz SMS */}
        {loginMethod === 'phone' && (
          <form onSubmit={handlePhoneLogin} className="space-y-4">
            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">
                Numer telefonu
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+48 123 456 789"
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Format: +48 (kod kraju wymagany)</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Wysyłanie...' : 'Wyślij kod SMS'}
            </button>
          </form>
        )}

        {/* Komunikat */}
        {message && (
          <div
            className={`mt-4 rounded p-3 ${
              message.startsWith('✅')
                ? 'border border-green-200 bg-green-50 text-green-800'
                : 'border border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {message}
          </div>
        )}

        <p className="mt-6 text-center text-xs text-gray-500">
          Bezpieczne logowanie przez Supabase Auth
        </p>
      </div>
    </main>
  )
}
