import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
	title: 'Önkéntes Jelentkezési Rendszer',
	description: 'Jelentkezz önkéntes képzésre egyszerűen és gyorsan',
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="hu">
			<body className="antialiased">
				{children}
			</body>
		</html>
	)
}
