/**
 * StatCardVisuals — 6 decorative SVG components for GlassStatsCard visual slots.
 * Nordic Precision Line style — bold, visible accents.
 * Structural elements use currentColor; accents use hardcoded brand hex.
 */

interface VisualProps {
  className?: string;
}

export function StreakBarsVisual({ className }: VisualProps) {
  const heights = [10, 14, 18, 24, 30, 38];
  const opacities = [0.4, 0.5, 0.6, 0.7, 0.85, 1];
  const barWidth = 8;
  const gap = 4;
  const startX = 40;

  return (
    <svg
      viewBox="0 0 200 44"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      aria-hidden="true"
      style={{ width: '100%', height: '100%' }}
    >
      {/* Ascending bars */}
      {heights.map((h, i) => (
        <rect
          key={i}
          x={startX + i * (barWidth + gap)}
          y={44 - h - 2}
          width={barWidth}
          height={h}
          rx="2"
          fill="#B87333"
          opacity={opacities[i]}
        />
      ))}

      {/* Dashed trajectory arc connecting tops */}
      <path
        d={`M${startX + barWidth / 2},${44 - heights[0] - 2} Q${startX + 3 * (barWidth + gap)},${-4} ${startX + 5 * (barWidth + gap) + barWidth / 2},${44 - heights[5] - 2}`}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.45"
        strokeWidth="1.5"
        strokeDasharray="3 3"
      />

      {/* Ghost label */}
      <text
        x="156"
        y="38"
        fill="currentColor"
        opacity="0.35"
        fontSize="7"
        fontFamily="inherit"
        letterSpacing="1.5"
      >
        DAYS
      </text>
    </svg>
  );
}

export function GoalTargetVisual({ className }: VisualProps) {
  const sets = [
    { cx: 50, filled: true },
    { cx: 110, filled: false },
    { cx: 160, filled: false },
  ];

  return (
    <svg
      viewBox="0 0 200 44"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      aria-hidden="true"
      style={{ width: '100%', height: '100%' }}
    >
      {sets.map((s, i) => (
        <g key={i}>
          {/* Outer ring */}
          <circle
            cx={s.cx}
            cy="22"
            r="18"
            fill="none"
            stroke={s.filled ? '#B87333' : 'currentColor'}
            strokeOpacity={s.filled ? 0.7 : 0.4}
            strokeWidth="1.5"
          />
          {/* Middle ring */}
          <circle
            cx={s.cx}
            cy="22"
            r="11"
            fill="none"
            stroke={s.filled ? '#B87333' : 'currentColor'}
            strokeOpacity={s.filled ? 0.8 : 0.4}
            strokeWidth="1.5"
          />
          {/* Inner ring / center */}
          <circle
            cx={s.cx}
            cy="22"
            r="4"
            fill={s.filled ? '#B87333' : 'none'}
            fillOpacity={s.filled ? 0.9 : 0}
            stroke={s.filled ? '#B87333' : 'currentColor'}
            strokeOpacity={s.filled ? 1 : 0.4}
            strokeWidth="1.5"
          />
        </g>
      ))}
    </svg>
  );
}

export function VitalityRadarVisual({ className }: VisualProps) {
  const cx = 100;
  const cy = 22;
  const outerR = 19;
  const dataR = [14, 11, 16, 9, 13]; // data radii per pillar
  const pillarColors = ['#B87333', '#A1B1C6', '#6B8E6F', '#8A7264', '#6E8077'];

  // Pentagon vertices helper
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
      viewBox="0 0 200 44"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      aria-hidden="true"
      style={{ width: '100%', height: '100%' }}
    >
      {/* Ghost outer pentagon */}
      <path
        d={toPath(outerPoints)}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="1"
      />

      {/* Spoke lines */}
      {outerPoints.map((p, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={p[0]}
          y2={p[1]}
          stroke="currentColor"
          strokeOpacity="0.2"
          strokeWidth="0.7"
        />
      ))}

      {/* Data polygon */}
      <path
        d={toPath(dataPoints)}
        fill="rgba(107,142,111,0.18)"
        stroke="#6B8E6F"
        strokeWidth="1.5"
        strokeOpacity="0.85"
      />

      {/* Pillar dots at vertices */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="2.5" fill={pillarColors[i]} />
      ))}
    </svg>
  );
}

