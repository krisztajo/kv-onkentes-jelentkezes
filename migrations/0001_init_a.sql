-- Users table: registered users (both applicants and admins)
CREATE TABLE IF NOT EXISTS users (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	email TEXT UNIQUE NOT NULL,
	password_hash TEXT NOT NULL,
	name TEXT NOT NULL,
	role TEXT DEFAULT 'applicant' CHECK (role IN ('applicant', 'admin', 'superadmin')),
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Periods table: training periods managed by admin
CREATE TABLE IF NOT EXISTS periods (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT UNIQUE NOT NULL,
	slug TEXT UNIQUE NOT NULL,
	is_active INTEGER DEFAULT 0,
	start_date DATE,
	end_date DATE,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Applications table: links users to periods with document uploads
CREATE TABLE IF NOT EXISTS applications (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	user_id INTEGER NOT NULL,
	period_id INTEGER NOT NULL,
	cv_url TEXT,
	cv_uploaded_at DATETIME,
	recommendation_url TEXT,
	recommendation_uploaded_at DATETIME,
	motivation_letter TEXT,
	motivation_letter_char_count INTEGER,
	motivation_uploaded_at DATETIME,
	criminal_record_url TEXT,
	criminal_record_uploaded_at DATETIME,
	status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected')),
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
	FOREIGN KEY (period_id) REFERENCES periods(id) ON DELETE CASCADE,
	UNIQUE(user_id, period_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_period_id ON applications(period_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_periods_is_active ON periods(is_active);
CREATE INDEX IF NOT EXISTS idx_periods_slug ON periods(slug);

-- Insert default admin user (password: admin123 - change in production!)
INSERT OR IGNORE INTO users (email, password_hash, name, role)
VALUES ('admin@example.com', '$2a$10$rQnM1h6FD5sG6z5V9V0zQuWqN7M6GpV6k.PjK5Y8B5YZ9J5Y5Y5Y5', 'Admin', 'admin');
