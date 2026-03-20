/**
 * Nordic Precision Line — Pillar Icon System
 *
 * 5 geometric SVG icons derived from framework research models.
 * All structural strokes use currentColor (theme-adaptive).
 * Pillar accent colors are hardcoded hex (brand-specific).
 */

import type { PillarId } from '../../tokens/pillars'

interface PillarIconProps {
  pillar: PillarId
  size?: 32 | 80
  className?: string
}

export function PillarIcon({ pillar, size = 32, className = '' }: PillarIconProps) {
  const Icon = PILLAR_SVGS[pillar]
  if (!Icon) return null
  return <Icon size={size} className={className} />
}

// ── Identity & Purpose — Foundation grid + direction vector ──

function IdentityIcon({ size, className }: { size: number; className: string }) {
  if (size <= 32) {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className={className}>
        <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="0.8" opacity="0.18" />
        <circle cx="16" cy="16" r="8" stroke="#B87333" strokeWidth="1.2" />
        <line x1="16" y1="2" x2="16" y2="8" stroke="currentColor" strokeWidth="1.2" opacity="0.6" strokeLinecap="round" />
        <line x1="16" y1="24" x2="16" y2="30" stroke="currentColor" strokeWidth="1.2" opacity="0.6" strokeLinecap="round" />
        <line x1="2" y1="16" x2="8" y2="16" stroke="currentColor" strokeWidth="1.2" opacity="0.6" strokeLinecap="round" />
        <line x1="24" y1="16" x2="30" y2="16" stroke="currentColor" strokeWidth="1.2" opacity="0.6" strokeLinecap="round" />
        <path d="M16 2 L14.5 6.5 L16 5.8 L17.5 6.5 Z" fill="#B87333" />
        <circle cx="16" cy="16" r="2.5" fill="#B87333" />
      </svg>
    )
  }
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className={className}>
      {/* Ghost grid */}
      <line x1="8" y1="56" x2="72" y2="56" stroke="currentColor" strokeWidth="0.5" opacity="0.12" />
      <line x1="8" y1="64" x2="72" y2="64" stroke="currentColor" strokeWidth="0.5" opacity="0.10" />
      <line x1="8" y1="72" x2="72" y2="72" stroke="currentColor" strokeWidth="0.5" opacity="0.08" />
      <line x1="24" y1="48" x2="24" y2="72" stroke="currentColor" strokeWidth="0.5" opacity="0.07" />
      <line x1="40" y1="48" x2="40" y2="72" stroke="currentColor" strokeWidth="0.5" opacity="0.07" />
      <line x1="56" y1="48" x2="56" y2="72" stroke="currentColor" strokeWidth="0.5" opacity="0.07" />
      {/* Ghost orientation ring */}
      <circle cx="40" cy="36" r="18" stroke="currentColor" strokeWidth="0.6" opacity="0.12" />
      {/* Koppar precision ring */}
      <circle cx="40" cy="36" r="10" stroke="#B87333" strokeWidth="1.5" />
      {/* Cardinal spokes */}
      <line x1="40" y1="4" x2="40" y2="22" stroke="currentColor" strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />
      <line x1="40" y1="50" x2="40" y2="60" stroke="currentColor" strokeWidth="1.2" opacity="0.4" strokeLinecap="round" />
      <line x1="18" y1="36" x2="30" y2="36" stroke="currentColor" strokeWidth="1.2" opacity="0.4" strokeLinecap="round" />
      <line x1="50" y1="36" x2="62" y2="36" stroke="currentColor" strokeWidth="1.2" opacity="0.4" strokeLinecap="round" />
      {/* Tick marks on ring */}
      <line x1="40" y1="26" x2="40" y2="29" stroke="#B87333" strokeWidth="1.2" opacity="0.6" strokeLinecap="round" />
      <line x1="50" y1="36" x2="47" y2="36" stroke="#B87333" strokeWidth="1.2" opacity="0.6" strokeLinecap="round" />
      {/* North arrowhead */}
      <path d="M40 4 L37.5 13 L40 11.5 L42.5 13 Z" fill="#B87333" opacity="0.9" />
      {/* Anchor dot */}
      <circle cx="40" cy="36" r="3.5" fill="#B87333" />
      <circle cx="40" cy="64" r="2" fill="rgba(184,115,51,0.3)" />
    </svg>
  )
}

