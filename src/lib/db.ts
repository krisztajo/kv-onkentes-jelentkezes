import { getRequestContext } from '@cloudflare/next-on-pages'
import type { User, Period, Application, ApplicationWithUser } from '@/types'

export function getDB(): D1Database {
	try {
		const { env } = getRequestContext()
		return env.DB
	} catch (error) {
		throw new Error('Database not available. Make sure you are running with wrangler dev or have setupDevPlatform configured.')
	}
}

export function getR2(): R2Bucket {
	try {
		const { env } = getRequestContext()
		return env.UPLOADS
	} catch (error) {
		throw new Error('R2 storage not available. Make sure you are running with wrangler dev or have setupDevPlatform configured.')
	}
}

// User queries
export async function getUserByEmail(email: string): Promise<User | null> {
	const db = getDB()
	const result = await db
		.prepare('SELECT id, email, name, role, created_at, updated_at FROM users WHERE email = ?')
		.bind(email)
		.first<User>()
	return result || null
}

export async function getUserById(id: number): Promise<User | null> {
	const db = getDB()
	const result = await db
		.prepare('SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = ?')
		.bind(id)
		.first<User>()
	return result || null
}

export async function getUserWithPassword(email: string): Promise<(User & { password_hash: string }) | null> {
	const db = getDB()
	return await db
		.prepare('SELECT * FROM users WHERE email = ?')
		.bind(email)
		.first<User & { password_hash: string }>()
}

export async function createUser(email: string, passwordHash: string, name: string): Promise<User> {
	const db = getDB()
	const result = await db
		.prepare('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?) RETURNING id, email, name, role, created_at, updated_at')
		.bind(email, passwordHash, name)
		.first<User>()
	
	if (!result) {
		throw new Error('Failed to create user')
	}
	return result
}

// Period queries
export async function getAllPeriods(): Promise<Period[]> {
	const db = getDB()
	const result = await db
		.prepare('SELECT * FROM periods ORDER BY created_at DESC')
		.all<Period>()
	return result.results || []
}

export async function getPeriodBySlug(slug: string): Promise<Period | null> {
	const db = getDB()
	return await db
		.prepare('SELECT * FROM periods WHERE slug = ?')
		.bind(slug)
		.first<Period>()
}

export async function getPeriodById(id: number): Promise<Period | null> {
	const db = getDB()
	return await db
		.prepare('SELECT * FROM periods WHERE id = ?')
		.bind(id)
		.first<Period>()
}

export async function getActivePeriod(): Promise<Period | null> {
	const db = getDB()
	return await db
		.prepare('SELECT * FROM periods WHERE is_active = 1 LIMIT 1')
		.first<Period>()
}

export async function createPeriod(name: string, slug: string, startDate?: string, endDate?: string): Promise<Period> {
	const db = getDB()
	const result = await db
		.prepare('INSERT INTO periods (name, slug, start_date, end_date) VALUES (?, ?, ?, ?) RETURNING *')
		.bind(name, slug, startDate || null, endDate || null)
		.first<Period>()
	
	if (!result) {
		throw new Error('Failed to create period')
	}
	return result
}

export async function setActivePeriod(id: number): Promise<void> {
	const db = getDB()
	// First, deactivate all periods
	await db.prepare('UPDATE periods SET is_active = 0').run()
	// Then activate the selected one
	await db.prepare('UPDATE periods SET is_active = 1 WHERE id = ?').bind(id).run()
}

export async function deactivatePeriod(id: number): Promise<void> {
	const db = getDB()
	await db.prepare('UPDATE periods SET is_active = 0 WHERE id = ?').bind(id).run()
}

export async function deletePeriod(id: number): Promise<void> {
	const db = getDB()
	
	// Get period to find its slug
	const period = await getPeriodById(id)
	if (!period) {
		throw new Error('Period not found')
	}
	
	// Delete all files in R2 for this period
	try {
		const r2 = getR2()
		const prefix = `${period.slug}/`
		
		// List all objects with this prefix
		const listed = await r2.list({ prefix })
		
		// Delete all objects
		if (listed.objects.length > 0) {
			await Promise.all(
				listed.objects.map(obj => r2.delete(obj.key))
			)
		}
	} catch (error) {
		console.error('Error deleting R2 files for period:', error)
		// Continue with database deletion even if R2 deletion fails
	}
	
	// Delete period from database (will cascade delete applications)
	await db.prepare('DELETE FROM periods WHERE id = ?').bind(id).run()
}

