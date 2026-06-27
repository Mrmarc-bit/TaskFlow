import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, CheckSquare, Zap, Shield, Search,
  ArrowRight, Activity, Users, Plus, Star, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const LandingPage: React.FC = () => {
  const token = localStorage.getItem('taskflow-token');

  const [activeTab, setActiveTab] = useState<'board' | 'list' | 'analytics'>('board');
  const [demoTasks, setDemoTasks] = useState([
    { id: 1, title: 'Secure server using RTR session rotation', status: 'IN_PROGRESS', priority: 'URGENT', category: 'Security' },
    { id: 2, title: 'Build interactive SVG charts dashboard', status: 'TODO', priority: 'HIGH', category: 'Analytics' },
    { id: 3, title: 'Integrate NestJS socket gateways', status: 'DONE', priority: 'MEDIUM', category: 'Real-time' },
    { id: 4, title: 'Setup Workbox offline cache service worker', status: 'TODO', priority: 'LOW', category: 'PWA' },
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [draggedOverCol, setDraggedOverCol] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData('text/plain', id.toString());
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const taskId = parseInt(e.dataTransfer.getData('text/plain'), 10);
    setDemoTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: targetStatus } : t));
    setDraggedOverCol(null);
  };

  const advanceTask = (id: number) => {
    setDemoTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const next = t.status === 'TODO' ? 'IN_PROGRESS' : t.status === 'IN_PROGRESS' ? 'DONE' : 'TODO';
      return { ...t, status: next };
    }));
  };

  const toggleChecklist = (id: number) => {
    setDemoTasks(prev => prev.map(t =>
      t.id === id ? { ...t, status: t.status === 'DONE' ? 'TODO' : 'DONE' } : t
    ));
  };

  const handleAddDemoTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      setDemoTasks(prev => [...prev, { id: Date.now(), title: newTaskTitle.trim(), status: 'TODO', priority: 'MEDIUM', category: 'Sandbox' }]);
      setNewTaskTitle('');
    }
  };

  const doneCount = demoTasks.filter(t => t.status === 'DONE').length;
  const progressPct = Math.round((doneCount / demoTasks.length) * 100);

  const features = [
    { icon: Zap, color: 'text-violet-500', bg: 'bg-violet-50', title: 'Real-time Sync', desc: 'WebSocket-powered collaboration. See updates live as your team moves tasks.' },
    { icon: CheckSquare, color: 'text-blue-500', bg: 'bg-blue-50', title: 'Kanban Board', desc: 'Drag-and-drop cards with subtask checklists, priority labels, and instant status updates.' },
    { icon: Search, color: 'text-indigo-500', bg: 'bg-indigo-50', title: 'Spotlight Search', desc: 'Hit ⌘K from anywhere to open the command palette. Navigate everything instantly.' },
    { icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50', title: 'Analytics', desc: 'SVG velocity charts, donut completion metrics, and weekly productivity reports.' },
    { icon: Shield, color: 'text-rose-500', bg: 'bg-rose-50', title: 'Enterprise Security', desc: 'Refresh token rotation, HttpOnly cookies, and RBAC route protection built-in.' },
    { icon: Users, color: 'text-amber-500', bg: 'bg-amber-50', title: 'Threaded Comments', desc: 'Comment, reply, and discuss tasks in context. Keep every discussion organised.' },
  ];

  const logos = ['Notion', 'Linear', 'Figma', 'Vercel', 'Stripe', 'GitHub'];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-violet-200">
              <LayoutDashboard size={16} />
            </div>
            <span className="font-bold text-base tracking-tight text-slate-900">TaskFlow</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500">
            <a href="#demo" className="hover:text-slate-900 transition-colors">Demo</a>
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            {token ? (
              <Link to="/dashboard" className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-violet-200">
                Go to Workspace <ArrowRight size={14} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors px-3 py-2">Sign In</Link>
                <Link to="/register" className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl transition-colors">
                  Get Started <ChevronRight size={14} />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 border border-violet-100 text-violet-600 text-xs font-semibold mb-6">
            <Zap size={12} className="fill-violet-500" /> Now in Beta — Interactive Workspace Preview
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08 }}
          className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08] text-slate-900 max-w-4xl mx-auto"
        >
          Task management at the{' '}
          <span className="bg-gradient-to-r from-violet-600 via-indigo-500 to-blue-500 bg-clip-text text-transparent">
            speed of thought
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.16 }}
          className="mt-6 text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed"
        >
          TaskFlow combines a blazing-fast Kanban board, real-time WebSocket sync, and AI-powered metrics. Built for teams who ship.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.24 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link to={token ? '/dashboard' : '/register'} className="flex items-center gap-2 px-7 py-3.5 bg-slate-900 hover:bg-slate-700 text-white font-bold rounded-2xl shadow-lg shadow-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm">
            Start for free <ArrowRight size={16} />
          </Link>
          <a href="#demo" className="flex items-center gap-2 px-7 py-3.5 border border-slate-200 hover:border-slate-300 bg-white text-slate-700 font-semibold rounded-2xl text-sm transition-all hover:shadow-sm">
            Try interactive demo
          </a>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="mt-12 flex flex-col items-center gap-3"
        >
          <div className="flex -space-x-2.5">
            {[
              'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop',
              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop',
              'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop',
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop',
            ].map((src, i) => (
              <img key={i} src={src} className="w-8 h-8 rounded-full border-2 border-white object-cover" alt="" />
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <div className="flex">
              {[...Array(5)].map((_, i) => <Star key={i} size={12} className="fill-amber-400 text-amber-400" />)}
            </div>
            <span><strong className="text-slate-800">4.9</strong> from 200+ early users</span>
          </div>
        </motion.div>
      </section>

      {/* ── LOGO STRIP ── */}
      <section className="border-y border-slate-100 py-8 bg-slate-50/60">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-6">Trusted by teams at</p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {logos.map(logo => (
              <span key={logo} className="text-slate-300 font-bold text-lg tracking-tight select-none">{logo}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE SANDBOX ── */}
      <section id="demo" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Try it right now</h2>
          <p className="mt-3 text-slate-500 text-base max-w-xl mx-auto">No sign-up needed. Add tasks, drag cards, and see charts update in real time.</p>
        </div>

        {/* App window frame */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="border border-slate-200 rounded-2xl overflow-hidden shadow-xl shadow-slate-100"
        >
          {/* Window chrome */}
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            {/* Tab bar */}
            <div className="flex bg-white border border-slate-200 rounded-lg p-1 gap-1">
              {(['board', 'list', 'analytics'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold capitalize cursor-pointer transition-all ${activeTab === tab ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}>
                  {tab === 'board' ? 'Kanban' : tab === 'analytics' ? 'Charts' : 'List'}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Progress</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md font-mono ${progressPct === 100 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-violet-50 text-violet-600 border border-violet-100'}`}>{progressPct}%</span>
            </div>
          </div>

          {/* Task adder bar */}
          <div className="bg-white border-b border-slate-100 px-5 py-3 flex items-center gap-4">
            <span className="text-xs font-semibold text-slate-400">SANDBOX</span>
            <form onSubmit={handleAddDemoTask} className="flex-1 max-w-sm flex gap-2">
              <input type="text" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)}
                placeholder="Add a task to this sandbox..."
                className="flex-1 text-xs px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg outline-none focus:border-violet-400 focus:bg-white transition-colors" />
              <button type="submit" className="p-2 rounded-lg bg-slate-900 hover:bg-slate-700 text-white cursor-pointer transition-colors">
                <Plus size={13} />
              </button>
            </form>
          </div>

          {/* Viewport */}
          <div className="bg-white p-6 min-h-[360px]">
            <AnimatePresence mode="wait">
              {activeTab === 'board' && (
                <motion.div key="board" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {['TODO', 'IN_PROGRESS', 'DONE'].map(col => {
                    const labels: Record<string, string> = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' };
                    const accents: Record<string, string> = { TODO: 'bg-slate-100 text-slate-600', IN_PROGRESS: 'bg-blue-100 text-blue-600', DONE: 'bg-emerald-100 text-emerald-600' };
                    return (
                      <div key={col}
                        onDragOver={e => e.preventDefault()}
                        onDragEnter={() => setDraggedOverCol(col)}
                        onDragLeave={() => setDraggedOverCol(null)}
                        onDrop={e => handleDrop(e, col)}
                        className={`rounded-xl border-2 p-3 flex flex-col gap-3 transition-all duration-150 min-h-[200px] ${draggedOverCol === col ? 'border-violet-400 bg-violet-50/30 scale-[1.01]' : 'border-slate-100 bg-slate-50/40'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${accents[col]}`}>{labels[col]}</span>
                          <span className="text-xs font-mono text-slate-400">{demoTasks.filter(t => t.status === col).length}</span>
                        </div>
                        {demoTasks.filter(t => t.status === col).map(t => (
                          <div key={t.id} draggable onDragStart={e => handleDragStart(e, t.id)} onClick={() => advanceTask(t.id)}
                            className="bg-white border border-slate-200 rounded-xl p-3 cursor-grab active:cursor-grabbing hover:border-violet-300 hover:shadow-sm hover:shadow-violet-50 transition-all group">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">{t.category}</span>
                              <span className="text-[8px] text-slate-300 group-hover:text-violet-400 font-medium transition-colors">drag or click →</span>
                            </div>
                            <p className={`text-xs font-semibold leading-snug ${t.status === 'DONE' ? 'line-through text-slate-300' : 'text-slate-700'}`}>{t.title}</p>
                          </div>
                        ))}
                        {demoTasks.filter(t => t.status === col).length === 0 && (
                          <div className="flex-1 flex items-center justify-center">
                            <span className="text-[11px] text-slate-300 border-2 border-dashed border-slate-200 rounded-xl w-full py-6 text-center">Drop tasks here</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </motion.div>
              )}

              {activeTab === 'list' && (
                <motion.div key="list" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-2">
                  {demoTasks.map(t => (
                    <div key={t.id} className="flex items-center gap-4 p-3.5 border border-slate-100 rounded-xl bg-slate-50/40 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all">
                      <input type="checkbox" checked={t.status === 'DONE'} onChange={() => toggleChecklist(t.id)} className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-400 cursor-pointer accent-violet-600" />
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm font-medium ${t.status === 'DONE' ? 'line-through text-slate-300' : 'text-slate-700'}`}>{t.title}</span>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 bg-white border border-slate-200 rounded-md shrink-0">{t.status.replace('_', ' ')}</span>
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'analytics' && (
                <motion.div key="analytics" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-slate-100 rounded-xl p-6 flex flex-col items-center justify-center gap-4 bg-slate-50/40">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Completion Rate</span>
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        <circle cx="18" cy="18" r="15" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                        <circle cx="18" cy="18" r="15" fill="none" stroke="#7c3aed" strokeWidth="3"
                          strokeDasharray="94.2" strokeDashoffset={94.2 - (progressPct / 100 * 94.2)}
                          strokeLinecap="round" className="transition-all duration-700" />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-2xl font-extrabold text-slate-900 font-mono">{progressPct}%</span>
                        <span className="text-[10px] text-slate-400 font-medium">done</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">{doneCount} of {demoTasks.length} tasks complete</p>
                  </div>

                  <div className="border border-slate-100 rounded-xl p-6 bg-slate-50/40 flex flex-col gap-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Status Breakdown</span>
                    {['TODO', 'IN_PROGRESS', 'DONE'].map(s => {
                      const n = demoTasks.filter(t => t.status === s).length;
                      const pct = Math.round((n / demoTasks.length) * 100) || 0;
                      const colors: Record<string, string> = { TODO: 'bg-slate-300', IN_PROGRESS: 'bg-blue-400', DONE: 'bg-emerald-400' };
                      return (
                        <div key={s} className="flex flex-col gap-1.5">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-500">{s.replace('_', ' ')}</span>
                            <span className="text-slate-700 font-mono">{n}</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${colors[s]}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="bg-slate-50 border-y border-slate-100 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Everything your team needs</h2>
            <p className="mt-3 text-slate-500 max-w-xl mx-auto">No cruft. No bloat. Just the features that actually make a difference.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, color, bg, title, desc }) => (
              <motion.div key={title} whileHover={{ y: -3 }}
                className="bg-white rounded-2xl p-6 border border-slate-100 hover:border-slate-200 hover:shadow-lg hover:shadow-slate-50 transition-all flex flex-col gap-4">
                <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center`}>
                  <Icon size={20} />
                </div>
                <h3 className="font-bold text-slate-900">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section id="pricing" className="py-28 max-w-3xl mx-auto px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-violet-600 mb-4">
            <Zap size={12} className="fill-violet-500" /> Free during beta
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Start shipping faster<br />today.
          </h2>
          <p className="mt-5 text-slate-500 text-lg">Set up your workspace in under 60 seconds. No credit card required.</p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to={token ? '/dashboard' : '/register'} className="flex items-center gap-2 px-8 py-4 bg-slate-900 hover:bg-slate-700 text-white font-bold rounded-2xl shadow-lg shadow-slate-200 text-base transition-all hover:scale-[1.02]">
              Create free account <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
              Already have an account →
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-100 bg-slate-50 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center text-white">
              <LayoutDashboard size={12} />
            </div>
            <span className="font-semibold text-slate-600">TaskFlow</span>
          </div>
          <p>© {new Date().getFullYear()} TaskFlow. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-700 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-700 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-700 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