// ── Emotional & Mental — Pressure → conversion node → coherent output ──

function EmotionalIcon({ size, className }: { size: number; className: string }) {
  if (size <= 32) {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className={className}>
        {/* Irregular input wave (left) */}
        <path d="M2 16 L5 12 L7 19 L9 10 L11 18 L13 14" stroke="currentColor" strokeWidth="1.2" opacity="0.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {/* Conversion node */}
        <circle cx="16" cy="16" r="3" stroke="#A1B1C6" strokeWidth="1.5" />
        <circle cx="16" cy="16" r="1" fill="#A1B1C6" opacity="0.8" />
        {/* Smooth output wave (right) */}
        <path d="M19 16 Q21 12 23 16 Q25 20 27 16 Q29 12 31 16" stroke="#A1B1C6" strokeWidth="1.5" opacity="0.9" strokeLinecap="round" fill="none" />
      </svg>
    )
  }
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className={className}>
      {/* Ghost baseline */}
      <line x1="4" y1="40" x2="76" y2="40" stroke="currentColor" strokeWidth="0.5" opacity="0.10" />
      {/* Ghost zone boundaries */}
      <rect x="4" y="20" width="30" height="40" rx="2" stroke="currentColor" strokeWidth="0.4" opacity="0.07" fill="none" />
      <rect x="46" y="20" width="30" height="40" rx="2" stroke="currentColor" strokeWidth="0.4" opacity="0.07" fill="none" />
      {/* Irregular input wave */}
      <path d="M6 40 L10 32 L13 46 L16 28 L19 44 L22 34 L25 42 L28 30 L31 40" stroke="currentColor" strokeWidth="1.2" opacity="0.38" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Flow arrows */}
      <line x1="33" y1="40" x2="36" y2="40" stroke="currentColor" strokeWidth="0.8" opacity="0.25" strokeLinecap="round" />
      <line x1="35" y1="38" x2="37" y2="40" stroke="currentColor" strokeWidth="0.8" opacity="0.25" strokeLinecap="round" />
      <line x1="35" y1="42" x2="37" y2="40" stroke="currentColor" strokeWidth="0.8" opacity="0.25" strokeLinecap="round" />
      {/* Conversion node */}
      <circle cx="40" cy="40" r="5" stroke="#A1B1C6" strokeWidth="2" fill="rgba(161,177,198,0.12)" />
      <circle cx="40" cy="40" r="2" fill="#A1B1C6" opacity="0.8" />
      {/* Flow arrows right */}
      <line x1="43" y1="40" x2="46" y2="40" stroke="currentColor" strokeWidth="0.8" opacity="0.25" strokeLinecap="round" />
      {/* Smooth output wave */}
      <path d="M48 40 Q52 30 56 40 Q60 50 64 40 Q68 30 72 40" stroke="#A1B1C6" strokeWidth="1.7" opacity="0.9" strokeLinecap="round" fill="none" />
      {/* Performance zone fill under output */}
      <path d="M48 40 Q52 30 56 40 Q60 50 64 40 Q68 30 72 40 L72 50 L48 50 Z" fill="rgba(161,177,198,0.07)" />
      {/* Ghost labels */}
      <text x="12" y="66" fill="currentColor" opacity="0.18" fontSize="7" fontFamily="var(--font-display)" fontWeight="700" letterSpacing="0.1em">PRESSURE</text>
      <text x="54" y="66" fill="#A1B1C6" opacity="0.28" fontSize="7" fontFamily="var(--font-display)" fontWeight="700" letterSpacing="0.1em">OUTPUT</text>
    </svg>
  )
}

