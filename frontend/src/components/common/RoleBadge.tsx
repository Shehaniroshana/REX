import { Crown, ShieldCheck, Shield } from 'lucide-react'

const roleConfigs = {
    admin: {
        icon: Crown,
        colors: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        label: 'ADMIN'
    },
    manager: {
        icon: ShieldCheck,
        colors: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        label: 'MANAGER'
    },
    user: {
        icon: Shield,
        colors: 'bg-slate-700/50 text-slate-400 border-slate-600',
        label: 'USER'
    }
}

interface RoleBadgeProps {
    role: string
    className?: string
}

export default function RoleBadge({ role, className = '' }: RoleBadgeProps) {
    const config = roleConfigs[role.toLowerCase() as keyof typeof roleConfigs] || roleConfigs.user
    const Icon = config.icon

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${config.colors} ${className}`}>
            <Icon className="w-3.5 h-3.5" />
            {config.label}
        </span>
    )
}
