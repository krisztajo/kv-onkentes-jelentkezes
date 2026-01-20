'use client'

import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ApplicationWithUser } from '@/types'

interface DocumentCardProps {
	title: string
	url?: string | null
	uploadedAt?: string | null
	isOptional?: boolean
	characterCount?: number | null
}

function DocumentCard({ title, url, uploadedAt, isOptional, characterCount }: DocumentCardProps) {
	const hasDocument = url || characterCount !== undefined
	
	return (
		<Card className={isOptional ? 'border-dashed border-surface-300' : ''}>
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<h3 className="font-medium text-surface-900">{title}</h3>
						{isOptional && <Badge variant="info">Opcionális</Badge>}
					</div>
					{hasDocument ? (
						<Badge variant="success">
							{characterCount !== undefined ? `${characterCount} karakter` : 'Feltöltve'}
						</Badge>
					) : (
						<Badge variant={isOptional ? 'warning' : 'danger'}>
							{isOptional ? 'Nincs' : 'Hiányzik'}
						</Badge>
					)}
				</div>
			</CardHeader>
			<CardContent>
				{hasDocument ? (
					<div className="space-y-2">
						{uploadedAt && (
							<p className="text-xs text-surface-500">
								{characterCount !== undefined ? 'Mentve' : 'Feltöltve'}: {new Date(uploadedAt).toLocaleString('hu-HU')}
							</p>
						)}
						{url && (
							<a
								href={url}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
							>
								<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
								</svg>
								Megtekintés / Letöltés
							</a>
						)}
					</div>
				) : (
					<p className="text-sm text-surface-500">{isOptional ? 'Nem töltötték fel' : 'Nincs feltöltve'}</p>
				)}
			</CardContent>
		</Card>
	)
}

function getStatusBadge(application: ApplicationWithUser) {
	const isComplete = application.cv_url && 
		application.recommendation_url && 
		application.recommendation_url_2 && 
		application.motivation_letter && 
		application.criminal_record_url
	
	if (application.status === 'draft' && isComplete) return { variant: 'success', text: 'Végleges' }
	if (application.status === 'draft') return { variant: 'warning', text: 'Részleges' }
	if (application.status === 'submitted') return { variant: 'success', text: 'Végleges' }
	if (application.status === 'under_review') return { variant: 'info', text: 'Elbírálás alatt' }
	if (application.status === 'approved') return { variant: 'success', text: 'Elfogadva' }
	if (application.status === 'rejected') return { variant: 'danger', text: 'Elutasítva' }
	return { variant: 'warning', text: 'Ismeretlen' }
}

interface ApplicationDetailModalProps {
	application: ApplicationWithUser | null
	onClose: () => void
}

export default function ApplicationDetailModal({ application, onClose }: ApplicationDetailModalProps) {
	if (!application) return null

	const status = getStatusBadge(application)

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div className="absolute inset-0 bg-black/50" onClick={onClose} />
			<div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
				<div className="sticky top-0 bg-white border-b border-surface-200 px-6 py-4 rounded-t-2xl">
					<div className="flex items-center justify-between">
						<div>
							<h2 className="text-xl font-semibold text-surface-900">{application.user_name}</h2>
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
					<div className="flex items-center gap-2">
						<span className="text-sm font-medium text-surface-600">Státusz:</span>
						<Badge variant={status.variant as any}>{status.text}</Badge>
					</div>

					<div className="grid md:grid-cols-2 gap-6">
						<DocumentCard 
							title="Önéletrajz (CV)" 
							url={application.cv_url} 
							uploadedAt={application.cv_uploaded_at} 
						/>
						<DocumentCard 
							title="1. Ajánlólevél" 
							url={application.recommendation_url} 
							uploadedAt={application.recommendation_uploaded_at} 
						/>
						<DocumentCard 
							title="2. Ajánlólevél" 
							url={application.recommendation_url_2} 
							uploadedAt={application.recommendation_uploaded_at_2} 
						/>
						<DocumentCard 
							title="Erkölcsi bizonyítvány" 
							url={application.criminal_record_url} 
							uploadedAt={application.criminal_record_uploaded_at} 
						/>
						<DocumentCard 
							title="Erkölcsi ig. igazolás" 
							url={application.criminal_record_request_url} 
							uploadedAt={application.criminal_record_request_uploaded_at}
							isOptional
						/>
						<DocumentCard 
							title="Motivációs levél" 
							characterCount={application.motivation_letter_char_count}
							uploadedAt={application.motivation_uploaded_at} 
						/>
					</div>

					{application.motivation_letter && (
						<Card>
							<CardHeader>
								<h3 className="font-medium text-surface-900">Motivációs levél szövege</h3>
							</CardHeader>
							<CardContent>
								<div className="prose prose-sm max-w-none">
									<p className="whitespace-pre-wrap text-surface-700">{application.motivation_letter}</p>
								</div>
							</CardContent>
						</Card>
					)}

					<div className="flex gap-4 text-xs text-surface-500">
						<span>Létrehozva: {new Date(application.created_at).toLocaleString('hu-HU')}</span>
						<span>Módosítva: {new Date(application.updated_at).toLocaleString('hu-HU')}</span>
					</div>
				</div>
			</div>
		</div>
	)
}
