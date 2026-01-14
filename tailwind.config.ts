import type { Config } from 'tailwindcss'

const config: Config = {
	content: [
		'./src/pages/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/components/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/app/**/*.{js,ts,jsx,tsx,mdx}',
	],
	theme: {
		extend: {
			colors: {
				primary: {
					50: '#fdf4f3',
					100: '#fce8e6',
					200: '#f9d5d1',
					300: '#f4b5ad',
					400: '#ec8b7e',
					500: '#df6454',
					600: '#cb4637',
					700: '#aa382b',
					800: '#8c3127',
					900: '#752e26',
					950: '#3f140f',
				},
				accent: {
					50: '#f0fdf5',
					100: '#dcfce8',
					200: '#bbf7d1',
					300: '#86efad',
					400: '#4ade80',
					500: '#22c55e',
					600: '#16a34a',
					700: '#15803c',
					800: '#166533',
					900: '#14532b',
					950: '#052e14',
				},
				surface: {
					50: '#fafafa',
					100: '#f4f4f5',
					200: '#e4e4e7',
					300: '#d4d4d8',
					400: '#a1a1aa',
					500: '#71717a',
					600: '#52525b',
					700: '#3f3f46',
					800: '#27272a',
					900: '#18181b',
					950: '#09090b',
				}
			},
			fontFamily: {
				sans: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
				display: ['var(--font-playfair)', 'Georgia', 'serif'],
			},
			backgroundImage: {
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
				'hero-pattern': 'linear-gradient(135deg, #fdf4f3 0%, #f0fdf5 50%, #fce8e6 100%)',
			},
		},
	},
	plugins: [
		require('@tailwindcss/forms'),
	],
}
export default config
