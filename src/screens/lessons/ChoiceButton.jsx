/** Big tappable answer button used by the flashcard-style drills. */
export default function ChoiceButton({ children, state = 'idle', onClick, disabled }) {
  const styles = {
    idle: 'bg-white border-ink-200 text-ink-900',
    correct: 'bg-good-500 border-good-600 text-white animate-pop',
    wrong: 'bg-bad-500 border-bad-600 text-white animate-shake',
    dim: 'bg-white border-ink-100 text-ink-300',
  };
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`btn-3d h-16 text-2xl normal-case tracking-normal tabular-nums ${styles[state]}`}>
      {children}
    </button>
  );
}
