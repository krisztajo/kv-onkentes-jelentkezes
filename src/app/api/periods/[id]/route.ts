import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getPeriodById, deletePeriod, setActivePeriod, deactivatePeriod } from '@/lib/db'

export const runtime = 'edge'

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params
		const period = await getPeriodById(parseInt(id))
		
		if (!period) {
			return NextResponse.json(
				{ success: false, error: 'Az időszak nem található' },
				{ status: 404 }
			)
		}
		
		return NextResponse.json({
			success: true,
			data: period,
		})
	} catch (error) {
		console.error('Get period error:', error)
		return NextResponse.json(
			{ success: false, error: 'Hiba történt az időszak lekérdezése során' },
			{ status: 500 }
		)
	}
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		await requireAdmin()
		
		const { id } = await params
		const body = await request.json() as { setActive?: boolean; deactivate?: boolean }
		
		if (body.setActive) {
			await setActivePeriod(parseInt(id))
		} else if (body.deactivate) {
			await deactivatePeriod(parseInt(id))
		}
		
		const period = await getPeriodById(parseInt(id))
		
		return NextResponse.json({
			success: true,
			data: period,
		})
	} catch (error) {
		console.error('Update period error:', error)
		if (error instanceof Error && error.message === 'Forbidden') {
			return NextResponse.json(
				{ success: false, error: 'Nincs jogosultságod ehhez a művelethez' },
				{ status: 403 }
			)
		}
		return NextResponse.json(
			{ success: false, error: 'Hiba történt az időszak frissítése során' },
			{ status: 500 }
		)
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		await requireAdmin()
		
		const { id } = await params
		await deletePeriod(parseInt(id))
		
		return NextResponse.json({
			success: true,
		})
	} catch (error) {
		console.error('Delete period error:', error)
		if (error instanceof Error && error.message === 'Forbidden') {
			return NextResponse.json(
				{ success: false, error: 'Nincs jogosultságod ehhez a művelethez' },
				{ status: 403 }
			)
		}
		return NextResponse.json(
			{ success: false, error: 'Hiba történt az időszak törlése során' },
			{ status: 500 }
		)
	}
}
