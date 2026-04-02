import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrgStore } from '@/store/orgStore'
import { organizationService } from '@/services/organizationService'
import { Building2, Plus, Users, ArrowRight, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import SpaceBackground from '@/components/three/SpaceBackground'

export default function OrganizationsPage() {
    const { orgs, setCurrentOrg, addOrg } = useOrgStore()
    const navigate = useNavigate()
    const { toast } = useToast()

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)
    const [newOrgName, setNewOrgName] = useState('')
    const [inviteCode, setInviteCode] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSelectOrg = (orgId: string) => {
        setCurrentOrg(orgId)
        navigate('/')
    }

    const handleCreateOrg = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newOrgName.trim()) return

        setIsSubmitting(true)
        try {
            const newOrg = await organizationService.createOrg(newOrgName)
            addOrg(newOrg)
            toast({
                title: 'Organization created',
                description: 'You can now start adding projects to your new organization.',
            })
            setIsCreateModalOpen(false)
            setNewOrgName('')
            navigate('/') // Go directly to dashboard with new org selected
        } catch (error: any) {
            toast({
                title: 'Failed to create organization',
                description: error.response?.data?.error || error.message,
                variant: 'destructive',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleJoinOrg = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!inviteCode.trim()) return

        setIsSubmitting(true)
        try {
            const org = await organizationService.joinByInviteCode(inviteCode)
            addOrg(org)
            toast({
                title: 'Joined organization',
                description: `Successfully joined ${org.name}.`,
            })
            setIsJoinModalOpen(false)
            setInviteCode('')
            navigate('/')
        } catch (error: any) {
            toast({
                title: 'Failed to join',
                description: error.response?.data?.error || error.message,
                variant: 'destructive',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-transparent relative flex flex-col items-center justify-center p-6">
            <SpaceBackground />
            
            <div className="w-full max-w-5xl relative z-10 animate-fade-in">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-xl shadow-cyan-500/20 mb-6">
                        <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">Your Organizations</h1>
                    <p className="text-slate-400 text-lg">Select an organization to continue or create a new one.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {/* Existing Orgs */}
                    {orgs.map((org) => (
                        <div
                            key={org.id}
                            onClick={() => handleSelectOrg(org.id)}
                            className="glass-card rounded-2xl p-6 cursor-pointer group hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center text-cyan-400 font-bold mb-4 border border-slate-700/50 group-hover:border-cyan-500/30 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all">
                                    {org.name.substring(0, 2).toUpperCase()}
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">{org.name}</h3>
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <Users className="w-4 h-4" />
                                    <span>Workspace</span>
                                </div>
                            </div>
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                <ArrowRight className="w-5 h-5 text-cyan-400" />
                            </div>
                        </div>
                    ))}

                    {/* Create New Org Card */}
                    <div
                        onClick={() => setIsCreateModalOpen(true)}
                        className="rounded-2xl border-2 border-dashed border-slate-700/50 p-6 flex flex-col items-center justify-center cursor-pointer hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all group min-h-[200px]"
                    >
                        <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-400 group-hover:text-cyan-400 group-hover:scale-110 transition-all mb-4">
                            <Plus className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-300 group-hover:text-cyan-400">Create New</h3>
                    </div>

                    {/* Join Org Card */}
                    <div
                        onClick={() => setIsJoinModalOpen(true)}
                        className="rounded-2xl border-2 border-dashed border-slate-700/50 p-6 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group min-h-[200px]"
                    >
                        <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-400 group-hover:text-purple-400 group-hover:scale-110 transition-all mb-4">
                            <Users className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-300 group-hover:text-purple-400">Join with Code</h3>
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
                    <div className="glass-card rounded-2xl w-full max-w-md overflow-hidden relative" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">Create Organization</h2>
                                <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleCreateOrg} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Organization Name</label>
                                    <input
                                        type="text"
                                        value={newOrgName}
                                        onChange={e => setNewOrgName(e.target.value)}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                                        placeholder="E.g., Acme Corp"
                                        autoFocus
                                        required
                                    />
                                </div>
                                <div className="pt-4 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !newOrgName.trim()}
                                        className="px-4 py-2 rounded-xl text-sm font-medium bg-cyan-500 text-white hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isSubmitting ? 'Creating...' : 'Create Organization'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Join Modal */}
            {isJoinModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
                    <div className="glass-card rounded-2xl w-full max-w-md overflow-hidden relative" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">Join Organization</h2>
                                <button onClick={() => setIsJoinModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleJoinOrg} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Invite Code</label>
                                    <input
                                        type="text"
                                        value={inviteCode}
                                        onChange={e => setInviteCode(e.target.value)}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 font-mono tracking-wider"
                                        placeholder="Paste your 16-character code"
                                        autoFocus
                                        required
                                    />
                                </div>
                                <div className="pt-4 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsJoinModalOpen(false)}
                                        className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !inviteCode.trim()}
                                        className="px-4 py-2 rounded-xl text-sm font-medium bg-purple-500 text-white hover:bg-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isSubmitting ? 'Joining...' : 'Join Organization'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
