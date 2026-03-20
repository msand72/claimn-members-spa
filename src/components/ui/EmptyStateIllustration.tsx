/**
 * EmptyStateIllustration — 6 decorative SVG components for empty page states.
 * Nordic Precision Line style: geometric, architectural, currentColor + pillar accents.
 * viewBox 140x140, aria-hidden for decoration only.
 */

interface IllustrationProps {
  className?: string;
}

export function EmptyGoals({ className }: IllustrationProps) {
  const cx = 70;
  const cy = 70;

  return (
    <svg
      viewBox="0 0 140 140"
      className={className}
      aria-hidden="true"
      style={{ width: '100%', height: '100%' }}
    >
      {/* Outer target ring */}
      <circle
        cx={cx}
        cy={cy}
        r="55"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.12"
        strokeWidth="1"
      />
      {/* Middle ring */}
      <circle
        cx={cx}
        cy={cy}
        r="38"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.18"
        strokeWidth="1"
      />
      {/* Inner ring */}
      <circle
        cx={cx}
        cy={cy}
        r="20"
        fill="none"
        stroke="#B87333"
        strokeOpacity="0.40"
        strokeWidth="1.2"
      />
      {/* Center dot */}
      <circle cx={cx} cy={cy} r="3" fill="#B87333" opacity="0.55" />

      {/* Dashed crosshairs */}
      <line
        x1={cx}
        y1="8"
        x2={cx}
        y2="132"
        stroke="currentColor"
        strokeOpacity="0.10"
        strokeWidth="0.8"
        strokeDasharray="4 4"
      />
      <line
        x1="8"
        y1={cy}
        x2="132"
        y2={cy}
        stroke="currentColor"
        strokeOpacity="0.10"
        strokeWidth="0.8"
        strokeDasharray="4 4"
      />

      {/* Ghost north arrowhead placeholder — dashed triangle outline */}
      <path
        d={`M${cx},${cy - 52} L${cx - 5},${cy - 42} L${cx + 5},${cy - 42} Z`}
        fill="none"
        stroke="#B87333"
        strokeOpacity="0.30"
        strokeWidth="1"
        strokeDasharray="2 2"
      />

      {/* Compass tick marks */}
      {[0, 90, 180, 270].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const inner = 53;
        const outer = 57;
        return (
          <line
            key={angle}
            x1={cx + inner * Math.cos(rad - Math.PI / 2)}
            y1={cy + inner * Math.sin(rad - Math.PI / 2)}
            x2={cx + outer * Math.cos(rad - Math.PI / 2)}
            y2={cy + outer * Math.sin(rad - Math.PI / 2)}
            stroke="currentColor"
            strokeOpacity="0.20"
            strokeWidth="1"
          />
        );
      })}
    </svg>
  );
}

