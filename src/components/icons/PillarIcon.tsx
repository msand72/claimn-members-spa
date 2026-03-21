/**
 * Nordic Precision Line — Pillar Icon System v2
 *
 * 5 geometric SVG icons derived from framework research models.
 * Structural strokes use currentColor (theme-adaptive).
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
        {/* Foundation grid — horizontal layers */}
        <line x1="2" y1="27" x2="30" y2="27" stroke="currentColor" strokeWidth="0.7" opacity="0.18" />
        <line x1="4" y1="23" x2="28" y2="23" stroke="currentColor" strokeWidth="0.6" opacity="0.12" />
        <line x1="6" y1="19" x2="26" y2="19" stroke="currentColor" strokeWidth="0.5" opacity="0.08" />
        {/* Vertical grid ghost */}
        <line x1="8" y1="19" x2="8" y2="27" stroke="currentColor" strokeWidth="0.5" opacity="0.07" />
        <line x1="16" y1="19" x2="16" y2="27" stroke="currentColor" strokeWidth="0.5" opacity="0.07" />
        <line x1="24" y1="19" x2="24" y2="27" stroke="currentColor" strokeWidth="0.5" opacity="0.07" />
        {/* Base anchor */}
        <circle cx="16" cy="27" r="2" stroke="#B87333" strokeWidth="1.2" fill="rgba(184,115,51,0.18)" />
        {/* Ghost full vector */}
        <line x1="16" y1="27" x2="16" y2="7" stroke="currentColor" strokeWidth="0.8" opacity="0.18" strokeLinecap="round" />
        {/* Koppar direction vector */}
        <line x1="16" y1="27" x2="16" y2="8.5" stroke="#B87333" strokeWidth="1.5" opacity="0.85" strokeLinecap="round" />
        {/* Arrowhead */}
        <path d="M16 5.5 L14 10.5 L16 9.2 L18 10.5 Z" fill="#B87333" opacity="0.9" />
      </svg>
    )
  }
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className={className}>
      {/* Foundation grid — 4 horizontal layers at base */}
      <line x1="4" y1="70" x2="76" y2="70" stroke="currentColor" strokeWidth="0.8" opacity="0.2" />
      <line x1="8" y1="63" x2="72" y2="63" stroke="currentColor" strokeWidth="0.7" opacity="0.14" />
      <line x1="12" y1="56" x2="68" y2="56" stroke="currentColor" strokeWidth="0.6" opacity="0.09" />
      <line x1="16" y1="49" x2="64" y2="49" stroke="currentColor" strokeWidth="0.5" opacity="0.06" />
      {/* Vertical grid at base */}
      <line x1="20" y1="56" x2="20" y2="70" stroke="currentColor" strokeWidth="0.5" opacity="0.07" />
      <line x1="30" y1="56" x2="30" y2="70" stroke="currentColor" strokeWidth="0.5" opacity="0.07" />
      <line x1="40" y1="56" x2="40" y2="70" stroke="currentColor" strokeWidth="0.5" opacity="0.07" />
      <line x1="50" y1="56" x2="50" y2="70" stroke="currentColor" strokeWidth="0.5" opacity="0.07" />
      <line x1="60" y1="56" x2="60" y2="70" stroke="currentColor" strokeWidth="0.5" opacity="0.07" />
      {/* Ghost orientation ring */}
      <circle cx="40" cy="36" r="18" stroke="currentColor" strokeWidth="0.6" opacity="0.1" />
      <circle cx="40" cy="36" r="10" stroke="#B87333" strokeWidth="1.3" opacity="0.6" />
      {/* Cardinal ticks on koppar ring */}
      <line x1="40" y1="26" x2="40" y2="23" stroke="#B87333" strokeWidth="1.2" opacity="0.65" strokeLinecap="round" />
      <line x1="50" y1="36" x2="53" y2="36" stroke="#B87333" strokeWidth="1.2" opacity="0.45" strokeLinecap="round" />
      {/* Base anchor */}
      <circle cx="40" cy="70" r="3.5" stroke="#B87333" strokeWidth="1.3" fill="rgba(184,115,51,0.15)" />
      {/* Ghost full vector */}
      <line x1="40" y1="70" x2="40" y2="10" stroke="currentColor" strokeWidth="0.8" opacity="0.14" strokeLinecap="round" />
      {/* Koppar direction vector */}
      <line x1="40" y1="70" x2="40" y2="11" stroke="#B87333" strokeWidth="1.6" opacity="0.82" strokeLinecap="round" />
      {/* Arrowhead */}
      <path d="M40 7 L37 14 L40 12.5 L43 14 Z" fill="#B87333" opacity="0.92" />
    </svg>
  )
}

// ── Emotional & Mental — Pressure → conversion node → coherent output ──

