import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import type { User } from '@/types'

const JWT_SECRET = new TextEncoder().encode(
	process.env.JWT_SECRET || 'your-secret-key-change-in-production'
)

export async function createToken(user: User): Promise<string> {
	return new SignJWT({
		id: user.id,
		email: user.email,
		name: user.name,
		role: user.role,
	})
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime('7d')
		.sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<User | null> {
	try {
		const { payload } = await jwtVerify(token, JWT_SECRET)
		return {
			id: payload.id as number,
			email: payload.email as string,
			name: payload.name as string,
			role: payload.role as 'applicant' | 'admin',
			created_at: '',
			updated_at: '',
		}
	} catch {
		return null
	}
}

export async function getSession(): Promise<User | null> {
	const cookieStore = await cookies()
	const token = cookieStore.get('auth-token')?.value

	if (!token) {
		return null
	}

	return verifyToken(token)
}

export async function requireAuth(): Promise<User> {
	const user = await getSession()
	if (!user) {
		throw new Error('Unauthorized')
	}
	return user
}

export async function requireAdmin(): Promise<User> {
	const user = await requireAuth()
	if (user.role !== 'admin') {
		throw new Error('Forbidden')
	}
	return user
}

export function hashPassword(password: string): string {
	// Simple hash for demo - in production use a proper hashing library
	// This implementation works in Edge runtime (Cloudflare Workers)
	const salt = 'volunteer-salt-2024'
	const str = password + salt
	
	let hash1 = 0
	let hash2 = 0
	
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i)
		hash1 = ((hash1 << 5) - hash1) + char
		hash1 = hash1 & hash1
		hash2 = ((hash2 << 7) - hash2) + char + i
		hash2 = hash2 & hash2
	}
	
	return 'hash_' + Math.abs(hash1).toString(16).padStart(8, '0') + Math.abs(hash2).toString(16).padStart(8, '0')
}

export function verifyPassword(password: string, hash: string): boolean {
	return hashPassword(password) === hash
}
