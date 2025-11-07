'use client'

import { useState, useEffect } from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { showToast } from '@/lib/toast'

interface UserData {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  locale: string
}

interface Preferences {
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
  }
  theme: string
  language: string
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [userData, setUserData] = useState<UserData | null>(null)
  const [preferences, setPreferences] = useState<Preferences>({
    notifications: { email: true, push: false, sms: false },
    theme: 'light',
    language: 'pl-PL',
  })

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  })

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  })

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      setLoading(true)
      
      const userRes = await fetch('/api/users/me')
      if (!userRes.ok) throw new Error('Failed to load user data')
      const user = await userRes.json()
      
      setUserData(user)
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
      })

      const prefRes = await fetch('/api/users/me/preferences')
      if (prefRes.ok) {
        const prefs = await prefRes.json()
        setPreferences(prefs)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      setError(null)

      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save profile')
      }

      showToast.success('Profil zapisany', 'Twoje dane zostały zaktualizowane')
      await loadUserData()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      showToast.error('Błąd zapisu profilu', message)
    } finally {
      setSaving(false)
    }
  }

  const handleSavePreferences = async () => {
    try {
      setSaving(true)
      setError(null)

      const res = await fetch('/api/users/me/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save preferences')
      }

      showToast.success('Preferencje zapisane', 'Ustawienia zostały zaktualizowane')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      showToast.error('Błąd zapisu preferencji', message)
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    try {
      setError(null)

      if (!passwords.current || !passwords.new || !passwords.confirm) {
        const message = 'Wszystkie pola hasła są wymagane'
        setError(message)
        showToast.warning('Sprawdź formularz', message)
        return
      }

      if (passwords.new !== passwords.confirm) {
        const message = 'Nowe hasła nie są identyczne!'
        setError(message)
        showToast.warning('Sprawdź formularz', message)
        return
      }

      if (passwords.new.length < 8) {
        const message = 'Nowe hasło musi mieć min. 8 znaków'
        setError(message)
        showToast.warning('Sprawdź formularz', message)
        return
      }

      setSaving(true)

      const res = await fetch('/api/users/me/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.new,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to change password')
      }

      showToast.success('Hasło zmienione', 'Nowe hasło zostało ustawione')
      setPasswords({ current: '', new: '', confirm: '' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      showToast.error('Błąd zmiany hasła', message)
    } finally {
      setSaving(false)
    }
  }

  const handleNotificationToggle = async (type: 'email' | 'push' | 'sms') => {
    const newPreferences = {
      ...preferences,
      notifications: {
        ...preferences.notifications,
        [type]: !preferences.notifications[type],
      },
    }
    setPreferences(newPreferences)
    
    try {
      await fetch('/api/users/me/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPreferences),
      })
    } catch (err) {
      console.error('Failed to save notification preference:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <div className="text-xl font-semibold text-gray-700">Ładowanie ustawień...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-4xl font-bold text-transparent">
            Ustawienia ⚙️
          </h1>
          <p className="text-gray-600">Zarządzaj swoim profilem i preferencjami</p>
        </div>

        {error && (
          <Card variant="glass" className="border-2 border-red-300 bg-red-50/50">
            <CardBody>
              <div className="flex items-center gap-3 text-red-700">
                <span className="text-2xl">❌</span>
                <span className="font-semibold">{error}</span>
              </div>
            </CardBody>
          </Card>
        )}

        <Card variant="glass">
          <CardHeader>
            <h2 className="text-2xl font-bold">👤 Profil</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Imię i nazwisko"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
              />
              <Input
                label="Telefon"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
              />
              <Input
                label="Email"
                type="email"
                value={userData?.email || ''}
                disabled
                className="opacity-60 cursor-not-allowed col-span-full md:col-span-2"
              />
            </div>
            <div className="mt-6 flex justify-end">
              <Button 
                variant="primary" 
                onClick={handleSaveProfile}
                disabled={saving}
              >
                {saving ? '💾 Zapisywanie...' : '💾 Zapisz zmiany'}
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <h2 className="text-2xl font-bold">🔔 Powiadomienia</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-white/60 p-4">
                <div>
                  <div className="font-bold text-gray-900">Email</div>
                  <div className="text-sm text-gray-600">Powiadomienia na adres e-mail</div>
                </div>
                <button
                  onClick={() => handleNotificationToggle('email')}
                  className={`relative h-8 w-14 rounded-full transition-colors ${
                    preferences.notifications.email ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
                      preferences.notifications.email ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-white/60 p-4">
                <div>
                  <div className="font-bold text-gray-900">Push</div>
                  <div className="text-sm text-gray-600">Powiadomienia push w aplikacji</div>
                </div>
                <button
                  onClick={() => handleNotificationToggle('push')}
                  className={`relative h-8 w-14 rounded-full transition-colors ${
                    preferences.notifications.push ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
                      preferences.notifications.push ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-white/60 p-4">
                <div>
                  <div className="font-bold text-gray-900">SMS</div>
                  <div className="text-sm text-gray-600">Powiadomienia SMS</div>
                </div>
                <button
                  onClick={() => handleNotificationToggle('sms')}
                  className={`relative h-8 w-14 rounded-full transition-colors ${
                    preferences.notifications.sms ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
                      preferences.notifications.sms ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <h2 className="text-2xl font-bold">🔒 Zmiana hasła</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <Input
                label="Obecne hasło"
                type="password"
                value={passwords.current}
                onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
              />
              <Input
                label="Nowe hasło"
                type="password"
                value={passwords.new}
                onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
              />
              <Input
                label="Potwierdź nowe hasło"
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
              />
              <div className="flex justify-end">
                <Button variant="primary" onClick={handleChangePassword}>
                  🔑 Zmień hasło
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <h2 className="text-2xl font-bold">🌍 Język i region</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Język</label>
                <select
                  value={preferences.language}
                  onChange={(e) => setPreferences(prev => ({...prev, language: e.target.value as 'pl' | 'en'}))}
                  className="w-full rounded-xl border border-white/40 bg-white/60 px-4 py-2 backdrop-blur-xl transition-all hover:border-purple-300 focus:border-purple-500 focus:outline-none"
                >
                  <option value="pl">🇵🇱 Polski</option>
                  <option value="en">🇬🇧 English</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Motyw</label>
                <select
                  value={preferences.theme}
                  onChange={(e) => setPreferences(prev => ({...prev, theme: e.target.value as 'light' | 'dark' | 'auto'}))}
                  className="w-full rounded-xl border border-white/40 bg-white/60 px-4 py-2 backdrop-blur-xl transition-all hover:border-purple-300 focus:border-purple-500 focus:outline-none"
                >
                  <option value="light">☀️ Jasny</option>
                  <option value="dark">🌙 Ciemny</option>
                  <option value="auto">🔄 Automatyczny</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button 
                variant="primary" 
                onClick={handleSavePreferences}
                disabled={saving}
              >
                {saving ? '💾 Zapisywanie...' : '💾 Zapisz preferencje'}
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <h2 className="text-2xl font-bold">🛡️ Prywatność</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-white/60 p-4">
                <div className="font-medium text-gray-900">Pokaż profil współpracownikom</div>
                <Badge variant="success">Włączone</Badge>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white/60 p-4">
                <div className="font-medium text-gray-900">Historia zmian dostępna dla menedżerów</div>
                <Badge variant="success">Włączone</Badge>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white/60 p-4">
                <div className="font-medium text-gray-900">Udostępniaj statystyki właścicielowi</div>
                <Badge variant="success">Włączone</Badge>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
