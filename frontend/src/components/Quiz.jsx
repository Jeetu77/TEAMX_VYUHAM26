import { useState, useEffect, useCallback } from 'react'
import { ShieldAlert, ShieldCheck, CheckCircle2, XCircle, RotateCcw,
         Flag as FlagIcon, ArrowRight, Loader2, Trophy, Download, GraduationCap } from 'lucide-react'
import { getQuiz } from '../api'
import { card, SectionTitle, ErrorNote, btnPrimary, btnGhost, inputCls } from '../ui'

/* Draw the completion certificate on a canvas and return it as a PNG data URL. */
function makeCertificate(name, score, total) {
  const W = 1400, H = 990
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const ctx = c.getContext('2d')

  // Background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)

  // Soft corner decoration
  const grad = ctx.createLinearGradient(0, 0, W, H)
  grad.addColorStop(0, 'rgba(37,99,235,0.08)')
  grad.addColorStop(0.5, 'rgba(37,99,235,0)')
  grad.addColorStop(1, 'rgba(37,99,235,0.08)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // Borders
  ctx.strokeStyle = '#2563eb'
  ctx.lineWidth = 10
  ctx.strokeRect(30, 30, W - 60, H - 60)
  ctx.strokeStyle = '#93c5fd'
  ctx.lineWidth = 2
  ctx.strokeRect(50, 50, W - 100, H - 100)

  ctx.textAlign = 'center'

  // Shield mark
  ctx.font = '64px serif'
  ctx.fillStyle = '#2563eb'
  ctx.fillText('\u{1F6E1}️', W / 2, 108)

  // Header
  ctx.fillStyle = '#2563eb'
  ctx.font = 'bold 30px Georgia, serif'
  ctx.fillText('P H I S H G U A R D', W / 2, 190)

  ctx.fillStyle = '#0f172a'
  ctx.font = 'bold 64px Georgia, serif'
  ctx.fillText('Certificate of Completion', W / 2, 280)

  ctx.strokeStyle = '#2563eb'
  ctx.lineWidth = 3
  ctx.beginPath(); ctx.moveTo(W / 2 - 180, 310); ctx.lineTo(W / 2 + 180, 310); ctx.stroke()

  ctx.fillStyle = '#475569'
  ctx.font = '28px Georgia, serif'
  ctx.fillText('This certifies that', W / 2, 390)

  // Name
  ctx.fillStyle = '#1d4ed8'
  ctx.font = 'italic bold 72px Georgia, serif'
  ctx.fillText(name, W / 2, 490)
  const nameWidth = Math.min(ctx.measureText(name).width + 60, W - 300)
  ctx.strokeStyle = '#cbd5e1'
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(W / 2 - nameWidth / 2, 515); ctx.lineTo(W / 2 + nameWidth / 2, 515); ctx.stroke()

  ctx.fillStyle = '#475569'
  ctx.font = '28px Georgia, serif'
  ctx.fillText('has successfully completed the', W / 2, 585)
  ctx.fillStyle = '#0f172a'
  ctx.font = 'bold 34px Georgia, serif'
  ctx.fillText('Security Awareness Training Quiz', W / 2, 635)

  // Score
  const pct = Math.round((score / total) * 100)
  ctx.fillStyle = '#2563eb'
  ctx.font = 'bold 30px Georgia, serif'
  ctx.fillText(`Score: ${score} / ${total}  (${pct}%)`, W / 2, 710)

  // Footer: date + signature
  const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  ctx.strokeStyle = '#94a3b8'
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(220, 850); ctx.lineTo(520, 850); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(W - 520, 850); ctx.lineTo(W - 220, 850); ctx.stroke()
  ctx.fillStyle = '#334155'
  ctx.font = '24px Georgia, serif'
  ctx.fillText(date, 370, 835)
  ctx.font = 'italic 30px Georgia, serif'
  ctx.fillText('PhishGuard Trainer', W - 370, 833)
  ctx.fillStyle = '#64748b'
  ctx.font = '20px Georgia, serif'
  ctx.fillText('Date', 370, 885)
  ctx.fillText('Authorized by', W - 370, 885)

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

  const load = useCallback(() => {
    setQuestions(null); setIdx(0); setAnswer(null); setScore(0); setFinished(false); setError('')
    getQuiz(6)
      .then(r => setQuestions(r.data))
      .catch(() => setError('Could not load quiz. Check backend is running.'))
  }, [])

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
    const certUrl = makeCertificate(name.trim(), score, questions.length)
    const download = () => {
      const a = Object.assign(document.createElement('a'), {
        href: certUrl,
        download: `phishguard-certificate-${name.trim().toLowerCase().replace(/\s+/g, '-')}.png`,
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
          <img src={certUrl} alt={`Certificate of completion for ${name}`}
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
