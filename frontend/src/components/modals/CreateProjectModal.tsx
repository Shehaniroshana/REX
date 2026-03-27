import React, { useState } from 'react'
import { FolderKanban, X, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { CreateProjectInput } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'

interface CreateProjectModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: CreateProjectInput) => Promise<void>
    isLoading?: boolean
}

export default function CreateProjectModal({
    isOpen,
    onClose,
    onSubmit,
    isLoading = false
}: CreateProjectModalProps) {
    const [formData, setFormData] = useState<CreateProjectInput>({
        key: '',
        name: '',
        description: '',
        color: '#06b6d4',
        ownerId: '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await onSubmit(formData)
    }

    const themeColors = [
        '#06b6d4', // Cyan
        '#3b82f6', // Blue
        '#8b5cf6', // Violet
        '#ec4899', // Pink
        '#ef4444', // Red
        '#f59e0b', // Amber
        '#10b981', // Emerald
    ]

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
                            {/* Decorative background element - scaled down */}
                            <div className="absolute -top-16 -right-16 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
                            <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

                            <div className="relative p-6 px-8 flex flex-col min-h-0 h-full">
                                <button 
                                    onClick={onClose}
                                    className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors z-20"
                                >
                                    <X className="w-4 h-4" />
                                </button>

                                <div className="flex items-center gap-4 mb-8 flex-none">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shadow-lg shadow-primary/20 ring-1 ring-primary/20">
                                        <FolderKanban className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white tracking-tight">New Project</h2>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Workspace Definition</p>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto pr-1 -mr-1 custom-scrollbar">
                                    <form onSubmit={handleSubmit} className="space-y-4 pb-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Identifier Key</label>
                                        <Input
                                            placeholder="e.g., REX"
                                            value={formData.key}
                                            onChange={(e) => setFormData({ ...formData, key: e.target.value.toUpperCase() })}
                                            maxLength={10}
                                            required
                                            className="font-mono uppercase bg-slate-950/50 border-white/5 text-white focus:border-primary/50 h-11 text-base tracking-widest rounded-xl shadow-inner placeholder:text-slate-600"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Workspace Name</label>
                                        <Input
                                            placeholder="Engine Development"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                            className="bg-slate-950/50 border-white/5 text-white focus:border-primary/50 h-11 rounded-xl text-sm placeholder:text-slate-600"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Brief Description</label>
                                        <Input
                                            placeholder="Project objectives..."
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="bg-slate-950/50 border-white/5 text-white focus:border-primary/50 h-11 rounded-xl text-sm placeholder:text-slate-600"
                                        />
                                    </div>

                                    <div className="space-y-3 pt-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Visual Theme</label>
                                        <div className="flex gap-2.5 flex-wrap p-3.5 bg-black/20 rounded-2xl border border-white/5 justify-center shadow-inner">
                                            {themeColors.map((color) => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, color })}
                                                    className={`w-9 h-9 rounded-full transition-all duration-300 relative ${
                                                        formData.color === color
                                                            ? 'scale-110 ring-2 ring-white/30'
                                                            : 'hover:scale-110 opacity-50 hover:opacity-100'
                                                    }`}
                                                    style={{
                                                        backgroundColor: color,
                                                        boxShadow: formData.color === color ? `0 0 15px ${color}60` : 'none'
                                                    }}
                                                >
                                                    {formData.color === color && (
                                                        <motion.div 
                                                            layoutId="activeColor"
                                                            className="absolute inset-0 rounded-full border border-white"
                                                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                                        />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-6">
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
                                                    <span>Initialize</span>
                                                </div>
                                            )}
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
