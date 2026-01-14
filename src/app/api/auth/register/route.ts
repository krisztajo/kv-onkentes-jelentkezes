import { NextRequest, NextResponse } from 'next/server'
import { createToken, hashPassword } from '@/lib/auth'
import { getUserByEmail, createUser } from '@/lib/db'
import { registerSchema } from '@/lib/validation'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		
		const validation = registerSchema.safeParse(body)
		if (!validation.success) {
			return NextResponse.json(
				{ success: false, error: validation.error.errors[0].message },
				{ status: 400 }
			)
		}
		
		const { email, password, name } = validation.data
		
		// Check if user already exists
		const existingUser = await getUserByEmail(email)
		if (existingUser) {
			return NextResponse.json(
				{ success: false, error: 'Ez az email cím már regisztrálva van' },
				{ status: 400 }
			)
		}
		
		// Create user
		const passwordHash = hashPassword(password)
		const user = await createUser(email, passwordHash, name)
		
		// Create token
		const token = await createToken(user)
		
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
		console.error('Registration error:', error)
		return NextResponse.json(
			{ success: false, error: 'Hiba történt a regisztráció során' },
			{ status: 500 }
		)
	}
}
