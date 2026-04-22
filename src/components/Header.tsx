import { useNavigate } from 'react-router-dom';

interface Props {
  title: string;
  subtitle?: string;
  onBack?: boolean | (() => void);
  right?: React.ReactNode;
}

export default function Header({ title, subtitle, onBack, right }: Props) {
  const nav = useNavigate();
  const handleBack = () => {
    if (typeof onBack === 'function') onBack();
    else nav(-1);
  };
  return (
    <header className="sticky top-0 z-30 bg-gradient-to-b from-ink-950/95 to-ink-950/80 backdrop-blur px-5 pt-6 pb-3 border-b border-white/5">
      <div className="mx-auto max-w-xl flex items-center gap-3">
        {onBack && (
          <button
            aria-label="Zurück"
            onClick={handleBack}
            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-ink-200 hover:bg-white/10"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
              <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-ink-100 tracking-tight truncate">{title}</h1>
          {subtitle && <p className="text-xs sm:text-sm text-ink-400 truncate">{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  );
}
