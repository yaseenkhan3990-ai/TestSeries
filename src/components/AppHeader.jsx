import StatsGrid from './StatsGrid'

export default function AppHeader({ onFileChange, stats }) {
  return (
    <section className="border-b border-[#dde8ee] bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-md bg-[#e9fbf4] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#06a86f]">
              <span className="h-2 w-2 rounded-full bg-[#08bd80]" />
              PDF question generator
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-normal text-[#172b4d] sm:text-4xl">
              Upload any-language PDF and generate objective Q&A
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-[#5f6c7b]">
              AI reads the PDF, understands the topic, and creates quiz-ready questions in the same language.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <label className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#08bd80] px-5 py-2 text-sm font-bold text-white shadow-[0_10px_24px_rgba(8,189,128,0.25)] transition hover:bg-[#06a86f]">
              Upload PDF
              <input type="file" accept="application/pdf" className="sr-only" onChange={onFileChange} />
            </label>
          </div>
        </div>

        <StatsGrid stats={stats} />
      </div>
    </section>
  )
}
