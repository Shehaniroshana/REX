import { Plus, X, AlertCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ISSUE_TYPES, PRIORITY_CONFIG } from '@/constants'
import type { CreateIssueInput } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import React from 'react'

interface CreateIssueModalProps {
  isOpen: boolean
  onClose: () => void
  formData: Partial<CreateIssueInput>
  onChange: (data: Partial<CreateIssueInput>) => void
  onSubmit: (e: React.FormEvent) => void
  error?: string | null
}

export function CreateIssueModal({ isOpen, onClose, formData, onChange, onSubmit, error }: CreateIssueModalProps) {
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
              <div className="absolute -top-16 -right-16 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative p-6 px-8 flex flex-col min-h-0">
                <button 
                  onClick={onClose}
                  className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors z-20"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-4 mb-8 flex-none">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-500/20">
                    <Plus className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">Create Issue</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Issue Registry Protocol</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 -mr-1 custom-scrollbar max-h-[calc(90vh-160px)]">
                  <form onSubmit={onSubmit} className="space-y-4 pb-4">
                  {error && (
                    <div className="flex items-center gap-3 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-bold">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Mission Title <span className="text-red-400">*</span></label>
                    <Input
                      placeholder="What needs to be done?"
                      value={formData.title ?? ''}
                      onChange={(e) => onChange({ ...formData, title: e.target.value })}
                      required
                      className="bg-slate-950/50 border-white/5 text-white focus:border-cyan-500/50 h-11 rounded-xl text-sm placeholder:text-slate-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Detail Log</label>
                    <textarea
                      placeholder="Add mission-critical details..."
                      value={formData.description ?? ''}
                      onChange={(e) => onChange({ ...formData, description: e.target.value })}
                      className="w-full min-h-[100px] bg-slate-950/50 border border-white/5 rounded-xl p-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all resize-none shadow-inner"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Category</label>
                      <Select
                        value={formData.type ?? 'task'}
                        onValueChange={(value) => onChange({ ...formData, type: value as any })}
                      >
                        <SelectTrigger className="w-full h-11 bg-slate-950/50 border-white/5 text-white rounded-xl focus:ring-1 focus:ring-cyan-500/50 text-sm">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10 rounded-xl p-1 shadow-2xl">
                          {ISSUE_TYPES.map((type) => (
                            <SelectItem key={type.id} value={type.id} className="text-white focus:bg-slate-800 transition-colors cursor-pointer rounded-lg">
                              <div className="flex items-center gap-2">
                                <type.icon className="w-3.5 h-3.5" style={{ color: type.color }} />
                                <span className="text-xs font-semibold">{type.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Urgency</label>
                      <Select
                        value={formData.priority ?? 'medium'}
                        onValueChange={(value) => onChange({ ...formData, priority: value as any })}
                      >
                        <SelectTrigger className="w-full h-11 bg-slate-950/50 border-white/5 text-white rounded-xl focus:ring-1 focus:ring-cyan-500/50 text-sm">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10 rounded-xl p-1 shadow-2xl">
                          {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                            <SelectItem key={key} value={key} className="text-white focus:bg-slate-800 transition-colors cursor-pointer rounded-lg">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                                <span className="text-xs font-semibold">{config.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Effort Points</label>
                    <Input
                      type="number"
                      placeholder="Estimate effort"
                      value={formData.storyPoints ?? ''}
                      onChange={(e) => onChange({ ...formData, storyPoints: parseInt(e.target.value) || 0 })}
                      className="bg-slate-950/50 border-white/5 text-white focus:border-cyan-500/50 h-11 rounded-xl text-sm placeholder:text-slate-600 shadow-inner"
                    />
                  </div>

                  <div className="flex gap-3 pt-6 mt-2 relative z-10">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={onClose}
                      className="flex-1 h-11 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 text-xs font-bold uppercase tracking-widest"
                    >
                      Abort
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 h-11 rounded-xl btn-neon group text-xs font-black uppercase tracking-widest" 
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
                        <span>Initialize</span>
                      </div>
                    </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
    )}
  </AnimatePresence>
)
}
