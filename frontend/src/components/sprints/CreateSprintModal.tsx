import { Zap, X, Target, Calendar, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { motion, AnimatePresence } from 'framer-motion'

interface SprintFormData {
  name: string
  goal: string
  startDate: string
  endDate: string
}

interface CreateSprintModalProps {
  isOpen: boolean
  onClose: () => void
  formData: SprintFormData
  onChange: (data: SprintFormData) => void
  onSubmit: () => void
  isLoading?: boolean
  mode?: 'create' | 'edit'
}

export function CreateSprintModal({
  isOpen,
  onClose,
  formData,
  onChange,
  onSubmit,
  isLoading,
  mode = 'create'
}: CreateSprintModalProps) {
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
            <div className="glass-card bg-slate-900/60 border border-white/10 rounded-3xl shadow-2xl shadow-black/40 flex flex-col overflow-hidden">
              {/* Decorative background element */}
              <div className="absolute -top-16 -right-16 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative p-6 px-8 flex flex-col min-h-0 h-full">
                <button 
                  onClick={onClose}
                  className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors z-20"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-4 mb-8 flex-none">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-black/20 ring-1 ${mode === 'edit' ? 'bg-blue-500/20 ring-blue-500/20' : 'bg-purple-500/20 ring-purple-500/20'}`}>
                    <Zap className={`w-6 h-6 ${mode === 'edit' ? 'text-blue-400' : 'text-purple-400'}`} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">
                      {mode === 'edit' ? 'Edit Iteration' : 'New Iteration'}
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{mode === 'edit' ? 'Recalibrate unit parameters' : 'Unit parameter initialization'}</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 -mr-1 custom-scrollbar">
                  <div className="space-y-4 relative z-10 pb-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                         Sprint Designation
                      </label>
                      <div className="relative">
                        <Target className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                          placeholder="e.g., Sprint 1"
                          value={formData.name}
                          onChange={(e) => onChange({ ...formData, name: e.target.value })}
                          autoFocus
                          className="pl-10 bg-slate-950/50 border-white/5 text-white focus:border-purple-500/50 h-11 rounded-xl text-sm placeholder:text-slate-600 shadow-inner"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                         Operational Goal
                      </label>
                      <textarea
                        placeholder="What is the mission objective?"
                        value={formData.goal}
                        onChange={(e) => onChange({ ...formData, goal: e.target.value })}
                        className="flex w-full rounded-xl border border-white/5 bg-slate-950/50 px-4 py-2.5 text-sm min-h-[100px] resize-none focus:outline-none focus:ring-1 focus:ring-purple-500/50 text-white placeholder:text-slate-600 transition-all font-medium shadow-inner"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                           Commencement
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <Input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => onChange({ ...formData, startDate: e.target.value })}
                            className="pl-10 bg-slate-950/50 border-white/5 text-white focus:border-purple-500/50 h-11 rounded-xl [color-scheme:dark] text-xs font-bold"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                           Termination
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <Input
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => onChange({ ...formData, endDate: e.target.value })}
                            className="pl-10 bg-slate-950/50 border-white/5 text-white focus:border-purple-500/50 h-11 rounded-xl [color-scheme:dark] text-xs font-bold"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 pt-6">
                      <Button
                        onClick={onSubmit}
                        className="flex-[2] btn-neon h-11 rounded-xl text-xs font-black uppercase tracking-widest group shadow-xl"
                        style={{ '--neon-color': mode === 'edit' ? '#3b82f6' : '#a855f7' } as any}
                        disabled={!formData.name.trim() || isLoading}
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Propagating...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
                            <span>{mode === 'edit' ? 'Recalibrate' : 'Initialize'}</span>
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
