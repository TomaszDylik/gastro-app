'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Copy, RefreshCw, CheckCircle, AlertCircle, Plus, Edit2, Trash2, X, Save } from 'lucide-react'

interface Restaurant {
  id: string
  name: string
  inviteToken: string | null
}

interface Department {
  id: string
  name: string
  roleTag: string
  color: string
  isActive: boolean
  _count?: {
    memberships: number
    shifts: number
  }
}

interface DepartmentForm {
  name: string
  roleTag: string
  color: string
}

export default function SettingsPage() {
  const params = useParams()
  const restaurantId = params.restaurantId as string

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [error, setError] = useState('')

  // Departments state
  const [departments, setDepartments] = useState<Department[]>([])
  const [departmentsLoading, setDepartmentsLoading] = useState(true)
  const [showDepartmentForm, setShowDepartmentForm] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [departmentForm, setDepartmentForm] = useState<DepartmentForm>({
    name: '',
    roleTag: '',
    color: '#3B82F6',
  })
  const [savingDepartment, setSavingDepartment] = useState(false)

  useEffect(() => {
    loadRestaurant()
    loadDepartments()
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

  // Departments functions
  const loadDepartments = async () => {
    try {
      setDepartmentsLoading(true)
      const res = await fetch(`/api/manager/${restaurantId}/departments`)
      if (!res.ok) throw new Error('Failed to load departments')
      const data = await res.json()
      setDepartments(data.departments || [])
    } catch (err) {
      console.error('Failed to load departments:', err)
    } finally {
      setDepartmentsLoading(false)
    }
  }

  const openDepartmentForm = (department?: Department) => {
    if (department) {
      setEditingDepartment(department)
      setDepartmentForm({
        name: department.name,
        roleTag: department.roleTag,
        color: department.color,
      })
    } else {
      setEditingDepartment(null)
      setDepartmentForm({
        name: '',
        roleTag: '',
        color: '#3B82F6',
      })
    }
    setShowDepartmentForm(true)
    setError('')
  }

  const closeDepartmentForm = () => {
    setShowDepartmentForm(false)
    setEditingDepartment(null)
    setDepartmentForm({ name: '', roleTag: '', color: '#3B82F6' })
    setError('')
  }

  const saveDepartment = async () => {
    if (!departmentForm.name.trim() || !departmentForm.roleTag.trim()) {
      setError('Nazwa i tag roli są wymagane')
      return
    }

    setSavingDepartment(true)
    setError('')

    try {
      if (editingDepartment) {
        // Update existing department
        const res = await fetch(`/api/departments/${editingDepartment.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(departmentForm),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to update department')
        }
      } else {
        // Create new department
        const res = await fetch(`/api/manager/${restaurantId}/departments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(departmentForm),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to create department')
        }
      }

      await loadDepartments()
      closeDepartmentForm()
    } catch (err: any) {
      setError(err.message || 'Nie udało się zapisać działu')
    } finally {
      setSavingDepartment(false)
    }
  }

  const toggleDepartmentActive = async (department: Department) => {
    try {
      const res = await fetch(`/api/departments/${department.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !department.isActive }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update department')
      }

      await loadDepartments()
    } catch (err: any) {
      setError(err.message || 'Nie udało się zaktualizować działu')
    }
  }

  const deleteDepartment = async (department: Department) => {
    const hasAssignments = (department._count?.memberships || 0) > 0 || (department._count?.shifts || 0) > 0

    if (hasAssignments) {
      const confirmed = confirm(
        `Dział "${department.name}" ma przypisanych ${department._count?.memberships || 0} pracowników i ${department._count?.shifts || 0} zmian. Chcesz go dezaktywować?`
      )
      if (confirmed) {
        await toggleDepartmentActive(department)
      }
      return
    }

    const confirmed = confirm(`Czy na pewno chcesz usunąć dział "${department.name}"?`)
    if (!confirmed) return

    try {
      const res = await fetch(`/api/departments/${department.id}?hard=true`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete department')
      }

      await loadDepartments()
    } catch (err: any) {
      setError(err.message || 'Nie udało się usunąć działu')
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

      {/* Departments Management */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">🏢 Działy / Grafiki</h2>
          <button
            onClick={() => openDepartmentForm()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Dodaj dział
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          Zarządzaj działami w restauracji. Każdy dział może mieć przypisanych pracowników i zmiany.
        </p>

        {departmentsLoading ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">⏳</div>
            <div className="text-gray-600">Ładowanie działów...</div>
          </div>
        ) : departments.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-4xl mb-2">📁</div>
            <p className="text-gray-600 mb-4">Brak działów</p>
            <button
              onClick={() => openDepartmentForm()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Dodaj pierwszy dział
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className={`p-4 rounded-lg border-2 ${
                  dept.isActive
                    ? 'border-gray-200 bg-white'
                    : 'border-gray-300 bg-gray-100 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: dept.color }}
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                      <p className="text-sm text-gray-500">Tag: {dept.roleTag}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openDepartmentForm(dept)}
                      className="p-2 hover:bg-gray-200 rounded transition-colors"
                      title="Edytuj"
                    >
                      <Edit2 className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => deleteDepartment(dept)}
                      className="p-2 hover:bg-red-100 rounded transition-colors"
                      title="Usuń"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>👥 {dept._count?.memberships || 0} pracowników</span>
                  <span>📅 {dept._count?.shifts || 0} zmian</span>
                </div>

                {!dept.isActive && (
                  <div className="mt-3 text-xs text-gray-500 bg-yellow-50 p-2 rounded">
                    ⚠️ Dział nieaktywny
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Department Form Modal */}
        {showDepartmentForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">
                  {editingDepartment ? 'Edytuj dział' : 'Nowy dział'}
                </h3>
                <button
                  onClick={closeDepartmentForm}
                  className="p-2 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nazwa działu *
                  </label>
                  <input
                    type="text"
                    value={departmentForm.name}
                    onChange={(e) =>
                      setDepartmentForm({ ...departmentForm, name: e.target.value })
                    }
                    placeholder="np. Kuchnia, Bar, Sala"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tag roli *
                  </label>
                  <input
                    type="text"
                    value={departmentForm.roleTag}
                    onChange={(e) =>
                      setDepartmentForm({
                        ...departmentForm,
                        roleTag: e.target.value.toLowerCase(),
                      })
                    }
                    placeholder="np. cook, bartender, waiter"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!!editingDepartment}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {editingDepartment
                      ? 'Tag roli nie może być zmieniony po utworzeniu'
                      : 'Unikalny identyfikator działu (małe litery, bez spacji)'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kolor
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={departmentForm.color}
                      onChange={(e) =>
                        setDepartmentForm({ ...departmentForm, color: e.target.value })
                      }
                      className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={departmentForm.color}
                      onChange={(e) =>
                        setDepartmentForm({ ...departmentForm, color: e.target.value })
                      }
                      placeholder="#3B82F6"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Kolor do wyświetlania w interfejsie
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={closeDepartmentForm}
                  disabled={savingDepartment}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Anuluj
                </button>
                <button
                  onClick={saveDepartment}
                  disabled={savingDepartment}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                >
                  {savingDepartment ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Zapisywanie...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Zapisz
                    </>
                  )}
                </button>
              </div>
            </div>
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
