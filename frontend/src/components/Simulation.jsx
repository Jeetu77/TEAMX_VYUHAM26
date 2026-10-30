import { useState, useEffect } from 'react'
import { Rocket, MailWarning, ArrowLeft, Flag as FlagIcon, Play, X, Inbox,
         ShieldAlert, ShieldCheck, Trash2, Loader2 } from 'lucide-react'
import { createCampaign, getCampaign, recordAction, getFeedback, autoSimulate } from '../api'
import { card, STATUS, StatCard, SectionTitle, ErrorNote, inputCls, btnPrimary, btnGhost } from '../ui'

const DEFAULT_EMPLOYEES = ['Rahul Sharma', 'Priya Nair', 'Arjun Menon', 'Sneha Pillai', 'Kiran Das']
const SCENARIOS = [
  'Fake KYC update from SBI bank',
  'IRCTC ticket refund',
  'UPI cashback offer',
  'HR payroll portal update',
  'Courier delivery failed',
]
const errMsg = (e) => e.response?.data?.detail || 'Request failed. Check backend is running.'

const findUrl = (text) => text?.match(/https?:\/\/[^\s)\]]+/)?.[0]

/* ---------- Realistic inbox simulator (modal) ---------- */

function EmailBody({ body, onClickLink }) {
  const url = findUrl(body)
  if (!url) return <p className="text-sm text-slate-700 whitespace-pre-wrap">{body}</p>
  const [before, ...rest] = body.split(url)
  return (
    <div className="text-sm text-slate-700 whitespace-pre-wrap">
      {before}
      <span className="relative group inline">
        <button onClick={onClickLink}
          className="text-blue-600 underline decoration-blue-300 hover:decoration-blue-600 break-all">
          {url}
        </button>
        <span className="pointer-events-none absolute left-0 -bottom-7 z-10 hidden group-hover:block
          bg-slate-800 text-slate-100 text-[11px] px-2 py-1 rounded whitespace-nowrap shadow-lg">
          Goes to: {url}
        </span>
      </span>
      {rest.join(url)}
    </div>
  )
}

function ResultPanel({ kind, redFlags, feedback, loadingFeedback }) {
  const cfg = {
    clicked: {
      Icon: ShieldAlert, tone: 'bg-rose-50 border-rose-200 text-rose-700',
      title: 'You clicked a phishing link!',
      sub: 'In a real attack, this page would now be stealing your credentials or card details.',
    },
    reported: {
      Icon: ShieldCheck, tone: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      title: 'Correct — this was a phishing email',
      sub: 'Reporting is exactly the right move. The security team can now warn everyone else.',
    },
    ignored: {
      Icon: Trash2, tone: 'bg-amber-50 border-amber-200 text-amber-700',
      title: 'Deleted without reporting',
      sub: "You didn't fall for it, but reporting it would have protected your colleagues too.",
    },
  }[kind]
  if (!cfg) return null
  return (
    <div className="space-y-4">
      <div className={`border rounded-xl p-5 ${cfg.tone}`}>
        <div className="flex items-center gap-2.5 font-semibold text-base">
          <cfg.Icon size={22} /> {cfg.title}
        </div>
        <p className="text-sm mt-1.5 opacity-90">{cfg.sub}</p>
      </div>
      {redFlags?.length > 0 && (
        <div className={`${card} p-4`}>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mb-2">
            <FlagIcon size={12} /> The red flags you should look for
          </div>
          {redFlags.map((f, i) => (
            <div key={i} className="text-sm text-slate-700 pl-1 py-0.5">• {f}</div>
          ))}
        </div>
      )}
      <div className={`${card} p-4 bg-blue-50/50 border-blue-200`}>
        <div className="text-xs text-blue-700 font-semibold mb-1.5">Coach feedback</div>
        {loadingFeedback
          ? <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 size={14} className="animate-spin" /> Writing feedback…</div>
          : <p className="text-sm text-slate-700">{feedback}</p>}
      </div>
    </div>
  )
}

