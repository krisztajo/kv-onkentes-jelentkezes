'use client'

import { forwardRef, ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'warning'
	size?: 'sm' | 'md' | 'lg'
	isLoading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	({ className = '', variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
		const baseStyles = 'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
		
		const variants = {
			primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 hover:-translate-y-0.5',
			secondary: 'bg-surface-100 text-surface-700 hover:bg-surface-200 focus:ring-surface-400 border border-surface-200',
			success: 'bg-accent-600 text-white hover:bg-accent-700 focus:ring-accent-500 shadow-lg shadow-accent-500/25',
			danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
			ghost: 'bg-transparent text-surface-600 hover:bg-surface-100 hover:text-surface-900',
			warning: 'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-400 shadow-lg shadow-amber-500/25',
		}
		
		const sizes = {
			sm: 'px-4 py-2 text-sm',
			md: 'px-6 py-3 text-base',
			lg: 'px-8 py-4 text-lg',
		}
		
		return (
			<button
				ref={ref}
				className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
				disabled={disabled || isLoading}
				{...props}
			>
				{isLoading ? (
					<>
						<svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
							<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
							<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
						</svg>
						Betöltés...
					</>
				) : children}
			</button>
		)
	}
)

Button.displayName = 'Button'

export { Button }
