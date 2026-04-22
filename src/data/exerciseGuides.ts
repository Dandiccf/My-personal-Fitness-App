// Pro Übung: Pfad zu den Bildern aus free-exercise-db (MIT-lizenziert) + kurze
// deutsche Technik-Tipps. Bilder werden lazy von jsDelivr CDN geladen.
//
// Quelle: https://github.com/yuhonas/free-exercise-db
// Lizenz: MIT

export interface ExerciseGuide {
  /** Pfad auf CDN (alles vor /0.jpg und /1.jpg) */
  imagePath: string;
  /** Kurze deutsche Tipps zur sauberen Ausführung */
  tips: string[];
}

export const FREE_DB_BASE = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises';

export function imageUrl(path: string, index: 0 | 1 = 0): string {
  return `${FREE_DB_BASE}/${path}/${index}.jpg`;
}

export const EXERCISE_GUIDES: Record<string, ExerciseGuide> = {
  chest_press_machine: {
    imagePath: 'Machine_Bench_Press',
    tips: [
      'Schulterblätter zusammenziehen, Rücken leicht durchgedrückt.',
      'Füße fest am Boden, Po bleibt auf dem Sitz.',
      'Ellbogen nicht ganz durchstrecken, Brust bleibt unter Spannung.',
      'Kontrolliert senken (2 Sek.), aktiv drücken.'
    ]
  },
  incline_press_machine: {
    imagePath: 'Incline_Cable_Chest_Press',
    tips: [
      'Leicht geneigter Sitz — mehr obere Brust, weniger Schulter.',
      'Ellbogen ca. 45° vom Körper, nicht zu weit nach außen.',
      'Druckpfad diagonal nach oben, nicht hoch vom Kopf weg.'
    ]
  },
  converging_chest_press: {
    imagePath: 'Leverage_Chest_Press',
    tips: [
      'Konvergierende Griffe: Hände treffen sich in der Endposition.',
      'Schulterblätter zusammengezogen.',
      'Bewusste Brust-Kontraktion am oberen Punkt.'
    ]
  },
  cable_chest_press: {
    imagePath: 'Cable_Chest_Press',
    tips: [
      'Kabelzüge seitlich, einen Schritt nach vorne stehen.',
      'Leicht vorne über Brust drücken, Kraft aus der Brustmitte.',
      'Kabel geben durchgehende Spannung — auch in Endposition halten.'
    ]
  },
  smith_bench: {
    imagePath: 'Smith_Machine_Bench_Press',
    tips: [
      'Sicherheitsriegel setzen!',
      'Stange bis knapp über die Brust, nicht abprallen lassen.',
      'Handgelenke gerade, Stange über der Handwurzel.'
    ]
  },
  lat_pulldown_wide: {
    imagePath: 'Wide-Grip_Lat_Pulldown',
    tips: [
      'Breiter Überhandgriff, etwas weiter als schulterbreit.',
      'Brust raus, leichtes Hohlkreuz, Schulterblätter nach hinten-unten.',
      'Stange zur oberen Brust ziehen, Ellbogen nach unten-hinten.',
      'Nicht mit Schwung und NICHT bis hinter den Nacken.'
    ]
  },
  lat_pulldown_neutral: {
    imagePath: 'Close-Grip_Front_Lat_Pulldown',
    tips: [
      'Parallelgriff, Handflächen zueinander.',
      'Mehr Fokus auf unteren Latissimus und Bizeps.',
      'Stange zur unteren Brust, Oberkörper leicht nach hinten.'
    ]
  },
  lat_pulldown_close: {
    imagePath: 'Close-Grip_Front_Lat_Pulldown',
    tips: [
      'Enger Untergriff, stärkere Bizeps-Beteiligung.',
      'Ellbogen eng am Körper nach unten-hinten.',
      'Stange zur unteren Brust ziehen.'
    ]
  },
  assisted_pullup: {
    imagePath: 'Band_Assisted_Pull-Up',
    tips: [
      'Gegengewicht so wählen, dass 6-10 saubere Wdh. möglich sind.',
      'Körperspannung halten, Schultern nicht hochziehen.',
      'Am oberen Punkt: Kinn über die Stange, Brust zur Stange.'
    ]
  },
  row_machine_low: {
    imagePath: 'Seated_Cable_Rows',
    tips: [
      'Rücken gerade, Brust raus.',
      'Ellbogen knapp am Körper nach hinten ziehen.',
      'Schulterblätter am Ende bewusst zusammenziehen (1 Sek halten).',
      'Kein Zurückkippen mit Schwung.'
    ]
  },
  chest_supported_row: {
    imagePath: 'Seated_Cable_Rows',
    tips: [
      'Brust fest an die Polsterung gedrückt.',
      'Kein Oberkörper-Wippen — isoliert den Rücken sauber.',
      'Ellbogen nach hinten, Schulterblätter zusammen.'
    ]
  },
  cable_row: {
    imagePath: 'Seated_Cable_Rows',
    tips: [
      'Leicht vorgebeugter Start, am Ende aufrecht.',
      'Ellbogen knapp am Körper vorbei.',
      'Gewicht kontrolliert nach vorne, Dehnung im Lat spüren.'
    ]
  },
  plate_loaded_row: {
    imagePath: 'Seated_Cable_Rows',
    tips: [
      'Pro Seite gleich viel Gewicht, einseitig kann variieren.',
      'Rücken bleibt gerade, Ellbogen führt.',
      'Kurze Pause in Kontraktion.'
    ]
  },
  leg_press: {
    imagePath: 'Leg_Press',
    tips: [
      'Füße schulterbreit, mittig auf der Platte.',
      'Rücken und Po bleiben am Polster — nicht lösen!',
      'Knie bis ~90°, nicht über Zehen drücken lassen.',
      'Knie niemals ganz durchstrecken (Gelenkschutz).'
    ]
  },
  hack_squat: {
    imagePath: 'Hack_Squat',
    tips: [
      'Füße mittig, hüftbreit.',
      'Tief gehen (Oberschenkel parallel zum Boden, wenn möglich).',
      'Rücken komplett an die Polsterung gedrückt.',
      'Sicherheitsriegel vor dem Satz einrasten lassen.'
    ]
  },
  pendulum_squat: {
    imagePath: 'Hack_Squat',
    tips: [
      'Wie Hack Squat, aber mit bogenförmiger Bahn.',
      'Extrem quad-fokussiert, wenig Wirbelsäulen-Belastung.',
      'Sauber bis in die tiefe Position gehen.'
    ]
  },
  smith_squat: {
    imagePath: 'Smith_Machine_Squat',
    tips: [
      'Füße leicht vor die Stange, nicht direkt darunter.',
      'Rücken neutral, Blick geradeaus.',
      'Knie in Linie mit Zehenspitzen.'
    ]
  },
  leg_extension: {
    imagePath: 'Leg_Extensions',
    tips: [
      'Rücken fest ans Polster, nicht nach vorne kippen.',
      'Knie voll durchstrecken, 1 Sek halten.',
      'Kontrolliert senken — keine Pendelbewegung.',
      'Bei Kniebeschwerden: weniger Gewicht, mehr Kontrolle.'
    ]
  },
  single_leg_extension: {
    imagePath: 'Single-Leg_Leg_Extension',
    tips: [
      'Einzeln, um Ungleichgewichte auszubügeln.',
      'Gegenseite entspannt liegen lassen.',
      'Volle Streckung am oberen Punkt.'
    ]
  },
  sissy_squat_machine: {
    imagePath: 'Weighted_Sissy_Squat',
    tips: [
      'Hüfte nach hinten kippen, Knie nach vorne.',
      'Konzentration auf den mittleren Quadrizeps.',
      'Bei Knieproblemen auslassen.'
    ]
  },
  leg_curl_lying: {
    imagePath: 'Lying_Leg_Curls',
    tips: [
      'Hüften bleiben am Polster gedrückt.',
      'Ferse zum Po ziehen, kurzer Kontraktionspunkt.',
      'Keine hochgezogene Hüfte — sauberes Isolieren.',
      'Langsam senken, nicht fallen lassen.'
    ]
  },
  leg_curl_seated: {
    imagePath: 'Seated_Leg_Curl',
    tips: [
      'Rücken gerade, Polster fest über den Oberschenkeln.',
      'Fersen unter die Polster krümmen.',
      'Am unteren Punkt kurz halten.'
    ]
  },
  nordic_curl_assisted: {
    imagePath: 'Glute_Ham_Raise',
    tips: [
      'Sehr anspruchsvolle Übung — mit Band oder Partner assistieren.',
      'Körper komplett gerade wie ein Brett.',
      'So langsam wie möglich runter, dann mit Handdruck hoch.'
    ]
  },
  glute_ham_machine: {
    imagePath: 'Glute_Ham_Raise',
    tips: [
      'Fersen fest gegen die Polsterung drücken.',
      'Hüfte nach oben strecken, dann Knie beugen.',
      'Keine Hohlkreuz-Kompensation.'
    ]
  },
  glute_drive: {
    imagePath: 'Barbell_Glute_Bridge',
    tips: [
      'Rücken gegen die Polsterung, Füße flach auf der Plattform.',
      'Hüfte explosiv nach oben, Gesäß fest anspannen.',
      'Am oberen Punkt 1 Sek halten und bewusst fühlen.',
      'Kein Übergang ins Hohlkreuz.'
    ]
  },
  back_extension: {
    imagePath: 'Hyperextensions_Back_Extensions',
    tips: [
      'Hüftgelenk an der Polsterkante, nicht der Bauch.',
      'Für Glute-Fokus: Rücken leicht gerundet halten.',
      'Kein Überstrecken nach oben.',
      'Gleichmäßige Bewegung, keine Schwünge.'
    ]
  },
  reverse_hyper: {
    imagePath: 'Reverse_Hyperextension',
    tips: [
      'Oberkörper fest auf der Plattform.',
      'Beine aus der Hüfte heben, nicht aus dem unteren Rücken.',
      'Kein Überstrecken, kontrollierte Rückführung.'
    ]
  },
  rdl_machine: {
    imagePath: 'Hyperextensions_Back_Extensions',
    tips: [
      'Rumänisches Kreuzheben — Hüfte weit nach hinten schieben.',
      'Rücken bleibt neutral, leichte Beugung im Knie.',
      'Gewicht ganz nah am Körper führen.',
      'Spüren: Dehnung in den Hamstrings.'
    ]
  },
  reverse_pec_deck: {
    imagePath: 'Reverse_Flyes',
    tips: [
      'Brust gegen das Polster.',
      'Ellbogen leicht gebeugt, Arme nach hinten öffnen.',
      'Bewegung aus den hinteren Schultern, nicht aus den Armen.',
      'Kurze Pause am Endpunkt.'
    ]
  },
  face_pull_cable: {
    imagePath: 'Face_Pull',
    tips: [
      'Seil auf Kopfhöhe einstellen.',
      'Ellbogen hoch, zur Stirn ziehen — nicht zur Brust.',
      'Am Endpunkt die Fäuste nach außen drehen.',
      'Leichtes Gewicht, saubere Form.'
    ]
  },
  lateral_raise_machine: {
    imagePath: 'Cable_Seated_Lateral_Raise',
    tips: [
      'Arme seitlich heben, bis parallel zum Boden.',
      'Handgelenk minimal höher als Ellbogen — nicht höher.',
      'Nicht den Kopf hochziehen, keine Trapezius-Arbeit.',
      'Langsam senken.'
    ]
  },
  cable_lateral_raise: {
    imagePath: 'Cable_Seated_Lateral_Raise',
    tips: [
      'Kabel leicht hinter dem Körper, Hand vor dem Körper starten.',
      'Arm fast gestreckt nach seitlich heben.',
      'Kontinuierliche Spannung — Kabel bleibt immer angespannt.'
    ]
  },
  db_lateral_raise: {
    imagePath: 'Cable_Seated_Lateral_Raise',
    tips: [
      'Leichte Kurzhanteln, Kontrolle vor Last.',
      'Ellbogen leicht gebeugt, nicht durchgestreckt.',
      'Nicht über parallel heben — Gelenkschutz.'
    ]
  },
  triceps_machine: {
    imagePath: 'Triceps_Pushdown',
    tips: [
      'Ellbogen fixiert am Körper, bewegen sich nicht.',
      'Nur der Unterarm bewegt sich — Pivot am Ellbogen.',
      'Voll durchstrecken, am unteren Punkt 1 Sek halten.'
    ]
  },
  rope_pushdown: {
    imagePath: 'Triceps_Pushdown_-_Rope_Attachment',
    tips: [
      'Am Endpunkt Seile auseinanderziehen — maximale Trizeps-Kontraktion.',
      'Ellbogen bleiben am Körper.',
      'Saubere Kontrolle beim Zurückführen.'
    ]
  },
  v_bar_pushdown: {
    imagePath: 'Triceps_Pushdown_-_V-Bar_Attachment',
    tips: [
      'V-Bar ermöglicht neutralen Griff.',
      'Ellbogen am Körper, volle Streckung.',
      'Handgelenke bleiben gerade.'
    ]
  },
  overhead_rope_ext: {
    imagePath: 'Cable_Rope_Overhead_Triceps_Extension',
    tips: [
      'Seile hinter den Kopf führen.',
      'Oberarme bleiben vertikal — nur Unterarme bewegen sich.',
      'Dehnung im Trizeps spüren im gedehnten Zustand.'
    ]
  },
  dip_machine: {
    imagePath: 'Dip_Machine',
    tips: [
      'Ellbogen knapp hinter dem Körper.',
      'Leicht vorgebeugter Oberkörper für mehr Brust-Beteiligung.',
      'Bis Oberarme parallel zum Boden, nicht tiefer.'
    ]
  },
  biceps_machine: {
    imagePath: 'Machine_Preacher_Curls',
    tips: [
      'Arme komplett aufgelegt, Achseln an der Polsterkante.',
      'Volle Streckung unten, volle Beugung oben.',
      'Kein Schwung — langsamer und kontrollierter Pump.'
    ]
  },
  scott_machine: {
    imagePath: 'Preacher_Curl',
    tips: [
      'Oberarme komplett am Polster.',
      'Im tiefsten Punkt fast strecken, aber nicht ganz — Spannung halten.',
      'Konzentration auf den Bizeps-Peak oben.'
    ]
  },
  cable_curl: {
    imagePath: 'Standing_Biceps_Cable_Curl',
    tips: [
      'Ellbogen fixiert am Körper.',
      'Rücken gerade, keine Hüftbewegung.',
      'Oben kurz halten, langsam senken.'
    ]
  },
  rope_curl: {
    imagePath: 'Cable_Hammer_Curls_-_Rope_Attachment',
    tips: [
      'Seil-Curl trifft Brachialis und Unterarme zusätzlich.',
      'Am Endpunkt Seile leicht auseinanderziehen.',
      'Ellbogen fix.'
    ]
  },
  db_curl: {
    imagePath: 'Dumbbell_Bicep_Curl',
    tips: [
      'Ellbogen am Körper, Oberarm bewegt sich nicht.',
      'Beim Hochkommen Hand leicht nach außen drehen (Supination).',
      'Kein Schwung durch den Rücken.'
    ]
  },
  calf_raise_seated: {
    imagePath: 'Seated_Calf_Raise',
    tips: [
      'Fersen ganz runter für volle Dehnung.',
      'Langsame Kontraktion, kurz oben halten.',
      'Gezielt den Soleus (tiefe Wade) — höhere Wdh.'
    ]
  },
  calf_raise_standing: {
    imagePath: 'Standing_Calf_Raises',
    tips: [
      'Stehend trifft primär den Gastrocnemius.',
      'Volle Dehnung unten, explosive Streckung nach oben.',
      'Knie gestreckt halten.'
    ]
  },
  leg_press_calf: {
    imagePath: 'Calf_Press_On_The_Leg_Press_Machine',
    tips: [
      'Füße so auf die Platte, dass nur Fußballen aufliegen.',
      'Sicherheitsriegel EIN! Keine Kniebeugen, nur Wade.',
      'Tiefe Dehnung, hohe Kontraktion.'
    ]
  },
  crunch_machine: {
    imagePath: 'Ab_Crunch_Machine',
    tips: [
      'Nur Oberkörper krümmt sich — keine Hüftbewegung.',
      'Kurz halten in der vollen Kontraktion.',
      'Langsame Exzentrik.'
    ]
  },
  cable_crunch: {
    imagePath: 'Cable_Crunch',
    tips: [
      'Kniend, Seil hinter dem Kopf.',
      'Oberkörper zusammenkrümmen — Bauch arbeitet, nicht Arme.',
      'Hüfte bleibt fix am Boden.'
    ]
  },
  plank: {
    imagePath: 'Plank',
    tips: [
      'Gerade Linie von Kopf bis Fersen.',
      'Po nicht hochziehen, Bauch nicht durchhängen lassen.',
      'Atme ruhig weiter. Nicht die Luft anhalten.'
    ]
  }
};
