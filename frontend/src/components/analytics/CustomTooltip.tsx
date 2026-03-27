import React from 'react'

interface CustomTooltipProps {
    active?: boolean
    payload?: any[]
    label?: string
}

export default function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-950/95 border border-slate-700/50 p-4 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                <p className="text-slate-200 font-bold mb-2 border-b border-slate-700/50 pb-2">{label || payload[0].name}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 text-sm py-1">
                        <div
                            className="w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]"
                            style={{ backgroundColor: entry.color || entry.fill }}
                        />
                        <span className="text-slate-400 capitalize">{entry.name}:</span>
                        <span className="text-white font-mono font-bold">
                            {typeof entry.value === 'number' && entry.value % 1 !== 0 ? entry.value.toFixed(1) : entry.value}
                        </span>
                    </div>
                ))}
            </div>
        )
    }
    return null
}
