type ClassValue = string | number | null | undefined | Record<string, boolean> | ClassValue[]

function toClassName(value: ClassValue): string {
  if (!value) return ''
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (Array.isArray(value)) return value.map(toClassName).filter(Boolean).join(' ')
  if (typeof value === 'object') {
    return Object.entries(value)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([key]) => key)
      .join(' ')
  }
  return ''
}

export function cn(...inputs: ClassValue[]) {
  const classes = inputs.map(toClassName).filter(Boolean).join(' ')
  // naive dedupe to avoid duplicate classes
  return Array.from(new Set(classes.split(/\s+/).filter(Boolean))).join(' ')
}
