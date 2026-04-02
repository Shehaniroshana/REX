
import { useAuthStore } from '@/store/authStore'

interface Message {
    type: string
    data?: any
}

interface SubscriptionMessage {
    type: 'subscribe' | 'unsubscribe'
    projectId?: string
    data?: any
}

class WebSocketService {
    private ws: WebSocket | null = null
    private reconnectAttempts = 0
    private readonly MAX_RECONNECT_ATTEMPTS = 5
    private WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/api/ws'
    private eventListeners: Map<string, Set<(data: any) => void>> = new Map()
    private reconnectTimeout: ReturnType<typeof setTimeout> | null = null
    private manualDisconnect = false
    private wsCandidates: string[] = []
    private currentCandidateIndex = 0

    // Support dynamic override from Electron preload
    setWsUrl(url: string) {
        this.WS_URL = url
    }

    constructor() {
        // Don't auto-connect in constructor
    }

    connect() {
        this.manualDisconnect = false

        const { token } = useAuthStore.getState()
        if (!token) {
            console.warn('WebSocket: No token available')
            return
        }

        if (this.ws?.readyState === WebSocket.OPEN) {
            console.log('WebSocket already connected')
            return
        }

        try {
            this.wsCandidates = this.getCandidateUrls(token)
            this.currentCandidateIndex = 0
            this.openCurrentCandidate()
        } catch (error) {
            console.error('Failed to create WebSocket:', error)
        }
    }

    private openCurrentCandidate() {
        const wsUrl = this.wsCandidates[this.currentCandidateIndex]
        if (!wsUrl) {
            console.error('WebSocket: No URL candidates available')
            return
        }

        let opened = false
        this.ws = new WebSocket(wsUrl)
        console.log(`WebSocket connecting to: ${wsUrl}`)

        this.ws.onopen = () => {
            opened = true
            console.log('WebSocket connected')
            this.reconnectAttempts = 0
            this.dispatchEvent('connect', { message: 'Connected to WebSocket' })
        }

        this.ws.onmessage = (event) => {
            try {
                const message: Message = JSON.parse(event.data)
                console.log('WebSocket message received:', message)
                this.dispatchEvent(message.type, message.data)
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error)
            }
        }

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error)
            this.dispatchEvent('error', { error: 'WebSocket error' })
        }

        this.ws.onclose = (event) => {
            console.log(`WebSocket disconnected (code: ${event.code}, reason: ${event.reason || 'n/a'})`)
            this.dispatchEvent('disconnect', { message: 'Disconnected from WebSocket' })

            if (!opened && this.currentCandidateIndex < this.wsCandidates.length - 1) {
                this.currentCandidateIndex++
                const fallbackUrl = this.wsCandidates[this.currentCandidateIndex]
                console.warn(`WebSocket handshake failed, trying fallback URL: ${fallbackUrl}`)
                this.openCurrentCandidate()
                return
            }

            if (this.manualDisconnect) {
                return
            }

            // Auth/policy closures should not loop reconnect attempts.
            if (event.code === 1008 || event.code === 4001 || event.code === 4401) {
                console.warn('WebSocket authentication failed; stopping reconnect attempts')
                return
            }

            this.attemptReconnect()
        }
    }

    private getCandidateUrls(token: string): string[] {
        const base = this.buildAuthenticatedWsUrl(token)
        const candidates = [base]

        try {
            const parsed = new URL(base)
            const pathCandidates = new Set<string>([parsed.pathname])

            const hostCandidates = new Set<string>()
            hostCandidates.add(parsed.hostname)
            if (parsed.hostname === '127.0.0.1') {
                hostCandidates.add('localhost')
            }
            if (parsed.hostname === 'localhost') {
                hostCandidates.add('127.0.0.1')
            }

            for (const host of hostCandidates) {
                for (const path of pathCandidates) {
                    const u = new URL(base)
                    u.hostname = host
                    u.pathname = path
                    candidates.push(u.toString())
                }
            }
        } catch {
            // Keep base candidate only when URL parsing fails.
        }

        return Array.from(new Set(candidates))
    }

    private buildAuthenticatedWsUrl(token: string): string {
        try {
            const url = new URL(this.WS_URL)
            url.searchParams.set('token', token)
            return url.toString()
        } catch {
            const separator = this.WS_URL.includes('?') ? '&' : '?'
            return `${this.WS_URL}${separator}token=${encodeURIComponent(token)}`
        }
    }

    private attemptReconnect() {
        if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
            console.log('Max reconnection attempts reached')
            return
        }

        this.reconnectAttempts++
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
        console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})`)

        this.reconnectTimeout = setTimeout(() => {
            this.connect()
        }, delay)
    }

    disconnect() {
        this.manualDisconnect = true

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout)
            this.reconnectTimeout = null
        }

        if (this.ws) {
            const socket = this.ws
            if (socket.readyState === WebSocket.CONNECTING) {
                socket.onopen = () => socket.close()
                socket.onerror = () => {} 
            } else {
                socket.close()
            }
            this.ws = null
        }
    }

    subscribe(projectId: string) {
        const message: SubscriptionMessage = {
            type: 'subscribe',
            projectId,
        }
        this.send(message)
    }

    unsubscribe(projectId: string) {
        const message: SubscriptionMessage = {
            type: 'unsubscribe',
            projectId,
        }
        this.send(message)
    }

    send(message: Message) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message))
        } else {
            console.warn('WebSocket not connected, cannot send message:', message)
        }
    }

    // Listen to events
    on(event: string, callback: (data: any) => void) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set())
        }
        this.eventListeners.get(event)!.add(callback)
    }

    // Unsubscribe from events
    off(event: string, callback?: (data: any) => void) {
        if (!this.eventListeners.has(event)) return

        if (callback) {
            this.eventListeners.get(event)!.delete(callback)
        } else {
            this.eventListeners.delete(event)
        }
    }

    private dispatchEvent(event: string, data: any) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event)!.forEach(callback => {
                try {
                    callback(data)
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error)
                }
            })
        }
    }

    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN
    }
}

export const wsService = new WebSocketService()
