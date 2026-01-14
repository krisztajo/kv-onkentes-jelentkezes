'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { FileUpload } from '@/components/ui/file-upload'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Application, Period, User } from '@/types'

export default function ApplyPage() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const periodSlug = searchParams.get('period')
	
	const [user, setUser] = useState<User | null>(null)
	const [period, setPeriod] = useState<Period | null>(null)
	const [application, setApplication] = useState<Application | null>(null)
	const [motivationText, setMotivationText] = useState('')
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [uploadingDoc, setUploadingDoc] = useState<string | null>(null)
	const [savingMotivation, setSavingMotivation] = useState(false)
	const [motivationError, setMotivationError] = useState('')
	
	useEffect(() => {
		async function loadData() {
			try {
				// Check auth
				const authRes = await fetch('/api/auth/me')
				const authData = await authRes.json() as { success: boolean; user?: User }
				
				if (!authData.success) {
					router.push(`/login?period=${periodSlug}`)
					return
				}
				
				setUser(authData.user || null)
				
				if (!periodSlug) {
					setError('Nincs megadva jelentkezési időszak')
					setLoading(false)
					return
				}
				
				// Get application data
				const appRes = await fetch(`/api/applications/my?period=${periodSlug}`)
				const appData = await appRes.json() as { success: boolean; error?: string; data?: { period: Period; application: Application } }
				
				if (!appData.success) {
					setError(appData.error || 'Hiba történt')
					setLoading(false)
					return
				}
				
				setPeriod(appData.data?.period || null)
				setApplication(appData.data?.application || null)
				setMotivationText(appData.data?.application?.motivation_letter || '')
			} catch (err) {
				setError('Hiba történt az adatok betöltésekor')
			} finally {
				setLoading(false)
			}
		}
		
		loadData()
	}, [periodSlug, router])
	
	const handleFileUpload = async (file: File, documentType: string) => {
		if (!periodSlug) return
		
		setUploadingDoc(documentType)
		
		try {
			const formData = new FormData()
			formData.append('file', file)
			formData.append('documentType', documentType)
			formData.append('periodSlug', periodSlug)
			
			const response = await fetch('/api/upload', {
				method: 'POST',
				body: formData,
			})
			
			const data = await response.json() as { success: boolean; error?: string }
			
			if (!data.success) {
				throw new Error(data.error)
			}
			
			// Refresh application data
			const appRes = await fetch(`/api/applications/my?period=${periodSlug}`)
			const appData = await appRes.json() as { success: boolean; data?: { application: Application } }
			
			if (appData.success && appData.data) {
				setApplication(appData.data.application)
			}
		} catch (err) {
			console.error('Upload error:', err)
		} finally {
			setUploadingDoc(null)
		}
	}
	
	const handleSaveMotivation = async () => {
		if (!periodSlug) return
		
		setMotivationError('')
		
		const charCount = motivationText.length
		if (charCount < 1000) {
			setMotivationError(`A motivációs levélnek legalább 1000 karakter hosszúnak kell lennie (jelenleg: ${charCount})`)
			return
		}
		if (charCount > 2500) {
			setMotivationError(`A motivációs levél maximum 2500 karakter lehet (jelenleg: ${charCount})`)
			return
		}
		
		setSavingMotivation(true)
		
		try {
			const formData = new FormData()
			formData.append('documentType', 'motivation')
			formData.append('periodSlug', periodSlug)
			formData.append('motivationText', motivationText)
			
			const response = await fetch('/api/upload', {
				method: 'POST',
				body: formData,
			})
			
			const motivationData = await response.json() as { success: boolean; error?: string }
			
			if (!motivationData.success) {
				setMotivationError(motivationData.error || 'Hiba történt a mentés során')
				return
			}
			
			// Refresh application data
			const appRes = await fetch(`/api/applications/my?period=${periodSlug}`)
			const appData = await appRes.json() as { success: boolean; data?: { application: Application } }
			
			if (appData.success && appData.data) {
				setApplication(appData.data.application)
			}
		} catch (err) {
			setMotivationError('Hiba történt a mentés során')
		} finally {
			setSavingMotivation(false)
		}
	}
	
	const isDocumentUploaded = (type: 'cv' | 'recommendation' | 'motivation' | 'criminal_record') => {
		if (!application) return false
		switch (type) {
			case 'cv': return !!application.cv_url
			case 'recommendation': return !!application.recommendation_url
			case 'motivation': return !!application.motivation_letter
			case 'criminal_record': return !!application.criminal_record_url
		}
	}
	
	const getUploadedCount = () => {
		if (!application) return 0
		let count = 0
		if (application.cv_url) count++
		if (application.recommendation_url) count++
		if (application.motivation_letter) count++
		if (application.criminal_record_url) count++
		return count
	}
	
	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
			</div>
		)
	}
	
	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center p-4">
				<Card className="max-w-md text-center">
					<CardContent className="pt-6">
						<div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
							<svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
							</svg>
						</div>
						<h2 className="text-xl font-semibold text-surface-900 mb-2">{error}</h2>
						<Link href="/">
							<Button variant="primary" className="mt-4">
								Vissza a főoldalra
							</Button>
						</Link>
					</CardContent>
				</Card>
			</div>
		)
	}
	
	return (
		<div className="min-h-screen bg-gradient-to-br from-surface-50 via-primary-50/30 to-accent-50/20">
			{/* Header */}
			<header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-surface-100">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">
						<Link href="/" className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
								<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
								</svg>
							</div>
							<span className="text-lg font-semibold text-surface-900">Jelentkezés</span>
						</Link>
						
						<div className="flex items-center gap-3">
							<span className="text-sm text-surface-600">{user?.name}</span>
							<Badge variant={getUploadedCount() === 4 ? 'success' : 'warning'}>
								{getUploadedCount()}/4 dokumentum
							</Badge>
						</div>
					</div>
				</div>
			</header>
			
			<main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Period Info */}
				<Card className="mb-8">
					<CardContent className="py-6">
						<div className="flex items-center justify-between">
							<div>
								<h1 className="text-2xl font-display font-bold text-surface-900">
									Önkéntes képzés jelentkezés
								</h1>
								<p className="text-surface-600 mt-1">
									Időszak: <span className="font-semibold text-primary-600">{period?.name}</span>
								</p>
							</div>
							<div className="text-right">
								<p className="text-sm text-surface-500">Állapot</p>
								<Badge variant={application?.status === 'submitted' ? 'success' : 'info'}>
									{application?.status === 'draft' && 'Piszkozat'}
									{application?.status === 'submitted' && 'Beküldve'}
									{application?.status === 'under_review' && 'Elbírálás alatt'}
									{application?.status === 'approved' && 'Elfogadva'}
									{application?.status === 'rejected' && 'Elutasítva'}
								</Badge>
							</div>
						</div>
					</CardContent>
				</Card>
				
				{/* Documents */}
				<div className="space-y-6">
					{/* CV */}
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<h2 className="text-lg font-semibold text-surface-900">Önéletrajz (CV)</h2>
								{isDocumentUploaded('cv') && (
									<Badge variant="success">Feltöltve</Badge>
								)}
							</div>
						</CardHeader>
						<CardContent>
							<FileUpload
								label=""
								description="Töltsd fel az önéletrajzodat PDF vagy képformátumban"
								onUpload={(file) => handleFileUpload(file, 'cv')}
								uploadedUrl={application?.cv_url}
								uploadedAt={application?.cv_uploaded_at}
								isLoading={uploadingDoc === 'cv'}
							/>
						</CardContent>
					</Card>
					
					{/* Recommendation Letter */}
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<h2 className="text-lg font-semibold text-surface-900">Ajánlólevél</h2>
								{isDocumentUploaded('recommendation') && (
									<Badge variant="success">Feltöltve</Badge>
								)}
							</div>
						</CardHeader>
						<CardContent>
							<FileUpload
								label=""
								description="Töltsd fel az ajánlólevelet. A sablon letölthető a bal oldalon."
								onUpload={(file) => handleFileUpload(file, 'recommendation')}
								uploadedUrl={application?.recommendation_url}
								uploadedAt={application?.recommendation_uploaded_at}
								templateUrl="/templates/ajanlolevely-sablon.pdf"
								templateLabel="Sablon letöltése"
								isLoading={uploadingDoc === 'recommendation'}
							/>
						</CardContent>
					</Card>
					
					{/* Motivation Letter */}
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<h2 className="text-lg font-semibold text-surface-900">Motivációs levél</h2>
								{isDocumentUploaded('motivation') && (
									<Badge variant="success">Mentve</Badge>
								)}
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							<Textarea
								label=""
								placeholder="Írd meg a motivációs leveledet... (minimum 1000, maximum 2500 karakter)"
								value={motivationText}
								onChange={(e) => setMotivationText(e.target.value)}
								charCount={motivationText.length}
								minChars={1000}
								maxChars={2500}
								error={motivationError}
								rows={10}
							/>
							<div className="flex justify-end">
								<Button
									variant="primary"
									onClick={handleSaveMotivation}
									isLoading={savingMotivation}
									disabled={motivationText.length < 1000 || motivationText.length > 2500}
								>
									Mentés
								</Button>
							</div>
						</CardContent>
					</Card>
					
					{/* Criminal Record */}
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<h2 className="text-lg font-semibold text-surface-900">Erkölcsi bizonyítvány</h2>
								{isDocumentUploaded('criminal_record') && (
									<Badge variant="success">Feltöltve</Badge>
								)}
							</div>
						</CardHeader>
						<CardContent>
							<FileUpload
								label=""
								description="Töltsd fel a hatósági erkölcsi bizonyítvány másolatát"
								onUpload={(file) => handleFileUpload(file, 'criminal_record')}
								uploadedUrl={application?.criminal_record_url}
								uploadedAt={application?.criminal_record_uploaded_at}
								isLoading={uploadingDoc === 'criminal_record'}
							/>
						</CardContent>
					</Card>
				</div>
				
				{/* Summary */}
				<Card className="mt-8">
					<CardContent className="py-6">
						<div className="flex items-center justify-between">
							<div>
								<h3 className="font-semibold text-surface-900">Összesítő</h3>
								<p className="text-sm text-surface-600 mt-1">
									{getUploadedCount() === 4
										? 'Minden dokumentum feltöltve!'
										: `Még ${4 - getUploadedCount()} dokumentum hiányzik`}
								</p>
							</div>
							<div className="flex gap-2">
								{[
									{ key: 'cv', label: 'CV' },
									{ key: 'recommendation', label: 'Ajánló' },
									{ key: 'motivation', label: 'Motiváció' },
									{ key: 'criminal_record', label: 'Erkölcsi' },
								].map(({ key, label }) => (
									<div
										key={key}
										className={`w-10 h-10 rounded-lg flex items-center justify-center ${
											isDocumentUploaded(key as any)
												? 'bg-accent-100 text-accent-600'
												: 'bg-surface-100 text-surface-400'
										}`}
										title={label}
									>
										{isDocumentUploaded(key as any) ? (
											<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
											</svg>
										) : (
											<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
											</svg>
										)}
									</div>
								))}
							</div>
						</div>
					</CardContent>
				</Card>
			</main>
		</div>
	)
}
