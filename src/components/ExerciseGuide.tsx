import { useState } from 'react';
import BottomSheet from './BottomSheet';
import { EXERCISE_GUIDES, imageUrl } from '../data/exerciseGuides';
import { EXERCISE_MAP } from '../data/exercises';
import { musclesDe } from '../data/labels';

interface Props {
  open: boolean;
  onClose: () => void;
  exerciseId: string;
}

export default function ExerciseGuide({ open, onClose, exerciseId }: Props) {
  const guide = EXERCISE_GUIDES[exerciseId];
  const exercise = EXERCISE_MAP[exerciseId];
  const [imgError0, setImgError0] = useState(false);
  const [imgError1, setImgError1] = useState(false);

  if (!exercise) return null;

  return (
    <BottomSheet open={open} onClose={onClose} title={exercise.name}>
      <div className="space-y-4">
        {/* Bilder */}
        {guide?.imagePath ? (
          <div className="grid grid-cols-2 gap-2">
            {!imgError0 ? (
              <img
                src={imageUrl(guide.imagePath, 0)}
                alt="Startposition"
                loading="lazy"
                onError={() => setImgError0(true)}
                className="w-full aspect-[4/3] object-cover rounded-xl bg-white/5"
              />
            ) : (
              <div className="aspect-[4/3] rounded-xl bg-white/5 grid place-items-center text-xs text-ink-400">Kein Bild</div>
            )}
            {!imgError1 ? (
              <img
                src={imageUrl(guide.imagePath, 1)}
                alt="Endposition"
                loading="lazy"
                onError={() => setImgError1(true)}
                className="w-full aspect-[4/3] object-cover rounded-xl bg-white/5"
              />
            ) : (
              <div className="aspect-[4/3] rounded-xl bg-white/5 grid place-items-center text-xs text-ink-400">Kein Bild</div>
            )}
          </div>
        ) : (
          <div className="rounded-xl bg-white/5 p-4 text-sm text-ink-400 text-center">
            Keine Abbildung hinterlegt.
          </div>
        )}

        {/* Meta */}
        <div className="rounded-xl bg-white/5 p-4 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-400">Primäre Muskeln</span>
            <span className="text-ink-100 text-right ml-4">{musclesDe(exercise.primaryMuscles)}</span>
          </div>
          {exercise.secondaryMuscles.length > 0 && (
            <div className="flex justify-between">
              <span className="text-ink-400">Sekundär</span>
              <span className="text-ink-200 text-right ml-4">{musclesDe(exercise.secondaryMuscles)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-ink-400">Wdh-Bereich</span>
            <span className="text-ink-100">{exercise.repRangeMin}–{exercise.repRangeMax}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-400">Pause</span>
            <span className="text-ink-100">{exercise.defaultRestSec}s</span>
          </div>
        </div>

        {/* Tipps */}
        {guide?.tips && guide.tips.length > 0 && (
          <div>
            <div className="label mb-2 px-1">Ausführung</div>
            <ul className="space-y-2">
              {guide.tips.map((tip, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-ink-200 bg-white/5 rounded-xl px-3 py-2.5">
                  <span className="text-accent-400 font-bold flex-shrink-0">{i + 1}</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Attribution */}
        <p className="text-[10px] text-ink-500 text-center pt-2">
          Abbildungen: free-exercise-db (MIT-Lizenz) · via jsDelivr
        </p>
      </div>
    </BottomSheet>
  );
}
