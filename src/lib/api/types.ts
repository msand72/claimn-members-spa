// =====================================================
// API Types for Phase D Endpoints
// =====================================================

// Common types
export type PillarId = 'identity' | 'emotional' | 'physical' | 'connection' | 'mission'
export type ArchetypeId = 'achiever' | 'optimizer' | 'networker' | 'grinder' | 'philosopher'

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
  modules: number
  enrolled_count: number
  category: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  is_locked: boolean
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

export interface SubmitReviewRequest {
  rating: number
  feedback: string
  strengths?: string[]
  improvements?: string[]
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
