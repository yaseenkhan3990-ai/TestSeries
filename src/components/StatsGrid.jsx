function StatsCard({ label, value, type }) {
  const getColorScheme = () => {
    switch (type) {
      case 'total':
        return 'from-indigo-500/10 to-indigo-600/5 text-indigo-700 border-indigo-100/50'
      case 'answered':
        return 'from-slate-500/10 to-slate-600/5 text-slate-700 border-slate-200/50'
      case 'correct':
        return 'from-emerald-500/10 to-emerald-600/5 text-emerald-700 border-emerald-100/50'
      case 'wrong':
        return 'from-rose-500/10 to-rose-600/5 text-rose-700 border-rose-100/50'
      case 'score':
        return 'from-teal-500/10 to-teal-600/5 text-teal-700 border-teal-100/50'
      default:
        return 'from-slate-500/10 to-slate-600/5 text-slate-700 border-slate-200/50'
    }
  }

  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${getColorScheme()} px-5 py-4 shadow-sm hover:scale-102 transition duration-200 hover:shadow-md`}>
      <p className="text-xs font-black uppercase tracking-widest opacity-80">{label}</p>
      <p className="mt-2 text-2xl sm:text-3xl font-black tracking-tight">{value}</p>
    </div>
  )
}

export default function StatsGrid({ stats }) {
  const items = [
    { label: 'Total Questions', value: stats.total, type: 'total' },
    { label: 'Answered', value: stats.answered, type: 'answered' },
    { label: 'Correct Answers', value: stats.correct, type: 'correct' },
    { label: 'Incorrect Answers', value: stats.wrong, type: 'wrong' },
    { label: 'Success Score', value: `${stats.percentage}%`, type: 'score' },
  ]

  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 animate-slide-up">
      {items.map((item) => (
        <StatsCard key={item.label} label={item.label} value={item.value} type={item.type} />
      ))}
    </div>
  )
}
