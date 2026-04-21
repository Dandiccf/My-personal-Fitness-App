import { useEffect, useRef, useState } from 'react';
import { formatDuration } from '../lib/dateUtils';
import { useStore } from '../store/useStore';

interface Props {
  initialSec: number;
  onDismiss: () => void;
  onDone?: (elapsed: number) => void;
}

export default function RestTimer({ initialSec, onDismiss, onDone }: Props) {
  const settings = useStore(s => s.settings);
  const [remain, setRemain] = useState(initialSec);
  const [paused, setPaused] = useState(false);
  const endAt = useRef(Date.now() + initialSec * 1000);
  const firedRef = useRef(false);

  useEffect(() => {
    endAt.current = Date.now() + initialSec * 1000;
    setRemain(initialSec);
    firedRef.current = false;
  }, [initialSec]);

  useEffect(() => {
    if (paused) return;
    const tick = () => {
      const msLeft = endAt.current - Date.now();
      const s = Math.max(0, Math.ceil(msLeft / 1000));
      setRemain(s);
      if (s <= 0 && !firedRef.current) {
        firedRef.current = true;
        if (settings?.vibrationEnabled && 'vibrate' in navigator) navigator.vibrate?.([80, 60, 80]);
        if (settings?.soundEnabled) beep();
        onDone?.(initialSec);
      }
    };
    tick();
    const h = window.setInterval(tick, 250);
    return () => window.clearInterval(h);
  }, [paused, initialSec, onDone, settings?.soundEnabled, settings?.vibrationEnabled]);

  const adjust = (delta: number) => {
    endAt.current = Math.max(Date.now(), endAt.current + delta * 1000);
    setRemain(Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000)));
    firedRef.current = false;
  };

  const togglePause = () => {
    if (paused) {
      endAt.current = Date.now() + remain * 1000;
    }
    setPaused(!paused);
  };

  const pct = Math.min(100, Math.max(0, (remain / initialSec) * 100));
  const done = remain <= 0;

  return (
    <div className="fixed inset-x-0 bottom-[72px] z-40 px-3 safe-pb">
      <div className={`mx-auto max-w-xl card px-5 py-4 ${done ? 'ring-2 ring-accent-500/60' : ''}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${done ? 'bg-accent-400' : 'bg-warn-500'} ${!done ? 'pulse-ring relative' : ''}`} />
            <span className="text-sm text-ink-300">{done ? 'Pause fertig' : 'Pause läuft'}</span>
          </div>
          <button onClick={onDismiss} className="text-ink-300 text-sm px-2 py-1 rounded hover:bg-white/5">Schließen</button>
        </div>
        <div className="flex items-end justify-between mb-3">
          <div className={`text-5xl font-semibold tabular-nums ${done ? 'text-accent-400' : 'text-ink-100'}`}>{formatDuration(remain)}</div>
          <div className="text-xs text-ink-400">Ziel: {formatDuration(initialSec)}</div>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div className={`h-full ${done ? 'bg-accent-500' : 'bg-warn-500'}`} style={{ width: `${pct}%`, transition: 'width 200ms linear' }} />
        </div>
        <div className="grid grid-cols-4 gap-2 mt-4">
          <button className="btn-ghost py-3 text-sm" onClick={() => adjust(-15)}>-15</button>
          <button className="btn-ghost py-3 text-sm" onClick={togglePause}>{paused ? 'Weiter' : 'Pause'}</button>
          <button className="btn-ghost py-3 text-sm" onClick={() => adjust(15)}>+15</button>
          <button className="btn-ghost py-3 text-sm" onClick={() => adjust(30)}>+30</button>
        </div>
      </div>
    </div>
  );
}

function beep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = 660;
    g.gain.value = 0.08;
    o.connect(g).connect(ctx.destination);
    o.start();
    setTimeout(() => { o.frequency.value = 880; }, 120);
    setTimeout(() => { o.stop(); ctx.close(); }, 260);
  } catch {}
}
