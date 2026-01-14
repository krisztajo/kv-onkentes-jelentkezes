'use client'

import { HTMLAttributes, forwardRef } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
	variant?: 'default' | 'elevated'
}

const Card = forwardRef<HTMLDivElement, CardProps>(
	({ className = '', variant = 'default', children, ...props }, ref) => {
		const variants = {
			default: 'bg-white/80 backdrop-blur-md rounded-2xl shadow-xl shadow-surface-900/5 border border-white/50',
			elevated: 'bg-white/80 backdrop-blur-md rounded-2xl shadow-xl shadow-surface-900/5 border border-white/50 hover:shadow-2xl hover:shadow-surface-900/10 transition-shadow duration-300',
		}
		
		return (
			<div
				ref={ref}
				className={`${variants[variant]} ${className}`}
				{...props}
			>
				{children}
			</div>
		)
	}
)

Card.displayName = 'Card'

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
	({ className = '', ...props }, ref) => (
		<div
			ref={ref}
			className={`p-6 border-b border-surface-100 ${className}`}
			{...props}
		/>
	)
)

CardHeader.displayName = 'CardHeader'

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
	({ className = '', ...props }, ref) => (
		<div
			ref={ref}
			className={`p-6 ${className}`}
			{...props}
		/>
	)
)

CardContent.displayName = 'CardContent'

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
	({ className = '', ...props }, ref) => (
		<div
			ref={ref}
			className={`p-6 border-t border-surface-100 ${className}`}
			{...props}
		/>
	)
)

CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardContent, CardFooter }
