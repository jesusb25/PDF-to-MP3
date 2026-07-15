// On Render the Express server serves this frontend, so the API is same-origin
// (API_BASE = ''). On GitHub Pages the frontend and API live on different
// origins, so set VITE_API_BASE to the absolute API URL at build time.
const API_BASE = import.meta.env.VITE_API_BASE || ''
// Per-chunk char limit. The server caps a single /base64data request at 2000
// chars; staying just under that halves the number of sequential requests a
// long document needs (each chunk = one round-trip), which matters most for
// books. Google TTS still segments internally, so quality is unaffected.
const MAX_TEXT_LENGTH = 1800

// Languages the server allowlists for TTS. `code` is passed to /base64data;
// `voice` is the label shown in the result card.
export const LANGUAGES = [
  { code: 'en', label: 'English (US)', voice: 'Ava (US)' },
  { code: 'en-GB', label: 'English (UK)', voice: 'Daniel (UK)' },
  { code: 'en-AU', label: 'English (AU)', voice: 'Karen (AU)' },
  { code: 'es', label: 'Spanish', voice: 'Spanish' },
  { code: 'fr', label: 'French', voice: 'French' },
  { code: 'de', label: 'German', voice: 'German' },
  { code: 'it', label: 'Italian', voice: 'Italian' },
  { code: 'pt', label: 'Portuguese', voice: 'Portuguese' },
  { code: 'pt-BR', label: 'Portuguese (BR)', voice: 'Portuguese (BR)' },
  { code: 'nl', label: 'Dutch', voice: 'Dutch' },
  { code: 'pl', label: 'Polish', voice: 'Polish' },
  { code: 'ru', label: 'Russian', voice: 'Russian' },
  { code: 'sv', label: 'Swedish', voice: 'Swedish' },
  { code: 'tr', label: 'Turkish', voice: 'Turkish' },
  { code: 'uk', label: 'Ukrainian', voice: 'Ukrainian' },
  { code: 'hi', label: 'Hindi', voice: 'Hindi' },
  { code: 'ja', label: 'Japanese', voice: 'Japanese' },
  { code: 'ko', label: 'Korean', voice: 'Korean' },
  { code: 'zh-CN', label: 'Chinese (Simplified)', voice: 'Chinese' },
  { code: 'zh-TW', label: 'Chinese (Traditional)', voice: 'Chinese (TW)' },
  { code: 'ar', label: 'Arabic', voice: 'Arabic' },
]

export function isPDF(filename) {
  return filename.split('.').pop().toLowerCase() === 'pdf'
}

/**
 * Upload a PDF and get back its extracted, whitespace-normalized text.
 * @param {File} file
 * @param {(done:number,total:number)=>void} [onProgress] upload byte progress
 * @param {{startPage?:number, endPage?:number}} [range] optional 1-based page range
 * @returns {Promise<{text:string, numPages:number}>}
 */
export function extractText(file, onProgress, range = {}) {
  const formData = new FormData()
  formData.append('pdf', file)

  let url = `${API_BASE}/get-text`
  const params = new URLSearchParams()
  if (range.startPage) params.set('startPage', String(range.startPage))
  if (range.endPage) params.set('endPage', String(range.endPage))
  const qs = params.toString()
  if (qs) url += `?${qs}`

  // XHR (not fetch) so we can report real upload-byte progress, which is the
  // slow part of extraction for large PDFs.
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded, e.total)
    })
    xhr.addEventListener('load', () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(
          new Error(`Could not extract text (server responded ${xhr.status}).`),
        )
        return
      }
      try {
        const { text, numPages } = JSON.parse(xhr.responseText)
        resolve({ text: text.trim().replace(/\s{2,}/g, ' '), numPages })
      } catch {
        reject(new Error('Could not read the server response.'))
      }
    })
    xhr.addEventListener('error', () =>
      reject(new Error('Could not extract text (network error).')),
    )
    xhr.send(formData)
  })
}

/** Split text on word boundaries so no chunk exceeds the TTS length limit. */
export function splitTextIntoChunks(text, chunkSize = MAX_TEXT_LENGTH) {
  const chunks = []
  let i = 0
  while (i < text.length) {
    let end = i + chunkSize
    if (end < text.length) {
      const lastSpace = text.lastIndexOf(' ', end)
      if (lastSpace > i) end = lastSpace
    } else {
      end = text.length
    }
    chunks.push(text.slice(i, end))
    i = end + 1
  }
  return chunks
}

/**
 * Rough pre-conversion estimate from the text. Chunk count is exact (it drives
 * how many sequential TTS requests we make); duration is a ~150 wpm estimate.
 * @param {string} text
 * @param {boolean} [slow] slower speech lengthens the estimate
 */
