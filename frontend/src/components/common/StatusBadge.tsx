
interface StatusBadgeProps {
    isActive: boolean
    className?: string
}

export default function StatusBadge({ isActive, className = '' }: StatusBadgeProps) {
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
            isActive 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-red-500/10 text-red-400 border-red-500/20'
        } ${className}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            {isActive ? 'ACTIVE' : 'INACTIVE'}
        </span>
    )
}
