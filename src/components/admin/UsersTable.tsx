'use client'

import { Button } from '@/components/ui/button'
import type { User } from '@/types'

interface UsersTableProps {
	users: User[]
	currentUser: User | null
	onDelete: (userId: number) => void
}

export default function UsersTable({ users, currentUser, onDelete }: UsersTableProps) {
	const getRoleLabel = (role: string) => {
		if (role === 'superadmin') return 'Super Admin'
		if (role === 'admin') return 'Admin'
		return 'Jelentkező'
	}

	return (
		<div className="overflow-x-auto">
			<table className="w-full">
				<thead>
					<tr className="border-b border-surface-200">
						<th className="text-left py-3 px-4 text-sm font-medium text-surface-600">Név</th>
						<th className="text-left py-3 px-4 text-sm font-medium text-surface-600">Email</th>
						<th className="text-left py-3 px-4 text-sm font-medium text-surface-600">Szerepkör</th>
						<th className="text-left py-3 px-4 text-sm font-medium text-surface-600">Létrehozva</th>
						{currentUser?.role === 'superadmin' && (
							<th className="text-left py-3 px-4 text-sm font-medium text-surface-600">Műveletek</th>
						)}
					</tr>
				</thead>
				<tbody>
					{users.map((user) => (
						<tr key={user.id} className="border-b border-surface-100">
							<td className="py-3 px-4 font-medium text-surface-900">{user.name}</td>
							<td className="py-3 px-4 text-surface-600">{user.email}</td>
							<td className="py-3 px-4 text-surface-600">{getRoleLabel(user.role)}</td>
							<td className="py-3 px-4 text-surface-500 text-sm">
								{new Date(user.created_at).toLocaleDateString('hu-HU')}
							</td>
							{currentUser?.role === 'superadmin' && (
								<td className="py-3 px-4">
									{(user.role === 'admin' || user.role === 'superadmin') && (
										<Button
											variant="ghost"
											size="sm"
											onClick={() => onDelete(user.id)}
											className="text-red-600 hover:text-red-700 hover:bg-red-50"
										>
											Törlés
										</Button>
									)}
								</td>
							)}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}
