function StatsCard({ label, value }) {
  return (
    <div className="rounded-md border border-[#dde8ee] bg-[#f8fbfd] px-4 py-3 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7b8794]">{label}</p>
      <p className="mt-1 text-2xl font-black text-[#172b4d]">{value}</p>
    </div>
  )
}

export default function StatsGrid({ stats }) {
  const items = [
    ['Total', stats.total],
    ['Answered', stats.answered],
    ['Correct', stats.correct],
    ['Wrong', stats.wrong],
    ['Score', `${stats.percentage}%`],
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {items.map(([label, value]) => (
        <StatsCard key={label} label={label} value={value} />
      ))}
    </div>
  )
}
