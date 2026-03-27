import { CheckCircle, X, AlertCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CompleteSprintModalProps {
  isOpen: boolean
  onClose: () => void
  sprintName: string
  completedPoints: number
  remainingPoints: number
  incompleteIssueAction: 'backlog' | 'next'
  onIncompleteIssueActionChange: (action: 'backlog' | 'next') => void
  onComplete: () => void
  isLoading?: boolean
}

export function CompleteSprintModal({
  isOpen,
  onClose,
  sprintName,
  completedPoints,
  remainingPoints,
  incompleteIssueAction,
  onIncompleteIssueActionChange,
  onComplete,
  isLoading
}: CompleteSprintModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            className="relative w-full max-w-lg max-h-[90vh] flex flex-col"
          >
            <div className="glass-card bg-slate-900/60 border border-white/10 rounded-3xl shadow-2xl shadow-black/40 h-full flex flex-col overflow-hidden">
              {/* Decorative background element */}
              <div className="absolute -top-16 -right-16 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative p-6 px-8 flex flex-col min-h-0 h-full">
                <button 
                  onClick={onClose}
                  className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors z-20"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-4 mb-8 flex-none">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-500/20">
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">Finalize Unit</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{sprintName}</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 -mr-1 custom-scrollbar">
                  <div className="space-y-4 relative z-10 pb-4">
                  <div className="p-4 rounded-xl bg-slate-950/40 border border-white/5 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Completed Points</span>
                      <span className="text-xl font-bold text-emerald-400">{completedPoints} <span className="text-[10px] text-slate-600 font-black">PTS</span></span>
                    </div>
                    <div className="h-px bg-white/5" />
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Remaining Points</span>
                      <span className="text-xl font-bold text-amber-400">{remainingPoints} <span className="text-[10px] text-slate-600 font-black">PTS</span></span>
                    </div>
                  </div>

                  {remainingPoints > 0 && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-500" /> 
                        Relocate incomplete objectives
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => onIncompleteIssueActionChange('backlog')}
                          className={cn(
                            "group p-4 rounded-xl border transition-all flex flex-col items-center gap-1.5",
                            incompleteIssueAction === 'backlog'
                              ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-500/5"
                              : "bg-slate-950/50 border-white/5 text-slate-500 hover:border-white/10 hover:text-slate-300"
                          )}
                        >
                          <span className="text-[9px] font-bold tracking-[0.2em] opacity-50 uppercase">Origin</span>
                          <span className="text-sm font-bold">Backlog</span>
                        </button>
                        <button
                          onClick={() => onIncompleteIssueActionChange('next')}
                          className={cn(
                            "group p-4 rounded-xl border transition-all flex flex-col items-center gap-1.5",
                            incompleteIssueAction === 'next'
                              ? "bg-purple-500/10 border-purple-500/30 text-purple-400 shadow-lg shadow-purple-500/5"
                              : "bg-slate-950/50 border-white/5 text-slate-500 hover:border-white/10 hover:text-slate-300"
                          )}
                        >
                          <span className="text-[9px] font-bold tracking-[0.2em] opacity-50 uppercase">Successor</span>
                          <span className="text-sm font-bold">Next Sprint</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-6">
                    <Button
                      onClick={onComplete}
                      className="flex-[2] btn-neon h-11 rounded-xl text-xs font-black uppercase tracking-widest group shadow-xl"
                      style={{ '--neon-color': '#10b981' } as any}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Propagating...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
                          <span>Terminate</span>
                        </div>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={onClose}
                      className="flex-1 h-11 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 text-xs font-bold uppercase tracking-widest"
                    >
                      Abort
                    </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
