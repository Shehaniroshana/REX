import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, AuthResponse, LoginInput, RegisterInput } from '@/types'
import { authService } from '@/services/authService'
import { useOrgStore } from './orgStore'

interface AuthState {
    user: User | null
    token: string | null
    isLoading: boolean
    error: string | null
    login: (data: LoginInput) => Promise<void>
    register: (data: RegisterInput) => Promise<void>
    logout: () => void
    fetchUser: () => Promise<void>
    setAuth: (response: AuthResponse) => void
    setError: (error: string | null) => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isLoading: false,
            error: null,

            login: async (data: LoginInput) => {
                set({ isLoading: true, error: null })
                try {
                    const response: AuthResponse = await authService.login(data)
                    localStorage.setItem('token', response.token)
                    set({ user: response.user, token: response.token, isLoading: false })
                    
                    // Sync organizations
                    useOrgStore.setState({ 
                        orgs: response.orgs,
                        currentOrgId: response.orgs.length > 0 ? response.orgs[0].id : null 
                    })
                } catch (error: any) {
                    const errorMessage = error.response?.data?.error || 'Login failed'
                    set({ error: errorMessage, isLoading: false })
                    throw error
                }
            },

            register: async (data: RegisterInput) => {
                set({ isLoading: true, error: null })
                try {
                    const response: AuthResponse = await authService.register(data)
                    localStorage.setItem('token', response.token)
                    set({ user: response.user, token: response.token, isLoading: false })
                    
                    // Sync organizations
                    useOrgStore.setState({ 
                        orgs: response.orgs,
                        currentOrgId: response.orgs.length > 0 ? response.orgs[0].id : null 
                    })
                } catch (error: any) {
                    const errorMessage = error.response?.data?.error || 'Registration failed'
                    set({ error: errorMessage, isLoading: false })
                    throw error
                }
            },

            logout: () => {
                localStorage.removeItem('token')
                set({ user: null, token: null })
                useOrgStore.setState({ orgs: [], currentOrgId: null })
            },

            fetchUser: async () => {
                const token = get().token
                if (!token) return

                set({ isLoading: true })
                try {
                    const user = await authService.getMe()
                    set({ user, isLoading: false })
                    // Keep orgs in sync after refresh
                    await useOrgStore.getState().fetchOrgs()
                } catch (error) {
                    set({ isLoading: false })
                    get().logout()
                }
            },

            setAuth: (response: AuthResponse) => {
                localStorage.setItem('token', response.token)
                set({ user: response.user, token: response.token })
            },

            setError: (error: string | null) => {
                set({ error })
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ token: state.token }),
        }
    )
)
