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
  'Income tax refund',
  'Electricity bill disconnection',
  'Aadhaar suspension alert',
  'Lottery / lucky draw win',
  'CEO urgent gift card request',
  'WhatsApp part-time job offer',
  'Credit card reward points expiry',
  'KSEB electricity bill threat',
  'Fake MVD e-challan',
  'Customs parcel call',
  'Loan-app harassment',
]
const errMsg = (e) => e.response?.data?.detail || 'Request failed. Check backend is running.'

const findUrl = (text) => text?.match(/https?:\/\/[^\s)\]]+/)?.[0]

/* ---------- Realistic inbox simulator (modal) ---------- */

const OTHER_MAILS = [
  { id: 'o1', from: 'Anita (Finance)', time: '8:02 AM',
    subject: 'Reminder: submit Q4 expense reports by Friday',
    body: 'Hi all,\n\nA quick reminder to submit your Q4 expense reports through the usual finance form by Friday evening. Ping me if you need help with a receipt.\n\nThanks,\nAnita' },
  { id: 'o2', from: 'Office Admin', time: 'Yesterday',
    subject: 'Parking pass renewal - Basement B2',
    body: 'Hello,\n\nParking passes for Basement B2 are due for renewal this month. Please visit the admin desk on the ground floor with your old pass.\n\nOffice Admin' },
  { id: 'o3', from: 'Rohit Verma', time: 'Yesterday',
    subject: 'Notes from Monday standup',
    body: 'Team,\n\nNotes from standup:\n- Release candidate goes out Thursday\n- Please close your open review requests\n- Retro moved to 4 PM\n\nRohit' },
  { id: 'o4', from: 'Facilities', time: 'Mon',
    subject: 'Scheduled power maintenance - Saturday 10 PM',
    body: 'Hi everyone,\n\nThe building will have scheduled power maintenance on Saturday from 10 PM to 2 AM. Please shut down desktops before leaving on Friday.\n\nFacilities Team' },
]

const senderColor = (s = '') =>
  `hsl(${[...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7)} 55% 38%)`

