// CLAIM'N Assessment Questions — types and section metadata only
// All questions are fetched from the API at runtime

export interface AssessmentQuestion {
  id: string
  section: 'background' | 'archetype' | 'pillar'
  pillar?: 'identity' | 'emotional' | 'physical' | 'connection' | 'mission'
  question: string
  options: {
    value: number
    label: string
  }[]
}

// Section metadata
export const SECTION_INFO = {
  background: {
    title: 'About You',
    description: 'Help us understand where you are in your journey.',
    questionCount: 4,
  },
  archetype: {
    title: 'Your Style',
    description: 'Discover your natural approach to growth and challenges.',
    questionCount: 6,
  },
  pillar: {
    title: 'Life Assessment',
    description: 'Evaluate your current state across the five pillars of masculine excellence.',
    questionCount: 15,
  },
}
