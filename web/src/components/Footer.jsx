const YEAR = 2026

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 sm:flex-row sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5 text-slate-900 dark:text-slate-100">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm font-bold text-white">
              N
            </span>
            <span className="text-lg font-bold tracking-tight">Narrate</span>
          </div>
          <p className="mt-2 max-w-xs text-sm text-slate-500 dark:text-slate-400">
            Turn any PDF into downloadable audio. Built for accessibility and
            listening on the go.
          </p>
          <p className="mt-4 text-sm text-slate-400">
            &copy; {YEAR} Jesus Ballesteros
          </p>
        </div>
      </div>
    </footer>
  )
}
