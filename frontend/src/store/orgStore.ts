import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Organization } from '@/types'
import { organizationService } from '@/services/organizationService'

interface OrgState {
    orgs: Organization[]
    currentOrgId: string | null
    isLoading: boolean

    // Actions
    setCurrentOrg: (orgId: string) => void
    fetchOrgs: () => Promise<void>
    addOrg: (org: Organization) => void
    removeOrg: (orgId: string) => void
    getCurrentOrg: () => Organization | undefined
}

export const useOrgStore = create<OrgState>()(
    persist(
        (set, get) => ({
            orgs: [],
            currentOrgId: null,
            isLoading: false,

            setCurrentOrg: (orgId: string) => {
                set({ currentOrgId: orgId })
            },

            fetchOrgs: async () => {
                set({ isLoading: true })
                try {
                    const orgs = await organizationService.getMyOrgs()
                    set((state) => ({
                        orgs,
                        // If current org no longer exists in list, reset to first
                        currentOrgId: orgs.find((o) => o.id === state.currentOrgId)
                            ? state.currentOrgId
                            : orgs[0]?.id ?? null,
                        isLoading: false,
                    }))
                } catch {
                    set({ isLoading: false })
                }
            },

            addOrg: (org: Organization) => {
                set((state) => ({
                    orgs: [...state.orgs, org],
                    // Auto-select newly created org
                    currentOrgId: org.id,
                }))
            },

            removeOrg: (orgId: string) => {
                set((state) => ({
                    orgs: state.orgs.filter((o) => o.id !== orgId),
                    currentOrgId: state.currentOrgId === orgId
                        ? (state.orgs.find((o) => o.id !== orgId)?.id ?? null)
                        : state.currentOrgId,
                }))
            },

            getCurrentOrg: () => {
                const state = get()
                return state.orgs.find((o) => o.id === state.currentOrgId)
            },
        }),
        {
            name: 'org-storage',
            partialize: (state) => ({
                currentOrgId: state.currentOrgId,
            }),
        }
    )
)
