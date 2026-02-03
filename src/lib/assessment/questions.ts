// CLAIM'N Assessment Questions
// 25 questions total: 4 background, 6 archetype identification, 15 pillar assessment (light version)

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

// Background questions (4)
const backgroundQuestions: AssessmentQuestion[] = [
  {
    id: 'bg-1',
    section: 'background',
    question: 'What is your age range?',
    options: [
      { value: 1, label: '18-25' },
      { value: 2, label: '26-35' },
      { value: 3, label: '36-45' },
      { value: 4, label: '46-55' },
      { value: 5, label: '56+' },
    ],
  },
  {
    id: 'bg-2',
    section: 'background',
    question: 'What best describes your professional level?',
    options: [
      { value: 1, label: 'Early career / building foundation' },
      { value: 2, label: 'Mid-career / growing expertise' },
      { value: 3, label: 'Senior / leadership role' },
      { value: 4, label: 'Executive / C-suite' },
      { value: 5, label: 'Entrepreneur / business owner' },
    ],
  },
  {
    id: 'bg-3',
    section: 'background',
    question: 'What is your biggest challenge right now?',
    options: [
      { value: 1, label: 'Career growth and direction' },
      { value: 2, label: 'Health and energy' },
      { value: 3, label: 'Relationships and connection' },
      { value: 4, label: 'Finding purpose and meaning' },
      { value: 5, label: 'Managing stress and emotions' },
    ],
  },
  {
    id: 'bg-4',
    section: 'background',
    question: 'How committed are you to personal transformation?',
    options: [
      { value: 1, label: 'Just curious exploring options' },
      { value: 2, label: 'Ready to make small changes' },
      { value: 3, label: 'Committed to significant improvement' },
      { value: 4, label: 'All in - ready for complete transformation' },
    ],
  },
]

// Archetype identification questions (6)
const archetypeQuestions: AssessmentQuestion[] = [
  {
    id: 'arch-1',
    section: 'archetype',
    question: 'What drives you most on a daily basis?',
    options: [
      { value: 1, label: 'Setting and hitting ambitious targets' }, // Achiever
      { value: 2, label: 'Optimizing systems and processes for peak efficiency' }, // Optimizer
      { value: 3, label: 'Building meaningful relationships and expanding my network' }, // Networker
      { value: 4, label: 'Putting in the work and outgrinding everyone else' }, // Grinder
      { value: 5, label: 'Seeking deeper understanding and wisdom' }, // Philosopher
    ],
  },
  {
    id: 'arch-2',
    section: 'archetype',
    question: 'Under pressure, you tend to:',
    options: [
      { value: 1, label: 'Double down on your goals and push harder' }, // Achiever
      { value: 2, label: 'Analyze the situation and find the optimal solution' }, // Optimizer
      { value: 3, label: 'Reach out to trusted people for perspective' }, // Networker
      { value: 4, label: 'Work longer hours and power through' }, // Grinder
      { value: 5, label: 'Step back and reflect on the bigger picture' }, // Philosopher
    ],
  },
  {
    id: 'arch-3',
    section: 'archetype',
    question: 'When making a decision, you primarily rely on:',
    options: [
      { value: 1, label: 'Whether it moves you closer to your goals' }, // Achiever
      { value: 2, label: 'Data, research, and logical analysis' }, // Optimizer
      { value: 3, label: 'Input from your network and trusted advisors' }, // Networker
      { value: 4, label: 'Gut feeling backed by hard work ethic' }, // Grinder
      { value: 5, label: 'Your principles and philosophical framework' }, // Philosopher
    ],
  },
  {
    id: 'arch-4',
    section: 'archetype',
    question: 'Success to you means:',
    options: [
      { value: 1, label: 'Achieving measurable goals and recognition' }, // Achiever
      { value: 2, label: 'Having perfectly optimized systems in every area of life' }, // Optimizer
      { value: 3, label: 'Being surrounded by strong, meaningful relationships' }, // Networker
      { value: 4, label: 'Knowing you gave everything you had' }, // Grinder
      { value: 5, label: 'Living with wisdom, purpose, and inner peace' }, // Philosopher
    ],
  },
  {
    id: 'arch-5',
    section: 'archetype',
    question: 'When developing a new skill, you:',
    options: [
      { value: 1, label: 'Focus on what will give you a competitive edge' }, // Achiever
      { value: 2, label: 'Research the most efficient learning methods first' }, // Optimizer
      { value: 3, label: 'Find a mentor or community to learn with' }, // Networker
      { value: 4, label: 'Practice relentlessly until you master it' }, // Grinder
      { value: 5, label: 'Study the underlying principles and philosophy' }, // Philosopher
    ],
  },
  {
    id: 'arch-6',
    section: 'archetype',
    question: 'Your deepest concern is:',
    options: [
      { value: 1, label: 'Not reaching your full potential' }, // Achiever
      { value: 2, label: 'Inefficiency and wasted potential' }, // Optimizer
      { value: 3, label: 'Being disconnected from others' }, // Networker
      { value: 4, label: 'Not working hard enough' }, // Grinder
      { value: 5, label: 'Living without meaning or purpose' }, // Philosopher
    ],
  },
]

