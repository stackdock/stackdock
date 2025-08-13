import { cookies } from 'next/headers'

export type Theme = 'light' | 'dark' | 'system'

export const THEME_COOKIE = 'stackdock-theme'

export async function getTheme(): Promise<Theme> {
  const cookieStore = await cookies()
  const theme = cookieStore.get(THEME_COOKIE)?.value as Theme
  return theme || 'system'
}

export function getEffectiveTheme(theme: Theme, systemPreference?: 'light' | 'dark'): 'light' | 'dark' {
  if (theme === 'system') {
    return systemPreference || 'light'
  }
  return theme
}
