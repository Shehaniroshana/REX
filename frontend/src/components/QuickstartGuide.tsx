import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Rocket, 
  Database, 
  Users, 
  Layout, 
  Zap, 
  CheckCircle2,
  X 
} from 'lucide-react'

export interface QuickstartGuideProps {
  onClose: () => void
}

const steps = [
  {
    title: 'Sovereign Architecture',
    description: 'REX stores everything on your own PostgreSQL instance. You are in total control of your data.',
    icon: Database,
    color: 'text-cyan-400'
  },
  {
    title: 'Workspace Management',
    description: 'Organize work into Projects. Each project has its own board, backlog, and team members.',
    icon: Layout,
    color: 'text-indigo-400'
  },
  {
    title: 'Sprint Cycles',
    description: 'Use Sprints to plan two-week delivery cycles. Track progress with real-time burndown charts.',
    icon: Rocket,
    color: 'text-orange-400'
  },
  {
    title: 'Team Performance',
    description: 'Monitor throughput and velocity with the Reports engine to optimize delivery speed.',
    icon: Zap,
    color: 'text-yellow-400'
  }
]

export default function QuickstartGuide({ onClose }: QuickstartGuideProps) {
  const [currentStep, setCurrentStep] = useState(0)

  return (
    <Card className="border-cyan-500/30 bg-slate-900/90 backdrop-blur-md shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-indigo-500" />
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-800 transition-colors"
      >
        <X className="w-5 h-5 text-slate-500" />
      </button>

      <CardHeader className="pt-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-cyan-400" />
        </div>
        <CardTitle className="text-2xl font-bold">Welcome to REX Workspace</CardTitle>
        <CardDescription>Follow this quick guide to master the platform</CardDescription>
      </CardHeader>

      <CardContent className="pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {steps.map((step, idx) => {
            const Icon = step.icon
            return (
              <div 
                key={idx}
                className={`p-4 rounded-xl border transition-all duration-300 ${
                  currentStep === idx ? 'bg-slate-800/50 border-cyan-500/50' : 'bg-slate-950/20 border-slate-800'
                }`}
                onMouseEnter={() => setCurrentStep(idx)}
              >
                <div className="flex gap-4">
                  <div className={`p-2 rounded-lg bg-slate-900 border border-slate-800 ${step.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-100">{step.title}</h4>
                    <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-8 flex justify-center">
          <Button 
            onClick={onClose}
            className="px-8 bg-cyan-600 hover:bg-cyan-500 text-white font-bold h-12 rounded-xl shadow-lg shadow-cyan-900/20"
          >
            Start Exploring REX
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
