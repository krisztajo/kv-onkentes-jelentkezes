import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getApplicationByUserAndPeriod, getPeriodBySlug, getOrCreateApplication } from '@/lib/db'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
	try {
		const user = await requireAuth()
		const searchParams = request.nextUrl.searchParams
		const periodSlug = searchParams.get('period')
		
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
		
		// Get or create application for this user and period
		const application = await getOrCreateApplication(user.id, period.id)
		
		return NextResponse.json({
			success: true,
			data: {
				application,
				period,
			},
		})
	} catch (error) {
		console.error('Get my application error:', error)
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
