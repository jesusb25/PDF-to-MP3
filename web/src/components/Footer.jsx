import { Link } from 'react-router-dom'

const YEAR = 2026

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 sm:flex-row sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <span className="text-xl">🎧</span>
            <span className="font-semibold">PDF to Podcast</span>
          </div>
          <p className="mt-2 max-w-xs text-sm text-slate-500 dark:text-slate-400">
            Turn any PDF into downloadable audio. Built for accessibility and
            listening on the go.
          </p>
          <p className="mt-4 text-sm text-slate-400">
            &copy; {YEAR} Jesus Ballesteros
          </p>
        </div>

        <div>
          <h5 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Pages
          </h5>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link className="text-slate-500 transition hover:text-brand dark:text-slate-400" to="/">
                Home
              </Link>
            </li>
            <li>
              <Link className="text-slate-500 transition hover:text-brand dark:text-slate-400" to="/mission">
                Mission
              </Link>
            </li>
            <li>
              <Link className="text-slate-500 transition hover:text-brand dark:text-slate-400" to="/demo">
                Demo
              </Link>
            </li>
            <li>
              <a
                className="text-slate-500 transition hover:text-brand dark:text-slate-400"
                href="https://github.com/jesusb25/PDF-to-MP3"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
