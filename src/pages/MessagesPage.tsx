import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useLocation } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { safeOpenUrl } from '../lib/url-validation'
import { GlassCard, GlassInput, GlassAvatar, GlassBadge, GlassButton, GlassModal, GlassModalFooter, GlassToast } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { Search, Send, MoreVertical, ArrowLeft, Loader2, MessageCircle, Plus, ImagePlus, X, Flag } from 'lucide-react'
import { api } from '../lib/api/client'
import { validateImageFile, compressMessageImage, blobToFile } from '../lib/image-utils'
import { cn } from '../lib/utils'
import {
  useConversations,
  useConversationMessages,
  useSendMessage,
  useMarkConversationRead,
  useReportMessage,
  useConnections,
  type Conversation,
} from '../lib/api'
import { ReportModal } from '../components/ReportModal'

// Optimistic message type (displayed before API confirms)
interface OptimisticMessage {
  _optimisticId: string
  content: string
  image_url?: string | null
  sender_id: string
  created_at: string
  status: 'sending' | 'sent' | 'failed'
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
  const location = useLocation()
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [optimisticMessages, setOptimisticMessages] = useState<OptimisticMessage[]>([])
  const [toast, setToast] = useState<{ variant: 'error' | 'success'; message: string } | null>(null)
  const [showNewConversationModal, setShowNewConversationModal] = useState(false)
  const [connectionSearchQuery, setConnectionSearchQuery] = useState('')
  const [pendingImage, setPendingImage] = useState<{ file: File; preview: string } | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

  // Ref for auto-scrolling to latest message
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Fetch conversations from API
  const {
    data: conversationsData,
    isLoading: conversationsLoading,
    error: conversationsError,
  } = useConversations({ limit: 50 })

  // Fetch messages for selected conversation (skip for synthetic new- conversations)
  // Use participant_id as conversation key — the API may use user-to-user addressing
  // since conversation_id can be empty from the backend
  const isRealConversation = !!selectedConversation?.id && !selectedConversation.id.startsWith('new-')
  const conversationKey = isRealConversation ? (selectedConversation.id || selectedConversation.participant_id) : ''
  const {
    data: messagesData,
    isLoading: messagesLoading,
    error: messagesError,
  } = useConversationMessages(conversationKey, { limit: 100 })

  const sendMessage = useSendMessage()
  const markRead = useMarkConversationRead()
  const reportMessage = useReportMessage()
  const [reportMessageId, setReportMessageId] = useState<string | null>(null)

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

  // Mark conversation as read when selected (skip synthetic conversations)
  useEffect(() => {
    if (selectedConversation?.id && !selectedConversation.id?.startsWith('new-') && selectedConversation.unread_count > 0) {
      markRead.mutate(selectedConversation.id)
    }
  }, [selectedConversation?.id])

  // Normalize raw conversation objects from API into the Conversation shape the UI expects.
  // API returns: { conversation_id, other_user_id, other_user_name, other_user_avatar, last_message (string), last_message_at, unread_count }
  // UI expects: { id, participant_id, participant: { user_id, display_name, avatar_url }, last_message: { content, sent_at, ... }, unread_count, updated_at }
  //
  // IMPORTANT: conversation_id from the API is often empty string "".
  // We use other_user_id as the conversation identifier in that case, since the
  // useConversationMessages hook handles 404 fallback to user-based lookup.
  const rawConversations: Record<string, unknown>[] = Array.isArray(conversationsData?.data) ? conversationsData.data as unknown as Record<string, unknown>[] : []
  const conversations: Conversation[] = rawConversations.map((raw) => {
    // Prefer real conversation_id, fall back to other_user_id
    const conversationId = (raw.conversation_id as string) || (raw.id as string) || ''
    const otherUserId = (raw.other_user_id as string) || (raw.participant_id as string) || ''
    // Use real conversation_id if available, otherwise other_user_id as the lookup key
    const effectiveId = conversationId || otherUserId
    return {
      id: effectiveId,
      participant_id: otherUserId,
      participant: raw.participant
        ? raw.participant as Conversation['participant']
        : {
            user_id: (raw.other_user_id as string) || '',
            display_name: (raw.other_user_name as string) || 'Unknown',
            avatar_url: (raw.other_user_avatar as string) || null,
          },
      other_user_type: (raw.other_user_type as string) || undefined,
      last_message: raw.last_message && typeof raw.last_message === 'object'
        ? raw.last_message as Conversation['last_message']
        : typeof raw.last_message === 'string'
          ? { content: raw.last_message, sent_at: (raw.last_message_at as string) || '', is_read: true, sender_id: '' }
          : null,
      unread_count: (raw.unread_count as number) || 0,
      updated_at: (raw.last_message_at as string) || (raw.updated_at as string) || (raw.created_at as string) || '',
    }
  })

