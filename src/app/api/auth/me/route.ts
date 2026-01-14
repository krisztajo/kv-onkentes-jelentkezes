import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

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
		
		return NextResponse.json({
			success: true,
			user,
		})
	} catch (error) {
		console.error('Session error:', error)
		return NextResponse.json(
			{ success: false, error: 'Hiba történt' },
			{ status: 500 }
		)
	}
}
