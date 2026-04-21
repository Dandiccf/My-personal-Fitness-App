interface Props {
  value: number | null;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
  placeholder?: string;
  ariaLabel?: string;
}

export default function NumberStepper({ value, onChange, step = 2.5, min = 0, max = 9999, suffix, placeholder = '—', ariaLabel }: Props) {
  const display = value == null || Number.isNaN(value) ? '' : String(value);
  const dec = () => onChange(Math.max(min, (value ?? 0) - step));
  const inc = () => onChange(Math.min(max, (value ?? 0) + step));

  return (
    <div className="flex items-center rounded-xl bg-ink-700/60 border border-white/5 overflow-hidden h-12">
      <button
        type="button"
        onClick={dec}
        aria-label="Weniger"
        className="w-12 h-full flex items-center justify-center text-ink-100 active:bg-white/10"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14" strokeLinecap="round" />
        </svg>
      </button>
      <div className="flex-1 px-2 flex items-center justify-center">
        <input
          aria-label={ariaLabel}
          type="number"
          inputMode="decimal"
          value={display}
          placeholder={placeholder}
          onChange={e => {
            const v = e.target.value;
            onChange(v === '' ? (NaN as unknown as number) : Number(v));
          }}
          className="w-full bg-transparent text-center text-lg font-semibold text-ink-100 focus:outline-none"
        />
        {suffix && <span className="text-xs text-ink-400 -ml-1">{suffix}</span>}
      </div>
      <button
        type="button"
        onClick={inc}
        aria-label="Mehr"
        className="w-12 h-full flex items-center justify-center text-ink-100 active:bg-white/10"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
