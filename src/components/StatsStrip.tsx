type Stat = { label: string; value: string; hint?: string };

const StatsStrip = ({ stats }: { stats: Stat[] }) => (
  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
    {stats.map((stat) => (
      <div
        key={stat.label}
        className="card flex flex-col gap-1 rounded-2xl border border-slate-100/70 p-4 dark:border-slate-800"
      >
        <div className="text-xs uppercase tracking-wide text-slate-500">{stat.label}</div>
        <div className="text-2xl font-semibold text-slate-900 dark:text-white">{stat.value}</div>
        {stat.hint && <div className="text-xs text-slate-500">{stat.hint}</div>}
      </div>
    ))}
  </div>
);

export default StatsStrip;
