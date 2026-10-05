import SuitIcon from './SuitIcon.jsx';
import { SUIT_INFO } from '../game/cards.js';

/**
 * A playing card drawn with CSS and SVG only.
 *   size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
 */
const SIZES = {
  xs: { box: 'w-9', corner: 'text-[10px] leading-none', pip: 'w-3 h-3', center: 'w-4 h-4', face: 'text-sm', radius: 'rounded-md', pad: 'p-0.5' },
  sm: { box: 'w-12', corner: 'text-xs leading-none', pip: 'w-3.5 h-3.5', center: 'w-6 h-6', face: 'text-xl', radius: 'rounded-lg', pad: 'p-1' },
  md: { box: 'w-16', corner: 'text-base leading-none', pip: 'w-3.5 h-3.5', center: 'w-7 h-7', face: 'text-2xl', radius: 'rounded-xl', pad: 'p-1' },
  lg: { box: 'w-28', corner: 'text-2xl leading-none', pip: 'w-5 h-5', center: 'w-14 h-14', face: 'text-5xl', radius: 'rounded-2xl', pad: 'p-2' },
  xl: { box: 'w-40', corner: 'text-3xl leading-none', pip: 'w-7 h-7', center: 'w-20 h-20', face: 'text-7xl', radius: 'rounded-3xl', pad: 'p-3' },
};

export default function PlayingCard({ card, size = 'md', faceDown = false, className = '', style, animate = true }) {
  const s = SIZES[size] || SIZES.md;
  const anim = animate ? 'animate-flip-in' : '';

  if (faceDown || !card) {
    return (
      <div
        className={`${s.box} aspect-[5/7] ${s.radius} border-2 border-white bg-brand-600 shadow-md ${anim} ${className}`}
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(255,255,255,0.18) 0 6px, transparent 6px 12px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.18) 0 6px, transparent 6px 12px)',
          ...style,
        }}
      />
    );
  }

  const red = SUIT_INFO[card.suit].color === 'red';
  const color = red ? 'text-bad-500' : 'text-ink-900';
  const isFace = card.rank === 'J' || card.rank === 'Q' || card.rank === 'K';

  return (
    <div
      className={`relative ${s.box} aspect-[5/7] ${s.radius} bg-white border border-ink-200 shadow-[0_4px_0_rgba(20,20,43,0.08),0_8px_20px_rgba(20,20,43,0.12)] select-none ${anim} ${className}`}
      style={style}
      role="img"
      aria-label={`${card.rank} of ${SUIT_INFO[card.suit].name}`}
    >
      <Corner rank={card.rank} suit={card.suit} s={s} color={color} className={`top-0 left-0 ${s.pad}`} />
      <Corner rank={card.rank} suit={card.suit} s={s} color={color} className={`bottom-0 right-0 ${s.pad} rotate-180`} />
      <div className="absolute inset-0 flex items-center justify-center">
        {isFace ? (
          <div className={`flex flex-col items-center ${color} font-black ${s.face}`}>
            <span>{card.rank}</span>
          </div>
        ) : (
          <SuitIcon suit={card.suit} className={s.center} />
        )}
      </div>
      {isFace && <div className={`absolute inset-[18%] ${s.radius} border border-ink-100`} />}
    </div>
  );
}

function Corner({ rank, suit, s, color, className }) {
  return (
    <div className={`absolute flex flex-col items-center font-black ${color} ${s.corner} ${className}`}>
      <span>{rank}</span>
      <SuitIcon suit={suit} className={`${s.pip} mt-0.5`} />
    </div>
  );
}
