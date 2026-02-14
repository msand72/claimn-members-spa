// =====================================================
// API Types for Phase D Endpoints
// =====================================================

// Common types
export type PillarId = 'identity' | 'emotional' | 'physical' | 'connection' | 'mission'
export type ArchetypeId = 'achiever' | 'optimizer' | 'networker' | 'grinder' | 'philosopher'

export interface ReportRequest {
  reason: string
  details?: string
}

// =====================================================
// Member Profile
// =====================================================
export interface NotificationPreferences {
  email_notifications?: boolean
  weekly_digest?: boolean
}

export interface MemberProfile {
  user_id: string
  display_name: string | null
  bio: string | null
  archetype: string | null
  pillar_focus: string[] | null
  city: string | null
  country: string | null
  links: Record<string, string> | null
  visibility: {
    profile?: 'public' | 'members' | 'connections'
    location?: 'public' | 'members' | 'connections'
    pillars?: 'public' | 'members' | 'connections'
  } | null
  avatar_url: string | null
  whatsapp_number: string | null
  notification_preferences: NotificationPreferences | null
  created_at: string
  updated_at: string
}

export interface UpdateProfileRequest {
  display_name?: string
  bio?: string
  archetype?: string
  pillar_focus?: string[]
  city?: string
  country?: string
  links?: Record<string, string>
  visibility?: MemberProfile['visibility']
  whatsapp_number?: string
  notification_preferences?: NotificationPreferences
}

// =====================================================
// Network / Members
// =====================================================
export interface NetworkMember {
  user_id: string
  display_name: string
  avatar_url: string | null
  archetype: string | null
  pillar_focus: string[] | null
  city: string | null
  country: string | null
  bio: string | null
  shared_interests?: number
  connection_status?: 'none' | 'pending' | 'connected' | 'received'
}

export interface NetworkFilters {
  search?: string
  archetype?: string
  pillar?: string
  city?: string
  country?: string
}

// =====================================================
// Connections
// =====================================================
export type ConnectionStatus = 'pending' | 'accepted' | 'rejected'

export interface Connection {
  id: string
  requester_id: string
  recipient_id: string
  addressee_id?: string // API may return this instead of recipient_id
  is_requester?: boolean // Convenience flag from API
  status: ConnectionStatus
  created_at: string
  updated_at: string
  // Populated fields
  requester?: NetworkMember
  recipient?: NetworkMember
}

export interface CreateConnectionRequest {
  addressee_id: string
  message?: string
}

// =====================================================
// Feed
// =====================================================
export interface FeedPost {
  id: string
  user_id: string
  content: string
  image_url: string | null
  interest_group_id: string | null
  likes_count: number
  comments_count: number
  is_liked: boolean
  created_at: string
  updated_at: string
  // Populated fields
  author?: {
    user_id: string
    display_name: string
    avatar_url: string | null
    archetype: string | null
  }
}

export interface CreatePostRequest {
  content: string
  image_url?: string
  interest_group_id?: string
  is_expert_question?: boolean
}

export interface FeedComment {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  // Populated fields
  author?: {
    user_id: string
    display_name: string
    avatar_url: string | null
  }
}

export interface CreateCommentRequest {
  content: string
}

// =====================================================
// Messages
// =====================================================
export interface Conversation {
  id: string
  participant_id: string
  participant: {
    user_id: string
    display_name: string
    avatar_url: string | null
  }
  other_user_type?: 'expert' | 'member' | string
  last_message: {
    content: string
    sent_at: string
    is_read: boolean
    sender_id: string
  } | null
  unread_count: number
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  recipient_id: string
  content: string
  image_url: string | null
  is_read: boolean
  created_at: string
}

export interface SendMessageRequest {
  recipient_id: string
  content: string
  image_url?: string
}

// =====================================================
// Circles
// =====================================================
export interface Circle {
  id: string
  name: string
  description: string | null
  image_url: string | null
  member_count: number
  is_member: boolean
  is_admin: boolean
  created_at: string
}

export interface CircleMember {
  user_id: string
  display_name: string
  avatar_url: string | null
  archetype: string | null
  role: 'admin' | 'moderator' | 'member'
  joined_at: string
}