export function AdherenceArcVisual({ className }: VisualProps) {
  const arcCx = 60;
  const arcCy = 22;
  const arcR = 17;
  const pct = 0.78;
  const circumference = 2 * Math.PI * arcR;
  const dashLen = circumference * pct;

  // Day bars
  const dayOpacities = [0.7, 0.85, 0.5, 0.9, 0.3, 0.75, 0.6, 0.85, 0.4, 0.9, 0.65];

  return (
    <svg
      viewBox="0 0 200 44"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      aria-hidden="true"
      style={{ width: '100%', height: '100%' }}
    >
      {/* Background circle */}
      <circle
        cx={arcCx}
        cy={arcCy}
        r={arcR}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="3"
      />

      {/* Progress arc */}
      <circle
        cx={arcCx}
        cy={arcCy}
        r={arcR}
        fill="none"
        stroke="#A1B1C6"
        strokeWidth="3"
        strokeDasharray={`${dashLen} ${circumference - dashLen}`}
        strokeDashoffset={circumference * 0.25}
        strokeLinecap="round"
        transform={`rotate(-90 ${arcCx} ${arcCy})`}
      />

      {/* Center text */}
      <text
        x={arcCx}
        y={arcCy + 3}
        textAnchor="middle"
        fill="currentColor"
        opacity="0.7"
        fontSize="9"
        fontFamily="inherit"
        fontWeight="500"
      >
        78%
      </text>

      {/* Day bars to the right */}
      {dayOpacities.map((op, i) => (
        <rect
          key={i}
          x={100 + i * 7}
          y={28 - op * 20}
          width="4"
          height={op * 20}
          rx="1"
          fill="currentColor"
          opacity={op * 0.65}
        />
      ))}
    </svg>
  );
}

export function CalendarHeatmapVisual({ className }: VisualProps) {
  // 3 rows x 7 cols
  const cellSize = 10;
  const gap = 2;
  const startX = 48;
  const startY = 4;

  // 1 = active (koppar), 0 = missed (ghost)
  const grid = [
    [1, 0, 1, 1, 0, 1, 1],
    [1, 1, 0, 1, 1, 1, 0],
    [0, 1, 1, 1, 0, 1, 1],
  ];
  const activeOpacities = [0.7, 0.85, 0.8, 0.95, 0.75, 0.9, 0.95];

  return (
    <svg
      viewBox="0 0 200 44"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      aria-hidden="true"
      style={{ width: '100%', height: '100%' }}
    >
      {grid.map((row, r) =>
        row.map((cell, c) => (
          <rect
            key={`${r}-${c}`}
            x={startX + c * (cellSize + gap)}
            y={startY + r * (cellSize + gap)}
            width={cellSize}
            height={cellSize}
            rx="2"
            fill={cell ? '#B87333' : 'currentColor'}
            opacity={cell ? activeOpacities[c] : 0.18}
          />
        ))
      )}

      {/* Ghost label */}
      <text
        x="160"
        y="36"
        fill="currentColor"
        opacity="0.35"
        fontSize="7"
        fontFamily="inherit"
        letterSpacing="1.2"
      >
        Active
      </text>
    </svg>
  );
}

export function DunbarClusterVisual({ className }: VisualProps) {
  const cx = 90;
  const cy = 22;

  return (
    <svg
      viewBox="0 0 200 44"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      aria-hidden="true"
      style={{ width: '100%', height: '100%' }}
    >
      {/* Outer ring (150) — ghost */}
      <circle
        cx={cx}
        cy={cy}
        r="20"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="1"
        strokeDasharray="2 3"
      />

      {/* Middle ring (15) */}
      <circle
        cx={cx}
        cy={cy}
        r="13"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="1"
      />

      {/* Partial dots on middle ring */}
      {[0, 55, 130, 210, 290].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <circle
            key={i}
            cx={cx + 13 * Math.cos(rad)}
            cy={cy + 13 * Math.sin(rad)}
            r="2"
            fill="currentColor"
            opacity="0.45"
          />
        );
      })}

      {/* Inner ring (5) */}
      <circle
        cx={cx}
        cy={cy}
        r="6"
        fill="none"
        stroke="#8A7264"
        strokeOpacity="0.75"
        strokeWidth="1.2"
      />

      {/* Intimate dots on inner ring */}
      {[0, 72, 144, 216, 288].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <circle
            key={i}
            cx={cx + 6 * Math.cos(rad)}
            cy={cy + 6 * Math.sin(rad)}
            r="2.2"
            fill="#8A7264"
            opacity={0.8 + i * 0.04}
          />
        );
      })}

      {/* Center dot */}
      <circle cx={cx} cy={cy} r="2.5" fill="#8A7264" opacity="1" />

      {/* Label */}
      <text
        x="140"
        y="25"
        fill="currentColor"
        opacity="0.35"
        fontSize="7"
        fontFamily="inherit"
        letterSpacing="0.8"
      >
        5 intimate
      </text>
    </svg>
  );
}
