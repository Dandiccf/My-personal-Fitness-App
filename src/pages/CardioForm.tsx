import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useStore } from '../store/useStore';
import { todayISO } from '../lib/dateUtils';
import type { CardioSession } from '../types';

export default function CardioForm() {
  const addCardio = useStore(s => s.addCardio);
  const nav = useNavigate();

  const [type, setType] = useState<CardioSession['type']>('run_easy');
  const [durationMin, setDurationMin] = useState(35);
  const [distanceKm, setDistanceKm] = useState<number | ''>('');
  const [rpe, setRpe] = useState(3);
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(todayISO());

  const submit = async () => {
    const entry: Omit<CardioSession, 'id'> = {
      date,
      type,
      durationMin,
      distanceKm: distanceKm === '' ? undefined : Number(distanceKm),
      rpe,
      notes: notes || undefined
    };
    await addCardio(entry);
    nav('/history');
  };

  return (
    <div>
      <Header title="Cardio loggen" onBack />
      <div className="px-5 py-4 space-y-5">
        <div>
          <div className="label mb-2">Art</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: 'run_easy', l: 'Lauf locker' },
              { v: 'run_long', l: 'Langer Lauf' },
              { v: 'mtb', l: 'MTB' },
              { v: 'intervals', l: 'Intervalle' }
            ].map(t => (
              <button
                key={t.v}
                onClick={() => setType(t.v as any)}
                className={`py-3 rounded-xl font-medium ${type === t.v ? 'bg-accent-500 text-ink-900' : 'bg-white/5 text-ink-200'}`}
              >{t.l}</button>
            ))}
          </div>
        </div>

        <div>
          <div className="label mb-2">Datum</div>
          <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
        </div>

        <div>
          <div className="label mb-2">Dauer (Min)</div>
          <div className="grid grid-cols-5 gap-2">
            {[20, 30, 40, 60, 90].map(v => (
              <button
                key={v}
                onClick={() => setDurationMin(v)}
                className={`py-3 rounded-xl font-semibold ${durationMin === v ? 'bg-accent-500 text-ink-900' : 'bg-white/5 text-ink-200'}`}
              >{v}</button>
            ))}
          </div>
          <input
            type="number" inputMode="numeric"
            className="input mt-3"
            value={durationMin}
            onChange={e => setDurationMin(Number(e.target.value) || 0)}
          />
        </div>

        <div>
          <div className="label mb-2">Distanz (km, optional)</div>
          <input
            type="number" inputMode="decimal" step="0.1"
            className="input"
            value={distanceKm}
            onChange={e => setDistanceKm(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="z. B. 5.0"
          />
        </div>

        <div>
          <div className="label mb-2">Anstrengung (RPE 1–10)</div>
          <div className="grid grid-cols-10 gap-1">
            {Array.from({ length: 10 }, (_, i) => i + 1).map(v => (
              <button
                key={v}
                onClick={() => setRpe(v)}
                className={`py-3 rounded-lg text-sm font-medium ${rpe === v ? 'bg-accent-500 text-ink-900' : 'bg-white/5 text-ink-200'}`}
              >{v}</button>
            ))}
          </div>
        </div>

        <div>
          <div className="label mb-2">Notizen</div>
          <textarea
            className="input min-h-[100px]"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Wie lief's? Route, Gefühl ..."
          />
        </div>

        <button className="btn-primary w-full" onClick={submit}>Speichern</button>
      </div>
    </div>
  );
}
