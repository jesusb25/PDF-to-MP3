export default function Demo() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:py-24">
      <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
        Here's how it works
      </h1>
      <p className="mt-3 text-lg text-slate-600 dark:text-slate-300">
        Watch the demo below.
      </p>

      <div className="mx-auto mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-2xl dark:border-slate-800">
        <video
          src={`${import.meta.env.BASE_URL}assets/demo.mov`}
          className="aspect-video w-full object-contain"
          autoPlay
          loop
          muted
          playsInline
          controls
        />
      </div>
    </section>
  )
}
