/**
 * Pillar Visual Identity — Single source of truth
 *
 * Five distinct colors tested at 12px badge size on both
 * #1C1C1E (dark) and #F9F7F4 (light) backgrounds.
 */

export type PillarId = 'identity' | 'emotional' | 'physical' | 'connection' | 'mission'

export interface PillarConfig {
  id: PillarId
  name: string
  shortName: string
  color: string
  colorLo: string      // rgba low opacity for badge backgrounds
  colorBorder: string   // rgba for badge borders
  description: string
}

export const PILLAR_COLORS: Record<PillarId, string> = {
  identity: '#B87333',   // Koppar — the foundation, the direction
  emotional: '#A1B1C6',  // Blågrå — clarity, signal, coherence
  physical: '#6B8E6F',   // Skogsgrön — growth, sustained ascent
  connection: '#8A7264',  // Jordbrun lightened — earth, structure, trust
  mission: '#6E8077',    // Oliv lightened — precision, the optimal zone
}

export const PILLAR_CONFIG: Record<PillarId, PillarConfig> = {
  identity: {
    id: 'identity',
    name: 'Identity & Purpose',
    shortName: 'Identity',
    color: '#B87333',
    colorLo: 'rgba(184,115,51,0.12)',
    colorBorder: 'rgba(184,115,51,0.28)',
    description: 'Compass, direction, strategic life clarity',
  },
  emotional: {
    id: 'emotional',
    name: 'Emotional & Mental',
    shortName: 'Mental',
    color: '#A1B1C6',
    colorLo: 'rgba(161,177,198,0.12)',
    colorBorder: 'rgba(161,177,198,0.28)',
    description: 'Neural pathways, EQ, mental resilience, focus',
  },
  physical: {
    id: 'physical',
    name: 'Physical & Vital',
    shortName: 'Physical',
    color: '#6B8E6F',
    colorLo: 'rgba(107,142,111,0.12)',
    colorBorder: 'rgba(107,142,111,0.28)',
    description: 'Athletic performance, sleep, energy, longevity',
  },
  connection: {
    id: 'connection',
    name: 'Connection & Leadership',
    shortName: 'Connection',
    color: '#8A7264',
    colorLo: 'rgba(138,114,100,0.12)',
    colorBorder: 'rgba(138,114,100,0.28)',
    description: 'Brotherhood, trust, leadership presence',
  },
  mission: {
    id: 'mission',
    name: 'Mission & Mastery',
    shortName: 'Mission',
    color: '#6E8077',
    colorLo: 'rgba(110,128,119,0.12)',
    colorBorder: 'rgba(110,128,119,0.28)',
    description: 'Flow state, deliberate practice, achievement',
  },
}

export const PILLAR_IDS: readonly PillarId[] = ['identity', 'emotional', 'physical', 'connection', 'mission']

/** Get CSS text color class for a pillar */
export const PILLAR_TEXT_CLASSES: Record<PillarId, string> = {
  identity: 'text-[#B87333]',
  emotional: 'text-[#A1B1C6]',
  physical: 'text-[#6B8E6F]',
  connection: 'text-[#8A7264]',
  mission: 'text-[#6E8077]',
}