// ── Physical & Vital — Ascending bars + trajectory arc + apex ──

function PhysicalIcon({ size, className }: { size: number; className: string }) {
  if (size <= 32) {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className={className}>
        <rect x="4" y="22" width="4" height="7" rx="1" stroke="currentColor" strokeWidth="1" opacity="0.28" />
        <rect x="10" y="17" width="4" height="12" rx="1" stroke="currentColor" strokeWidth="1" opacity="0.40" />
        <rect x="16" y="11" width="4" height="18" rx="1" stroke="#6B8E6F" strokeWidth="1.5" />
        <rect x="22" y="5" width="4" height="24" rx="1" stroke="#6B8E6F" strokeWidth="1.5" fill="rgba(107,142,111,0.15)" />
        <path d="M4 23 Q14 13 26 5" stroke="#6B8E6F" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" fill="none" />
        <circle cx="26" cy="5" r="2" fill="#6B8E6F" opacity="0.8" />
      </svg>
    )
  }
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className={className}>
      {/* Ghost grid */}
      <line x1="8" y1="68" x2="72" y2="68" stroke="currentColor" strokeWidth="0.5" opacity="0.12" />
      <line x1="8" y1="50" x2="72" y2="50" stroke="currentColor" strokeWidth="0.5" opacity="0.07" />
      <line x1="8" y1="32" x2="72" y2="32" stroke="currentColor" strokeWidth="0.5" opacity="0.07" />
      {/* Bars ascending */}
      <rect x="8" y="52" width="10" height="16" rx="2" stroke="currentColor" strokeWidth="1" opacity="0.28" />
      <rect x="22" y="42" width="10" height="26" rx="2" stroke="currentColor" strokeWidth="1.2" opacity="0.40" />
      <rect x="36" y="30" width="10" height="38" rx="2" stroke="#6B8E6F" strokeWidth="1.5" />
      <rect x="50" y="18" width="10" height="50" rx="2" stroke="#6B8E6F" strokeWidth="1.8" fill="rgba(107,142,111,0.10)" />
      <rect x="64" y="8" width="8" height="60" rx="2" stroke="#6B8E6F" strokeWidth="1.8" fill="rgba(107,142,111,0.16)" />
      {/* Trajectory arc */}
      <path d="M10 54 Q30 32 56 14" stroke="#6B8E6F" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.55" fill="none" />
      {/* Apex dot */}
      <circle cx="68" cy="10" r="3" fill="#6B8E6F" opacity="0.8" />
      {/* Decade labels */}
      <text x="9" y="76" fill="currentColor" opacity="0.18" fontSize="7" fontFamily="var(--font-display)" fontWeight="700">30s</text>
      <text x="37" y="76" fill="currentColor" opacity="0.18" fontSize="7" fontFamily="var(--font-display)" fontWeight="700">40s</text>
      <text x="63" y="76" fill="#6B8E6F" opacity="0.35" fontSize="7" fontFamily="var(--font-display)" fontWeight="700">70s</text>
    </svg>
  )
}

// ── Connection & Leadership — Dunbar rings 5·15·150 + parallel vectors ──

