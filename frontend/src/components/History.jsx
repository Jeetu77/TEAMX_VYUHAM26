import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { getAnalyses, getAnalysisStats } from '../api'
import { card, Chip, StatCard, SectionTitle, ErrorNote } from '../ui'

export default function HistoryView() {
  const [items, setItems] = useState([])
  const [stats, setStats] = useState(null)
  const [openId, setOpenId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getAnalyses(), getAnalysisStats()])
      .then(([a, s]) => { setItems(a.data); setStats(s.data) })
      .catch(() => setError('Could not load history. Check backend is running.'))
  }, [])

  return (
    <div className="space-y-6">
      <SectionTitle title="Analysis History" subtitle="Every message checked in the Detection tab" />
      <ErrorNote>{error}</ErrorNote>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total analyzed" value={stats.total} />
          <StatCard label="Phishing" value={stats.by_verdict.phishing || 0} accent="text-rose-600" />
          <StatCard label="Suspicious" value={stats.by_verdict.suspicious || 0} accent="text-amber-600" />
          <StatCard label="Likely safe" value={stats.by_verdict.likely_safe || 0} accent="text-emerald-600" />
        </div>
      )}

      {!error && items.length === 0 && (
        <div className={`${card} p-8 text-center text-sm text-slate-400`}>
          Nothing analyzed yet. Try the Detection tab.
        </div>
      )}

      <div className="space-y-2">
        {items.map(a => {
          const open = openId === a.id
          return (
            <div key={a.id} className={`${card} overflow-hidden`}>
              <button onClick={() => setOpenId(open ? null : a.id)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition">
                <Chip verdict={a.verdict} />
                <span className="flex-1 text-sm text-slate-400 truncate">{a.input_text}</span>
                <span className="text-xs text-slate-400 shrink-0 hidden sm:block">
                  {a.created_at?.slice(0, 16).replace('T', ' ')}
                </span>
                <span className="text-sm font-semibold tabular-nums text-slate-700 shrink-0">{a.confidence}%</span>
                {open ? <ChevronUp size={15} className="text-slate-500 shrink-0" /> : <ChevronDown size={15} className="text-slate-500 shrink-0" />}
              </button>
              {open && (
                <div className="px-4 pb-4 space-y-3 border-t border-slate-200 pt-3">
                  <pre className="text-xs text-slate-400 whitespace-pre-wrap font-sans bg-slate-50 rounded-lg p-3 border border-slate-200">{a.input_text}</pre>
                  {a.tactics?.length > 0 && (
                    <div className="space-y-2">
                      {a.tactics.map((t, i) => (
                        <div key={i} className="border-l-2 border-amber-400 pl-3">
                          <span className="text-sm font-medium text-amber-700">{t.tactic}</span>
                          <span className="text-sm text-slate-400"> — {t.explanation}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
