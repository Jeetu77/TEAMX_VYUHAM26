import { useState, useEffect, useRef } from 'react'
import { Search, Zap, Brain, Building2, FileText, Image as ImageIcon, Upload, X, ScanText,
         Link2, CheckCircle2, MinusCircle, Loader2, ShieldCheck, Phone, RotateCcw } from 'lucide-react'
import { analyzeMessage, analyzeScreenshot } from '../api'
import { card, VERDICT, SectionTitle, ErrorNote, btnPrimary, btnGhost } from '../ui'

const SEVERITY = {
  critical: 'bg-rose-50 text-rose-700 border-rose-200',
  high:     'bg-orange-50 text-orange-700 border-orange-200',
  medium:   'bg-amber-50 text-amber-700 border-amber-200',
}

const VERDICT_ACCENT = {
  phishing:    'border-l-rose-500',
  suspicious:  'border-l-amber-500',
  likely_safe: 'border-l-emerald-500',
}

const CHECKS = [
  { Icon: Zap,   title: 'Rule engine',     desc: 'Urgency language, lookalike domains, raw-IP links, OTP and credential requests, prompt-injection attempts.' },
  { Icon: Link2, title: 'Link reputation', desc: 'Every link is matched against the live OpenPhish phishing feed, with VirusTotal when configured.' },
  { Icon: Brain, title: 'AI analysis',     desc: 'Claude names each social-engineering tactic, the brand being impersonated and the safest next step.' },
]

const MAX_SIDE = 1600
const MAX_CHARS = 5000

const prettyTactic = (s = '') => {
  const t = s.replace(/_/g, ' ').trim()
  return t.charAt(0).toUpperCase() + t.slice(1)
}

// Shrink screenshots in the browser: faster upload and fewer vision tokens
function shrinkImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.9))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('bad image')) }
    img.src = url
  })
}

function CheckStatus({ label, done, note }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border
      ${done ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
      title={note || undefined}>
      {done ? <CheckCircle2 size={12} /> : <MinusCircle size={12} />} {label}{note ? ` (${note})` : ''}
    </span>
  )
}

