'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import ApplicationDetailModal from '@/components/admin/ApplicationDetailModal'
import CreateAdminModal from '@/components/admin/CreateAdminModal'
import UsersTable from '@/components/admin/UsersTable'
import { useAdminData, useApplications } from '@/hooks/useAdminData'
import type { Period, ApplicationWithUser } from '@/types'

type TabType = 'applications' | 'periods' | 'users'

export default function AdminPage() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const { user, periods, users, loading, loadUsers, setPeriods } = useAdminData()
	const [selectedPeriod, setSelectedPeriod] = useState<number | null>(periods[0]?.id || null)
	const { applications, loading: appsLoading, reload: reloadApps } = useApplications(selectedPeriod)
	
	const [activeTab, setActiveTab] = useState<TabType>((searchParams.get('tab') as TabType) || 'applications')
	const [selectedApplication, setSelectedApplication] = useState<ApplicationWithUser | null>(null)
	const [showCreateAdmin, setShowCreateAdmin] = useState(false)
	const [isExporting, setIsExporting] = useState(false)
	
	// Period management
	const [showNewPeriod, setShowNewPeriod] = useState(false)
	const [newPeriod, setNewPeriod] = useState({ name: '', slug: '' })
	const autoSlug = (name: string) => name.trim().toLowerCase().replace(/\s+/g, '-').replace(/\//g, '-').replace(/[^a-z0-9-]/g, '');
	const [creatingPeriod, setCreatingPeriod] = useState(false)

	// Check auth and redirect if not admin
	useEffect(() => {
		if (!loading && (!user || (user.role !== 'admin' && user.role !== 'superadmin'))) {
			router.push('/login')
		}
	}, [loading, user, router])

	const handleTabChange = (tab: TabType) => {
		setActiveTab(tab)
		const params = new URLSearchParams(searchParams.toString())
		params.set('tab', tab)
		router.replace(`/admin?${params.toString()}`, { scroll: false })
	}

	const handleCreatePeriod = async (e: React.FormEvent) => {
		e.preventDefault()
		setCreatingPeriod(true)
		
		try {
			const res = await fetch('/api/periods', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newPeriod),
			})
			
			const data = await res.json() as { success: boolean; data?: Period; error?: string }
			
			if (data.success && data.data) {
				setPeriods([data.data, ...periods])
				setNewPeriod({ name: '', slug: '' })
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

	const handlePeriodAction = async (periodId: number, action: 'setActive' | 'deactivate' | 'delete') => {
		if (action === 'delete' && !confirm('Biztosan törölni szeretnéd ezt az időszakot?')) return
		
		try {
			const method = action === 'delete' ? 'DELETE' : 'PATCH'
			const body = action !== 'delete' ? JSON.stringify({ [action]: true }) : undefined
			
			const res = await fetch(`/api/periods/${periodId}`, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body,
			})
			
			if (res.ok) {
				if (action === 'delete') {
					setPeriods(periods.filter(p => p.id !== periodId))
					if (selectedPeriod === periodId) setSelectedPeriod(periods[0]?.id || null)
				} else {
					setPeriods(periods.map(p => ({
						...p,
						is_active: action === 'setActive' ? p.id === periodId : (p.id === periodId ? false : p.is_active)
					})))
				}
			}
		} catch (err) {
			console.error('Period action error:', err)
		}
	}

	const handleDeleteUser = async (userId: number) => {
		if (!confirm('Biztosan törölni szeretnéd ezt a felhasználót?')) return

		try {
			const res = await fetch(`/api/admin/users?id=${userId}`, { method: 'DELETE' })
			const data = await res.json() as { success: boolean; error?: string }

			if (!data.success) {
				alert(data.error || 'Hiba történt')
				return
			}

			loadUsers(user)
		} catch (err) {
			alert('Hiba történt a felhasználó törlése során')
		}
	}

	const handleExportZip = async () => {
		if (!selectedPeriod) return
		
		setIsExporting(true)
		
		try {
			const res = await fetch(`/api/admin/export?periodId=${selectedPeriod}`)
			const data = await res.json() as {
				success: boolean
				data?: {
					periodSlug: string
					manifest: Array<{
						folder: string
						userName: string
						userEmail: string
						motivationLetter?: string
						files: Array<{ path: string; fileName: string }>
					}>
				}
			}
			
			if (!data.success || !data.data) {
				alert('Hiba történt az export során')
				return
			}
			
			const JSZip = (await import('jszip')).default
			const zip = new JSZip()
			
			for (const applicant of data.data.manifest) {
				const folder = zip.folder(applicant.folder)
				if (!folder) continue
				
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
				
				if (applicant.motivationLetter) {
					folder.file('motivacios_level.txt', applicant.motivationLetter)
				}
				
				folder.file('info.txt', `Név: ${applicant.userName}\nEmail: ${applicant.userEmail}`)
			}
			
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
		return [app.cv_url, app.recommendation_url, app.recommendation_url_2, app.motivation_letter, app.criminal_record_url]
			.filter(Boolean).length
	}

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text)
		alert('Link vágólapra másolva!')
	}

	if (loading || !user || (user.role !== 'admin' && user.role !== 'superadmin')) {
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
							<Badge variant="info">{user?.role === 'superadmin' ? 'Super Admin' : 'Admin'}</Badge>
							<Button variant="ghost" size="sm" onClick={handleLogout}>Kijelentkezés</Button>
						</div>
					</div>
				</div>
			</header>

			{/* Tabs */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
				<div className="flex gap-2 border-b border-surface-200">
					{(['applications', 'periods', ...(user?.role === 'superadmin' ? ['users'] : [])] as TabType[]).map((tab) => (
						<button
							key={tab}
							onClick={() => handleTabChange(tab)}
							className={`px-4 py-2 font-medium text-sm transition-colors ${
								activeTab === tab
									? 'text-primary-600 border-b-2 border-primary-600'
									: 'text-surface-600 hover:text-surface-900'
							}`}
						>
							{tab === 'applications' ? 'Jelentkezők' : tab === 'periods' ? 'Időszakok' : 'Felhasználók'}
						</button>
					))}
				</div>
			</div>

			{/* Main Content */}
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{activeTab === 'applications' && (
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<div>
								<h2 className="text-lg font-semibold text-surface-900">Jelentkezések</h2>
								<p className="text-sm text-surface-500 mt-1">{applications.length} jelentkező</p>
							</div>
							<Button
								variant="primary"
								size="sm"
								onClick={handleExportZip}
								isLoading={isExporting}
								disabled={!applications.length}
							>
								📦 ZIP Exportálás
							</Button>
						</CardHeader>
						<CardContent>
							{appsLoading ? (
								<div className="flex justify-center py-8">
									<div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
								</div>
							) : applications.length === 0 ? (
								<p className="text-center text-surface-500 py-8">Nincs még jelentkező ebben az időszakban</p>
							) : (
								<div className="overflow-x-auto">
									<table className="w-full">
										<thead>
											<tr className="border-b border-surface-200">
												<th className="text-left py-3 px-4 text-sm font-medium text-surface-600">Név</th>
												<th className="text-left py-3 px-4 text-sm font-medium text-surface-600">Email</th>
												<th className="text-left py-3 px-4 text-sm font-medium text-surface-600">Dokumentumok</th>
												<th className="text-left py-3 px-4 text-sm font-medium text-surface-600">Létrehozva</th>
												<th className="text-left py-3 px-4 text-sm font-medium text-surface-600">Műveletek</th>
											</tr>
										</thead>
										<tbody>
											{applications.map((app) => (
												<tr key={app.id} className="border-b border-surface-100 hover:bg-surface-50 cursor-pointer" onClick={() => setSelectedApplication(app)}>
													<td className="py-3 px-4 font-medium text-surface-900">{app.user_name}</td>
													<td className="py-3 px-4 text-surface-600">{app.user_email}</td>
													<td className="py-3 px-4">
														<Badge variant={getDocumentCount(app) === 5 ? 'success' : 'warning'}>
															{getDocumentCount(app)}/5
														</Badge>
													</td>
													<td className="py-3 px-4 text-surface-500 text-sm">
														{new Date(app.created_at).toLocaleDateString('hu-HU')}
													</td>
													<td className="py-3 px-4">
														<Button variant="ghost" size="sm">Részletek</Button>
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

				{activeTab === 'periods' && (
					<>
						<Card className="mb-4">
							<CardHeader>
								<Button variant="primary" size="sm" onClick={() => setShowNewPeriod(!showNewPeriod)}>
									+ Új időszak
								</Button>
							</CardHeader>
							{showNewPeriod && (
								<CardContent>
									<form onSubmit={handleCreatePeriod} className="space-y-4">
										<Input
											label="Időszak neve"
											value={newPeriod.name}
											onChange={(e) => {
												const name = e.target.value;
												// Csak akkor írjuk felül a slugot, ha az üres vagy egyezik az előző automatikus sluggal
												setNewPeriod(prev => {
													const prevAuto = autoSlug(prev.name);
													const nextAuto = autoSlug(name);
													return {
														name,
														slug: (!prev.slug || prev.slug === prevAuto) ? nextAuto : prev.slug
													};
												});
											}}
											placeholder="pl. 2026/2"
											required
										/>
										<Input
											label="URL slug"
											value={newPeriod.slug}
											onChange={(e) => setNewPeriod({ ...newPeriod, slug: e.target.value })}
											placeholder="pl. 2026-2"
											required
										/>
										<div className="flex gap-3">
											<Button type="button" variant="secondary" onClick={() => setShowNewPeriod(false)}>
												Mégse
											</Button>
											<Button type="submit" variant="primary" isLoading={creatingPeriod}>
												Létrehozás
											</Button>
										</div>
									</form>
								</CardContent>
							)}
						</Card>

						<Card>
							<CardContent>
								<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
									{periods.map((period) => (
										<Card key={period.id} className="p-4">
											<div className="flex flex-col gap-3">
												<div>
													<div className="flex items-center gap-2">
														<h3 className="font-medium text-surface-900">{period.name}</h3>
														{period.is_active && (
															<Badge variant="success" className="bg-green-500 text-white font-semibold">
																Aktív
															</Badge>
														)}
													</div>
													<p className="text-sm text-surface-500">/{period.slug}</p>
												</div>
												<div className="flex flex-wrap gap-2">
													{!period.is_active ? (
														<Button variant="primary" size="sm" onClick={() => handlePeriodAction(period.id, 'setActive')}>
															Aktiválás
														</Button>
													) : (
														<Button variant="secondary" size="sm" onClick={() => handlePeriodAction(period.id, 'deactivate')}>
															Deaktiválás
														</Button>
													)}
													<Button variant="ghost" size="sm" onClick={() => copyToClipboard(`${window.location.origin}/`)}>
														Link másolás
													</Button>
													<Button variant="ghost" size="sm" onClick={() => handlePeriodAction(period.id, 'delete')} className="text-red-600 hover:text-red-700">
														Törlés
													</Button>
												</div>
											</div>
										</Card>
									))}
								</div>
							</CardContent>
						</Card>
					</>
				)}

				{activeTab === 'users' && user?.role === 'superadmin' && (
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<h2 className="text-lg font-semibold text-surface-900">Felhasználók</h2>
							<Button variant="primary" size="sm" onClick={() => setShowCreateAdmin(true)}>
								+ Új admin
							</Button>
						</CardHeader>
						<CardContent>
							<UsersTable users={users} currentUser={user} onDelete={handleDeleteUser} />
						</CardContent>
					</Card>
				)}
			</main>

			<ApplicationDetailModal application={selectedApplication} onClose={() => setSelectedApplication(null)} />
			<CreateAdminModal isOpen={showCreateAdmin} onClose={() => setShowCreateAdmin(false)} onCreated={() => loadUsers(user)} />
		</div>
	)
}
