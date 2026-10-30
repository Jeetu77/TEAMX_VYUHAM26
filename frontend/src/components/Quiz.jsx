import { useState, useEffect, useCallback } from 'react'
import { ShieldAlert, ShieldCheck, CheckCircle2, XCircle, RotateCcw,
         Flag as FlagIcon, ArrowRight, Loader2, Trophy, Download, GraduationCap } from 'lucide-react'
import { getQuiz } from '../api'
import { card, SectionTitle, ErrorNote, btnPrimary, btnGhost, inputCls } from '../ui'

const rankFor = (pct) => pct >= 90 ? 'Cyber Guardian' : pct >= 70 ? 'Scam Spotter' : 'Cyber Learner'

function drawShield(ctx, cx, cy, s) {
  const path = (k) => {
    ctx.beginPath()
    ctx.moveTo(cx, cy - 60 * k)
    ctx.lineTo(cx + 50 * k, cy - 43 * k)
    ctx.lineTo(cx + 50 * k, cy + 5 * k)
    ctx.bezierCurveTo(cx + 50 * k, cy + 37 * k, cx + 26 * k, cy + 54 * k, cx, cy + 65 * k)
    ctx.bezierCurveTo(cx - 26 * k, cy + 54 * k, cx - 50 * k, cy + 37 * k, cx - 50 * k, cy + 5 * k)
    ctx.lineTo(cx - 50 * k, cy - 43 * k)
    ctx.closePath()
  }
  path(s); ctx.fillStyle = '#dbeafe'; ctx.fill()
  path(s * 0.84)
  const g = ctx.createLinearGradient(0, cy - 50 * s, 0, cy + 55 * s)
  g.addColorStop(0, '#3b82f6'); g.addColorStop(1, '#1e3a8a')
  ctx.fillStyle = g; ctx.fill()
  // Lock
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(cx - 16 * s, cy - 2 * s, 32 * s, 26 * s)
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5 * s
  ctx.beginPath(); ctx.arc(cx, cy - 2 * s, 10 * s, Math.PI, 0); ctx.stroke()
  ctx.fillStyle = '#1e3a8a'
  ctx.beginPath(); ctx.arc(cx, cy + 9 * s, 3.5 * s, 0, Math.PI * 2); ctx.fill()
}

