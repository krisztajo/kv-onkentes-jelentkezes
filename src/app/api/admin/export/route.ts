import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getApplicationsByPeriod, getPeriodById, getR2 } from '@/lib/db'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
	try {
		await requireAdmin()
		
		const searchParams = request.nextUrl.searchParams
		const periodId = searchParams.get('periodId')
		
		if (!periodId) {
			return NextResponse.json(
				{ success: false, error: 'Az időszak megadása kötelező' },
				{ status: 400 }
			)
		}
		
		const period = await getPeriodById(parseInt(periodId))
		if (!period) {
			return NextResponse.json(
				{ success: false, error: 'Az időszak nem található' },
				{ status: 404 }
			)
		}
		
		const applications = await getApplicationsByPeriod(parseInt(periodId))
		
		// Build manifest of all files to export
		const exportManifest = applications.map(app => {
			const files: { path: string; fileName: string; type: string }[] = []
			
			if (app.cv_url) {
				const cvPath = app.cv_url.replace('/api/files/', '')
				files.push({ path: cvPath, fileName: 'oneletrajz', type: 'cv' })
			}
			
			if (app.recommendation_url) {
				const recPath = app.recommendation_url.replace('/api/files/', '')
				files.push({ path: recPath, fileName: 'ajanlolevel_1', type: 'recommendation' })
			}
			
			if (app.recommendation_url_2) {
				const recPath2 = app.recommendation_url_2.replace('/api/files/', '')
				files.push({ path: recPath2, fileName: 'ajanlolevel_2', type: 'recommendation_2' })
			}
			
			if (app.criminal_record_url) {
				const crimPath = app.criminal_record_url.replace('/api/files/', '')
				files.push({ path: crimPath, fileName: 'erkolcsi_bizonyitvany', type: 'criminal_record' })
			}
			
			if (app.criminal_record_request_url) {
				const crimReqPath = app.criminal_record_request_url.replace('/api/files/', '')
				files.push({ path: crimReqPath, fileName: 'erkolcsi_igenyles_igazolas', type: 'criminal_record_request' })
			}
			
			return {
				userId: app.user_id,
				userName: app.user_name,
				userEmail: app.user_email,
				folder: `${app.user_name.replace(/[^a-zA-Z0-9áéíóöőúüűÁÉÍÓÖŐÚÜŰ ]/g, '_')}_${app.user_id}`,
				files,
				motivationLetter: app.motivation_letter || null,
				applicationStatus: app.status,
			}
		})
		
		return NextResponse.json({
			success: true,
			data: {
				period: period.name,
				periodSlug: period.slug,
				manifest: exportManifest,
			},
		})
	} catch (error) {
		console.error('Export manifest error:', error)
		if (error instanceof Error && error.message === 'Forbidden') {
			return NextResponse.json(
				{ success: false, error: 'Nincs jogosultságod ehhez a művelethez' },
				{ status: 403 }
			)
		}
		return NextResponse.json(
			{ success: false, error: 'Hiba történt az export előkészítése során' },
			{ status: 500 }
		)
	}
}