function EmotionalIcon({ size, className }: { size: number; className: string }) {
  if (size <= 32) {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className={className}>
        {/* Ghost baseline */}
        <line x1="2" y1="16" x2="30" y2="16" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
        {/* Chaotic input wave */}
        <polyline points="2,16 4,10 5.5,21 7,9 8.5,20 10,12 12,16" stroke="currentColor" strokeWidth="1.2" opacity="0.42" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* Conversion node */}
        <circle cx="16" cy="16" r="3.2" stroke="#A1B1C6" strokeWidth="1.5" fill="rgba(161,177,198,0.14)" />
        <circle cx="16" cy="16" r="1" fill="#A1B1C6" opacity="0.8" />
        {/* Coherent output wave */}
        <path d="M20,16 Q22.5,10.5 25,16 Q27.5,21.5 30,16" stroke="#A1B1C6" strokeWidth="1.5" opacity="0.88" fill="none" strokeLinecap="round" />
        {/* Directional arrow */}
        <path d="M13.2,13.8 L14.6,16 L13.2,18.2" stroke="#A1B1C6" strokeWidth="0.8" fill="none" opacity="0.45" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className={className}>
      {/* Ghost baseline */}
      <line x1="4" y1="40" x2="76" y2="40" stroke="currentColor" strokeWidth="0.6" opacity="0.1" />
      {/* Ghost zone boundaries */}
      <rect x="4" y="16" width="30" height="48" rx="4" stroke="currentColor" strokeWidth="0.5" opacity="0.06" fill="none" />
      <rect x="46" y="20" width="30" height="40" rx="4" stroke="#A1B1C6" strokeWidth="0.5" opacity="0.12" fill="rgba(161,177,198,0.04)" />
      {/* Chaotic input wave */}
      <polyline points="4,40 8,24 11.5,52 15,20 18.5,48 22,28 25.5,44 29,32 32,40" stroke="currentColor" strokeWidth="1.3" opacity="0.38" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Flow arrows */}
      <path d="M34,37 L37,40 L34,43" stroke="#A1B1C6" strokeWidth="1" fill="none" opacity="0.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Conversion node */}
      <circle cx="40" cy="40" r="7" stroke="#A1B1C6" strokeWidth="2" fill="rgba(161,177,198,0.12)" />
      <circle cx="40" cy="40" r="2.5" fill="#A1B1C6" opacity="0.85" />
      {/* Flow arrows out */}
      <path d="M43,37 L46,40 L43,43" stroke="#A1B1C6" strokeWidth="1" fill="none" opacity="0.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Coherent output wave */}
      <path d="M47,40 Q51.5,28 56,40 Q60.5,52 65,40 Q68,32 71,40 Q73,44 76,40" stroke="#A1B1C6" strokeWidth="1.7" opacity="0.9" fill="none" strokeLinecap="round" />
      {/* Performance zone fill */}
      <path d="M47,40 Q51.5,28 56,40 Q60.5,52 65,40 Q68,32 71,40 Q73,44 76,40 L76,55 Q71,55 68,48 Q65,52 61,52 Q57,52 54,48 Q51,52 47,52 Z" fill="rgba(161,177,198,0.07)" />
    </svg>
  )
}

// ── Physical & Vitality — Ascending bars + trajectory arc + apex ──

