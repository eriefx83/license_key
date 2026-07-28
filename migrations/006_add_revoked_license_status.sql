ALTER TABLE licenses
  DROP CONSTRAINT IF EXISTS licenses_status_check;

ALTER TABLE licenses
  ADD CONSTRAINT licenses_status_check
  CHECK (status IN ('active', 'disabled', 'revoked'));
