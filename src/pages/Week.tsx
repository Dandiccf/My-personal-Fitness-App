import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { useStore } from '../store/useStore';
import { PROGRAM, WEEKDAY_LONG_DE, WORKOUT_TYPE_LABEL } from '../data/programTemplate';
import { addDays, startOfWeek, toISODate, weekdayIndex } from '../lib/dateUtils';
import { computeWeekContext } from '../lib/volumeEngine';

export default function Week() {
  const settings = useStore(s => s.settings)!;
  const sessions = useStore(s => s.sessions);

  const today = new Date();
  const weekStart = startOfWeek(today);
  const ctx = useMemo(
    () => computeWeekContext(settings.programStartDate, today, settings.blockWeeks),
    [settings.programStartDate, settings.blockWeeks]
  );

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    const iso = toISODate(d);
    const entry = PROGRAM.schedule.find(s => s.dayOfWeek === i);
    const completed = sessions.some(s => s.completed && s.date === iso);
    const isToday = toISODate(today) === iso;
    return { i, date: d, iso, workoutType: entry!.workoutType, completed, isToday };
  });

  return (
    <div>
      <Header title="Wochenplan" subtitle={`Block ${ctx.blockIndex + 1} · Woche ${ctx.weekInBlock}/${settings.blockWeeks} · ${ctx.phaseLabel}`} />
      <div className="px-5 py-4 space-y-3">
        {ctx.isDeload && (
          <div className="card p-4 border-warn-500/30 bg-warn-500/5">
            <div className="flex items-center gap-3">
              <span className="chip-warn">Deload</span>
              <p className="text-sm text-ink-200">{ctx.description}</p>
            </div>
          </div>
        )}

        {days.map(d => {
          const tpl = PROGRAM.workoutTemplates[d.workoutType];
          const isGym = d.workoutType.startsWith('gym');
          const isCardio = d.workoutType.startsWith('run') || d.workoutType === 'mtb';
          return (
            <div key={d.iso} className={`card p-4 ${d.isToday ? 'border-accent-500/40 ring-1 ring-accent-500/20' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="label">{WEEKDAY_LONG_DE[d.i]}</span>
                    {d.isToday && <span className="chip-accent">heute</span>}
                    {d.completed && <span className="chip-accent">erledigt</span>}
                  </div>
                  <div className="text-lg font-semibold text-ink-100 mt-0.5">{WORKOUT_TYPE_LABEL[d.workoutType]}</div>
                  {tpl.description && <div className="text-xs text-ink-400 mt-0.5 truncate">{tpl.description}</div>}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="text-xs text-ink-400">{d.iso.slice(5).replace('-', '.')}</div>
                  {isGym && d.isToday && <Link to="/" className="text-xs text-accent-400">Starten →</Link>}
                  {isCardio && d.isToday && <Link to="/cardio/new" className="text-xs text-accent-400">Loggen →</Link>}
                </div>
              </div>
            </div>
          );
        })}

        <div className="card p-5 mt-4">
          <div className="label mb-2">Programm</div>
          <p className="text-sm text-ink-300 mb-3">
            Gerätefokus, 3× Kraft Ganzkörper + 2× lockeres Cardio. Satzanzahl und Übungsauswahl passen sich über 12 Wochen an.
          </p>
          <Link to="/settings" className="text-sm text-accent-400">Einstellungen →</Link>
        </div>
      </div>
    </div>
  );
}
