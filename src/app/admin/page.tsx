'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Period, ApplicationWithUser, User } from '@/types'

// Application Detail Modal Component
function ApplicationDetailModal({
	application,
	onClose,
}: {
	application: ApplicationWithUser | null
	onClose: () => void
}) {
	if (!application) return null

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div className="absolute inset-0 bg-black/50" onClick={onClose} />
			<div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
				<div className="sticky top-0 bg-white border-b border-surface-200 px-6 py-4 rounded-t-2xl">
					<div className="flex items-center justify-between">
						<div>
							<h2 className="text-xl font-semibold text-surface-900">
								{application.user_name}
							</h2>
							<p className="text-sm text-surface-500">{application.user_email}</p>
						</div>
						<button
							onClick={onClose}
							className="p-2 hover:bg-surface-100 rounded-lg transition-colors"
						>
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>
				
				<div className="p-6 space-y-6">
					{/* Status Badge */}
					<div className="flex items-center gap-2">
						<span className="text-sm font-medium text-surface-600">Státusz:</span>
						<Badge variant={
							(application.status === 'draft' && application.cv_url && application.recommendation_url && application.recommendation_url_2 && application.motivation_letter && application.criminal_record_url) ? 'success' :
							application.status === 'submitted' ? 'success' :
							application.status === 'approved' ? 'success' :
							application.status === 'rejected' ? 'danger' :
							'warning'
						}>
							   {application.status === 'draft' && application.cv_url && application.recommendation_url && application.recommendation_url_2 && application.motivation_letter && application.criminal_record_url && 'Végleges'}
							   {application.status === 'draft' && !(application.cv_url && application.recommendation_url && application.recommendation_url_2 && application.motivation_letter && application.criminal_record_url) && 'Részleges'}
							   {application.status === 'submitted' && 'Végleges'}
							{application.status === 'under_review' && 'Elbírálás alatt'}
							{application.status === 'approved' && 'Elfogadva'}
							{application.status === 'rejected' && 'Elutasítva'}
						</Badge>
					</div>

					{/* Documents Grid */}
					<div className="grid md:grid-cols-2 gap-6">
						{/* CV */}
						<Card>
							<CardHeader className="pb-2">
								<div className="flex items-center justify-between">
									<h3 className="font-medium text-surface-900">Önéletrajz (CV)</h3>
									{application.cv_url ? (
										<Badge variant="success">Feltöltve</Badge>
									) : (
										<Badge variant="danger">Hiányzik</Badge>
									)}
								</div>
							</CardHeader>
							<CardContent>
								{application.cv_url ? (
									<div className="space-y-2">
										<p className="text-xs text-surface-500">
											Feltöltve: {application.cv_uploaded_at ? new Date(application.cv_uploaded_at).toLocaleString('hu-HU') : '-'}
										</p>
										<a
											href={application.cv_url}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
										>
											<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
											</svg>
											Megtekintés / Letöltés
										</a>
									</div>
								) : (
									<p className="text-sm text-surface-500">Nincs feltöltve</p>
								)}
							</CardContent>
						</Card>

						{/* Recommendation Letter */}
						<Card>
							<CardHeader className="pb-2">
								<div className="flex items-center justify-between">
									<h3 className="font-medium text-surface-900">1. Ajánlólevél</h3>
									{application.recommendation_url ? (
										<Badge variant="success">Feltöltve</Badge>
									) : (
										<Badge variant="danger">Hiányzik</Badge>
									)}
								</div>
							</CardHeader>
							<CardContent>
								{application.recommendation_url ? (
									<div className="space-y-2">
										<p className="text-xs text-surface-500">
											Feltöltve: {application.recommendation_uploaded_at ? new Date(application.recommendation_uploaded_at).toLocaleString('hu-HU') : '-'}
										</p>
										<a
											href={application.recommendation_url}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
										>
											<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
											</svg>
											Megtekintés / Letöltés
										</a>
									</div>
								) : (
									<p className="text-sm text-surface-500">Nincs feltöltve</p>
								)}
							</CardContent>
						</Card>

						{/* Recommendation Letter 2 */}
						<Card>
							<CardHeader className="pb-2">
								<div className="flex items-center justify-between">
									<h3 className="font-medium text-surface-900">2. Ajánlólevél</h3>
									{application.recommendation_url_2 ? (
										<Badge variant="success">Feltöltve</Badge>
									) : (
										<Badge variant="danger">Hiányzik</Badge>
									)}
								</div>
							</CardHeader>
							<CardContent>
								{application.recommendation_url_2 ? (
									<div className="space-y-2">
										<p className="text-xs text-surface-500">
											Feltöltve: {application.recommendation_uploaded_at_2 ? new Date(application.recommendation_uploaded_at_2).toLocaleString('hu-HU') : '-'}
										</p>
										<a
											href={application.recommendation_url_2}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
										>
											<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
											</svg>
											Megtekintés / Letöltés
										</a>
									</div>
								) : (
									<p className="text-sm text-surface-500">Nincs feltöltve</p>
								)}
							</CardContent>
						</Card>

						{/* Criminal Record */}
						<Card>
							<CardHeader className="pb-2">
								<div className="flex items-center justify-between">
									<h3 className="font-medium text-surface-900">Erkölcsi bizonyítvány</h3>
									{application.criminal_record_url ? (
										<Badge variant="success">Feltöltve</Badge>
									) : (
										<Badge variant="danger">Hiányzik</Badge>
									)}
								</div>
							</CardHeader>
							<CardContent>
								{application.criminal_record_url ? (
									<div className="space-y-2">
										<p className="text-xs text-surface-500">
											Feltöltve: {application.criminal_record_uploaded_at ? new Date(application.criminal_record_uploaded_at).toLocaleString('hu-HU') : '-'}
										</p>
										<a
											href={application.criminal_record_url}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
										>
											<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
											</svg>
											Megtekintés / Letöltés
										</a>
									</div>
								) : (
									<p className="text-sm text-surface-500">Nincs feltöltve</p>
								)}
							</CardContent>
						</Card>

						{/* Criminal Record Request - Optional */}
						<Card className="border-dashed border-surface-300">
							<CardHeader className="pb-2">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<h3 className="font-medium text-surface-900">Erkölcsi ig. igazolás</h3>
										<Badge variant="info">Opcionális</Badge>
									</div>
									{application.criminal_record_request_url ? (
										<Badge variant="success">Feltöltve</Badge>
									) : (
										<Badge variant="warning">Nincs</Badge>
									)}
								</div>
							</CardHeader>
							<CardContent>
								{application.criminal_record_request_url ? (
									<div className="space-y-2">
										<p className="text-xs text-surface-500">
											Feltöltve: {application.criminal_record_request_uploaded_at ? new Date(application.criminal_record_request_uploaded_at).toLocaleString('hu-HU') : '-'}
										</p>
										<a
											href={application.criminal_record_request_url}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
										>
											<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
											</svg>
											Megtekintés / Letöltés
										</a>
									</div>
								) : (
									<p className="text-sm text-surface-500">Nem töltötték fel</p>
								)}
							</CardContent>
						</Card>

						{/* Motivation Letter */}
						<Card>
							<CardHeader className="pb-2">
								<div className="flex items-center justify-between">
									<h3 className="font-medium text-surface-900">Motivációs levél</h3>
									{application.motivation_letter ? (
										<Badge variant="success">{application.motivation_letter_char_count} karakter</Badge>
									) : (
										<Badge variant="danger">Hiányzik</Badge>
									)}
								</div>
							</CardHeader>
							<CardContent>
								{application.motivation_letter ? (
									<div className="space-y-2">
										<p className="text-xs text-surface-500">
											Mentve: {application.motivation_uploaded_at ? new Date(application.motivation_uploaded_at).toLocaleString('hu-HU') : '-'}
										</p>
									</div>
								) : (
									<p className="text-sm text-surface-500">Nincs megírva</p>
								)}
							</CardContent>
						</Card>
					</div>

					{/* Full Motivation Letter */}
					{application.motivation_letter && (
						<Card>
							<CardHeader>
								<h3 className="font-medium text-surface-900">Motivációs levél szövege</h3>
							</CardHeader>
							<CardContent>
								<div className="prose prose-sm max-w-none">
									<p className="whitespace-pre-wrap text-surface-700">
										{application.motivation_letter}
									</p>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Timestamps */}
					<div className="flex gap-4 text-xs text-surface-500">
						<span>Létrehozva: {new Date(application.created_at).toLocaleString('hu-HU')}</span>
						<span>Módosítva: {new Date(application.updated_at).toLocaleString('hu-HU')}</span>
					</div>
				</div>
			</div>
		</div>
	)
}

