import { http, HttpResponse } from 'msw'

const API_BASE = 'http://localhost:3001/api/v2'

// Default mock data factories
const mockProfile = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  archetype: 'achiever',
  user_type: 'client',
  avatar_url: null,
}

const mockSession = {
  id: 'session-1',
  expert_id: 'expert-1',
  scheduled_at: new Date(Date.now() + 86400000).toISOString(),
  duration: 60,
  status: 'scheduled',
  session_type: 'coaching',
  meeting_url: 'https://meet.example.com/123',
  has_notes: false,
  progress: 0,
  expert: {
    id: 'expert-1',
    name: 'Dr. Smith',
    title: 'Life Coach',
    avatar_url: null,
  },
}

const mockFeedPost = {
  id: 'post-1',
  author_id: 'user-2',
  content: 'Test post content',
  created_at: new Date().toISOString(),
  likes_count: 5,
  comments_count: 2,
  is_liked: false,
  author: {
    id: 'user-2',
    name: 'Other User',
    avatar_url: null,
  },
}

const mockConversation = {
  id: 'conv-1',
  participant: {
    id: 'user-2',
    name: 'Other User',
    avatar_url: null,
  },
  last_message: {
    id: 'msg-1',
    content: 'Hello there',
    created_at: new Date().toISOString(),
    sender_id: 'user-2',
  },
  unread_count: 1,
}

const mockMessage = {
  id: 'msg-1',
  conversation_id: 'conv-1',
  sender_id: 'user-2',
  content: 'Hello there',
  created_at: new Date().toISOString(),
}

// MSW handlers — default happy-path responses
export const handlers = [
  // Profile
  http.get(`${API_BASE}/members/profile`, () =>
    HttpResponse.json(mockProfile)
  ),

  // Feed
  http.get(`${API_BASE}/members/feed`, () =>
    HttpResponse.json({ data: [mockFeedPost], pagination: { page: 1, limit: 20, total: 1, total_pages: 1, has_next: false, has_prev: false } })
  ),
  http.post(`${API_BASE}/members/feed`, () =>
    HttpResponse.json(mockFeedPost, { status: 201 })
  ),
  http.post(`${API_BASE}/members/feed/:postId/like`, () =>
    HttpResponse.json({}, { status: 200 })
  ),
  http.delete(`${API_BASE}/members/feed/:postId/like`, () =>
    HttpResponse.json({}, { status: 200 })
  ),
  http.post(`${API_BASE}/members/feed/:postId/report`, () =>
    HttpResponse.json({}, { status: 201 })
  ),
  http.get(`${API_BASE}/members/feed/:postId/comments`, () =>
    HttpResponse.json({ data: [] })
  ),
  http.post(`${API_BASE}/members/feed/:postId/comments`, () =>
    HttpResponse.json({ id: 'comment-1', content: 'Test comment' }, { status: 201 })
  ),

  // Messages
  http.get(`${API_BASE}/members/messages/conversations`, () =>
    HttpResponse.json({ data: [mockConversation] })
  ),
  http.get(`${API_BASE}/members/messages/conversations/:id`, () =>
    HttpResponse.json({ data: [mockMessage] })
  ),
  http.post(`${API_BASE}/members/messages`, () =>
    HttpResponse.json(mockMessage, { status: 201 })
  ),
  http.post(`${API_BASE}/members/messages/:messageId/report`, () =>
    HttpResponse.json({}, { status: 201 })
  ),

  // Coaching sessions
  http.get(`${API_BASE}/members/coaching/sessions`, () =>
    HttpResponse.json({ data: [mockSession], pagination: { page: 1, limit: 20, total: 1, total_pages: 1, has_next: false, has_prev: false } })
  ),
  http.patch(`${API_BASE}/members/coaching/sessions/:id/reschedule`, () =>
    HttpResponse.json({ ...mockSession, status: 'reschedule_requested' })
  ),
  http.patch(`${API_BASE}/members/coaching/sessions/:id/cancel`, () =>
    HttpResponse.json({ ...mockSession, status: 'cancelled' })
  ),

  // Experts
  http.get(`${API_BASE}/members/experts`, () =>
    HttpResponse.json({ data: [] })
  ),

  // Journey
  http.get(`${API_BASE}/members/journey`, () =>
    HttpResponse.json({ pillar_scores: {}, overall_progress: 0 })
  ),

  // Dashboard
  http.get(`${API_BASE}/members/dashboard/stats`, () =>
    HttpResponse.json({ streak: 0, sessions_completed: 0, goals_active: 0 })
  ),

  // Assessment
  http.get(`${API_BASE}/members/assessments/results`, () =>
    HttpResponse.json({ data: [] })
  ),

  // Notifications
  http.get(`${API_BASE}/members/notifications`, () =>
    HttpResponse.json({ data: [] })
  ),

  // Subscription
  http.get(`${API_BASE}/members/subscription`, () =>
    HttpResponse.json({ tier: 'free', status: 'active' })
  ),
]

export { mockProfile, mockSession, mockFeedPost, mockConversation, mockMessage }
