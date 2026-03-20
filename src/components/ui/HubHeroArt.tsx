/**
 * Hub Hero Art — Large compass rose illustration for the dashboard hero strip.
 * Positioned absolutely at the right edge of the welcome banner.
 */

export function HubHeroArt({ className = '' }: { className?: string }) {
  return (
    <svg
      width="380"
      height="200"
      viewBox="0 0 380 200"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Outer ghost ring */}
      <circle cx="280" cy="100" r="90" stroke="currentColor" strokeWidth="0.6" opacity="0.10" />
      {/* Mid ghost ring */}
      <circle cx="280" cy="100" r="65" stroke="currentColor" strokeWidth="0.5" opacity="0.08" />
      {/* Grid lines */}
      <line x1="280" y1="10" x2="280" y2="190" stroke="currentColor" strokeWidth="0.5" opacity="0.06" />
      <line x1="190" y1="100" x2="370" y2="100" stroke="currentColor" strokeWidth="0.5" opacity="0.06" />
      <line x1="216" y1="36" x2="344" y2="164" stroke="currentColor" strokeWidth="0.5" opacity="0.04" />
      <line x1="344" y1="36" x2="216" y2="164" stroke="currentColor" strokeWidth="0.5" opacity="0.04" />
      {/* Cardinal spokes */}
      <line x1="280" y1="10" x2="280" y2="55" stroke="currentColor" strokeWidth="1.2" opacity="0.45" strokeLinecap="round" />
      <line x1="280" y1="145" x2="280" y2="190" stroke="currentColor" strokeWidth="1" opacity="0.30" strokeLinecap="round" />
      <line x1="190" y1="100" x2="230" y2="100" stroke="currentColor" strokeWidth="1" opacity="0.30" strokeLinecap="round" />
      <line x1="330" y1="100" x2="370" y2="100" stroke="currentColor" strokeWidth="1" opacity="0.30" strokeLinecap="round" />
      {/* Diagonal spokes */}
      <line x1="226" y1="46" x2="252" y2="72" stroke="currentColor" strokeWidth="0.8" opacity="0.22" strokeLinecap="round" />
      <line x1="334" y1="46" x2="308" y2="72" stroke="currentColor" strokeWidth="0.8" opacity="0.22" strokeLinecap="round" />
      <line x1="226" y1="154" x2="252" y2="128" stroke="currentColor" strokeWidth="0.8" opacity="0.22" strokeLinecap="round" />
      <line x1="334" y1="154" x2="308" y2="128" stroke="currentColor" strokeWidth="0.8" opacity="0.22" strokeLinecap="round" />
      {/* Koppar precision ring */}
      <circle cx="280" cy="100" r="28" stroke="#B87333" strokeWidth="1.5" opacity="0.70" />
      {/* Tick marks on ring */}
      <line x1="280" y1="72" x2="280" y2="78" stroke="#B87333" strokeWidth="1.2" opacity="0.50" strokeLinecap="round" />
      <line x1="308" y1="100" x2="302" y2="100" stroke="#B87333" strokeWidth="1.2" opacity="0.50" strokeLinecap="round" />
      <line x1="280" y1="128" x2="280" y2="122" stroke="#B87333" strokeWidth="1.2" opacity="0.40" strokeLinecap="round" />
      <line x1="252" y1="100" x2="258" y2="100" stroke="#B87333" strokeWidth="1.2" opacity="0.40" strokeLinecap="round" />
      {/* North arrowhead */}
      <path d="M280 10 L276 24 L280 21 L284 24 Z" fill="#B87333" opacity="0.65" />
      {/* Center dot */}
      <circle cx="280" cy="100" r="5" fill="#B87333" opacity="0.60" />
      {/* Foundation grid (bottom) */}
      <line x1="200" y1="160" x2="360" y2="160" stroke="currentColor" strokeWidth="0.4" opacity="0.06" />
      <line x1="200" y1="170" x2="360" y2="170" stroke="currentColor" strokeWidth="0.4" opacity="0.05" />
      <line x1="200" y1="180" x2="360" y2="180" stroke="currentColor" strokeWidth="0.4" opacity="0.04" />
    </svg>
  )
}
