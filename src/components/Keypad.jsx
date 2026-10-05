import { useEffect } from 'react';
import Button from './Button.jsx';
import { parseCountInput } from '../game/drills.js';

/**
 * Numeric keypad for entering a running count. `value` is a string such as
 * "-3" or "2.5". Hardware keyboards work too (digits, -, +, ., Backspace, Enter).
 */
export default function Keypad({ value, onChange, onSubmit, allowHalf = false, disabled = false, submitLabel = 'Check', autoFocus = true }) {
  const press = (key) => {
    if (disabled) return;
    if (key === 'back') {
      onChange(value.endsWith('.5') ? value.slice(0, -2) : value.slice(0, -1));
    } else if (key === 'sign') {
      onChange(value.startsWith('-') ? value.slice(1) : `-${value}`);
    } else if (key === 'half') {
      if (value.endsWith('.5')) onChange(value.slice(0, -2));
      else onChange(`${value === '' || value === '-' ? `${value}0` : value}.5`);
    } else {
      if (value.endsWith('.5')) return;
      const digits = value.replace('-', '');
      if (digits.length >= 3) return;
      if (digits === '0') onChange(value.replace('0', key));
      else onChange(value + key);
    }
  };

  const parsed = parseCountInput(value);
  const canSubmit = parsed !== null && !disabled;

  useEffect(() => {
    if (!autoFocus) return undefined;
    const onKey = (e) => {
      if (disabled) return;
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === '-' || e.key === '+') press('sign');
      else if (e.key === '.' && allowHalf) press('half');
      else if (e.key === 'Backspace') press('back');
      else if (e.key === 'Enter' && canSubmit) onSubmit(parsed);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const display = value === '' ? '?' : value.replace('-', '−').replace('.5', '½');

  return (
    <div className="w-full">
      <div className={`mx-auto mb-3 flex h-16 w-40 items-center justify-center rounded-2xl border-2 bg-white text-4xl font-black tabular-nums ${value === '' ? 'border-ink-200 text-ink-300' : 'border-brand-300 text-ink-900'}`}>
        {display}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((k) => (
          <Key key={k} onClick={() => press(k)} disabled={disabled}>
            {k}
          </Key>
        ))}
        <Key onClick={() => press('sign')} disabled={disabled} tone="accent">
          +/−
        </Key>
        <Key onClick={() => press('0')} disabled={disabled}>
          0
        </Key>
        <Key onClick={() => press('back')} disabled={disabled} tone="accent" aria-label="Backspace">
          ⌫
        </Key>
        {allowHalf && (
          <Key onClick={() => press('half')} disabled={disabled} tone="accent" className="col-span-3">
            ½
          </Key>
        )}
      </div>
      <Button full size="lg" variant={canSubmit ? 'success' : 'neutral'} className="mt-3" disabled={!canSubmit} onClick={() => onSubmit(parsed)}>
        {submitLabel}
      </Button>
    </div>
  );
}

function Key({ children, tone = 'plain', className = '', ...props }) {
  const style = tone === 'accent' ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-white border-ink-200 text-ink-900';
  return (
    <button type="button" className={`btn-3d h-14 text-2xl normal-case tracking-normal ${style} ${className}`} {...props}>
      {children}
    </button>
  );
}
