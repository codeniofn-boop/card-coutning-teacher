const VARIANTS = {
  primary: 'btn-3d bg-brand-500 border-brand-700 text-white',
  secondary: 'btn-3d bg-white border-ink-200 text-brand-600',
  success: 'btn-3d bg-good-500 border-good-600 text-white',
  danger: 'btn-3d bg-bad-500 border-bad-600 text-white',
  xp: 'btn-3d bg-xp-500 border-xp-600 text-white',
  neutral: 'btn-3d bg-ink-100 border-ink-200 text-ink-700',
  ghost: 'rounded-2xl font-extrabold uppercase tracking-wide text-ink-500 hover:bg-ink-100 active:bg-ink-200',
};

const SIZES = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3.5 text-base',
  lg: 'px-8 py-4 text-lg',
};

export default function Button({ variant = 'primary', size = 'md', full = false, className = '', children, ...props }) {
  return (
    <button type="button" className={`${VARIANTS[variant]} ${SIZES[size]} ${full ? 'w-full' : ''} ${className}`} {...props}>
      {children}
    </button>
  );
}