// Create Admin User Modal
function CreateAdminModal({
	isOpen,
	onClose,
	onCreated,
}: {
	isOpen: boolean
	onClose: () => void
	onCreated: () => void
}) {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [name, setName] = useState('')
	const [isCreating, setIsCreating] = useState(false)
	const [error, setError] = useState('')

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsCreating(true)
		setError('')

		try {
			const res = await fetch('/api/admin/users', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password, name }),
			})

			const data = await res.json() as { success: boolean; error?: string }

			if (!data.success) {
				setError(data.error || 'Hiba történt')
				return
			}

			setEmail('')
			setPassword('')
			setName('')
			onCreated()
			onClose()
		} catch (err) {
			setError('Hiba történt az admin létrehozásakor')
		} finally {
			setIsCreating(false)
		}
	}

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div className="absolute inset-0 bg-black/50" onClick={onClose} />
			<div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full">
				<div className="px-6 py-4 border-b border-surface-200">
					<h2 className="text-lg font-semibold text-surface-900">Új admin felhasználó</h2>
				</div>
				<form onSubmit={handleSubmit} className="p-6 space-y-4">
					{error && (
						<div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
							{error}
						</div>
					)}
					<Input
						label="Név"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Admin neve"
						required
					/>
					<Input
						label="Email cím"
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="admin@example.com"
						required
					/>
					<Input
						label="Jelszó"
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="••••••••"
						required
					/>
					<div className="flex gap-3 pt-2">
						<Button
							type="button"
							variant="secondary"
							onClick={onClose}
							className="flex-1"
						>
							Mégse
						</Button>
						<Button
							type="submit"
							variant="primary"
							isLoading={isCreating}
							className="flex-1"
						>
							Létrehozás
						</Button>
					</div>
				</form>
			</div>
		</div>
	)
}

