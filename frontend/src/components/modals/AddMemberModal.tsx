import { Search, UserPlus, Users, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import type { User } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'

interface AddMemberModalProps {
  isOpen: boolean
  onClose: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
  searchResults: User[]
  onAddMember: (user: User) => void
  isLoading?: boolean
}

export function AddMemberModal({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  searchResults,
  onAddMember,
  isLoading
}: AddMemberModalProps) {
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
              <div className="absolute -top-16 -right-16 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative p-6 px-8 flex flex-col min-h-0 h-full">
                <button 
                   onClick={onClose}
                   className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors z-20"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-4 mb-8 flex-none">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-500/20">
                    <UserPlus className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">Add Team</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Recruit members to your mission</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 -mr-1 custom-scrollbar">
                  <div className="space-y-4 pb-4">
                    {/* Search Input */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Search Database</label>
                      <div className="relative group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                        <Input
                          placeholder="Search by name or email..."
                          value={searchQuery}
                          onChange={(e) => onSearchChange(e.target.value)}
                          className="pl-10 bg-slate-950/50 border-white/5 focus:border-cyan-500/50 h-11 rounded-xl text-sm placeholder:text-slate-600 shadow-inner text-white"
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Search Results */}
                    <div className="space-y-2 min-h-[100px]">
                      {searchResults.length > 0 ? (
                        searchResults.map((user) => (
                          <motion.div
                            layout
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            key={user.id}
                            className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all border border-white/5 hover:border-white/10 group"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8 ring-1 ring-white/10">
                                <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-indigo-600 text-white font-bold text-xs">
                                  {getInitials(user.firstName, user.lastName)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                 <p className="font-bold text-sm text-white group-hover:text-cyan-400 transition-colors">{user.firstName} {user.lastName}</p>
                                 <p className="text-[10px] text-slate-500 font-medium line-clamp-1">{user.email}</p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => onAddMember(user)}
                              className="btn-neon text-[10px] font-black uppercase tracking-widest h-8 px-3 rounded-lg flex-shrink-0"
                              disabled={isLoading}
                            >
                              <Plus className="w-3.5 h-3.5 mr-1" />
                              Recruit
                            </Button>
                          </motion.div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-slate-500/50 bg-slate-950/20 rounded-2xl border border-dashed border-white/5">
                          {searchQuery.length >= 2 ? (
                            <>
                              <Users className="w-10 h-10 mb-2 opacity-20" />
                              <p className="font-bold text-sm text-slate-400">No matches found</p>
                              <p className="text-[10px]">Try a different search term</p>
                            </>
                          ) : (
                            <>
                              <Search className="w-10 h-10 mb-2 opacity-10" />
                              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Enter mission criteria</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 pt-6">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        className="flex-1 h-11 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 text-xs font-black uppercase tracking-widest"
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