function PhysicalIcon({ size, className }: { size: number; className: string }) {
  if (size <= 32) {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className={className}>
        {/* Baseline */}
        <line x1="2" y1="29" x2="30" y2="29" stroke="currentColor" strokeWidth="0.6" opacity="0.2" />
        {/* Ascending bars */}
        <rect x="2" y="22" width="5" height="7" rx="1.2" stroke="currentColor" strokeWidth="1" opacity="0.3" />
        <rect x="9" y="17" width="5" height="12" rx="1.2" stroke="currentColor" strokeWidth="1.1" opacity="0.45" />
        <rect x="16" y="11" width="5" height="18" rx="1.2" stroke="#6B8E6F" strokeWidth="1.5" />
        <rect x="23" y="5" width="5" height="24" rx="1.2" stroke="#6B8E6F" strokeWidth="1.8" fill="rgba(107,142,111,0.14)" />
        {/* Trajectory arc */}
        <path d="M4.5 23 Q12 15 25.5 6" stroke="#6B8E6F" strokeWidth="1" strokeDasharray="2 2" fill="none" opacity="0.6" />
        {/* Apex dot */}
        <circle cx="25.5" cy="6" r="2.2" fill="#6B8E6F" opacity="0.85" />
      </svg>
    )
  }
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className={className}>
      {/* Grid baseline + horizontals ghost */}
      <line x1="4" y1="72" x2="76" y2="72" stroke="currentColor" strokeWidth="0.7" opacity="0.18" />
      <line x1="4" y1="56" x2="76" y2="56" stroke="currentColor" strokeWidth="0.5" opacity="0.08" />
      <line x1="4" y1="40" x2="76" y2="40" stroke="currentColor" strokeWidth="0.5" opacity="0.06" />
      <line x1="4" y1="24" x2="76" y2="24" stroke="currentColor" strokeWidth="0.5" opacity="0.05" />
      {/* Bar 1 */}
      <rect x="4" y="54" width="10" height="18" rx="2" stroke="currentColor" strokeWidth="1" opacity="0.28" />
      {/* Bar 2 */}
      <rect x="18" y="44" width="10" height="28" rx="2" stroke="currentColor" strokeWidth="1.1" opacity="0.4" />
      {/* Bar 3 */}
      <rect x="32" y="32" width="10" height="40" rx="2" stroke="#6B8E6F" strokeWidth="1.5" fill="rgba(107,142,111,0.07)" />
      {/* Bar 4 */}
      <rect x="46" y="20" width="10" height="52" rx="2" stroke="#6B8E6F" strokeWidth="1.7" fill="rgba(107,142,111,0.1)" />
      {/* Bar 5 (peak) */}
      <rect x="60" y="8" width="10" height="64" rx="2" stroke="#6B8E6F" strokeWidth="2" fill="rgba(107,142,111,0.16)" />
      {/* Trajectory arc */}
      <path d="M9 56 Q28 38 65 10" stroke="#6B8E6F" strokeWidth="1.1" strokeDasharray="2.5 2.5" fill="none" opacity="0.65" />
      {/* Apex dot */}
      <circle cx="65" cy="10" r="4" fill="#6B8E6F" opacity="0.85" />
    </svg>
  )
}

// ── Connection & Leadership — Dunbar rings 5·15·150 + parallel vectors ──

function ConnectionIcon({ size, className }: { size: number; className: string }) {
  if (size <= 32) {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className={className}>
        {/* Outer ring ghost */}
        <circle cx="16" cy="15" r="13" stroke="currentColor" strokeWidth="0.7" opacity="0.14" />
        {/* Middle ring ghost */}
        <circle cx="16" cy="15" r="9" stroke="currentColor" strokeWidth="0.8" opacity="0.22" />
        {/* Inner ring — pillar accent */}
        <circle cx="16" cy="15" r="5.5" stroke="#8A7264" strokeWidth="1.5" />
        {/* 5 dots on inner ring */}
        <circle cx="16" cy="9.5" r="1.3" fill="#8A7264" opacity="0.85" />
        <circle cx="21.2" cy="12.8" r="1.3" fill="#8A7264" opacity="0.85" />
        <circle cx="19.2" cy="19.2" r="1.3" fill="#8A7264" opacity="0.85" />
        <circle cx="12.8" cy="19.2" r="1.3" fill="#8A7264" opacity="0.85" />
        <circle cx="10.8" cy="12.8" r="1.3" fill="#8A7264" opacity="0.85" />
        {/* 3 dots on middle ring compass */}
        <circle cx="16" cy="6" r="1" fill="currentColor" opacity="0.2" />
        <circle cx="25" cy="15" r="1" fill="currentColor" opacity="0.2" />
        <circle cx="7" cy="15" r="1" fill="currentColor" opacity="0.2" />
        {/* Parallel motion vectors */}
        <line x1="5" y1="28.5" x2="11" y2="28.5" stroke="currentColor" strokeWidth="1" opacity="0.3" strokeLinecap="round" />
        <path d="M10 26.5 L12 28.5 L10 30.5" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.3" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="15" y1="28.5" x2="21" y2="28.5" stroke="currentColor" strokeWidth="1" opacity="0.3" strokeLinecap="round" />
        <path d="M20 26.5 L22 28.5 L20 30.5" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className={className}>
      {/* Outer ring — 150 layer */}
      <circle cx="40" cy="38" r="32" stroke="currentColor" strokeWidth="0.6" opacity="0.1" />
      {/* Outer dots — 4 compass points */}
      <circle cx="40" cy="6" r="1.5" fill="currentColor" opacity="0.14" />
      <circle cx="72" cy="38" r="1.5" fill="currentColor" opacity="0.14" />
      <circle cx="40" cy="70" r="1.5" fill="currentColor" opacity="0.14" />
      <circle cx="8" cy="38" r="1.5" fill="currentColor" opacity="0.14" />
      {/* Middle ring — 15 layer */}
      <circle cx="40" cy="38" r="21" stroke="currentColor" strokeWidth="0.9" opacity="0.22" />
      {/* 8 dots on middle ring */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const r = 21
        const x = 40 + r * Math.sin((deg * Math.PI) / 180)
        const y = 38 - r * Math.cos((deg * Math.PI) / 180)
        return <circle key={deg} cx={x} cy={y} r="2" fill="currentColor" opacity="0.22" />
      })}
      {/* Inner ring — 5 layer */}
      <circle cx="40" cy="38" r="11" stroke="#8A7264" strokeWidth="2" fill="rgba(138,114,100,0.07)" />
      {/* 5 pentagonal dots */}
      {[0, 72, 144, 216, 288].map((deg) => {
        const r = 11
        const x = 40 + r * Math.sin((deg * Math.PI) / 180)
        const y = 38 - r * Math.cos((deg * Math.PI) / 180)
        return <circle key={deg} cx={x} cy={y} r="2.5" fill="#8A7264" opacity="0.88" />
      })}
      {/* Parallel motion vectors */}
      <line x1="16" y1="74" x2="30" y2="74" stroke="currentColor" strokeWidth="1.2" opacity="0.28" strokeLinecap="round" />
      <path d="M28 71 L31 74 L28 77" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.28" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="36" y1="74" x2="50" y2="74" stroke="currentColor" strokeWidth="1.2" opacity="0.28" strokeLinecap="round" />
      <path d="M48 71 L51 74 L48 77" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.28" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="56" y1="74" x2="64" y2="74" stroke="currentColor" strokeWidth="1.2" opacity="0.2" strokeLinecap="round" />
    </svg>
  )
}

