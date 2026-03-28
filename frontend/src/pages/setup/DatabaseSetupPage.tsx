import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Database, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { setupService } from '@/services/setupService'
import api from '@/lib/api'

interface DatabaseSetupPageProps {
  onConfigured: () => void
}

export default function DatabaseSetupPage({ onConfigured }: DatabaseSetupPageProps) {
  const [databaseUrl, setDatabaseUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isBackendReady, setIsBackendReady] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const navigate = useNavigate()
  const { toast } = useToast()

  // After setup, poll /health until the restarted backend reports dbConnected: true
  useEffect(() => {
    if (!isSuccess) return

    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get<{ dbConnected: boolean }>('/health')
        if (res.data?.dbConnected) {
          setIsBackendReady(true)
          if (pollRef.current) clearInterval(pollRef.current)
        }
      } catch {
        // Backend still restarting — keep polling
      }
    }, 1500)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [isSuccess])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await setupService.saveDatabaseURL(databaseUrl)
      setIsSuccess(true)
      toast({
        title: 'Database configured',
        description: 'URL saved securely. Waiting for backend restart...',
      })
    } catch (error: any) {
      toast({
        title: 'Configuration failed',
        description: error.response?.data?.error || 'Failed to save database URL',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="w-full max-w-xl rounded-2xl border border-emerald-500/30 bg-slate-900/90 backdrop-blur-md p-10 shadow-3xl text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 mx-auto mb-6">
            <ShieldCheck className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold mb-4">REX Platform Ready</h1>
          <p className="text-slate-400 mb-8">
            Your database connection is encrypted and the platform is initialized.
            An absolute zero-seed environment is now active.
          </p>

          <div className="space-y-4">
            {!isBackendReady ? (
              <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 text-blue-200 text-sm flex items-center justify-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                <p>Backend is restarting with full API routes. Please wait...</p>
              </div>
            ) : (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-emerald-200 text-sm">
                <p>✅ Backend is ready! You can now register.</p>
              </div>
            )}
            
            <Button 
                disabled={!isBackendReady}
                onClick={() => {
                   localStorage.setItem('rex_setup_configured', 'true');
                   onConfigured();
                   navigate('/register', { replace: true });
                }}
                className="w-full h-12 bg-cyan-600 hover:bg-cyan-500 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBackendReady ? (
                <span className="flex items-center gap-2">Register your account <ArrowRight className="w-4 h-4" /></span>
              ) : (
                <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Waiting for backend...</span>
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-sm p-8 shadow-2xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
            <Database className="w-6 h-6 text-cyan-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Connect your PostgreSQL database</h1>
            <p className="text-slate-400 text-sm">
              This step is required before login so your workspace data goes to your own database.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="database-url" className="text-sm text-slate-300 font-medium">
              PostgreSQL URL
            </label>
            <Input
              id="database-url"
              type="text"
              placeholder="postgres://user:password@host:5432/dbname?sslmode=require"
              value={databaseUrl}
              onChange={(e) => setDatabaseUrl(e.target.value)}
              required
              className="h-12"
            />
            <p className="text-xs text-slate-500">
              Example: postgres://postgres:secret@localhost:5432/rex_db?sslmode=disable
            </p>
          </div>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-900/20 p-4 text-sm text-emerald-200 flex gap-3">
            <ShieldCheck className="w-5 h-5 mt-0.5 shrink-0" />
            <p>
              The database URL is encrypted before being stored on this device.
            </p>
          </div>

          <Button type="submit" className="w-full h-12" disabled={isLoading}>
            {isLoading ? 'Validating connection...' : (
              <span className="flex items-center gap-2">
                Save and continue
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
