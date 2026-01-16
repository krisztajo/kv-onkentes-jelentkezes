-- Add second recommendation letter field
ALTER TABLE applications ADD COLUMN recommendation_url_2 TEXT;
ALTER TABLE applications ADD COLUMN recommendation_uploaded_at_2 DATETIME;

-- Add optional criminal record request field (nem kötelező mező)
ALTER TABLE applications ADD COLUMN criminal_record_request_url TEXT;
ALTER TABLE applications ADD COLUMN criminal_record_request_uploaded_at DATETIME;
