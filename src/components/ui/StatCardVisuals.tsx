/**
 * StatCardVisuals — decorative SVG components for GlassStatsCard visual slots.
 * Each uses a tight viewBox so the graphic fills the container.
 */

interface VisualProps {
  className?: string;
}

export function StreakBarsVisual({ className }: VisualProps) {
  // 6 ascending bars, x from 0..66, y from 0..40
  const heights = [10, 14, 18, 24, 30, 38];
  const opacities = [0.4, 0.5, 0.6, 0.7, 0.85, 1];
  const barWidth = 8;
  const gap = 4;
  const totalH = 40;

  return (
    <svg
      viewBox="0 0 70 44"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      aria-hidden="true"
    >
      {heights.map((h, i) => (
        <rect
          key={i}
          x={i * (barWidth + gap)}
          y={totalH - h + 2}
          width={barWidth}
          height={h}
          rx="2"
          fill="#B87333"
          opacity={opacities[i]}
        />
      ))}
      <path
        d={`M${barWidth / 2},${totalH - heights[0] + 2} Q${2.5 * (barWidth + gap)},${-6} ${5 * (barWidth + gap) + barWidth / 2},${totalH - heights[5] + 2}`}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.45"
        strokeWidth="1.5"
        strokeDasharray="3 3"
      />
    </svg>
  );
}

export function GoalTargetVisual({ className }: VisualProps) {
  // Single target — 3 concentric rings centered in a square
  return (
    <svg
      viewBox="0 0 44 44"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      aria-hidden="true"
    >
      <circle cx="22" cy="22" r="20" fill="none" stroke="#B87333" strokeOpacity="0.5" strokeWidth="1.5" />
      <circle cx="22" cy="22" r="13" fill="none" stroke="#B87333" strokeOpacity="0.65" strokeWidth="1.5" />
      <circle cx="22" cy="22" r="6" fill="#B87333" fillOpacity="0.9" />
    </svg>
  );
}

export function VitalityRadarVisual({ className }: VisualProps) {
  const cx = 22;
  const cy = 22;
  const outerR = 20;
  const dataR = [15, 12, 17, 10, 14];
  const pillarColors = ['#B87333', '#A1B1C6', '#6B8E6F', '#8A7264', '#6E8077'];

  const vertex = (r: number, i: number) => {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)] as const;
  };

  const outerPoints = Array.from({ length: 5 }, (_, i) => vertex(outerR, i));
  const dataPoints = Array.from({ length: 5 }, (_, i) => vertex(dataR[i], i));

  const toPath = (pts: (readonly [number, number])[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + ' Z';

  return (
    <svg
      viewBox="0 0 44 44"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      aria-hidden="true"
    >
      <path d={toPath(outerPoints)} fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" />
      {outerPoints.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p[0]} y2={p[1]} stroke="currentColor" strokeOpacity="0.2" strokeWidth="0.7" />
      ))}
      <path d={toPath(dataPoints)} fill="rgba(107,142,111,0.18)" stroke="#6B8E6F" strokeWidth="1.5" strokeOpacity="0.85" />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="2.5" fill={pillarColors[i]} />
      ))}
    </svg>
  );
}

export function AdherenceArcVisual({ className }: VisualProps) {
  const cx = 22;
  const cy = 22;
  const r = 19;
  const pct = 0.78;
  const circumference = 2 * Math.PI * r;
  const dashLen = circumference * pct;

  return (
    <svg
      viewBox="0 0 44 44"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      aria-hidden="true"
    >
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#A1B1C6"
        strokeWidth="3"
        strokeDasharray={`${dashLen} ${circumference - dashLen}`}
        strokeDashoffset={circumference * 0.25}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text x={cx} y={cy + 3} textAnchor="middle" fill="currentColor" opacity="0.7" fontSize="9" fontFamily="inherit" fontWeight="500">
        78%
      </text>
    </svg>
  );
}

export function CalendarHeatmapVisual({ className }: VisualProps) {
  const cellSize = 10;
  const gap = 2;
  // 7 cols x 3 rows → 82 x 34
  const grid = [
    [1, 0, 1, 1, 0, 1, 1],
    [1, 1, 0, 1, 1, 1, 0],
    [0, 1, 1, 1, 0, 1, 1],
  ];
  const activeOpacities = [0.7, 0.85, 0.8, 0.95, 0.75, 0.9, 0.95];

  return (
    <svg
      viewBox="0 0 82 34"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      aria-hidden="true"
    >
      {grid.map((row, r) =>
        row.map((cell, c) => (
          <rect
            key={`${r}-${c}`}
            x={c * (cellSize + gap)}
            y={r * (cellSize + gap)}
            width={cellSize}
            height={cellSize}
            rx="2"
            fill={cell ? '#B87333' : 'currentColor'}
            opacity={cell ? activeOpacities[c] : 0.18}
          />
        ))
      )}
    </svg>
  );
}

export function DunbarClusterVisual({ className }: VisualProps) {
  const cx = 22;
  const cy = 22;

  return (
    <svg
      viewBox="0 0 44 44"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      aria-hidden="true"
    >
      {/* Outer ring */}
      <circle cx={cx} cy={cy} r="20" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="2 3" />
      {/* Middle ring */}
      <circle cx={cx} cy={cy} r="13" fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1" />
      {/* Dots on middle ring */}
      {[0, 55, 130, 210, 290].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        return <circle key={i} cx={cx + 13 * Math.cos(rad)} cy={cy + 13 * Math.sin(rad)} r="2" fill="currentColor" opacity="0.45" />;
      })}
      {/* Inner ring */}
      <circle cx={cx} cy={cy} r="6" fill="none" stroke="#8A7264" strokeOpacity="0.75" strokeWidth="1.2" />
      {/* Intimate dots */}
      {[0, 72, 144, 216, 288].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        return <circle key={i} cx={cx + 6 * Math.cos(rad)} cy={cy + 6 * Math.sin(rad)} r="2.2" fill="#8A7264" opacity={0.8 + i * 0.04} />;
      })}
      {/* Center */}
      <circle cx={cx} cy={cy} r="2.5" fill="#8A7264" opacity="1" />
    </svg>
  );
}
