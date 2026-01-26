// CLAIM'N Assessment Questions
// 30 questions total: 4 background, 6 archetype identification, 24 pillar assessment

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
    question: 'What is your current age range?',
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
    question: 'How would you describe your current life stage?',
    options: [
      { value: 1, label: 'Building foundation (early career, establishing habits)' },
      { value: 2, label: 'Growth phase (advancing career, deepening relationships)' },
      { value: 3, label: 'Peak performance (leadership roles, family responsibilities)' },
      { value: 4, label: 'Legacy building (mentoring, passing on wisdom)' },
    ],
  },
  {
    id: 'bg-3',
    section: 'background',
    question: 'What area of your life needs the most attention right now?',
    options: [
      { value: 1, label: 'Career and professional growth' },
      { value: 2, label: 'Health and fitness' },
      { value: 3, label: 'Relationships and connection' },
      { value: 4, label: 'Personal identity and purpose' },
      { value: 5, label: 'Mental and emotional wellbeing' },
    ],
  },
  {
    id: 'bg-4',
    section: 'background',
    question: 'How committed are you to personal transformation?',
    options: [
      { value: 1, label: 'Just curious, exploring options' },
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
    question: 'When facing a challenge, your first instinct is to:',
    options: [
      { value: 1, label: 'Set a clear goal and work relentlessly toward it' }, // Achiever
      { value: 2, label: 'Analyze the situation and find the most efficient solution' }, // Optimizer
      { value: 3, label: 'Reach out to your network for advice and support' }, // Networker
      { value: 4, label: 'Put in the hours and outwork the competition' }, // Grinder
      { value: 5, label: 'Step back and reflect on the deeper meaning' }, // Philosopher
    ],
  },
  {
    id: 'arch-2',
    section: 'archetype',
    question: 'You feel most fulfilled when you:',
    options: [
      { value: 1, label: 'Accomplish a major goal or milestone' }, // Achiever
      { value: 2, label: 'Improve a system or process to peak efficiency' }, // Optimizer
      { value: 3, label: 'Connect people who can help each other' }, // Networker
      { value: 4, label: 'Complete a hard days work with visible results' }, // Grinder
      { value: 5, label: 'Gain a new insight or understanding about life' }, // Philosopher
    ],
  },
  {
    id: 'arch-3',
    section: 'archetype',
    question: 'Your approach to self-improvement is:',
    options: [
      { value: 1, label: 'Set ambitious targets and track progress religiously' }, // Achiever
      { value: 2, label: 'Research the best methods and optimize my routine' }, // Optimizer
      { value: 3, label: 'Learn from mentors and share knowledge with others' }, // Networker
      { value: 4, label: 'Consistent daily effort, no shortcuts' }, // Grinder
      { value: 5, label: 'Deep reading and contemplation of principles' }, // Philosopher
    ],
  },
  {
    id: 'arch-4',
    section: 'archetype',
    question: 'Others often describe you as:',
    options: [
      { value: 1, label: 'Driven and goal-oriented' }, // Achiever
      { value: 2, label: 'Analytical and systematic' }, // Optimizer
      { value: 3, label: 'Well-connected and sociable' }, // Networker
      { value: 4, label: 'Hard-working and reliable' }, // Grinder
      { value: 5, label: 'Thoughtful and wise' }, // Philosopher
    ],
  },
  {
    id: 'arch-5',
    section: 'archetype',
    question: 'When learning something new, you prefer to:',
    options: [
      { value: 1, label: 'Focus on what will help you achieve your goals fastest' }, // Achiever
      { value: 2, label: 'Understand the underlying system and mechanics' }, // Optimizer
      { value: 3, label: 'Learn alongside others and discuss insights' }, // Networker
      { value: 4, label: 'Practice repeatedly until you master it' }, // Grinder
      { value: 5, label: 'Study the history and philosophy behind it' }, // Philosopher
    ],
  },
  {
    id: 'arch-6',
    section: 'archetype',
    question: 'Your ideal weekend involves:',
    options: [
      { value: 1, label: 'Working on a side project or business goal' }, // Achiever
      { value: 2, label: 'Optimizing your health routine or environment' }, // Optimizer
      { value: 3, label: 'Attending events and catching up with friends' }, // Networker
      { value: 4, label: 'Tackling your to-do list and home projects' }, // Grinder
      { value: 5, label: 'Reading, journaling, or time in nature' }, // Philosopher
    ],
  },
]