// Admin user management
export async function getAllUsers(): Promise<User[]> {
	const db = getDB()
	const result = await db
		.prepare('SELECT id, email, name, role, created_at, updated_at FROM users ORDER BY created_at DESC')
		.all<User>()
	return result.results || []
}

export async function createAdminUser(email: string, passwordHash: string, name: string, role: 'admin' | 'superadmin' = 'admin'): Promise<User> {
	const db = getDB()
	const result = await db
		.prepare('INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?) RETURNING id, email, name, role, created_at, updated_at')
		.bind(email, passwordHash, name, role)
		.first<User>()
	
	if (!result) {
		throw new Error('Failed to create admin user')
	}
	return result
}

export async function deleteUser(userId: number): Promise<void> {
	const db = getDB()
	await db
		.prepare('DELETE FROM users WHERE id = ?')
		.bind(userId)
		.run()
}

export async function updateUserPassword(userId: number, newPasswordHash: string): Promise<void> {
	const db = getDB()
	await db
		.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
		.bind(newPasswordHash, new Date().toISOString(), userId)
		.run()
}

export async function getUserApplications(userId: number): Promise<Application[]> {
	const db = getDB()
	const result = await db
		.prepare(`
			SELECT a.*, p.name as period_name, p.is_active as period_is_active
			FROM applications a
			JOIN periods p ON a.period_id = p.id
			WHERE a.user_id = ?
			ORDER BY a.created_at DESC
		`)
		.bind(userId)
		.all<Application & { period_name: string; period_is_active: number }>()
	
	const applications = result.results || []
	
	// Parse JSON declarations for each application
	applications.forEach(app => {
		if (app.declarations && typeof app.declarations === 'string') {
			try {
				app.declarations = JSON.parse(app.declarations as string)
			} catch {
				app.declarations = null
			}
		}
	})
	
	return applications
}

// Application queries
export async function getApplicationByUserAndPeriod(userId: number, periodId: number): Promise<Application | null> {
	const db = getDB()
	const result = await db
		.prepare('SELECT * FROM applications WHERE user_id = ? AND period_id = ?')
		.bind(userId, periodId)
		.first<Application>()
	
	if (result && result.declarations && typeof result.declarations === 'string') {
		try {
			result.declarations = JSON.parse(result.declarations as string)
		} catch {
			result.declarations = null
		}
	}
	
	return result
}

export async function createApplication(userId: number, periodId: number): Promise<Application> {
	const db = getDB()
	const result = await db
		.prepare('INSERT INTO applications (user_id, period_id) VALUES (?, ?) RETURNING *')
		.bind(userId, periodId)
		.first<Application>()
	
	if (!result) {
		throw new Error('Failed to create application')
	}
	return result
}

export async function getOrCreateApplication(userId: number, periodId: number): Promise<Application> {
	const existing = await getApplicationByUserAndPeriod(userId, periodId)
	if (existing) {
		return existing
	}
	return createApplication(userId, periodId)
}

