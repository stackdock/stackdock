/**
 * Shared formatting utilities for resource tables
 */

/**
 * Format a timestamp to relative time or date
 */
export function formatDate(timestamp?: number): string {
  if (!timestamp) return "N/A"
  const date = new Date(timestamp)
  const now = Date.now()
  const diff = now - timestamp
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  
  return date.toLocaleDateString()
}

/**
 * Format expiry date with days remaining
 */
export function formatExpiryDate(expiresAt?: number): string {
  if (!expiresAt) return "N/A"
  const now = Date.now()
  const diff = expiresAt - now
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days < 0) return "Expired"
  if (days === 0) return "Expires today"
  if (days === 1) return "Expires tomorrow"
  if (days < 30) return `Expires in ${days} days`
  
  return new Date(expiresAt).toLocaleDateString()
}

/**
 * Check if domain is expiring soon (within 30 days)
 */
export function isExpiringSoon(expiresAt?: number): boolean {
  if (!expiresAt) return false
  const now = Date.now()
  const diff = expiresAt - now
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  return days >= 0 && days <= 30
}

/**
 * Format bytes to human-readable string (KB, MB, GB, TB)
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
}
