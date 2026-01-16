'use client'

import { useState, useEffect } from 'react'
import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { FileUpload } from '@/components/ui/file-upload'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Application, Period, User } from '@/types'

function ApplyPageInner() {
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
	const [isReadonly, setIsReadonly] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [submitSuccess, setSubmitSuccess] = useState(false)
	const [showSuccessModal, setShowSuccessModal] = useState(false)
	const [successModalMessage, setSuccessModalMessage] = useState('')
	const [declarations, setDeclarations] = useState<Record<string, boolean>>({
		nyilatkozat1: false,
		nyilatkozat2: false,
		nyilatkozat3: false,
		nyilatkozat4: false,
		nyilatkozat5: false,
	})
	
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
				const appData = await appRes.json() as { 
					success: boolean
					error?: string
					data?: { period: Period; application: Application; readonly?: boolean } 
				}
				
				if (!appData.success) {
					setError(appData.error || 'Hiba történt')
					setLoading(false)
					return
				}
				
				setPeriod(appData.data?.period || null)
				setApplication(appData.data?.application || null)
				setMotivationText(appData.data?.application?.motivation_letter || '')
				setIsReadonly(appData.data?.readonly || false)
				
				// Set declarations from database
				if (appData.data?.application?.declarations) {
					setDeclarations({
						nyilatkozat1: appData.data.application.declarations.nyilatkozat1 ?? false,
						nyilatkozat2: appData.data.application.declarations.nyilatkozat2 ?? false,
						nyilatkozat3: appData.data.application.declarations.nyilatkozat3 ?? false,
						nyilatkozat4: appData.data.application.declarations.nyilatkozat4 ?? false,
						nyilatkozat5: appData.data.application.declarations.nyilatkozat5 ?? false,
					})
				}
			} catch (err) {
				setError('Hiba történt az adatok betöltésekor')
			} finally {
				setLoading(false)
			}
		}
		
		loadData()
	}, [periodSlug, router])
	
	const handleFileUpload = async (file: File, documentType: string) => {
		if (!periodSlug || isReadonly) return
		
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
		if (!periodSlug || isReadonly) return
		
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
			// No modal for motivation save - only for final submit
		} catch (err) {
			setMotivationError('Hiba történt a mentés során')
		} finally {
			setSavingMotivation(false)
		}
	}
	
	const handleSubmitApplication = async () => {
		if (!application || isReadonly) return
		
		const allDeclarationsChecked = Object.values(declarations).every(Boolean)
		const allDocsUploaded = isAllRequiredUploaded()
		const canFinalize = allDeclarationsChecked && allDocsUploaded
		
		// Ha minden dokumentum megvan, de nincs minden nyilatkozat bepipálva
		if (allDocsUploaded && !allDeclarationsChecked) {
			alert('Kérjük, pipáld be az összes nyilatkozatot a véglegesítés előtt!')
			return
		}
		
		setIsSubmitting(true)
		
		try {
			const payload: { status?: string; declarations: Record<string, boolean> } = {
				declarations: declarations
			}
			
			// Csak akkor véglegesítse, ha minden dokumentum és nyilatkozat megvan
			if (canFinalize) {
				payload.status = 'submitted'
			}
			
			const res = await fetch(`/api/applications/${application.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			})
			
			const data = await res.json() as { success: boolean; data?: Application }
			
			if (data.success && data.data) {
				setApplication(data.data)
				// Update declarations state from returned data
				if (data.data.declarations) {
					setDeclarations({
						nyilatkozat1: data.data.declarations.nyilatkozat1 ?? false,
						nyilatkozat2: data.data.declarations.nyilatkozat2 ?? false,
						nyilatkozat3: data.data.declarations.nyilatkozat3 ?? false,
						nyilatkozat4: data.data.declarations.nyilatkozat4 ?? false,
						nyilatkozat5: data.data.declarations.nyilatkozat5 ?? false,
					})
				}
				if (canFinalize) {
					setSubmitSuccess(true)
					setSuccessModalMessage('Sikeres véglegesítés!')
				} else {
					setSuccessModalMessage('Részleges mentés sikeres!')
				}
				setShowSuccessModal(true)
			}
		} catch (err) {
			console.error('Submit error:', err)
		} finally {
			setIsSubmitting(false)
		}
	}
	
	const isDocumentUploaded = (type: 'cv' | 'recommendation' | 'recommendation_2' | 'motivation' | 'criminal_record' | 'criminal_record_request') => {
		if (!application) return false
		switch (type) {
			case 'cv': return !!application.cv_url
			case 'recommendation': return !!application.recommendation_url
			case 'recommendation_2': return !!application.recommendation_url_2
			case 'motivation': return !!application.motivation_letter
			case 'criminal_record': return !!application.criminal_record_url
			case 'criminal_record_request': return !!application.criminal_record_request_url
		}
	}
	
	// Count of REQUIRED documents (5: CV, 2 ajánlólevél, motiváció, erkölcsi)
	const getRequiredUploadedCount = () => {
		if (!application) return 0
		let count = 0
		if (application.cv_url) count++
		if (application.recommendation_url) count++
		if (application.recommendation_url_2) count++
		if (application.motivation_letter) count++
		if (application.criminal_record_url) count++
		return count
	}

	const getUploadedCount = () => {
		return getRequiredUploadedCount()
	}

	const REQUIRED_DOC_COUNT = 5
	
	const isAllRequiredUploaded = () => {
		return getRequiredUploadedCount() >= REQUIRED_DOC_COUNT
	}
	
	const isApplicationStarted = () => {
		if (!application) return false
		return application.cv_url || application.recommendation_url || application.recommendation_url_2 ||
			application.motivation_letter || application.criminal_record_url || application.criminal_record_request_url
	}
	
	const handleLogout = async () => {
		await fetch('/api/auth/logout', { method: 'POST' })
		router.push('/')
		router.refresh()
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
	
	type SuccessModalProps = {
		open: boolean;
		onClose: () => void;
		onLogout: () => void;
		message: string;
	};

	function SuccessModal({ open, onClose, onLogout, message }: SuccessModalProps) {
		if (!open) return null;
		return (
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
				<div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center relative animate-fade-in">
					<div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
						<svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<h2 className="text-xl font-bold text-surface-900 mb-2">{message}</h2>
					<div className="flex flex-col gap-3 mt-6">
						<button
							className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg transition"
							onClick={onLogout}
						>
							Kijelentkezés
						</button>
						<button
							className="text-surface-500 hover:text-surface-900 text-sm underline mt-1"
							onClick={onClose}
						>
							Bezárás
						</button>
					</div>
				</div>
			</div>
		);
	}
	
	return (
		<Suspense>
			<>
				<SuccessModal
					open={showSuccessModal}
					onClose={() => setShowSuccessModal(false)}
					onLogout={handleLogout}
					message={successModalMessage}
				/>
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
								<Link href="/profile">
									<span className="text-sm text-surface-600 hover:text-surface-900 cursor-pointer">{user?.name}</span>
								</Link>
								<Badge variant={getRequiredUploadedCount() === REQUIRED_DOC_COUNT ? 'success' : 'warning'}>
									{getRequiredUploadedCount()}/{REQUIRED_DOC_COUNT} dokumentum
								</Badge>
								<Button variant="ghost" size="sm" onClick={handleLogout}>
									Kijelentkezés
								</Button>
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
										{isApplicationStarted() ? 'Jelentkezésed folytatása' : 'Önkéntes képzés jelentkezés'}
									</h1>
									<p className="text-surface-600 mt-1">
										Időszak: <span className="font-semibold text-primary-600">{period?.name}</span>
										{isReadonly && (
											<span className="ml-2 text-amber-600">(Csak olvasható - az időszak már nem aktív)</span>
										)}
									</p>
								</div>
								<div className="text-right">
									<p className="text-sm text-surface-500">Állapot</p>
									<Badge variant={
										application?.status === 'submitted' ? 'success' :
										application?.status === 'approved' ? 'success' :
										application?.status === 'rejected' ? 'danger' :
										'info'
									}>
										{application?.status === 'draft' && 'Részleges'}
										{application?.status === 'submitted' && 'Végleges'}
										{application?.status === 'under_review' && 'Elbírálás alatt'}
										{application?.status === 'approved' && 'Elfogadva'}
										{application?.status === 'rejected' && 'Elutasítva'}
									</Badge>
								</div>
							</div>
						</CardContent>
					</Card>
					
					{/* Readonly Warning */}
					{isReadonly && (
						<div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
							<div className="flex items-center gap-2">
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
								</svg>
								<span className="font-medium">Ez az időszak már nem aktív</span>
							</div>
							<p className="text-sm mt-1">A jelentkezésed megtekinthető, de új dokumentumok feltöltése már nem lehetséges.</p>
						</div>
					)}
					
					{/* Already Submitted Message */}
					{application?.status === 'submitted' && (
						<div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-800">
							<div className="flex items-center gap-2">
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
								</svg>
								<span className="font-medium">A jelentkezésed véglegesítve!</span>
							</div>
							<p className="text-sm mt-1">A jelentkezésed ellenőrzés alatt áll. Hamarosan értesítünk.</p>
						</div>
					)}
					
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
									disabled={isReadonly || application?.status === 'submitted'}
								/>
							</CardContent>
						</Card>
						
						{/* Recommendation Letter 1 */}
						<Card>
							<CardHeader>
								<div className="flex items-center justify-between">
									<h2 className="text-lg font-semibold text-surface-900">1. Ajánlólevél</h2>
									{isDocumentUploaded('recommendation') && (
										<Badge variant="success">Feltöltve</Badge>
									)}
								</div>
							</CardHeader>
							<CardContent>
								<FileUpload
									label=""
									description="Töltsd fel az első ajánlólevelet. A sablon letölthető a bal oldalon."
									onUpload={(file) => handleFileUpload(file, 'recommendation')}
									uploadedUrl={application?.recommendation_url}
									uploadedAt={application?.recommendation_uploaded_at}
									templateUrl="/templates/ajanlolevely-sablon.pdf"
									templateLabel="Sablon letöltése"
									isLoading={uploadingDoc === 'recommendation'}
									disabled={isReadonly || application?.status === 'submitted'}
								/>
							</CardContent>
						</Card>
						
						{/* Recommendation Letter 2 */}
						<Card>
							<CardHeader>
								<div className="flex items-center justify-between">
									<h2 className="text-lg font-semibold text-surface-900">2. Ajánlólevél</h2>
									{isDocumentUploaded('recommendation_2') && (
										<Badge variant="success">Feltöltve</Badge>
									)}
								</div>
							</CardHeader>
							<CardContent>
								<FileUpload
									label=""
									description="Töltsd fel a második ajánlólevelet. A sablon letölthető a bal oldalon."
									onUpload={(file) => handleFileUpload(file, 'recommendation_2')}
									uploadedUrl={application?.recommendation_url_2}
									uploadedAt={application?.recommendation_uploaded_at_2}
									templateUrl="/templates/ajanlolevely-sablon.pdf"
									templateLabel="Sablon letöltése"
									isLoading={uploadingDoc === 'recommendation_2'}
									disabled={isReadonly || application?.status === 'submitted'}
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
									disabled={isReadonly || application?.status === 'submitted'}
								/>
								{!isReadonly && application?.status !== 'submitted' && (
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
								)}
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
									disabled={isReadonly || application?.status === 'submitted'}
								/>
							</CardContent>
						</Card>
						
						{/* Criminal Record Request - OPTIONAL */}
						<Card className="border-dashed border-surface-300">
							<CardHeader>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<h2 className="text-lg font-semibold text-surface-900">Erkölcsi bizonyítvány igénylés igazolása</h2>
										<Badge variant="info">Opcionális</Badge>
									</div>
									{isDocumentUploaded('criminal_record_request') && (
										<Badge variant="success">Feltöltve</Badge>
									)}
								</div>
							</CardHeader>
							<CardContent>
								<FileUpload
									label=""
									description="Ha az erkölcsi bizonyítvány még nem érkezett meg, itt feltöltheted az igénylés igazolását. Ez a mező nem kötelező."
									onUpload={(file) => handleFileUpload(file, 'criminal_record_request')}
									uploadedUrl={application?.criminal_record_request_url}
									uploadedAt={application?.criminal_record_request_uploaded_at}
									isLoading={uploadingDoc === 'criminal_record_request'}
									disabled={isReadonly || application?.status === 'submitted'}
								/>
							</CardContent>
						</Card>
					</div>
					
					{/* Declarations */}
					<Card className="mt-6">
						<CardHeader>
							<h2 className="text-lg font-semibold text-surface-900">Nyilatkozatok</h2>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-start gap-3">
								<input
									type="checkbox"
									id="nyilatkozat1"
									checked={declarations.nyilatkozat1}
									onChange={() => setDeclarations(prev => ({ ...prev, nyilatkozat1: !prev.nyilatkozat1 }))}
									disabled={isReadonly || application?.status === 'submitted'}
									className="mt-1 w-4 h-4 text-green-600 border-surface-300 rounded focus:ring-green-500"
								/>
								<label htmlFor="nyilatkozat1" className="text-sm text-surface-700 cursor-pointer">
									Nyilatkozat 1: Elfogadom a részvételi feltételeket.
								</label>
							</div>
							<div className="flex items-start gap-3">
								<input
									type="checkbox"
									id="nyilatkozat2"
									checked={declarations.nyilatkozat2}
									onChange={() => setDeclarations(prev => ({ ...prev, nyilatkozat2: !prev.nyilatkozat2 }))}
									disabled={isReadonly || application?.status === 'submitted'}
									className="mt-1 w-4 h-4 text-green-600 border-surface-300 rounded focus:ring-green-500"
								/>
								<label htmlFor="nyilatkozat2" className="text-sm text-surface-700 cursor-pointer">
									Nyilatkozat 2: Nyilatkozom, hogy havi 3 alkalommal tudok vállalni önkénteskedést.
								</label>
							</div>
							<div className="flex items-start gap-3">
								<input
									type="checkbox"
									id="nyilatkozat3"
									checked={declarations.nyilatkozat3}
									onChange={() => setDeclarations(prev => ({ ...prev, nyilatkozat3: !prev.nyilatkozat3 }))}
									disabled={isReadonly || application?.status === 'submitted'}
									className="mt-1 w-4 h-4 text-green-600 border-surface-300 rounded focus:ring-green-500"
								/>
								<label htmlFor="nyilatkozat3" className="text-sm text-surface-700 cursor-pointer">
									Nyilatkozat 3: Elfogadom az adatvédelmi szabályokat.
								</label>
							</div>
							<div className="flex items-start gap-3">
								<input
									type="checkbox"
									id="nyilatkozat4"
									checked={declarations.nyilatkozat4}
									onChange={() => setDeclarations(prev => ({ ...prev, nyilatkozat4: !prev.nyilatkozat4 }))}
									disabled={isReadonly || application?.status === 'submitted'}
									className="mt-1 w-4 h-4 text-green-600 border-surface-300 rounded focus:ring-green-500"
								/>
								<label htmlFor="nyilatkozat4" className="text-sm text-surface-700 cursor-pointer">
									Nyilatkozat 4: Még valami fontos dolog, amit el kell fogadnom.
								</label>
							</div>
							<div className="flex items-start gap-3">
								<input
									type="checkbox"
									id="nyilatkozat5"
									checked={declarations.nyilatkozat5}
									onChange={() => setDeclarations(prev => ({ ...prev, nyilatkozat5: !prev.nyilatkozat5 }))}
									disabled={isReadonly || application?.status === 'submitted'}
									className="mt-1 w-4 h-4 text-green-600 border-surface-300 rounded focus:ring-green-500"
								/>
								<label htmlFor="nyilatkozat5" className="text-sm text-surface-700 cursor-pointer">
									Nyilatkozat 5: Tudomásul veszem a képzés időpontját és helyszínét.
								</label>
							</div>
						</CardContent>
					</Card>
					
					{/* Summary & Submit */}
					<Card className="mt-8">
						<CardContent className="py-6">
							<div className="flex items-center justify-between">
								<div>
									<h3 className="font-semibold text-surface-900">Összesítő</h3>
									<p className="text-sm text-surface-600 mt-1">
										{isAllRequiredUploaded()
											? 'Minden kötelező dokumentum feltöltve!'
											: `Még ${REQUIRED_DOC_COUNT - getRequiredUploadedCount()} kötelező dokumentum hiányzik`}
									</p>
								</div>
								<div className="flex gap-2">
									{
										[
											{ key: 'cv', label: 'CV' },
											{ key: 'recommendation', label: 'Ajánló 1' },
											{ key: 'recommendation_2', label: 'Ajánló 2' },
											{ key: 'motivation', label: 'Motiváció' },
											{ key: 'criminal_record', label: 'Erkölcsi' },
										].map(({ key, label }) => (
											<div
												key={key}
												className={`w-10 h-10 rounded-lg flex items-center justify-center ${
													isDocumentUploaded(key as 'cv' | 'recommendation' | 'recommendation_2' | 'motivation' | 'criminal_record')
														? 'bg-accent-100 text-accent-600'
														: 'bg-surface-100 text-surface-400'
												}`}
												title={label}
											>
												{isDocumentUploaded(key as 'cv' | 'recommendation' | 'recommendation_2' | 'motivation' | 'criminal_record') ? (
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
							
							{/* Submit Button - Always visible when not readonly and not already submitted */}
							{!isReadonly && application?.status === 'draft' && (
								<div className="mt-6 pt-6 border-t border-surface-200">
									<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
										<div className="text-sm text-surface-600">
											{!isAllRequiredUploaded() ? (
												<span className="text-amber-600">
													⚠️ Figyelem: Még {REQUIRED_DOC_COUNT - getRequiredUploadedCount()} dokumentum hiányzik.
												</span>
											) : !Object.values(declarations).every(Boolean) ? (
												<span className="text-amber-600">
													⚠️ Figyelem: Nem minden nyilatkozat van bepipálva.
												</span>
											) : (
												<span className="text-green-600">
													✓ Minden feltétel teljesült! Készen állsz a véglegesítésre!
												</span>
											)}
										</div>
										<Button
											variant={isAllRequiredUploaded() && Object.values(declarations).every(Boolean) ? 'success' : 'primary'}
											size="lg"
											onClick={handleSubmitApplication}
											isLoading={isSubmitting}
										>
											{isAllRequiredUploaded() && Object.values(declarations).every(Boolean) ? 'Jelentkezés véglegesítése' : 'Részleges mentés'}
										</Button>
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				</main>
			</div>
			</>
		</Suspense>
	)
}

export default function ApplyPage() {
  return (
    <Suspense>
      <ApplyPageInner />
    </Suspense>
  )
}
