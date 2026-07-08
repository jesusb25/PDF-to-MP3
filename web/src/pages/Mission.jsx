import { Link } from 'react-router-dom'

export default function Mission() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
            Why PDF to Podcast?
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
            PDF to Podcast bridges my podcast enthusiasm with accessibility's
            impact. This project converts PDFs into captivating audio, serving
            both the visually impaired and multitaskers. Fueled by my love for
            podcasts, I set out to unite audio's allure with inclusive
            information consumption. This isn't just tech — it's the magic of
            immersive content. Join me in transforming knowledge, one podcast at
            a time.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="https://github.com/jesusb25/PDF-to-MP3"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 font-semibold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49v-1.7c-2.78.62-3.37-1.36-3.37-1.36-.45-1.18-1.11-1.5-1.11-1.5-.91-.63.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.34 1.12 2.91.85.09-.66.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05a9.36 9.36 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.93-2.35 4.8-4.58 5.05.36.32.68.94.68 1.9v2.82c0 .27.18.6.69.49A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2z" />
              </svg>
              GitHub Repo
            </a>
            <Link
              to="/demo"
              className="inline-flex items-center gap-2 rounded-xl border border-brand px-5 py-3 font-semibold text-brand transition hover:bg-brand/10 dark:text-brand-light"
            >
              Watch demo
            </Link>
          </div>
        </div>

        <div className="relative">
          <div
            aria-hidden
            className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-brand/30 to-transparent blur-2xl"
          />
          <img
            src={`${import.meta.env.BASE_URL}images/listening.jpg`}
            alt="A person listening to audio through headphones"
            width={700}
            height={500}
            loading="lazy"
            className="relative w-full rounded-2xl border border-slate-200 object-cover shadow-xl dark:border-slate-800"
          />
        </div>
      </div>
    </section>
  )
}
