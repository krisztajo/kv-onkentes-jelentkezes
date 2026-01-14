'use client'

import { HTMLAttributes, forwardRef } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
	variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
	({ className = '', variant = 'neutral', children, ...props }, ref) => {
		const variants = {
			success: 'bg-accent-100 text-accent-700',
			warning: 'bg-amber-100 text-amber-700',
			danger: 'bg-red-100 text-red-700',
			info: 'bg-blue-100 text-blue-700',
			neutral: 'bg-surface-100 text-surface-600',
		}
		
		return (
			<span
				ref={ref}
				className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
				{...props}
			>
				{children}
			</span>
		)
	}
)

Badge.displayName = 'Badge'

export { Badge }
