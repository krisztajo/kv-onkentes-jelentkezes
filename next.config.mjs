import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev'

// Development platform setup for Cloudflare
if (process.env.NODE_ENV === 'development') {
	await setupDevPlatform()
}

/** @type {import('next').NextConfig} */
const nextConfig = {
	experimental: {
		serverActions: {
			bodySizeLimit: '10mb',
		},
	},
	images: {
		unoptimized: true,
	},
}

export default nextConfig
