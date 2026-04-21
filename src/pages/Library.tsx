import { useMemo, useState } from 'react';
import Header from '../components/Header';
import { EXERCISES } from '../data/exercises';
import { useStore } from '../store/useStore';

export default function Library() {
  const settings = useStore(s => s.settings)!;
  const setPref = useStore(s => s.setPreferredSwap);
  const [q, setQ] = useState('');

  const list = useMemo(() => {
    const lower = q.trim().toLowerCase();
    return EXERCISES.filter(e => !lower || e.name.toLowerCase().includes(lower));
  }, [q]);

  const byPattern = useMemo(() => {
    const m: Record<string, typeof list> = {};
    for (const e of list) {
      m[e.movementPattern] ??= [];
      m[e.movementPattern].push(e);
    }
    return m;
  }, [list]);

  return (
    <div>
      <Header title="Übungsbibliothek" subtitle={`${EXERCISES.length} Übungen`} onBack />
      <div className="px-5 py-4 space-y-4">
        <input
          className="input"
          placeholder="Suche ..."
          value={q}
          onChange={e => setQ(e.target.value)}
        />

        {Object.entries(byPattern).map(([pattern, exs]) => (
          <div key={pattern}>
            <div className="label mb-2 px-1 capitalize">{pattern.replace('_', ' ')}</div>
            <div className="card divide-y divide-white/5">
              {exs.map(e => {
                const pref = settings.preferredSwaps[e.id];
                return (
                  <div key={e.id} className="p-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-ink-100">{e.name}</div>
                      <div className="text-xs text-ink-400 mt-0.5">
                        {e.repRangeMin}–{e.repRangeMax} Wdh · {e.defaultRestSec}s Pause · {e.equipmentType}
                      </div>
                      {e.alternativeIds.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {e.alternativeIds.slice(0, 4).map(id => (
                            <button
                              key={id}
                              onClick={() => setPref(e.id, id === pref ? null : id)}
                              className={`text-[10px] px-2 py-1 rounded-full border ${pref === id ? 'bg-accent-500 text-ink-900 border-accent-500' : 'bg-white/5 text-ink-300 border-white/5'}`}
                            >
                              {pref === id ? '✓ ' : ''}{EXERCISES.find(x => x.id === id)?.shortName ?? EXERCISES.find(x => x.id === id)?.name ?? id}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <p className="text-xs text-ink-500 text-center">
          Ausgewählte Varianten werden beim nächsten Workout als Standard genutzt. Ein erneuter Klick entfernt die Wahl.
        </p>
      </div>
    </div>
  );
}
