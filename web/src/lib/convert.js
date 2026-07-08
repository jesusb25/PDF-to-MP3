// The Express server serves this frontend, so the API is same-origin.
const API_BASE = ''
const MAX_TEXT_LENGTH = 1000

export function isPDF(filename) {
  return filename.split('.').pop().toLowerCase() === 'pdf'
}

/**
 * Upload a PDF and get back its extracted, whitespace-normalized text.
 * @param {File} file
 * @param {(done:number,total:number)=>void} [onProgress] upload byte progress
 */
export function extractText(file, onProgress) {
  const formData = new FormData()
  formData.append('pdf', file)

  // XHR (not fetch) so we can report real upload-byte progress, which is the
  // slow part of extraction for large PDFs.
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_BASE}/get-text`)
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
      resolve(xhr.responseText.trim().replace(/\s{2,}/g, ' '))
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

async function getBase64Data(text) {
  const url = `${API_BASE}/base64data?text=${encodeURIComponent(text)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Network response was not ok.')
  return res.text()
}

/**
 * Convert text to a single base64 MP3 payload.
 * @param {string} text
 * @param {(done:number,total:number)=>void} [onProgress] chunk progress callback
 */
export async function textToMp3Base64(text, onProgress) {
  const chunks = splitTextIntoChunks(text)
  let done = 0
  const parts = []
  // Report the total up front so the bar starts at a real 0% rather than
  // an indeterminate pulse.
  onProgress?.(0, chunks.length)
  // Sequential so progress is meaningful and we don't hammer the free tier.
  for (const chunk of chunks) {
    parts.push(await getBase64Data(chunk))
    done += 1
    onProgress?.(done, chunks.length)
  }
  return parts.join('')
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