/* Draw the completion certificate on a canvas and return it as a PNG data URL. */
function makeCertificate(name, score, total, topic) {
  const W = 1400, H = 990
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const ctx = c.getContext('2d')
  const NAVY = '#1e3a8a', BLUE = '#2563eb', GREEN = '#16a34a', INK = '#0f172a', MUTED = '#475569'

  // Paper
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#f8fbff'); bg.addColorStop(1, '#ffffff')
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

  // Faint network dots in the corners
  ctx.fillStyle = 'rgba(37,99,235,0.10)'
  for (let x = 70; x < W - 60; x += 28) for (let y = 70; y < H - 60; y += 28) {
    const edge = Math.min(x, W - x, y, H - y)
    if (edge < 140 && (x + y) % 3 === 0) { ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill() }
  }

  // Top wave band
  const top = ctx.createLinearGradient(0, 0, W, 0)
  top.addColorStop(0, NAVY); top.addColorStop(1, BLUE)
  ctx.fillStyle = top
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(W, 70)
  ctx.bezierCurveTo(W * 0.7, 130, W * 0.35, 30, 0, 95); ctx.closePath(); ctx.fill()

  // Bottom Kerala swoosh (green + blue)
  const swoosh = (y0, color, h) => {
    ctx.fillStyle = color
    ctx.beginPath(); ctx.moveTo(0, y0)
    ctx.bezierCurveTo(W * 0.3, y0 - 60, W * 0.6, y0 + 40, W, y0 - 50)
    ctx.lineTo(W, y0 - 50 + h); ctx.bezierCurveTo(W * 0.6, y0 + 40 + h, W * 0.3, y0 - 60 + h, 0, y0 + h)
    ctx.closePath(); ctx.fill()
  }
  swoosh(H - 70, GREEN, 14)
  swoosh(H - 56, BLUE, 14)
  ctx.fillStyle = NAVY
  ctx.beginPath(); ctx.moveTo(0, H - 42)
  ctx.bezierCurveTo(W * 0.3, H - 102, W * 0.6, H - 2, W, H - 92)
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill()

  // Inner frame
  ctx.strokeStyle = 'rgba(37,99,235,0.35)'; ctx.lineWidth = 2
  ctx.strokeRect(46, 46, W - 92, H - 92)

  ctx.textAlign = 'center'

  // Brand
  drawShield(ctx, W / 2, 190, 0.95)
  ctx.fillStyle = NAVY; ctx.font = 'bold 30px Georgia, serif'
  ctx.fillText('C Y B E R S A F E', W / 2, 296)
  ctx.fillStyle = GREEN; ctx.font = 'bold 18px Arial, sans-serif'
  ctx.fillText('C Y B E R   S A F E   K E R A L A M', W / 2, 326)

  // Title
  ctx.fillStyle = INK; ctx.font = 'bold 58px Georgia, serif'
  ctx.fillText('Certificate of Cyber Awareness', W / 2, 405)
  const lg = ctx.createLinearGradient(W / 2 - 200, 0, W / 2 + 200, 0)
  lg.addColorStop(0, GREEN); lg.addColorStop(1, BLUE)
  ctx.strokeStyle = lg; ctx.lineWidth = 4
  ctx.beginPath(); ctx.moveTo(W / 2 - 200, 430); ctx.lineTo(W / 2 + 200, 430); ctx.stroke()

  ctx.fillStyle = MUTED; ctx.font = '26px Georgia, serif'
  ctx.fillText('This is proudly presented to', W / 2, 488)

  // Name (shrink to fit long names)
  let size = 68
  ctx.font = `italic bold ${size}px Georgia, serif`
  while (ctx.measureText(name).width > W - 360 && size > 36) { size -= 4; ctx.font = `italic bold ${size}px Georgia, serif` }
  ctx.fillStyle = BLUE; ctx.fillText(name, W / 2, 568)
  const nameWidth = Math.min(ctx.measureText(name).width + 80, W - 300)
  ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(W / 2 - nameWidth / 2, 592); ctx.lineTo(W / 2 + nameWidth / 2, 592); ctx.stroke()

  const edition = topic === 'kerala' ? 'Kerala Local Scams edition' : 'Mixed Scams edition'
  ctx.fillStyle = MUTED; ctx.font = '25px Georgia, serif'
  ctx.fillText('for successfully completing the Cyber Safe Keralam', W / 2, 642)
  ctx.fillText(`Phishing & Scam Awareness Quiz (${edition})`, W / 2, 678)

  // Score seal
  const pct = Math.round((score / total) * 100)
  const sx = W / 2, sy = 790
  ctx.fillStyle = '#f59e0b'
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2
    ctx.beginPath(); ctx.arc(sx + Math.cos(a) * 64, sy + Math.sin(a) * 64, 10, 0, Math.PI * 2); ctx.fill()
  }
  const sg = ctx.createRadialGradient(sx - 15, sy - 15, 5, sx, sy, 66)
  sg.addColorStop(0, '#fde68a'); sg.addColorStop(1, '#d97706')
  ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sx, sy, 64, 0, Math.PI * 2); ctx.fill()
  ctx.strokeStyle = '#fff7ed'; ctx.lineWidth = 3
  ctx.beginPath(); ctx.arc(sx, sy, 52, 0, Math.PI * 2); ctx.stroke()
  ctx.fillStyle = '#7c2d12'; ctx.font = 'bold 34px Georgia, serif'
  ctx.fillText(`${pct}%`, sx, sy + 4)
  ctx.font = 'bold 14px Arial, sans-serif'
  ctx.fillText(`${score} / ${total}`, sx, sy + 26)
  ctx.fillStyle = NAVY; ctx.font = 'bold 22px Arial, sans-serif'
  ctx.fillText(rankFor(pct).toUpperCase(), sx, sy + 98)

  // Footer: date + issuer
  const now = new Date()
  const date = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  const ymd = now.toISOString().slice(0, 10).replace(/-/g, '')
  // Deterministic so re-renders show the same ID that gets downloaded
  const seed = [...`${name}|${score}|${total}|${topic}|${ymd}`].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7)
  const certId = `CSK-${ymd}-${seed.toString(36).toUpperCase().padStart(6, '0').slice(-6)}`
  ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(190, 805); ctx.lineTo(490, 805); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(W - 490, 805); ctx.lineTo(W - 190, 805); ctx.stroke()
  ctx.fillStyle = '#334155'; ctx.font = '24px Georgia, serif'
  ctx.fillText(date, 340, 790)
  ctx.font = 'italic 28px Georgia, serif'
  ctx.fillText('CyberSafe Programme', W - 340, 790)
  ctx.fillStyle = '#64748b'; ctx.font = '19px Georgia, serif'
  ctx.fillText('Date of issue', 340, 835)
  ctx.fillText('Issued by', W - 340, 835)
  ctx.font = '15px Arial, sans-serif'; ctx.fillStyle = '#94a3b8'
  ctx.fillText(`Certificate ID: ${certId}`, 340, 862)

  return c.toDataURL('image/png')
}

