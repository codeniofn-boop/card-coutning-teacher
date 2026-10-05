import { formatCount } from '../game/countingSystems.js';

/** A coloured pill for a count value: green for +, rose for −, grey for 0. */
export default function CountChip({ value, size = 'md', className = '' }) {
  const tone = value > 0 ? 'bg-good-100 text-good-600' : value < 0 ? 'bg-bad-100 text-bad-600' : 'bg-ink-100 text-ink-700';
  const sz = size === 'lg' ? 'px-4 py-1.5 text-2xl' : size === 'sm' ? 'px-2 py-0.5 text-sm' : 'px-3 py-1 text-lg';
  return <span className={`inline-flex items-center justify-center rounded-full font-black tabular-nums ${tone} ${sz} ${className}`}>{formatCount(value)}</span>;
}
