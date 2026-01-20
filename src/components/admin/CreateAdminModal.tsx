'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface CreateAdminModalProps {
	isOpen: boolean
	onClose: () => void
	onCreated: () => void
}

export default function CreateAdminModal({ isOpen, onClose, onCreated }: CreateAdminModalProps) {
	const [formData, setFormData] = useState({
		email: '',
		password: '',
		name: '',
		role: 'admin' as 'admin' | 'superadmin'
	})
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
				body: JSON.stringify(formData),
			})

			const data = await res.json() as { success: boolean; error?: string }

			if (!data.success) {
				setError(data.error || 'Hiba történt')
				return
			}

			setFormData({ email: '', password: '', name: '', role: 'admin' })
			onCreated()
			onClose()
		} catch (err) {
			setError('Hiba történt az admin létrehozásakor')
		} finally {
			setIsCreating(false)
		}
	}

	const updateField = (field: keyof typeof formData, value: string) => {
		setFormData(prev => ({ ...prev, [field]: value }))
	}

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div className="absolute inset-0 bg-black/50" onClick={onClose} />
			<div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full">
				<div className="px-6 py-4 border-b border-surface-200">
					<h2 className="text-lg font-semibold text-surface-900">Új felhasználó</h2>
				</div>
				<form onSubmit={handleSubmit} className="p-6 space-y-4">
					{error && (
						<div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
					)}
					<Input
						label="Név"
						value={formData.name}
						onChange={(e) => updateField('name', e.target.value)}
						placeholder="Admin neve"
						required
					/>
					<Input
						label="Email cím"
						type="email"
						value={formData.email}
						onChange={(e) => updateField('email', e.target.value)}
						placeholder="admin@example.com"
						required
					/>
					<Input
						label="Jelszó"
						type="password"
						value={formData.password}
						onChange={(e) => updateField('password', e.target.value)}
						placeholder="••••••••"
						required
					/>
					<div>
						<label className="block text-sm font-medium text-surface-700 mb-2">
							Jogosultsági szint
						</label>
						<select
							value={formData.role}
							onChange={(e) => updateField('role', e.target.value)}
							className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
						>
							<option value="admin">Admin</option>
							<option value="superadmin">Super Admin</option>
						</select>
					</div>
					<div className="flex gap-3 pt-2">
						<Button type="button" variant="secondary" onClick={onClose} className="flex-1">
							Mégse
						</Button>
						<Button type="submit" variant="primary" isLoading={isCreating} className="flex-1">
							Létrehozás
						</Button>
					</div>
				</form>
			</div>
		</div>
	)
}
