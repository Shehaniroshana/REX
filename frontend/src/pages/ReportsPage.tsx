import { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useIssueStore } from '@/store/issueStore'
import { useProjectStore } from '@/store/projectStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Sector, AreaChart, Area,
  RadialBarChart, RadialBar, ComposedChart, Line, Treemap
} from 'recharts'
import {
  ArrowLeft, Activity, Octagon, Layers,
  Zap, Disc, CalendarClock, Crown, Clock, TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { format, parseISO, differenceInDays } from 'date-fns'

// Theme Configuration
const COLORS = {
  cyan: '#06b6d4',
  purple: '#8b5cf6',
  emerald: '#10b981',
  rose: '#f43f5e',
  amber: '#f59e0b',
  blue: '#3b82f6',
  slate: '#1e293b',
  grid: '#334155',
  text: '#94a3b8'
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.5)] backdrop-blur-xl z-50">
        <p className="text-slate-200 font-bold mb-2 border-b border-slate-800 pb-1">{label || payload[0].name}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-3 text-sm py-0.5">
            <div
              className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]"
              style={{ backgroundColor: entry.color || entry.fill }}
            />
            <span className="text-slate-400 capitalize">{entry.name}:</span>
            <span className="text-white font-mono font-bold">
              {typeof entry.value === 'number' && entry.value % 1 !== 0 ? entry.value.toFixed(2) : entry.value}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

const CustomizedTreemapContent = (props: any) => {
  const { root, depth, x, y, width, height, index, payload, colors, name } = props;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: depth < 2 ? colors[Math.floor((index / (root?.children?.length || 1)) * 6)] : 'none',
          stroke: '#1e293b',
          strokeWidth: 2 / (depth + 1e-10),
          strokeOpacity: 1 / (depth + 1e-10),
        }}
      />
      {depth === 1 ? (
        <text
          x={x + width / 2}
          y={y + height / 2 + 7}
          textAnchor="middle"
          fill="#fff"
          fontSize={14}
          fontWeight="bold"
        >
          {name}
        </text>
      ) : null}
      {depth === 1 && payload ? (
        <text
          x={x + width / 2}
          y={y + height / 2 + 24}
          textAnchor="middle"
          fill="rgba(255,255,255,0.7)"
          fontSize={10}
        >
          {payload.value} items
        </text>
      ) : null}
    </g>
  );
};

