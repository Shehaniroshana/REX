import React from 'react'
import { LucideIcon } from 'lucide-react'

interface SectionHeaderProps {
    icon: LucideIcon
    title: string
    subtitle?: string
    color: string
}

export default function SectionHeader({ icon: Icon, title, subtitle, color }: SectionHeaderProps) {
    return (
        <div className="flex items-center gap-3 mb-6">
            <div
                className="p-2 rounded-lg"
                style={{
                    background: `${color}20`,
                    boxShadow: `0 0 20px ${color}20`,
                }}
            >
                <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-white">{title}</h2>
                {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
            </div>
        </div>
    )
}
