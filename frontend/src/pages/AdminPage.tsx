import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Users, UserPlus, Shield, ShieldCheck, ShieldAlert,
    Trash2, ToggleLeft, ToggleRight, Search,
    Mail, Calendar, MoreVertical, Check,
    UserCheck, Crown, Edit2, Key, FolderPlus
} from 'lucide-react'
import { adminService } from '@/services/adminService'
import type { User, Project, CreateUserInput, UpdateUserInput, UserStats, UpdateProjectInput, CreateProjectInput } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import RoleBadge from '@/components/common/RoleBadge'
import StatusBadge from '@/components/common/StatusBadge'
import StatCard from '@/components/common/StatCard'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import CreateUserModal from '@/components/modals/CreateUserModal'
import EditUserModal from '@/components/modals/EditUserModal'
import ResetPasswordModal from '@/components/modals/ResetPasswordModal'
import CreateProjectModal from '@/components/modals/CreateProjectModal'
import EditProjectModal from '@/components/modals/EditProjectModal'



export default function AdminPage() {
    const { user: currentUser } = useAuthStore()
    const { toast } = useToast()
    const [users, setUsers] = useState<User[]>([])
    const [stats, setStats] = useState<UserStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterRole, setFilterRole] = useState<string>('all')
    const [filterStatus, setFilterStatus] = useState<string>('all')
    const [projects, setProjects] = useState<Project[]>([])
    const [activeTab, setActiveTab] = useState<'users' | 'projects'>('users')
    const [showCreateModal, setShowCreateModal] = useState(false)

    const [projectSearchQuery, setProjectSearchQuery] = useState('')

    // Create Project state
    const [showCreateProjectModal, setShowCreateProjectModal] = useState(false)

    // Project Stats
    const [projectStats, setProjectStats] = useState<{ totalProjects: number; totalMembers?: number } | null>(null)

    // Editing states
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [editingProject, setEditingProject] = useState<Project | null>(null)
    const [showResetPasswordModal, setShowResetPasswordModal] = useState<string | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [usersData, statsData, projectsData, projectStatsData] = await Promise.all([
                adminService.getAllUsers(),
                adminService.getUserStats(),
                adminService.getAllProjects(),
                adminService.getProjectStats(),
            ])
            setUsers(usersData)
            setStats(statsData)
            setProjects(projectsData)
            setProjectStats(projectStatsData)
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to fetch data',
            })
        } finally {
            setLoading(false)
        }
    }

    const handleCreateUser = async (data: CreateUserInput) => {
        try {
            const user = await adminService.createUser(data)
            setUsers([...users, user])
            setShowCreateModal(false)
            toast({
                title: 'Success',
                description: 'User created successfully',
            })
            fetchData()
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to create user',
            })
        }
    }

    const handleToggleStatus = async (user: User) => {
        try {
            const result = await adminService.toggleUserStatus(user.id)
            setUsers(users.map(u => u.id === user.id ? result.user : u))
            toast({
                title: 'Success',
                description: `User ${result.isActive ? 'activated' : 'deactivated'} successfully`,
            })
            fetchData()
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update user status',
            })
        }
    }

    const handleUpdateRole = async (userId: string, role: string) => {
        try {
            const updatedUser = await adminService.updateUserRole(userId, role)
            setUsers(users.map(u => u.id === userId ? updatedUser : u))

            toast({
                title: 'Success',
                description: 'User role updated successfully',
            })
            fetchData()
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update user role',
            })
        }
    }

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return

        try {
            await adminService.deleteUser(userId)
            setUsers(users.filter(u => u.id !== userId))
            toast({
                title: 'Success',
                description: 'User deleted successfully',
            })
            fetchData()
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to delete user',
            })
        }
    }

    const handleDeleteProject = async (projectId: string) => {
        if (!confirm('Are you sure you want to delete this project? This cannot be undone.')) return

        try {
            await adminService.deleteProject(projectId)
            setProjects(projects.filter(p => p.id !== projectId))
            toast({
                title: 'Success',
                description: 'Project deleted successfully',
            })
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to delete project',
            })
        }
    }

    const handleResetPassword = async (password: string) => {
        if (!showResetPasswordModal || !password) return

        try {
            await adminService.resetUserPassword(showResetPasswordModal, password)
            setShowResetPasswordModal(null)
            toast({
                title: 'Success',
                description: 'Password reset successfully',
            })
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to reset password',
            })
        }
    }

    const openEditUser = (user: User) => {
        setEditingUser(user)
    }

    const handleUpdateUser = async (data: UpdateUserInput) => {
        if (!editingUser) return

        try {
            const updatedUser = await adminService.updateUser(editingUser.id, data)
            setUsers(users.map(u => u.id === editingUser.id ? updatedUser : u))
            setEditingUser(null)
            toast({
                title: 'Success',
                description: 'User details updated successfully',
            })
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update user',
            })
        }
    }

    const handleCreateProject = async (data: CreateProjectInput) => {
        try {
            await adminService.createProject(data)
            setShowCreateProjectModal(false)
            toast({
                title: 'Success',
                description: 'Project created successfully',
            })
            fetchData()
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to create project',
            })
        }
    }

    const openEditProject = (project: Project) => {
        setEditingProject(project)
    }

    const handleUpdateProject = async (data: UpdateProjectInput) => {
        if (!editingProject) return

        try {
            const updatedProject = await adminService.updateProject(editingProject.id, data)
            setProjects(projects.map(p => p.id === editingProject.id ? updatedProject : p))
            setEditingProject(null)
            toast({
                title: 'Success',
                description: 'Project updated successfully',
            })
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update project',
            })
        }
    }

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.lastName.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesRole = filterRole === 'all' || user.role === filterRole
        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'active' && user.isActive) ||
            (filterStatus === 'inactive' && !user.isActive)
        return matchesSearch && matchesRole && matchesStatus
    })

    const filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
        project.key.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
        (project.owner?.firstName + ' ' + project.owner?.lastName).toLowerCase().includes(projectSearchQuery.toLowerCase())
    )

    if (currentUser?.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-transparent">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center p-12 glass-card rounded-3xl border border-red-500/20"
                >
                    <div className="w-20 h-20 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                        <ShieldAlert className="w-10 h-10 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
                    <p className="text-slate-400">You need admin privileges to access this page.</p>
                </motion.div>
            </div>
        )
    }

    return (
        <>
            <div className="min-h-screen bg-transparent animate-fade-in pb-12">
            {/* Header */}
            <div className="sidebar-glass sticky top-0 z-20 border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
                                Admin Dashboard
                            </h1>
                            <p className="text-slate-500 mt-1">Manage users and system settings</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-1 mt-6 border-b border-slate-800">
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-all border-b-2 relative ${activeTab === 'users'
                                ? 'text-cyan-400 border-cyan-500 bg-cyan-500/10'
                                : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-800/50'
                                }`}
                        >
                            <Users className="w-4 h-4 inline-block mr-2" />
                            User Management
                        </button>
                        <button
                            onClick={() => setActiveTab('projects')}
                            className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-colors border-b-2 ${activeTab === 'projects'
                                ? 'text-cyan-400 border-cyan-500 bg-cyan-500/10'
                                : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-800/50'
                                }`}
                        >
                            <FolderPlus className="w-4 h-4 inline-block mr-2" />
                            Project Management
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {activeTab === 'users' ? (
                    <>
                        {/* Stats Cards */}
                        {stats && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                                <StatCard title="Total Users" value={stats.totalUsers} icon={Users} color="blue" />
                                <StatCard title="Active Users" value={stats.activeUsers} icon={UserCheck} color="emerald" delay={0.1} />
                                <StatCard title="Admins" value={stats.byRole.admins} icon={Crown} color="purple" delay={0.2} />
                                <StatCard title="Managers" value={stats.byRole.managers} icon={ShieldCheck} color="amber" delay={0.3} />
                            </div>
                        )}

                        {/* Filters */}
                        <div className="glass-card rounded-2xl p-4 border border-slate-700/50 mb-6">
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex-1 min-w-[250px]">
                                    <div className="relative group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                                        <Input
                                            type="text"
                                            placeholder="Search users..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-12 bg-slate-900/50 border-slate-700 focus:border-cyan-500 text-white"
                                        />
                                    </div>
                                </div>
                                <select
                                    value={filterRole}
                                    onChange={(e) => setFilterRole(e.target.value)}
                                    className="px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white focus:outline-none"
                                >
                                    <option value="all">All Roles</option>
                                    <option value="admin">Admins</option>
                                    <option value="manager">Managers</option>
                                    <option value="user">Users</option>
                                </select>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white focus:outline-none"
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>

                                <Button
                                    onClick={() => setShowCreateModal(true)}
                                    className="btn-neon"
                                >
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Add User
                                </Button>
                            </div>
                        </div>

                        {/* Users List */}
                        <div className="glass-card rounded-2xl border border-slate-700/50 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-slate-900/50 border-b border-slate-800">
                                            <th className="text-left py-4 px-6 text-sm font-semibold text-slate-400">User</th>
                                            <th className="text-left py-4 px-6 text-sm font-semibold text-slate-400">Email</th>
                                            <th className="text-left py-4 px-6 text-sm font-semibold text-slate-400">Role</th>
                                            <th className="text-left py-4 px-6 text-sm font-semibold text-slate-400">Status</th>
                                            <th className="text-left py-4 px-6 text-sm font-semibold text-slate-400">Joined</th>
                                            <th className="text-right py-4 px-6 text-sm font-semibold text-slate-400">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {loading ? (
                                            Array.from({ length: 5 }).map((_, i) => (
                                                <tr key={i} className="animate-pulse">
                                                    <td className="py-4 px-6"><div className="h-10 bg-slate-800 rounded-full w-48" /></td>
                                                    <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-32" /></td>
                                                    <td className="py-4 px-6"><div className="h-6 bg-slate-800 rounded w-20" /></td>
                                                    <td className="py-4 px-6"><div className="h-6 bg-slate-800 rounded w-16" /></td>
                                                    <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-24" /></td>
                                                    <td className="py-4 px-6"><div className="h-8 bg-slate-800 rounded w-8 ml-auto" /></td>
                                                </tr>
                                            ))
                                        ) : filteredUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="py-16 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <Users className="w-12 h-12 text-slate-600 mb-4" />
                                                        <p className="text-slate-500">No users found</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            <AnimatePresence>
                                                {filteredUsers.map((user, index) => {
                                                    return (
                                                        <motion.tr
                                                            key={user.id}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: index * 0.02 }}
                                                            className="hover:bg-slate-800/30 transition-colors group"
                                                        >
                                                            <td className="py-4 px-6">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white font-semibold shadow-lg`}>
                                                                        {user.firstName[0]?.toUpperCase()}
                                                                    </div>
                                                                    <span className="font-medium text-white group-hover:text-cyan-400 transition-colors">
                                                                        {user.firstName} {user.lastName}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-6">
                                                                <div className="flex items-center gap-2 text-slate-400">
                                                                    <Mail className="w-4 h-4" />
                                                                    {user.email}
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-6">
                                                                <RoleBadge role={user.role} />
                                                            </td>
                                                            <td className="py-4 px-6">
                                                                <StatusBadge isActive={user.isActive} />
                                                            </td>
                                                            <td className="py-4 px-6 text-slate-500">
                                                                <div className="flex items-center gap-2 text-xs">
                                                                    <Calendar className="w-3.5 h-3.5" />
                                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-6">
                                                                <div className="flex items-center justify-end gap-2 relative">
                                                                    {user.id !== currentUser?.id && (
                                                                        <>
                                                                            <button
                                                                                onClick={() => handleToggleStatus(user)}
                                                                                className={`p-2 rounded-lg transition-colors ${user.isActive
                                                                                    ? 'h:bg-red-500/20 text-slate-500 hover:text-red-400'
                                                                                    : 'h:bg-emerald-500/20 text-slate-500 hover:text-emerald-400'
                                                                                    }`}
                                                                                title={user.isActive ? 'Deactivate' : 'Activate'}
                                                                            >
                                                                                {user.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                                                                            </button>

                                                                            <DropdownMenu>
                                                                                <DropdownMenuTrigger asChild>
                                                                                    <button className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors outline-none focus:ring-2 focus:ring-cyan-500/50">
                                                                                        <MoreVertical className="w-5 h-5" />
                                                                                    </button>
                                                                                </DropdownMenuTrigger>
                                                                                <DropdownMenuContent align="end" className="w-56 glass-card border-slate-700 bg-slate-900/95 backdrop-blur-xl">
                                                                                    <DropdownMenuLabel className="text-xs font-semibold text-slate-500 uppercase">User Actions</DropdownMenuLabel>
                                                                                    <DropdownMenuItem onClick={() => openEditUser(user)} className="cursor-pointer">
                                                                                        <Edit2 className="w-4 h-4 mr-2" />
                                                                                        Edit Details
                                                                                    </DropdownMenuItem>
                                                                                    <DropdownMenuItem onClick={() => setShowResetPasswordModal(user.id)} className="cursor-pointer">
                                                                                        <Key className="w-4 h-4 mr-2" />
                                                                                        Reset Password
                                                                                    </DropdownMenuItem>

                                                                                    <DropdownMenuSeparator className="bg-slate-700" />
                                                                                    <DropdownMenuLabel className="text-xs font-semibold text-slate-500 uppercase">Change Role</DropdownMenuLabel>

                                                                                    {['admin', 'manager', 'user'].map((role) => (
                                                                                        <DropdownMenuItem
                                                                                            key={role}
                                                                                            onClick={() => handleUpdateRole(user.id, role)}
                                                                                            className={`cursor-pointer ${user.role === role ? 'text-cyan-400 bg-cyan-900/10' : 'text-slate-300'}`}
                                                                                        >
                                                                                            {role === 'admin' && <Crown className="w-4 h-4 mr-2" />}
                                                                                            {role === 'manager' && <ShieldCheck className="w-4 h-4 mr-2" />}
                                                                                            {role === 'user' && <Shield className="w-4 h-4 mr-2" />}
                                                                                            {role.charAt(0).toUpperCase() + role.slice(1)}
                                                                                            {user.role === role && <Check className="w-4 h-4 ml-auto" />}
                                                                                        </DropdownMenuItem>
                                                                                    ))}

                                                                                    <DropdownMenuSeparator className="bg-slate-700" />
                                                                                    <DropdownMenuItem onClick={() => handleDeleteUser(user.id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer focus:bg-red-500/10 focus:text-red-300">
                                                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                                                        Delete User
                                                                                    </DropdownMenuItem>
                                                                                </DropdownMenuContent>
                                                                            </DropdownMenu>
                                                                        </>
                                                                    )}
                                                                    {user.id === currentUser?.id && (
                                                                        <span className="text-xs font-bold text-slate-600 border border-slate-700 px-2 py-1 rounded bg-slate-800">YOU</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </motion.tr>
                                                    )
                                                })}
                                            </AnimatePresence>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                ) : (
                    /* Project Tab Content */
                    <>
                        {projectStats && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <StatCard title="Total Projects" value={projectStats.totalProjects} icon={FolderPlus} color="blue" />
                                <StatCard title="Total Members" value={projectStats.totalMembers || '-'} icon={Users} color="emerald" delay={0.1} />
                            </div>
                        )}

                        <div className="glass-card rounded-2xl p-4 border border-slate-700/50 mb-6">
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <div className="relative group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                                        <Input
                                            type="text"
                                            placeholder="Search projects..."
                                            value={projectSearchQuery}
                                            onChange={(e) => setProjectSearchQuery(e.target.value)}
                                            className="pl-12 bg-slate-900/50 border-slate-700 focus:border-cyan-500 text-white"
                                        />
                                    </div>
                                </div>
                                <Button
                                    onClick={() => setShowCreateProjectModal(true)}
                                    className="btn-neon"
                                >
                                    <FolderPlus className="w-5 h-5 mr-2" />
                                    Create Project
                                </Button>
                            </div>
                        </div>

                        <div className="glass-card rounded-2xl border border-slate-700/50 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-slate-900/50 border-b border-slate-800">
                                            <th className="text-left py-4 px-6 text-sm font-semibold text-slate-400">Project Name</th>
                                            <th className="text-left py-4 px-6 text-sm font-semibold text-slate-400">Key</th>
                                            <th className="text-left py-4 px-6 text-sm font-semibold text-slate-400">Owner</th>
                                            <th className="text-left py-4 px-6 text-sm font-semibold text-slate-400">Created At</th>
                                            <th className="text-right py-4 px-6 text-sm font-semibold text-slate-400">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {filteredProjects.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-16 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <FolderPlus className="w-12 h-12 text-slate-600 mb-4" />
                                                        <p className="text-slate-500">No projects found</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            <AnimatePresence>
                                                {filteredProjects.map((project, index) => (
                                                    <motion.tr
                                                        key={project.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: index * 0.02 }}
                                                        className="hover:bg-slate-800/30 transition-colors group"
                                                    >
                                                        <td className="py-4 px-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
                                                                    {project.icon ? project.icon : project.name[0]}
                                                                </div>
                                                                <span className="font-medium text-white group-hover:text-cyan-400 transition-colors">{project.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6 text-slate-400 font-mono">{project.key}</td>
                                                        <td className="py-4 px-6">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-slate-700 overflow-hidden ring-1 ring-slate-600">
                                                                    {project.owner?.avatar ? (
                                                                        <img src={project.owner.avatar} alt={project.owner.firstName} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-[10px] text-white font-bold">
                                                                            {project.owner?.firstName?.[0]}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <span className="text-sm text-slate-300">
                                                                    {project.owner ? `${project.owner.firstName} ${project.owner.lastName}` : 'Unknown'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6 text-slate-500 text-xs">
                                                            {new Date(project.createdAt).toLocaleDateString()}
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => openEditProject(project)}
                                                                    className="text-slate-400 hover:text-white hover:bg-slate-700"
                                                                >
                                                                    <Edit2 className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleDeleteProject(project.id)}
                                                                    className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </AnimatePresence>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>

        <CreateUserModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateUser}
        />

        <ResetPasswordModal
            isOpen={!!showResetPasswordModal}
            onClose={() => setShowResetPasswordModal(null)}
            onSubmit={handleResetPassword}
        />

        <EditUserModal
            isOpen={!!editingUser}
            user={editingUser}
            onClose={() => setEditingUser(null)}
            onSubmit={handleUpdateUser}
        />

        <EditProjectModal
            isOpen={!!editingProject}
            project={editingProject}
            onClose={() => setEditingProject(null)}
            onSubmit={handleUpdateProject}
        />

        <CreateProjectModal
            isOpen={showCreateProjectModal}
            onClose={() => setShowCreateProjectModal(false)}
            onSubmit={handleCreateProject}
        />
    </>
  )
}
