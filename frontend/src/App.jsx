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
    <div className="min-h-screen bg-slate-50 text-slate-700 md:flex">
      {/* Sidebar */}
      <aside className="md:w-56 md:min-h-screen border-b md:border-b-0 md:border-r border-slate-200 bg-white px-4 py-4 md:py-6 flex md:flex-col items-center md:items-stretch gap-4 md:gap-8">
        <div className="flex items-center gap-2.5 px-1">
          <div className="p-1.5 rounded-lg bg-blue-50 border border-blue-200">
            <Shield size={18} className="text-blue-600" />
          </div>
          <div className="leading-tight">
            <div className="font-semibold text-slate-900">PhishGuard</div>
            <div className="hidden md:block text-[10px] text-slate-400 tracking-wide uppercase">Phishing awareness</div>
          </div>
        </div>
        <nav className="flex md:flex-col gap-1 flex-1 overflow-x-auto">
          {NAV.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition
                ${tab === id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
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
        <div className="max-w-5xl mx-auto px-5 py-6 md:py-8">
          <Active onNavigate={setTab} />
        </div>
      </main>
    </div>
  )
}
