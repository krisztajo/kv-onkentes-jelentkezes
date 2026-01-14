'use client'

import { forwardRef, TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
	label?: string
	error?: string
	charCount?: number
	minChars?: number
	maxChars?: number
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
	({ className = '', label, error, id, charCount, minChars, maxChars, ...props }, ref) => {
		const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')
		
		const getCharCountColor = () => {
			if (!charCount) return 'text-surface-400'
			if (minChars && charCount < minChars) return 'text-amber-600'
			if (maxChars && charCount > maxChars) return 'text-red-600'
			return 'text-accent-600'
		}
		
		return (
			<div className="w-full">
				{label && (
					<label htmlFor={textareaId} className="block text-sm font-medium text-surface-700 mb-2">
						{label}
					</label>
				)}
				<textarea
					ref={ref}
					id={textareaId}
					className={`w-full px-4 py-3 rounded-xl border bg-white/80 backdrop-blur-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 transition-all duration-200 resize-y min-h-[200px] ${
						error
							? 'border-red-300 focus:ring-red-500/50 focus:border-red-500'
							: 'border-surface-200 focus:ring-primary-500/50 focus:border-primary-500'
					} ${className}`}
					{...props}
				/>
				<div className="flex justify-between items-center mt-2">
					{error ? (
						<p className="text-sm text-red-600">{error}</p>
					) : (
						<p className="text-sm text-surface-500">
							{minChars && maxChars && `${minChars} - ${maxChars} karakter`}
						</p>
					)}
					{charCount !== undefined && (
						<p className={`text-sm font-medium ${getCharCountColor()}`}>
							{charCount} karakter
						</p>
					)}
				</div>
			</div>
		)
	}
)

Textarea.displayName = 'Textarea'

export { Textarea }
