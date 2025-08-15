import { cookies } from 'next/headers'

export type Theme = 'light' | 'dark' | 'system'

export const THEME_COOKIE = 'stackdock-theme'

export async function getTheme(): Promise<Theme> {
  const cookieStore = await cookies()
  const theme = cookieStore.get(THEME_COOKIE)?.value as Theme
  return theme || 'system'
}

export async function getEffectiveTheme(): Promise<'light' | 'dark'> {
  const theme = await getTheme()
  
  if (theme === 'system') {
    // Default to light for system preference on server
    // Client-side script will correct this
    return 'light'
  }
  
  return theme
}
