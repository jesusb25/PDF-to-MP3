import { useEffect, useRef, useState } from "react";
import {
  isPDF,
  extractText,
  textToMp3Base64,
  downloadMp3,
  changeSpeed,
  estimateConversion,
  LANGUAGES,
} from "../lib/convert.js";

// Coarse UI states so the button/label always reflect what's happening.
const IDLE = "idle";
const EXTRACTING = "extracting";
const READY = "ready";
const CONVERTING = "converting";
const DONE = "done";

// Download speed presets. atempo handles 0.5–2.0 in one pass (pitch preserved),
// so every value here is a single-filter re-encode.
const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 1.75, 2];

export default function Home() {
  const [status, setStatus] = useState(IDLE);
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [audioUrl, setAudioUrl] = useState("");
  const [mode, setMode] = useState("pdf"); // "pdf" | "paste"
  const [lang, setLang] = useState("en");
  const [slow, setSlow] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [startPage, setStartPage] = useState("");
  const [endPage, setEndPage] = useState("");
  const [lastFile, setLastFile] = useState(null);
  const inputRef = useRef(null);

  const busy = status === EXTRACTING || status === CONVERTING;
  const voice = LANGUAGES.find((l) => l.code === lang)?.voice || "Ava (US)";

  async function handleFile(file) {
    setError("");
    if (!file || !isPDF(file.name)) {
      setError("Please choose a PDF file.");
      return;
    }
    setFileName(file.name);
    setFileSize(file.size);
    setLastFile(file);
    // A fresh file resets any prior page-range selection.
    setStartPage("");
    setEndPage("");
    setNumPages(0);
    setStatus(EXTRACTING);
    setText("");
    setProgress({ done: 0, total: 0 });
    try {
      const { text: extracted, numPages: pages } = await extractText(
        file,
        (done, total) => setProgress({ done, total }),
      );
      setText(extracted);
      setNumPages(pages);
      setStatus(READY);
      if (!extracted) {
        setError("No readable text was found in that PDF.");
      }
    } catch (e) {
      setStatus(IDLE);
      setError(e.message || "Something went wrong reading that PDF.");
    }
  }

  // Re-extract the current PDF for the chosen page range without re-selecting
  // the file. Bounds are validated here; the server also clamps defensively.
  async function reExtract() {
    if (!lastFile) return;
    const from = startPage ? parseInt(startPage, 10) : undefined;
    const to = endPage ? parseInt(endPage, 10) : undefined;
    if (from && to && from > to) {
      setError("Start page can't be after end page.");
      return;
    }
    setError("");
    setStatus(EXTRACTING);
    setText("");
    setProgress({ done: 0, total: 0 });
    try {
      const { text: extracted, numPages: pages } = await extractText(
        lastFile,
        (done, total) => setProgress({ done, total }),
        { startPage: from, endPage: to },
      );
      setText(extracted);
      setNumPages(pages);
      setStatus(READY);
      if (!extracted) {
        setError("No readable text was found in those pages.");
      }
    } catch (e) {
      setStatus(READY);
      setError(e.message || "Something went wrong reading that PDF.");
    }
  }

  async function handleConvert() {
    setError("");
    if (!text.trim()) {
      setError("There is no text to convert yet.");
      return;
    }
    setStatus(CONVERTING);
    setProgress({ done: 0, total: 0 });
    try {
      let base64 = await textToMp3Base64(
        text,
        (done, total) => setProgress({ done, total }),
        { lang, slow },
      );
      // Apply the chosen speed (pitch-preserving) so the generated MP3 — the
      // one both previewed and downloaded — already plays at that rate. A
      // speed of 1 is a no-op passthrough inside changeSpeed.
      if (speed !== 1) {
        base64 = await changeSpeed(base64, speed);
      }
      setAudioUrl("data:audio/mpeg;base64," + base64);
      setStatus(DONE);
    } catch (e) {
      setStatus(READY);
      setError(e.message || "Conversion failed. Please try again.");
    }
  }

  // The generated MP3 is already at the chosen speed (applied during convert),
  // so the download is a straight save of the current audio.
  function handleDownload() {
    downloadMp3(audioUrl.replace(/^data:audio\/mpeg;base64,/, ""), fileName);
  }

  function reset() {
    setStatus(IDLE);
    setText("");
    setFileName("");
    setFileSize(0);
    setError("");
    setProgress({ done: 0, total: 0 });
    setAudioUrl("");
    setNumPages(0);
    setStartPage("");
    setEndPage("");
    setLastFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  // In paste mode the user types directly into the textarea; keep the status at
  // READY so the convert button + text stats show, and clear any prior file.
  function handlePasteChange(value) {
    setText(value);
    setFileName("");
    setFileSize(0);
    if (value.trim()) {
      if (status !== READY) setStatus(READY);
    } else if (status === READY) {
      setStatus(IDLE);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    if (busy) return;
    handleFile(e.dataTransfer.files?.[0]);
  }

  const pct =
    progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <section className="relative">
      <div className="relative mx-auto max-w-3xl px-6 py-16 sm:py-24">
        {/* Hero header hides once a document is in flight (uploaded, ready,
            converting, or done) so the converter UI gets the focus. */}
        {status === IDLE && (
          <>
            <h1 className="mt-10 text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl dark:text-white">
              Turn any PDF into audio.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-slate-500 dark:text-slate-400">
              Drop a document and get a clean MP3 you can listen to anywhere. No
              account needed.
            </p>
          </>
        )}

        {/* Mode toggle: upload a PDF or paste text directly */}
        {status !== DONE && !busy && (
          <div className="mt-8 inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900/40">
            {[
              { id: "pdf", label: "Upload PDF" },
              { id: "paste", label: "Paste text" },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setMode(m.id);
                  reset();
                }}
                className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                  mode === m.id
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}

        <div className="mt-4">
          {status === DONE ? (
            /* Result view: finished MP3 with player */
            <ResultCard
              src={audioUrl}
              fileName={fileName}
              voice={voice}
              onDownload={handleDownload}
              onReset={reset}
            />
          ) : busy ? (
            /* Processing view: file card + progress */
            <>
              <FileCard name={fileName} size={fileSize} />
              <ProgressBar
                label={
                  status === EXTRACTING
                    ? "Reading PDF…"
                    : "Converting to audio…"
                }
                pct={pct}
                indeterminate={progress.total === 0}
              />
            </>
          ) : mode === "paste" ? (
            /* Paste-text input */
            <textarea
              value={text}
              onChange={(e) => handlePasteChange(e.target.value)}
              rows={8}
              placeholder="Paste or type any text here — an article, an email, your notes…"
              className="w-full resize-y rounded-2xl border border-slate-300 bg-white p-5 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          ) : (
            /* Dropzone */
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`flex w-full cursor-pointer flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed px-6 py-16 text-center transition ${
                dragging
                  ? "border-brand bg-brand/5"
                  : "border-slate-300 bg-slate-50 hover:border-brand hover:bg-slate-100/70 dark:border-slate-700 dark:bg-slate-900/40 dark:hover:bg-slate-800/50"
              }`}
            >
              <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand/10 dark:bg-brand/20">
                <svg
                  className="h-7 w-7 text-brand"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 16V4m0 0L8 8m4-4 4 4"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
                  />
                </svg>
              </span>
              <span className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {fileName ? (
                  <>
                    Selected: <span className="text-brand">{fileName}</span>
                  </>
                ) : (
                  <>
                    Drop a PDF here, or{" "}
                    <span className="text-brand">browse</span>
                  </>
                )}
              </span>
              <span className="font-mono text-xs uppercase tracking-wider text-slate-400">
                PDF up to 10 MB
              </span>
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </button>
          )}

          {/* Error banner */}
          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              <svg
                className="mt-0.5 h-4 w-4 flex-shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM9 9a1 1 0 0 1 2 0v4a1 1 0 1 1-2 0V9zm1-5a1.25 1.25 0 1 0 0 2.5A1.25 1.25 0 0 0 10 4z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
          )}

          {/* Editable extracted text (PDF mode — paste mode edits inline) */}
          {status === READY && mode === "pdf" && text && (
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
            </div>
          )}

          {/* Character count + pre-conversion estimate (both modes) */}
          {status === READY && text && (
            <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4 text-xs text-slate-400">
              <span>
                ≈ {formatDuration(estimateConversion(text, slow).seconds)} of
                audio · {estimateConversion(text, slow).chunks} request
                {estimateConversion(text, slow).chunks === 1 ? "" : "s"}
              </span>
              <span>{text.length.toLocaleString()} characters</span>
            </div>
          )}

          {/* Page-range selector (PDF mode, multi-page docs) */}
          {status === READY && mode === "pdf" && numPages > 1 && (
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
              <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                Pages{" "}
                <span className="font-normal text-slate-400">
                  (of {numPages} — leave blank for all)
                </span>
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={numPages}
                  value={startPage}
                  onChange={(e) => setStartPage(e.target.value)}
                  placeholder="1"
                  className="w-20 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-800 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="number"
                  min={1}
                  max={numPages}
                  value={endPage}
                  onChange={(e) => setEndPage(e.target.value)}
                  placeholder={String(numPages)}
                  className="w-20 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-800 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={reExtract}
                  className="ml-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Apply
                </button>
              </div>
            </div>
          )}

          {/* Voice/language + speech-rate controls */}
          {status === READY && (
            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label
                  htmlFor="lang"
                  className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Voice / language
                </label>
                <select
                  id="lang"
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-800 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:w-44">
                <label
                  htmlFor="speed"
                  className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Speed
                </label>
                <select
                  id="speed"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-800 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  {SPEED_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}×{s === 1 ? " (normal)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex cursor-pointer items-center gap-2 pb-2.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={slow}
                  onChange={(e) => setSlow(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/30 dark:border-slate-600 dark:bg-slate-800"
                />
                Slower, clearer speech
              </label>
            </div>
          )}

          {/* Convert button */}
          {status === READY && (
            <div className="mt-4">
              <button
                type="button"
                onClick={handleConvert}
                disabled={!text.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 font-semibold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v12m0 0 4-4m-4 4-4-4M4 20h16"
                  />
                </svg>
                Download as MP3
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// Static bar heights (%) for the decorative waveform. Deterministic so the
// layout doesn't jump between renders.
const WAVE_BARS = [
  42, 68, 55, 80, 48, 72, 60, 90, 52, 66, 44, 78, 58, 84, 50, 70, 62, 88, 46,
  74, 56, 82, 64, 76, 54, 86, 48, 68, 60, 92, 52, 72, 58, 80, 50, 66, 62, 84,
  46, 74,
];

function formatDuration(seconds) {
  if (!seconds || !isFinite(seconds)) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function ResultCard({ src, fileName, voice, onDownload, onReset }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [rate, setRate] = useState(1);

  const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];

  // Rough size estimate from the base64 payload (3 bytes per 4 chars).
  const bytes = Math.floor((src.length - src.indexOf(",") - 1) * 0.75);
  const displayName =
    (fileName ? fileName.replace(/\.[^.]+$/, "") : "audio") + ".mp3";
  const played = duration > 0 ? current / duration : 0;

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onMeta = () => setDuration(el.duration);
    const onTime = () => setCurrent(el.currentTime);
    const onEnd = () => setPlaying(false);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("ended", onEnd);
    return () => {
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("ended", onEnd);
    };
  }, [src]);

  function toggle() {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      el.play();
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  }

  // Set the rate used for both the preview player and the download, keeping
  // them in sync so the dropdown and the player button never disagree.
  function setSpeed(next) {
    setRate(next);
    const el = audioRef.current;
    if (el) el.playbackRate = next;
  }

  function cycleSpeed() {
    setSpeed(SPEEDS[(SPEEDS.indexOf(rate) + 1) % SPEEDS.length]);
  }

  function seek(e) {
    const el = audioRef.current;
    if (!el || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(
      1,
      Math.max(0, (e.clientX - rect.left) / rect.width),
    );
    el.currentTime = ratio * duration;
    setCurrent(el.currentTime);
  }

  return (
    <div>
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Ready badge */}
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.1 3.1 6.8-6.8a1 1 0 0 1 1.4 0z"
            clipRule="evenodd"
          />
        </svg>
        Ready
      </span>

      {/* Filename + metadata */}
      <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
        {displayName}
      </h2>
      <p className="mt-1 text-slate-400">
        {formatDuration(duration)} · {formatBytes(bytes)} · {voice}
      </p>

      {/* Player: play button + waveform + time */}
      <div className="mt-6 flex items-center gap-5">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pause" : "Play"}
          className="grid h-14 w-14 flex-shrink-0 place-items-center rounded-full bg-slate-900 text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          {playing ? (
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg
              className="h-6 w-6 translate-x-0.5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.28-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14z" />
            </svg>
          )}
        </button>

        <button
          type="button"
          onClick={seek}
          aria-label="Seek"
          className="flex h-16 flex-1 items-center gap-1 overflow-hidden"
        >
          {WAVE_BARS.map((h, i) => {
            const filled = i / WAVE_BARS.length <= played;
            return (
              <span
                key={i}
                style={{ height: `${h}%` }}
                className={`w-1.5 flex-1 rounded-full transition-colors ${
                  filled ? "bg-brand" : "bg-brand/30 dark:bg-brand/25"
                }`}
              />
            );
          })}
        </button>

        <span className="flex-shrink-0 font-mono text-sm tabular-nums text-slate-400">
          {formatDuration(playing || current ? current : duration)}
        </span>

        <button
          type="button"
          onClick={cycleSpeed}
          aria-label="Playback speed"
          className="flex-shrink-0 rounded-lg border border-slate-300 px-2.5 py-1 font-mono text-sm font-semibold tabular-nums text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {rate}×
        </button>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onDownload}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3.5 font-semibold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v12m0 0 4-4m-4 4-4-4M4 20h16"
            />
          </svg>
          Download MP3
        </button>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-6 py-3.5 font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Convert another
        </button>
      </div>
    </div>
  );
}

function formatBytes(bytes) {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function FileCard({ name, size }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 px-5 py-4 dark:border-slate-800">
      <span className="grid h-14 w-12 flex-shrink-0 place-items-center rounded-xl bg-brand/10 text-xs font-bold tracking-wide text-brand dark:bg-brand/20">
        PDF
      </span>
      <div className="min-w-0">
        <p className="truncate text-lg font-semibold text-slate-900 dark:text-slate-100">
          {name || "document.pdf"}
        </p>
        {size > 0 && (
          <p className="mt-0.5 text-sm text-slate-400">{formatBytes(size)}</p>
        )}
      </div>
    </div>
  );
}

function ProgressBar({ label, pct, indeterminate }) {
  return (
    <div className="mt-8">
      <div className="flex items-baseline justify-between">
        <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
          {label}
        </span>
        {!indeterminate && (
          <span className="text-lg font-bold text-brand">{pct}%</span>
        )}
      </div>
      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className={`h-full rounded-full bg-brand transition-all duration-300 ${
            indeterminate ? "animate-pulse w-2/5" : ""
          }`}
          style={indeterminate ? undefined : { width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

