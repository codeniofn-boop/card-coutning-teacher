import { valueGroups } from '../game/countingSystems.js';
import CountChip from './CountChip.jsx';

/** The tag chart for a system: one row per value, ranks as little tiles. */
export default function ValueChart({ system, compact = false }) {
  const groups = valueGroups(system);
  return (
    <div className={`flex flex-col ${compact ? 'gap-1.5' : 'gap-2.5'}`}>
      {groups.map((g) => (
        <div key={g.value} className="flex items-center gap-3">
          <CountChip value={g.value} size={compact ? 'sm' : 'md'} className="w-14 shrink-0" />
          <div className="flex flex-wrap gap-1">
            {g.ranks.map((r) => (
              <span
                key={r.rank + (r.color || '')}
                className={`inline-flex items-center rounded-md border border-ink-200 bg-white font-extrabold ${compact ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-sm'}`}
              >
                {r.rank}
                {r.color === 'red' && <span className="ml-0.5 text-bad-500">♥♦</span>}
                {r.color === 'black' && <span className="ml-0.5 text-ink-900">♠♣</span>}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