  // Normalize messages: backend may return 'body' instead of 'content'
  const rawMessages = Array.isArray(messagesData?.data) ? messagesData.data : []
  const messages = rawMessages.map((msg: any) => ({
    ...msg,
    content: msg.content || msg.body || '',
  }))
  // Build a unified message list: real messages (chronological) + pending optimistic messages.
  // Merging into one array avoids DOM element swaps that cause flickering.
  type UnifiedMessage = {
    id: string
    content: string
    image_url?: string | null
    sender_id: string
    created_at: string
    _optimistic?: boolean
    _status?: 'sending' | 'sent' | 'failed'
  }
  const unifiedMessages: UnifiedMessage[] = [
    ...[...messages].reverse().map((msg: any) => ({
      id: msg.id as string,
      content: msg.content as string,
      image_url: (msg.image_url as string | null) ?? null,
      sender_id: msg.sender_id as string,
      created_at: msg.created_at as string,
    })),
    // Only append optimistic messages that don't match a real message
    ...optimisticMessages
      .filter((opt) =>
        !messages.some(
          (real: any) => real.content === opt.content && real.sender_id === opt.sender_id
        )
      )
      .map((opt) => ({
        id: opt._optimisticId,
        content: opt.content,
        image_url: opt.image_url ?? null,
        sender_id: opt.sender_id,
        created_at: opt.created_at,
        _optimistic: true as const,
        _status: opt.status,
      })),
  ]
  // For sidebar optimistic updates, check if there are any pending optimistic messages
  const pendingOptimistic = optimisticMessages.filter((opt) =>
    opt.status !== 'failed' &&
    !messages.some((real: any) => real.content === opt.content && real.sender_id === opt.sender_id)
  )

  // Build connected members from connections API.
  // API uses 'addressee_id' (not 'recipient_id') and provides 'is_requester' convenience flag.
  const rawConnections: Record<string, unknown>[] = Array.isArray(connectionsData?.data) ? connectionsData.data as unknown as Record<string, unknown>[] : []
  const connectedMembers = rawConnections.map((conn) => {
    const isRequester = conn.is_requester === true || conn.requester_id === user?.id
    const otherId = isRequester
      ? ((conn.addressee_id as string) || (conn.recipient_id as string) || '')
      : (conn.requester_id as string) || ''
    const otherProfile = (isRequester ? conn.recipient : conn.requester) as Record<string, unknown> | undefined
    return {
      user_id: (otherProfile?.user_id as string) || otherId,
      display_name: (otherProfile?.display_name as string) || 'Member',
      avatar_url: (otherProfile?.avatar_url as string) || null,
      archetype: (otherProfile?.archetype as string) || null,
    }
  })

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

    // Try to find member in network and create synthetic conversation
    const member = connectedMembers.find((m) => m.user_id === targetUserId)
    if (member) {
      handleStartConversationWithMember(member)
      setSearchParams({}, { replace: true })
      return
    }

