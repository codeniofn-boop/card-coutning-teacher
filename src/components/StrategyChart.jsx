import { TABLES, UPCARDS } from '../game/basicStrategy.js';

/**
 * Colour-coded basic strategy chart for one section ('hard' | 'soft' | 'pairs').
 * Cells show the table code; the legend explains the fallbacks.
 */
const CELL = {
  H: { label: 'H', cls: 'bg-bad-100 text-bad-600' },
  S: { label: 'S', cls: 'bg-good-100 text-good-600' },
  D: { label: 'D', cls: 'bg-xp-400/40 text-xp-600' },
  Y: { label: 'Ds', cls: 'bg-xp-400/40 text-xp-600' },
  P: { label: 'P', cls: 'bg-brand-100 text-brand-700' },
  R: { label: 'Rh', cls: 'bg-ink-200 text-ink-700' },
  Z: { label: 'Rs', cls: 'bg-ink-200 text-ink-700' },
  W: { label: 'Rp', cls: 'bg-ink-200 text-ink-700' },
};

const ROW_LABEL = {
  hard: (k) => k,
  soft: (k) => `A,${Number(k) - 11}`,
  pairs: (k) => (k === 'A' ? 'A,A' : `${k},${k}`),
};

export default function StrategyChart({ section = 'hard', dealerHitsSoft17 = false, highlight = null }) {
  const table = (dealerHitsSoft17 ? TABLES.H17 : TABLES.S17)[section];
  let rows = Object.entries(table);
  if (section === 'hard') rows = rows.filter(([k]) => Number(k) >= 8 && Number(k) <= 17);
  if (section === 'soft') rows = rows.filter(([k]) => Number(k) <= 20);
  return (
    <div className="overflow-x-auto no-scrollbar">
      <table className="w-full border-separate border-spacing-0.5 text-center text-[11px] font-black tabular-nums">
        <thead>
          <tr>
            <th className="w-10 text-left text-ink-500">vs</th>
            {UPCARDS.map((u) => (
              <th key={u} className="text-ink-500">
                {u}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([key, codes]) => (
            <tr key={key}>
              <th className="text-left text-ink-700">{ROW_LABEL[section](key)}</th>
              {codes.split('').map((code, i) => {
                const hl = highlight && highlight.row === key && highlight.col === i;
                return (
                  <td key={i} className={`rounded ${CELL[code].cls} ${hl ? 'ring-2 ring-ink-900' : ''}`}>
                    {CELL[code].label}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-bold text-ink-500">
        <span>H hit</span>
        <span>S stand</span>
        <span>D double (else hit)</span>
        <span>Ds double (else stand)</span>
        <span>P split</span>
        <span>Rh surrender (else hit)</span>
        <span>Rs surrender (else stand)</span>
      </div>
    </div>
  );
}
