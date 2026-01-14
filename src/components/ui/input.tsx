'use client'

import { forwardRef, InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	label?: string
	error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
	({ className = '', label, error, id, ...props }, ref) => {
		const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
		
		return (
			<div className="w-full">
				{label && (
					<label htmlFor={inputId} className="block text-sm font-medium text-surface-700 mb-2">
						{label}
					</label>
				)}
				<input
					ref={ref}
					id={inputId}
					className={`w-full px-4 py-3 rounded-xl border bg-white/80 backdrop-blur-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
						error
							? 'border-red-300 focus:ring-red-500/50 focus:border-red-500'
							: 'border-surface-200 focus:ring-primary-500/50 focus:border-primary-500'
					} ${className}`}
					{...props}
				/>
				{error && (
					<p className="mt-2 text-sm text-red-600">{error}</p>
				)}
			</div>
		)
	}
)

Input.displayName = 'Input'

export { Input }
