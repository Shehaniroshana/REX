import React, { useState } from 'react'
import { Key, X, Lock, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { motion, AnimatePresence } from 'framer-motion'

interface ResetPasswordModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (password: string) => Promise<void>
    isLoading?: boolean
}

export default function ResetPasswordModal({
    isOpen,
    onClose,
    onSubmit,
    isLoading = false
}: ResetPasswordModalProps) {
    const [password, setPassword] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await onSubmit(password)
        setPassword('')
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
                        className="relative w-full max-w-sm max-h-[90vh] flex flex-col"
                    >
                        <div className="glass-card bg-slate-900/60 border border-white/10 rounded-3xl shadow-2xl shadow-black/40 h-full flex flex-col overflow-hidden">
                            {/* Decorative background element */}
                            <div className="absolute -top-16 -right-16 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
                            <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

                            <div className="relative p-6 px-8 flex flex-col min-h-0 h-full">
                                <button 
                                    onClick={onClose}
                                    className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors z-20"
                                >
                                    <X className="w-4 h-4" />
                                </button>

                                <div className="flex items-center gap-4 mb-8 flex-none">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center shadow-lg shadow-amber-500/20 ring-1 ring-amber-500/20">
                                        <Key className="w-6 h-6 text-amber-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white tracking-tight">Security Reset</h2>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Access Credential Update</p>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto pr-1 -mr-1 custom-scrollbar">
                                    <form onSubmit={handleSubmit} className="space-y-4 pb-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">New Access Key</label>
                                            <div className="relative">
                                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                                <Input
                                                    type="password"
                                                    placeholder="••••••••"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    required
                                                    className="pl-10 bg-slate-950/50 border-white/5 focus:border-amber-500/50 h-11 rounded-xl text-sm placeholder:text-slate-600 text-white"
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
                                                style={{ '--neon-color': '#f59e0b' } as any}
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
                                                        <span>Secure</span>
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
