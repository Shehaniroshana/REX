DROP INDEX IF EXISTS idx_projects_org_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_key ON projects(key);

ALTER TABLE projects DROP CONSTRAINT IF EXISTS fk_projects_organization;
ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_organization;

ALTER TABLE projects DROP COLUMN IF EXISTS organization_id;
ALTER TABLE users DROP COLUMN IF EXISTS organization_id;

DROP TABLE IF EXISTS organizations;
