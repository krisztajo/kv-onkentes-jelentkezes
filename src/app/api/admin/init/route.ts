import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  // Only allow in non-production for safety
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ success: false, error: 'Not allowed in production' }, { status: 403 })
  }

  try {
    let body: Record<string, any> = {}
    try {
      body = await request.json() as Record<string, any>
    } catch {}
    const email = (body.email as string) || 'admin@example.com'
    const password = (body.password as string) || 'admin123'
    const name = (body.name as string) || 'Admin'

    const db = getDB()

    // Check existing
    const existing = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()

    const passwordHash = hashPassword(password)

    if (existing && existing.id) {
      await db.prepare('UPDATE users SET password_hash = ?, name = ?, role = ? WHERE id = ?')
        .bind(passwordHash, name, 'admin', existing.id)
        .run()
    } else {
      await db.prepare('INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)')
        .bind(email, passwordHash, name, 'admin')
        .run()
    }

    return NextResponse.json({ success: true, email, password })
  } catch (err) {
    console.error('Admin init error:', err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
