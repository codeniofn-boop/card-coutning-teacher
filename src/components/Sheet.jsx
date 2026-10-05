import { useEffect } from 'react';

/** Bottom sheet with a backdrop. Mobile-first; centred card on wide screens. */
export default function Sheet({ open, onClose, children, title }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-ink-900/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-3xl bg-white p-6 pb-safe shadow-2xl animate-rise sm:rounded-3xl sm:pb-6">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-ink-200 sm:hidden" />
        {title && <h2 className="mb-3 text-xl font-black">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
