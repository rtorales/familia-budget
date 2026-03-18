import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { NextResponse } from 'next/server'

export interface SessionUser {
  id: string
  email: string
  name: string
  familiaId: string
}

export async function getSession() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null
  return session.user as SessionUser
}

export async function requireSession() {
  const user = await getSession()
  if (!user) {
    return { user: null, error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  }
  return { user, error: null }
}
