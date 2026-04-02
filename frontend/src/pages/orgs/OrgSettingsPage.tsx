import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { organizationService } from '@/services/organizationService'
import { useOrgStore } from '@/store/orgStore'
import { useAuthStore } from '@/store/authStore'
import { Settings2, Users, Mail, UserPlus, RefreshCw, Trash2, ArrowLeft } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { Organization, OrganizationMember } from '@/types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials, formatDate } from '@/lib/utils'

export default function OrgSettingsPage() {
    const { orgId } = useParams()
    const navigate = useNavigate()
    const { toast } = useToast()
    const { user } = useAuthStore()
    const { fetchOrgs } = useOrgStore()

    const [org, setOrg] = useState<Organization | null>(null)
    const [members, setMembers] = useState<OrganizationMember[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'general' | 'members'>('general')

    const [editName, setEditName] = useState('')
    const [editDesc, setEditDesc] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    const [inviteEmail, setInviteEmail] = useState('')
    const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')
    const [isInviting, setIsInviting] = useState(false)

    useEffect(() => {
        if (!orgId) return
        const loadOrgSettings = async () => {
            setIsLoading(true)
            try {
                const [orgData, membersData] = await Promise.all([
                    organizationService.getOrg(orgId),
                    organizationService.getMembers(orgId)
                ])
                setOrg(orgData)
                setEditName(orgData.name)
                setEditDesc(orgData.description || '')
                setMembers(membersData)
            } catch (error: any) {
                toast({
                    title: 'Access Denied',
                    description: 'Could not load organization settings. Are you an admin?',
                    variant: 'destructive'
                })
                navigate('/')
            } finally {
                setIsLoading(false)
            }
        }
        loadOrgSettings()
    }, [orgId, navigate, toast])

    const handleSaveGeneral = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!orgId || !org) return

        setIsSaving(true)
        try {
            const updated = await organizationService.updateOrg(orgId, { name: editName, description: editDesc })
            setOrg(updated)
            fetchOrgs() // Refresh store list
            toast({ title: 'Organization updated successfully' })
        } catch (error: any) {
            toast({
                title: 'Update failed',
                description: error.response?.data?.error || error.message,
                variant: 'destructive'
            })
        } finally {
            setIsSaving(false)
        }
    }

    const handleRegenerateInvite = async () => {
        if (!orgId) return
        try {
            const newCode = await organizationService.regenerateInviteCode(orgId)
            setOrg(prev => prev ? { ...prev, inviteCode: newCode } : prev)
            toast({ title: 'Invite code regenerated' })
        } catch (error: any) {
            toast({ title: 'Failed to regenerate code', variant: 'destructive' })
        }
    }

    const handleInviteUser = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!orgId || !inviteEmail.trim()) return

        setIsInviting(true)
        try {
            const newMember = await organizationService.inviteMember(orgId, inviteEmail.trim(), inviteRole)
            setMembers([...members, newMember])
            setInviteEmail('')
            toast({ title: 'User invited successfully' })
        } catch (error: any) {
            toast({
                title: 'Invite failed',
                description: error.response?.data?.error || error.message,
                variant: 'destructive'
            })
        } finally {
            setIsInviting(false)
        }
    }

    const handleRemoveMember = async (userId: string) => {
        if (!orgId) return
        if (userId === user?.id) {
            if (!confirm("Are you sure you want to leave this organization?")) return
        }
        
        try {
            await organizationService.removeMember(orgId, userId)
            setMembers(members.filter(m => m.userId !== userId))
            if (userId === user?.id) {
                fetchOrgs()
                navigate('/orgs')
            } else {
                toast({ title: 'Member removed' })
            }
        } catch (error: any) {
            toast({ title: 'Failed to remove member', variant: 'destructive' })
        }
    }

    const handleRoleUpdate = async (userId: string, newRole: 'admin' | 'member') => {
        if (!orgId) return
        try {
            await organizationService.updateMemberRole(orgId, userId, newRole)
            setMembers(members.map(m => m.userId === userId ? { ...m, role: newRole } : m))
            toast({ title: 'Role updated' })
        } catch (error: any) {
            toast({ title: 'Failed to update role', variant: 'destructive' })
        }
    }

    const handleDeleteOrg = async () => {
        if (!orgId) return
        if (!confirm("CRITICAL: Are you sure you want to permanently delete this organization? All projects inside will be lost.")) return
        
        try {
            await organizationService.deleteOrg(orgId)
            fetchOrgs()
            navigate('/orgs')
            toast({ title: 'Organization deleted' })
        } catch (error: any) {
            toast({ title: 'Deletion failed', description: error.response?.data?.error || error.message, variant: 'destructive' })
        }
    }

    if (isLoading) {
        return <div className="p-8 text-slate-400">Loading settings...</div>
    }

    if (!org) return <div className="p-8 text-red-400">Organization not found</div>

    return (
        <div className="max-w-4xl mx-auto py-6">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate('/')} className="p-2 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">{org.name} Settings</h1>
                    <p className="text-slate-400 text-sm">Manage organization preferences and members</p>
                </div>
            </div>

            <div className="flex border-b border-slate-700/50 mb-8">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'general' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
                >
                    <div className="flex items-center gap-2"><Settings2 className="w-4 h-4" /> General parameters</div>
                </button>
                <button
                    onClick={() => setActiveTab('members')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'members' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
                >
                    <div className="flex items-center gap-2"><Users className="w-4 h-4" /> Member management</div>
                </button>
            </div>

            {activeTab === 'general' && (
                <div className="space-y-8 animate-fade-in">
                    {/* General Settings */}
                    <div className="glass-card rounded-2xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-6 border-b border-slate-700/50 pb-4">Organization Profile</h2>
                        <form onSubmit={handleSaveGeneral} className="space-y-6 max-w-xl">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Organization Name</label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                                <textarea
                                    value={editDesc}
                                    onChange={e => setEditDesc(e.target.value)}
                                    rows={3}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                                    placeholder="What is this organization for?"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-6 py-2 rounded-xl text-sm font-medium bg-cyan-500 text-white hover:bg-cyan-400 transition-colors disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    </div>

                    {/* Invite Code */}
                    <div className="glass-card rounded-2xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-6 border-b border-slate-700/50 pb-4">Join Code</h2>
                        <p className="text-sm text-slate-400 mb-4">Share this code with users to let them join your organization directly.</p>
                        <div className="flex items-center gap-4 max-w-xl">
                            <code className="flex-1 bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-cyan-400 font-mono tracking-widest text-lg text-center select-all">
                                {org.inviteCode || 'No Code Generated'}
                            </code>
                            <button
                                onClick={handleRegenerateInvite}
                                className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors"
                                title="Regenerate Code"
                            >
                                <RefreshCw className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="glass-card rounded-2xl p-6 border-red-500/20 bg-red-500/5">
                        <h2 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h2>
                        <p className="text-sm text-slate-400 mb-6">Irreversible and destructive actions.</p>
                        <button
                            onClick={handleDeleteOrg}
                            className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-400 px-6 py-2 rounded-xl text-sm font-medium transition-colors"
                        >
                            Delete Organization
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'members' && (
                <div className="space-y-8 animate-fade-in">
                    {/* Invite Member */}
                    <div className="glass-card rounded-2xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-6 border-b border-slate-700/50 pb-4 flex items-center gap-2"><UserPlus className="w-5 h-5 text-purple-400"/> Invite New Member</h2>
                        <form onSubmit={handleInviteUser} className="flex flex-col sm:flex-row gap-4 max-w-2xl">
                            <div className="flex-1 relative">
                                <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={e => setInviteEmail(e.target.value)}
                                    placeholder="Email address..."
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                    required
                                />
                            </div>
                            <select
                                value={inviteRole}
                                onChange={e => setInviteRole(e.target.value as 'admin'|'member')}
                                className="bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            >
                                <option value="member">Member</option>
                                <option value="admin">Admin</option>
                            </select>
                            <button
                                type="submit"
                                disabled={isInviting || !inviteEmail.trim()}
                                className="px-6 py-2.5 rounded-xl text-sm font-medium bg-purple-500 text-white hover:bg-purple-400 transition-colors disabled:opacity-50"
                            >
                                {isInviting ? 'Inviting...' : 'Send Invite'}
                            </button>
                        </form>
                    </div>

                    {/* Members List */}
                    <div className="glass-card rounded-2xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-700/50 bg-slate-800/30">
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">User</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Role</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Joined</th>
                                    <th className="px-6 py-4 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/30">
                                {members.map((member) => (
                                    <tr key={member.id} className="hover:bg-slate-800/20 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-8 h-8 ring-2 ring-cyan-500/20">
                                                    <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-[10px] text-white font-bold">
                                                        {getInitials(member.user.firstName, member.user.lastName)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-sm font-medium text-white">{member.user.firstName} {member.user.lastName}</p>
                                                    <p className="text-xs text-slate-500">{member.user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={member.role}
                                                onChange={e => handleRoleUpdate(member.userId, e.target.value as 'admin'|'member')}
                                                disabled={member.userId === user?.id} // Don't allow changing own role here
                                                className="bg-transparent border border-transparent hover:border-slate-700 rounded px-2 py-1 text-sm text-slate-300 focus:outline-none disabled:opacity-50 appearance-none"
                                            >
                                                <option value="member">Member</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-400">
                                            {formatDate(member.joinedAt)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleRemoveMember(member.userId)}
                                                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                title={member.userId === user?.id ? "Leave Organization" : "Remove user"}
                                            >
                                                {member.userId === user?.id ? <ArrowLeft className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
