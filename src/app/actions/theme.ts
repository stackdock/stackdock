'use server'

import { cookies } from 'next/headers'
import { THEME_COOKIE, type Theme } from '@/lib/theme'

export async function updateTheme(theme: Theme) {
  const cookieStore = await cookies()
  
  cookieStore.set({
    name: THEME_COOKIE,
    value: theme,
    httpOnly: false, // Allow client-side access
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/',
  })
}
