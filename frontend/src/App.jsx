import { useState, useEffect } from 'react'
import { Shield, Search, Target, BarChart3, History, Home as HomeIcon, GraduationCap, Phone } from 'lucide-react'
import Home from './components/Home'
import Quiz from './components/Quiz'
import Detection from './components/Detection'
import Simulation from './components/Simulation'
import Dashboard from './components/Dashboard'
import HistoryView from './components/History'
import { getHealth } from './api'

const NAV = [
  { id: 'home',       label: 'Home',       Icon: HomeIcon,      view: Home,        group: 'Overview' },
  { id: 'detection',  label: 'Detection',  Icon: Search,        view: Detection,   group: 'Protect' },
  { id: 'simulation', label: 'Simulation', Icon: Target,        view: Simulation,  group: 'Train' },
  { id: 'quiz',       label: 'Quiz',       Icon: GraduationCap, view: Quiz,        group: 'Train' },
  { id: 'dashboard',  label: 'Dashboard',  Icon: BarChart3,     view: Dashboard,   group: 'Insights' },
  { id: 'history',    label: 'History',    Icon: History,       view: HistoryView, group: 'Insights' },
]
const GROUPS = [...new Set(NAV.map(n => n.group))]

// What the status card says for each backend state
const STATUS = {
  checking: { dot: 'bg-slate-400',   label: 'Checking…',        sub: 'Connecting to backend' },
  live:     { dot: 'bg-emerald-400', label: 'AI protection on', sub: 'Rules, link checks and AI' },
  rules:    { dot: 'bg-amber-400',   label: 'Rules-only mode',  sub: 'AI is switched off' },
  offline:  { dot: 'bg-rose-400',    label: 'Backend offline',  sub: 'Start the API server' },
}

function NavButton({ item, active, onClick, compact }) {
  const { label, Icon } = item
  return (
    <button onClick={onClick} aria-current={active ? 'page' : undefined}
      className={`group relative flex items-center gap-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ease-out
        ${compact ? 'px-3 py-2' : 'w-full px-3 py-2.5'}
        ${active
          ? 'bg-white/[0.12] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
          : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'}`}>
      {!compact && (
        <span className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full transition-all duration-200
          ${active ? 'bg-emerald-400 opacity-100' : 'opacity-0'}`} />
      )}
      <span className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-200
        ${active ? 'bg-gradient-to-br from-blue-500 to-emerald-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.35)]'
                 : 'bg-white/[0.05] text-slate-300 group-hover:text-white group-hover:bg-white/[0.1]'}`}>
        <Icon size={16} />
      </span>
      {label}
    </button>
  )
}

export default function App() {
  const [tab, setTab] = useState('home')
  const [status, setStatus] = useState('checking')
  const Active = NAV.find(n => n.id === tab).view

  useEffect(() => {
    const check = () => getHealth()
      .then(r => setStatus(r.data.mock_ai ? 'rules' : 'live'))
      .catch(() => setStatus('offline'))
    check()
    const id = setInterval(check, 30000)
    return () => clearInterval(id)
  }, [])

  const s = STATUS[status]

  return (
    <div className="relative min-h-screen text-slate-700 md:flex">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/bg-kerala.svg')" }} />
        <div className="absolute inset-0 bg-white/60" />
      </div>

      {/* Sidebar (desktop) / top bar (mobile) */}
      <aside className="z-20 shrink-0 bg-gradient-to-b from-[#0F2147] via-[#13295A] to-[#1E3A8A] text-white
        shadow-[4px_0_24px_rgba(15,33,71,0.25)]
        sticky top-0 md:h-screen md:w-64 flex md:flex-col">

        {/* Brand */}
        <div className="flex items-center gap-3 px-4 md:px-5 py-3 md:pt-6 md:pb-5 shrink-0">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 shadow-[0_6px_18px_rgba(16,185,129,0.35)]">
            <Shield size={20} className="text-white" strokeWidth={2.25} />
          </div>
          <div className="leading-tight">
            <div className="text-[17px] font-bold tracking-tight">CyberSafe</div>
            <div className="hidden md:block text-[10px] font-semibold tracking-[0.16em] uppercase text-emerald-300/90">Cyber Safe Keralam</div>
          </div>
        </div>
        <div className="hidden md:block mx-5 h-px bg-gradient-to-r from-white/0 via-white/15 to-white/0" />

        {/* Desktop: grouped nav */}
        <nav className="hidden md:flex flex-col gap-5 px-3 pt-5 flex-1 overflow-y-auto" aria-label="Main">
          {GROUPS.map(g => (
            <div key={g}>
              <div className="px-3 mb-1.5 text-[10px] font-semibold tracking-[0.18em] uppercase text-slate-400">{g}</div>
              <div className="flex flex-col gap-1">
                {NAV.filter(n => n.group === g).map(item => (
                  <NavButton key={item.id} item={item} active={tab === item.id} onClick={() => setTab(item.id)} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Mobile: one scrollable row */}
        <nav className="md:hidden flex items-center gap-1 overflow-x-auto px-2 py-2 flex-1" aria-label="Main">
          {NAV.map(item => (
            <NavButton key={item.id} item={item} active={tab === item.id} onClick={() => setTab(item.id)} compact />
          ))}
        </nav>

        {/* Footer cards (desktop) */}
        <div className="hidden md:flex flex-col gap-2.5 p-4 shrink-0">
          <div className="rounded-xl bg-white/[0.06] border border-white/10 px-3.5 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <span className="relative flex w-2 h-2">
                {status === 'live' && <span className={`absolute inset-0 rounded-full ${s.dot} opacity-75 animate-ping`} />}
                <span className={`relative w-2 h-2 rounded-full ${s.dot}`} />
              </span>
              {s.label}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 pl-4">{s.sub}</div>
          </div>
          <a href="tel:1930"
            className="flex items-center gap-2.5 rounded-xl bg-emerald-500/10 border border-emerald-400/20 px-3.5 py-3 hover:bg-emerald-500/20 transition-colors">
            <Phone size={14} className="text-emerald-300 shrink-0" />
            <div className="leading-tight">
              <div className="text-xs font-semibold text-white">Cyber fraud helpline</div>
              <div className="text-[11px] text-emerald-200/80">Call 1930 · cybercrime.gov.in</div>
            </div>
          </a>
          <p className="text-[10px] text-slate-500 px-1 pt-1">Training tool. Simulated emails never leave this app.</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        <div key={tab} className="max-w-5xl mx-auto px-5 py-6 md:py-8 animate-fade-in">
          <Active onNavigate={setTab} />
        </div>
      </main>
    </div>
  )
}
