import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth'
import {
	getOrCreateApplication,
	getApplicationsByPeriod,
	getAllApplications,
	getPeriodBySlug,
} from '@/lib/db'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
	try {
		const user = await requireAuth()
		const searchParams = request.nextUrl.searchParams
		const periodId = searchParams.get('periodId')
		
		// Admin can view all applications
		if (user.role === 'admin') {
			let applications
			if (periodId) {
				applications = await getApplicationsByPeriod(parseInt(periodId))
			} else {
				applications = await getAllApplications()
			}
			
			return NextResponse.json({
				success: true,
				data: applications,
			})
		}
		
		// Regular users get 403
		return NextResponse.json(
			{ success: false, error: 'Nincs jogosultságod ehhez a művelethez' },
			{ status: 403 }
		)
	} catch (error) {
		console.error('Get applications error:', error)
		if (error instanceof Error && error.message === 'Unauthorized') {
			return NextResponse.json(
				{ success: false, error: 'Nincs bejelentkezve' },
				{ status: 401 }
			)
		}
		return NextResponse.json(
			{ success: false, error: 'Hiba történt a jelentkezések lekérdezése során' },
			{ status: 500 }
		)
	}
}

export async function POST(request: NextRequest) {
	try {
		const user = await requireAuth()
		const body = await request.json() as { periodSlug?: string }
		
		const { periodSlug } = body
		
		if (!periodSlug) {
			return NextResponse.json(
				{ success: false, error: 'Az időszak megadása kötelező' },
				{ status: 400 }
			)
		}
		
		const period = await getPeriodBySlug(periodSlug)
		if (!period) {
			return NextResponse.json(
				{ success: false, error: 'Az időszak nem található' },
				{ status: 404 }
			)
		}
		
		const application = await getOrCreateApplication(user.id, period.id)
		
		return NextResponse.json({
			success: true,
			data: application,
		})
	} catch (error) {
		console.error('Create application error:', error)
		if (error instanceof Error && error.message === 'Unauthorized') {
			return NextResponse.json(
				{ success: false, error: 'Nincs bejelentkezve' },
				{ status: 401 }
			)
		}
		return NextResponse.json(
			{ success: false, error: 'Hiba történt a jelentkezés létrehozása során' },
			{ status: 500 }
		)
	}
}