export interface CirclePost {
  id: string
  circle_id: string
  user_id: string
  content: string
  image_url: string | null
  likes_count: number
  comments_count: number
  is_liked: boolean
  created_at: string
  author?: {
    user_id: string
    display_name: string
    avatar_url: string | null
  }
}

// =====================================================
// Dashboard
// =====================================================
export interface DashboardStats {
  user_id: string
  connections_count: number
  circles_count: number
  posts_count: number
  likes_received: number
  comments_received: number
  messages_unread: number
  recent_activity: {
    type: string
    timestamp: string
    summary: string
    target_id?: string
  }[]
  pillar_progress: Record<string, number>
  achievements: Achievement[]
  // Fields not yet in backend — kept for forward-compatibility
  unread_messages?: number
  days_since_joined?: number
  current_streak?: number
  goals_active?: number
  goals_completed?: number
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  earned_at: string
}

export interface DashboardData {
  profile: MemberProfile
  stats: DashboardStats
  recent_activity: {
    type: 'post' | 'comment' | 'connection' | 'circle_join'
    description: string
    created_at: string
  }[]
}

// =====================================================
// Interest Groups
// =====================================================
export interface InterestGroup {
  id: string
  interest_id: string
  name: string
  description: string | null
  icon: string | null
  member_count: number
  post_count: number
  is_member: boolean
  interest?: {
    id: string
    name: string
    slug: string
  }
}

// =====================================================
// Phase E Types (for future use)
// =====================================================

// Goals
export interface Goal {
  id: string
  user_id: string
  title: string
  description: string | null
  pillar_id: PillarId | null
  target_date: string | null
  status: 'active' | 'completed' | 'archived'
  progress: number
  created_at: string
  updated_at: string
  kpis?: KPI[]
}

export interface CreateGoalRequest {
  title: string
  description?: string
  pillar_id?: PillarId
  target_date?: string
}

export interface UpdateGoalRequest {
  title?: string
  description?: string
  pillar_id?: PillarId
  target_date?: string
  status?: 'active' | 'completed' | 'archived'
  progress?: number
}

// KPIs
export interface KPI {
  id: string
  goal_id: string
  name: string
  type: 'number' | 'percentage' | 'boolean' | 'time'
  target_value: number
  current_value: number
  unit: string | null
  frequency: 'daily' | 'weekly' | 'monthly'
  created_at: string
  updated_at: string
}

export interface KPILog {
  id: string
  kpi_id: string
  value: number
  logged_at: string
  notes: string | null
}

export interface LogKPIRequest {
  value: number
  notes?: string
}

