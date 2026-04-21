import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { useStore } from '../store/useStore';
import { WORKOUT_TYPE_LABEL } from '../data/programTemplate';
import { formatFullDate, formatMinutes } from '../lib/dateUtils';

type Tab = 'gym' | 'cardio';

export default function History() {
  const sessions = useStore(s => s.sessions);
  const cardio = useStore(s => s.cardio);
  const deleteCardio = useStore(s => s.deleteCardio);
  const deleteSession = useStore(s => s.deleteSession);
  const [tab, setTab] = useState<Tab>('gym');

  const gymSessions = useMemo(
    () => sessions.filter(s => s.workoutType.startsWith('gym')).slice().reverse(),
    [sessions]
  );
  const cardioList = useMemo(() => cardio.slice().reverse(), [cardio]);

  return (
    <div>
      <Header title="Verlauf" />
      <div className="px-5 py-4 space-y-4">
        <div className="flex rounded-xl bg-white/5 p-1 text-sm">
          <TabBtn active={tab === 'gym'} onClick={() => setTab('gym')}>Kraft</TabBtn>
          <TabBtn active={tab === 'cardio'} onClick={() => setTab('cardio')}>Cardio</TabBtn>
        </div>

        {tab === 'gym' && (
          <div className="space-y-3">
            {gymSessions.length === 0 && <EmptyMsg text="Noch keine Krafttrainings geloggt." />}
            {gymSessions.map(s => {
              const totalSets = s.exercises.reduce((sum, e) => sum + e.sets.length, 0);
              const doneSets = s.exercises.reduce((sum, e) => sum + e.sets.filter(x => x.completed).length, 0);
              const volume = s.exercises.reduce((sum, e) => sum + e.sets.reduce(
                (t, set) => t + (set.completed ? (set.actualWeight ?? 0) * (set.actualReps ?? 0) : 0), 0
              ), 0);
              return (
                <Link key={s.id} to={`/history/${s.id}`} className="card p-4 flex items-center justify-between hover:bg-ink-700/40 transition">
                  <div>
                    <div className="text-ink-100 font-semibold">{WORKOUT_TYPE_LABEL[s.workoutType]}</div>
                    <div className="text-xs text-ink-400 mt-0.5">{formatFullDate(s.date)}</div>
                    <div className="mt-2 flex gap-2">
                      <span className="chip">{doneSets}/{totalSets} Sätze</span>
                      <span className="chip">{formatMinutes(Math.round((s.durationSec ?? 0) / 60))}</span>
                      <span className="chip">{Math.round(volume)} kg·W</span>
                    </div>
                  </div>
                  <span className="text-accent-400 text-xl">›</span>
                </Link>
              );
            })}
          </div>
        )}

        {tab === 'cardio' && (
          <div className="space-y-3">
            <Link to="/cardio/new" className="btn-primary w-full">Neue Cardio-Einheit</Link>
            {cardioList.length === 0 && <EmptyMsg text="Noch keine Cardio-Einheiten geloggt." />}
            {cardioList.map(c => (
              <div key={c.id} className="card p-4 flex items-center justify-between">
                <div>
                  <div className="text-ink-100 font-semibold">{cardioLabel(c.type)}</div>
                  <div className="text-xs text-ink-400 mt-0.5">{formatFullDate(c.date)}</div>
                  <div className="mt-2 flex gap-2 flex-wrap">
                    <span className="chip">{c.durationMin} Min</span>
                    {c.distanceKm != null && <span className="chip">{c.distanceKm} km</span>}
                    {c.avgPace && <span className="chip">{c.avgPace}/km</span>}
                    {c.rpe != null && <span className="chip">RPE {c.rpe}</span>}
                  </div>
                  {c.notes && <div className="text-xs text-ink-300 mt-2 italic">{c.notes}</div>}
                </div>
                <button onClick={() => confirm('Eintrag löschen?') && deleteCardio(c.id)} className="text-ink-400 text-sm">✕</button>
              </div>
            ))}
          </div>
        )}

        {tab === 'gym' && gymSessions.length > 0 && (
          <div className="text-xs text-ink-500 text-center pt-2">
            Tipp: Session öffnen, dann am Ende löschbar.
          </div>
        )}
      </div>
    </div>
  );
}

function TabBtn({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex-1 py-2.5 rounded-lg font-medium ${active ? 'bg-accent-500 text-ink-900' : 'text-ink-300'}`}>{children}</button>
  );
}

function EmptyMsg({ text }: { text: string }) {
  return <div className="card p-8 text-center text-ink-400 text-sm">{text}</div>;
}

function cardioLabel(t: string) {
  switch (t) {
    case 'run_easy': return 'Lauf locker';
    case 'run_long': return 'Langer Lauf';
    case 'mtb': return 'MTB';
    case 'intervals': return 'Intervalle';
    default: return t;
  }
}