// ── Mission & Mastery — Flow zone diagonal band (challenge·skill axes) ──

function MissionIcon({ size, className }: { size: number; className: string }) {
  if (size <= 32) {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className={className}>
        {/* Ghost axes */}
        <line x1="4" y1="28" x2="28" y2="28" stroke="currentColor" strokeWidth="0.7" opacity="0.18" strokeLinecap="round" />
        <line x1="4" y1="28" x2="4" y2="4" stroke="currentColor" strokeWidth="0.7" opacity="0.18" strokeLinecap="round" />
        {/* Axis arrowheads */}
        <path d="M27 25.5 L29 28 L27 30.5" stroke="currentColor" strokeWidth="0.7" fill="none" opacity="0.18" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M1.5 5.5 L4 3.5 L6.5 5.5" stroke="currentColor" strokeWidth="0.7" fill="none" opacity="0.18" strokeLinecap="round" strokeLinejoin="round" />
        {/* Flow zone band */}
        <line x1="6" y1="26" x2="26" y2="7" stroke="#6E8077" strokeWidth="1.3" opacity="0.65" strokeLinecap="round" />
        <line x1="10" y1="28" x2="30" y2="10" stroke="#6E8077" strokeWidth="1.3" opacity="0.35" strokeLinecap="round" />
        <polygon points="6,26 10,28 30,10 26,7" fill="rgba(110,128,119,0.13)" />
        {/* Trajectory to dot */}
        <path d="M6,26 Q12,20 17,14" stroke="#6E8077" strokeWidth="1" fill="none" opacity="0.5" strokeDasharray="1.5 1.5" strokeLinecap="round" />
        {/* Position dot */}
        <circle cx="17" cy="14" r="2.5" fill="#6E8077" opacity="0.9" />
      </svg>
    )
  }
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className={className}>
      {/* Ghost axes */}
      <line x1="8" y1="72" x2="74" y2="72" stroke="currentColor" strokeWidth="0.7" opacity="0.18" strokeLinecap="round" />
      <line x1="8" y1="72" x2="8" y2="6" stroke="currentColor" strokeWidth="0.7" opacity="0.18" strokeLinecap="round" />
      {/* Axis arrowheads */}
      <path d="M71 69 L74 72 L71 75" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.18" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9 L8 6 L11 9" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.18" strokeLinecap="round" strokeLinejoin="round" />
      {/* Flow zone band */}
      <line x1="10" y1="62" x2="70" y2="12" stroke="#6E8077" strokeWidth="1.5" opacity="0.7" strokeLinecap="round" />
      <line x1="18" y1="72" x2="76" y2="22" stroke="#6E8077" strokeWidth="1.5" opacity="0.38" strokeLinecap="round" />
      <polygon points="10,62 18,72 76,22 70,12" fill="rgba(110,128,119,0.12)" />
      {/* Diagonal reference inside zone */}
      <line x1="20" y1="60" x2="60" y2="28" stroke="#6E8077" strokeWidth="0.6" opacity="0.18" strokeDasharray="2 3" />
      {/* Trajectory to dot */}
      <path d="M16,68 Q28,56 40,42" stroke="#6E8077" strokeWidth="1.1" fill="none" opacity="0.55" strokeDasharray="2 2" strokeLinecap="round" />
      {/* Position dot */}
      <circle cx="40" cy="42" r="5" fill="#6E8077" opacity="0.88" />
      <circle cx="40" cy="42" r="2" fill="rgba(249,247,244,0.6)" />
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
