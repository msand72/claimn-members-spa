// =====================================================
// API Types for Phase D Endpoints
// =====================================================

// Common types
export type PillarId = 'identity' | 'emotional' | 'physical' | 'connection' | 'mission'
export type ArchetypeId = 'achiever' | 'optimizer' | 'networker' | 'grinder' | 'philosopher'

// =====================================================
// Member Profile
// =====================================================
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
  status: ConnectionStatus
  created_at: string
  updated_at: string
  // Populated fields
  requester?: NetworkMember
  recipient?: NetworkMember
}

export interface CreateConnectionRequest {
  recipient_id: string
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
  connections_count: number
  circles_count: number
  posts_count: number
  unread_messages: number
  days_since_joined: number
  current_streak?: number
  goals_active?: number
  goals_completed?: number
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
}

export interface UpdateProtocolProgressRequest {
  task_id: string
  completed: boolean
}
