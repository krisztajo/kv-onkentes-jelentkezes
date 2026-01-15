import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { getApplicationById, updateApplicationStatus } from '@/lib/db'
import type { Application } from '@/types'

export const runtime = 'edge'

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const user = await requireAuth()
		const { id } = await params
		
		const application = await getApplicationById(parseInt(id))
		
		if (!application) {
			return NextResponse.json(
				{ success: false, error: 'A jelentkezés nem található' },
				{ status: 404 }
			)
		}
		
		// Users can only view their own applications, admins can view all
		if (user.role !== 'admin' && application.user_id !== user.id) {
			return NextResponse.json(
				{ success: false, error: 'Nincs jogosultságod ehhez a művelethez' },
				{ status: 403 }
			)
		}
		
		return NextResponse.json({
			success: true,
			data: application,
		})
	} catch (error) {
		console.error('Get application error:', error)
		if (error instanceof Error && error.message === 'Unauthorized') {
			return NextResponse.json(
				{ success: false, error: 'Nincs bejelentkezve' },
				{ status: 401 }
			)
		}
		return NextResponse.json(
			{ success: false, error: 'Hiba történt a jelentkezés lekérdezése során' },
			{ status: 500 }
		)
	}
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const user = await requireAuth()
		const { id } = await params
		
		const application = await getApplicationById(parseInt(id))
		
		if (!application) {
			return NextResponse.json(
				{ success: false, error: 'A jelentkezés nem található' },
				{ status: 404 }
			)
		}
		
		const body = await request.json() as { status?: Application['status'] }
		
		// Allow admins to update any application, or users to submit their own applications
		const isAdmin = user.role === 'admin'
		const isOwnerSubmitting = application.user_id === user.id && body.status === 'submitted'
		
		if (!isAdmin && !isOwnerSubmitting) {
			return NextResponse.json(
				{ success: false, error: 'Nincs jogosultságod ehhez a művelethez' },
				{ status: 403 }
			)
		}
		
		if (body.status) {
			await updateApplicationStatus(parseInt(id), body.status)
		}
		
		const updatedApplication = await getApplicationById(parseInt(id))
		
		return NextResponse.json({
			success: true,
			data: updatedApplication,
		})
	} catch (error) {
		console.error('Update application error:', error)
		if (error instanceof Error && error.message === 'Unauthorized') {
			return NextResponse.json(
				{ success: false, error: 'Nincs bejelentkezve' },
				{ status: 401 }
			)
		}
		if (error instanceof Error && error.message === 'Forbidden') {
			return NextResponse.json(
				{ success: false, error: 'Nincs jogosultságod ehhez a művelethez' },
				{ status: 403 }
			)
		}
		return NextResponse.json(
			{ success: false, error: 'Hiba történt a jelentkezés frissítése során' },
			{ status: 500 }
		)
	}
}
