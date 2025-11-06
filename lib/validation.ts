import { z } from 'zod'

/**
 * Reusable validation schemas using Zod
 * These schemas can be used for both client-side and server-side validation
 */

// ===== User Profile Validation =====

export const profileSchema = z.object({
  name: z.string().min(2, 'Imię musi mieć min. 2 znaki').max(100, 'Imię może mieć max. 100 znaków'),
  phone: z.string()
    .regex(/^\+?[0-9\s\-()]{9,20}$/, 'Nieprawidłowy format telefonu')
    .optional()
    .or(z.literal('')),
})

export type ProfileFormData = z.infer<typeof profileSchema>

// ===== Password Validation =====

export const passwordSchema = z.object({
  current: z.string().min(1, 'Obecne hasło jest wymagane'),
  new: z.string()
    .min(8, 'Hasło musi mieć min. 8 znaków')
    .regex(/[a-z]/, 'Hasło musi zawierać małą literę')
    .regex(/[A-Z]/, 'Hasło musi zawierać wielką literę')
    .regex(/[0-9]/, 'Hasło musi zawierać cyfrę'),
  confirm: z.string(),
}).refine((data) => data.new === data.confirm, {
  message: 'Hasła nie są identyczne',
  path: ['confirm'],
})

export type PasswordFormData = z.infer<typeof passwordSchema>

// ===== Preferences Validation =====

export const preferencesSchema = z.object({
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    sms: z.boolean(),
  }),
  theme: z.enum(['light', 'dark', 'auto']),
  language: z.enum(['pl-PL', 'en-US', 'de-DE']),
})

export type PreferencesFormData = z.infer<typeof preferencesSchema>

// ===== Time Entry Validation =====

export const timeEntrySchema = z.object({
  clockIn: z.date(),
  clockOut: z.date().optional(),
  adjustmentMinutes: z.number().int().min(-480).max(480).default(0), // Max ±8 hours adjustment
}).refine((data) => {
  if (data.clockOut) {
    return data.clockOut > data.clockIn
  }
  return true
}, {
  message: 'Czas wyjścia musi być późniejszy niż czas wejścia',
  path: ['clockOut'],
})

export type TimeEntryFormData = z.infer<typeof timeEntrySchema>

// ===== Schedule Validation =====

export const scheduleSchema = z.object({
  name: z.string().min(3, 'Nazwa musi mieć min. 3 znaki').max(100, 'Nazwa może mieć max. 100 znaków'),
  isActive: z.boolean().default(true),
})

export type ScheduleFormData = z.infer<typeof scheduleSchema>

// ===== Shift Validation =====

export const shiftSchema = z.object({
  date: z.date(),
  startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Nieprawidłowy format czasu (HH:MM)'),
  endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Nieprawidłowy format czasu (HH:MM)'),
  role: z.string().min(1, 'Rola jest wymagana'),
  notes: z.string().max(500, 'Notatki mogą mieć max. 500 znaków').optional(),
}).refine((data) => {
  const [startHour, startMinute] = data.startTime.split(':').map(Number)
  const [endHour, endMinute] = data.endTime.split(':').map(Number)
  const startMinutes = startHour * 60 + startMinute
  const endMinutes = endHour * 60 + endMinute
  
  // Allow overnight shifts (end time can be "earlier" than start time)
  return endMinutes !== startMinutes
}, {
  message: 'Czas rozpoczęcia i zakończenia nie mogą być takie same',
  path: ['endTime'],
})

export type ShiftFormData = z.infer<typeof shiftSchema>

// ===== Restaurant Validation =====

export const restaurantSchema = z.object({
  name: z.string().min(3, 'Nazwa musi mieć min. 3 znaki').max(100, 'Nazwa może mieć max. 100 znaków'),
  address: z.string().min(5, 'Adres musi mieć min. 5 znaków').max(200, 'Adres może mieć max. 200 znaków').optional(),
  phone: z.string()
    .regex(/^\+?[0-9\s\-()]{9,20}$/, 'Nieprawidłowy format telefonu')
    .optional(),
  timezone: z.string().default('Europe/Warsaw'),
})

export type RestaurantFormData = z.infer<typeof restaurantSchema>

// ===== Invite Validation =====

export const inviteSchema = z.object({
  email: z.string().email('Nieprawidłowy adres email'),
  firstName: z.string().min(2, 'Imię musi mieć min. 2 znaki').max(50, 'Imię może mieć max. 50 znaków'),
  lastName: z.string().min(2, 'Nazwisko musi mieć min. 2 znaki').max(50, 'Nazwisko może mieć max. 50 znaków'),
  role: z.enum(['employee', 'manager']),
})

export type InviteFormData = z.infer<typeof inviteSchema>

// ===== Helper Functions =====

/**
 * Validate data against a schema and return formatted errors
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean
  data?: T
  errors?: Record<string, string>
} {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return {
      success: true,
      data: result.data,
    }
  }
  
  const errors: Record<string, string> = {}
  result.error.errors.forEach((err) => {
    const path = err.path.join('.')
    errors[path] = err.message
  })
  
  return {
    success: false,
    errors,
  }
}

/**
 * Get first error message from validation result
 */
export function getFirstError(errors?: Record<string, string>): string | null {
  if (!errors) return null
  const keys = Object.keys(errors)
  return keys.length > 0 ? errors[keys[0]] : null
}
