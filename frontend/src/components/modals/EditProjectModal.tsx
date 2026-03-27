import React, { useState, useEffect } from 'react'
import { Settings, X, FolderKanban, Info, Key, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Project, UpdateProjectInput } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'

interface EditProjectModalProps {
    isOpen: boolean
    onClose: () => void
    project: Project | null
    onSubmit: (data: UpdateProjectInput) => Promise<void>
    isLoading?: boolean
}

export default function EditProjectModal({
    isOpen,
    onClose,
    project,
    onSubmit,
    isLoading = false
}: EditProjectModalProps) {
    const [formData, setFormData] = useState<UpdateProjectInput>({
        name: '',
        key: '',
        description: '',
        ownerId: '',
    })

    useEffect(() => {
        if (project) {
            setFormData({
                name: project.name,
                key: project.key,
                description: project.description || '',
                ownerId: project.ownerId,
            })
        }
    }, [project])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await onSubmit(formData)
    }

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
                                        <Settings className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white tracking-tight">Project Settings</h2>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Workspace Parameter Control</p>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto pr-1 -mr-1 custom-scrollbar">
                                    <form onSubmit={handleSubmit} className="space-y-4 pb-4">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                            <div className="md:col-span-3 space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Workspace Name</label>
                                                <div className="relative">
                                                    <FolderKanban className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                                    <Input
                                                        placeholder="Project Alpha"
                                                        value={formData.name}
                                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                        required
                                                        className="pl-10 bg-slate-950/50 border-white/5 focus:border-primary/50 h-11 rounded-xl text-sm placeholder:text-slate-600 text-white"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Ident Key</label>
                                                <div className="relative">
                                                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                                                    <Input
                                                        placeholder="KEY"
                                                        value={formData.key}
                                                        onChange={(e) => setFormData({ ...formData, key: e.target.value.toUpperCase() })}
                                                        required
                                                        className="pl-9 bg-slate-950/50 border-white/5 focus:border-primary/50 h-11 rounded-xl font-mono text-xs uppercase tracking-widest placeholder:text-slate-600 text-white"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Mission Description</label>
                                            <div className="relative">
                                                <Info className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                                                <textarea
                                                    placeholder="Describe the mission details..."
                                                    value={formData.description}
                                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                    className="w-full min-h-[100px] pl-10 pr-4 py-2.5 bg-slate-950/50 border border-white/5 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none transition-all text-sm placeholder:text-slate-600 shadow-inner"
                                                />
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
                                                        <span>Update</span>
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
