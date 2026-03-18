import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { familia } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireSession } from '@/lib/session'

export async function GET() {
  const { user, error } = await requireSession()
  if (error) return error

  const [fam] = db.select().from(familia).where(eq(familia.id, user.familiaId)).all()
  return NextResponse.json(fam ?? null)
}
