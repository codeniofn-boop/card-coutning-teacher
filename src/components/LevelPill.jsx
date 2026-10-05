const STYLES = {
  beginner: 'bg-good-100 text-good-600',
  intermediate: 'bg-sky-100 text-sky-700',
  advanced: 'bg-violet-100 text-violet-700',
  expert: 'bg-bad-100 text-bad-600',
};

export default function LevelPill({ level }) {
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${STYLES[level] || STYLES.beginner}`}>{level}</span>;
}