export async function updateApplicationDocument(
	applicationId: number,
	documentType: 'cv' | 'recommendation' | 'recommendation_2' | 'motivation' | 'criminal_record' | 'criminal_record_request',
	url: string | null,
	charCount?: number
): Promise<void> {
	const db = getDB()
	const now = new Date().toISOString()
	
	let query: string
	let params: (string | number | null)[]
	
	switch (documentType) {
		case 'cv':
			query = 'UPDATE applications SET cv_url = ?, cv_uploaded_at = ?, updated_at = ? WHERE id = ?'
			params = [url, now, now, applicationId]
			break
		case 'recommendation':
			query = 'UPDATE applications SET recommendation_url = ?, recommendation_uploaded_at = ?, updated_at = ? WHERE id = ?'
			params = [url, now, now, applicationId]
			break
		case 'recommendation_2':
			query = 'UPDATE applications SET recommendation_url_2 = ?, recommendation_uploaded_at_2 = ?, updated_at = ? WHERE id = ?'
			params = [url, now, now, applicationId]
			break
		case 'motivation':
			query = 'UPDATE applications SET motivation_letter = ?, motivation_letter_char_count = ?, motivation_uploaded_at = ?, updated_at = ? WHERE id = ?'
			params = [url, charCount || 0, now, now, applicationId]
			break
		case 'criminal_record':
			query = 'UPDATE applications SET criminal_record_url = ?, criminal_record_uploaded_at = ?, updated_at = ? WHERE id = ?'
			params = [url, now, now, applicationId]
			break
		case 'criminal_record_request':
			query = 'UPDATE applications SET criminal_record_request_url = ?, criminal_record_request_uploaded_at = ?, updated_at = ? WHERE id = ?'
			params = [url, now, now, applicationId]
			break
	}
	
	await db.prepare(query).bind(...params).run()
}

export async function updateApplicationStatus(applicationId: number, status: Application['status']): Promise<void> {
	const db = getDB()
	await db
		.prepare('UPDATE applications SET status = ?, updated_at = ? WHERE id = ?')
		.bind(status, new Date().toISOString(), applicationId)
		.run()
}

export async function updateApplicationDeclarations(applicationId: number, declarations: Record<string, boolean>): Promise<void> {
	const db = getDB()
	await db
		.prepare('UPDATE applications SET declarations = ?, updated_at = ? WHERE id = ?')
		.bind(JSON.stringify(declarations), new Date().toISOString(), applicationId)
		.run()
}

export async function getApplicationsByPeriod(periodId: number): Promise<ApplicationWithUser[]> {
	const db = getDB()
	const result = await db
		.prepare(`
			SELECT 
				a.*,
				u.email as user_email,
				u.name as user_name,
				p.name as period_name
			FROM applications a
			JOIN users u ON a.user_id = u.id
			JOIN periods p ON a.period_id = p.id
			WHERE a.period_id = ?
			ORDER BY a.created_at DESC
		`)
		.bind(periodId)
		.all<ApplicationWithUser>()
	
	const applications = result.results || []
	
	// Parse JSON declarations for each application
	applications.forEach(app => {
		if (app.declarations && typeof app.declarations === 'string') {
			try {
				app.declarations = JSON.parse(app.declarations as string)
			} catch {
				app.declarations = null
			}
		}
	})
	
	return applications
}

export async function getAllApplications(): Promise<ApplicationWithUser[]> {
	const db = getDB()
	const result = await db
		.prepare(`
			SELECT 
				a.*,
				u.email as user_email,
				u.name as user_name,
				p.name as period_name
			FROM applications a
			JOIN users u ON a.user_id = u.id
			JOIN periods p ON a.period_id = p.id
			ORDER BY a.created_at DESC
		`)
		.all<ApplicationWithUser>()
	
	const applications = result.results || []
	
	// Parse JSON declarations for each application
	applications.forEach(app => {
		if (app.declarations && typeof app.declarations === 'string') {
			try {
				app.declarations = JSON.parse(app.declarations as string)
			} catch {
				app.declarations = null
			}
		}
	})
	
	return applications
}

export async function getApplicationById(id: number): Promise<ApplicationWithUser | null> {
	const db = getDB()
	const result = await db
		.prepare(`
			SELECT 
				a.*,
				u.email as user_email,
				u.name as user_name,
				p.name as period_name
			FROM applications a
			JOIN users u ON a.user_id = u.id
			JOIN periods p ON a.period_id = p.id
			WHERE a.id = ?
		`)
		.bind(id)
		.first<ApplicationWithUser>()
	
	if (result && result.declarations && typeof result.declarations === 'string') {
		try {
			result.declarations = JSON.parse(result.declarations as string)
		} catch {
			result.declarations = null
		}
	}
	
	return result
}
