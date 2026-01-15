import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, hashPassword } from '@/lib/auth'
import { getAllUsers, createAdminUser, getUserByEmail } from '@/lib/db'
import { createAdminSchema } from '@/lib/validation'

export const runtime = 'edge'

export async function GET() {
	try {
		await requireAdmin()
		
		const users = await getAllUsers()
		
		return NextResponse.json({
			success: true,
			data: users,
		})
	} catch (error) {
		console.error('Get users error:', error)
		if (error instanceof Error && error.message === 'Forbidden') {
			return NextResponse.json(
				{ success: false, error: 'Nincs jogosultságod ehhez a művelethez' },
				{ status: 403 }
			)
		}
		return NextResponse.json(
			{ success: false, error: 'Hiba történt a felhasználók lekérdezése során' },
			{ status: 500 }
		)
	}
}

export async function POST(request: NextRequest) {
	try {
		await requireAdmin()
		
		const body = await request.json()
		
		const validation = createAdminSchema.safeParse(body)
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
		
		const passwordHash = hashPassword(password)
		const newAdmin = await createAdminUser(email, passwordHash, name)
		
		return NextResponse.json({
			success: true,
			data: newAdmin,
		})
	} catch (error) {
		console.error('Create admin user error:', error)
		if (error instanceof Error && error.message === 'Forbidden') {
			return NextResponse.json(
				{ success: false, error: 'Nincs jogosultságod ehhez a művelethez' },
				{ status: 403 }
			)
		}
		return NextResponse.json(
			{ success: false, error: 'Hiba történt az admin felhasználó létrehozása során' },
			{ status: 500 }
		)
	}
}
