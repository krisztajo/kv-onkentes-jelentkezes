import { NextRequest, NextResponse } from 'next/server'
import { createToken, hashPassword, verifyPassword } from '@/lib/auth'
import { getUserWithPassword } from '@/lib/db'
import { loginSchema } from '@/lib/validation'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		
		const validation = loginSchema.safeParse(body)
		if (!validation.success) {
			return NextResponse.json(
				{ success: false, error: validation.error.errors[0].message },
				{ status: 400 }
			)
		}
		
		const { email, password } = validation.data
		
		// Get user with password
		const user = await getUserWithPassword(email)
		if (!user) {
			return NextResponse.json(
				{ success: false, error: 'Hibás email cím vagy jelszó' },
				{ status: 401 }
			)
		}
		
		// Verify password
		if (!verifyPassword(password, user.password_hash)) {
			return NextResponse.json(
				{ success: false, error: 'Hibás email cím vagy jelszó' },
				{ status: 401 }
			)
		}
		
		// Create token
		const token = await createToken({
			id: user.id,
			email: user.email,
			name: user.name,
			role: user.role,
			created_at: user.created_at,
			updated_at: user.updated_at,
		})
		
		const response = NextResponse.json({
			success: true,
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				role: user.role,
			},
		})
		
		response.cookies.set('auth-token', token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7, // 7 days
		})
		
		return response
	} catch (error) {
		console.error('Login error:', error)
		return NextResponse.json(
			{ success: false, error: 'Hiba történt a bejelentkezés során' },
			{ status: 500 }
		)
	}
}
