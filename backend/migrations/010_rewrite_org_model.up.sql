-- Add new fields to organizations
ALTER TABLE organizations
    ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

ALTER TABLE organizations
    ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE organizations
    ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);

ALTER TABLE organizations
    ADD COLUMN IF NOT EXISTS invite_code VARCHAR(64);

-- Backfill slug from name (lowercased, spaces replaced with dashes)
UPDATE organizations
SET slug = LOWER(REPLACE(REPLACE(name, ' ', '-'), '''', ''))
WHERE slug IS NULL;

-- Backfill invite_code
UPDATE organizations
SET invite_code = SUBSTR(MD5(RANDOM()::TEXT), 1, 16)
WHERE invite_code IS NULL;

-- Create a unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug) WHERE deleted_at IS NULL;
-- Create a unique index on invite_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_invite_code ON organizations(invite_code) WHERE deleted_at IS NULL;

-- Remove organization_id from users (users now only belong to orgs via organization_members)
-- First drop the foreign key constraint
ALTER TABLE users
    DROP CONSTRAINT IF EXISTS fk_users_organization;

-- Drop the column
ALTER TABLE users
    DROP COLUMN IF EXISTS organization_id;
