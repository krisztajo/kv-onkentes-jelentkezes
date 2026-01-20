'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'

function LoginPageInner() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const period = searchParams.get('period')
	
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError('')
		setIsLoading(true)
		
		try {
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password }),
			})
			
			const data = await response.json() as { success: boolean; error?: string; user?: { role: string } }
			
			if (!data.success) {
				setError(data.error || 'Hiba történt a bejelentkezés során')
				return
			}
			
			// Redirect based on role and period
			if (data.user?.role === 'admin' || data.user?.role === 'superadmin') {
				router.push('/admin')
			} else if (period) {
				router.push(`/apply?period=${period}`)
			} else {
				// Get active period and redirect to apply
				try {
					const periodsRes = await fetch('/api/periods')
					const periodsData = await periodsRes.json() as { success: boolean; data?: { slug: string; is_active: boolean }[] }
					const activePeriod = periodsData.data?.find(p => p.is_active)
					if (activePeriod) {
						router.push(`/apply?period=${activePeriod.slug}`)
					} else {
						router.push('/')
					}
				} catch {
					router.push('/')
				}
			}
			router.refresh()
		} catch (err) {
			setError('Hiba történt a bejelentkezés során')
		} finally {
			setIsLoading(false)
		}
	}
	
	return (
		<div className="min-h-screen flex items-center justify-center p-4">
			<div className="absolute inset-0 bg-hero-pattern" />
			<div className="absolute top-20 left-10 w-72 h-72 bg-primary-200/30 rounded-full blur-3xl" />
			<div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-200/30 rounded-full blur-3xl" />
			
			<Card className="relative w-full max-w-md animate-scale-in">
				<CardHeader className="text-center">
					<Link href="/" className="inline-flex items-center justify-center gap-2 mb-4">
						<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
							<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
							</svg>
						</div>
					</Link>
					<h1 className="text-2xl font-display font-bold text-surface-900">Bejelentkezés</h1>
					<p className="text-surface-500 mt-2">Jelentkezz be a fiókodba</p>
				</CardHeader>
				
				<form onSubmit={handleSubmit}>
					<CardContent className="space-y-4">
						{error && (
							<div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
								{error}
							</div>
						)}
						
						<Input
							label="Email cím"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="pelda@email.com"
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
					</CardContent>
					
					<CardFooter className="flex flex-col gap-4">
						<Button
							type="submit"
							variant="primary"
							className="w-full"
							isLoading={isLoading}
						>
							Bejelentkezés
						</Button>
						
						<p className="text-sm text-center text-surface-500">
							Nincs még fiókod?{' '}
							<Link
								href={period ? `/register?period=${period}` : '/register'}
								className="text-primary-600 hover:text-primary-700 font-medium"
							>
								Regisztrálj
							</Link>
						</p>
					</CardFooter>
				</form>
			</Card>
		</div>
	)

}

export default function LoginPage() {
	return (
		<Suspense>
			<LoginPageInner />
		</Suspense>
	)
}