function ConnectionIcon({ size, className }: { size: number; className: string }) {
  if (size <= 32) {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className={className}>
        {/* Inner ring — the 5 */}
        <circle cx="16" cy="14" r="7" stroke="#8A7264" strokeWidth="1.5" fill="rgba(138,114,100,0.07)" />
        {/* 5 pentagonal dots */}
        <circle cx="16" cy="7" r="1.5" fill="#8A7264" opacity="0.85" />
        <circle cx="22.5" cy="11.5" r="1.5" fill="#8A7264" opacity="0.85" />
        <circle cx="20" cy="19" r="1.5" fill="#8A7264" opacity="0.85" />
        <circle cx="12" cy="19" r="1.5" fill="#8A7264" opacity="0.85" />
        <circle cx="9.5" cy="11.5" r="1.5" fill="#8A7264" opacity="0.85" />
        {/* Parallel motion vectors */}
        <line x1="6" y1="27" x2="18" y2="27" stroke="currentColor" strokeWidth="1" opacity="0.28" strokeLinecap="round" />
        <path d="M16 25.5 L18 27 L16 28.5" stroke="currentColor" strokeWidth="0.8" opacity="0.28" fill="none" />
        <line x1="14" y1="30" x2="26" y2="30" stroke="currentColor" strokeWidth="1" opacity="0.22" strokeLinecap="round" />
        <path d="M24 28.5 L26 30 L24 31.5" stroke="currentColor" strokeWidth="0.8" opacity="0.22" fill="none" />
      </svg>
    )
  }
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className={className}>
      {/* 150 ring */}
      <circle cx="40" cy="34" r="30" stroke="currentColor" strokeWidth="0.6" opacity="0.10" />
      <circle cx="40" cy="4" r="1.5" fill="currentColor" opacity="0.14" />
      <circle cx="70" cy="34" r="1.5" fill="currentColor" opacity="0.14" />
      <circle cx="40" cy="64" r="1.5" fill="currentColor" opacity="0.14" />
      <circle cx="10" cy="34" r="1.5" fill="currentColor" opacity="0.14" />
      {/* 15 ring */}
      <circle cx="40" cy="34" r="18" stroke="currentColor" strokeWidth="0.7" opacity="0.18" />
      {/* 15 dots at 45° */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const r = 18
        const x = 40 + r * Math.sin((deg * Math.PI) / 180)
        const y = 34 - r * Math.cos((deg * Math.PI) / 180)
        return <circle key={deg} cx={x} cy={y} r="1.2" fill="currentColor" opacity="0.22" />
      })}
      {/* 5 ring (inner) */}
      <circle cx="40" cy="34" r="10" stroke="#8A7264" strokeWidth="2" fill="rgba(138,114,100,0.07)" />
      {/* 5 pentagonal dots */}
      {[0, 72, 144, 216, 288].map((deg) => {
        const r = 10
        const x = 40 + r * Math.sin((deg * Math.PI) / 180)
        const y = 34 - r * Math.cos((deg * Math.PI) / 180)
        return <circle key={deg} cx={x} cy={y} r="2" fill="#8A7264" opacity="0.88" />
      })}
      {/* Ghost labels */}
      <text x="56" y="8" fill="currentColor" opacity="0.16" fontSize="6" fontFamily="var(--font-display)" fontWeight="700">150</text>
      <text x="62" y="26" fill="currentColor" opacity="0.20" fontSize="6" fontFamily="var(--font-display)" fontWeight="700">15</text>
      <text x="44" y="22" fill="#8A7264" opacity="0.40" fontSize="7" fontFamily="var(--font-display)" fontWeight="700">5</text>
      {/* Parallel motion vectors */}
      <line x1="14" y1="70" x2="42" y2="70" stroke="currentColor" strokeWidth="1.2" opacity="0.28" strokeLinecap="round" />
      <path d="M40 68.5 L43 70 L40 71.5" stroke="currentColor" strokeWidth="0.9" opacity="0.28" fill="none" />
      <line x1="24" y1="74" x2="52" y2="74" stroke="currentColor" strokeWidth="1" opacity="0.22" strokeLinecap="round" />
      <path d="M50 72.5 L53 74 L50 75.5" stroke="currentColor" strokeWidth="0.8" opacity="0.22" fill="none" />
      <line x1="34" y1="78" x2="62" y2="78" stroke="currentColor" strokeWidth="0.8" opacity="0.16" strokeLinecap="round" />
    </svg>
  )
}

// ── Mission & Mastery — Flow zone diagonal band (challenge·skill axes) ──

