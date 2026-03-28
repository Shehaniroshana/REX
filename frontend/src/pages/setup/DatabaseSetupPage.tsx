import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Database, ShieldCheck, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { setupService } from '@/services/setupService'

interface DatabaseSetupPageProps {
  onConfigured: () => void
}

export default function DatabaseSetupPage({ onConfigured }: DatabaseSetupPageProps) {
  const [databaseUrl, setDatabaseUrl] = useState('')
  const [shouldSeed, setShouldSeed] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await setupService.saveDatabaseURL(databaseUrl, shouldSeed)
      setIsSuccess(true)
      toast({
        title: 'Database configured',
        description: 'URL saved securely.',
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
            {shouldSeed && " We've added sample data to help you get started."}
          </p>

          {shouldSeed && (
            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-6 mb-8 text-left">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">Default Admin Credentials</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                  <span className="text-slate-400 text-sm">Email</span>
                  <span className="font-mono text-cyan-400">admin@rex.com</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-400 text-sm">Password</span>
                  <span className="font-mono text-cyan-400">password</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-4 text-orange-200 text-sm">
              <p>Please restart your backend (Ctrl+C and npm run dev) to apply these changes.</p>
            </div>
            
            <Button 
                onClick={() => {
                   localStorage.setItem('rex_setup_configured', 'true');
                   onConfigured();
                   navigate('/login', { replace: true });
                }}
                className="w-full h-12 bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
            >
              Go to Login
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

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex items-center justify-between">
            <div className="flex gap-3">
              <Database className="w-5 h-5 text-cyan-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-200">Seed with sample data</p>
                <p className="text-xs text-slate-500">Populate the database with demo users, projects, and issues.</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={shouldSeed}
              onChange={(e) => setShouldSeed(e.target.checked)}
              className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
            />
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