export default function ReportsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { issues, fetchIssues } = useIssueStore()
  const { currentProject, fetchProject } = useProjectStore()
  const [isLoading, setIsLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)

  const onPieEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index);
  }, []);

  useEffect(() => {
    if (projectId) {
      Promise.all([
        fetchProject(projectId),
        fetchIssues(projectId)
      ]).finally(() => setIsLoading(false))
    }
  }, [projectId, fetchProject, fetchIssues])

  const projectIssues = (issues[projectId || ''] || []) as any[]

  // --- Data Calculations ---

  // 1. Velocity Trend (Created vs Resolved)
  const velocityData = useMemo(() => {
    const dates: Record<string, { date: string, created: number, resolved: number }> = {}

    // Sort all relevant dates
    projectIssues.forEach(i => {
      const cDate = i.createdAt ? format(parseISO(i.createdAt), 'MMM dd') : null
      const rDate = (i.status === 'done' && i.updatedAt) ? format(parseISO(i.updatedAt), 'MMM dd') : null

      if (cDate) {
        if (!dates[cDate]) dates[cDate] = { date: cDate, created: 0, resolved: 0 }
        dates[cDate].created++
      }
      if (rDate) {
        if (!dates[rDate]) dates[rDate] = { date: rDate, created: 0, resolved: 0 }
        dates[rDate].resolved++
      }
    })

    return Object.values(dates).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [projectIssues])

  // 2. Issue Aging
  const agingData = useMemo(() => {
    const buckets = { '< 2 Days': 0, '2-7 Days': 0, '8-14 Days': 0, '15+ Days': 0 }
    const now = new Date()

    projectIssues.forEach(i => {
      if (i.status === 'done') return // Only count active issues
      const age = differenceInDays(now, i.createdAt ? parseISO(i.createdAt) : new Date())
      if (age < 2) buckets['< 2 Days']++
      else if (age <= 7) buckets['2-7 Days']++
      else if (age <= 14) buckets['8-14 Days']++
      else buckets['15+ Days']++
    })

    return Object.entries(buckets).map(([name, value]) => ({ name, value }))
  }, [projectIssues])

  // 3. Type Treemap
  const typeData = useMemo(() => {
    const types: Record<string, number> = {}
    projectIssues.forEach(i => {
      const t = i.type || 'task'
      types[t] = (types[t] || 0) + 1
    })
    const children = Object.entries(types).map(([name, size]) => ({ name: name.toUpperCase(), size }))
    return [{ name: 'Types', children }]
  }, [projectIssues])

  // 4. Priority Radial
  const priorityData = useMemo(() => {
    const data = [
      { name: 'Highest', count: projectIssues.filter(i => i.priority === 'highest').length, fill: COLORS.rose },
      { name: 'High', count: projectIssues.filter(i => i.priority === 'high').length, fill: COLORS.amber },
      { name: 'Medium', count: projectIssues.filter(i => i.priority === 'medium').length, fill: COLORS.cyan },
      { name: 'Low', count: projectIssues.filter(i => i.priority === 'low').length, fill: COLORS.purple },
    ]
    return data.filter(d => d.count > 0)
  }, [projectIssues])

  // 5. Status Donut
  const statusData = useMemo(() => [
    { name: 'Done', value: projectIssues.filter(i => i.status === 'done').length, fill: COLORS.emerald },
    { name: 'In Progress', value: projectIssues.filter(i => i.status === 'in_progress').length, fill: COLORS.blue },
    { name: 'Review', value: projectIssues.filter(i => i.status === 'in_review').length, fill: COLORS.purple },
    { name: 'To Do', value: projectIssues.filter(i => i.status === 'todo').length, fill: COLORS.slate },
  ].filter(d => d.value > 0), [projectIssues])


  if (isLoading) return <div className="text-white p-10">Loading...</div>

  return (
    <div className="min-h-screen bg-transparent p-6 space-y-6 pb-20 animate-fade-in text-slate-200">

      {/* Header */}
      <header className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/projects/${projectId}`)} className="hover:bg-cyan-500/10 hover:text-cyan-400">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Activity className="w-8 h-8 text-cyan-400" />
            Mission Control
          </h1>
          <p className="text-slate-500 font-medium">Deep dive analytics for {currentProject?.name}</p>
        </div>
      </header>

      {/* KPI Row (Standard but clean) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Issues', value: projectIssues.length, icon: Layers, color: 'text-cyan-400', border: 'border-cyan-500/30' },
          { label: 'Resolved', value: projectIssues.filter(i => i.status === 'done').length, icon: Zap, color: 'text-emerald-400', border: 'border-emerald-500/30' },
          { label: 'Active', value: projectIssues.filter(i => i.status === 'in_progress').length, icon: Activity, color: 'text-blue-400', border: 'border-blue-500/30' },
          { label: 'Critical', value: projectIssues.filter(i => i.priority === 'highest').length, icon: Crown, color: 'text-rose-400', border: 'border-rose-500/30' },
        ].map((stat, i) => (
          <div key={i} className={`glass-card p-4 rounded-xl border-l-4 ${stat.border} bg-slate-900/40`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">{stat.label}</p>
                <h3 className="text-2xl font-bold text-white mt-1">{stat.value}</h3>
              </div>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* ROW 1: Wide Velocity Trend */}
      <div className="glass-card p-6 rounded-2xl bg-slate-900/40 border border-slate-800">
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Velocity Trend
            </h2>
            <p className="text-sm text-slate-500">Created vs Resolved issues over time</p>
          </div>
        </div>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={velocityData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" stroke={COLORS.text} tick={{ fontSize: 12 }} />
              <YAxis stroke={COLORS.text} tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="created" name="Created" fill={COLORS.cyan} radius={[4, 4, 0, 0]} barSize={20} fillOpacity={0.6} />
              <Line type="monotone" dataKey="resolved" name="Resolved" stroke={COLORS.emerald} strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 8 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ROW 2: Heatmap & Aging */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Type Distribution Treemap */}
        <div className="glass-card p-6 rounded-2xl bg-slate-900/40 border border-slate-800">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />
            Work Composition
          </h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={typeData}
                dataKey="size"
                stroke="#fff"
                fill="#8884d8"
                content={<CustomizedTreemapContent colors={[COLORS.cyan, COLORS.purple, COLORS.emerald, COLORS.rose, COLORS.amber, COLORS.blue]} />}
              >
                <Tooltip content={<CustomTooltip />} />
              </Treemap>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Issue Aging */}
        <div className="glass-card p-6 rounded-2xl bg-slate-900/40 border border-slate-800">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            Issue Aging
          </h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agingData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" stroke={COLORS.text} />
                <YAxis dataKey="name" type="category" stroke={COLORS.text} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill={COLORS.amber} radius={[0, 4, 4, 0]} barSize={30}>
                  {agingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={[COLORS.emerald, COLORS.cyan, COLORS.amber, COLORS.rose][index] || COLORS.cyan} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ROW 3: Priority & Status (Compacted) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white mb-1">Impact Radar</h2>
            <p className="text-slate-500 text-xs">Priority Distribution</p>
            <div className="mt-4 space-y-2">
              {priorityData.map(p => (
                <div key={p.name} className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill }} />
                  {p.name}: <span className="text-white font-bold">{p.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="h-[200px] w-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="30%" outerRadius="100%" data={priorityData} startAngle={180} endAngle={0} barSize={15}>
                <RadialBar background={{ fill: 'rgba(255,255,255,0.05)' }} dataKey="count" cornerRadius={10} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white mb-1">Status Nebula</h2>
            <p className="text-slate-500 text-xs">Workflow State</p>
            <div className="mt-4 space-y-2">
              {statusData.map(s => (
                <div key={s.name} className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.fill }} />
                  {s.name}: <span className="text-white font-bold">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="h-[200px] w-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  )
}
