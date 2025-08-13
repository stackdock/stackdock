'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { THEME_COOKIE, type Theme } from '@/lib/theme'

export async function updateTheme(theme: Theme, redirectPath?: string) {
  const cookieStore = await cookies()
  
  cookieStore.set({
    name: THEME_COOKIE,
    value: theme,
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })

  if (redirectPath) {
    redirect(redirectPath)
  }
}
