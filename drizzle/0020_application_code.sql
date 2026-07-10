ALTER TABLE applications ADD COLUMN IF NOT EXISTS application_code VARCHAR(20);
CREATE UNIQUE INDEX IF NOT EXISTS idx_application_code ON applications(application_code);
