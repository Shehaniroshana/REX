import { FileText, Layout } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import SubtaskSection from '@/components/SubtaskSection'
import CommentSection from '@/components/CommentSection'
import ActivityTimeline from '@/components/ActivityTimeline'
import LinkedIssuesSection from '@/components/LinkedIssuesSection'
import type { Issue } from '@/types'

interface IssueMainContentProps {
  issue: Issue
  isEditingDescription: boolean
  editDescriptionValue: string
  onDescriptionClick: () => void
  onDescriptionChange: (value: string) => void
  onDescriptionBlur: () => void
  comments: any[]
  activities: any[]
  onSubtaskChange: () => void
  onCommentAdded: () => void
}

export function IssueMainContent({
  issue,
  isEditingDescription,
  editDescriptionValue,
  onDescriptionClick,
  onDescriptionChange,
  onDescriptionBlur,
  comments,
  activities,
  onSubtaskChange,
  onCommentAdded
}: IssueMainContentProps) {
  const { t } = useTranslation()

  return (
    <div className="lg:col-span-8 p-6 lg:p-8 space-y-8 border-r border-white/5 bg-slate-900/10 backdrop-blur-[2px]">
      {/* Description */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">
          <FileText className="w-3.5 h-3.5 text-cyan-500" />
          <h3>{t('common.description')}</h3>
        </div>
        <div className="bg-slate-950/40 rounded-2xl p-1 border border-white/5 hover:border-cyan-500/20 transition-all shadow-inner group">
          {isEditingDescription ? (
            <textarea
              value={editDescriptionValue}
              onChange={(e) => onDescriptionChange(e.target.value)}
              onBlur={onDescriptionBlur}
              className="w-full min-h-[160px] bg-slate-950/50 rounded-xl p-4 text-slate-200 focus:ring-1 focus:ring-cyan-500 focus:outline-none resize-y font-mono text-xs leading-relaxed border-none"
              autoFocus
            />
          ) : (
            <div
              className="prose prose-invert max-w-none text-slate-300 cursor-pointer min-h-[100px] p-4 rounded-xl hover:bg-white/5 transition-colors leading-relaxed text-sm"
              onClick={onDescriptionClick}
            >
              {issue.description ? (
                <div className="whitespace-pre-wrap">{issue.description}</div>
              ) : (
                <span className="text-slate-600 italic flex items-center gap-2 text-xs">
                  <Layout className="w-4 h-4 opacity-50" /> {t('issue.add_description')}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="subtasks" className="w-full">
        <TabsList className="bg-slate-950/50 p-1 border border-white/5 rounded-2xl backdrop-blur-md mb-6 w-full justify-start gap-1 shadow-lg">
          <TabsTrigger value="subtasks" className="px-4 py-1.5 rounded-xl text-xs data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 font-bold uppercase tracking-wider">
            {t('common.subtasks')}
          </TabsTrigger>
          <TabsTrigger value="comments" className="px-4 py-1.5 rounded-xl text-xs data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 font-bold uppercase tracking-wider">
            {t('common.comments')} <span className="ml-2 text-[9px] bg-white/10 px-1.5 py-0.5 rounded-full">{comments.length}</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="px-4 py-1.5 rounded-xl text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 font-bold uppercase tracking-wider">
            {t('common.activity')}
          </TabsTrigger>
          <TabsTrigger value="linked" className="px-4 py-1.5 rounded-xl text-xs data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 font-bold uppercase tracking-wider">
            {t('common.linked_issues')}
          </TabsTrigger>
        </TabsList>

        <div className="min-h-[250px]">
          <TabsContent value="subtasks" className="mt-0 outline-none">
            <SubtaskSection issueId={issue.id} onSubtaskChange={onSubtaskChange} />
          </TabsContent>
          <TabsContent value="comments" className="mt-0 outline-none">
            <CommentSection issueId={issue.id} comments={comments} onCommentAdded={onCommentAdded} />
          </TabsContent>
          <TabsContent value="activity" className="mt-0 outline-none">
            <ActivityTimeline activities={activities} />
          </TabsContent>
          <TabsContent value="linked" className="mt-0 outline-none">
            <LinkedIssuesSection issueId={issue.id} projectId={issue.projectId} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
