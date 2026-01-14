'use client'

import { useState, useRef, ChangeEvent } from 'react'
import { Button } from './button'

interface FileUploadProps {
	label: string
	description?: string
	accept?: string
	onUpload: (file: File) => Promise<void>
	uploadedUrl?: string | null
	uploadedAt?: string | null
	templateUrl?: string
	templateLabel?: string
	isLoading?: boolean
	error?: string
}

export function FileUpload({
	label,
	description,
	accept = '.pdf,.jpg,.jpeg,.png,.webp',
	onUpload,
	uploadedUrl,
	uploadedAt,
	templateUrl,
	templateLabel,
	isLoading,
	error,
}: FileUploadProps) {
	const [dragActive, setDragActive] = useState(false)
	const [localError, setLocalError] = useState<string | null>(null)
	const inputRef = useRef<HTMLInputElement>(null)
	
	const handleDrag = (e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		if (e.type === 'dragenter' || e.type === 'dragover') {
			setDragActive(true)
		} else if (e.type === 'dragleave') {
			setDragActive(false)
		}
	}
	
	const handleDrop = async (e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		setDragActive(false)
		
		if (e.dataTransfer.files && e.dataTransfer.files[0]) {
			await handleFile(e.dataTransfer.files[0])
		}
	}
	
	const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			await handleFile(e.target.files[0])
		}
	}
	
	const handleFile = async (file: File) => {
		setLocalError(null)
		
		// Validate file type
		const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
		if (!allowedTypes.includes(file.type)) {
			setLocalError('Csak PDF vagy képfájl (JPG, PNG, WebP) engedélyezett')
			return
		}
		
		// Validate file size (10MB)
		if (file.size > 10 * 1024 * 1024) {
			setLocalError('A fájl mérete maximum 10MB lehet')
			return
		}
		
		try {
			await onUpload(file)
		} catch (err) {
			setLocalError('Hiba történt a feltöltés során')
		}
	}
	
	const displayError = error || localError
	
	return (
		<div className="w-full">
			<div className="flex items-center justify-between mb-2">
				<label className="block text-sm font-medium text-surface-700">
					{label}
				</label>
				{templateUrl && (
					<a
						href={templateUrl}
						download
						className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
					>
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
						</svg>
						{templateLabel || 'Sablon letöltése'}
					</a>
				)}
			</div>
			
			{description && (
				<p className="text-sm text-surface-500 mb-3">{description}</p>
			)}
			
			<div
				className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
					dragActive
						? 'border-primary-500 bg-primary-50'
						: uploadedUrl
						? 'border-accent-300 bg-accent-50/50'
						: displayError
						? 'border-red-300 bg-red-50/50'
						: 'border-surface-200 hover:border-primary-300 hover:bg-surface-50'
				}`}
				onDragEnter={handleDrag}
				onDragLeave={handleDrag}
				onDragOver={handleDrag}
				onDrop={handleDrop}
			>
				<input
					ref={inputRef}
					type="file"
					accept={accept}
					onChange={handleChange}
					className="hidden"
					disabled={isLoading}
				/>
				
				{uploadedUrl ? (
					<div className="flex flex-col items-center gap-3">
						<div className="w-12 h-12 rounded-full bg-accent-100 flex items-center justify-center">
							<svg className="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
							</svg>
						</div>
						<div>
							<p className="text-sm font-medium text-accent-700">Sikeresen feltöltve</p>
							{uploadedAt && (
								<p className="text-xs text-surface-500 mt-1">
									{new Date(uploadedAt).toLocaleString('hu-HU')}
								</p>
							)}
						</div>
						<div className="flex gap-2">
							<Button
								variant="secondary"
								size="sm"
								onClick={() => window.open(uploadedUrl, '_blank')}
							>
								Megtekintés
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => inputRef.current?.click()}
								disabled={isLoading}
							>
								Csere
							</Button>
						</div>
					</div>
				) : (
					<div className="flex flex-col items-center gap-3">
						<div className={`w-12 h-12 rounded-full flex items-center justify-center ${
							isLoading ? 'bg-primary-100' : 'bg-surface-100'
						}`}>
							{isLoading ? (
								<svg className="animate-spin w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24">
									<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
									<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
								</svg>
							) : (
								<svg className="w-6 h-6 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
								</svg>
							)}
						</div>
						<div>
							<p className="text-sm text-surface-600">
								{isLoading ? 'Feltöltés folyamatban...' : 'Húzd ide a fájlt vagy'}
							</p>
							{!isLoading && (
								<button
									type="button"
									onClick={() => inputRef.current?.click()}
									className="text-sm text-primary-600 hover:text-primary-700 font-medium"
								>
									tallózz
								</button>
							)}
						</div>
						<p className="text-xs text-surface-400">PDF vagy kép (max. 10MB)</p>
					</div>
				)}
			</div>
			
			{displayError && (
				<p className="mt-2 text-sm text-red-600">{displayError}</p>
			)}
		</div>
	)
}
