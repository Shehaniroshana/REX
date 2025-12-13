
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useIssueStore } from '@/store/issueStore'
import { useProjectStore } from '@/store/projectStore'
import { useSprintStore } from '@/store/sprintStore'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { CreateIssueInput } from '@/types'
import {
  Plus, ArrowLeft, Filter,
  CheckCircle2, AlertCircle, Bug, BookOpen, Layers,
  Rocket
} from 'lucide-react'
import { getInitials, cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import IssueDetailModal from '@/components/IssueDetailModal'
import type { Issue } from '@/types'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'

const STATUS_CONFIG = {
  todo: { label: 'To Do', color: 'bg-slate-700' },
  in_progress: { label: 'In Progress', color: 'bg-blue-600' },
  in_review: { label: 'In Review', color: 'bg-purple-600' },
  done: { label: 'Done', color: 'bg-emerald-600' },
}

const ISSUE_TYPES = [
  { id: 'story', label: 'Story', icon: BookOpen, color: 'text-green-400' },
  { id: 'task', label: 'Task', icon: CheckCircle2, color: 'text-blue-400' },
  { id: 'bug', label: 'Bug', icon: Bug, color: 'text-red-400' },
  { id: 'epic', label: 'Epic', icon: Layers, color: 'text-purple-400' },
]

const PRIORITY_COLORS: Record<string, string> = {
  highest: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
  lowest: 'bg-slate-500',
}

export default function BoardPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { issues, fetchIssues, updateIssue, createIssue } = useIssueStore()
  const { currentProject, fetchProject } = useProjectStore()
  const { sprints, fetchSprints } = useSprintStore()
  const { toast } = useToast()

  const { user } = useAuthStore() // Import useAuthStore first
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [userFilter, setUserFilter] = useState<'all' | 'mine'>('all')
  const [showCreateIssueModal, setShowCreateIssueModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<CreateIssueInput>>({
    title: '',
    description: '',
    type: 'task',
    priority: 'medium',
  })

  useEffect(() => {
    if (projectId) {
      Promise.all([
        fetchProject(projectId),
        fetchIssues(projectId),
        fetchSprints(projectId)
      ]).finally(() => setIsLoading(false))
    }
  }, [projectId, fetchProject, fetchIssues, fetchSprints])

  const activeSprint = sprints.find(s => s.status === 'active')

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!projectId || !currentProject) {
      setError('Project not found')
      return
    }

    if (!formData.title?.trim()) {
      setError('Title is required')
      return
    }

    try {
      const issueData: CreateIssueInput = {
        projectId,
        projectKey: currentProject.key,
        title: formData.title,
        description: formData.description || '',
        type: formData.type || 'task',
        priority: formData.priority || 'medium',
        sprintId: activeSprint?.id,
        assigneeId: formData.assigneeId,
        storyPoints: formData.storyPoints,
      }

      await createIssue(issueData)

      toast({
        title: 'Issue Created',
        description: `New ${formData.type} has been created and added to the sprint!`,
      })

      setShowCreateIssueModal(false)
      setFormData({
        title: '',
        description: '',
        type: 'task',
        priority: 'medium',
      })
      if (projectId) fetchIssues(projectId)
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create issue'
      setError(errorMessage)
    }
  }

  const boardIssues = (issues[projectId || ''] || []) as Issue[]

  // Filter issues for the active sprint
  const sprintIssues = activeSprint
    ? boardIssues.filter(i => {
      // Base sprint filter
      if (i.sprintId !== activeSprint.id) return false

      // Search filter
      if (searchQuery && !i.title.toLowerCase().includes(searchQuery.toLowerCase()) && !i.key.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }

      // User filter
      if (userFilter === 'mine' && i.assigneeId !== user?.id) {
        return false
      }

      return true
    })
    : []

  const columns = {
    todo: sprintIssues.filter(i => i.status === 'todo' && i.type !== 'subtask'),
    in_progress: sprintIssues.filter(i => i.status === 'in_progress' && i.type !== 'subtask'),
    in_review: sprintIssues.filter(i => i.status === 'in_review' && i.type !== 'subtask'),
    done: sprintIssues.filter(i => i.status === 'done' && i.type !== 'subtask'),
  }

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result

    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    const issue = boardIssues.find(i => i.id === draggableId)
    if (!issue) return

    const newStatus = destination.droppableId as keyof typeof STATUS_CONFIG

    try {
      await updateIssue(issue.id, { ...issue, status: newStatus })
      toast({
        title: 'Issue Updated',
        description: `Issue moved to ${STATUS_CONFIG[newStatus].label}`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update issue',
        variant: 'destructive',
      })
    }
  }

  const getTypeIcon = (type: string) => {
    const typeConfig = ISSUE_TYPES.find(t => t.id === type)
    if (!typeConfig) return null
    const Icon = typeConfig.icon
    return <Icon className={`w-4 h-4 ${typeConfig.color}`} />
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/projects/${projectId}`)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold text-white">Board</h1>
        </div>
        <div className="text-slate-400">Loading board...</div>
      </div>
    )
  }

  if (!activeSprint) {
    return (
      <div className="space-y-6 animate-fade-in p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/projects/${projectId}`)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Board</h1>
              <p className="text-sm text-slate-400 mt-1">{currentProject?.name}</p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-20 text-center glass-card rounded-2xl border-dashed border-2 border-slate-700">
          <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
            <Rocket className="w-10 h-10 text-slate-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">No Active Sprint</h2>
          <p className="text-slate-400 max-w-md mb-8">
            There is no active sprint in this project. Go to the Backlog to create and start a sprint.
          </p>
          <Button
            onClick={() => navigate(`/projects/${projectId}/backlog`)}
            className="btn-neon"
          >
            Go to Backlog
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in p-6">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/projects/${projectId}`)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-white">Board</h1>
                <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 bg-cyan-500/10">
                  {activeSprint.name}
                </Badge>
              </div>
              <p className="text-sm text-slate-400 mt-1">{currentProject?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowCreateIssueModal(true)}
              className="btn-neon mr-2"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Issue
            </Button>
            <Button
              className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30"
              variant="outline"
              size="sm"
              onClick={() => navigate(`/projects/${projectId}/backlog`)}
            >
              Complete Sprint
            </Button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="flex items-center justify-between p-2 glass-card rounded-lg">
          <div className="flex items-center gap-4 flex-1">
            {/* Search */}
            <div className="relative max-w-xs w-full">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Filter className="w-4 h-4 text-slate-500" />
              </div>
              <input
                type="text"
                placeholder="Search board..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-md py-1.5 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            {/* My Issues Filter */}
            <div className="h-6 w-px bg-slate-700/50" /> {/* Divider */}

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Quick Filters:</span>
              <button
                onClick={() => setUserFilter(userFilter === 'mine' ? 'all' : 'mine')}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 border",
                  userFilter === 'mine'
                    ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                    : "text-slate-400 border-transparent hover:text-white hover:bg-slate-700"
                )}
              >
                My Issues
              </button>
              {/* Additional filters can go here, e.g. "Recently Updated" */}
            </div>
          </div>

          {/* Clear Filters */}
          {(searchQuery || userFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('')
                setUserFilter('all')
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
            >
              <Layers className="w-3.5 h-3.5" />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(columns).map(([status, statusIssues]) => (
            <div key={status} className="space-y-2">
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].color}`} />
                  <h2 className="text-sm font-semibold text-white">
                    {STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].label}
                  </h2>
                  <Badge variant="secondary" className="ml-auto">
                    {statusIssues.length}
                  </Badge>
                </div>
              </div>

              {/* Droppable Area */}
              <Droppable droppableId={status} type="ISSUE">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      'space-y-2 min-h-96 p-2 rounded-lg transition-colors',
                      snapshot.isDraggingOver ? 'bg-slate-800/50' : 'bg-transparent'
                    )}
                  >
                    {statusIssues.map((issue, index) => (
                      <Draggable key={issue.id} draggableId={issue.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              'glass-card p-3 rounded-lg cursor-grab active:cursor-grabbing hover:shadow-lg transition-all',
                              snapshot.isDragging && 'shadow-2xl opacity-95'
                            )}
                            onClick={() => setSelectedIssue(issue)}
                          >
                            {/* Issue Key */}
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-cyan-400">
                                {issue.key}
                              </span>
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[issue.priority] }} />
                            </div>

                            {/* Issue Title */}
                            <p className="text-sm font-medium text-white mb-2 line-clamp-2 hover:text-cyan-400">
                              {issue.title}
                            </p>

                            {/* Issue Type and Story Points */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-1">
                                {getTypeIcon(issue.type)}
                                <span className="text-xs text-slate-400">
                                  {ISSUE_TYPES.find(t => t.id === issue.type)?.label}
                                </span>
                              </div>
                              {issue.storyPoints && (
                                <Badge variant="secondary" className="text-xs">
                                  {issue.storyPoints} pts
                                </Badge>
                              )}
                            </div>

                            {/* Assignee */}
                            {issue.assignee && (
                              <div className="flex items-center gap-2">
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback className="text-xs">
                                    {getInitials(`${issue.assignee.firstName} ${issue.assignee.lastName}`)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-slate-400">
                                  {issue.assignee.firstName}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>


      {/* Issue Detail Modal */}
      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
          onUpdate={() => fetchIssues(projectId!)}
        />
      )}

      {/* Create Issue Modal */}
      {showCreateIssueModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="w-full max-w-lg animate-scale-in glass-card border-slate-700 rounded-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Create Issue in Sprint</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowCreateIssueModal(false)}>
                  <AlertCircle className="w-4 h-4 text-slate-400" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateIssue} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Title *</label>
                  <Input
                    placeholder="What needs to be done?"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="bg-slate-900/50 border-slate-700 text-white focus:border-cyan-500 backdrop-blur-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Description</label>
                  <textarea
                    placeholder="Describe the issue..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full min-h-[100px] bg-slate-900/50 border border-slate-700 rounded-md p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors backdrop-blur-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Type</label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value as any })}
                    >
                      <SelectTrigger className="w-full bg-slate-900/50 border-slate-700 text-white focus:ring-cyan-500 backdrop-blur-sm">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700 text-white">
                        {ISSUE_TYPES.map(type => (
                          <SelectItem key={type.id} value={type.id} className="focus:bg-slate-800 focus:text-cyan-400">{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Priority</label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value as any })}
                    >
                      <SelectTrigger className="w-full bg-slate-900/50 border-slate-700 text-white focus:ring-cyan-500 backdrop-blur-sm">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700 text-white">
                        {Object.keys(PRIORITY_COLORS).map(priority => (
                          <SelectItem key={priority} value={priority} className="focus:bg-slate-800 focus:text-cyan-400">
                            {priority.charAt(0).toUpperCase() + priority.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Story Points</label>
                  <Input
                    type="number"
                    placeholder="Estimate (0-100)"
                    value={formData.storyPoints || ''}
                    onChange={(e) => setFormData({ ...formData, storyPoints: parseInt(e.target.value) || 0 })}
                    className="bg-slate-900/50 border-slate-700 text-white focus:border-cyan-500 backdrop-blur-sm"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" className="flex-1 btn-neon">
                    Create Issue
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateIssueModal(false)}
                    className="flex-1 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </div>
        </div>
      )}
    </div>
  )
}
