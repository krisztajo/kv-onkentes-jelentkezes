import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getSession } from '@/lib/auth'
import { getAllPeriods, createPeriod } from '@/lib/db'
import { periodSchema } from '@/lib/validation'

export const runtime = 'edge'

export async function GET() {
	try {
		const user = await getSession()
		if (!user) {
			return NextResponse.json(
				{ success: false, error: 'Nincs bejelentkezve' },
				{ status: 401 }
			)
		}
		
		const periods = await getAllPeriods()
		
		return NextResponse.json({
			success: true,
			data: periods,
		})
	} catch (error) {
		console.error('Get periods error:', error)
		return NextResponse.json(
			{ success: false, error: 'Hiba történt az időszakok lekérdezése során' },
			{ status: 500 }
		)
	}
}

export async function POST(request: NextRequest) {
	try {
		await requireAdmin()
		
		const body = await request.json()
		
		const validation = periodSchema.safeParse(body)
		if (!validation.success) {
			return NextResponse.json(
				{ success: false, error: validation.error.errors[0].message },
				{ status: 400 }
			)
		}
		
		const { name, slug, startDate, endDate } = validation.data
		
		const period = await createPeriod(name, slug, startDate, endDate)
		
		return NextResponse.json({
			success: true,
			data: period,
		})
	} catch (error) {
		console.error('Create period error:', error)
		if (error instanceof Error && error.message === 'Forbidden') {
			return NextResponse.json(
				{ success: false, error: 'Nincs jogosultságod ehhez a művelethez' },
				{ status: 403 }
			)
		}
		return NextResponse.json(
			{ success: false, error: 'Hiba történt az időszak létrehozása során' },
			{ status: 500 }
		)
	}
}
