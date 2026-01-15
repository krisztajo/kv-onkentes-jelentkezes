'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { User } from '@/types'

export default function ProfilePage() {
	const router = useRouter()
	const [user, setUser] = useState<User | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [success, setSuccess] = useState('')
	
	// Password change form
	const [currentPassword, setCurrentPassword] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [changingPassword, setChangingPassword] = useState(false)
	
	useEffect(() => {
		async function loadUser() {
			try {
				const res = await fetch('/api/auth/me')
				const data = await res.json() as { success: boolean; user?: User }
				
				if (!data.success) {
					router.push('/login')
					return
				}
				
				setUser(data.user || null)
			} catch (err) {
				setError('Hiba történt az adatok betöltésekor')
			} finally {
				setLoading(false)
			}
		}
		
		loadUser()
	}, [router])
	
	const handlePasswordChange = async (e: React.FormEvent) => {
		e.preventDefault()
		setError('')
		setSuccess('')
		
		if (newPassword !== confirmPassword) {
			setError('A jelszavak nem egyeznek')
			return
		}
		
		setChangingPassword(true)
		
		try {
			const res = await fetch('/api/auth/change-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					currentPassword,
					newPassword,
					confirmPassword,
				}),
			})
			
			const data = await res.json() as { success: boolean; error?: string }
			
			if (!data.success) {
				setError(data.error || 'Hiba történt a jelszó megváltoztatásakor')
				return
			}
			
			setSuccess('A jelszó sikeresen megváltoztatva!')
			setCurrentPassword('')
			setNewPassword('')
			setConfirmPassword('')
		} catch (err) {
			setError('Hiba történt a jelszó megváltoztatásakor')
		} finally {
			setChangingPassword(false)
		}
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
							<span className="text-lg font-semibold text-surface-900">Profil</span>
						</Link>
						
						<div className="flex items-center gap-4">
							<span className="text-sm text-surface-600">{user?.name}</span>
							<Badge variant={user?.role === 'admin' ? 'info' : 'neutral'}>
								{user?.role === 'admin' ? 'Admin' : 'Jelentkező'}
							</Badge>
							<Button variant="ghost" size="sm" onClick={handleLogout}>
								Kijelentkezés
							</Button>
						</div>
					</div>
				</div>
			</header>
			
			<main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* User Info Card */}
				<Card className="mb-8">
					<CardHeader>
						<h2 className="text-lg font-semibold text-surface-900">Felhasználói adatok</h2>
					</CardHeader>
					<CardContent>
						<div className="grid gap-4 md:grid-cols-2">
							<div>
								<label className="text-sm font-medium text-surface-600">Név</label>
								<p className="text-surface-900 mt-1">{user?.name}</p>
							</div>
							<div>
								<label className="text-sm font-medium text-surface-600">Email</label>
								<p className="text-surface-900 mt-1">{user?.email}</p>
							</div>
							<div>
								<label className="text-sm font-medium text-surface-600">Szerepkör</label>
								<p className="text-surface-900 mt-1">
									{user?.role === 'admin' ? 'Adminisztrátor' : 'Jelentkező'}
								</p>
							</div>
							<div>
								<label className="text-sm font-medium text-surface-600">Regisztráció</label>
								<p className="text-surface-900 mt-1">
									{user?.created_at ? new Date(user.created_at).toLocaleDateString('hu-HU') : '-'}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
				
				{/* Change Password Card */}
				<Card>
					<CardHeader>
						<h2 className="text-lg font-semibold text-surface-900">Jelszó megváltoztatása</h2>
					</CardHeader>
					<CardContent>
						{error && (
							<div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
								{error}
							</div>
						)}
						
						{success && (
							<div className="mb-4 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
								{success}
							</div>
						)}
						
						<form onSubmit={handlePasswordChange} className="space-y-4">
							<Input
								label="Jelenlegi jelszó"
								type="password"
								value={currentPassword}
								onChange={(e) => setCurrentPassword(e.target.value)}
								placeholder="••••••••"
								required
							/>
							
							<Input
								label="Új jelszó"
								type="password"
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								placeholder="••••••••"
								required
							/>
							
							<Input
								label="Új jelszó megerősítése"
								type="password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								placeholder="••••••••"
								required
							/>
							
							<div className="flex justify-end">
								<Button
									type="submit"
									variant="primary"
									isLoading={changingPassword}
								>
									Jelszó megváltoztatása
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
				
				{/* Navigation */}
				<div className="mt-8 flex gap-4">
					<Link href="/">
						<Button variant="secondary">
							Vissza a főoldalra
						</Button>
					</Link>
					{user?.role === 'admin' && (
						<Link href="/admin">
							<Button variant="primary">
								Admin felület
							</Button>
						</Link>
					)}
				</div>
			</main>
		</div>
	)
}
