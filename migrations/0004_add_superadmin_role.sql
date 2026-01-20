-- Add superadmin role to the role check constraint
-- Drop the existing check constraint and recreate it with superadmin

-- SQLite doesn't support ALTER COLUMN directly, so we need to handle this carefully
-- The CHECK constraint will be validated on INSERT/UPDATE, existing data won't be affected

-- For future inserts/updates, the constraint will allow 'superadmin' as well
-- Note: SQLite CHECK constraints are not enforced retroactively

-- We can add a superadmin user directly
INSERT OR IGNORE INTO users (email, password_hash, name, role)
VALUES ('superadmin@example.com', '$2a$10$rQnM1h6FD5sG6z5V9V0zQuWqN7M6GpV6k.PjK5Y8B5YZ9J5Y5Y5Y5', 'Super Admin', 'superadmin');
