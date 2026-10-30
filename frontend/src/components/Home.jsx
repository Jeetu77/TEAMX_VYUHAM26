import { Shield, Search, Target, BarChart3, Zap, Brain, Lock, ArrowRight, GraduationCap } from 'lucide-react'
import { card, btnPrimary } from '../ui'

const MODULES = [
  {
    id: 'detection', Icon: Search, title: 'Detection',
    desc: 'Paste any suspicious email, SMS or URL and get an instant verdict — phishing, suspicious or likely safe — with the exact manipulation tactics explained.',
  },
  {
    id: 'simulation', Icon: Target, title: 'Simulation',
    desc: 'Generate a realistic training phishing email for a scenario you choose, send it to simulated employee inboxes, and record who clicked, reported or ignored it.',
  },
  {
    id: 'quiz', Icon: GraduationCap, title: 'Training Quiz',
    desc: 'Phish or legit? Work through real-world Indian scam patterns — KYC, UPI, courier and lottery scams — and learn the red flags behind each answer.',
  },
  {
    id: 'dashboard', Icon: BarChart3, title: 'Dashboard & History',
    desc: 'Track awareness scores across campaigns on a chart, export results to CSV, and review every message the team has analyzed.',
  },
]

const HOW = [
  {
    Icon: Zap, title: 'Rule engine',
    desc: 'Fast, deterministic checks catch classic red flags: urgency language, lookalike domains, raw-IP links, OTP/credential requests and even prompt-injection attempts.',
  },
  {
    Icon: Brain, title: 'AI analysis',
    desc: 'Claude reviews the full message in context, names each social-engineering tactic with evidence, and recommends a clear next step. Tuned for Indian scams: UPI, Aadhaar, KYC, IRCTC.',
  },
  {
    Icon: Lock, title: 'Safe by design',
    desc: 'Simulated emails exist only inside this app — nothing is ever sent to a real inbox. Analysis runs on your own backend with your own API key.',
  },
]

export default function Home({ onNavigate }) {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="text-center pt-6 pb-2">
        <div className="inline-flex p-4 rounded-2xl bg-blue-50 border border-blue-100 mb-5 shadow-[0_4px_16px_rgba(59,130,246,0.15)]">
          <Shield size={40} className="text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">CyberSafe</h1>
        <p className="text-slate-500 mt-3 max-w-xl mx-auto">
          An AI-powered phishing detection and security-awareness trainer.
          Spot scams before they land, and teach your team to do the same —
          without a single real email leaving the building.
        </p>
        <button onClick={() => onNavigate('detection')} className={`${btnPrimary} mt-6`}>
          Analyze a message <ArrowRight size={15} />
        </button>
      </div>

      {/* Modules */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">What you can do</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {MODULES.map(m => (
            <button key={m.id} onClick={() => onNavigate(m.id)}
              className={`${card} p-5 text-left hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ease-out group`}>
              <div className="inline-flex p-2 rounded-lg bg-blue-50 border border-blue-100 mb-3">
                <m.Icon size={18} className="text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900 flex items-center gap-1.5">
                {m.title}
                <ArrowRight size={14} className="text-blue-500 opacity-0 group-hover:opacity-100 transition" />
              </h3>
              <p className="text-sm text-slate-500 mt-1.5">{m.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">How it works</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {HOW.map(h => (
            <div key={h.title} className={`${card} p-5`}>
              <div className="flex items-center gap-2 mb-2">
                <h.Icon size={16} className="text-blue-600" />
                <h3 className="font-semibold text-slate-800">{h.title}</h3>
              </div>
              <p className="text-sm text-slate-500">{h.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Note */}
      <p className="text-xs text-slate-400/80 text-center pb-4">
        CyberSafe is a training and awareness tool. Simulation emails are generated for
        education only and never sent outside this app. Report real phishing at cybercrime.gov.in or call 1930.
      </p>
    </div>
  )
}
