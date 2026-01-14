import { z } from 'zod'

export const loginSchema = z.object({
	email: z.string().email('Érvénytelen email cím'),
	password: z.string().min(6, 'A jelszónak legalább 6 karakter hosszúnak kell lennie'),
})

export const registerSchema = z.object({
	email: z.string().email('Érvénytelen email cím'),
	password: z.string().min(6, 'A jelszónak legalább 6 karakter hosszúnak kell lennie'),
	name: z.string().min(2, 'A névnek legalább 2 karakter hosszúnak kell lennie'),
})

export const periodSchema = z.object({
	name: z.string().min(1, 'A név megadása kötelező'),
	slug: z.string().min(1, 'A slug megadása kötelező').regex(/^[a-z0-9-]+$/, 'A slug csak kisbetűket, számokat és kötőjelet tartalmazhat'),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
})

export const motivationLetterSchema = z.object({
	content: z.string()
		.min(1000, 'A motivációs levélnek legalább 1000 karakter hosszúnak kell lennie')
		.max(2500, 'A motivációs levél maximum 2500 karakter lehet'),
})

export const ALLOWED_FILE_TYPES = [
	'application/pdf',
	'image/jpeg',
	'image/jpg',
	'image/png',
	'image/webp',
]

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function validateFile(file: File): { valid: boolean; error?: string } {
	if (!ALLOWED_FILE_TYPES.includes(file.type)) {
		return {
			valid: false,
			error: 'Csak PDF vagy képfájl (JPG, PNG, WebP) engedélyezett',
		}
	}
	
	if (file.size > MAX_FILE_SIZE) {
		return {
			valid: false,
			error: 'A fájl mérete maximum 10MB lehet',
		}
	}
	
	return { valid: true }
}

export function validateMotivationLetter(content: string): { valid: boolean; error?: string; charCount: number } {
	const charCount = content.length
	
	if (charCount < 1000) {
		return {
			valid: false,
			error: `A motivációs levélnek legalább 1000 karakter hosszúnak kell lennie (jelenleg: ${charCount})`,
			charCount,
		}
	}
	
	if (charCount > 2500) {
		return {
			valid: false,
			error: `A motivációs levél maximum 2500 karakter lehet (jelenleg: ${charCount})`,
			charCount,
		}
	}
	
	return { valid: true, charCount }
}
