import { useState } from 'react'
import { Shield, Search, Target, BarChart3, History, Home as HomeIcon, GraduationCap } from 'lucide-react'
import Home from './components/Home'
import Quiz from './components/Quiz'
import Detection from './components/Detection'
import Simulation from './components/Simulation'
import Dashboard from './components/Dashboard'
import HistoryView from './components/History'

const NAV = [
  { id: 'home',       label: 'Home',       Icon: HomeIcon,  view: Home },
  { id: 'detection',  label: 'Detection',  Icon: Search,    view: Detection },
  { id: 'simulation', label: 'Simulation', Icon: Target,    view: Simulation },
  { id: 'quiz',       label: 'Quiz',       Icon: GraduationCap, view: Quiz },
  { id: 'dashboard',  label: 'Dashboard',  Icon: BarChart3, view: Dashboard },
  { id: 'history',    label: 'History',    Icon: History,   view: HistoryView },
]

export default function App() {
  const [tab, setTab] = useState('home')
  const Active = NAV.find(n => n.id === tab).view
  return (
    <div className="relative min-h-screen text-slate-700 md:flex">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{ backgroundImage: "url('/bg-security.webp')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#040b18]/95 via-[#061325]/90 to-[#0a1a33]/95" />
        <div className="absolute inset-0 bg-slate-50/[0.04]" />
      </div>

      {/* Sidebar */}
      <aside className="md:w-60 md:min-h-screen border-b md:border-b-0 md:border-r border-white/10 bg-white/[0.06] backdrop-blur-xl px-4 py-4 md:py-6 flex md:flex-col items-center md:items-stretch gap-4 md:gap-8 shadow-[0_0_40px_rgba(0,0,0,0.35)]">
        <div className="flex items-center gap-2.5 px-1">
          <div className="p-1.5 rounded-lg bg-blue-500/15 border border-blue-400/30 shadow-[0_0_14px_rgba(59,130,246,0.35)]">
            <Shield size={18} className="text-blue-300" />
          </div>
          <div className="leading-tight">
            <div className="font-semibold text-white tracking-tight">CyberSafe</div>
            <div className="hidden md:block text-[10px] text-blue-200/60 tracking-wide uppercase">Phishing awareness</div>
          </div>
        </div>
        <nav className="flex md:flex-col gap-1 flex-1 overflow-x-auto">
          {NAV.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition
                ${tab === id
                  ? 'bg-blue-500/20 text-blue-100 border border-blue-400/40 shadow-[0_0_12px_rgba(59,130,246,0.25)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/10 border border-transparent'}`}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>
        <div className="hidden md:block text-[11px] text-slate-400 px-1">
          Training tool — simulated emails never leave this app.
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        <div className="max-w-5xl mx-auto px-5 py-6 md:py-8">
          <Active onNavigate={setTab} />
        </div>
      </main>
    </div>
  )
}
