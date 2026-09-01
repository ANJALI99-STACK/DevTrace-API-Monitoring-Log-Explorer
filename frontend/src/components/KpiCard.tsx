interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'good' | 'bad';
}

const toneStyles: Record<NonNullable<KpiCardProps['tone']>, string> = {
  default: 'text-slate-900 dark:text-white',
  good: 'text-emerald-600 dark:text-emerald-400',
  bad: 'text-rose-600 dark:text-rose-400',
};

export const KpiCard = ({ label, value, hint, tone = 'default' }: KpiCardProps) => {
  return (
    <div className="card p-5">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-semibold tracking-tight ${toneStyles[tone]}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
};