    // Fallback: use route state (e.g. from expert pages) to start conversation
    // with someone who isn't in the user's connections list
    const state = location.state as { participantName?: string; participantAvatar?: string | null; participantType?: string; initialMessage?: string } | null
    if (state?.participantName) {
      handleStartConversationWithMember({
        user_id: targetUserId,
        display_name: state.participantName,
        avatar_url: state.participantAvatar ?? null,
        other_user_type: state.participantType,
      })
      setSearchParams({}, { replace: true })
    }
  }, [targetUserId, conversationsLoading, connectionsLoading, conversations, connectedMembers, location.state])

  // Pre-fill message input from route state (e.g. from AskExpertButton context)
  useEffect(() => {
    const state = location.state as { initialMessage?: string } | null
    if (state?.initialMessage) {
      setMessageInput(state.initialMessage)
      window.history.replaceState({}, '')
    }
  }, [location.state])

  // Apply optimistic last_message updates to the conversation list.
  // When the user sends a message, the sidebar should immediately show
  // the new message text and "Just now" timestamp — before the API confirms.
  const latestOptimistic = pendingOptimistic.length > 0 ? pendingOptimistic[pendingOptimistic.length - 1] : null
  const conversationsWithOptimistic = conversations.map((conv) => {
    // If this is the selected conversation and we have optimistic messages, update its preview
    if (selectedConversation && conv.participant_id === selectedConversation.participant_id && latestOptimistic) {
      return {
        ...conv,
        last_message: {
          content: latestOptimistic.content,
          sent_at: latestOptimistic.created_at,
          is_read: true,
          sender_id: latestOptimistic.sender_id,
        },
        updated_at: latestOptimistic.created_at,
      }
    }
    return conv
  })

  // Include the synthetic conversation in the list if it's not already there
  const allConversations = (() => {
    if (
      selectedConversation?.id?.startsWith('new-') &&
      !conversationsWithOptimistic.some((c) => c.participant_id === selectedConversation.participant_id)
    ) {
      // If there are optimistic messages, show the latest one in the synthetic conversation too
      const syntheticWithOptimistic = latestOptimistic
        ? {
            ...selectedConversation,
            last_message: {
              content: latestOptimistic.content,
              sent_at: latestOptimistic.created_at,
              is_read: true,
              sender_id: latestOptimistic.sender_id,
            },
            updated_at: latestOptimistic.created_at,
          }
        : selectedConversation
      return [syntheticWithOptimistic, ...conversationsWithOptimistic]
    }
    return conversationsWithOptimistic
  })()

  // Filter conversations by search
  const filteredConversations = allConversations.filter((conv) =>
    conv.participant?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false
  )

  // Filter connected members for the new conversation modal
  const filteredMembers = connectedMembers.filter((member) =>
    member.display_name.toLowerCase().includes(connectionSearchQuery.toLowerCase())
  )

  // Auto-scroll to the latest message when messages change or optimistic messages are added
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [unifiedMessages.length, scrollToBottom])

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

  // Image picker handler
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const error = validateImageFile(file)
    if (error) {
      setToast({ variant: 'error', message: error })
      return
    }

    const preview = URL.createObjectURL(file)
    setPendingImage({ file, preview })

    // Reset input so the same file can be re-selected
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  const clearPendingImage = () => {
    if (pendingImage) {
      URL.revokeObjectURL(pendingImage.preview)
      setPendingImage(null)
    }
  }

  const handleSendMessage = async () => {
    if ((!messageInput.trim() && !pendingImage) || !selectedConversation) return

    const content = messageInput.trim()
    const optimisticId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2)}`

    // Add optimistic message to local state immediately
    const optimistic: OptimisticMessage = {
      _optimisticId: optimisticId,
      content: content || (pendingImage ? '📷 Image' : ''),
      image_url: pendingImage?.preview ?? null,
      sender_id: user?.id || '',
      created_at: new Date().toISOString(),
      status: 'sending',
    }
    setOptimisticMessages((prev) => [...prev, optimistic])

    // Clear input immediately for snappy UX
    setMessageInput('')
    const imageToUpload = pendingImage
    setPendingImage(null)

    // Upload image if present
    let imageUrl: string | undefined
    if (imageToUpload) {
      try {
        setIsUploading(true)
        const compressed = await compressMessageImage(imageToUpload.file)
        const compressedFile = blobToFile(compressed, `msg-${Date.now()}.jpg`, 'image/jpeg')
        const result = await api.uploadFile('/members/messages/upload', compressedFile, 'image')
        imageUrl = result.url
        // Replace the blob preview URL with the server URL so the image persists
        setOptimisticMessages((prev) =>
          prev.map((msg) =>
            msg._optimisticId === optimisticId ? { ...msg, image_url: imageUrl! } : msg
          )
        )
        URL.revokeObjectURL(imageToUpload.preview)
      } catch {
        setOptimisticMessages((prev) =>
          prev.map((msg) =>
            msg._optimisticId === optimisticId ? { ...msg, status: 'failed' as const } : msg
          )
        )
        setToast({ variant: 'error', message: 'Failed to upload image.' })
        URL.revokeObjectURL(imageToUpload.preview)
        return
      } finally {
        setIsUploading(false)
      }
    }

    sendMessage.mutate(
      {
        recipient_id: selectedConversation.participant_id,
        content: content || '',
        ...(imageUrl ? { image_url: imageUrl } : {}),
      },
      {
        onSuccess: () => {
          setOptimisticMessages((prev) =>
            prev.map((msg) =>
              msg._optimisticId === optimisticId ? { ...msg, status: 'sent' as const } : msg
            )
          )
          if (selectedConversation.id.startsWith('new-')) {
            setSelectedConversation({
              ...selectedConversation,
              id: selectedConversation.participant_id,
            })
          }
        },
        onError: () => {
          setOptimisticMessages((prev) =>
            prev.map((msg) =>
              msg._optimisticId === optimisticId ? { ...msg, status: 'failed' as const } : msg
            )
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

  // Start a new conversation with a connected member
  const handleStartConversationWithMember = (member: { user_id: string; display_name: string; avatar_url: string | null; other_user_type?: string }) => {
    // Check if a conversation already exists with this person
    const existing = conversations.find(
      (conv) => conv.participant_id === member.user_id
    )

    if (existing) {
      setSelectedConversation(existing)
    } else {
      // Create a synthetic conversation to allow the user to send the first message.
      // Once they send a message, the API will create the real conversation and
      // query invalidation will populate it.
      const syntheticConversation: Conversation = {
        id: `new-${member.user_id}`,
        participant_id: member.user_id,
        participant: {
          user_id: member.user_id,
          display_name: member.display_name,
          avatar_url: member.avatar_url,
        },
        other_user_type: member.other_user_type,
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
                      <p className="text-xs text-kalkvit/50">{selectedConversation.other_user_type === 'expert' ? 'Expert' : 'Member'}</p>
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
                  {!messagesLoading && !messagesError && unifiedMessages.length === 0 && (
                    <div className="text-center text-kalkvit/50 text-sm py-8">
                      No messages yet. Start the conversation!
                    </div>
                  )}

                  {/* Unified messages list (real + optimistic merged to prevent flickering) */}
                  {!messagesLoading && !messagesError && unifiedMessages.map((msg) => {
                    const isOwn = msg.sender_id === user?.id
                    const isFailed = msg._optimistic && msg._status === 'failed'
                    const isSending = msg._optimistic && msg._status === 'sending'
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          'group flex items-end gap-1.5',
                          isOwn ? 'justify-end' : 'justify-start'
                        )}
                      >
                        <div
                          className={cn(
                            'max-w-[85%] sm:max-w-[70%] rounded-2xl px-3 lg:px-4 py-2',
                            isOwn
                              ? isFailed
                                ? 'bg-koppar/40 text-kalkvit rounded-br-sm'
                                : 'bg-koppar text-kalkvit rounded-br-sm'
                              : 'bg-white/[0.08] text-kalkvit rounded-bl-sm'
                          )}
                        >
                          {msg.image_url && (
                            <img
                              src={msg.image_url}
                              alt=""
                              className="rounded-lg max-w-full max-h-60 object-cover mb-1 cursor-pointer"
                              onClick={() => safeOpenUrl(msg.image_url!)}
                            />
                          )}
                          {msg.content && <p className="text-sm">{msg.content}</p>}
                          {isFailed ? (
                            <p className="text-xs text-tegelrod mt-1 italic">Failed to send</p>
                          ) : (
                            <p className={cn(
                              'text-xs mt-1',
                              isOwn ? 'text-kalkvit/70' : 'text-kalkvit/40'
                            )}>
                              {msg._optimistic ? 'Just now' : formatMessageTime(msg.created_at)}
                            </p>
                          )}
                        </div>
                        {isSending && (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-kalkvit/40 flex-shrink-0 mb-2" />
                        )}
                        {!isOwn && !msg._optimistic && (
                          <button
                            onClick={() => setReportMessageId(msg.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/[0.06] text-kalkvit/30 hover:text-kalkvit/60 transition-all flex-shrink-0 mb-2"
                            title="Report message"
                          >
                            <Flag className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )
                  })}

                  {/* Scroll anchor */}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-3 lg:p-4 border-t border-white/10">
                  {/* Image preview */}
                  {pendingImage && (
                    <div className="mb-2 relative inline-block">
                      <img
                        src={pendingImage.preview}
                        alt="Preview"
                        className="h-20 rounded-lg object-cover border border-white/10"
                      />
                      <button
                        onClick={clearPendingImage}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-tegelrod rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3 text-kalkvit" />
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-2 lg:gap-3">
                    {/* Hidden file input */}
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      disabled={isUploading}
                      className="p-3 rounded-xl transition-all flex-shrink-0 bg-white/[0.06] text-kalkvit/50 hover:text-kalkvit hover:bg-white/[0.1]"
                    >
                      <ImagePlus className="w-5 h-5" />
                    </button>
                    <GlassInput
                      placeholder="Type a message..."
                      className="flex-1"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={(!messageInput.trim() && !pendingImage) || isUploading || sendMessage.isPending}
                      className={cn(
                        'p-3 rounded-xl transition-all flex-shrink-0',
                        (messageInput.trim() || pendingImage) && !isUploading && !sendMessage.isPending
                          ? 'bg-koppar text-kalkvit hover:bg-koppar/80'
                          : 'bg-white/[0.06] text-kalkvit/30 cursor-not-allowed'
                      )}
                    >
                      {isUploading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
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

          {/* Members list */}
          <div className="max-h-[300px] overflow-y-auto -mx-1 px-1 space-y-1">
            {connectionsLoading && (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 text-koppar animate-spin" />
              </div>
            )}

            {!connectionsLoading && filteredMembers.length === 0 && (
              <div className="text-center py-6">
                <p className="text-kalkvit/50 text-sm">
                  {connectionSearchQuery
                    ? 'No connections found'
                    : 'No connections yet. Connect with members first!'}
                </p>
              </div>
            )}

            {!connectionsLoading && filteredMembers.map((member) => (
              <button
                key={member.user_id}
                onClick={(e) => {
                  e.stopPropagation()
                  handleStartConversationWithMember(member)
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.06] transition-colors text-left cursor-pointer"
              >
                <GlassAvatar initials={getInitials(member.display_name)} src={member.avatar_url} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-kalkvit truncate">{member.display_name}</p>
                  <p className="text-xs text-kalkvit/50">Connected</p>
                </div>
              </button>
            ))}
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
      <ReportModal
        isOpen={!!reportMessageId}
        onClose={() => setReportMessageId(null)}
        isPending={reportMessage.isPending}
        title="Report Message"
        onSubmit={(data) => {
          if (!reportMessageId) return
          reportMessage.mutate(
            { messageId: reportMessageId, data },
            {
              onSuccess: () => {
                setReportMessageId(null)
                setToast({ variant: 'success', message: 'Message reported. Thank you.' })
              },
            }
          )
        }}
      />
    </MainLayout>
  )
}

export default MessagesPage;
