import { useNavigate } from 'react-router-dom'
import { Plus, LayoutDashboard, Target, Zap, ArrowRight } from 'lucide-react'
import { Project } from '@/types'
import { motion } from 'framer-motion'

interface QuickActionsProps {
    projects: Project[]
    onCreateProject: () => void
}

export default function QuickActions({ projects, onCreateProject }: QuickActionsProps) {
    const navigate = useNavigate()

    const actions = [
        {
            title: "New Project",
            desc: "Create workspace",
            icon: Plus,
            color: "cyan",
            onClick: onCreateProject,
            gradient: "from-cyan-500/20 to-blue-500/20",
        },
        {
            title: "Kanban Board",
            desc: "View active tasks",
            icon: LayoutDashboard,
            color: "purple",
            disabled: !projects[0],
            onClick: () => projects[0] && navigate(`/projects/${projects[0].id}/board`),
            gradient: "from-purple-500/20 to-pink-500/20",
        },
        {
            title: "Backlog",
            desc: "Plan work",
            icon: Target,
            color: "emerald",
            disabled: !projects[0],
            onClick: () => projects[0] && navigate(`/projects/${projects[0].id}/backlog`),
            gradient: "from-emerald-500/20 to-teal-500/20",
        }
    ]

    return (
        <div className="h-full flex flex-col gap-4">
            <div className="flex items-center gap-2 px-1">
                <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                    <h3 className="text-base font-bold text-white">Quick Actions</h3>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Shortcuts</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 flex-1">
                {actions.map((action, i) => (
                    <motion.button
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 * i + 0.5 }}
                        onClick={action.onClick}
                        disabled={action.disabled}
                        className={`
              relative group overflow-hidden p-3 rounded-xl border border-slate-700/50 text-left
              bg-gradient-to-br ${action.gradient} backdrop-blur-md
              hover:border-${action.color}-500/50 transition-all duration-300
              ${action.disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:scale-[1.02] hover:shadow-lg'}
            `}
                    >
                        <div className={`
              absolute -right-8 -top-8 w-24 h-24 rounded-full blur-2xl 
              bg-${action.color}-500/20 group-hover:bg-${action.color}-500/30 transition-colors
            `} />

                        <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`
                  p-2 rounded-lg bg-black/20 text-${action.color}-400 
                  group-hover:bg-${action.color}-500 group-hover:text-white transition-colors duration-300
                `}>
                                    <action.icon className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm group-hover:text-${action.color}-100 transition-colors">
                                        {action.title}
                                    </h4>
                                    <p className="text-[10px] text-slate-400 group-hover:text-slate-200 transition-colors">
                                        {action.desc}
                                    </p>
                                </div>
                            </div>

                            <div className={`
                w-6 h-6 rounded-full flex items-center justify-center
                border border-white/10 bg-white/5 opacity-0 -translate-x-4
                group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300
              `}>
                                <ArrowRight className="w-3 h-3 text-white" />
                            </div>
                        </div>
                    </motion.button>
                ))}
            </div>
        </div>
    )
}
