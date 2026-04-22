import type { MovementPattern } from '../types';

interface Props {
  pattern: MovementPattern;
  className?: string;
}

/**
 * Ein Icon pro Bewegungsmuster. Line-Art, currentColor, 24x24.
 * Bewusst abstrakt — Unterstützung, nicht Ersatz für den Übungsnamen.
 */
export default function ExerciseIcon({ pattern, className = 'w-6 h-6' }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[pattern] ?? PATHS.core}
    </svg>
  );
}

const PATHS: Record<MovementPattern, JSX.Element> = {
  // Bankdrücken / Brustpresse — Hantel mit Push-Pfeil
  horizontal_push: (
    <g>
      <path d="M4 10v4M7 8v8M17 8v8M20 10v4" />
      <path d="M7 12h10" />
      <path d="M14 9l3 3-3 3" />
    </g>
  ),
  // Latziehen — Querstange oben + zwei nach unten gerichtete Griffe
  vertical_pull: (
    <g>
      <path d="M4 5h16" />
      <path d="M8 5v6M16 5v6" />
      <path d="M6 15l2 4 M18 15l-2 4" />
      <path d="M10 12h4" />
    </g>
  ),
  // Rudern — Pfeil zieht nach links zum Körperpunkt
  horizontal_pull: (
    <g>
      <circle cx="5" cy="12" r="2" />
      <path d="M7 12h13" />
      <path d="M16 8l4 4-4 4" />
      <path d="M5 4v3M5 17v3" />
    </g>
  ),
  // Kniebeuge / Beinpresse — Seitenansicht mit gebeugtem Knie
  squat: (
    <g>
      <circle cx="7" cy="5" r="1.8" />
      <path d="M7 7v4l-3 3 3 3v2" />
      <path d="M4 20h6" />
      <path d="M11 14l6-2 2-4" />
    </g>
  ),
  // Hip Hinge — Oberkörper vornüber geneigt
  hinge: (
    <g>
      <circle cx="5" cy="7" r="1.8" />
      <path d="M5 9l7 3 7-1" />
      <path d="M12 12v8" />
      <path d="M9 20h6" />
    </g>
  ),
  // Beinstrecker — Sitz mit gestrecktem Bein
  quad_iso: (
    <g>
      <rect x="3" y="9" width="6" height="6" rx="1.5" />
      <path d="M9 11l10 2" />
      <path d="M19 12v3" />
      <path d="M3 15v4M9 15v4" />
    </g>
  ),
  // Beinbeuger — gekrümmtes Bein nach hinten
  hamstring_iso: (
    <g>
      <path d="M20 18h-9" />
      <path d="M11 18c-5 0-5-7 0-7s5-4 2-5" />
      <circle cx="20" cy="18" r="1.2" />
    </g>
  ),
  // Seitheben — Körper mit seitlich ausgebreiteten Armen
  lateral_delt: (
    <g>
      <circle cx="12" cy="6" r="1.8" />
      <path d="M12 8v10" />
      <path d="M3 12h18" />
      <path d="M3 10v4M21 10v4" />
    </g>
  ),
  // Face Pull / Rear Delt — Y-Form, Arme nach hinten oben
  rear_delt: (
    <g>
      <circle cx="12" cy="6" r="1.8" />
      <path d="M12 8v10" />
      <path d="M5 4l7 6 7-6" />
      <path d="M9 20h6" />
    </g>
  ),
  // Bizeps — angewinkelter Arm
  biceps: (
    <g>
      <path d="M5 20v-6c0-4 3-7 7-7s7 3 7 7" />
      <path d="M12 7V4h4" />
      <circle cx="5" cy="20" r="1.5" />
    </g>
  ),
  // Trizeps — gestreckter Arm mit Abwärtspfeil
  triceps: (
    <g>
      <path d="M9 4h6" />
      <path d="M12 4v14" />
      <path d="M9 15l3 3 3-3" />
      <circle cx="12" cy="20" r="1.5" />
    </g>
  ),
  // Wade — Fuß auf Zehenspitzen
  calves: (
    <g>
      <path d="M12 3v11" />
      <path d="M7 14h10l-2 5" />
      <path d="M15 19l2 2" />
      <path d="M7 14v3" />
    </g>
  ),
  // Core — Rumpf mit Abs-Linien
  core: (
    <g>
      <rect x="7" y="4" width="10" height="16" rx="3" />
      <path d="M7 10h10M7 14h10M12 4v16" />
    </g>
  )
};