export function estimateConversion(text, slow = false) {
  const trimmed = text.trim()
  const chunks = trimmed ? splitTextIntoChunks(trimmed).length : 0
  const words = trimmed ? trimmed.split(/\s+/).length : 0
  const wordsPerMinute = slow ? 100 : 150
  const seconds = words ? Math.round((words / wordsPerMinute) * 60) : 0
  return { chunks, words, seconds }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Long documents fan out into hundreds of sequential requests and can trip the
// server's rate limit (429) or a transient upstream failure (502). Without this
// a single throttled request would fail the whole conversion, so retry those
// with exponential backoff, honoring Retry-After when the server sends it.
const MAX_RETRIES = 5
const BASE_BACKOFF_MS = 1000

async function getBase64Data(text, { lang, slow } = {}) {
  let url = `${API_BASE}/base64data?text=${encodeURIComponent(text)}`
  if (lang) url += `&lang=${encodeURIComponent(lang)}`
  if (slow) url += `&slow=1`

  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url)
    if (res.ok) return res.text()

    // Retry only on throttling/transient upstream errors; other statuses
    // (e.g. 400/413) won't succeed on retry, so fail fast.
    const retryable = res.status === 429 || res.status === 502 || res.status === 503
    if (!retryable || attempt >= MAX_RETRIES) {
      throw new Error(
        res.status === 429
          ? 'Too many requests — the free service is rate-limited. Try a smaller document or wait a bit.'
          : 'Network response was not ok.',
      )
    }

    // Prefer the server's Retry-After (seconds); otherwise exponential backoff.
    const retryAfter = Number(res.headers.get('retry-after'))
    const wait = Number.isFinite(retryAfter) && retryAfter > 0
      ? retryAfter * 1000
      : BASE_BACKOFF_MS * 2 ** attempt
    await sleep(wait)
  }
}

// How many TTS requests are in flight at once. A long document is hundreds of
// chunks; running them one-at-a-time makes a book take minutes. A small pool
// cuts that to well under a minute while staying gentle enough that the
// per-request 429 backoff (getBase64Data) can absorb the occasional throttle.
const TTS_CONCURRENCY = 5

/**
 * Convert text to a single base64 MP3 payload.
 * @param {string} text
 * @param {(done:number,total:number)=>void} [onProgress] chunk progress callback
 * @param {{lang?:string, slow?:boolean}} [opts] TTS language and speech-rate options
 */
export async function textToMp3Base64(text, onProgress, opts = {}) {
  const chunks = splitTextIntoChunks(text)
  // Results are written into indexed slots (not push-order) so the joined MP3
  // preserves chunk order even though requests finish out of order.
  const parts = new Array(chunks.length)
  let done = 0
  let next = 0
  // Report the total up front so the bar starts at a real 0% rather than
  // an indeterminate pulse.
  onProgress?.(0, chunks.length)

  // Each worker pulls the next unclaimed chunk index until the queue drains.
  // Bounded concurrency (TTS_CONCURRENCY workers) instead of one-at-a-time.
  async function worker() {
    while (next < chunks.length) {
      const i = next++
      parts[i] = await getBase64Data(chunks[i], opts)
      done += 1
      onProgress?.(done, chunks.length)
    }
  }

  const workers = Array.from(
    { length: Math.min(TTS_CONCURRENCY, chunks.length) },
    worker,
  )
  await Promise.all(workers)
  return parts.join('')
}

// ffmpeg.wasm is loaded lazily and only once — it's a ~30MB WASM payload we
// don't want to pull in unless the user actually asks for a non-1x download.
// The core files are bundled from node_modules (see the ?url imports) and
// served same-origin, so there's no CDN dependency and no need for
// cross-origin isolation (we use the single-threaded core).
let ffmpegPromise

async function getFfmpeg() {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const [{ FFmpeg }, { toBlobURL }, coreURL, wasmURL] = await Promise.all([
        import('@ffmpeg/ffmpeg'),
        import('@ffmpeg/util'),
        import('@ffmpeg/core?url').then((m) => m.default),
        import('@ffmpeg/core/wasm?url').then((m) => m.default),
      ])
      const ffmpeg = new FFmpeg()
      await ffmpeg.load({
        // Wrap in blob URLs so the worker can import them cross-context.
        coreURL: await toBlobURL(coreURL, 'text/javascript'),
        wasmURL: await toBlobURL(wasmURL, 'application/wasm'),
      })
      return ffmpeg
    })()
  }
  return ffmpegPromise
}

function base64ToUint8Array(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function uint8ArrayToBase64(bytes) {
  let binary = ''
  // Chunk to avoid "Maximum call stack size exceeded" from spreading a large
  // array into String.fromCharCode.
  const CHUNK = 0x8000
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}

// atempo natively handles 0.5–2.0 in a single pass; the preset dropdown stays
// within that range so no filter chaining is needed. Guard anyway.
function tempoFilter(rate) {
  const clamped = Math.min(2, Math.max(0.5, rate))
  return `atempo=${clamped}`
}

/**
 * Re-encode a base64 MP3 to play at `rate`× speed, preserving pitch via
 * ffmpeg's atempo filter. Returns new base64. A rate of 1 is a no-op.
 * @param {string} base64Data raw base64 MP3 (no data: prefix)
 * @param {number} rate playback rate, 0.5–2.0
 */
export async function changeSpeed(base64Data, rate) {
  if (!rate || rate === 1) return base64Data
  const ffmpeg = await getFfmpeg()
  const inputName = 'in.mp3'
  const outputName = 'out.mp3'
  await ffmpeg.writeFile(inputName, base64ToUint8Array(base64Data))
  await ffmpeg.exec([
    '-i', inputName,
    '-filter:a', tempoFilter(rate),
    '-vn',
    outputName,
  ])
  const out = await ffmpeg.readFile(outputName)
  // Clean up the virtual FS so repeated conversions don't accumulate.
  await ffmpeg.deleteFile(inputName)
  await ffmpeg.deleteFile(outputName)
  return uint8ArrayToBase64(out)
}

/** Trigger a browser download of base64 MP3 data. */
export function downloadMp3(base64Data, sourceName) {
  const a = document.createElement('a')
  a.href = 'data:audio/mpeg;base64,' + base64Data
  const base = sourceName ? sourceName.replace(/\.[^.]+$/, '') : 'audio'
  a.download = `${base}.mp3`
  document.body.appendChild(a)
  a.click()
  a.remove()
}