export default function AdminPage() {
	const router = useRouter()
	const [user, setUser] = useState<User | null>(null)
	const [periods, setPeriods] = useState<Period[]>([])
	const [applications, setApplications] = useState<ApplicationWithUser[]>([])
	const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	
	// New period form
	const [showNewPeriod, setShowNewPeriod] = useState(false)
	const [newPeriodName, setNewPeriodName] = useState('')
	const [newPeriodSlug, setNewPeriodSlug] = useState('')
	const [creatingPeriod, setCreatingPeriod] = useState(false)
	
	// Modals
	const [selectedApplication, setSelectedApplication] = useState<ApplicationWithUser | null>(null)
	const [showCreateAdmin, setShowCreateAdmin] = useState(false)
	
	// Tab state
	const [activeTab, setActiveTab] = useState<'applications' | 'periods' | 'users'>('applications')
	
	// Export state
	const [isExporting, setIsExporting] = useState(false)
	
	useEffect(() => {
		loadData()
	}, [router])
	
	async function loadData() {
		try {
			// Check auth
			const authRes = await fetch('/api/auth/me')
			const authData = await authRes.json() as { success: boolean; user?: User }
			
			if (!authData.success || authData.user?.role !== 'admin') {
				router.push('/login')
				return
			}
			
			setUser(authData.user || null)
			
			// Load periods
			const periodsRes = await fetch('/api/periods')
			const periodsData = await periodsRes.json() as { success: boolean; data?: Period[] }
			
			if (periodsData.success && periodsData.data) {
				setPeriods(periodsData.data)
				
				   // Mindig az első időszakot válassza ki alapértelmezetten
				   if (periodsData.data.length > 0) {
					   setSelectedPeriod(periodsData.data[0].id)
				   }
			}
		} catch (err) {
			setError('Hiba történt az adatok betöltésekor')
		} finally {
			setLoading(false)
		}
	}
	
	useEffect(() => {
		if (selectedPeriod) {
			loadApplications(selectedPeriod)
		}
	}, [selectedPeriod])
	
	async function loadApplications(periodId: number) {
		try {
			const res = await fetch(`/api/applications?periodId=${periodId}`)
			const data = await res.json() as { success: boolean; data?: ApplicationWithUser[] }
			
			if (data.success && data.data) {
				setApplications(data.data)
			}
		} catch (err) {
			console.error('Error loading applications:', err)
		}
	}
	
	async function handleCreatePeriod(e: React.FormEvent) {
		e.preventDefault()
		setCreatingPeriod(true)
		
		try {
			const res = await fetch('/api/periods', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: newPeriodName,
					slug: newPeriodSlug,
				}),
			})
			
			const data = await res.json() as { success: boolean; data?: Period; error?: string }
			
			if (data.success && data.data) {
				setPeriods([data.data, ...periods])
				setNewPeriodName('')
				setNewPeriodSlug('')
				setShowNewPeriod(false)
			} else {
				alert(data.error)
			}
		} catch (err) {
			alert('Hiba történt az időszak létrehozásakor')
		} finally {
			setCreatingPeriod(false)
		}
	}
	
	async function handleSetActive(periodId: number) {
		try {
			const res = await fetch(`/api/periods/${periodId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ setActive: true }),
			})
			
			if (res.ok) {
				setPeriods(periods.map(p => ({
					...p,
					is_active: p.id === periodId,
				})))
			}
		} catch (err) {
			console.error('Error setting active period:', err)
		}
	}
	
	async function handleDeactivate(periodId: number) {
		try {
			const res = await fetch(`/api/periods/${periodId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ deactivate: true }),
			})
			
			if (res.ok) {
				setPeriods(periods.map(p => ({
					...p,
					is_active: p.id === periodId ? false : p.is_active,
				})))
			}
		} catch (err) {
			console.error('Error deactivating period:', err)
		}
	}
	
	async function handleDeletePeriod(periodId: number) {
		if (!confirm('Biztosan törölni szeretnéd ezt az időszakot?')) {
			return
		}
		
		try {
			const res = await fetch(`/api/periods/${periodId}`, {
				method: 'DELETE',
			})
			
			if (res.ok) {
				setPeriods(periods.filter(p => p.id !== periodId))
				if (selectedPeriod === periodId) {
					setSelectedPeriod(periods[0]?.id || null)
				}
			}
		} catch (err) {
			console.error('Error deleting period:', err)
		}
	}
	
	async function handleExportZip() {
		if (!selectedPeriod) return
		
		setIsExporting(true)
		
		try {
			// Get export manifest
			const res = await fetch(`/api/admin/export?periodId=${selectedPeriod}`)
			const data = await res.json() as { 
				success: boolean
				data?: {
					period: string
					periodSlug: string
					manifest: Array<{
						userId: number
						userName: string
						userEmail: string
						folder: string
						files: Array<{ path: string; fileName: string; type: string }>
						motivationLetter: string | null
					}>
				}
			}
			
			if (!data.success || !data.data) {
				alert('Hiba történt az export során')
				return
			}
			
			// Use JSZip library dynamically
			const JSZip = (await import('jszip')).default
			const zip = new JSZip()
			
			for (const applicant of data.data.manifest) {
				const folder = zip.folder(applicant.folder)
				if (!folder) continue
				
				// Add files
				for (const file of applicant.files) {
					try {
						const fileRes = await fetch(`/api/files/${file.path}`)
						if (fileRes.ok) {
							const blob = await fileRes.blob()
							const ext = file.path.split('.').pop() || 'pdf'
							folder.file(`${file.fileName}.${ext}`, blob)
						}
					} catch (e) {
						console.error(`Error fetching file ${file.path}:`, e)
					}
				}
				
				// Add motivation letter as text file
				if (applicant.motivationLetter) {
					folder.file('motivacios_level.txt', applicant.motivationLetter)
				}
				
				// Add applicant info
				const info = `Név: ${applicant.userName}\nEmail: ${applicant.userEmail}`
				folder.file('info.txt', info)
			}
			
			// Generate and download ZIP
			const content = await zip.generateAsync({ type: 'blob' })
			const url = URL.createObjectURL(content)
			const a = document.createElement('a')
			a.href = url
			a.download = `${data.data.periodSlug}-jelentkezesek.zip`
			document.body.appendChild(a)
			a.click()
			document.body.removeChild(a)
			URL.revokeObjectURL(url)
		} catch (err) {
			console.error('Export error:', err)
			alert('Hiba történt az export során')
		} finally {
			setIsExporting(false)
		}
	}
	
	const handleLogout = async () => {
		await fetch('/api/auth/logout', { method: 'POST' })
		router.push('/')
		router.refresh()
	}
	
	const getDocumentCount = (app: ApplicationWithUser) => {
		let count = 0
		if (app.cv_url) count++
		if (app.recommendation_url) count++
		if (app.recommendation_url_2) count++
		if (app.motivation_letter) count++
		if (app.criminal_record_url) count++
		return count
	}
	
	const REQUIRED_DOC_COUNT = 5
	
	const generateRegistrationLink = (period: Period) => {
		const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
		return `${baseUrl}/`
	}
	
	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text)
		alert('Link vágólapra másolva!')
	}
	
	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
			</div>
		)
	}
	
	return (
		<div className="min-h-screen bg-gradient-to-br from-surface-50 via-primary-50/30 to-accent-50/20">
			{/* Header */}
			<header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-surface-100">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">
						<Link href="/" className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
								<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
								</svg>
							</div>
							<span className="text-lg font-semibold text-surface-900">Admin Panel</span>
						</Link>
						
						<div className="flex items-center gap-4">
							{/* Global Period Selector */}
							<div className="flex items-center gap-2">
								<label className="text-sm text-surface-600">Időszak:</label>
								<select
									value={selectedPeriod || ''}
									onChange={(e) => setSelectedPeriod(Number(e.target.value))}
									className="px-3 py-1.5 border border-surface-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
								>
									{periods.map((period) => (
										<option key={period.id} value={period.id}>
											{period.name} {period.is_active ? '(aktív)' : ''}
										</option>
									))}
								</select>
							</div>
							
							<Link href="/profile">
								<span className="text-sm text-surface-600 hover:text-surface-900 cursor-pointer">{user?.name}</span>
							</Link>
							<Badge variant="info">Admin</Badge>
							<Button variant="ghost" size="sm" onClick={handleLogout}>
								Kijelentkezés
							</Button>
						</div>
					</div>
				</div>
			</header>
			
			{/* Tabs */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
				<div className="flex gap-2 border-b border-surface-200">
					<button
						onClick={() => setActiveTab('applications')}
						className={`px-4 py-2 font-medium text-sm transition-colors ${
							activeTab === 'applications'
								? 'text-primary-600 border-b-2 border-primary-600'
								: 'text-surface-600 hover:text-surface-900'
						}`}
					>
						Jelentkezők
					</button>
					<button
						onClick={() => setActiveTab('periods')}
						className={`px-4 py-2 font-medium text-sm transition-colors ${
							activeTab === 'periods'
								? 'text-primary-600 border-b-2 border-primary-600'
								: 'text-surface-600 hover:text-surface-900'
						}`}
					>
						Időszakok
					</button>
					<button
						onClick={() => setActiveTab('users')}
						className={`px-4 py-2 font-medium text-sm transition-colors ${
							activeTab === 'users'
								? 'text-primary-600 border-b-2 border-primary-600'
								: 'text-surface-600 hover:text-surface-900'
						}`}
					>
						Admin felhasználók
					</button>
				</div>
			</div>
			
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
				{/* Applications Tab */}
				{activeTab === 'applications' && (
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<h2 className="text-lg font-semibold text-surface-900">
										Jelentkezők
										{selectedPeriod && periods.find(p => p.id === selectedPeriod) && (
											<span className="ml-2 text-primary-600">
												({periods.find(p => p.id === selectedPeriod)?.name})
											</span>
										)}
									</h2>
								</div>
								<div className="flex items-center gap-3">
									<Badge variant="neutral">{applications.length} jelentkező</Badge>
									<Button
										variant="secondary"
										size="sm"
										onClick={handleExportZip}
										isLoading={isExporting}
										disabled={applications.length === 0}
									>
										<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
										</svg>
										ZIP Export
									</Button>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							{!selectedPeriod ? (
								<p className="text-center text-surface-500 py-8">
									Válassz egy időszakot a fejlécben
								</p>
							) : applications.length === 0 ? (
								<p className="text-center text-surface-500 py-8">
									Nincs még jelentkező ebben az időszakban
								</p>
							) : (
								<div className="overflow-x-auto">
									<table className="w-full">
										<thead>
											<tr className="border-b border-surface-200">
												<th className="text-left py-3 px-4 text-sm font-medium text-surface-600">Név</th>
												<th className="text-left py-3 px-4 text-sm font-medium text-surface-600">Email</th>
												<th className="text-center py-3 px-4 text-sm font-medium text-surface-600">Dokumentumok</th>
												<th className="text-center py-3 px-4 text-sm font-medium text-surface-600">Státusz</th>
												<th className="text-center py-3 px-4 text-sm font-medium text-surface-600">Műveletek</th>
											</tr>
										</thead>
										<tbody>
											{applications.map((app) => (
												<tr key={app.id} className="border-b border-surface-100 hover:bg-surface-50">
													<td className="py-3 px-4">
														<span className="font-medium text-surface-900">{app.user_name}</span>
													</td>
													<td className="py-3 px-4 text-sm text-surface-600">
														{app.user_email}
													</td>
													<td className="py-3 px-4 text-center">
														<Badge variant={getDocumentCount(app) === REQUIRED_DOC_COUNT ? 'success' : 'warning'}>
															{getDocumentCount(app)}/{REQUIRED_DOC_COUNT}
														</Badge>
													</td>
													<td className="py-3 px-4 text-center">
														<Badge variant={
															getDocumentCount(app) === REQUIRED_DOC_COUNT ? 'success' :
															app.status === 'submitted' ? 'success' :
															app.status === 'approved' ? 'success' :
															app.status === 'rejected' ? 'danger' :
															'warning'
														}>
															   {getDocumentCount(app) === REQUIRED_DOC_COUNT && 'Végleges'}
															   {getDocumentCount(app) < REQUIRED_DOC_COUNT && app.status === 'draft' && 'Részleges'}
															   {getDocumentCount(app) < REQUIRED_DOC_COUNT && app.status === 'submitted' && 'Beküldve'}
															{app.status === 'under_review' && 'Elbírálás alatt'}
															{app.status === 'approved' && 'Elfogadva'}
															{app.status === 'rejected' && 'Elutasítva'}
														</Badge>
													</td>
													<td className="py-3 px-4 text-center">
														<Button
															variant="ghost"
															size="sm"
															onClick={() => setSelectedApplication(app)}
														>
															Részletek
														</Button>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</CardContent>
					</Card>
				)}
				
				{/* Periods Tab */}
				{activeTab === 'periods' && (
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<h2 className="text-lg font-semibold text-surface-900">Időszakok kezelése</h2>
							<Button
								variant="primary"
								size="sm"
								onClick={() => setShowNewPeriod(!showNewPeriod)}
							>
								+ Új időszak
							</Button>
						</CardHeader>
						<CardContent className="space-y-4">
							{showNewPeriod && (
								<form onSubmit={handleCreatePeriod} className="p-4 bg-surface-50 rounded-xl space-y-3">
									<Input
										label="Név"
										placeholder="pl. 2026/1"
										value={newPeriodName}
										onChange={(e) => {
											setNewPeriodName(e.target.value)
											setNewPeriodSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'))
										}}
										required
									/>
									<Input
										label="Slug (URL-ben)"
										placeholder="pl. 2026-1"
										value={newPeriodSlug}
										onChange={(e) => setNewPeriodSlug(e.target.value)}
										required
									/>
									<div className="flex gap-2">
										<Button type="submit" variant="success" size="sm" isLoading={creatingPeriod}>
											Létrehozás
										</Button>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() => setShowNewPeriod(false)}
										>
											Mégse
										</Button>
									</div>
								</form>
							)}
							
							{periods.length === 0 ? (
								<p className="text-sm text-surface-500 text-center py-4">
									Nincs még időszak létrehozva
								</p>
							) : (
								<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
									{periods.map((period) => (
										<div
											key={period.id}
											className={`p-4 rounded-xl border transition-all ${
												period.is_active
													? 'border-primary-300 bg-primary-50'
													: 'border-surface-200 bg-white'
											}`}
										>
											<div className="flex items-center justify-between mb-2">
												<span className="font-medium text-surface-900">{period.name}</span>
												{period.is_active ? (
													<Badge variant="success">Aktív</Badge>
												) : (
													<Badge variant="neutral">Inaktív</Badge>
												)}
											</div>
											<p className="text-xs text-surface-500 mb-3">
												/{period.slug}
											</p>
											<div className="flex flex-wrap gap-2">
												{!period.is_active ? (
													<Button
														variant="success"
														size="sm"
														onClick={() => handleSetActive(period.id)}
													>
														Aktiválás
													</Button>
												) : (
													<Button
														variant="warning"
														size="sm"
														onClick={() => handleDeactivate(period.id)}
													>
														Inaktiválás
													</Button>
												)}
												<Button
													variant="ghost"
													size="sm"
													onClick={() => copyToClipboard(generateRegistrationLink(period))}
												>
													Link másolás
												</Button>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => handleDeletePeriod(period.id)}
													className="text-red-600 hover:text-red-700 hover:bg-red-50"
												>
													Törlés
												</Button>
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				)}
				
				{/* Users Tab */}
				{activeTab === 'users' && (
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<h2 className="text-lg font-semibold text-surface-900">Admin felhasználók</h2>
							<Button
								variant="primary"
								size="sm"
								onClick={() => setShowCreateAdmin(true)}
							>
								+ Új admin
							</Button>
						</CardHeader>
						<CardContent>
							<AdminUsersList />
						</CardContent>
					</Card>
				)}
			</main>
			
			{/* Modals */}
			<ApplicationDetailModal
				application={selectedApplication}
				onClose={() => setSelectedApplication(null)}
			/>
			
			<CreateAdminModal
				isOpen={showCreateAdmin}
				onClose={() => setShowCreateAdmin(false)}
				onCreated={loadData}
			/>
		</div>
	)
}

// Admin Users List Component
function AdminUsersList() {
	const [users, setUsers] = useState<User[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		async function loadUsers() {
			try {
				const res = await fetch('/api/admin/users')
				const data = await res.json() as { success: boolean; data?: User[] }
				if (data.success && data.data) {
					setUsers(data.data.filter(u => u.role === 'admin'))
				}
			} catch (err) {
				console.error('Error loading users:', err)
			} finally {
				setLoading(false)
			}
		}
		loadUsers()
	}, [])

	if (loading) {
		return (
			<div className="flex justify-center py-8">
				<div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
			</div>
		)
	}

	return (
		<div className="overflow-x-auto">
			<table className="w-full">
				<thead>
					<tr className="border-b border-surface-200">
						<th className="text-left py-3 px-4 text-sm font-medium text-surface-600">Név</th>
						<th className="text-left py-3 px-4 text-sm font-medium text-surface-600">Email</th>
						<th className="text-left py-3 px-4 text-sm font-medium text-surface-600">Létrehozva</th>
					</tr>
				</thead>
				<tbody>
					{users.map((user) => (
						<tr key={user.id} className="border-b border-surface-100">
							<td className="py-3 px-4 font-medium text-surface-900">{user.name}</td>
							<td className="py-3 px-4 text-surface-600">{user.email}</td>
							<td className="py-3 px-4 text-surface-500 text-sm">
								{new Date(user.created_at).toLocaleDateString('hu-HU')}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}
