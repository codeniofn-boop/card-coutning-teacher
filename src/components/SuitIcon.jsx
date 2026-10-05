/** Suit glyphs as inline SVG so cards look identical on every platform. */
const PATHS = {
  H: <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />,
  D: <path d="M12 1.5L21 12l-9 10.5L3 12z" />,
  S: (
    <path d="M12 2c-.6.9-7.8 7.4-7.8 11.6 0 2.4 1.9 4.2 4.2 4.2 1.4 0 2.6-.6 3.3-1.6-.3 2.1-1.2 3.8-2.9 5.3h6.4c-1.7-1.5-2.6-3.2-2.9-5.3.7 1 1.9 1.6 3.3 1.6 2.3 0 4.2-1.8 4.2-4.2C19.8 9.4 12.6 2.9 12 2z" />
  ),
  C: (
    <g>
      <circle cx="12" cy="6.6" r="4.4" />
      <circle cx="6.8" cy="13.2" r="4.4" />
      <circle cx="17.2" cy="13.2" r="4.4" />
      <path d="M10.3 12.5h3.4c-.3 3.4.7 6.4 2.7 9h-8.8c2-2.6 3-5.6 2.7-9z" />
    </g>
  ),
};

export default function SuitIcon({ suit, className = '' }) {
  const red = suit === 'H' || suit === 'D';
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`${red ? 'fill-bad-500' : 'fill-ink-900'} ${className}`}>
      {PATHS[suit]}
    </svg>
  );
}
