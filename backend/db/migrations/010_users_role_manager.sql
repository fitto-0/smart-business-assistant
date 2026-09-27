-- users.role: allow the manager role, matching schema.sql.
-- Some databases were created with a narrower CHECK (user/admin only),
-- which made every attempt to assign "manager" fail with users_role_check.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('user', 'admin', 'manager'));
