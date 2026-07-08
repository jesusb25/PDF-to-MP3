import { useState } from 'react'

const OPTIONS = [
  { value: 'light', label: 'Light', icon: SunIcon },
  { value: 'dark', label: 'Dark', icon: MoonIcon },
  { value: 'auto', label: 'Auto', icon: AutoIcon },
]

export default function ThemeToggle({ theme, setTheme }) {
  const [open, setOpen] = useState(false)
  const active = OPTIONS.find((o) => o.value === theme) ?? OPTIONS[2]
  const ActiveIcon = active.icon

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        aria-label={`Toggle theme (${active.label})`}
        aria-expanded={open}
        className="flex items-center gap-1 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white transition hover:bg-white/20"
      >
        <ActiveIcon className="h-4 w-4" />
      </button>
      {open && (
        <ul className="absolute right-0 z-50 mt-2 w-36 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-800">
          {OPTIONS.map(({ value, label, icon: Icon }) => (
            <li key={value}>
              <button
                type="button"
                onClick={() => {
                  setTheme(value)
                  setOpen(false)
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-slate-100 dark:hover:bg-slate-700 ${
                  theme === value
                    ? 'font-semibold text-brand dark:text-brand-light'
                    : 'text-slate-700 dark:text-slate-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {theme === value && <CheckIcon className="ml-auto h-4 w-4" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function SunIcon(props) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
      <path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z" />
    </svg>
  )
}

function MoonIcon(props) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
      <path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278z" />
    </svg>
  )
}

function AutoIcon(props) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
      <path d="M8 15A7 7 0 1 0 8 1v14zm0 1A8 8 0 1 1 8 0a8 8 0 0 1 0 16z" />
    </svg>
  )
}

function CheckIcon(props) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
      <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
    </svg>
  )
}
