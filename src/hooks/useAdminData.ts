import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { User, Period, ApplicationWithUser } from '@/types'

export function useAdminData() {
	const router = useRouter()
	const [user, setUser] = useState<User | null>(null)
	const [periods, setPeriods] = useState<Period[]>([])
	const [users, setUsers] = useState<User[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')

	useEffect(() => {
		loadData()
	}, [])

	async function loadData() {
		try {
			// Check auth
			const authRes = await fetch('/api/auth/me')
			const authData = await authRes.json() as { success: boolean; user?: User }
			
			if (!authData.success || (authData.user?.role !== 'admin' && authData.user?.role !== 'superadmin')) {
				setUser(null)
				setLoading(false)
				return
			}
			
			setUser(authData.user || null)
			
			// Load users
			await loadUsers(authData.user)
			
			// Load periods
			const periodsRes = await fetch('/api/periods')
			const periodsData = await periodsRes.json() as { success: boolean; data?: Period[] }
			
			if (periodsData.success && periodsData.data) {
				setPeriods(periodsData.data)
			}
		} catch (err) {
			setError('Hiba történt az adatok betöltésekor')
			setUser(null)
		} finally {
			setLoading(false)
		}
	}

	async function loadUsers(currentUser: User | null = user) {
		try {
			const res = await fetch('/api/admin/users')
			const data = await res.json() as { success: boolean; data?: User[] }
			if (data.success && data.data) {
				const filteredUsers = currentUser?.role === 'superadmin' 
					? data.data 
					: data.data.filter(u => u.role !== 'superadmin')
				setUsers(filteredUsers)
			}
		} catch (err) {
			console.error('Error loading users:', err)
		}
	}

	return { user, periods, users, loading, error, loadUsers, setPeriods }
}

export function useApplications(periodId: number | null) {
	const [applications, setApplications] = useState<ApplicationWithUser[]>([])
	const [loading, setLoading] = useState(false)

	useEffect(() => {
		if (periodId) {
			loadApplications(periodId)
		}
	}, [periodId])

	async function loadApplications(id: number) {
		try {
			setLoading(true)
			const res = await fetch(`/api/applications?periodId=${id}`)
			const data = await res.json() as { success: boolean; data?: ApplicationWithUser[] }
			
			if (data.success && data.data) {
				setApplications(data.data)
			}
		} catch (err) {
			console.error('Error loading applications:', err)
		} finally {
			setLoading(false)
		}
	}

	return { applications, loading, reload: () => periodId && loadApplications(periodId) }
}
