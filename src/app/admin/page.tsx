'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Period, ApplicationWithUser, User } from '@/types'

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
				
				// Select active period by default
				const activePeriod = periodsData.data.find((p: Period) => p.is_active)
				if (activePeriod) {
					setSelectedPeriod(activePeriod.id)
				} else if (periodsData.data.length > 0) {
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
	
	const handleLogout = async () => {
		await fetch('/api/auth/logout', { method: 'POST' })
		router.push('/')
		router.refresh()
	}
	
	const getDocumentCount = (app: ApplicationWithUser) => {
		let count = 0
		if (app.cv_url) count++
		if (app.recommendation_url) count++
		if (app.motivation_letter) count++
		if (app.criminal_record_url) count++
		return count
	}
	
	const generateRegistrationLink = (period: Period) => {
		const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
		return `${baseUrl}/register?period=${period.slug}`
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
			<header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-surface-100">
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
							<span className="text-sm text-surface-600">{user?.name}</span>
							<Badge variant="info">Admin</Badge>
							<Button variant="ghost" size="sm" onClick={handleLogout}>
								Kijelentkezés
							</Button>
						</div>
					</div>
				</div>
			</header>
			
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="grid lg:grid-cols-3 gap-8">
					{/* Periods Panel */}
					<div className="lg:col-span-1">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between">
								<h2 className="text-lg font-semibold text-surface-900">Időszakok</h2>
								<Button
									variant="primary"
									size="sm"
									onClick={() => setShowNewPeriod(!showNewPeriod)}
								>
									+ Új
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
									<div className="space-y-2">
										{periods.map((period) => (
											<div
												key={period.id}
												className={`p-4 rounded-xl border transition-all cursor-pointer ${
													selectedPeriod === period.id
														? 'border-primary-300 bg-primary-50'
														: 'border-surface-200 hover:border-primary-200 hover:bg-surface-50'
												}`}
												onClick={() => setSelectedPeriod(period.id)}
											>
												<div className="flex items-center justify-between mb-2">
													<span className="font-medium text-surface-900">{period.name}</span>
													{period.is_active && (
														<Badge variant="success">Aktív</Badge>
													)}
												</div>
												<p className="text-xs text-surface-500 mb-3">
													/{period.slug}
												</p>
												<div className="flex flex-wrap gap-2">
													{!period.is_active && (
														<Button
															variant="secondary"
															size="sm"
															onClick={(e) => {
																e.stopPropagation()
																handleSetActive(period.id)
															}}
														>
															Aktivál
														</Button>
													)}
													<Button
														variant="ghost"
														size="sm"
														onClick={(e) => {
															e.stopPropagation()
															copyToClipboard(generateRegistrationLink(period))
														}}
													>
														Link
													</Button>
													<Button
														variant="ghost"
														size="sm"
														onClick={(e) => {
															e.stopPropagation()
															handleDeletePeriod(period.id)
														}}
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
					</div>
					
					{/* Applications Panel */}
					<div className="lg:col-span-2">
						<Card>
							<CardHeader>
								<div className="flex items-center justify-between">
									<h2 className="text-lg font-semibold text-surface-900">
										Jelentkezők
										{selectedPeriod && periods.find(p => p.id === selectedPeriod) && (
											<span className="ml-2 text-primary-600">
												({periods.find(p => p.id === selectedPeriod)?.name})
											</span>
										)}
									</h2>
									<Badge variant="neutral">{applications.length} jelentkező</Badge>
								</div>
							</CardHeader>
							<CardContent>
								{!selectedPeriod ? (
									<p className="text-center text-surface-500 py-8">
										Válassz egy időszakot a bal oldali listából
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
													<th className="text-center py-3 px-4 text-sm font-medium text-surface-600">CV</th>
													<th className="text-center py-3 px-4 text-sm font-medium text-surface-600">Ajánló</th>
													<th className="text-center py-3 px-4 text-sm font-medium text-surface-600">Motiváció</th>
													<th className="text-center py-3 px-4 text-sm font-medium text-surface-600">Erkölcsi</th>
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
															<Badge variant={getDocumentCount(app) === 4 ? 'success' : 'warning'}>
																{getDocumentCount(app)}/4
															</Badge>
														</td>
														<td className="py-3 px-4 text-center">
															{app.cv_url ? (
																<a
																	href={app.cv_url}
																	target="_blank"
																	rel="noopener noreferrer"
																	className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-accent-100 text-accent-600 hover:bg-accent-200 transition-colors"
																	title="CV megtekintése"
																>
																	<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
																	</svg>
																</a>
															) : (
																<span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-surface-100 text-surface-400">
																	<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
																	</svg>
																</span>
															)}
														</td>
														<td className="py-3 px-4 text-center">
															{app.recommendation_url ? (
																<a
																	href={app.recommendation_url}
																	target="_blank"
																	rel="noopener noreferrer"
																	className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-accent-100 text-accent-600 hover:bg-accent-200 transition-colors"
																	title="Ajánlólevél megtekintése"
																>
																	<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
																	</svg>
																</a>
															) : (
																<span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-surface-100 text-surface-400">
																	<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
																	</svg>
																</span>
															)}
														</td>
														<td className="py-3 px-4 text-center">
															{app.motivation_letter ? (
																<button
																	onClick={() => {
																		alert(`Motivációs levél (${app.motivation_letter_char_count} karakter):\n\n${app.motivation_letter}`)
																	}}
																	className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-accent-100 text-accent-600 hover:bg-accent-200 transition-colors"
																	title={`Motivációs levél (${app.motivation_letter_char_count} karakter)`}
																>
																	<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
																	</svg>
																</button>
															) : (
																<span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-surface-100 text-surface-400">
																	<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
																	</svg>
																</span>
															)}
														</td>
														<td className="py-3 px-4 text-center">
															{app.criminal_record_url ? (
																<a
																	href={app.criminal_record_url}
																	target="_blank"
																	rel="noopener noreferrer"
																	className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-accent-100 text-accent-600 hover:bg-accent-200 transition-colors"
																	title="Erkölcsi bizonyítvány megtekintése"
																>
																	<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
																	</svg>
																</a>
															) : (
																<span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-surface-100 text-surface-400">
																	<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
																	</svg>
																</span>
															)}
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				</div>
			</main>
		</div>
	)
}
