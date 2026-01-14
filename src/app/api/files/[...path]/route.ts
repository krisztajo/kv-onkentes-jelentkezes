import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getR2 } from '@/lib/db'

export const runtime = 'edge'

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ path: string[] }> }
) {
	try {
		const user = await requireAuth()
		const { path } = await params
		const filePath = path.join('/')
		
		const r2 = getR2()
		const object = await r2.get(filePath)
		
		if (!object) {
			return NextResponse.json(
				{ success: false, error: 'A fájl nem található' },
				{ status: 404 }
			)
		}
		
		const headers = new Headers()
		headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream')
		headers.set('Cache-Control', 'private, max-age=3600')
		
		return new NextResponse(object.body, {
			headers,
		})
	} catch (error) {
		console.error('File access error:', error)
		if (error instanceof Error && error.message === 'Unauthorized') {
			return NextResponse.json(
				{ success: false, error: 'Nincs bejelentkezve' },
				{ status: 401 }
			)
		}
		return NextResponse.json(
			{ success: false, error: 'Hiba történt a fájl elérésekor' },
			{ status: 500 }
		)
	}
}