export function EmptyKPIs({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 140 140"
      className={className}
      aria-hidden="true"
      style={{ width: '100%', height: '100%' }}
    >
      {/* Ghost axis */}
      <line
        x1="25"
        y1="110"
        x2="25"
        y2="20"
        stroke="currentColor"
        strokeOpacity="0.15"
        strokeWidth="1"
      />
      <line
        x1="25"
        y1="110"
        x2="120"
        y2="110"
        stroke="currentColor"
        strokeOpacity="0.15"
        strokeWidth="1"
      />

      {/* Horizontal grid lines */}
      {[40, 60, 80].map((y) => (
        <line
          key={y}
          x1="25"
          y1={y}
          x2="120"
          y2={y}
          stroke="currentColor"
          strokeOpacity="0.07"
          strokeWidth="0.7"
          strokeDasharray="3 4"
        />
      ))}

      {/* Dashed chart bars */}
      {[
        { x: 38, h: 45 },
        { x: 55, h: 30 },
        { x: 72, h: 55 },
        { x: 89, h: 20 },
        { x: 106, h: 40 },
      ].map((bar, i) => (
        <rect
          key={i}
          x={bar.x}
          y={110 - bar.h}
          width="10"
          height={bar.h}
          rx="2"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.15"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
      ))}

      {/* Center + circle */}
      <circle
        cx="70"
        cy="68"
        r="14"
        fill="none"
        stroke="#A1B1C6"
        strokeOpacity="0.40"
        strokeWidth="1.2"
      />
      <line
        x1="70"
        y1="60"
        x2="70"
        y2="76"
        stroke="#A1B1C6"
        strokeOpacity="0.50"
        strokeWidth="1.5"
      />
      <line
        x1="62"
        y1="68"
        x2="78"
        y2="68"
        stroke="#A1B1C6"
        strokeOpacity="0.50"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function EmptyProtocols({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 140 140"
      className={className}
      aria-hidden="true"
      style={{ width: '100%', height: '100%' }}
    >
      {/* Back card */}
      <rect
        x="38"
        y="22"
        width="72"
        height="88"
        rx="4"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.10"
        strokeWidth="0.8"
      />
      {/* Middle card */}
      <rect
        x="33"
        y="28"
        width="72"
        height="88"
        rx="4"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.15"
        strokeWidth="0.8"
      />

      {/* Front card */}
      <rect
        x="28"
        y="34"
        width="72"
        height="88"
        rx="4"
        fill="currentColor"
        fillOpacity="0.03"
        stroke="currentColor"
        strokeOpacity="0.22"
        strokeWidth="1"
      />
      {/* Koppar left border accent on front card */}
      <line
        x1="28"
        y1="38"
        x2="28"
        y2="118"
        stroke="#B87333"
        strokeOpacity="0.55"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Progress lines on front card */}
      <line
        x1="38"
        y1="50"
        x2="88"
        y2="50"
        stroke="currentColor"
        strokeOpacity="0.15"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="38"
        y1="62"
        x2="78"
        y2="62"
        stroke="currentColor"
        strokeOpacity="0.12"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="38"
        y1="74"
        x2="70"
        y2="74"
        stroke="currentColor"
        strokeOpacity="0.10"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Checkbox outlines */}
      {[50, 62, 74].map((y) => (
        <rect
          key={y}
          x="32"
          y={y - 3}
          width="4"
          height="4"
          rx="0.5"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.18"
          strokeWidth="0.7"
        />
      ))}

      {/* Ghost shimmer line */}
      <line
        x1="38"
        y1="90"
        x2="60"
        y2="90"
        stroke="currentColor"
        strokeOpacity="0.07"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="4 4"
      />
    </svg>
  );
}

export function EmptySessions({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 140 140"
      className={className}
      aria-hidden="true"
      style={{ width: '100%', height: '100%' }}
    >
      {/* Left seat (abstract rectangle) */}
      <rect
        x="22"
        y="60"
        width="28"
        height="36"
        rx="4"
        fill="currentColor"
        fillOpacity="0.05"
        stroke="currentColor"
        strokeOpacity="0.20"
        strokeWidth="1"
      />
      {/* Right seat */}
      <rect
        x="90"
        y="60"
        width="28"
        height="36"
        rx="4"
        fill="currentColor"
        fillOpacity="0.05"
        stroke="currentColor"
        strokeOpacity="0.20"
        strokeWidth="1"
      />

      {/* Connecting line between seats */}
      <line
        x1="50"
        y1="78"
        x2="90"
        y2="78"
        stroke="#B87333"
        strokeOpacity="0.40"
        strokeWidth="1.2"
        strokeDasharray="4 3"
      />
      {/* Connection dots at endpoints */}
      <circle cx="50" cy="78" r="2" fill="#B87333" opacity="0.55" />
      <circle cx="90" cy="78" r="2" fill="#B87333" opacity="0.55" />

      {/* Calendar dots above */}
      {[46, 58, 70, 82, 94].map((x, i) => (
        <circle
          key={i}
          cx={x}
          cy="42"
          r="3"
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.12 + i * 0.04}
          strokeWidth="0.8"
        />
      ))}
      {/* One active calendar dot */}
      <circle cx="70" cy="42" r="3" fill="#B87333" opacity="0.35" />

      {/* Small calendar line above dots */}
      <line
        x1="40"
        y1="34"
        x2="100"
        y2="34"
        stroke="currentColor"
        strokeOpacity="0.10"
        strokeWidth="0.7"
      />
    </svg>
  );
}

