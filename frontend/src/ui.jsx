// Shared UI primitives + status/verdict styling, used across all screens.
import { ShieldAlert, ShieldQuestion, ShieldCheck, MousePointerClick, Flag, Eye, Mail } from 'lucide-react'

export const card = 'bg-white/90 backdrop-blur-xl border border-white/60 rounded-xl shadow-[0_8px_30px_rgba(2,12,27,0.35)]'

export const VERDICT = {
  phishing:    { label: 'Phishing',    Icon: ShieldAlert,    text: 'text-rose-600',    chip: 'bg-rose-50 text-rose-700 border-rose-200',       bar: 'bg-rose-500' },
  suspicious:  { label: 'Suspicious',  Icon: ShieldQuestion, text: 'text-amber-600',   chip: 'bg-amber-50 text-amber-700 border-amber-200',     bar: 'bg-amber-500' },
  likely_safe: { label: 'Likely safe', Icon: ShieldCheck,    text: 'text-emerald-600', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', bar: 'bg-emerald-500' },
}

export const STATUS = {
  clicked:  { label: 'Clicked',  Icon: MousePointerClick, color: 'text-rose-600' },
  reported: { label: 'Reported', Icon: Flag,              color: 'text-emerald-600' },
  ignored:  { label: 'Ignored',  Icon: Eye,               color: 'text-amber-600' },
  unread:   { label: 'Unread',   Icon: Mail,              color: 'text-slate-400' },
}

export function Chip({ verdict }) {
  const v = VERDICT[verdict]
  if (!v) return null
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${v.chip}`}>
      <v.Icon size={13} /> {v.label}
    </span>
  )
}

export function StatCard({ label, value, accent = 'text-slate-900', sub }) {
  return (
    <div className={`${card} p-4`}>
      <div className={`text-2xl font-semibold tabular-nums ${accent}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  )
}

export function SectionTitle({ title, subtitle }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-white drop-shadow-sm">{title}</h2>
      {subtitle && <p className="text-sm text-slate-300 mt-1">{subtitle}</p>}
    </div>
  )
}

export function ErrorNote({ children }) {
  if (!children) return null
  return <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{children}</div>
}

export const inputCls = 'w-full mt-1.5 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200'
export const btnPrimary = 'inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:pointer-events-none rounded-lg text-sm font-semibold text-white transition'
export const btnGhost = 'inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-600 transition'
