/**
 * A discard tray drawn in CSS: a transparent holder with a stack of card edges.
 * `cards` sets the stack height; `referenceDecks` optionally draws tick marks for
 * one deck each as training wheels.
 */
export default function DiscardTray({ cards, maxCards = 416, referenceDecks = 0, height = 220 }) {
  const stackPx = Math.max(2, Math.round((cards / maxCards) * height));
  const stripes = Math.max(1, Math.round(stackPx / 3));
  return (
    <div className="flex items-end gap-3">
      <div className="relative flex items-end rounded-b-xl rounded-t-md border-x-[6px] border-b-[10px] border-ink-900/70 bg-ink-900/5 px-2 pt-2" style={{ height: height + 20, width: 96 }}>
        <div
          className="w-full rounded-sm shadow-md"
          style={{
            height: stackPx,
            background: `repeating-linear-gradient(to top, #ffffff 0 2px, #cfd3e6 2px 3px)`,
            backgroundSize: `100% ${Math.max(3, stackPx / stripes)}px`,
          }}
        />
        <div className="pointer-events-none absolute inset-x-1 top-0 h-full rounded-t-md border-x border-t border-white/60" />
      </div>
      {referenceDecks > 0 && (
        <div className="relative" style={{ height: height + 20 }}>
          {Array.from({ length: referenceDecks }, (_, i) => {
            const y = Math.round(((i + 1) * 52 * height) / maxCards);
            return (
              <div key={i} className="absolute left-0 flex items-center gap-1 text-[10px] font-black text-ink-500" style={{ bottom: y + 10 }}>
                <span className="block h-px w-3 bg-ink-300" />
                {i + 1}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
