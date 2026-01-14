import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getR2, getApplicationByUserAndPeriod, updateApplicationDocument, getPeriodBySlug } from '@/lib/db'
import { validateFile, validateMotivationLetter, ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '@/lib/validation'
import type { DocumentType } from '@/types'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
	try {
		const user = await requireAuth()
		
		const formData = await request.formData()
		const file = formData.get('file') as File | null
		const documentType = formData.get('documentType') as DocumentType
		const periodSlug = formData.get('periodSlug') as string
		const motivationText = formData.get('motivationText') as string | null
		
		if (!documentType || !periodSlug) {
			return NextResponse.json(
				{ success: false, error: 'Hiányzó paraméterek' },
				{ status: 400 }
			)
		}
		
		// Get period and application
		const period = await getPeriodBySlug(periodSlug)
		if (!period) {
			return NextResponse.json(
				{ success: false, error: 'Az időszak nem található' },
				{ status: 404 }
			)
		}
		
		const application = await getApplicationByUserAndPeriod(user.id, period.id)
		if (!application) {
			return NextResponse.json(
				{ success: false, error: 'Nincs jelentkezésed ehhez az időszakhoz' },
				{ status: 404 }
			)
		}
		
		// Handle motivation letter (text content)
		if (documentType === 'motivation') {
			if (!motivationText) {
				return NextResponse.json(
					{ success: false, error: 'A motivációs levél szövege kötelező' },
					{ status: 400 }
				)
			}
			
			const validation = validateMotivationLetter(motivationText)
			if (!validation.valid) {
				return NextResponse.json(
					{ success: false, error: validation.error },
					{ status: 400 }
				)
			}
			
			await updateApplicationDocument(
				application.id,
				'motivation',
				motivationText,
				validation.charCount
			)
			
			return NextResponse.json({
				success: true,
				data: {
					charCount: validation.charCount,
				},
			})
		}
		
		// Handle file uploads
		if (!file) {
			return NextResponse.json(
				{ success: false, error: 'Fájl feltöltése kötelező' },
				{ status: 400 }
			)
		}
		
		// Validate file
		const fileValidation = validateFile(file)
		if (!fileValidation.valid) {
			return NextResponse.json(
				{ success: false, error: fileValidation.error },
				{ status: 400 }
			)
		}
		
		// Generate unique filename
		const ext = file.name.split('.').pop()
		const filename = `${periodSlug}/${user.id}/${documentType}-${Date.now()}.${ext}`
		
		// Upload to R2
		const r2 = getR2()
		const arrayBuffer = await file.arrayBuffer()
		
		await r2.put(filename, arrayBuffer, {
			httpMetadata: {
				contentType: file.type,
			},
		})
		
		// Update application with file URL
		const fileUrl = `/api/files/${filename}`
		await updateApplicationDocument(application.id, documentType, fileUrl)
		
		return NextResponse.json({
			success: true,
			data: {
				url: fileUrl,
				filename,
			},
		})
	} catch (error) {
		console.error('Upload error:', error)
		if (error instanceof Error && error.message === 'Unauthorized') {
			return NextResponse.json(
				{ success: false, error: 'Nincs bejelentkezve' },
				{ status: 401 }
			)
		}
		return NextResponse.json(
			{ success: false, error: 'Hiba történt a feltöltés során' },
			{ status: 500 }
		)
	}
}
