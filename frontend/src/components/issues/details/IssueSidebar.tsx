import { CheckCircle2, Target, Activity, Calendar, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { STATUSES, PRIORITIES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import UserSelector from '@/components/UserSelector'
import LabelManager from '@/components/LabelManager'
import TimeTracker from '@/components/TimeTracker'
import type { Issue } from '@/types'

interface IssueSidebarProps {
  issue: Issue
  status: string
  priority: string
  assigneeId?: string
  storyPoints?: number
  onStatusChange: (value: string) => void
  onPriorityChange: (value: string) => void
  onAssigneeChange: (value: string | undefined) => void
  onStoryPointsChange: (value: number | undefined) => void
  onStoryPointsBlur: () => void
  onUpdateLabels: () => void
}

export function IssueSidebar({
  issue,
  status,
  priority,
  assigneeId,
  storyPoints,
  onStatusChange,
  onPriorityChange,
  onAssigneeChange,
  onStoryPointsChange,
  onStoryPointsBlur,
  onUpdateLabels
}: IssueSidebarProps) {
  const { t } = useTranslation()

  return (
    <div className="lg:col-span-4 bg-slate-950/20 p-6 lg:p-8 space-y-6 backdrop-blur-[1px]">
      {/* Status Hero */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1 flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5" /> {t('common.status')}
        </label>
        <div className="relative group text-sm">
          <select
            className="w-full bg-slate-900/60 border border-white/5 rounded-xl px-4 h-11 text-white focus:border-cyan-500/50 outline-none transition-all hover:bg-slate-800/80 cursor-pointer appearance-none font-bold shadow-lg"
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            {STATUSES.map(s => <option key={s.id} value={s.id} className="bg-slate-900 font-semibold text-xs">{s.label}</option>)}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-cyan-400 transition-colors">
            <Sparkles className="w-3 h-3 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="h-px bg-white/5 mx-2" />

      {/* Details Group */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1 flex items-center gap-2">
            <Target className="w-3.5 h-3.5" />
            {t('common.details')}
          </h4>
        </div>

        <div className="space-y-5">
          {/* Priority */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 ml-1">{t('common.priority')}</label>
            <div className="flex flex-wrap gap-1.5">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  onClick={() => onPriorityChange(p)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border",
                    priority === p
                      ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.1)]"
                      : "bg-slate-900/30 text-slate-500 border-transparent hover:border-white/10 hover:text-slate-300"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Assignee */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 ml-1">{t('common.assignee')}</label>
            <div className="p-0.5 rounded-xl bg-slate-900/40 border border-white/5 hover:border-white/10 transition-colors">
              <UserSelector
                selectedUserId={assigneeId}
                onSelect={onAssigneeChange}
                placeholder={t('common.unassigned')}
              />
            </div>
          </div>

          {/* Story Points */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 ml-1">{t('common.story_points')}</label>
            <div className="relative group">
              <input
                type="number"
                className="w-full bg-slate-900/60 border border-white/5 rounded-xl pl-4 pr-12 h-10 text-white focus:border-cyan-500/50 outline-none text-sm font-bold transition-all shadow-md group-hover:bg-slate-800/80"
                value={storyPoints || ''}
                onChange={(e) => onStoryPointsChange(e.target.value ? parseInt(e.target.value) : undefined)}
                onBlur={onStoryPointsBlur}
                placeholder="0"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 text-[9px] font-black uppercase tracking-widest bg-white/5 px-1.5 py-0.5 rounded-md">PTS</div>
            </div>
          </div>

          {/* Labels */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 ml-1">{t('common.labels')}</label>
            <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5 text-xs">
              <LabelManager
                issueId={issue.id}
                projectId={issue.projectId}
                selectedLabels={issue.labels || []}
                onUpdate={onUpdateLabels}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-white/5 mx-2" />

      {/* Tracking */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5" />
          {t('common.tracking')}
        </h4>
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 shadow-inner">
          <TimeTracker issueId={issue.id} />
        </div>
      </div>

      {/* Meta Info */}
      <div className="pt-4">
        <div className="bg-slate-950/40 rounded-xl p-4 space-y-2.5 text-[10px] border border-white/5 text-slate-500">
          <div className="flex justify-between items-center">
            <span className="font-bold uppercase tracking-wider opacity-60">{t('common.reporter')}</span>
            <span className="text-slate-400 font-bold">{issue.reporter?.firstName} {issue.reporter?.lastName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-bold uppercase tracking-wider opacity-60">{t('common.created')}</span>
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Calendar className="w-3 h-3 text-cyan-500" />
              {new Date(issue.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-bold uppercase tracking-wider opacity-60">{t('common.updated')}</span>
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3 h-3 text-amber-500" />
              {new Date(issue.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
