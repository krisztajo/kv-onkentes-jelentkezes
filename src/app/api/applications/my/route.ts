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
		
		// Check if period is active - only allow access if active
		if (!period.is_active) {
			// Check if user has an existing application for this period
			const existingApp = await getApplicationByUserAndPeriod(user.id, period.id)
			if (!existingApp) {
				return NextResponse.json(
					{ success: false, error: 'Ez a jelentkezési időszak már nem aktív' },
					{ status: 403 }
				)
			}
			// Allow viewing existing application but mark it as readonly
			return NextResponse.json({
				success: true,
				data: {
					application: existingApp,
					period,
					readonly: true,
				},
			})
		}
		
		// Get or create application for this user and period
		const application = await getOrCreateApplication(user.id, period.id)
		
		return NextResponse.json({
			success: true,
			data: {
				application,
				period,
				readonly: false,
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
