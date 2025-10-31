'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

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
      
      // Bezpośrednie przekierowanie - session jest już zapisana przez Supabase
      // Używamy router.push bo session jest już w cookies
      router.push('/dashboard')
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
      <h1 className="text-2xl font-bold mb-6 text-center">Gastro Schedules</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Logowanie</h2>
        
        {/* Wybór roli */}
        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loguję się jako:
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setUserRole('employee')}
              className={`flex-1 py-2 px-4 rounded ${
                userRole === 'employee'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700'
              }`}
            >
              👤 Pracownik
            </button>
            <button
              onClick={() => setUserRole('manager')}
              className={`flex-1 py-2 px-4 rounded ${
                userRole === 'manager'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700'
              }`}
            >
              👔 Manager
            </button>
          </div>
        </div>
        
        {/* Przełącznik metody logowania */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setLoginMethod('password')}
            className={`flex-1 py-2 px-4 rounded text-sm ${
              loginMethod === 'password'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            🔑 Hasło
          </button>
          <button
            onClick={() => setLoginMethod('email')}
            className={`flex-1 py-2 px-4 rounded text-sm ${
              loginMethod === 'email'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            📧 Link
          </button>
          <button
            onClick={() => setLoginMethod('phone')}
            className={`flex-1 py-2 px-4 rounded text-sm ${
              loginMethod === 'phone'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            📱 SMS
          </button>
        </div>

        {/* Formularz Hasło */}
        {loginMethod === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label htmlFor="email-pwd" className="block text-sm font-medium text-gray-700 mb-1">
                Adres e-mail
              </label>
              <input
                id="email-pwd"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="twoj@email.com"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Hasło
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logowanie...' : 'Zaloguj się'}
            </button>
          </form>
        )}

        {/* Formularz E-mail */}
        {loginMethod === 'email' && (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Adres e-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="twoj@email.com"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Wysyłanie...' : 'Wyślij magiczny link'}
            </button>
          </form>
        )}

        {/* Formularz SMS */}
        {loginMethod === 'phone' && (
          <form onSubmit={handlePhoneLogin} className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Numer telefonu
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+48 123 456 789"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Format: +48 (kod kraju wymagany)</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Wysyłanie...' : 'Wyślij kod SMS'}
            </button>
          </form>
        )}

        {/* Komunikat */}
        {message && (
          <div className={`mt-4 p-3 rounded ${
            message.startsWith('✅') 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <p className="text-xs text-gray-500 mt-6 text-center">
          Bezpieczne logowanie przez Supabase Auth
        </p>
      </div>
    </main>
  )
}
