export default function EmptyQuestions() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200/80 bg-white/40 backdrop-blur-sm p-12 text-center shadow-sm animate-slide-up flex flex-col items-center justify-center">
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-400 to-indigo-500 text-white font-black text-2xl shadow-lg shadow-indigo-100 animate-bounce">
        Q
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-teal-500"></span>
        </span>
      </div>
      <h3 className="mt-6 text-lg font-black text-slate-800 tracking-wide">No Questions Loaded Yet</h3>
      <p className="mx-auto mt-2 max-w-sm text-xs font-semibold leading-relaxed text-slate-400">
        Upload a study PDF or Q&A photo from the top, select your language filters, and watch Google AI assemble a custom interactive test suite for you.
      </p>
    </div>
  )
}