export default function Detection() {
  const [mode, setMode] = useState('text')   // 'text' | 'shot'
  const [text, setText] = useState('')
  const [shot, setShot] = useState(null)     // data URL of the shrunk screenshot
  const [dragging, setDragging] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  const loadFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) { setError('Please choose an image file (PNG, JPG, WebP).'); return }
    try {
      setShot(await shrinkImage(file)); setError(''); setResult(null)
    } catch {
      setError('Could not read that image.')
    }
  }

  // Ctrl+V a screenshot straight into the page
  useEffect(() => {
    if (mode !== 'shot') return
    const onPaste = (e) => {
      const item = [...(e.clipboardData?.items || [])].find(i => i.type.startsWith('image/'))
      if (item) { e.preventDefault(); loadFile(item.getAsFile()) }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [mode])

  const switchMode = (m) => { setMode(m); setError(''); setResult(null) }
  const ready = mode === 'text' ? !!text.trim() : !!shot
  const clear = () => { setText(''); setShot(null); setResult(null); setError('') }

  const analyze = async () => {
    if (!ready || loading) return
    setLoading(true); setError(''); setResult(null)
    try {
      const res = mode === 'text' ? await analyzeMessage(text) : await analyzeScreenshot(shot)
      setResult(res.data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Analysis failed. Check the backend is running.')
    }
    setLoading(false)
  }

  const v = result && VERDICT[result.verdict]
  const aiUsed = result && !result.ai_skipped
  const linkFlagged = result?.rule_findings?.some(f => f.rule === 'url_reputation')

  return (
    <div className="space-y-6">
      <SectionTitle title="Phishing Detection"
        subtitle="Check a suspicious message, email, link or screenshot before you act on it" />

      {/* Input panel */}
      <div className={`${card} overflow-hidden`}>
        <div className="flex items-center justify-between gap-3 flex-wrap px-5 py-3 border-b border-slate-200 bg-slate-50/70">
          <div className="inline-flex p-1 rounded-lg bg-slate-100 border border-slate-200 gap-1" role="tablist">
            {[['text', 'Message', FileText], ['shot', 'Screenshot', ImageIcon]].map(([id, label, Icon]) => (
              <button key={id} role="tab" aria-selected={mode === id} onClick={() => switchMode(id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium transition-all duration-200
                  ${mode === id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-500">
            {mode === 'text' ? 'Include the sender and any links for the best result' : 'WhatsApp, SMS or email screenshot · PNG, JPG, WebP'}
          </span>
        </div>

        <div className="p-5">
          {mode === 'text' ? (
            <div className="relative">
              <textarea value={text} maxLength={MAX_CHARS}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') analyze() }}
                placeholder="Paste the full message here, for example an SMS, WhatsApp forward or email body…"
                aria-label="Message to analyze"
                className="w-full h-44 p-4 rounded-lg border border-slate-300 bg-white text-sm leading-relaxed text-slate-800 placeholder-slate-400 resize-none
                  focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200/60 transition-all duration-200" />
              <span className="absolute bottom-3 right-4 text-[11px] text-slate-400 tabular-nums">
                {text.length} / {MAX_CHARS}
              </span>
            </div>
          ) : shot ? (
            <div className="relative rounded-lg border border-slate-200 bg-slate-50 p-3">
              <img src={shot} alt="Screenshot to analyze" className="w-full max-h-72 object-contain rounded-md" />
              <button onClick={() => { setShot(null); setResult(null) }} title="Remove screenshot" aria-label="Remove screenshot"
                className="absolute top-5 right-5 p-1.5 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition">
                <X size={14} />
              </button>
            </div>
          ) : (
            <div onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); loadFile(e.dataTransfer.files?.[0]) }}
              className={`h-44 rounded-lg flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition
                border-2 border-dashed ${dragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50/50 hover:border-blue-400 hover:bg-blue-50/40'}`}>
              <div className="p-2.5 rounded-full bg-blue-50 border border-blue-100"><Upload size={20} className="text-blue-600" /></div>
              <div className="text-sm font-medium text-slate-800">Drop a screenshot here</div>
              <div className="text-xs text-slate-500">or click to browse · press Ctrl+V to paste</div>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => { loadFile(e.target.files?.[0]); e.target.value = '' }} />
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap px-5 py-3 border-t border-slate-200 bg-slate-50/70">
          <span className="text-xs text-slate-500">
            {mode === 'text' ? 'Press Ctrl+Enter to analyze' : 'One screenshot per analysis'}
          </span>
          <div className="flex items-center gap-2">
            {(text || shot || result) && (
              <button onClick={clear} className={btnGhost}><RotateCcw size={12} /> Clear</button>
            )}
            <button onClick={analyze} disabled={loading || !ready} className={btnPrimary}>
              {loading ? <Loader2 size={15} className="animate-spin" /> : mode === 'text' ? <Search size={15} /> : <ScanText size={15} />}
              {loading ? (mode === 'text' ? 'Analyzing…' : 'Reading screenshot…') : 'Analyze'}
            </button>
          </div>
        </div>
      </div>

      <ErrorNote>{error}</ErrorNote>

      {/* Empty state: what the analysis does */}
      {!result && !loading && (
        <div className="grid md:grid-cols-3 gap-4">
          {CHECKS.map(c => (
            <div key={c.title} className={`${card} p-5`}>
              <div className="inline-flex p-2 rounded-lg bg-blue-50 border border-blue-100 mb-3">
                <c.Icon size={16} className="text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">{c.title}</h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className={`${card} p-6 flex items-center gap-3 text-sm text-slate-600`}>
          <Loader2 size={18} className="animate-spin text-blue-600" />
          Running rule checks, link reputation and AI analysis…
        </div>
      )}

      {/* Report */}
      {result && v && (
        <div className="space-y-4 animate-fade-in">
          {/* Verdict */}
          <div className={`${card} border-l-4 ${VERDICT_ACCENT[result.verdict] || ''} p-6`}>
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${v.chip}`}><v.Icon size={26} /></div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Verdict</div>
                  <div className={`text-2xl font-bold ${v.text}`}>{v.label}</div>
                </div>
              </div>
              <div className="min-w-[200px] flex-1 max-w-xs">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Confidence</span>
                  <span className={`text-2xl font-bold tabular-nums ${v.text}`}>{result.confidence}%</span>
                </div>
                <div className="h-2 mt-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full rounded-full ${v.bar} transition-all duration-500`} style={{ width: `${result.confidence}%` }} />
                </div>
              </div>
            </div>

            {result.impersonated_brand && (
              <div className="mt-5 inline-flex items-center gap-2 text-sm text-slate-700 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                <Building2 size={14} className="text-slate-500" />
                Impersonates <b className="text-slate-900">{result.impersonated_brand}</b>
              </div>
            )}

            <div className="mt-5 flex gap-3 rounded-lg bg-blue-50/60 border border-blue-100 p-4">
              <ShieldCheck size={18} className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-blue-700">Recommended action</div>
                <p className="text-sm text-slate-700 mt-1">{result.recommended_action}</p>
              </div>
            </div>

            {result.verdict !== 'likely_safe' && (
              <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                <Phone size={14} className="text-slate-500" />
                Lost money or shared details? Call <b className="text-slate-900">1930</b> or report at{' '}
                <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-medium">cybercrime.gov.in</a>
              </div>
            )}

            <div className="mt-5 pt-4 border-t border-slate-200 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 mr-1">Checks run:</span>
              <CheckStatus label="Rule engine" done />
              <CheckStatus label="Link reputation" done note={linkFlagged ? 'flagged' : null} />
              <CheckStatus label="AI analysis" done={aiUsed} note={aiUsed ? null : 'skipped'} />
            </div>
          </div>

          {result.extracted_text && (
            <div className={`${card} p-5`}>
              <h3 className="flex items-center gap-2 font-semibold mb-3 text-slate-900 text-sm">
                <ScanText size={15} className="text-blue-600" /> Text read from screenshot
              </h3>
              <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans bg-slate-50 rounded-lg p-3 border border-slate-200 max-h-40 overflow-y-auto">{result.extracted_text}</pre>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-4 items-start">
            {/* Rule findings */}
            <div className={`${card} p-5`}>
              <h3 className="flex items-center justify-between font-semibold mb-4 text-slate-900 text-sm">
                <span className="flex items-center gap-2"><Zap size={15} className="text-orange-600" /> Rule engine findings</span>
                <span className="text-xs font-normal text-slate-500">{result.rule_findings?.length || 0} found</span>
              </h3>
              {result.rule_findings?.length ? (
                <div className="divide-y divide-slate-100">
                  {result.rule_findings.map((f, i) => (
                    <div key={i} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                      <span className={`shrink-0 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded border ${SEVERITY[f.severity] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                        {f.severity}
                      </span>
                      <span className="text-sm text-slate-700">{f.detail}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No rule-based red flags were found.</p>
              )}
            </div>

            {/* Tactics */}
            <div className={`${card} p-5`}>
              <h3 className="flex items-center justify-between font-semibold mb-4 text-slate-900 text-sm">
                <span className="flex items-center gap-2"><Brain size={15} className="text-violet-600" /> Manipulation tactics</span>
                <span className="text-xs font-normal text-slate-500">{result.tactics?.length || 0} identified</span>
              </h3>
              {result.tactics?.length ? (
                <div className="space-y-3">
                  {result.tactics.map((t, i) => (
                    <div key={i} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                      <div className="font-medium text-slate-900 text-sm">{prettyTactic(t.tactic)}</div>
                      {t.evidence && <div className="text-xs text-slate-500 mt-1 italic">“{t.evidence}”</div>}
                      <div className="text-sm text-slate-600 mt-1.5">{t.explanation}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No manipulation tactics were identified.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
