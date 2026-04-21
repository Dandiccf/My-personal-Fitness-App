import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useStore } from '../store/useStore';
import { WORKOUT_TYPE_LABEL } from '../data/programTemplate';
import { formatFullDate, formatMinutes } from '../lib/dateUtils';

export default function SessionDetail() {
  const { id } = useParams();
  const sessions = useStore(s => s.sessions);
  const deleteSession = useStore(s => s.deleteSession);
  const nav = useNavigate();
  const s = sessions.find(x => x.id === id);

  if (!s) {
    return (
      <div>
        <Header title="Session" onBack />
        <div className="p-6 text-ink-400">Nicht gefunden.</div>
      </div>
    );
  }

  const totalVolume = s.exercises.reduce((sum, e) => sum + e.sets.reduce(
    (t, set) => t + (set.completed ? (set.actualWeight ?? 0) * (set.actualReps ?? 0) : 0), 0
  ), 0);

  return (
    <div>
      <Header title={WORKOUT_TYPE_LABEL[s.workoutType]} subtitle={formatFullDate(s.date)} onBack />
      <div className="px-5 py-4 space-y-4">
        <div className="card p-5 grid grid-cols-3 gap-3">
          <Stat label="Dauer" value={formatMinutes(Math.round((s.durationSec ?? 0) / 60))} />
          <Stat label="Volumen" value={`${Math.round(totalVolume)} kg·W`} />
          <Stat label="Woche" value={`${s.weekIndex}`} />
        </div>
        {s.notes && <div className="card p-4 text-sm text-ink-200 italic">„{s.notes}"</div>}

        {s.exercises.map((ex, i) => (
          <div key={i} className={`card p-4 ${ex.removedByQuickMode ? 'opacity-60' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="font-semibold text-ink-100">{ex.name}</div>
                <div className="text-xs text-ink-400 capitalize">{ex.movementPattern.replace('_', ' ')}</div>
              </div>
              {ex.skipped && <span className="chip-danger">Skipped</span>}
              {ex.removedByQuickMode && <span className="chip-warn">Quick Mode</span>}
            </div>
            <div className="space-y-1.5">
              {ex.sets.map((set, j) => (
                <div key={j} className="flex items-center justify-between text-sm">
                  <span className="text-ink-400">Satz {j + 1}</span>
                  <span className={`tabular-nums ${set.completed ? 'text-ink-100' : 'text-ink-500'}`}>
                    {set.completed
                      ? `${set.actualWeight ?? '–'} kg × ${set.actualReps ?? '–'} Wdh${set.rir != null ? ` · RIR ${set.rir}` : ''}`
                      : '—'}
                  </span>
                </div>
              ))}
            </div>
            {ex.notes && <div className="mt-2 text-xs text-ink-300 italic">{ex.notes}</div>}
          </div>
        ))}

        <button
          className="btn-danger w-full"
          onClick={async () => {
            if (confirm('Session wirklich löschen?')) {
              await deleteSession(s.id);
              nav('/history');
            }
          }}
        >Session löschen</button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-ink-400">{label}</div>
      <div className="text-lg font-semibold text-ink-100 mt-0.5">{value}</div>
    </div>
  );
}
