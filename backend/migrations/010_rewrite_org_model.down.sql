-- Reverse: add organization_id back to users
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS organization_id UUID;

-- Note: data cannot be restored since it was dropped; this just restores the schema shape.

ALTER TABLE organizations
    DROP COLUMN IF EXISTS slug;

ALTER TABLE organizations
    DROP COLUMN IF EXISTS description;

ALTER TABLE organizations
    DROP COLUMN IF EXISTS avatar_url;

ALTER TABLE organizations
    DROP COLUMN IF EXISTS invite_code;

DROP INDEX IF EXISTS idx_organizations_slug;
DROP INDEX IF EXISTS idx_organizations_invite_code;
