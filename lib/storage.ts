/**
 * ETAP 13: Eksport i Storage
 *
 * Upload exported files to Supabase Storage
 * Generate signed URLs with 7-day expiry
 * 3-year retention policy
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const BUCKET_NAME = 'exports'
const SIGNED_URL_EXPIRY = 7 * 24 * 60 * 60 // 7 days in seconds

/**
 * Upload file to Supabase Storage
 */
export async function uploadExportFile(
  filePath: string,
  fileBuffer: Buffer,
  contentType: string,
): Promise<{ path: string; error: Error | null }> {
  const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(filePath, fileBuffer, {
    contentType,
    upsert: true,
  })

  if (error) {
    console.error('Storage upload error:', error)
    return { path: '', error }
  }

  return { path: data.path, error: null }
}

/**
 * Generate signed URL for download (7-day expiry)
 */
export async function getSignedUrl(filePath: string): Promise<{ url: string; error: Error | null }> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, SIGNED_URL_EXPIRY)

  if (error) {
    console.error('Signed URL error:', error)
    return { url: '', error }
  }

  return { url: data.signedUrl, error: null }
}

/**
 * Delete old exports (3-year retention)
 */
export async function cleanupOldExports(restaurantId: string): Promise<{
  deletedCount: number
  deletedFiles: string[]
}> {
  const threeYearsAgo = new Date()
  threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3)

  const { data: files } = await supabase.storage.from(BUCKET_NAME).list(`${restaurantId}/`, {
    limit: 1000,
    sortBy: { column: 'created_at', order: 'asc' },
  })

  if (!files || files.length === 0) {
    return { deletedCount: 0, deletedFiles: [] }
  }

  const filesToDelete = files
    .filter((file) => {
      const createdAt = new Date(file.created_at)
      return createdAt < threeYearsAgo
    })
    .map((file) => `${restaurantId}/${file.name}`)

  if (filesToDelete.length > 0) {
    const { error } = await supabase.storage.from(BUCKET_NAME).remove(filesToDelete)

    if (error) {
      console.error('Cleanup error:', error)
      return { deletedCount: 0, deletedFiles: [] }
    }

    console.log(`Cleaned up ${filesToDelete.length} old exports`)
    return { deletedCount: filesToDelete.length, deletedFiles: filesToDelete }
  }

  return { deletedCount: 0, deletedFiles: [] }
}

/**
 * List all exports for a restaurant
 */
export async function listExports(restaurantId: string): Promise<{
  files: Array<{ name: string; createdAt: string; size: number }>
  error: Error | null
}> {
  const { data: files, error } = await supabase.storage.from(BUCKET_NAME).list(`${restaurantId}/`, {
    limit: 100,
    sortBy: { column: 'created_at', order: 'desc' },
  })

  if (error) {
    console.error('List exports error:', error)
    return { files: [], error }
  }

  return {
    files: files.map((file) => ({
      name: file.name,
      createdAt: file.created_at,
      size: file.metadata?.size || 0,
    })),
    error: null,
  }
}
