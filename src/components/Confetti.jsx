import { useMemo } from 'react';

const COLORS = ['#5b5bff', '#22c55e', '#f5a524', '#ff4d6d', '#38bdf8', '#a855f7'];

/**
 * A burst of CSS confetti. Re-mounts (and replays) whenever `burst` changes.
 * Place inside a `relative` container; the burst is centred on it.
 */
export default function Confetti({ burst = 0, count = 18 }) {
  const pieces = useMemo(() => {
    const out = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const dist = 70 + Math.random() * 90;
      out.push({
        id: `${burst}-${i}`,
        dx: `${Math.cos(angle) * dist}px`,
        dy: `${Math.sin(angle) * dist - 40}px`,
        color: COLORS[i % COLORS.length],
        w: 6 + Math.round(Math.random() * 6),
        h: 6 + Math.round(Math.random() * 10),
        delay: `${Math.random() * 60}ms`,
        round: Math.random() > 0.5,
      });
    }
    return out;
  }, [burst, count]);

  if (!burst) return null;
  return (
    <div key={burst} className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className={`absolute left-1/2 top-1/2 animate-confetti ${p.round ? 'rounded-full' : 'rounded-sm'}`}
          style={{ '--dx': p.dx, '--dy': p.dy, backgroundColor: p.color, width: p.w, height: p.h, animationDelay: p.delay }}
        />
      ))}
    </div>
  );
}
