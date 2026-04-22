import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import { useStore } from '../store/useStore';
import { EXERCISE_MAP } from '../data/exercises';
import { musclesDe } from '../data/labels';
import { exerciseHistory } from '../lib/progression';
import MiniSparkline from '../components/MiniSparkline';

export default function ExerciseDetail() {
  const { exerciseId } = useParams();
  const sessions = useStore(s => s.sessions);
  const ex = EXERCISE_MAP[exerciseId ?? ''];
  const history = exerciseHistory(exerciseId ?? '', sessions);

  if (!ex) {
    return (
      <div>
        <Header title="Übung" onBack />
        <div className="p-6 text-ink-400">Nicht gefunden.</div>
      </div>
    );
  }

  const weights = history.points.map(p => p.bestWeight);
  const volumes = history.points.map(p => p.volume);

  return (
    <div>
      <Header title={ex.name} subtitle={musclesDe(ex.primaryMuscles)} onBack />
      <div className="px-5 py-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Kpi label="Best kg" value={String(history.bestWeightEver || '–')} />
          <Kpi label="Einheiten" value={String(history.points.length)} />
          <Kpi label="Ø Vol" value={String(Math.round(volumes.reduce((a, b) => a + b, 0) / Math.max(1, volumes.length)))} />
        </div>

        <div className="card p-5">
          <div className="label mb-2">Gewichtsentwicklung</div>
          <MiniSparkline values={weights} />
        </div>
        <div className="card p-5">
          <div className="label mb-2">Volumen je Session</div>
          <MiniSparkline values={volumes} stroke="#6b7788" />
        </div>

        <div className="card p-5">
          <div className="label mb-3">Letzte Einheiten</div>
          <div className="space-y-2">
            {history.points.slice(-10).reverse().map((p, i) => (
              <div key={i} className="flex items-center justify-between text-sm border-b border-white/5 pb-2 last:border-0">
                <span className="text-ink-300">{p.date}</span>
                <span className="text-ink-100 tabular-nums">{p.bestWeight} kg · {p.bestReps} Wdh</span>
              </div>
            ))}
            {history.points.length === 0 && <p className="text-sm text-ink-400">Keine Daten.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="card px-4 py-3">
      <div className="text-xl font-semibold text-ink-100 tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-ink-400 mt-0.5">{label}</div>
    </div>
  );
}
