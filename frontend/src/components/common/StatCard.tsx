import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
    title: string
    value: string | number
    icon: LucideIcon
    color: 'blue' | 'emerald' | 'purple' | 'amber' | 'cyan'
    delay?: number
}

const colorConfigs = {
    blue: 'from-blue-500 to-indigo-600 shadow-blue-500/20 hover:border-blue-500/30',
    emerald: 'from-emerald-500 to-teal-600 shadow-emerald-500/20 hover:border-emerald-500/30',
    purple: 'from-purple-500 to-pink-600 shadow-purple-500/20 hover:border-purple-500/30',
    amber: 'from-amber-500 to-orange-600 shadow-amber-500/20 hover:border-amber-500/30',
    cyan: 'from-cyan-500 to-blue-500 shadow-cyan-500/20 hover:border-cyan-500/30'
}

export default function StatCard({ title, value, icon: Icon, color, delay = 0 }: StatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className={`glass-card rounded-2xl p-6 border border-slate-700/50 transition-all group ${colorConfigs[color].split(' ').slice(2).join(' ')}`}
        >
            <div className="flex items-center gap-4">
                <div className={`w-14 h-14 bg-gradient-to-br ${colorConfigs[color].split(' ').slice(0, 2).join(' ')} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7 text-white" />
                </div>
                <div>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">{title}</p>
                    <p className="text-3xl font-black text-white">{value}</p>
                </div>
            </div>
        </motion.div>
    )
}
