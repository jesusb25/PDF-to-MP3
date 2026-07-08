import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import ThemeToggle from './ThemeToggle.jsx'

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/mission', label: 'Mission' },
  { to: '/demo', label: 'Demo' },
]

export default function Navbar({ theme, setTheme }) {
  const [open, setOpen] = useState(false)

  const linkClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive
        ? 'bg-white/15 text-white'
        : 'text-slate-300 hover:bg-white/10 hover:text-white'
    }`

  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-slate-900/90 backdrop-blur supports-[backdrop-filter]:bg-slate-900/70">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <NavLink to="/" className="flex items-center gap-2 text-white">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-lg">
            🎧
          </span>
          <span className="text-base font-semibold tracking-tight">
            PDF to Podcast
          </span>
        </NavLink>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
          <div className="ml-2">
            <ThemeToggle theme={theme} setTheme={setTheme} />
          </div>
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle theme={theme} setTheme={setTheme} />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation"
            aria-expanded={open}
            className="rounded-lg border border-white/15 p-2 text-white"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-white/10 px-4 pb-3 md:hidden">
          <div className="flex flex-col gap-1 pt-2">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                onClick={() => setOpen(false)}
                className={linkClass}
              >
                {l.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
