import { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProjectStore } from '@/store/projectStore'
import { Button } from '@/components/ui/button'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area,
  ComposedChart, Line
} from 'recharts'
import {
  ArrowLeft, Activity, Layers, Crown, Clock, TrendingUp,
  Users, Target, Flame, BarChart3, PieChartIcon, Timer,
  CheckCircle2, AlertTriangle, Calendar, GitBranch, Sparkles,
  Trophy, Rocket, Brain, RefreshCw, Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { reportService, ComprehensiveStats } from '@/services/reportService'
import CustomTooltip from '@/components/analytics/CustomTooltip'
import TeamMemberCard from '@/components/analytics/TeamMemberCard'
import AnalyticsCard from '@/components/analytics/AnalyticsCard'
import ProgressRing from '@/components/common/ProgressRing'
import SectionHeader from '@/components/common/SectionHeader'

// Neon Theme Configuration
const THEME = {
  cyan: '#06b6d4',
  purple: '#8b5cf6',
  emerald: '#10b981',
  rose: '#f43f5e',
  amber: '#f59e0b',
  blue: '#3b82f6',
  indigo: '#6366f1',
  pink: '#ec4899',
  teal: '#14b8a6',
  orange: '#f97316',
  slate: '#64748b',
  grid: '#334155',
  text: '#94a3b8',
  gradients: {
    cyan: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    purple: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    emerald: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    rose: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
    amber: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    blue: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
  }
}

const STATUS_COLORS: Record<string, string> = {
  todo: THEME.slate,
  in_progress: THEME.blue,
  in_review: THEME.purple,
  done: THEME.emerald,
}

const PRIORITY_COLORS: Record<string, string> = {
  highest: THEME.rose,
  high: THEME.orange,
  medium: THEME.amber,
  low: THEME.cyan,
  lowest: THEME.slate,
}

export default function ReportsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { currentProject, fetchProject } = useProjectStore()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<ComprehensiveStats | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'velocity' | 'health'>('overview')

  const loadData = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const [, statsData] = await Promise.all([
        fetchProject(projectId),
        reportService.getComprehensiveStats(projectId)
      ]);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load report data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, fetchProject]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculated metrics
  const metrics = useMemo(() => {
    if (!stats) return null;

    const completionRate = stats.totalIssues > 0
      ? (stats.completedIssues / stats.totalIssues) * 100
      : 0;

    const pointsCompletion = stats.totalPoints > 0
      ? (stats.completedPoints / stats.totalPoints) * 100
      : 0;

    const avgResolutionHours = stats.avgResolutionTime || 0;
    const avgResolutionDays = avgResolutionHours / 24;

    return {
      completionRate,
      pointsCompletion,
      avgResolutionHours,
      avgResolutionDays,
      velocity: stats.recentResolved,
      burnRate: stats.recentCreated > 0 ? (stats.recentResolved / stats.recentCreated) * 100 : 100,
    };
  }, [stats]);

  // Chart data transformations
  const statusChartData = useMemo(() => {
    if (!stats?.statusCounts) return [];
    return stats.statusCounts.map(s => ({
      name: s.status.replace('_', ' ').toUpperCase(),
      value: s.count,
      fill: STATUS_COLORS[s.status] || THEME.slate,
    }));
  }, [stats]);

  const priorityChartData = useMemo(() => {
    if (!stats?.priorityCounts) return [];
    return stats.priorityCounts.map(p => ({
      name: p.priority.toUpperCase(),
      count: p.count,
      fill: PRIORITY_COLORS[p.priority] || THEME.slate,
    })).sort((a, b) => {
      const order = ['HIGHEST', 'HIGH', 'MEDIUM', 'LOW', 'LOWEST'];
      return order.indexOf(a.name) - order.indexOf(b.name);
    });
  }, [stats]);

  const typeTreemapData = useMemo(() => {
    if (!stats?.typeCounts) return [];
    return stats.typeCounts.map(t => ({
      name: t.type.toUpperCase(),
      value: t.count,
    }));
  }, [stats]);

  const velocityChartData = useMemo(() => {
    if (!stats?.dailyTrend) return [];
    return stats.dailyTrend.map(d => ({
      date: format(parseISO(d.date), 'MMM dd'),
      created: d.created,
      resolved: d.resolved,
    }));
  }, [stats]);

  const weeklyVelocityData = useMemo(() => {
    if (!stats?.weeklyVelocity) return [];
    return stats.weeklyVelocity.map(w => ({
      ...w,
      points: w.pointsCompleted
    }));
  }, [stats]);

  const agingChartData = useMemo(() => {
    if (!stats?.agingBuckets) return [];
    const colors = [THEME.emerald, THEME.cyan, THEME.amber, THEME.orange, THEME.rose];
    return stats.agingBuckets.map((b, i) => ({
      name: b.bucket,
      value: b.count,
      fill: colors[i] || THEME.slate,
    }));
  }, [stats]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
            <div className="absolute inset-0 rounded-full border-4 border-t-cyan-500 animate-spin" />
          </div>
          <p className="text-slate-400 font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto" />
          <p className="text-slate-400 font-medium">Failed to load report data</p>
          <Button onClick={loadData} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" /> Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-6 space-y-6 pb-20 animate-fade-in text-slate-200">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/projects/${projectId}`)}
            className="hover:bg-cyan-500/10 hover:text-cyan-400"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                <BarChart3 className="w-7 h-7 text-cyan-400" />
              </div>
              <span className="text-gradient-animate">Analytics Hub</span>
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Deep insights for <span className="text-cyan-400">{currentProject?.name}</span>
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 bg-slate-900/50 p-1 rounded-xl border border-slate-800/50">
          {[
            { id: 'overview', label: 'Overview', icon: PieChartIcon },
            { id: 'team', label: 'Team', icon: Users },
            { id: 'velocity', label: 'Velocity', icon: TrendingUp },
            { id: 'health', label: 'Health', icon: Activity },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                activeTab === tab.id
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Hero Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <AnalyticsCard
          label="Total Issues"
          value={stats.totalIssues}
          icon={Layers}
          color={THEME.cyan}
          delay={0}
        />
        <AnalyticsCard
          label="Completed"
          value={stats.completedIssues}
          icon={CheckCircle2}
          color={THEME.emerald}
          trend="up"
          trendValue={`${metrics?.completionRate.toFixed(0)}%`}
          delay={50}
        />
        <AnalyticsCard
          label="In Progress"
          value={stats.openIssues}
          icon={Flame}
          color={THEME.blue}
          delay={100}
        />
        <AnalyticsCard
          label="Story Points"
          value={stats.totalPoints}
          icon={Target}
          color={THEME.purple}
          delay={150}
        />
        <AnalyticsCard
          label="Weekly Velocity"
          value={stats.recentResolved}
          icon={Rocket}
          color={THEME.amber}
          trend={stats.recentResolved >= stats.recentCreated ? 'up' : 'down'}
          trendValue={`${stats.recentResolved}/${stats.recentCreated}`}
          delay={200}
        />
        <AnalyticsCard
          label="Avg Resolution"
          value={Math.round(metrics?.avgResolutionDays || 0)}
          icon={Timer}
          color={THEME.pink}
          suffix=" days"
          delay={250}
        />
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Velocity Trend Chart */}
          <div className="glass-card p-6 rounded-2xl bg-slate-900/40 border border-slate-800/50">
            <SectionHeader
              icon={TrendingUp}
              title="Velocity Trend"
              subtitle="Created vs Resolved issues over the last 30 days"
              color={THEME.cyan}
            />
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={velocityChartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                  <defs>
                    <linearGradient id="createdGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={THEME.cyan} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={THEME.cyan} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="resolvedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={THEME.emerald} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={THEME.emerald} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke={THEME.text} tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis stroke={THEME.text} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: 20 }} />
                  <Area
                    type="monotone"
                    dataKey="created"
                    name="Created"
                    fill="url(#createdGradient)"
                    stroke={THEME.cyan}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="resolved"
                    name="Resolved"
                    stroke={THEME.emerald}
                    strokeWidth={3}
                    dot={{ r: 4, fill: THEME.emerald, strokeWidth: 0 }}
                    activeDot={{ r: 8, stroke: THEME.emerald, strokeWidth: 2, fill: '#0f172a' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Distribution Charts Row - Ultra Creative */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Status Orbital - Futuristic Ring Display */}
            <div className="glass-card p-6 rounded-2xl bg-slate-900/40 border border-slate-800/50 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />
              <SectionHeader icon={GitBranch} title="Status Orbit" color={THEME.blue} />
              <div className="relative h-[300px] flex items-center justify-center">
                {/* Animated Orbital Rings */}
                <div className="absolute w-48 h-48 rounded-full border border-slate-700/30 animate-[spin_20s_linear_infinite]" />
                <div className="absolute w-36 h-36 rounded-full border border-slate-700/50 animate-[spin_15s_linear_infinite_reverse]" />
                <div className="absolute w-24 h-24 rounded-full border border-cyan-500/20 animate-[spin_10s_linear_infinite]" />

                {/* Center Stats */}
                <div className="relative z-10 text-center">
                  <div className="text-4xl font-black text-white mb-1" style={{ textShadow: `0 0 30px ${THEME.cyan}` }}>
                    {stats.totalIssues}
                  </div>
                  <div className="text-xs text-slate-500 uppercase tracking-widest">Total</div>
                </div>

                {/* Floating Status Orbs */}
                {statusChartData.map((status, i) => {
                  const angle = (i * (360 / statusChartData.length) - 90) * (Math.PI / 180);
                  const radius = 85;
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;
                  return (
                    <div
                      key={status.name}
                      className="absolute flex flex-col items-center transition-transform duration-500 hover:scale-125 cursor-pointer"
                      style={{ transform: `translate(${x}px, ${y}px)` }}
                    >
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm animate-pulse"
                        style={{
                          background: `radial-gradient(circle, ${status.fill} 0%, ${status.fill}80 50%, transparent 70%)`,
                          boxShadow: `0 0 30px ${status.fill}80, 0 0 60px ${status.fill}40`,
                        }}
                      >
                        {status.value}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 whitespace-nowrap">{status.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Priority Power Meters */}
            <div className="glass-card p-6 rounded-2xl bg-slate-900/40 border border-slate-800/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full" />
              <SectionHeader icon={Crown} title="Priority Power" color={THEME.amber} />
              <div className="space-y-4 mt-4">
                {priorityChartData.map((p, i) => {
                  const maxCount = Math.max(...priorityChartData.map(x => x.count), 1);
                  const percent = (p.count / maxCount) * 100;
                  return (
                    <div key={p.name} className="group/bar">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-sm animate-pulse"
                            style={{ backgroundColor: p.fill, boxShadow: `0 0 15px ${p.fill}` }}
                          />
                          <span className="text-sm text-slate-300 font-medium">{p.name}</span>
                        </div>
                        <span className="text-lg font-bold text-white">{p.count}</span>
                      </div>
                      <div className="h-3 bg-slate-800/80 rounded-full overflow-hidden relative">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out group-hover/bar:brightness-125"
                          style={{
                            width: `${percent}%`,
                            background: `linear-gradient(90deg, ${p.fill}90 0%, ${p.fill} 50%, ${p.fill}dd 100%)`,
                            boxShadow: `0 0 20px ${p.fill}60, inset 0 1px 0 rgba(255,255,255,0.3)`,
                          }}
                        />
                        {/* Animated Glow Line */}
                        <div
                          className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_2s_infinite]"
                          style={{ left: `${percent - 10}%`, animationDelay: `${i * 200}ms` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Decorative Element */}
              <div className="absolute bottom-4 right-4 opacity-20">
                <Crown className="w-20 h-20 text-amber-500" />
              </div>
            </div>

            {/* Work Type Hexagons */}
            <div className="glass-card p-6 rounded-2xl bg-slate-900/40 border border-slate-800/50 relative overflow-hidden">
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill='none' stroke='%238b5cf6' stroke-width='1'/%3E%3C/svg%3E")`,
                  backgroundSize: '60px 60px',
                }} />
              </div>
              <SectionHeader icon={Layers} title="Work DNA" color={THEME.purple} />
              <div className="relative h-[280px] flex items-center justify-center">
                <div className="grid grid-cols-2 gap-4 p-4">
                  {typeTreemapData.slice(0, 4).map((type, i) => {
                    const colors = [THEME.emerald, THEME.blue, THEME.rose, THEME.purple];
                    const color = colors[i % colors.length];
                    const total = typeTreemapData.reduce((a, b) => a + b.value, 0);
                    const percent = total > 0 ? ((type.value / total) * 100).toFixed(0) : 0;
                    return (
                      <div
                        key={type.name}
                        className="relative group cursor-pointer transition-all duration-300 hover:scale-110 hover:z-10"
                      >
                        {/* Hexagon Shape */}
                        <div
                          className="w-28 h-32 flex flex-col items-center justify-center transition-all duration-300"
                          style={{
                            background: `linear-gradient(180deg, ${color}30 0%, ${color}10 100%)`,
                            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                            boxShadow: `inset 0 0 30px ${color}20`,
                          }}
                        >
                          <div
                            className="text-3xl font-black transition-all duration-300 group-hover:scale-110"
                            style={{ color, textShadow: `0 0 20px ${color}` }}
                          >
                            {type.value}
                          </div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">{type.name}</div>
                          <div className="text-xs text-slate-500">{percent}%</div>
                        </div>
                        {/* Glow Effect on Hover */}
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                          style={{
                            background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
                            filter: 'blur(20px)',
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Issue Aging & Labels Row - Ultra Creative */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Issue Aging - Timeline Style */}
            <div className="glass-card p-6 rounded-2xl bg-slate-900/40 border border-slate-800/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-rose-500/5" />
              <SectionHeader icon={Clock} title="Time Tunnel" subtitle="Issue age distribution" color={THEME.amber} />
              <div className="relative mt-6">
                {/* Timeline Line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500 via-amber-500 to-rose-500" />

                {agingChartData.map((bucket, index) => {
                  const sizes = [60, 52, 44, 36, 28];
                  const size = sizes[index] || 28;
                  const maxVal = Math.max(...agingChartData.map(b => b.value), 1);
                  const widthPercent = (bucket.value / maxVal) * 100;

                  return (
                    <div key={bucket.name} className="relative flex items-center gap-4 mb-6 group">
                      {/* Timeline Node */}
                      <div
                        className="relative z-10 flex items-center justify-center rounded-full border-2 border-slate-800 transition-all duration-300 group-hover:scale-110"
                        style={{
                          width: size,
                          height: size,
                          background: `radial-gradient(circle, ${bucket.fill}40 0%, ${bucket.fill}10 100%)`,
                          boxShadow: `0 0 20px ${bucket.fill}30`,
                        }}
                      >
                        <span className="text-white font-bold text-sm">{bucket.value}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-300 font-medium text-sm">{bucket.name}</span>
                          <span className="text-xs text-slate-500">{Math.round(widthPercent)}%</span>
                        </div>
                        <div className="h-2 bg-slate-800/60 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                              width: `${widthPercent}%`,
                              background: `linear-gradient(90deg, ${bucket.fill} 0%, ${bucket.fill}80 100%)`,
                              boxShadow: `0 0 15px ${bucket.fill}50`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Labels - Floating Tags Cloud */}
            <div className="glass-card p-6 rounded-2xl bg-slate-900/40 border border-slate-800/50 relative overflow-hidden">
              <div className="absolute inset-0">
                <div className="absolute top-10 left-10 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
              </div>
              <SectionHeader icon={Sparkles} title="Label Galaxy" subtitle="Issue tag cloud" color={THEME.pink} />
              {stats.labelStats && stats.labelStats.length > 0 ? (
                <div className="relative h-[280px] flex flex-wrap items-center justify-center gap-3 content-center p-4">
                  {stats.labelStats.map((label, index) => {
                    const maxCount = Math.max(...stats.labelStats.map(l => l.count), 1);
                    const scale = 0.8 + (label.count / maxCount) * 0.6;
                    const delays = [0, 100, 200, 300, 400];

                    return (
                      <div
                        key={label.labelId}
                        className="group cursor-pointer transition-all duration-300 hover:scale-110 hover:z-10 animate-float"
                        style={{
                          animationDelay: `${delays[index % 5]}ms`,
                          animationDuration: `${3 + (index % 3)}s`,
                        }}
                      >
                        <div
                          className="px-4 py-2 rounded-full flex items-center gap-2 backdrop-blur-sm border transition-all duration-300 group-hover:shadow-lg"
                          style={{
                            transform: `scale(${scale})`,
                            backgroundColor: `${label.color}20`,
                            borderColor: `${label.color}40`,
                            boxShadow: `0 0 20px ${label.color}20`,
                          }}
                        >
                          <div
                            className="w-2 h-2 rounded-full animate-pulse"
                            style={{ backgroundColor: label.color, boxShadow: `0 0 10px ${label.color}` }}
                          />
                          <span className="text-white text-sm font-medium whitespace-nowrap">{label.labelName}</span>
                          <span
                            className="text-xs font-bold px-1.5 py-0.5 rounded-md"
                            style={{ backgroundColor: `${label.color}30`, color: label.color }}
                          >
                            {label.count}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full opacity-30">
                  <Sparkles className="w-16 h-16 mb-4" />
                  <p>No label data available</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'team' && (
        <div className="space-y-6">
          <SectionHeader
            icon={Trophy}
            title="Leaderboard"
            subtitle="Top contributors by completed story points"
            color={THEME.amber}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.teamStats.sort((a, b) => b.completedPoints - a.completedPoints).map((member, index) => (
              <TeamMemberCard key={member.email} member={member} rank={index + 1} />
            ))}
          </div>

          <div className="glass-card p-6 rounded-2xl bg-slate-900/40 border border-slate-800/50">
            <SectionHeader icon={Users} title="Workload Distribution" color={THEME.blue} />
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.teamStats.sort((a, b) => b.assignedIssues - a.assignedIssues)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey={(m) => `${m.firstName} ${m.lastName[0]}.`}
                    stroke={THEME.text}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                  />
                  <YAxis stroke={THEME.text} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="completedIssues" name="Completed" fill={THEME.emerald} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="inProgressCount" name="In Progress" fill={THEME.blue} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'velocity' && (
        <div className="space-y-6">
          <SectionHeader
            icon={Zap}
            title="Sprint Velocity"
            subtitle="Historical story points delivered"
            color={THEME.purple}
          />
          <div className="h-[400px] w-full glass-card p-6 rounded-2xl bg-slate-900/40 border border-slate-800/50">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyVelocityData}>
                <defs>
                  <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={THEME.purple} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={THEME.purple} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="week" stroke={THEME.text} tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis stroke={THEME.text} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="points"
                  name="Points Delivered"
                  fill="url(#velocityGradient)"
                  stroke={THEME.purple}
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-6 rounded-2xl bg-slate-900/40 border border-slate-800/50">
            <SectionHeader icon={Calendar} title="Recent Sprints" color={THEME.cyan} />
            <div className="space-y-4">
              {stats.sprintStats && stats.sprintStats.length > 0 ? (
                stats.sprintStats.map((sprint) => (
                  <div key={sprint.id} className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-cyan-500/10 text-cyan-400">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-white">{sprint.name}</p>
                        <p className="text-xs text-slate-500">Delivered {sprint.completedPoints} points</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-lg font-black",
                        sprint.completedPoints > 20 ? "text-emerald-400" : "text-amber-400"
                      )}>
                        {sprint.completedPoints}
                      </p>
                      <p className="text-[10px] text-slate-500 uppercase">Points</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 opacity-30">
                  <Calendar className="w-12 h-12 mx-auto mb-2" />
                  <p>No sprint data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'health' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6 rounded-2xl bg-slate-900/40 border border-slate-800/50">
            <SectionHeader
              icon={CheckCircle2}
              title="Completion Health"
              subtitle="Project delivery efficiency"
              color={THEME.emerald}
            />
            <div className="flex items-center justify-center py-10">
              <ProgressRing
                progress={metrics?.completionRate || 0}
                size={200}
                strokeWidth={15}
                color={THEME.emerald}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-slate-950/40 border border-slate-800/50 rounded-xl">
                <p className="text-xs text-slate-500 uppercase mb-1">Total Issues</p>
                <p className="text-2xl font-bold text-white">{stats.totalIssues}</p>
              </div>
              <div className="p-4 bg-slate-950/40 border border-slate-800/50 rounded-xl">
                <p className="text-xs text-slate-500 uppercase mb-1">Points Completed</p>
                <p className="text-2xl font-bold text-white">{stats.completedPoints}</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl bg-slate-900/40 border border-slate-800/50">
            <SectionHeader
              icon={Target}
              title="Point Delivery"
              subtitle="Story points status"
              color={THEME.purple}
            />
            <div className="flex items-center justify-center py-10">
              <ProgressRing
                progress={metrics?.pointsCompletion || 0}
                size={200}
                strokeWidth={15}
                color={THEME.purple}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-slate-950/40 border border-slate-800/50 rounded-xl">
                <p className="text-xs text-slate-500 uppercase mb-1">Total Points</p>
                <p className="text-2xl font-bold text-white">{stats.totalPoints}</p>
              </div>
              <div className="p-4 bg-slate-950/40 border border-slate-800/50 rounded-xl">
                <p className="text-xs text-slate-500 uppercase mb-1">Avg Resolution</p>
                <p className="text-2xl font-bold text-white">{Math.round(metrics?.avgResolutionDays || 0)}d</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl bg-slate-900/40 border border-slate-800/50">
            <SectionHeader
              icon={Flame}
              title="Burn Rate"
              subtitle="Created vs Resolved Ratio"
              color={THEME.rose}
            />
            <div className="flex items-center justify-center py-10">
              <ProgressRing
                progress={metrics?.burnRate || 100}
                size={200}
                strokeWidth={15}
                color={metrics?.burnRate && metrics.burnRate >= 100 ? THEME.emerald : THEME.rose}
              />
            </div>
            <div className="text-center mt-4">
              <p className="text-sm text-slate-400">
                {metrics?.burnRate && metrics.burnRate >= 100
                  ? "Resolving more than creating. Good progress!"
                  : "Creating faster than resolving. Backlog growing."}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-slate-950/40 border border-slate-800/50 rounded-xl">
                <p className="text-xs text-slate-500 uppercase mb-1">Recent Created</p>
                <p className="text-2xl font-bold text-white">{stats.recentCreated}</p>
              </div>
              <div className="p-4 bg-slate-950/40 border border-slate-800/50 rounded-xl">
                <p className="text-xs text-slate-500 uppercase mb-1">Recent Resolved</p>
                <p className="text-2xl font-bold text-white">{stats.recentResolved}</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl bg-slate-900/40 border border-slate-800/50">
            <SectionHeader
              icon={Timer}
              title="Avg Issue Age"
              subtitle="Time to resolution"
              color={THEME.pink}
            />
            <div className="space-y-6 py-6">
              <div className="flex justify-between items-center text-center">
                <div className="flex-1 p-4 bg-slate-950/40 border border-slate-800/50 rounded-xl mr-2">
                  <Timer className="w-8 h-8 mx-auto mb-2 text-pink-400" />
                  <p className="text-2xl font-bold text-white">{Math.round(metrics?.avgResolutionDays || 0)}d</p>
                  <p className="text-[10px] text-slate-500 uppercase">Avg Days</p>
                </div>
                <div className="flex-1 p-4 bg-slate-950/40 border border-slate-800/50 rounded-xl ml-2">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-cyan-400" />
                  <p className="text-2xl font-bold text-white">{stats.avgResolutionTime || 0}h</p>
                  <p className="text-[10px] text-slate-500 uppercase">Avg Hours</p>
                </div>
              </div>
              <div className="p-4 bg-slate-950/40 border border-slate-800/50 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  <p className="text-sm font-medium text-white">Insight</p>
                </div>
                <p className="text-xs text-slate-400">
                  Issues are resolved in about {Math.round(metrics?.avgResolutionDays || 0)} days on average.
                  Resolution efficiency is {stats.recentResolved > 0 ?'high' : 'low'} based on recent activity.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 glass-card p-6 rounded-2xl bg-slate-900/40 border border-slate-800/50">
            <SectionHeader
              icon={AlertTriangle}
              title="Issue Distribution (Age)"
              subtitle="Current backlog aging"
              color={THEME.orange}
            />
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={agingChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {agingChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {agingChartData.map((bucket) => (
                  <div key={bucket.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: bucket.fill }} />
                    <span className="text-xs text-slate-400">{bucket.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
