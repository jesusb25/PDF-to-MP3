const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const PORT = process.env.PORT || 8000;
const googleTTS = require('google-tts-api');
const fileUpload = require('express-fileupload');
const path = require('path');

// pdfjs-dist v4 ships as ESM only; load it lazily via dynamic import from this
// CommonJS module. The legacy build runs without a browser environment.
let pdfjsLibPromise;
function getPdfjs() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import('pdfjs-dist/legacy/build/pdf.mjs');
  }
  return pdfjsLibPromise;
}

const app = express();

// Restrict CORS to the known frontend origin(s). Override via ALLOWED_ORIGINS
// (comma-separated) in the environment for other deployments. In development
// the Vite dev server runs on :5173 and proxies API calls here, forwarding its
// own Origin header, so allow it when not in production.
const DEV_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];
const allowedOrigins = (process.env.ALLOWED_ORIGINS ||
  'https://pdf-to-mp3.onrender.com')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)
  .concat(process.env.NODE_ENV === 'production' ? [] : DEV_ORIGINS);

app.use(cors({
  origin(origin, callback) {
    // Allow same-origin/non-browser requests (no Origin header) and any
    // explicitly allowlisted origin.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
}));

// Cap upload size and abort oversized uploads so a large payload can't exhaust
// memory/CPU on the instance.
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
app.use(fileUpload({
  limits: { fileSize: MAX_UPLOAD_BYTES },
  abortOnLimit: true,
  responseOnLimit: 'File is too large. Maximum size is 10 MB.',
}));

// Basic rate limiting to prevent abuse of the public endpoints.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later.',
});
app.use(['/base64data', '/get-text'], apiLimiter);

// Serve the built React frontend (web/dist) as the static site.
const clientDir = path.join(__dirname, '..', 'web', 'dist');
app.use(express.static(clientDir));

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});

// Google TTS accepts up to ~200 chars per segment; cap total request size so
// this proxy can't be used to relay unbounded text.
const MAX_TTS_TEXT_LENGTH = 2000;

// Languages supported by google-tts-api that we expose in the UI. Requests for
// anything outside this allowlist fall back to English rather than erroring.
const SUPPORTED_LANGS = new Set([
  'en', 'en-GB', 'en-AU', 'es', 'fr', 'de', 'it', 'pt', 'pt-BR', 'nl',
  'pl', 'ru', 'sv', 'tr', 'uk', 'hi', 'ja', 'ko', 'zh-CN', 'zh-TW', 'ar',
]);

app.get('/base64data', async (request, response) => {
  const text = request.query.text;

  if (typeof text !== 'string' || text.length === 0) {
    response.status(400).send('Missing "text" query parameter.');
    return;
  }
  if (text.length > MAX_TTS_TEXT_LENGTH) {
    response
      .status(413)
      .send(`Text is too long. Maximum is ${MAX_TTS_TEXT_LENGTH} characters.`);
    return;
  }

  // Validate the requested language against the allowlist; default to English.
  const requestedLang = request.query.lang;
  const lang = SUPPORTED_LANGS.has(requestedLang) ? requestedLang : 'en';
  // Slower, clearer speech (useful for language learners) when slow=1.
  const slow = request.query.slow === '1' || request.query.slow === 'true';

  try {
    const base64Array = await googleTTS.getAllAudioBase64(text, {
      lang,
      slow,
      host: 'https://translate.google.com',
    });
    const data = base64Array.map((url) => url.base64).join('');
    response.send(data);
  } catch (err) {
    console.error('TTS error:', err.message);
    response.status(502).send('Failed to generate audio.');
  }
});

app.post('/get-text', async (request, response) => {
  if (!request.files || !request.files.pdf) {
    response.status(400).send('No files were uploaded.');
    return;
  }

  const src = request.files.pdf;

  // Validate that the upload is actually a PDF before handing it to the parser.
  const isPdf =
    src.mimetype === 'application/pdf' &&
    src.data && src.data.length >= 5 &&
    src.data.slice(0, 5).toString('latin1') === '%PDF-';
  if (!isPdf) {
    response.status(400).send('Uploaded file is not a valid PDF.');
    return;
  }

  // Optional 1-based page range. Missing/invalid bounds are clamped to the
  // full document inside getText().
  const startPage = parseInt(request.query.startPage, 10);
  const endPage = parseInt(request.query.endPage, 10);

  try {
    const result = await getText(src.data, startPage, endPage);
    // JSON so the client can show the total page count and validate ranges.
    response.json(result);
  } catch (err) {
    console.error('PDF parse error:', err.message);
    response.status(422).send('Failed to extract text from PDF.');
  }
});

async function getAllContent(data, startPage, endPage) {
  const pdfjsLib = await getPdfjs();
  // Pass a copy as a typed array; disable eval so malicious PDFs can't run
  // arbitrary JS during parsing.
  const doc = await pdfjsLib.getDocument({
    data: new Uint8Array(data),
    isEvalSupported: false,
  }).promise;
  const numPages = doc.numPages;

  // Clamp the requested range to [1, numPages]; fall back to the whole doc when
  // a bound is missing or nonsensical.
  const first = Number.isInteger(startPage)
    ? Math.min(Math.max(startPage, 1), numPages)
    : 1;
  const last = Number.isInteger(endPage)
    ? Math.min(Math.max(endPage, first), numPages)
    : numPages;

  const allContent = [];
  for (let pageNumber = first; pageNumber <= last; pageNumber++) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    allContent.push(content);
  }

  return { allContent, numPages };
}

async function getText(data, startPage, endPage) {
  const { allContent, numPages } = await getAllContent(data, startPage, endPage);
  const allText = allContent.flatMap((page) =>
    page.items.map((item) => item.str)
  );
  return { text: allText.join(' '), numPages };
}

// SPA fallback: any non-API route serves index.html so React Router can
// resolve client-side paths like /mission and /demo on a hard reload.
app.get('*', (request, response) => {
  response.sendFile(path.join(clientDir, 'index.html'));
});
