'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import type { User } from '@/types'

interface HeaderProps {
	user: User | null
}

export function Header({ user }: HeaderProps) {
	const router = useRouter()
	const [isLoggingOut, setIsLoggingOut] = useState(false)
	
	const handleLogout = async () => {
		setIsLoggingOut(true)
		try {
			await fetch('/api/auth/logout', { method: 'POST' })
			router.push('/')
			router.refresh()
		} catch (error) {
			console.error('Logout error:', error)
		} finally {
			setIsLoggingOut(false)
		}
	}
	
	return (
		<header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-surface-100">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16">
					<Link href="/" className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
							<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
							</svg>
						</div>
						<span className="text-lg font-semibold text-surface-900">Önkéntes Jelentkezés</span>
					</Link>
					
					<nav className="flex items-center gap-4">
						{user ? (
							<>
								{user.role === 'admin' && (
									<Link
										href="/admin"
										className="text-surface-600 hover:text-surface-900 font-medium transition-colors"
									>
										Admin
									</Link>
								)}
								<div className="flex items-center gap-3">
									<div className="text-right">
										<p className="text-sm font-medium text-surface-900">{user.name}</p>
										<p className="text-xs text-surface-500">{user.email}</p>
									</div>
									<Button
										variant="ghost"
										size="sm"
										onClick={handleLogout}
										isLoading={isLoggingOut}
									>
										Kijelentkezés
									</Button>
								</div>
							</>
						) : (
							<>
								<Link href="/login">
									<Button variant="ghost" size="sm">
										Bejelentkezés
									</Button>
								</Link>
								<Link href="/register">
									<Button variant="primary" size="sm">
										Regisztráció
									</Button>
								</Link>
							</>
						)}
					</nav>
				</div>
			</div>
		</header>
	)
}
