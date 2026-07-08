import { useRef, useState } from 'react'
import {
  isPDF,
  extractText,
  textToMp3Base64,
  downloadMp3,
} from '../lib/convert.js'

// Coarse UI states so the button/label always reflect what's happening.
const IDLE = 'idle'
const EXTRACTING = 'extracting'
const READY = 'ready'
const CONVERTING = 'converting'

export default function Home() {
  const [status, setStatus] = useState(IDLE)
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const inputRef = useRef(null)

  const busy = status === EXTRACTING || status === CONVERTING

  async function handleFile(file) {
    setError('')
    if (!file || !isPDF(file.name)) {
      setError('Please choose a PDF file.')
      return
    }
    setFileName(file.name)
    setStatus(EXTRACTING)
    setText('')
    try {
      const extracted = await extractText(file)
      setText(extracted)
      setStatus(READY)
      if (!extracted) {
        setError('No readable text was found in that PDF.')
      }
    } catch (e) {
      setStatus(IDLE)
      setError(e.message || 'Something went wrong reading that PDF.')
    }
  }

  async function handleConvert() {
    setError('')
    if (!text.trim()) {
      setError('There is no text to convert yet.')
      return
    }
    setStatus(CONVERTING)
    setProgress({ done: 0, total: 0 })
    try {
      const base64 = await textToMp3Base64(text, (done, total) =>
        setProgress({ done, total })
      )
      downloadMp3(base64, fileName)
      setStatus(READY)
    } catch (e) {
      setStatus(READY)
      setError(e.message || 'Conversion failed. Please try again.')
    }
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    if (busy) return
    handleFile(e.dataTransfer.files?.[0])
  }

  const pct =
    progress.total > 0
      ? Math.round((progress.done / progress.total) * 100)
      : 0

  return (
    <section className="relative overflow-hidden">
      {/* Ambient gradient backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand/10 via-transparent to-transparent dark:from-brand/20"
      />
      <div className="relative mx-auto max-w-3xl px-4 py-16 sm:py-24">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-medium text-brand dark:text-brand-light">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            Free · No sign-up
          </span>
          <h1 className="mt-5 bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-6xl dark:from-white dark:to-slate-400">
            PDF to Podcast
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600 dark:text-slate-300">
            Drop in a PDF, review the text, and download it as an MP3 you can
            listen to anywhere.
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
          {/* Dropzone */}
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              if (!busy) setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
              dragging
                ? 'border-brand bg-brand/5'
                : 'border-slate-300 hover:border-brand hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50'
            } ${busy ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
          >
            <svg
              className="h-10 w-10 text-brand"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L8 8m4-4 4 4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
            </svg>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {fileName ? (
                <>
                  Selected: <span className="text-brand">{fileName}</span>
                </>
              ) : (
                <>
                  <span className="text-brand">Click to upload</span> or drag &
                  drop
                </>
              )}
            </span>
            <span className="text-xs text-slate-400">PDF files only</span>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </button>

          {/* Status / error banner */}
          {status === EXTRACTING && (
            <StatusRow spinner>Extracting text from your PDF…</StatusRow>
          )}
          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              <svg className="mt-0.5 h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM9 9a1 1 0 0 1 2 0v4a1 1 0 1 1-2 0V9zm1-5a1.25 1.25 0 1 0 0 2.5A1.25 1.25 0 0 0 10 4z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* Editable extracted text */}
          {(status === READY || status === CONVERTING) && text && (
            <div className="mt-6">
              <label
                htmlFor="pdf-text"
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Review & edit the text
              </label>
              <textarea
                id="pdf-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                className="w-full resize-y rounded-xl border border-slate-300 bg-white p-4 text-slate-800 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
              <p className="mt-1 text-right text-xs text-slate-400">
                {text.length.toLocaleString()} characters
              </p>
            </div>
          )}

          {/* Convert button + progress */}
          {(status === READY || status === CONVERTING) && (
            <div className="mt-4">
              <button
                type="button"
                onClick={handleConvert}
                disabled={busy || !text.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 font-semibold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {status === CONVERTING ? (
                  <>
                    <Spinner />
                    Converting{progress.total ? ` ${pct}%` : '…'}
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0 4-4m-4 4-4-4M4 20h16" />
                    </svg>
                    Download as MP3
                  </>
                )}
              </button>

              {status === CONVERTING && progress.total > 0 && (
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-brand transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <FeatureRow />
      </div>
    </section>
  )
}

function StatusRow({ children, spinner }) {
  return (
    <div className="mt-4 flex items-center gap-2 rounded-lg border border-brand/20 bg-brand/5 px-4 py-3 text-sm text-brand dark:text-brand-light">
      {spinner && <Spinner />}
      {children}
    </div>
  )
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
    </svg>
  )
}

const FEATURES = [
  { icon: '⚡', title: 'Fast', body: 'Text extraction and audio in seconds.' },
  { icon: '✏️', title: 'Editable', body: 'Fix the text before you convert.' },
  { icon: '♿', title: 'Accessible', body: 'Built for listening on the go.' },
]

function FeatureRow() {
  return (
    <div className="mt-12 grid gap-4 sm:grid-cols-3">
      {FEATURES.map((f) => (
        <div
          key={f.title}
          className="rounded-xl border border-slate-200 bg-white/60 p-4 dark:border-slate-800 dark:bg-slate-900/60"
        >
          <div className="text-2xl">{f.icon}</div>
          <div className="mt-2 font-semibold text-slate-900 dark:text-slate-100">
            {f.title}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {f.body}
          </div>
        </div>
      ))}
    </div>
  )
}
