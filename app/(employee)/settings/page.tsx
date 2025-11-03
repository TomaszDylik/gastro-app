'use client'

import { useState } from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    firstName: 'Anna',
    lastName: 'Kowalska',
    email: 'anna.kowalska@example.com',
    phone: '+48 123 456 789',
    language: 'pl',
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    theme: 'light'
  })

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNotificationToggle = (type: 'email' | 'push' | 'sms') => {
    setFormData(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [type]: !prev.notifications[type] }
    }))
  }

  const handleSaveProfile = () => {
    console.log('Zapisywanie profilu:', formData)
    alert('Profil zapisany!')
  }

  const handleChangePassword = () => {
    if (passwords.new !== passwords.confirm) {
      alert('Nowe hasła nie są identyczne!')
      return
    }
    console.log('Zmiana hasła')
    alert('Hasło zmienione!')
    setPasswords({ current: '', new: '', confirm: '' })
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

        <Card variant="glass">
          <CardHeader>
            <h2 className="text-2xl font-bold">👤 Profil</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Imię"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
              />
              <Input
                label="Nazwisko"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
              <Input
                label="Telefon"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </div>
            <div className="mt-6 flex justify-end">
              <Button variant="primary" onClick={handleSaveProfile}>
                💾 Zapisz zmiany
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
                    formData.notifications.email ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
                      formData.notifications.email ? 'translate-x-7' : 'translate-x-1'
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
                    formData.notifications.push ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
                      formData.notifications.push ? 'translate-x-7' : 'translate-x-1'
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
                    formData.notifications.sms ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
                      formData.notifications.sms ? 'translate-x-7' : 'translate-x-1'
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
                  value={formData.language}
                  onChange={(e) => handleInputChange('language', e.target.value)}
                  className="w-full rounded-xl border border-white/40 bg-white/60 px-4 py-2 backdrop-blur-xl transition-all hover:border-purple-300 focus:border-purple-500 focus:outline-none"
                >
                  <option value="pl">🇵🇱 Polski</option>
                  <option value="en">🇬🇧 English</option>
                  <option value="de">🇩🇪 Deutsch</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Motyw</label>
                <select
                  value={formData.theme}
                  onChange={(e) => handleInputChange('theme', e.target.value)}
                  className="w-full rounded-xl border border-white/40 bg-white/60 px-4 py-2 backdrop-blur-xl transition-all hover:border-purple-300 focus:border-purple-500 focus:outline-none"
                >
                  <option value="light">☀️ Jasny</option>
                  <option value="dark">🌙 Ciemny</option>
                  <option value="auto">🔄 Automatyczny</option>
                </select>
              </div>
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