function EmailBody({ body, linkText, firstName, onClickLink, onHover }) {
  const text = body.replaceAll('{name}', firstName)
  const url = findUrl(text)
  if (!url) return <p className="text-sm text-slate-700 whitespace-pre-wrap">{text}</p>
  const [before, ...rest] = text.split(url)
  return (
    <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
      {before}
      <button onClick={onClickLink}
        onMouseEnter={() => onHover(url)} onMouseLeave={() => onHover('')}
        onFocus={() => onHover(url)} onBlur={() => onHover('')}
        className="inline-block my-1 px-5 py-2.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition">
        {linkText || url}
      </button>
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
  const acted = ['clicked', 'reported', 'ignored'].includes(target.status)
  const [view, setView] = useState(acted ? target.status : 'list')
  const [otherMail, setOtherMail] = useState(null)
  const [hoverUrl, setHoverUrl] = useState('')
  const [read, setRead] = useState(target.status !== 'unread')
  const firstName = target.employee_name.split(' ')[0]
  const [feedback, setFeedback] = useState('')
  const [loadingFeedback, setLoadingFeedback] = useState(acted)

  // Feedback for an already-acted target opened again
  useEffect(() => {
    if (acted) fetchFeedback()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openPhish = () => {
    setView('email')
    if (!read) {
      setRead(true)
      onAction(target.id, 'opened')
    }
  }

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
    setHoverUrl('')
    await onAction(target.id, action)
    fetchFeedback()
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}>
        {hoverUrl && (
          <div className="absolute left-0 bottom-0 z-20 max-w-full truncate bg-slate-100 border-t border-r border-slate-300 text-slate-700 text-[11px] px-2.5 py-1 rounded-tr-md">
            {hoverUrl}
          </div>
        )}
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
          {view === 'list' && !otherMail && (
            <div className="-m-1 divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {[OTHER_MAILS[0], 'phish', ...OTHER_MAILS.slice(1)].map(m => m === 'phish' ? (
                <button key="phish" onClick={openPhish}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 transition text-left ${read ? 'hover:bg-slate-50' : 'bg-blue-50/40 hover:bg-blue-50'}`}>
                  <div className="w-9 h-9 rounded-full text-white flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ background: senderColor(email.sender_display) }}>
                    {email.sender_display?.[0] || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={`text-sm truncate ${read ? 'text-slate-700' : 'font-bold text-slate-900'}`}>{email.sender_display}</span>
                      <span className={`text-[11px] shrink-0 ${read ? 'text-slate-400' : 'text-slate-500 font-semibold'}`}>9:14 AM</span>
                    </div>
                    <div className={`text-sm truncate ${read ? 'text-slate-600' : 'font-semibold text-slate-800'}`}>{email.subject}</div>
                    <div className="text-xs text-slate-400 truncate">{email.body?.replaceAll('{name}', firstName).slice(0, 90)}</div>
                  </div>
                  {!read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" title="Unread" />}
                </button>
              ) : (
                <button key={m.id} onClick={() => setOtherMail(m)}
                  className="w-full flex items-center gap-3 px-3.5 py-3 hover:bg-slate-50 transition text-left">
                  <div className="w-9 h-9 rounded-full text-white flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ background: senderColor(m.from) }}>
                    {m.from[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm text-slate-700 truncate">{m.from}</span>
                      <span className="text-[11px] text-slate-400 shrink-0">{m.time}</span>
                    </div>
                    <div className="text-sm text-slate-600 truncate">{m.subject}</div>
                    <div className="text-xs text-slate-400 truncate">{m.body.replace(/\n+/g, ' ').slice(0, 90)}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {view === 'list' && otherMail && (
            <div className="space-y-3">
              <button onClick={() => setOtherMail(null)}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition">
                <ArrowLeft size={13} /> Back to inbox
              </button>
              <h3 className="text-base font-semibold text-slate-900">{otherMail.subject}</h3>
              <div className="text-xs text-slate-500">{otherMail.from} · {otherMail.time}</div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap border-t border-slate-200 pt-3">{otherMail.body}</p>
            </div>
          )}

          {view === 'email' && (
            <div className="space-y-4">
              <button onClick={() => { setView('list'); setHoverUrl('') }}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition">
                <ArrowLeft size={13} /> Back to inbox
              </button>
              <div>
                <h3 className="text-base font-semibold text-slate-900">{email.subject}</h3>
                <div className="flex items-center gap-2.5 mt-2.5">
                  <div className="w-8 h-8 rounded-full text-white flex items-center justify-center text-sm font-bold"
                    style={{ background: senderColor(email.sender_display) }}>
                    {email.sender_display?.[0] || '?'}
                  </div>
                  <div className="text-xs">
                    <div className="font-medium text-slate-800">{email.sender_display}</div>
                    <div className="text-slate-400">&lt;{email.sender_email}&gt; · to me</div>
                  </div>
                  <span className="ml-auto text-[11px] text-slate-400 self-start">9:14 AM</span>
                </div>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-5 py-3 text-white font-semibold text-sm tracking-wide"
                  style={{ background: senderColor(email.sender_display) }}>
                  {email.sender_display}
                </div>
                <div className="p-5">
                  <EmailBody body={email.body} linkText={email.link_text} firstName={firstName}
                    onClickLink={() => act('clicked')} onHover={setHoverUrl} />
                </div>
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-400">
                  This is an automated message. Please do not reply to this email.
                </div>
              </div>
              <div className="pt-1 flex gap-2 flex-wrap">
                <button onClick={() => act('reported')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition">
                  <FlagIcon size={13} /> Report phishing
                </button>
                <button onClick={() => act('ignored')}
                  className={btnGhost}>
                  <Trash2 size={13} /> Delete
                </button>
                <span className="ml-auto text-[11px] text-slate-400 self-center">
                  Tip: hover over the button to see where it really goes
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

  const unreadCount = detail?.targets?.filter(t => t.status === 'unread' || t.status === 'opened').length || 0

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
                {campaign.email.link_text && (
                  <div><b className="text-slate-600">Link button:</b> "{campaign.email.link_text}" (employees only see this label until they hover)</div>
                )}
              </div>
              <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans bg-slate-50 rounded-lg p-4 border border-slate-200">{campaign.email.body.replaceAll('{name}', '[Employee name]')}</pre>
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
