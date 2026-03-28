import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
    // Skip auth for setup routes
    if (config.url?.includes('/setup')) {
        return config
    }
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Handle 401 responses
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Skip redirect for setup routes OR base status check to avoid infinite loops
        if (error.config?.url?.includes('/setup')) {
            return Promise.reject(error)
        }

        if (error.response?.status === 401) {
            localStorage.removeItem('token')
            
            // Current location check
            const path = window.location.hash || window.location.pathname
            const isAuthPage = path.includes('login') || path.includes('register') || path.includes('setup')
            
            if (!isAuthPage) {
                window.location.href = '#/login'
            }
        }
        return Promise.reject(error)
    }
)

export default api