// Action Items
export interface ActionItem {
  id: string
  user_id: string
  goal_id: string | null
  title: string
  description: string | null
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'completed' | 'cancelled'
  due_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateActionItemRequest {
  title: string
  description?: string
  goal_id?: string
  priority?: 'high' | 'medium' | 'low'
  due_date?: string
}

export interface UpdateActionItemRequest {
  title?: string
  description?: string
  priority?: 'high' | 'medium' | 'low'
  status?: 'pending' | 'completed' | 'cancelled'
  due_date?: string
}

// Protocols
export interface ActiveProtocol {
  id: string
  user_id: string
  protocol_slug: string
  protocol_name: string
  status: 'active' | 'paused' | 'completed' | 'abandoned'
  started_at: string
  current_week: number
  completed_tasks: Record<string, boolean>
  progress_percentage: number
  created_at: string
  updated_at: string
}

export interface StartProtocolRequest {
  protocol_slug: string
  protocol_name: string
  pillar?: string
  duration_weeks?: number
}

export interface UpdateProtocolProgressRequest {
  task_id: string
  completed: boolean
}

// =====================================================
// Experts & Coaching
// =====================================================

export interface Expert {
  id: string
  name: string
  title: string
  bio: string
  avatar_url: string | null
  specialties: string[]
  rating: number
  reviews_count: number
  total_sessions: number
  hourly_rate: number
  calendar_url: string | null
  is_top_rated: boolean
  created_at: string
  updated_at: string
  // Fields not yet in backend – kept optional for forward-compat
  location?: string | null
  experience?: string | null
  certifications?: string[]
  availability?: string | null
  languages?: string[]
}

export interface ExpertTestimonial {
  id: string
  expert_id: string
  author_name: string
  author_avatar_url: string | null
  rating: number
  content: string
  created_at: string
}

/** Raw availability row from backend */
export interface ExpertAvailabilityRaw {
  id: string
  expert_id: string
  day_of_week: string
  start_time: string
  end_time: string
  is_active: boolean
}

/** Availability slot used by the UI (one per row) */
export interface ExpertAvailabilitySlot {
  id: string
  day: string
  time: string
}

export interface CoachingSession {
  id: string
  user_id: string
  expert_id: string
  title: string
  scheduled_at: string
  duration: number
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  goals: string[]
  progress: number
  meeting_url: string | null
  has_notes: boolean
  has_recording: boolean
  recording_url: string | null
  created_at: string
  updated_at: string
  expert?: Expert
}

export interface SessionNote {
  id: string
  session_id: string
  key_takeaways: string[]
  action_items: SessionActionItem[]
  personal_notes: string
  created_at: string
  updated_at: string
}

export interface SessionActionItem {
  id: string
  text: string
  completed: boolean
}

export interface BookSessionRequest {
  expert_id: string
  scheduled_at: string
  duration: number
  session_type: string
  goals?: string[]
}

export interface UpdateSessionNoteRequest {
  key_takeaways?: string[]
  action_items?: SessionActionItem[]
  personal_notes?: string
}

// =====================================================
// Resources
// =====================================================

export interface Resource {
  id: string
  title: string
  description: string
  type: 'guide' | 'video' | 'podcast' | 'template' | 'pdf' | 'audio' | 'article'
  category: string
  url: string | null
  duration: string | null
  size: string | null
  is_new: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
}

export interface CoachingResource extends Resource {
  coaching_specific: boolean
}

// =====================================================
// Programs
// =====================================================

export interface Program {
  id: string
  name: string
  description: string
  duration: string
  duration_months?: number
  modules: number
  enrolled_count: number
  category: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  is_locked: boolean
  tier?: string
  objectives?: string[]
  prerequisites?: string[]
  requires_application?: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export interface UserProgram {
  id: string
  user_id: string
  program_id: string
  progress: number
  status: 'enrolled' | 'completed' | 'paused'
  enrolled_at: string
  completed_at: string | null
  program?: Program
}

export interface Sprint {
  id: string
  program_id: string
  title: string
  description: string
  start_date: string
  end_date: string
  duration: string
  status: 'upcoming' | 'active' | 'completed'
  participants: number
  max_participants: number
  goals: string[]
  progress: number
  facilitator: {
    id: string
    name: string
    avatar_url: string | null
  }
  created_at: string
}

export interface PeerReview {
  id: string
  user_id: string
  peer_id: string
  program_id: string
  assignment: string
  type: 'given' | 'received' | 'pending'
  due_date: string | null
  completed_date: string | null
  rating: number | null
  feedback: string | null
  strengths: string[]
  improvements: string[]
  peer?: {
    id: string
    name: string
    avatar_url: string | null
  }
  program?: Program
}

export interface SprintGoal {
  id: string
  sprint_id: string
  title: string
  description: string
  category: string
  target_metric: string
  sequence_order: number
  is_required: boolean
  created_at: string
  updated_at: string
}

export interface MemberSprintProgress {
  id: string
  user_id: string
  sprint_id: string
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped'
  started_at: string | null
  completed_at: string | null
  progress_percentage: number
  notes: string | null
  goals_completed: number
  total_goals: number
  created_at: string
  updated_at: string
}

export interface SubmitReviewRequest {
  rating: number
  feedback: string
  strengths?: string[]
  improvements?: string[]
}

// =====================================================
// Program Assessments (distinct from onboarding assessments)
// =====================================================

export type ProgramAssessmentType = 'baseline' | 'midline' | 'final' | 'custom'

export interface ProgramAssessment {
  id: string
  program_id: string
  name: string
  type: ProgramAssessmentType
  week_number: number | null
  is_required: boolean
  total_possible_score: number | null
  passing_score: number | null
  question_count: number
  is_completed: boolean
  completed_at: string | null
  created_at: string
  updated_at: string
  questions?: ProgramAssessmentQuestion[]
}

export interface ProgramAssessmentQuestion {
  id: string
  text: string
  question_type: 'scale' | 'multiple_choice' | 'text' | 'boolean'
  category: string | null
  options: ProgramAssessmentOption[] | null
  scale_min: number | null
  scale_max: number | null
  weight: number
  sequence_order: number
}

export interface ProgramAssessmentOption {
  value: string
  label: string
  score?: number
}

export interface ProgramAssessmentResult {
  id: string
  assessment_id: string
  member_id: string
  answers: Record<string, string | number> | null
  score: number | null
  max_score: number | null
  passed: boolean | null
  feedback: string
  submitted_at: string
  graded_at: string | null
  created_at: string
  updated_at: string
}

export interface SubmitProgramAssessmentRequest {
  answers: Record<string, string | number>
}

// =====================================================
// Program Cohorts
// =====================================================

export interface ProgramCohort {
  id: string
  program_id: string
  name: string
  description: string
  start_date: string | null
  end_date: string | null
  max_members: number
  status: 'planned' | 'active' | 'completed' | 'archived'
  member_count?: number
  members?: ProgramCohortMember[]
  created_at: string
  updated_at: string
}

export interface ProgramCohortMember {
  id: string
  member_id: string
  display_name: string
  avatar_url: string | null
  role: string
  joined_at: string
}

// =====================================================
// Program Completions
// =====================================================

export interface ProgramCompletion {
  id: string
  program_id: string
  member_id: string
  final_score?: string | null
  certificate_url?: string | null
  notes: string
  completed_at: string
  created_at: string
}

// =====================================================
// Program Applications
// =====================================================

export interface ProgramApplication {
  id: string
  program_id: string
  member_id: string
  status: 'pending' | 'accepted' | 'rejected' | 'waitlisted' | 'withdrawn'
  motivation: string
  answers?: Record<string, unknown> | null
  review_notes?: string
  submitted_at: string
  reviewed_at?: string | null
  created_at: string
  updated_at: string
}

export interface CreateApplicationRequest {
  program_id: string
  motivation: string
  answers?: Record<string, unknown>
}

export interface JoinSprintRequest {
  sprint_id: string
}

export interface EnrollProgramRequest {
  program_id: string
}

// =====================================================
// Assessments
// =====================================================

export interface Assessment {
  id: string
  name: string
  description: string
  question_count: number
  estimated_duration: string
  is_completed: boolean
  completed_at: string | null
  created_at: string
}

export interface AssessmentQuestion {
  id: string
  question_key: string
  question_text: string
  question_type: 'archetype' | 'pillar' | 'background'
  pillar_category?: PillarId
  is_reverse_scored?: boolean
  sort_order: number
  options: AssessmentOption[]
  // Legacy fields for backward compatibility during migration
  assessment_id?: string
  question?: string
  section?: string
  pillar?: string
  order?: number
}

export interface AssessmentOption {
  id?: string
  option_value?: string
  option_text?: string
  value?: string | number
  label?: string
  sort_order?: number
}

// Pillar score as stored in DB (JSONB shape)
export interface PillarScore {
  raw: number // 1-7 average
  level: 'low' | 'moderate' | 'high'
  percentage: number // (raw/7)*100
}

// Archetype scores as stored in DB (JSONB shape)
// Keys are archetype names as stored in DB (e.g. "The Achiever", "The Optimizer")
export type ArchetypeScores = Record<string, number>

// Integration insight from scoring engine
export interface AssessmentInsight {
  type: string
  title: string
  insight: string
  priority?: string
  pillar?: string
  archetype?: string
  score?: number
  level?: string
  high_pillar?: string
  low_pillar?: string
  gap_size?: number
  high_score?: number
  low_score?: number
  strong_pillars?: string[]
  weak_pillars?: string[]
  dominance_level?: string
  primary_percent?: number
  secondary_percent?: number
  balance_level?: string
  missing_archetype?: string
  gap_implication?: string
  archetypes?: string[]
  consistency_score?: number
  focus_level?: string
  leverage_pillar?: string
  development_pillar?: string
}

export interface AssessmentResult {
  id: string
  assessment_id: string
  primary_archetype: string
  secondary_archetype: string | null
  archetype_scores: ArchetypeScores
  pillar_scores: Record<PillarId, PillarScore>
  consistency_score: number
  micro_insights: AssessmentInsight[]
  integration_insights: AssessmentInsight[]
  calculated_at: string
  // Legacy fields for backward compatibility during migration
  archetypes?: string[]
  overall_score?: number
  insights?: {
    micro: Record<PillarId, string>
    integration: string[]
  }
  completed_at?: string
}

// Structured submit format matching backend scoring engine
export interface ArchetypeResponse {
  questionKey: string
  archetype?: string // Old forced-choice format (e.g. "The Achiever")
  value?: string // Big Five Likert format: "1"-"7"
  pillar_category?: string // Big Five dimension (e.g. "conscientiousness")
}

export interface PillarResponse {
  questionKey: string
  pillar: PillarId
  value: number // 1-7
}

export interface SubmitAssessmentRequest {
  archetypeResponses: ArchetypeResponse[]
  pillarResponses: PillarResponse[]
  backgroundData?: Record<string, string>
}

// Legacy flat submit format (kept for fallback)
export interface LegacySubmitAssessmentRequest {
  answers: Record<string, number>
}

// Content table lookup map
export type AssessmentContentMap = Record<string, string>

// =====================================================
// Protocol Templates
// =====================================================

export interface ProtocolTemplate {
  slug: string
  title: string
  pillar: string
  category?: string
  description: string
  headline_stat?: string
  subtitle?: string
  duration_weeks?: number
  is_featured?: boolean
  keywords?: string[]
  stats?: ProtocolStat[]
  scientific_foundation?: string
  scientific_citations?: string[]
  protocol_sections?: ProtocolSection[]
  implementation_steps?: ImplementationStep[]
  implementation_guides?: ImplementationGuide[]
  tracking_methods?: TrackingMethod[]
  success_metrics?: SuccessMetric[]
  emergency_protocols?: EmergencyProtocol[]
  related_protocol_slugs?: string[]
  prerequisite_protocol_slugs?: string[]
  hero_image_url?: string
  hero_background_style?: string
  price_id?: string
  created_at?: string
  updated_at?: string
  // Computed/legacy fields for backwards compatibility
  name?: string // alias for title
  stat?: string // alias for headline_stat
  timeline?: string // computed from duration_weeks
  weeks?: ProtocolWeek[] // legacy structure
}

export interface TrackingMethod {
  title: string
  description?: string
  frequency?: string
}

export interface SuccessMetric {
  title: string
  target?: string
  description?: string
}

export interface EmergencyProtocol {
  title: string
  description?: string
  steps?: string[]
}

export interface ProtocolWeek {
  week: number
  title: string
  description: string
  tasks: ProtocolTask[]
}

export interface ProtocolTask {
  id: string
  title: string
}

export interface ProtocolSection {
  id: string
  title: string
  icon?: string
  items: string[]
}

export interface ImplementationStep {
  step: number
  title: string
  description: string
}

export interface ImplementationGuide {
  id: string
  title: string
  description: string
  details?: string[]
}

export interface ProtocolStat {
  label?: string
  value?: string
  description?: string
  // DB seed format uses these keys
  stat?: string
  title?: string
  desc?: string
}

export interface ProtocolsByPillar {
  identity: ProtocolTemplate[]
  emotional: ProtocolTemplate[]
  physical: ProtocolTemplate[]
  connection: ProtocolTemplate[]
  mission: ProtocolTemplate[]
}

export interface LogProtocolProgressRequest {
  week: number
  notes?: string
  metrics?: Record<string, number>
}

// =====================================================
// Notifications
// =====================================================

export interface Notification {
  id: string
  type: string
  title: string
  body: string
  action_url: string | null
  metadata: Record<string, unknown>
  read_at: string | null
  created_at: string
}

export interface NotificationsResponse {
  data: Notification[]
  pagination: {
    page: number
    limit: number
    total: number
  }
}

export interface NotificationsParams {
  page?: number
  limit?: number
  read?: boolean
}

// =====================================================
// Journey
// =====================================================

export interface JourneyMilestone {
  type: string
  label: string
  completed_at: string | null
}

export interface SmartPrompt {
  type: string
  message: string
  action_url: string
}

export interface JourneyProtocol {
  id: string
  title: string
  slug: string
  progress_pct: number
  current_step: number
  total_steps: number
  assigned_by_expert: boolean
}

export interface JourneySession {
  id: string
  expert_name: string
  start_time: string
  type: string
}

export interface JourneyFocus {
  current_pillar: string | null
  changed_at: string | null
}

export interface JourneyOnboarding {
  current_step: string
}

export interface JourneyData {
  focus: JourneyFocus
  active_protocols: JourneyProtocol[]
  upcoming_sessions: JourneySession[]
  goals: unknown[]
  kpi_streaks: unknown[]
  milestones: JourneyMilestone[]
  onboarding: JourneyOnboarding
  smart_prompts: SmartPrompt[]
}

// =====================================================
// Onboarding
// =====================================================

export type OnboardingStep = 'welcome' | 'profile' | 'assessment' | 'results' | 'challenge' | 'path' | 'complete'

export type PrimaryChallenge = 'identity' | 'vitality' | 'connection' | 'emotional' | 'mission'

export interface OnboardingState {
  step: OnboardingStep
  completed_at: string | null
  primary_challenge: PrimaryChallenge | null
  recommended_protocol_id: string | null
  recommended_circle_id: string | null
}

// =====================================================
// My Expert
// =====================================================

export interface MyExpertData {
  expert: {
    id: string
    name: string
    bio: string
    avatar_url: string
    specializations: string
  }
  next_session: {
    id: string
    session_date: string
    status: string
  } | null
}

// =====================================================
// Journal
// =====================================================

export interface JournalEntry {
  id: string
  user_id: string
  entry_type: string
  content: string
  mood?: string
  pillar?: string
  created_at: string
  updated_at?: string
}

export interface JournalEntriesParams {
  page?: number
  limit?: number
}

// =====================================================
// Subscription & Billing
// =====================================================

export type SubscriptionTier = 'brotherhood' | 'coaching' | 'programs' | 'none'

export interface SubscriptionInfo {
  tier: SubscriptionTier
  status: string
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  amount?: number
  currency?: string
  interval?: string
  features?: string[]
}

// =====================================================
// Quarterly Reviews
// =====================================================

export interface QuarterlyReview {
  id: string
  coach_id: string
  member_id: string
  review_date: string
  quarter: string
  summary: string
  strengths: string[]
  areas_for_improvement: string[]
  goals_progress_notes: string
  recommendations: string
  overall_rating: number | null
  coach?: {
    id: string
    name: string
    avatar_url: string | null
  }
  created_at: string
}

export interface QuarterlyReviewsResponse {
  data: QuarterlyReview[]
  pagination?: {
    page: number
    limit: number
    total: number
  }
}

// =====================================================
// Milestones
// =====================================================

export interface Milestone {
  id: string
  title: string
  description: string
  pillar: PillarId
  target_date: string
  status: 'pending' | 'on_track' | 'delayed' | 'achieved'
  created_by: {
    id: string
    name: string
    role: 'expert' | 'facilitator'
  }
  progress_notes: string | null
  created_at: string
  updated_at: string
}

// =====================================================
// Accountability
// =====================================================

export interface AccountabilityGroup {
  id: string
  name: string
  group_type: 'trio' | 'pair' | 'small_group'
  is_active: boolean
  program_id: string | null
  cohort_id?: string | null
  facilitator_id?: string | null
  max_members?: number
  communication_channel?: string
  meeting_schedule?: string
  members?: AccountabilityMember[]
  created_at: string
  updated_at?: string
}

export interface AccountabilityMember {
  id: string
  member_id: string
  display_name: string
  avatar_url: string | null
  role?: string
  joined_at?: string
}

export interface CheckIn {
  id: string
  group_id: string
  member_id: string
  check_in_date: string
  progress_update: string | null
  challenges: string | null
  support_needed: string | null
  commitments_for_next: string | null
  week_rating: number | null
  created_at: string
}

export interface CheckInRequest {
  progress_update?: string
  challenges?: string
  support_needed?: string
  commitments_for_next?: string
  week_rating?: number
}

// =====================================================
// Interests
// =====================================================

export interface Interest {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  sort_order: number
}

// =====================================================
// Events
// =====================================================

export interface ClaimnEvent {
  id: string
  event_type: 'brotherhood_call' | 'go_session'
  title: string
  description: string
  scheduled_date: string
  duration_minutes: number
  capacity: number
  registered_count: number
  is_registered: boolean
  tier_required: string
  facilitator: {
    name: string
    avatar_url: string
  }
}

// =====================================================
// Community Questions
// =====================================================

export interface CommunityQuestion extends FeedPost {
  is_expert_question: boolean
}
