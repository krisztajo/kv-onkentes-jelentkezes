export interface User {
	id: number
	email: string
	name: string
	role: 'applicant' | 'admin' | 'superadmin'
	created_at: string
	updated_at: string
}

export interface Period {
	id: number
	name: string
	slug: string
	is_active: boolean
	start_date: string | null
	end_date: string | null
	created_at: string
	updated_at: string
}

export interface Application {
	id: number
	user_id: number
	period_id: number
	cv_url: string | null
	cv_uploaded_at: string | null
	recommendation_url: string | null
	recommendation_uploaded_at: string | null
	recommendation_url_2: string | null
	recommendation_uploaded_at_2: string | null
	motivation_letter: string | null
	motivation_letter_char_count: number | null
	motivation_uploaded_at: string | null
	criminal_record_url: string | null
	criminal_record_uploaded_at: string | null
	criminal_record_request_url: string | null
	criminal_record_request_uploaded_at: string | null
	declarations: Record<string, boolean> | null
	status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected'
	created_at: string
	updated_at: string
}

export interface ApplicationWithUser extends Application {
	user_email: string
	user_name: string
	period_name: string
}

export type DocumentType = 'cv' | 'recommendation' | 'recommendation_2' | 'motivation' | 'criminal_record' | 'criminal_record_request'

export interface UploadResult {
	success: boolean
	url?: string
	error?: string
}

export interface AuthResponse {
	success: boolean
	user?: User
	token?: string
	error?: string
}

export interface ApiResponse<T = unknown> {
	success: boolean
	data?: T
	error?: string
}
