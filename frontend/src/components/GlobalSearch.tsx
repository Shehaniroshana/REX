import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, FolderKanban, Tag, Loader2 } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'
import api from '@/lib/api'
import type { Issue, Project } from '@/types'
import { cn } from '@/lib/utils'

interface SearchResult {
  issues: Issue[]
  projects: Project[]
}

const ISSUE_STATUS_COLORS: Record<string, string> = {
  todo: 'bg-slate-500',
  in_progress: 'bg-blue-500',
  in_review: 'bg-yellow-500',
  done: 'bg-green-500',
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const debouncedQuery = useDebounce(query, 300)

  const clearSearch = () => {
    setQuery('')
    setResults(null)
  }

  const closePanel = () => {
    setOpen(false)
    clearSearch()
  }

  const fetchResults = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(null)
      return
    }
    setLoading(true)
    try {
      const res = await api.get<SearchResult>('/api/search', { params: { q, limit: 8 } })
      setResults(res.data)
    } catch {
      setResults(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchResults(debouncedQuery)
  }, [debouncedQuery, fetchResults])

  // Open on Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
        setTimeout(() => inputRef.current?.focus(), 50)
      }
      if (e.key === 'Escape') {
        closePanel()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closePanel()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleIssueClick = (issue: Issue) => {
    navigate(`/projects/${issue.projectId}/issues/${issue.id}`)
    closePanel()
  }

  const handleProjectClick = (project: Project) => {
    navigate(`/projects/${project.id}/board`)
    closePanel()
  }

  const hasResults =
    results && (results.issues.length > 0 || results.projects.length > 0)

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger button */}
      <button
        onClick={() => {
          setOpen(true)
          setTimeout(() => inputRef.current?.focus(), 50)
        }}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-400 text-sm hover:border-slate-700 hover:text-slate-300 transition-colors group"
      >
        <Search className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left truncate">Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-500 border border-slate-700 group-hover:border-slate-600">
          ⌘K
        </kbd>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 z-[100] glass-card rounded-2xl border border-slate-700/50 shadow-2xl shadow-black/40 overflow-hidden animate-scale-in">
          {/* Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800/60">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search issues and projects..."
              className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm outline-none"
              autoComplete="off"
            />
            {loading && <Loader2 className="w-4 h-4 text-slate-400 animate-spin shrink-0" />}
            {query && !loading && (
              <button
                onClick={clearSearch}
                className="p-0.5 rounded text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto scrollbar-thin">
            {!query && (
              <div className="px-4 py-6 text-center text-slate-500 text-sm">
                Type to search issues and projects
              </div>
            )}

            {query && !loading && !hasResults && (
              <div className="px-4 py-6 text-center text-slate-500 text-sm">
                No results for "{query}"
              </div>
            )}

            {results && results.projects.length > 0 && (
              <div className="py-2">
                <div className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Projects
                </div>
                {results.projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleProjectClick(project)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/50 transition-colors text-left group"
                  >
                    <div
                      className="w-6 h-6 rounded flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                      style={{ backgroundColor: project.color || '#06b6d4' }}
                    >
                      {project.key.substring(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors truncate">
                        {project.name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{project.key}</p>
                    </div>
                    <FolderKanban className="w-4 h-4 text-slate-600 shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {results && results.issues.length > 0 && (
              <div className="py-2">
                <div className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Issues
                </div>
                {results.issues.map((issue) => (
                  <button
                    key={issue.id}
                    onClick={() => handleIssueClick(issue)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/50 transition-colors text-left group"
                  >
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full shrink-0',
                        ISSUE_STATUS_COLORS[issue.status] ?? 'bg-slate-500'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white group-hover:text-cyan-400 transition-colors truncate">
                        {issue.title}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">{issue.key}</p>
                    </div>
                    <Tag className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
