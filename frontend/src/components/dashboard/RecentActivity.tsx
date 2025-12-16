import { Issue } from '@/types'
import { motion } from 'framer-motion'
import { FileText, Bug, Bookmark, Clock, ArrowRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface RecentActivityProps {
    issues: Issue[]
}

const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return 'U'
    return `${(firstName?.[0] || '').toUpperCase()}${(lastName?.[0] || '').toUpperCase()}`
}

const getAvatarColor = (id: string) => {
    const colors = [
        'from-red-500 to-orange-500',
        'from-blue-500 to-cyan-500',
        'from-purple-500 to-pink-500',
        'from-emerald-500 to-teal-500',
        'from-amber-500 to-yellow-500'
    ]
    const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
    return colors[index]
}

export default function RecentActivity({ issues }: RecentActivityProps) {
    const recentIssues = [...issues]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5)

    const getIssueIcon = (type: string) => {
        switch (type) {
            case 'bug': return <Bug className="w-3 h-3 text-red-400" />
            case 'epic': return <Bookmark className="w-3 h-3 text-purple-400" />
            default: return <FileText className="w-3 h-3 text-cyan-400" />
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            className="glass-card rounded-2xl p-5 h-full relative overflow-hidden group"
        >
            {/* Decorative Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

            <div className="flex items-center justify-between mb-4 relative z-10">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        Activity Feed
                        <span className="flex h-1.5 w-1.5 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
                        </span>
                    </h3>
                    <p className="text-slate-400 text-xs mt-0.5">Real-time project updates</p>
                </div>
                <button className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
                    View All
                </button>
            </div>

            <div className="relative pl-3 border-l border-slate-800 space-y-3 z-10 mx-1">
                {recentIssues.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 italic text-sm">
                        No recent activity to show
                    </div>
                ) : (
                    recentIssues.map((issue, i) => (
                        <motion.div
                            key={issue.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * i + 0.8 }}
                            className="relative group/item"
                        >
                            {/* Timeline Dot */}
                            <div className="absolute -left-[19px] top-3 h-3 w-3 rounded-full bg-slate-900 border border-slate-600 group-hover/item:border-cyan-400 group-hover/item:scale-125 transition-all duration-300 z-10" />

                            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-300 relative overflow-hidden">
                                {/* Initials Avatar */}
                                <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                    bg-gradient-to-br ${getAvatarColor(issue.assigneeId || 'unknown')}
                    shadow-lg font-bold text-white text-[10px]
                `}>
                                    {getInitials(issue.assignee?.firstName, issue.assignee?.lastName)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                                        <span className="font-bold text-slate-200 text-xs">
                                            {issue.assignee?.firstName || 'Unknown'}
                                        </span>
                                        <span className="text-[10px] text-slate-400">
                                            {issue.status === 'done' ? 'completed' : issue.status === 'in_progress' ? 'working on' : 'updated'}
                                        </span>
                                        <div className="flex items-center gap-1 text-cyan-400 font-mono text-[10px] bg-cyan-500/10 px-1.5 py-px rounded ml-auto">
                                            {getIssueIcon(issue.type)}
                                            {issue.key}
                                        </div>
                                    </div>

                                    <p className="text-xs text-slate-300 font-medium truncate mb-1 group-hover/item:text-white transition-colors">
                                        {issue.title}
                                    </p>

                                    <div className="flex items-center gap-1.5 text-[9px] text-slate-500 uppercase tracking-wider font-semibold">
                                        <Clock className="w-2.5 h-2.5" />
                                        {formatDistanceToNow(new Date(issue.updatedAt))} ago
                                    </div>
                                </div>

                                <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 -translate-x-2 group-hover/item:translate-x-0 transition-all duration-300">
                                    <ArrowRight className="w-4 h-4 text-slate-400" />
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </motion.div>
    )
}