function InboxModal({ target, email, campaignId, onAction, onClose }) {
  // 'list' -> 'email' -> result ('clicked' | 'reported' | 'ignored')
  const [view, setView] = useState(target.status === 'unread' ? 'list' : target.status)
  const [feedback, setFeedback] = useState('')
  const [loadingFeedback, setLoadingFeedback] = useState(target.status !== 'unread')

  // Feedback for an already-acted target opened again
  useEffect(() => {
    if (target.status !== 'unread') fetchFeedback()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchFeedback() {
    setLoadingFeedback(true)
    try {
      const res = await getFeedback(campaignId, target.id)
      setFeedback(res.data.feedback)
    } catch (e) {
      setFeedback(errMsg(e))
    }
    setLoadingFeedback(false)
  }

  const act = async (action) => {
    setView(action)
    await onAction(target.id, action)
    fetchFeedback()
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}>
        {/* Window chrome */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Inbox size={15} className="text-blue-600" /> Inbox — {target.employee_name}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          {view === 'list' && (
            <button onClick={() => setView('email')}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition text-left">
              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold shrink-0">
                {email.sender_display?.[0] || '?'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold text-slate-900 text-sm truncate">{email.sender_display}</span>
                  <span className="text-[11px] text-slate-400 shrink-0">9:14 AM</span>
                </div>
                <div className="font-medium text-sm text-slate-800 truncate">{email.subject}</div>
                <div className="text-xs text-slate-400 truncate">{email.body?.slice(0, 90)}</div>
              </div>
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" title="Unread" />
            </button>
          )}

          {view === 'email' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{email.subject}</h3>
                <div className="flex items-center gap-2.5 mt-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
                    {email.sender_display?.[0] || '?'}
                  </div>
                  <div className="text-xs">
                    <div className="font-medium text-slate-800">{email.sender_display}</div>
                    <div className="text-slate-400">&lt;{email.sender_email}&gt; · to me</div>
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-200 pt-4">
                <EmailBody body={email.body} onClickLink={() => act('clicked')} />
              </div>
              <div className="border-t border-slate-200 pt-3 flex gap-2 flex-wrap">
                <button onClick={() => act('reported')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition">
                  <FlagIcon size={13} /> Report phishing
                </button>
                <button onClick={() => act('ignored')}
                  className={btnGhost}>
                  <Trash2 size={13} /> Delete
                </button>
                <span className="ml-auto text-[11px] text-slate-400 self-center">
                  Tip: hover the link before deciding
                </span>
              </div>
            </div>
          )}

          {['clicked', 'reported', 'ignored'].includes(view) && (
            <ResultPanel kind={view} redFlags={email.red_flags}
              feedback={feedback} loadingFeedback={loadingFeedback} />
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------- Main screen ---------- */

export default function Simulation() {
  const [form, setForm] = useState({
    name: 'Q4 Security Test',
    scenario: SCENARIOS[0],
    difficulty: 'medium',
    employees: DEFAULT_EMPLOYEES.join('\n'),
  })
  const [campaign, setCampaign] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [autoRunning, setAutoRunning] = useState(false)
  const [error, setError] = useState('')
  const [openTarget, setOpenTarget] = useState(null)

  const refresh = async (id) => {
    const det = await getCampaign(id)
    setDetail(det.data)
    return det.data
  }

  const launch = async () => {
    setLoading(true); setError('')
    try {
      const employees = form.employees.split('\n').map(s => s.trim()).filter(Boolean)
      const res = await createCampaign({ ...form, employees })
      setCampaign(res.data)
      await refresh(res.data.campaign_id)
    } catch (e) {
      setError(errMsg(e))
    }
    setLoading(false)
  }

  const act = async (target_id, action) => {
    try {
      await recordAction(target_id, action)
      await refresh(detail.campaign.id)
    } catch (e) {
      setError(errMsg(e))
    }
  }

  const runAuto = async () => {
    setAutoRunning(true); setError('')
    try {
      await autoSimulate(detail.campaign.id, form.difficulty)
      await refresh(detail.campaign.id)
    } catch (e) {
      setError(errMsg(e))
    }
    setAutoRunning(false)
  }

  const unreadCount = detail?.targets?.filter(t => t.status === 'unread').length || 0

  return (
    <div className="space-y-6">
      <SectionTitle title="Simulation Mode"
        subtitle="Run controlled phishing simulations and measure team awareness" />

      <ErrorNote>{error}</ErrorNote>

      {!detail ? (
        <div className={`${card} p-6 space-y-4 max-w-2xl`}>
          <div>
            <label className="text-sm text-slate-500">Campaign name</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputCls} />
          </div>
          <div>
            <label className="text-sm text-slate-500">Phishing scenario</label>
            <input value={form.scenario} onChange={e => setForm({...form, scenario: e.target.value})} className={inputCls} />
            <div className="flex gap-1.5 flex-wrap mt-2">
              {SCENARIOS.map(s => (
                <button key={s} onClick={() => setForm({...form, scenario: s})}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition
                    ${form.scenario === s ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-slate-300 text-slate-500 hover:border-blue-300'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-500">Difficulty</label>
            <select value={form.difficulty} onChange={e => setForm({...form, difficulty: e.target.value})} className={inputCls}>
              <option value="easy">Easy — obvious red flags</option>
              <option value="medium">Medium — realistic</option>
              <option value="hard">Hard — very convincing</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-500">Target employees (one per line)</label>
            <textarea value={form.employees}
              onChange={e => setForm({...form, employees: e.target.value})}
              className={`${inputCls} h-28 resize-none`} />
          </div>
          <button onClick={launch} disabled={loading} className={btnPrimary}>
            <Rocket size={15} /> {loading ? 'Generating campaign…' : 'Launch campaign'}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Generated email (trainer view) */}
          {campaign?.email && (
            <div className={`${card} p-5 border-amber-200`}>
              <h3 className="flex items-center gap-2 text-amber-700 font-semibold mb-3">
                <MailWarning size={16} /> Generated phishing email <span className="text-xs font-normal text-slate-400">(trainer view)</span>
              </h3>
              <div className="text-xs text-slate-500 space-y-1 mb-3">
                <div><b className="text-slate-600">Subject:</b> {campaign.email.subject}</div>
                <div><b className="text-slate-600">From:</b> {campaign.email.sender_display} &lt;{campaign.email.sender_email}&gt;</div>
              </div>
              <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans bg-slate-50 rounded-lg p-4 border border-slate-200">{campaign.email.body}</pre>
              <div className="mt-3 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                  <FlagIcon size={12} /> Red flags (trainer view)
                </div>
                {campaign.email.red_flags?.map((f,i) => (
                  <div key={i} className="text-xs text-rose-600 pl-4">• {f}</div>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          {detail?.stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Targets" value={detail.stats.total} />
              <StatCard label="Clicked" value={detail.stats.clicked} accent="text-rose-600" />
              <StatCard label="Reported" value={detail.stats.reported} accent="text-emerald-600" />
              <StatCard label="Awareness" value={`${detail.stats.awareness_score}%`} accent="text-blue-600" />
            </div>
          )}

          {/* Employee inboxes */}
          <div className={`${card} p-5`}>
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <h3 className="font-semibold text-slate-800">Employee inboxes <span className="text-slate-400 font-normal">(simulated)</span></h3>
              {unreadCount > 0 && (
                <button onClick={runAuto} disabled={autoRunning} className={btnGhost}>
                  {autoRunning ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                  Auto-simulate remaining ({unreadCount})
                </button>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {detail?.targets?.map(t => {
                const s = STATUS[t.status]
                return (
                  <button key={t.id} onClick={() => setOpenTarget(t)}
                    className="flex items-center justify-between gap-2 border border-slate-200 rounded-lg p-3 bg-white hover:border-blue-300 hover:bg-blue-50/30 transition text-left">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0">
                        {t.employee_name.split(' ').map(w => w[0]).slice(0,2).join('')}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm text-slate-800 truncate">{t.employee_name}</div>
                        <div className="text-[11px] text-slate-400">Open inbox</div>
                      </div>
                    </div>
                    <span className={`flex items-center gap-1 text-xs font-medium shrink-0 ${s.color}`}>
                      <s.Icon size={13} /> {s.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <button onClick={() => { setDetail(null); setCampaign(null); setError('') }}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition">
            <ArrowLeft size={14} /> New campaign
          </button>
        </div>
      )}

      {openTarget && campaign?.email && (
        <InboxModal
          key={openTarget.id}
          target={detail.targets.find(t => t.id === openTarget.id) || openTarget}
          email={campaign.email}
          campaignId={detail.campaign.id}
          onAction={act}
          onClose={() => setOpenTarget(null)}
        />
      )}
    </div>
  )
}
