import api from '@/lib/api'
import type {
    Project,
    CreateProjectInput,
    UpdateProjectInput,
} from '@/types'

export interface ProjectMember {
    userId: string
    user: {
        id: string
        firstName: string
        lastName: string
        email: string
    }
    role: 'owner' | 'admin' | 'member' | 'viewer'
    joinedAt: string
}

export const projectService = {
    /**
     * Fetch all projects for the given org.
     * orgId must be provided; it comes from the active orgStore.
     */
    async getAll(orgId: string): Promise<Project[]> {
        const response = await api.get<Project[]>(`/api/orgs/${orgId}/projects`)
        return response.data
    },

    async getById(orgId: string, id: string): Promise<Project> {
        const response = await api.get<Project>(`/api/orgs/${orgId}/projects/${id}`)
        return response.data
    },

    async create(orgId: string, data: Omit<CreateProjectInput, 'ownerId'>): Promise<Project> {
        const response = await api.post<Project>(`/api/orgs/${orgId}/projects`, data)
        return response.data
    },

    async update(orgId: string, id: string, data: UpdateProjectInput): Promise<Project> {
        const response = await api.put<Project>(`/api/orgs/${orgId}/projects/${id}`, data)
        return response.data
    },

    async delete(orgId: string, id: string): Promise<void> {
        await api.delete(`/api/orgs/${orgId}/projects/${id}`)
    },

    // Member management
    async getMembers(orgId: string, projectId: string): Promise<ProjectMember[]> {
        const response = await api.get<ProjectMember[]>(`/api/orgs/${orgId}/projects/${projectId}/members`)
        return response.data
    },

    async addMember(orgId: string, projectId: string, userId: string, role: string = 'member'): Promise<void> {
        await api.post(`/api/orgs/${orgId}/projects/${projectId}/members`, { userId, role })
    },

    async updateMemberRole(orgId: string, projectId: string, userId: string, role: string): Promise<void> {
        await api.put(`/api/orgs/${orgId}/projects/${projectId}/members/${userId}`, { role })
    },

    async removeMember(orgId: string, projectId: string, userId: string): Promise<void> {
        await api.delete(`/api/orgs/${orgId}/projects/${projectId}/members/${userId}`)
    },
}
