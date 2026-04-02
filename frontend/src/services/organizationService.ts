import api from '@/lib/api'
import type { Organization, OrganizationMember } from '@/types'

export const organizationService = {
    // ── Global (no org context needed) ──────────────────────────────────────

    /** List all orgs the current user belongs to */
    async getMyOrgs(): Promise<Organization[]> {
        const response = await api.get('/api/orgs')
        return response.data
    },

    /** Create a new organization. Creator becomes admin. */
    async createOrg(name: string, description?: string): Promise<Organization> {
        const response = await api.post('/api/orgs', { name, description })
        return response.data
    },

    /** Join an org by invite code */
    async joinByInviteCode(inviteCode: string): Promise<Organization> {
        const response = await api.post('/api/orgs/join', { inviteCode })
        return response.data
    },

    // ── Org-scoped (requires membership) ────────────────────────────────────

    /** Get single org details */
    async getOrg(orgId: string): Promise<Organization> {
        const response = await api.get(`/api/orgs/${orgId}`)
        return response.data
    },

    /** Update org name/description (admin only) */
    async updateOrg(orgId: string, data: { name?: string; description?: string }): Promise<Organization> {
        const response = await api.patch(`/api/orgs/${orgId}`, data)
        return response.data
    },

    /** Delete an organization (admin only) */
    async deleteOrg(orgId: string): Promise<void> {
        await api.delete(`/api/orgs/${orgId}`)
    },

    // ── Member management ────────────────────────────────────────────────────

    /** List members with optional role/search filter */
    async getMembers(orgId: string, params?: { role?: string; search?: string }): Promise<OrganizationMember[]> {
        const response = await api.get(`/api/orgs/${orgId}/members`, { params })
        return response.data
    },

    /** Invite an existing user by email (admin only) */
    async inviteMember(orgId: string, email: string, role: 'admin' | 'member' = 'member'): Promise<OrganizationMember> {
        const response = await api.post(`/api/orgs/${orgId}/members`, { email, role })
        return response.data
    },

    /** Update a member's role (admin only) */
    async updateMemberRole(orgId: string, userId: string, role: 'admin' | 'member'): Promise<void> {
        await api.patch(`/api/orgs/${orgId}/members/${userId}`, { role })
    },

    /** Remove a member (admin or self) */
    async removeMember(orgId: string, userId: string): Promise<void> {
        await api.delete(`/api/orgs/${orgId}/members/${userId}`)
    },

    /** Regenerate invite code (admin only) */
    async regenerateInviteCode(orgId: string): Promise<string> {
        const response = await api.post(`/api/orgs/${orgId}/invite-code/regenerate`)
        return response.data.inviteCode
    },
}