// Likert scale used for all pillar questions
const likertScale = [
  { value: 1, label: 'Not true at all' },
  { value: 2, label: 'Rarely true' },
  { value: 3, label: 'Sometimes true' },
  { value: 4, label: 'Moderately true' },
  { value: 5, label: 'Often true' },
  { value: 6, label: 'Very true' },
  { value: 7, label: 'Completely true' },
]

// Pillar assessment questions (15 - 3 per pillar)
const pillarQuestions: AssessmentQuestion[] = [
  // Identity & Purpose (3)
  {
    id: 'id-1',
    section: 'pillar',
    pillar: 'identity',
    question: 'I have a clear sense of my core values and what I stand for',
    options: likertScale,
  },
  {
    id: 'id-2',
    section: 'pillar',
    pillar: 'identity',
    question: 'I feel like I am living authentically as my true self',
    options: likertScale,
  },
  {
    id: 'id-3',
    section: 'pillar',
    pillar: 'identity',
    question: 'I have a strong sense of who I am, independent of my roles and responsibilities',
    options: likertScale,
  },

  // Emotional & Mental (3)
  {
    id: 'em-1',
    section: 'pillar',
    pillar: 'emotional',
    question: 'I manage stress effectively without it overwhelming me',
    options: likertScale,
  },
  {
    id: 'em-2',
    section: 'pillar',
    pillar: 'emotional',
    question: 'I can regulate my emotions even in difficult situations',
    options: likertScale,
  },
  {
    id: 'em-3',
    section: 'pillar',
    pillar: 'emotional',
    question: 'I feel at peace with myself and my inner world',
    options: likertScale,
  },

  // Physical & Vital (3)
  {
    id: 'ph-1',
    section: 'pillar',
    pillar: 'physical',
    question: 'I have consistent energy throughout the day',
    options: likertScale,
  },
  {
    id: 'ph-2',
    section: 'pillar',
    pillar: 'physical',
    question: 'I maintain a regular fitness routine that I\'m satisfied with',
    options: likertScale,
  },
  {
    id: 'ph-3',
    section: 'pillar',
    pillar: 'physical',
    question: 'I prioritize and get quality sleep most nights',
    options: likertScale,
  },

  // Connection & Leadership (3)
  {
    id: 'cn-1',
    section: 'pillar',
    pillar: 'connection',
    question: 'I have deep, meaningful relationships in my life',
    options: likertScale,
  },
  {
    id: 'cn-2',
    section: 'pillar',
    pillar: 'connection',
    question: 'I am comfortable being vulnerable and authentic with others',
    options: likertScale,
  },
  {
    id: 'cn-3',
    section: 'pillar',
    pillar: 'connection',
    question: 'I naturally step into leadership roles when needed',
    options: likertScale,
  },

  // Mission & Mastery (3)
  {
    id: 'ms-1',
    section: 'pillar',
    pillar: 'mission',
    question: 'I have a clear sense of my life mission or calling',
    options: likertScale,
  },
  {
    id: 'ms-2',
    section: 'pillar',
    pillar: 'mission',
    question: 'I am actively developing mastery in my craft or profession',
    options: likertScale,
  },
  {
    id: 'ms-3',
    section: 'pillar',
    pillar: 'mission',
    question: 'My daily work is aligned with my long-term purpose',
    options: likertScale,
  },
]

// Export all questions combined
export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  ...backgroundQuestions,
  ...archetypeQuestions,
  ...pillarQuestions,
]

// Export sections separately for use in the assessment flow
export const QUESTION_SECTIONS = {
  background: backgroundQuestions,
  archetype: archetypeQuestions,
  pillar: pillarQuestions,
}

// Section metadata
export const SECTION_INFO = {
  background: {
    title: 'About You',
    description: 'Help us understand where you are in your journey.',
    questionCount: backgroundQuestions.length,
  },
  archetype: {
    title: 'Your Style',
    description: 'Discover your natural approach to growth and challenges.',
    questionCount: archetypeQuestions.length,
  },
  pillar: {
    title: 'Life Assessment',
    description: 'Evaluate your current state across the five pillars of masculine excellence.',
    questionCount: pillarQuestions.length,
  },
}
