CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP NULL
);

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS organization_id UUID;

ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS organization_id UUID;

ALTER TABLE users
    ADD CONSTRAINT fk_users_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id)
    ON DELETE RESTRICT;

ALTER TABLE projects
    ADD CONSTRAINT fk_projects_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id)
    ON DELETE RESTRICT;

DO $$
DECLARE
    default_org_id UUID;
BEGIN
    IF EXISTS (SELECT 1 FROM users WHERE organization_id IS NULL) THEN
        default_org_id := gen_random_uuid();
        INSERT INTO organizations (id, name, created_by, created_at, updated_at)
        VALUES (default_org_id, 'Default Organization', COALESCE((SELECT id FROM users ORDER BY created_at ASC LIMIT 1), default_org_id), NOW(), NOW())
        ON CONFLICT (name) DO NOTHING;

        UPDATE users
        SET organization_id = (SELECT id FROM organizations WHERE name = 'Default Organization' LIMIT 1)
        WHERE organization_id IS NULL;

        UPDATE projects p
        SET organization_id = u.organization_id
        FROM users u
        WHERE p.owner_id = u.id AND p.organization_id IS NULL;

        UPDATE projects
        SET organization_id = (SELECT id FROM organizations WHERE name = 'Default Organization' LIMIT 1)
        WHERE organization_id IS NULL;
    END IF;
END $$;

ALTER TABLE users
    ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE projects
    ALTER COLUMN organization_id SET NOT NULL;

DROP INDEX IF EXISTS idx_projects_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_org_key ON projects(organization_id, key);