function MissionIcon({ size, className }: { size: number; className: string }) {
  if (size <= 32) {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className={className}>
        {/* Axes */}
        <line x1="4" y1="28" x2="4" y2="4" stroke="currentColor" strokeWidth="0.8" opacity="0.18" />
        <line x1="4" y1="28" x2="28" y2="28" stroke="currentColor" strokeWidth="0.8" opacity="0.18" />
        {/* Flow band */}
        <line x1="4" y1="24" x2="24" y2="4" stroke="#6E8077" strokeWidth="1.5" opacity="0.70" />
        <line x1="8" y1="28" x2="28" y2="8" stroke="#6E8077" strokeWidth="1" opacity="0.38" />
        <path d="M4 24 L24 4 L28 8 L8 28 Z" fill="rgba(110,128,119,0.10)" />
        {/* Trajectory + dot */}
        <path d="M8 24 L14 18" stroke="#6E8077" strokeWidth="1" strokeDasharray="2 2" opacity="0.45" fill="none" />
        <circle cx="16" cy="16" r="2.5" fill="#6E8077" opacity="0.88" />
        <circle cx="16" cy="16" r="1" fill="rgba(249,247,244,0.6)" />
      </svg>
    )
  }
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className={className}>
      {/* Ghost axes */}
      <line x1="8" y1="72" x2="8" y2="4" stroke="currentColor" strokeWidth="0.8" opacity="0.18" />
      <path d="M6 6 L8 4 L10 6" stroke="currentColor" strokeWidth="0.8" opacity="0.18" fill="none" />
      <line x1="8" y1="72" x2="76" y2="72" stroke="currentColor" strokeWidth="0.8" opacity="0.18" />
      <path d="M74 70 L76 72 L74 74" stroke="currentColor" strokeWidth="0.8" opacity="0.18" fill="none" />
      {/* Axis labels */}
      <text x="2" y="12" fill="currentColor" opacity="0.22" fontSize="7" fontFamily="var(--font-display)" fontWeight="700">C</text>
      <text x="72" y="70" fill="currentColor" opacity="0.22" fontSize="7" fontFamily="var(--font-display)" fontWeight="700">S</text>
      {/* Flow band — two diagonal parallel lines */}
      <line x1="8" y1="58" x2="58" y2="8" stroke="#6E8077" strokeWidth="1.5" opacity="0.70" />
      <line x1="18" y1="72" x2="72" y2="18" stroke="#6E8077" strokeWidth="1" opacity="0.38" />
      {/* Zone fill */}
      <path d="M8 58 L58 8 L72 18 L18 72 Z" fill="rgba(110,128,119,0.10)" />
      {/* Ghost reference line inside zone */}
      <line x1="13" y1="65" x2="65" y2="13" stroke="currentColor" strokeWidth="0.6" strokeDasharray="3 3" opacity="0.12" />
      {/* Zone labels */}
      <text x="18" y="18" fill="currentColor" opacity="0.14" fontSize="6" fontFamily="var(--font-display)" fontWeight="700" letterSpacing="0.08em">ANXIETY</text>
      <text x="48" y="68" fill="currentColor" opacity="0.14" fontSize="6" fontFamily="var(--font-display)" fontWeight="700" letterSpacing="0.08em">BOREDOM</text>
      <text x="34" y="44" fill="#6E8077" opacity="0.40" fontSize="8" fontFamily="var(--font-display)" fontWeight="700" letterSpacing="0.1em">FLOW</text>
      {/* Trajectory line */}
      <path d="M16 62 L32 46" stroke="#6E8077" strokeWidth="1" strokeDasharray="2 3" opacity="0.45" fill="none" />
      {/* Position dot */}
      <circle cx="38" cy="40" r="4" fill="#6E8077" opacity="0.88" />
      <circle cx="38" cy="40" r="1.5" fill="rgba(249,247,244,0.6)" />
    </svg>
  )
}

const PILLAR_SVGS: Record<PillarId, React.FC<{ size: number; className: string }>> = {
  identity: IdentityIcon,
  emotional: EmotionalIcon,
  physical: PhysicalIcon,
  connection: ConnectionIcon,
  mission: MissionIcon,
}
