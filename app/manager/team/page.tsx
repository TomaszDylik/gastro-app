'use client'

import { useState } from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface Employee {
  id: number
  name: string
  role: string
  status: 'active' | 'inactive' | 'onLeave'
  avatar: string
  email: string
  phone: string
  hoursThisWeek: number
  hoursThisMonth: number
}

export default function TeamPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const employees: Employee[] = [
    { id: 1, name: 'Anna Kowalska', role: 'Kelnerka', status: 'active', avatar: '👩‍🦰', email: 'anna@example.com', phone: '+48 123 456 789', hoursThisWeek: 32, hoursThisMonth: 128 },
    { id: 2, name: 'Jan Nowak', role: 'Kucharz', status: 'active', avatar: '👨‍🍳', email: 'jan@example.com', phone: '+48 234 567 890', hoursThisWeek: 40, hoursThisMonth: 160 },
    { id: 3, name: 'Maria Wiśniewska', role: 'Barista', status: 'active', avatar: '👩‍💼', email: 'maria@example.com', phone: '+48 345 678 901', hoursThisWeek: 24, hoursThisMonth: 96 },
    { id: 4, name: 'Piotr Kowalski', role: 'Kelner', status: 'onLeave', avatar: '👨', email: 'piotr@example.com', phone: '+48 456 789 012', hoursThisWeek: 0, hoursThisMonth: 64 },
    { id: 5, name: 'Ewa Nowak', role: 'Kelnerka', status: 'active', avatar: '👱‍♀️', email: 'ewa@example.com', phone: '+48 567 890 123', hoursThisWeek: 28, hoursThisMonth: 112 },
    { id: 6, name: 'Tomasz Zieliński', role: 'Barman', status: 'inactive', avatar: '👨‍🦱', email: 'tomasz@example.com', phone: '+48 678 901 234', hoursThisWeek: 0, hoursThisMonth: 0 },
  ]

  const roles = ['all', 'Kelnerka', 'Kelner', 'Kucharz', 'Barista', 'Barman']
  const statuses = ['all', 'active', 'inactive', 'onLeave']

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         emp.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'all' || emp.role === filterRole
    const matchesStatus = filterStatus === 'all' || emp.status === filterStatus
    return matchesSearch && matchesRole && matchesStatus
  })

  const statusLabels: Record<string, string> = {
    active: 'Aktywny',
    inactive: 'Nieaktywny',
    onLeave: 'Urlop'
  }

  const statusVariants: Record<string, 'success' | 'danger' | 'warning'> = {
    active: 'success',
    inactive: 'danger',
    onLeave: 'warning'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-4xl font-bold text-transparent">
              Zespół 👥
            </h1>
            <p className="text-gray-600">Zarządzaj swoim zespołem pracowników</p>
          </div>
          <Button variant="primary">
            ➕ Dodaj pracownika
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card variant="gradient">
            <CardBody className="text-center">
              <div className="text-4xl mb-2">👥</div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {employees.length}
              </div>
              <div className="text-sm text-gray-600">Wszyscy pracownicy</div>
            </CardBody>
          </Card>

          <Card variant="gradient">
            <CardBody className="text-center">
              <div className="text-4xl mb-2">✅</div>
              <div className="text-3xl font-bold text-green-600 mb-1">
                {employees.filter(e => e.status === 'active').length}
              </div>
              <div className="text-sm text-gray-600">Aktywni</div>
            </CardBody>
          </Card>

          <Card variant="gradient">
            <CardBody className="text-center">
              <div className="text-4xl mb-2">🏖️</div>
              <div className="text-3xl font-bold text-yellow-600 mb-1">
                {employees.filter(e => e.status === 'onLeave').length}
              </div>
              <div className="text-sm text-gray-600">Na urlopie</div>
            </CardBody>
          </Card>

          <Card variant="gradient">
            <CardBody className="text-center">
              <div className="text-4xl mb-2">❌</div>
              <div className="text-3xl font-bold text-red-600 mb-1">
                {employees.filter(e => e.status === 'inactive').length}
              </div>
              <div className="text-sm text-gray-600">Nieaktywni</div>
            </CardBody>
          </Card>
        </div>

        <Card variant="glass">
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <h2 className="text-2xl font-bold">🔍 Filtruj pracowników</h2>
              <div className="flex flex-col gap-3 md:flex-row">
                <Input
                  placeholder="Szukaj po nazwisku lub emailu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="md:w-64"
                />
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="rounded-xl border border-white/40 bg-white/60 px-4 py-2 backdrop-blur-xl transition-all hover:border-orange-300 focus:border-orange-500 focus:outline-none"
                >
                  {roles.map(role => (
                    <option key={role} value={role}>
                      {role === 'all' ? 'Wszystkie role' : role}
                    </option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="rounded-xl border border-white/40 bg-white/60 px-4 py-2 backdrop-blur-xl transition-all hover:border-orange-300 focus:border-orange-500 focus:outline-none"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status === 'all' ? 'Wszystkie statusy' : statusLabels[status]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEmployees.map(employee => (
            <Card key={employee.id} variant="glass">
              <CardBody>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center text-3xl">
                      {employee.avatar}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{employee.name}</h3>
                      <p className="text-sm text-gray-600">{employee.role}</p>
                    </div>
                  </div>
                  <Badge variant={statusVariants[employee.status]}>
                    {statusLabels[employee.status]}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>📧</span>
                    <span>{employee.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>📱</span>
                    <span>{employee.phone}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-lg bg-white/60 p-3 text-center">
                    <div className="text-2xl font-bold text-gray-900">{employee.hoursThisWeek}h</div>
                    <div className="text-xs text-gray-600">Ten tydzień</div>
                  </div>
                  <div className="rounded-lg bg-white/60 p-3 text-center">
                    <div className="text-2xl font-bold text-gray-900">{employee.hoursThisMonth}h</div>
                    <div className="text-xs text-gray-600">Ten miesiąc</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="flex-1">
                    📊 Profil
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1">
                    ✏️ Edytuj
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1">
                    📅 Grafik
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {filteredEmployees.length === 0 && (
          <Card variant="glass">
            <CardBody className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Brak wyników</h3>
              <p className="text-gray-600">Nie znaleziono pracowników spełniających kryteria wyszukiwania</p>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  )
}
