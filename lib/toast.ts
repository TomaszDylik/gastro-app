import { toast } from 'sonner'

/**
 * Toast notification utilities with predefined styles
 * Uses sonner library for beautiful, customizable toasts
 */

export const showToast = {
  /**
   * Success toast - green checkmark
   */
  success: (message: string, description?: string) => {
    toast.success(message, {
      description,
      icon: '✅',
    })
  },

  /**
   * Error toast - red X
   */
  error: (message: string, description?: string) => {
    toast.error(message, {
      description,
      icon: '❌',
    })
  },

  /**
   * Info toast - blue info icon
   */
  info: (message: string, description?: string) => {
    toast.info(message, {
      description,
      icon: 'ℹ️',
    })
  },

  /**
   * Warning toast - yellow warning icon
   */
  warning: (message: string, description?: string) => {
    toast.warning(message, {
      description,
      icon: '⚠️',
    })
  },

  /**
   * Loading toast - shows spinner
   */
  loading: (message: string, description?: string) => {
    return toast.loading(message, {
      description,
      icon: '⏳',
    })
  },

  /**
   * Promise toast - shows loading, then success/error based on promise result
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    }
  ) => {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    })
  },

  /**
   * Custom toast with custom icon
   */
  custom: (message: string, options?: { icon?: string; description?: string; duration?: number }) => {
    toast(message, {
      description: options?.description,
      icon: options?.icon,
      duration: options?.duration,
    })
  },

  /**
   * Dismiss all toasts
   */
  dismissAll: () => {
    toast.dismiss()
  },

  /**
   * Dismiss specific toast by id
   */
  dismiss: (id: string | number) => {
    toast.dismiss(id)
  },
}

// Convenience aliases
export const { success, error, info, warning, loading } = showToast