export function EmptyEvents({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 140 140"
      className={className}
      aria-hidden="true"
      style={{ width: '100%', height: '100%' }}
    >
      {/* Calendar outline */}
      <rect
        x="25"
        y="30"
        width="78"
        height="82"
        rx="5"
        fill="currentColor"
        fillOpacity="0.03"
        stroke="currentColor"
        strokeOpacity="0.18"
        strokeWidth="1"
      />
      {/* Calendar header bar */}
      <line
        x1="25"
        y1="48"
        x2="103"
        y2="48"
        stroke="currentColor"
        strokeOpacity="0.15"
        strokeWidth="0.8"
      />
      {/* Calendar top clips */}
      <line x1="44" y1="25" x2="44" y2="35" stroke="currentColor" strokeOpacity="0.20" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="84" y1="25" x2="84" y2="35" stroke="currentColor" strokeOpacity="0.20" strokeWidth="1.5" strokeLinecap="round" />

      {/* 3 ghost date slots */}
      {[
        { x: 34, y: 58 },
        { x: 34, y: 74 },
        { x: 34, y: 90 },
      ].map((slot, i) => (
        <g key={i}>
          <rect
            x={slot.x}
            y={slot.y}
            width="60"
            height="10"
            rx="2"
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.10 + i * 0.03}
            strokeWidth="0.7"
            strokeDasharray="3 3"
          />
          {/* Small date circle */}
          <circle
            cx={slot.x + 5}
            cy={slot.y + 5}
            r="3"
            fill="currentColor"
            opacity={0.08 + i * 0.02}
          />
        </g>
      ))}

      {/* Forward arrow */}
      <path
        d="M112,70 L126,70 M121,64 L127,70 L121,76"
        fill="none"
        stroke="#6B8E6F"
        strokeOpacity="0.45"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function EmptyAccountability({ className }: IllustrationProps) {
  const cx = 70;
  const cy = 70;
  const orbitR = 42;

  // 4 peer positions around the orbit
  const peerAngles = [30, 120, 210, 310];

  return (
    <svg
      viewBox="0 0 140 140"
      className={className}
      aria-hidden="true"
      style={{ width: '100%', height: '100%' }}
    >
      {/* Orbital ring */}
      <circle
        cx={cx}
        cy={cy}
        r={orbitR}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.12"
        strokeWidth="0.8"
        strokeDasharray="4 3"
      />

      {/* Inner subtle ring */}
      <circle
        cx={cx}
        cy={cy}
        r="18"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.07"
        strokeWidth="0.6"
      />

      {/* YOUR center dot */}
      <circle cx={cx} cy={cy} r="5" fill="#8A7264" opacity="0.55" />
      <circle cx={cx} cy={cy} r="2" fill="#8A7264" opacity="0.85" />

      {/* Ghost peer dots + dashed connecting lines */}
      {peerAngles.map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const px = cx + orbitR * Math.cos(rad);
        const py = cy + orbitR * Math.sin(rad);
        return (
          <g key={i}>
            {/* Dashed connecting line from center to peer */}
            <line
              x1={cx}
              y1={cy}
              x2={px}
              y2={py}
              stroke="currentColor"
              strokeOpacity="0.10"
              strokeWidth="0.7"
              strokeDasharray="3 4"
            />
            {/* Ghost peer dot */}
            <circle
              cx={px}
              cy={py}
              r="4"
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.15 + i * 0.04}
              strokeWidth="0.8"
              strokeDasharray="2 2"
            />
          </g>
        );
      })}
    </svg>
  );
}
