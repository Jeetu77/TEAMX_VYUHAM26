import { useState, useEffect, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Download, Trash2, FileText, Loader2 } from 'lucide-react'
import { getCampaigns, getCampaign, deleteCampaign } from '../api'
import { exportCampaignPdf } from '../pdfReport'
import { card, STATUS, StatCard, SectionTitle, ErrorNote, btnGhost } from '../ui'

const scoreColor = (s) => s >= 70 ? 'text-emerald-600' : s >= 40 ? 'text-amber-600' : 'text-rose-600'

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs shadow-lg">
      <div className="font-medium text-slate-800 mb-0.5">{label}</div>
      <div className="text-slate-400">Awareness: <span className="text-blue-700 font-semibold tabular-nums">{payload[0].value}%</span></div>
    </div>
  )
}

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState([])
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')
  const [pdfBusy, setPdfBusy] = useState(false)

  const refresh = useCallback(() => {
    getCampaigns()
      .then(r => setCampaigns(r.data))
      .catch(() => setError('Could not load campaigns. Check backend is running.'))
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const open = async (id) => {
    try {
      const r = await getCampaign(id)
      setSelected(r.data)
    } catch {
      setError('Could not load campaign.')
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this campaign and its results?')) return
    try {
      await deleteCampaign(id)
      if (selected?.campaign.id === id) setSelected(null)
      refresh()
    } catch {
      setError('Could not delete campaign.')
    }
  }

  const exportCsv = () => {
    if (!selected) return
    const rows = [['campaign', 'employee', 'status', 'updated_at']]
    selected.targets.forEach(t =>
      rows.push([selected.campaign.name, t.employee_name, t.status, t.updated_at || '']))
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: 'cybersafe-campaign.csv' })
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportPdf = async () => {
    if (!selected) return
    setPdfBusy(true); setError('')
    try {
      await exportCampaignPdf(selected)
    } catch {
      setError('Could not create the PDF report.')
    }
    setPdfBusy(false)
  }

  const chartData = [...campaigns].reverse().map(c => ({
    name: c.name.length > 18 ? c.name.slice(0, 17) + '…' : c.name,
    awareness: c.awareness_score,
  }))

  return (
    <div className="space-y-6">
      <SectionTitle title="Awareness Dashboard" subtitle="Results across all simulation campaigns" />
      <ErrorNote>{error}</ErrorNote>

      {!error && campaigns.length === 0 && (
        <div className={`${card} p-8 text-center text-sm text-slate-400`}>
          No campaigns yet. Run a simulation first.
        </div>
      )}

      {/* Awareness by campaign */}
      {chartData.length > 0 && (
        <div className={`${card} p-5`}>
          <h3 className="font-semibold text-slate-800 mb-1">Awareness score by campaign</h3>
          <p className="text-xs text-slate-500 mb-4">% of targets who reported (full credit) or ignored (half credit) the simulated phish</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }} barCategoryGap="35%">
              <CartesianGrid vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(37,99,235,0.06)' }} />
              <Bar dataKey="awareness" radius={[4, 4, 0, 0]} maxBarSize={48}>
                {chartData.map((_, i) => <Cell key={i} fill="#2563eb" />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Campaign list */}
      {campaigns.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-3">
          {campaigns.map(c => (
            <div key={c.id}
              className={`${card} p-4 cursor-pointer transition hover:border-slate-300
                ${selected?.campaign.id === c.id ? 'border-blue-400' : ''}`}
              onClick={() => open(c.id)}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium text-slate-800">{c.name}</div>
                  <div className="text-xs text-slate-500 mt-1">{c.created_at?.slice(0,16).replace('T', ' ')}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-lg font-semibold tabular-nums ${scoreColor(c.awareness_score)}`}>{c.awareness_score}%</div>
                  <div className="text-[10px] text-slate-400">awareness</div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="text-xs text-slate-500">
                  {c.total} targets · <span className="text-rose-600">{c.clicked || 0} clicked</span> · <span className="text-emerald-600">{c.reported || 0} reported</span>
                </div>
                <button onClick={e => { e.stopPropagation(); remove(c.id) }}
                  className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition" title="Delete campaign">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected campaign detail */}
      {selected && (
        <div className={`${card} p-6 space-y-4`}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="font-semibold text-lg text-slate-900">{selected.campaign.name}</h3>
            <div className="flex gap-2">
              <button onClick={exportCsv} className={btnGhost}>
                <Download size={13} /> Export CSV
              </button>
              <button onClick={exportPdf} disabled={pdfBusy} className={btnGhost}>
                {pdfBusy ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
                Export PDF
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total sent" value={selected.stats.total} />
            <StatCard label="Clicked" value={selected.stats.clicked} accent="text-rose-600" />
            <StatCard label="Reported" value={selected.stats.reported} accent="text-emerald-600" />
            <StatCard label="Awareness score" value={`${selected.stats.awareness_score}%`}
              accent={scoreColor(selected.stats.awareness_score)} />
          </div>
          <div>
            {selected.targets.map(t => {
              const s = STATUS[t.status]
              return (
                <div key={t.id} className="flex justify-between items-center text-sm border-b border-slate-200 py-2.5 last:border-0">
                  <span className="text-slate-700">{t.employee_name}</span>
                  <span className={`flex items-center gap-1.5 ${s.color}`}>
                    <s.Icon size={13} /> {s.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
