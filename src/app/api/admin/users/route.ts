import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin, requireAdmin, hashPassword } from '@/lib/auth'
import { getAllUsers, createAdminUser, getUserByEmail, deleteUser } from '@/lib/db'
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
		await requireSuperAdmin()
		
		const body = await request.json()
		
		const validation = createAdminSchema.safeParse(body)
		if (!validation.success) {
			return NextResponse.json(
				{ success: false, error: validation.error.errors[0].message },
				{ status: 400 }
			)
		}
		
		const { email, password, name, role } = validation.data
		
		// Check if user already exists
		const existingUser = await getUserByEmail(email)
		if (existingUser) {
			return NextResponse.json(
				{ success: false, error: 'Ez az email cím már regisztrálva van' },
				{ status: 400 }
			)
		}
		
		const passwordHash = hashPassword(password)
		const newAdmin = await createAdminUser(email, passwordHash, name, role || 'admin')
		
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

export async function DELETE(request: NextRequest) {
	try {
		const user = await requireSuperAdmin()
		
		const searchParams = request.nextUrl.searchParams
		const userId = searchParams.get('id')
		
		if (!userId) {
			return NextResponse.json(
				{ success: false, error: 'Felhasználó ID szükséges' },
				{ status: 400 }
			)
		}
		
		const id = parseInt(userId)
		if (isNaN(id)) {
			return NextResponse.json(
				{ success: false, error: 'Érvénytelen felhasználó ID' },
				{ status: 400 }
			)
		}
		
		// Prevent deleting self
		if (id === user.id) {
			return NextResponse.json(
				{ success: false, error: 'Nem törölheted saját magad' },
				{ status: 400 }
			)
		}
		
		// Check if user exists and get their role
		const allUsers = await getAllUsers()
		const userToDelete = allUsers.find(u => u.id === id)
		
		if (!userToDelete) {
			return NextResponse.json(
				{ success: false, error: 'Felhasználó nem található' },
				{ status: 404 }
			)
		}
		
		// Only allow deleting admin/superadmin users (applicants can be deleted by regular admins too)
		if (userToDelete.role === 'admin' || userToDelete.role === 'superadmin') {
			// Only superadmin can delete other admins/superadmins
			if (user.role !== 'superadmin') {
				return NextResponse.json(
					{ success: false, error: 'Nincs jogosultságod admin felhasználó törléséhez' },
					{ status: 403 }
				)
			}
		}
		
		await deleteUser(id)
		
		return NextResponse.json({
			success: true,
		})
	} catch (error) {
		console.error('Delete user error:', error)
		if (error instanceof Error && error.message === 'Forbidden') {
			return NextResponse.json(
				{ success: false, error: 'Nincs jogosultságod ehhez a művelethez' },
				{ status: 403 }
			)
		}
		return NextResponse.json(
			{ success: false, error: 'Hiba történt a felhasználó törlése során' },
			{ status: 500 }
		)
	}
}