// Pillar assessment questions (24 - about 5 per pillar)
const pillarQuestions: AssessmentQuestion[] = [
  // Identity & Purpose (5)
  {
    id: 'id-1',
    section: 'pillar',
    pillar: 'identity',
    question: 'How clear are you on your core values and what you stand for?',
    options: [
      { value: 1, label: 'Very unclear - I rarely think about this' },
      { value: 2, label: 'Somewhat unclear - I have vague ideas' },
      { value: 3, label: 'Moderate - I know some of my values' },
      { value: 4, label: 'Clear - I can articulate most of my values' },
      { value: 5, label: 'Very clear - I live by a defined set of values' },
    ],
  },
  {
    id: 'id-2',
    section: 'pillar',
    pillar: 'identity',
    question: 'How often do you feel aligned with your purpose in life?',
    options: [
      { value: 1, label: 'Almost never' },
      { value: 2, label: 'Rarely' },
      { value: 3, label: 'Sometimes' },
      { value: 4, label: 'Often' },
      { value: 5, label: 'Almost always' },
    ],
  },
  {
    id: 'id-3',
    section: 'pillar',
    pillar: 'identity',
    question: 'How confident are you in making decisions that reflect who you truly are?',
    options: [
      { value: 1, label: 'Not confident at all' },
      { value: 2, label: 'Slightly confident' },
      { value: 3, label: 'Moderately confident' },
      { value: 4, label: 'Very confident' },
      { value: 5, label: 'Extremely confident' },
    ],
  },
  {
    id: 'id-4',
    section: 'pillar',
    pillar: 'identity',
    question: 'How well do you understand what makes you unique?',
    options: [
      { value: 1, label: 'I struggle to see anything unique about me' },
      { value: 2, label: 'I have some sense but doubt it often' },
      { value: 3, label: 'I know some of my unique qualities' },
      { value: 4, label: 'I understand most of what makes me unique' },
      { value: 5, label: 'I deeply understand and embrace my uniqueness' },
    ],
  },
  {
    id: 'id-5',
    section: 'pillar',
    pillar: 'identity',
    question: 'How often do you feel you are living authentically?',
    options: [
      { value: 1, label: 'Almost never - I feel like I am always pretending' },
      { value: 2, label: 'Rarely - I often hide who I really am' },
      { value: 3, label: 'Sometimes - It depends on the situation' },
      { value: 4, label: 'Often - I am usually my true self' },
      { value: 5, label: 'Almost always - I live fully as myself' },
    ],
  },

  // Emotional & Mental (5)
  {
    id: 'em-1',
    section: 'pillar',
    pillar: 'emotional',
    question: 'How well do you manage stress in your daily life?',
    options: [
      { value: 1, label: 'Poorly - I feel overwhelmed constantly' },
      { value: 2, label: 'Not well - Stress often gets the better of me' },
      { value: 3, label: 'Moderately - I cope but it is a struggle' },
      { value: 4, label: 'Well - I have effective strategies' },
      { value: 5, label: 'Very well - I thrive under pressure' },
    ],
  },
  {
    id: 'em-2',
    section: 'pillar',
    pillar: 'emotional',
    question: 'How often do you experience negative self-talk?',
    options: [
      { value: 5, label: 'Almost never' },
      { value: 4, label: 'Rarely' },
      { value: 3, label: 'Sometimes' },
      { value: 2, label: 'Often' },
      { value: 1, label: 'Almost constantly' },
    ],
  },
  {
    id: 'em-3',
    section: 'pillar',
    pillar: 'emotional',
    question: 'How well can you identify and express your emotions?',
    options: [
      { value: 1, label: 'I struggle to know what I am feeling' },
      { value: 2, label: 'I can sometimes identify feelings but not express them' },
      { value: 3, label: 'I know my emotions but find expression difficult' },
      { value: 4, label: 'I can identify and usually express my emotions' },
      { value: 5, label: 'I am highly emotionally aware and expressive' },
    ],
  },
  {
    id: 'em-4',
    section: 'pillar',
    pillar: 'emotional',
    question: 'How resilient do you feel when facing setbacks?',
    options: [
      { value: 1, label: 'Not resilient - Setbacks devastate me' },
      { value: 2, label: 'Slightly resilient - I struggle to recover' },
      { value: 3, label: 'Moderately resilient - I eventually bounce back' },
      { value: 4, label: 'Very resilient - I recover quickly' },
      { value: 5, label: 'Extremely resilient - I grow stronger from setbacks' },
    ],
  },
  {
    id: 'em-5',
    section: 'pillar',
    pillar: 'emotional',
    question: 'How often do you feel at peace with yourself?',
    options: [
      { value: 1, label: 'Almost never' },
      { value: 2, label: 'Rarely' },
      { value: 3, label: 'Sometimes' },
      { value: 4, label: 'Often' },
      { value: 5, label: 'Almost always' },
    ],
  },

  // Physical & Vital (5)
  {
    id: 'ph-1',
    section: 'pillar',
    pillar: 'physical',
    question: 'How would you rate your overall energy levels?',
    options: [
      { value: 1, label: 'Very low - I feel drained most of the time' },
      { value: 2, label: 'Low - I often feel tired' },
      { value: 3, label: 'Moderate - I have enough energy for basics' },
      { value: 4, label: 'High - I feel energized most days' },
      { value: 5, label: 'Very high - I have abundant energy' },
    ],
  },
  {
    id: 'ph-2',
    section: 'pillar',
    pillar: 'physical',
    question: 'How consistent is your exercise routine?',
    options: [
      { value: 1, label: 'Non-existent - I rarely exercise' },
      { value: 2, label: 'Inconsistent - I exercise sporadically' },
      { value: 3, label: 'Somewhat consistent - 1-2 times per week' },
      { value: 4, label: 'Consistent - 3-4 times per week' },
      { value: 5, label: 'Very consistent - 5+ times per week' },
    ],
  },
  {
    id: 'ph-3',
    section: 'pillar',
    pillar: 'physical',
    question: 'How would you rate your sleep quality?',
    options: [
      { value: 1, label: 'Very poor - I rarely feel rested' },
      { value: 2, label: 'Poor - I often wake up tired' },
      { value: 3, label: 'Moderate - Sleep quality varies' },
      { value: 4, label: 'Good - I usually sleep well' },
      { value: 5, label: 'Excellent - I consistently wake refreshed' },
    ],
  },
  {
    id: 'ph-4',
    section: 'pillar',
    pillar: 'physical',
    question: 'How well do you manage your nutrition?',
    options: [
      { value: 1, label: 'Poorly - I eat whatever is convenient' },
      { value: 2, label: 'Not well - I know I should eat better' },
      { value: 3, label: 'Moderately - I try but not consistently' },
      { value: 4, label: 'Well - I eat healthy most of the time' },
      { value: 5, label: 'Very well - I have a disciplined approach' },
    ],
  },
  {
    id: 'ph-5',
    section: 'pillar',
    pillar: 'physical',
    question: 'How satisfied are you with your physical appearance?',
    options: [
      { value: 1, label: 'Very unsatisfied' },
      { value: 2, label: 'Unsatisfied' },
      { value: 3, label: 'Neutral' },
      { value: 4, label: 'Satisfied' },
      { value: 5, label: 'Very satisfied' },
    ],
  },

  // Connection & Leadership (5)
  {
    id: 'cn-1',
    section: 'pillar',
    pillar: 'connection',
    question: 'How strong is your support network of close friends or family?',
    options: [
      { value: 1, label: 'Very weak - I feel isolated' },
      { value: 2, label: 'Weak - I have few people I can rely on' },
      { value: 3, label: 'Moderate - I have some support' },
      { value: 4, label: 'Strong - I have reliable people in my life' },
      { value: 5, label: 'Very strong - I have a deep support network' },
    ],
  },
  {
    id: 'cn-2',
    section: 'pillar',
    pillar: 'connection',
    question: 'How comfortable are you being vulnerable with others?',
    options: [
      { value: 1, label: 'Very uncomfortable - I never open up' },
      { value: 2, label: 'Uncomfortable - I rarely share deep feelings' },
      { value: 3, label: 'Somewhat comfortable - With select people' },
      { value: 4, label: 'Comfortable - I can be open with trusted people' },
      { value: 5, label: 'Very comfortable - Vulnerability is a strength' },
    ],
  },
  {
    id: 'cn-3',
    section: 'pillar',
    pillar: 'connection',
    question: 'How would you rate your communication skills in relationships?',
    options: [
      { value: 1, label: 'Very poor - I struggle to express myself' },
      { value: 2, label: 'Poor - Communication often leads to conflict' },
      { value: 3, label: 'Moderate - I communicate adequately' },
      { value: 4, label: 'Good - I communicate clearly and listen well' },
      { value: 5, label: 'Excellent - I am a skilled communicator' },
    ],
  },
  {
    id: 'cn-4',
    section: 'pillar',
    pillar: 'connection',
    question: 'How often do you take on leadership roles?',
    options: [
      { value: 1, label: 'Never - I avoid leadership' },
      { value: 2, label: 'Rarely - Only when necessary' },
      { value: 3, label: 'Sometimes - When the situation calls for it' },
      { value: 4, label: 'Often - I naturally step up' },
      { value: 5, label: 'Always - I seek leadership opportunities' },
    ],
  },
  {
    id: 'cn-5',
    section: 'pillar',
    pillar: 'connection',
    question: 'How satisfied are you with the quality of your relationships?',
    options: [
      { value: 1, label: 'Very unsatisfied' },
      { value: 2, label: 'Unsatisfied' },
      { value: 3, label: 'Neutral' },
      { value: 4, label: 'Satisfied' },
      { value: 5, label: 'Very satisfied' },
    ],
  },

  // Mission & Mastery (4)
  {
    id: 'ms-1',
    section: 'pillar',
    pillar: 'mission',
    question: 'How clear are you on your professional or life mission?',
    options: [
      { value: 1, label: 'Very unclear - I have no idea' },
      { value: 2, label: 'Unclear - I have vague notions' },
      { value: 3, label: 'Somewhat clear - I have some direction' },
      { value: 4, label: 'Clear - I know my mission' },
      { value: 5, label: 'Very clear - I live my mission daily' },
    ],
  },
  {
    id: 'ms-2',
    section: 'pillar',
    pillar: 'mission',
    question: 'How often do you work on developing mastery in your craft or skill?',
    options: [
      { value: 1, label: 'Almost never' },
      { value: 2, label: 'Rarely' },
      { value: 3, label: 'Sometimes' },
      { value: 4, label: 'Often' },
      { value: 5, label: 'Daily' },
    ],
  },
  {
    id: 'ms-3',
    section: 'pillar',
    pillar: 'mission',
    question: 'How aligned is your daily work with your long-term goals?',
    options: [
      { value: 1, label: 'Not aligned at all' },
      { value: 2, label: 'Slightly aligned' },
      { value: 3, label: 'Moderately aligned' },
      { value: 4, label: 'Well aligned' },
      { value: 5, label: 'Perfectly aligned' },
    ],
  },
  {
    id: 'ms-4',
    section: 'pillar',
    pillar: 'mission',
    question: 'How productive do you feel in pursuing meaningful work?',
    options: [
      { value: 1, label: 'Very unproductive - I waste most of my time' },
      { value: 2, label: 'Unproductive - I struggle with focus' },
      { value: 3, label: 'Moderately productive - I get some things done' },
      { value: 4, label: 'Productive - I accomplish my priorities' },
      { value: 5, label: 'Highly productive - I maximize my time' },
    ],
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
