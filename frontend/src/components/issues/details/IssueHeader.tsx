import React from 'react'
import { X, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Issue } from '@/types'
import { ISSUE_TYPES } from '@/lib/constants'

interface IssueHeaderProps {
  issue: Issue
  onClose: () => void
  isEditingTitle: boolean
  editTitleValue: string
  onTitleClick: () => void
  onTitleChange: (value: string) => void
  onTitleBlur: () => void
  onTitleKeyDown: (e: React.KeyboardEvent) => void
}

export function IssueHeader({
  issue,
  onClose,
  isEditingTitle,
  editTitleValue,
  onTitleClick,
  onTitleChange,
  onTitleBlur,
  onTitleKeyDown
}: IssueHeaderProps) {
  const getTypeIcon = (type: string) => {
    const typeConfig = ISSUE_TYPES.find((t) => t.id === type)
    if (!typeConfig) return null
    const Icon = typeConfig.icon
    return <Icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
  }

  const getTypeColor = (type: string) => {
    const typeConfig = ISSUE_TYPES.find((t) => t.id === type)
    return typeConfig?.color || 'bg-slate-600'
  }

  return (
    <div className="flex-none flex items-start justify-between p-6 px-8 border-b border-white/5 bg-slate-900/40 backdrop-blur-md relative z-10 transition-all">
      <div className="flex items-start gap-4 flex-1">
        {/* Type Icon */}
        <div className={cn(
          "group mt-1 p-2.5 rounded-xl bg-opacity-20 border border-white/10 shadow-lg transition-all",
          getTypeColor(issue.type),
          "hover:shadow-cyan-500/10"
        )}>
          {getTypeIcon(issue.type)}
        </div>

        {/* Title & Key */}
        <div className="flex-1 space-y-0.5 min-w-0">
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mb-1.5 uppercase tracking-widest">
            <span className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-md text-cyan-400 border border-white/10 text-[11px] font-black">
              <Sparkles className="w-3.5 h-3.5" />
              {issue.key}
            </span>
            <span className="text-slate-600">/</span>
            <span className="font-black text-slate-500">{issue.type}</span>
          </div>
          {isEditingTitle ? (
            <input
              type="text"
              value={editTitleValue}
              onChange={(e) => onTitleChange(e.target.value)}
              onBlur={onTitleBlur}
              onKeyDown={onTitleKeyDown}
              className="text-xl font-bold text-white bg-slate-800/50 border-b-2 border-cyan-500 focus:outline-none w-full px-2 py-1 rounded-lg shadow-inner"
              autoFocus
            />
          ) : (
            <h2
              className="text-xl font-bold text-white cursor-pointer hover:text-cyan-400 transition-all leading-tight tracking-tight group flex items-center gap-2"
              onClick={onTitleClick}
            >
              <span className="truncate">{issue.title}</span>
              <Sparkles className="flex-none w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400" />
            </h2>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose} 
          className="w-10 h-10 rounded-xl bg-white/5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors border border-white/5"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>
    </div>
  )
}
