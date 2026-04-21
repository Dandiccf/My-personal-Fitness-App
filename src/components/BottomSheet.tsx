import { useEffect } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function BottomSheet({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-ink-800 border-t border-white/5 rounded-t-3xl shadow-card max-h-[85vh] overflow-y-auto safe-pb">
        <div className="sticky top-0 bg-ink-800 z-10 px-5 pt-3 pb-2 border-b border-white/5">
          <div className="mx-auto w-12 h-1.5 rounded-full bg-white/10 mb-3" />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink-100">{title}</h2>
            <button onClick={onClose} className="text-sm text-ink-300 hover:text-ink-100 px-2 py-1">Schließen</button>
          </div>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
