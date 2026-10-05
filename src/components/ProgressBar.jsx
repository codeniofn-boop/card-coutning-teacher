const COLORS = {
  brand: 'bg-brand-500',
  good: 'bg-good-500',
  xp: 'bg-xp-500',
  flame: 'bg-flame-500',
  bad: 'bg-bad-500',
  ink: 'bg-ink-300',
};

export default function ProgressBar({ value = 0, color = 'good', className = '', height = 'h-3', animated = true }) {
  const pct = Math.max(0, Math.min(100, value * 100));
  return (
    <div className={`w-full ${height} rounded-full bg-ink-100 overflow-hidden ${className}`}>
      <div className={`h-full rounded-full ${COLORS[color]} ${animated ? 'transition-[width] duration-500 ease-out' : ''}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