export default function Quiz() {
  const [questions, setQuestions] = useState(null)
  const [idx, setIdx] = useState(0)
  const [answer, setAnswer] = useState(null)   // 'phish' | 'legit' for current question
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [started, setStarted] = useState(false)
  const [topic, setTopic] = useState('all')

  const load = useCallback(() => {
    setQuestions(null); setIdx(0); setAnswer(null); setScore(0); setFinished(false); setError('')
    getQuiz(6, topic)
      .then(r => setQuestions(r.data))
      .catch(() => setError('Could not load quiz. Check backend is running.'))
  }, [topic])

  useEffect(() => { load() }, [load])

  if (error) return (
    <div className="space-y-6">
      <SectionTitle title="Training Quiz" subtitle="Phish or legit? Test yourself" />
      <ErrorNote>{error}</ErrorNote>
    </div>
  )

  if (!questions) return (
    <div className="space-y-6">
      <SectionTitle title="Training Quiz" subtitle="Phish or legit? Test yourself" />
      <div className={`${card} p-8 flex items-center justify-center gap-2 text-sm text-slate-500`}>
        <Loader2 size={15} className="animate-spin" /> Loading questions…
      </div>
    </div>
  )

  // Name gate before the quiz begins — the certificate carries this name
  if (!started) return (
    <div className="space-y-6">
      <SectionTitle title="Training Quiz" subtitle="Phish or legit? Test yourself" />
      <div className={`${card} p-8 max-w-md mx-auto text-center`}>
        <GraduationCap size={36} className="mx-auto text-blue-600 mb-3" />
        <h3 className="font-semibold text-slate-900">Ready to test your scam radar?</h3>
        <p className="text-sm text-slate-500 mt-1.5 mb-5">
          {questions.length} real-world messages — call each one phishing or legitimate.
          Finish the quiz to earn a certificate with your name on it.
        </p>
        <div className="flex gap-2 justify-center mb-5">
          {[['all', 'Mixed scams'], ['kerala', 'Kerala local scams']].map(([id, label]) => (
            <button key={id} type="button" onClick={() => setTopic(id)}
              className={`text-xs px-3 py-1.5 rounded-full border transition
                ${topic === id ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold' : 'border-slate-300 text-slate-500 hover:border-blue-300'}`}>
              {label}
            </button>
          ))}
        </div>
        {topic === 'kerala' && (
          <p className="text-xs text-slate-400 -mt-2 mb-4">
            KSEB bill threats, fake e-challans, customs-parcel calls and loan-app harassment.
          </p>
        )}
        <form onSubmit={e => { e.preventDefault(); if (name.trim()) setStarted(true) }}>
          <label className="text-sm text-slate-500 block text-left">Your name (for the certificate)</label>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Priya Nair" className={inputCls} autoFocus />
          <button type="submit" disabled={!name.trim()} className={`${btnPrimary} mt-4 w-full justify-center`}>
            Start quiz <ArrowRight size={14} />
          </button>
        </form>
      </div>
    </div>
  )

  const q = questions[idx]
  const correct = answer !== null && ((answer === 'phish') === q.is_phish)

  const choose = (a) => {
    if (answer !== null) return
    setAnswer(a)
    if ((a === 'phish') === q.is_phish) setScore(s => s + 1)
  }

  const next = () => {
    if (idx + 1 >= questions.length) setFinished(true)
    else { setIdx(idx + 1); setAnswer(null) }
  }

  if (finished) {
    const pct = Math.round((score / questions.length) * 100)
    const msg = pct === 100 ? 'Perfect score — you have a sharp eye for scams!'
      : pct >= 70 ? 'Strong result. Review the ones you missed and you\'re there.'
      : pct >= 40 ? 'A good start — the red flags get easier to spot with practice.'
      : 'Phishing fooled you this time. Retake the quiz and watch the sender domains.'
    const certUrl = makeCertificate(name.trim(), score, questions.length, topic)
    const download = () => {
      const a = Object.assign(document.createElement('a'), {
        href: certUrl,
        download: `cybersafe-keralam-certificate-${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`,
      })
      a.click()
    }
    return (
      <div className="space-y-6">
        <SectionTitle title="Training Quiz" subtitle="Phish or legit? Test yourself" />
        <div className={`${card} p-8 text-center max-w-xl mx-auto`}>
          <Trophy size={40} className={`mx-auto mb-4 ${pct >= 70 ? 'text-amber-500' : 'text-slate-300'}`} />
          <div className="text-4xl font-bold text-slate-900 tabular-nums">{score} / {questions.length}</div>
          <div className={`text-sm font-medium mt-1 ${pct >= 70 ? 'text-emerald-600' : pct >= 40 ? 'text-amber-600' : 'text-rose-600'}`}>
            {pct}% correct
          </div>
          <p className="text-sm text-slate-500 mt-3">{msg}</p>
        </div>

        {/* Certificate */}
        <div className="max-w-2xl mx-auto space-y-3">
          <img src={certUrl} alt={`Certificate of Cyber Awareness for ${name}`}
            className="w-full rounded-xl border border-slate-200 shadow-md" />
          <div className="flex gap-3 justify-center">
            <button onClick={download} className={btnPrimary}>
              <Download size={14} /> Download certificate
            </button>
            <button onClick={() => { load(); setStarted(true) }} className={btnGhost}>
              <RotateCcw size={13} /> Try another round
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <SectionTitle title="Training Quiz" subtitle="Is this message phishing or legitimate?" />
        <div className="text-sm text-slate-500 tabular-nums">
          Question {idx + 1} / {questions.length} · Score {score}
        </div>
      </div>

      {/* Progress */}
      <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full transition-all"
          style={{ width: `${((idx + (answer !== null ? 1 : 0)) / questions.length) * 100}%` }} />
      </div>

      {/* Message card, rendered like an email */}
      <div className={`${card} p-5 max-w-2xl`}>
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-sm font-bold shrink-0">
            {q.sender?.[0] || '?'}
          </div>
          <div className="text-xs min-w-0">
            <div className="font-medium text-slate-800 truncate">{q.sender}</div>
            <div className="font-semibold text-sm text-slate-900 truncate">{q.subject}</div>
          </div>
        </div>
        <p className="text-sm text-slate-700 whitespace-pre-wrap border-t border-slate-200 pt-3">{q.body}</p>
      </div>

      {/* Answer buttons */}
      {answer === null ? (
        <div className="flex gap-3">
          <button onClick={() => choose('phish')}
            className="flex-1 max-w-[16rem] inline-flex items-center justify-center gap-2 px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition">
            <ShieldAlert size={16} /> Phishing
          </button>
          <button onClick={() => choose('legit')}
            className="flex-1 max-w-[16rem] inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition">
            <ShieldCheck size={16} /> Legitimate
          </button>
        </div>
      ) : (
        <div className="space-y-4 max-w-2xl">
          <div className={`border rounded-xl p-4 flex items-start gap-3
            ${correct ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
            {correct
              ? <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
              : <XCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />}
            <div>
              <div className={`font-semibold text-sm ${correct ? 'text-emerald-700' : 'text-rose-700'}`}>
                {correct ? 'Correct!' : 'Not quite.'} This message is {q.is_phish ? 'phishing' : 'legitimate'}.
              </div>
              <p className="text-sm text-slate-600 mt-1">{q.explanation}</p>
            </div>
          </div>

          {q.red_flags?.length > 0 && (
            <div className={`${card} p-4`}>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mb-2">
                <FlagIcon size={12} /> Red flags
              </div>
              {q.red_flags.map((f, i) => (
                <div key={i} className="text-sm text-slate-700 py-0.5">• {f}</div>
              ))}
            </div>
          )}

          <button onClick={next} className={btnPrimary}>
            {idx + 1 >= questions.length ? 'See results' : 'Next question'} <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
