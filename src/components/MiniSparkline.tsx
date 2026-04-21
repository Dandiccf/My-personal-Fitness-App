interface Props {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
}

export default function MiniSparkline({ values, width = 120, height = 36, stroke = '#3dffb8' }: Props) {
  if (values.length === 0) {
    return <div className="text-ink-400 text-xs">keine Daten</div>;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = values.length > 1 ? width / (values.length - 1) : 0;
  const points = values.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-9">
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
