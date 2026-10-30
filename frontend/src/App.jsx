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
    <div className="relative min-h-screen text-slate-700 md:flex bg-slate-50">
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-50 via-white to-blue-50/40" />

      {/* Sidebar */}
      <aside className="md:w-60 md:min-h-screen border-b md:border-b-0 md:border-r border-slate-200/80 bg-white/90 backdrop-blur-xl px-4 py-4 md:py-6 flex md:flex-col items-center md:items-stretch gap-4 md:gap-8 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-2.5 px-1">
          <div className="p-1.5 rounded-lg bg-blue-50 border border-blue-100 shadow-[0_2px_8px_rgba(59,130,246,0.12)]">
            <Shield size={18} className="text-blue-600" />
          </div>
          <div className="leading-tight">
            <div className="font-semibold text-slate-900 tracking-tight">CyberSafe</div>
            <div className="hidden md:block text-[10px] text-slate-400 tracking-wide uppercase">Phishing awareness</div>
          </div>
        </div>
        <nav className="flex md:flex-col gap-1 flex-1 overflow-x-auto">
          {NAV.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ease-out
                ${tab === id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-[0_1px_4px_rgba(59,130,246,0.12)]'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent'}`}>
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
        <div key={tab} className="max-w-5xl mx-auto px-5 py-6 md:py-8 animate-fade-in">
          <Active onNavigate={setTab} />
        </div>
      </main>
    </div>
  )
}
