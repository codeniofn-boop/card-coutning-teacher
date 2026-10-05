import TopBar from './TopBar.jsx';
import BottomNav from './BottomNav.jsx';

/** Standard page chrome: top stats bar, scrolling content, bottom tabs. */
export default function Shell({ children }) {
  return (
    <div className="min-h-full">
      <TopBar />
      <main className="mx-auto max-w-md px-4 pb-28 pt-4">{children}</main>
      <BottomNav />
    </div>
  );
}
