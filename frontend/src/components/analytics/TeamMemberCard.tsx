import { Trophy } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import ProgressRing from '@/components/common/ProgressRing'
import { cn } from '@/lib/utils'
import type { TeamMemberStats } from '@/services/reportService'

interface TeamMemberCardProps {
    member: TeamMemberStats
    rank: number
}

export default function TeamMemberCard({ member, rank }: TeamMemberCardProps) {
    const completionRate = member.assignedIssues > 0
        ? Math.round((member.completedIssues / member.assignedIssues) * 100)
        : 0

    return (
        <div className="glass-card p-4 rounded-xl border border-slate-800/50 hover:border-slate-700/50 transition-all duration-300 group hover:translate-y-[-2px]">
            <div className="flex items-center gap-4">
                {/* Rank Badge */}
                <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                    rank === 1 && "bg-amber-500/20 text-amber-400",
                    rank === 2 && "bg-slate-400/20 text-slate-300",
                    rank === 3 && "bg-orange-600/20 text-orange-400",
                    rank > 3 && "bg-slate-700/30 text-slate-500"
                )}>
                    {rank <= 3 ? <Trophy className="w-4 h-4" /> : rank}
                </div>

                {/* Avatar */}
                <Avatar className="h-10 w-10 border-2 border-slate-700">
                    <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-sm font-semibold">
                        {member.firstName?.[0]}{member.lastName?.[0]}
                    </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">
                        {member.firstName} {member.lastName}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{member.email}</p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                        <p className="text-lg font-bold text-emerald-400">{member.completedIssues}</p>
                        <p className="text-[10px] text-slate-500 uppercase">Done</p>
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-bold text-blue-400">{member.inProgressCount}</p>
                        <p className="text-[10px] text-slate-500 uppercase">Active</p>
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-bold text-purple-400">{member.completedPoints}</p>
                        <p className="text-[10px] text-slate-500 uppercase">Points</p>
                    </div>
                    <div className="hidden md:block">
                        <ProgressRing progress={completionRate} size={50} strokeWidth={5} />
                    </div>
                </div>
            </div>
        </div>
    )
}
