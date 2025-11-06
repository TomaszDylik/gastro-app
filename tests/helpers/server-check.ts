/**
 * Helper to check if dev server is running before API tests
 */

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

let serverCheckCache: boolean | null = null
let serverCheckPromise: Promise<boolean> | null = null

export async function isServerRunning(): Promise<boolean> {
  // Return cached result if available
  if (serverCheckCache !== null) {
    return serverCheckCache
  }

  // If check is already in progress, return the same promise
  if (serverCheckPromise) {
    return serverCheckPromise
  }

  // Start new check
  serverCheckPromise = (async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 2000)
      
      const response = await fetch(API_BASE, {
        signal: controller.signal,
        method: 'HEAD',
      })
      
      clearTimeout(timeoutId)
      const isRunning = response.ok || response.status < 500
      serverCheckCache = isRunning
      return isRunning
    } catch (error) {
      serverCheckCache = false
      return false
    } finally {
      serverCheckPromise = null
    }
  })()

  return serverCheckPromise
}

