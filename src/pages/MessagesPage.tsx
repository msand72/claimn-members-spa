import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassInput, GlassAvatar, GlassBadge, GlassButton, GlassModal, GlassModalFooter, GlassToast } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { Search, Send, MoreVertical, ArrowLeft, Loader2, MessageCircle, Plus } from 'lucide-react'
import { cn } from '../lib/utils'
import {
  useConversations,
  useConversationMessages,
  useSendMessage,
  useMarkConversationRead,
  useConnections,
  type Conversation,
  type Connection,
} from '../lib/api'

// Optimistic message type (displayed before API confirms)
interface OptimisticMessage {
  _optimisticId: string
  content: string
  sender_id: string
  created_at: string
  status: 'sending' | 'failed'
}

// Helper to format time ago
function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

// Helper to format message time
function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function MessagesPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [optimisticMessages, setOptimisticMessages] = useState<OptimisticMessage[]>([])
  const [toast, setToast] = useState<{ variant: 'error' | 'success'; message: string } | null>(null)
  const [showNewConversationModal, setShowNewConversationModal] = useState(false)
  const [connectionSearchQuery, setConnectionSearchQuery] = useState('')

  // Ref for auto-scrolling to latest message
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Fetch conversations from API
  const {
    data: conversationsData,
    isLoading: conversationsLoading,
    error: conversationsError,
  } = useConversations({ limit: 50 })

  // Fetch messages for selected conversation
  const {
    data: messagesData,
    isLoading: messagesLoading,
    error: messagesError,
  } = useConversationMessages(selectedConversation?.id || '', { limit: 100 })

  const sendMessage = useSendMessage()
  const markRead = useMarkConversationRead()

  // Fetch accepted connections for "New Conversation" modal
  const {
    data: connectionsData,
    isLoading: connectionsLoading,
  } = useConnections({ status: 'accepted', limit: 100 })

  const [showHeaderMenu, setShowHeaderMenu] = useState(false)
  const headerMenuRef = useRef<HTMLDivElement>(null)

  // Close header menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target as Node)) {
        setShowHeaderMenu(false)
      }
    }
    if (showHeaderMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showHeaderMenu])

  // Mark conversation as read when selected
  useEffect(() => {
    if (selectedConversation?.id && selectedConversation.unread_count > 0) {
      markRead.mutate(selectedConversation.id)
    }
  }, [selectedConversation?.id])

  const conversations = Array.isArray(conversationsData?.data) ? conversationsData.data : []
  const messages = Array.isArray(messagesData?.data) ? messagesData.data : []
  const connections: Connection[] = Array.isArray(connectionsData?.data) ? connectionsData.data : []

  // Auto-select conversation when navigating with ?user= param
  const targetUserId = searchParams.get('user')
  useEffect(() => {
    if (!targetUserId || conversationsLoading || connectionsLoading) return
    // Already selected this user
    if (selectedConversation?.participant_id === targetUserId) return

    // Try to find existing conversation
    const existing = conversations.find((conv) => conv.participant_id === targetUserId)
    if (existing) {
      setSelectedConversation(existing)
      setSearchParams({}, { replace: true })
      return
    }

    // Try to find connection and create synthetic conversation
    const conn = connections.find((c) => {
      const otherId = c.requester_id === user?.id ? c.recipient_id : c.requester_id
      return otherId === targetUserId
    })
    if (conn) {
      handleStartConversation(conn)
      setSearchParams({}, { replace: true })
    }
  }, [targetUserId, conversationsLoading, connectionsLoading, conversations, connections])

  // Filter conversations by search
  const filteredConversations = conversations.filter((conv) =>
    conv.participant?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false
  )

  // Filter connections for the new conversation modal
  const filteredConnections = connections.filter((conn) => {
    const name = conn.requester?.display_name || conn.recipient?.display_name || ''
    return name.toLowerCase().includes(connectionSearchQuery.toLowerCase())
  })

  // Auto-scroll to the latest message when messages change or optimistic messages are added
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages.length, optimisticMessages.length, scrollToBottom])

  // Also scroll when messages finish loading
  useEffect(() => {
    if (!messagesLoading && messages.length > 0) {
      // Use a small delay so the DOM can render first
      const timer = setTimeout(scrollToBottom, 50)
      return () => clearTimeout(timer)
    }
  }, [messagesLoading, scrollToBottom])

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return

    const content = messageInput.trim()
    const optimisticId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2)}`

    // Add optimistic message to local state immediately
    const optimistic: OptimisticMessage = {
      _optimisticId: optimisticId,
      content,
      sender_id: user?.id || '',
      created_at: new Date().toISOString(),
      status: 'sending',
    }
    setOptimisticMessages((prev) => [...prev, optimistic])

    // Clear input immediately for snappy UX
    setMessageInput('')

    sendMessage.mutate(
      {
        recipient_id: selectedConversation.participant_id,
        content,
      },
      {
        onSuccess: () => {
          // Remove optimistic message -- query invalidation in the hook will add the real one
          setOptimisticMessages((prev) =>
            prev.filter((msg) => msg._optimisticId !== optimisticId)
          )
        },
        onError: () => {
          // Remove optimistic message and show error toast
          setOptimisticMessages((prev) =>
            prev.filter((msg) => msg._optimisticId !== optimisticId)
          )
          setToast({ variant: 'error', message: 'Failed to send message. Please try again.' })
        },
      }
    )
  }

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv)
    // Clear optimistic messages when switching conversations
    setOptimisticMessages([])
  }

  const handleBack = () => {
    setSelectedConversation(null)
    setOptimisticMessages([])
  }

  // Start a new conversation with a connection
  const handleStartConversation = (connection: Connection) => {
    // Determine the other person in the connection
    const isRequester = connection.requester_id === user?.id
    const otherPerson = isRequester ? connection.recipient : connection.requester
    const otherPersonId = isRequester ? connection.recipient_id : connection.requester_id

    if (!otherPerson) {
      // Fallback: build participant from available data
      const fallbackName = getConnectionDisplayName(connection)
      const syntheticConversation: Conversation = {
        id: `new-${otherPersonId}`,
        participant_id: otherPersonId,
        participant: {
          user_id: otherPersonId,
          display_name: fallbackName,
          avatar_url: null,
        },
        last_message: null,
        unread_count: 0,
        updated_at: new Date().toISOString(),
      }
      setSelectedConversation(syntheticConversation)
      setShowNewConversationModal(false)
      setConnectionSearchQuery('')
      return
    }

    // Check if a conversation already exists with this person
    const existing = conversations.find(
      (conv) => conv.participant_id === otherPersonId
    )

    if (existing) {
      // Select the existing conversation
      setSelectedConversation(existing)
    } else {
      // Create a synthetic conversation to allow the user to send the first message.
      // Once they send a message, the API will create the real conversation and
      // query invalidation will populate it.
      const syntheticConversation: Conversation = {
        id: `new-${otherPersonId}`,
        participant_id: otherPersonId,
        participant: {
          user_id: otherPerson.user_id,
          display_name: otherPerson.display_name,
          avatar_url: otherPerson.avatar_url,
        },
        last_message: null,
        unread_count: 0,
        updated_at: new Date().toISOString(),
      }
      setSelectedConversation(syntheticConversation)
    }

    setShowNewConversationModal(false)
    setConnectionSearchQuery('')
  }

  // Helper to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }

  // Helper to get display name from a connection (the other person)
  const getConnectionDisplayName = (conn: Connection) => {
    const isRequester = conn.requester_id === user?.id
    return (isRequester ? conn.recipient?.display_name : conn.requester?.display_name) || 'Unknown'
  }

  return (
    <MainLayout>
      <div className="h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)]">
        <div className="mb-4 lg:mb-6">
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-kalkvit mb-1 lg:mb-2">Messages</h1>
          <p className="text-sm lg:text-base text-kalkvit/60">Connect with community members</p>
        </div>

        <div className="h-[calc(100%-4rem)] lg:h-[calc(100%-5rem)] lg:flex lg:gap-6">
          {/* Conversations List - hidden on mobile when chat is selected */}
          <GlassCard
            variant="base"
            className={cn(
              'p-0 overflow-hidden w-full lg:w-80 lg:flex-shrink-0 h-full',
              selectedConversation
                ? 'hidden lg:flex lg:flex-col'
                : 'flex flex-col'
            )}
          >
            {/* Conversation list header with search and new conversation button */}
            <div className="p-3 lg:p-4 border-b border-white/10">
              <div className="flex items-center gap-2 mb-0">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-kalkvit/40" />
                  <GlassInput
                    placeholder="Search conversations..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => setShowNewConversationModal(true)}
                  className="flex-shrink-0 p-2.5 rounded-xl bg-koppar text-kalkvit hover:bg-koppar/80 transition-all"
                  title="New conversation"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {/* Loading state */}
              {conversationsLoading && (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-koppar animate-spin" />
                </div>
              )}

              {/* Error state */}
              {conversationsError && (
                <div className="p-4 text-center text-tegelrod text-sm">
                  Failed to load conversations
                </div>
              )}

              {/* Empty state */}
              {!conversationsLoading && !conversationsError && filteredConversations.length === 0 && (
                <div className="p-4 text-center">
                  <MessageCircle className="w-8 h-8 text-kalkvit/20 mx-auto mb-2" />
                  <p className="text-kalkvit/50 text-sm">
                    {searchQuery ? 'No conversations found' : 'No messages yet'}
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={() => setShowNewConversationModal(true)}
                      className="mt-3 text-sm text-koppar hover:text-koppar/80 transition-colors"
                    >
                      Start a new conversation
                    </button>
                  )}
                </div>
              )}

              {/* Conversations list */}
              {!conversationsLoading && !conversationsError && filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={cn(
                    'w-full p-3 lg:p-4 flex items-center gap-3 text-left transition-colors',
                    selectedConversation?.id === conv.id
                      ? 'bg-koppar/20 border-l-4 border-koppar'
                      : 'hover:bg-white/[0.04]'
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <GlassAvatar initials={getInitials(conv.participant?.display_name || 'Unknown')} size="md" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-kalkvit truncate">{conv.participant?.display_name || 'Unknown'}</span>
                      <span className="text-xs text-kalkvit/40 ml-2 flex-shrink-0">
                        {formatTimeAgo(conv.updated_at)}
                      </span>
                    </div>
                    <p className="text-sm text-kalkvit/60 truncate">
                      {conv.last_message?.content || 'No messages yet'}
                    </p>
                  </div>
                  {conv.unread_count > 0 && (
                    <GlassBadge variant="koppar">{conv.unread_count}</GlassBadge>
                  )}
                </button>
              ))}
            </div>
          </GlassCard>

          {/* Chat Area - full width on mobile, flex-1 on desktop */}
          <GlassCard
            variant="elevated"
            className={cn(
              'p-0 overflow-hidden w-full lg:flex-1 h-full',
              selectedConversation
                ? 'flex flex-col'
                : 'hidden lg:flex lg:flex-col'
            )}
          >
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-3 lg:p-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2 lg:gap-3">
                    {/* Back button - mobile only */}
                    <button
                      onClick={handleBack}
                      className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-white/[0.06] transition-colors text-kalkvit/60 hover:text-kalkvit"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="relative flex-shrink-0">
                      <GlassAvatar initials={getInitials(selectedConversation.participant?.display_name || 'Unknown')} size="md" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-kalkvit truncate">{selectedConversation.participant?.display_name || 'Unknown'}</h3>
                      <p className="text-xs text-kalkvit/50">Member</p>
                    </div>
                  </div>
                  <div className="relative flex items-center" ref={headerMenuRef}>
                    <button
                      onClick={() => setShowHeaderMenu((prev) => !prev)}
                      className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors text-kalkvit/60 hover:text-kalkvit"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {showHeaderMenu && (
                      <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-xl glass-dropdown py-1 shadow-lg">
                        <button
                          onClick={() => {
                            if (selectedConversation) {
                              markRead.mutate(selectedConversation.id)
                            }
                            setShowHeaderMenu(false)
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-kalkvit hover:bg-white/[0.06] transition-colors"
                        >
                          Mark as read
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-3 lg:space-y-4"
                >
                  {/* Loading state */}
                  {messagesLoading && (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 text-koppar animate-spin" />
                    </div>
                  )}

                  {/* Error state */}
                  {messagesError && (
                    <div className="text-center text-tegelrod text-sm py-4">
                      Failed to load messages
                    </div>
                  )}

                  {/* Empty state */}
                  {!messagesLoading && !messagesError && messages.length === 0 && optimisticMessages.length === 0 && (
                    <div className="text-center text-kalkvit/50 text-sm py-8">
                      No messages yet. Start the conversation!
                    </div>
                  )}

                  {/* Messages list - reverse order since API returns newest first */}
                  {!messagesLoading && !messagesError && [...messages].reverse().map((msg) => {
                    const isOwn = msg.sender_id === user?.id
                    return (
                      <div
                        key={msg.id}
                        className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}
                      >
                        <div
                          className={cn(
                            'max-w-[85%] sm:max-w-[70%] rounded-2xl px-3 lg:px-4 py-2',
                            isOwn
                              ? 'bg-koppar text-kalkvit rounded-br-sm'
                              : 'bg-white/[0.08] text-kalkvit rounded-bl-sm'
                          )}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className={cn(
                            'text-xs mt-1',
                            isOwn ? 'text-kalkvit/70' : 'text-kalkvit/40'
                          )}>
                            {formatMessageTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    )
                  })}

                  {/* Optimistic messages (sending / failed) */}
                  {optimisticMessages.map((msg) => (
                    <div
                      key={msg._optimisticId}
                      className="flex justify-end"
                    >
                      <div className="max-w-[85%] sm:max-w-[70%] rounded-2xl px-3 lg:px-4 py-2 bg-koppar/60 text-kalkvit rounded-br-sm">
                        <p className="text-sm">{msg.content}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          {msg.status === 'sending' && (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin text-kalkvit/50" />
                              <span className="text-xs text-kalkvit/50 italic">Sending...</span>
                            </>
                          )}
                          {msg.status === 'failed' && (
                            <span className="text-xs text-tegelrod italic">Failed to send</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Scroll anchor */}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-3 lg:p-4 border-t border-white/10">
                  <div className="flex items-center gap-2 lg:gap-3">
                    <GlassInput
                      placeholder="Type a message..."
                      className="flex-1"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim()}
                      className={cn(
                        'p-3 rounded-xl transition-all flex-shrink-0',
                        messageInput.trim()
                          ? 'bg-koppar text-kalkvit hover:bg-koppar/80'
                          : 'bg-white/[0.06] text-kalkvit/30 cursor-not-allowed'
                      )}
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-kalkvit/40 p-4 text-center gap-4">
                <MessageCircle className="w-12 h-12 text-kalkvit/20" />
                <p>Select a conversation to start messaging</p>
                <GlassButton
                  variant="secondary"
                  icon={Plus}
                  onClick={() => setShowNewConversationModal(true)}
                >
                  New Conversation
                </GlassButton>
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {/* New Conversation Modal */}
      <GlassModal
        isOpen={showNewConversationModal}
        onClose={() => {
          setShowNewConversationModal(false)
          setConnectionSearchQuery('')
        }}
        title="New Conversation"
        description="Select a connection to message"
        size="md"
      >
        <div className="space-y-4">
          {/* Search connections */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-kalkvit/40" />
            <GlassInput
              placeholder="Search connections..."
              className="pl-10"
              value={connectionSearchQuery}
              onChange={(e) => setConnectionSearchQuery(e.target.value)}
            />
          </div>

          {/* Connections list */}
          <div className="max-h-[300px] overflow-y-auto -mx-1 px-1 space-y-1">
            {connectionsLoading && (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 text-koppar animate-spin" />
              </div>
            )}

            {!connectionsLoading && filteredConnections.length === 0 && (
              <div className="text-center py-6">
                <p className="text-kalkvit/50 text-sm">
                  {connectionSearchQuery
                    ? 'No connections found'
                    : 'No connections yet. Connect with members first!'}
                </p>
              </div>
            )}

            {!connectionsLoading && filteredConnections.map((conn) => {
              const displayName = getConnectionDisplayName(conn)
              return (
                <button
                  key={conn.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleStartConversation(conn)
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.06] transition-colors text-left cursor-pointer"
                >
                  <GlassAvatar initials={getInitials(displayName)} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-kalkvit truncate">{displayName}</p>
                    <p className="text-xs text-kalkvit/50">Connected</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <GlassModalFooter>
          <GlassButton
            variant="ghost"
            onClick={() => {
              setShowNewConversationModal(false)
              setConnectionSearchQuery('')
            }}
          >
            Cancel
          </GlassButton>
        </GlassModalFooter>
      </GlassModal>

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4">
          <GlassToast
            variant={toast.variant}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        </div>
      )}
    </MainLayout>
  )
}

export default MessagesPage;
