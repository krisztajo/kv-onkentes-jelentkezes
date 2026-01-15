import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, hashPassword, verifyPassword } from '@/lib/auth'
import { getUserWithPassword, updateUserPassword } from '@/lib/db'
import { changePasswordSchema } from '@/lib/validation'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
	try {
		const user = await requireAuth()
		const body = await request.json()
		
		const validation = changePasswordSchema.safeParse(body)
		if (!validation.success) {
			return NextResponse.json(
				{ success: false, error: validation.error.errors[0].message },
				{ status: 400 }
			)
		}
		
		const { currentPassword, newPassword } = validation.data
		
		// Get user with password to verify current password
		const userWithPassword = await getUserWithPassword(user.email)
		if (!userWithPassword) {
			return NextResponse.json(
				{ success: false, error: 'Felhasználó nem található' },
				{ status: 404 }
			)
		}
		
		// Verify current password
		if (!verifyPassword(currentPassword, userWithPassword.password_hash)) {
			return NextResponse.json(
				{ success: false, error: 'A jelenlegi jelszó helytelen' },
				{ status: 401 }
			)
		}
		
		// Hash new password and update
		const newPasswordHash = hashPassword(newPassword)
		await updateUserPassword(user.id, newPasswordHash)
		
		return NextResponse.json({
			success: true,
			message: 'A jelszó sikeresen megváltoztatva',
		})
	} catch (error) {
		console.error('Change password error:', error)
		if (error instanceof Error && error.message === 'Unauthorized') {
			return NextResponse.json(
				{ success: false, error: 'Nincs bejelentkezve' },
				{ status: 401 }
			)
		}
		return NextResponse.json(
			{ success: false, error: 'Hiba történt a jelszó megváltoztatása során' },
			{ status: 500 }
		)
	}
}
