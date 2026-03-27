import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import AnimatedCounter from '@/components/common/AnimatedCounter'
import { cn } from '@/lib/utils'

interface AnalyticsCardProps {
    label: string
    value: number
    icon: LucideIcon
    color: string
    trend?: 'up' | 'down' | 'neutral'
    trendValue?: string
    suffix?: string
    delay?: number
}

export default function AnalyticsCard({
    label,
    value,
    icon: Icon,
    color,
    trend,
    trendValue,
    suffix = '',
    delay = 0
}: AnalyticsCardProps) {
    return (
        <div
            className="glass-card p-5 rounded-2xl border border-slate-800/50 hover:border-slate-700/50 
               transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)]
               animate-slide-up group"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex justify-between items-start mb-3">
                <div
                    className="p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110"
                    style={{
                        background: `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`,
                        boxShadow: `0 0 20px ${color}20`,
                    }}
                >
                    <Icon className="w-5 h-5" style={{ color }} />
                </div>
                {trend && (
                    <div className={cn(
                        "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                        trend === 'up' && "bg-emerald-500/20 text-emerald-400",
                        trend === 'down' && "bg-rose-500/20 text-rose-400",
                        trend === 'neutral' && "bg-slate-500/20 text-slate-400"
                    )}>
                        {trend === 'up' && <ArrowUpRight className="w-3 h-3" />}
                        {trend === 'down' && <ArrowDownRight className="w-3 h-3" />}
                        {trendValue}
                    </div>
                )}
            </div>
            <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">{label}</p>
            <h3 className="text-2xl font-bold text-white">
                <AnimatedCounter value={value} suffix={suffix} />
            </h3>
        </div>
    )
}
