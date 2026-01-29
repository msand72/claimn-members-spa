import { useState, useEffect } from 'react'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassInput, GlassAvatar, GlassBadge } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { Search, Send, MoreVertical, Phone, Video, ArrowLeft, Loader2, MessageCircle } from 'lucide-react'
import { cn } from '../lib/utils'
import {
  useConversations,
  useConversationMessages,
  useSendMessage,
  useMarkConversationRead,
  type Conversation,
} from '../lib/api'

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
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

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

  // Mark conversation as read when selected
  useEffect(() => {
    if (selectedConversation?.id && selectedConversation.unread_count > 0) {
      markRead.mutate(selectedConversation.id)
    }
  }, [selectedConversation?.id])

  const conversations = conversationsData?.data || []
  const messages = messagesData?.data || []

  // Filter conversations by search
  const filteredConversations = conversations.filter((conv) =>
    conv.participant?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false
  )

  const handleSendMessage = () => {
    if (messageInput.trim() && selectedConversation) {
      sendMessage.mutate({
        recipient_id: selectedConversation.participant_id,
        content: messageInput,
      }, {
        onSuccess: () => {
          setMessageInput('')
        }
      })
    }
  }

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv)
  }

  const handleBack = () => {
    setSelectedConversation(null)
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
            <div className="p-3 lg:p-4 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-kalkvit/40" />
                <GlassInput
                  placeholder="Search conversations..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
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
                      <p className="text-xs text-kalkvit/50">Brotherhood Member</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 lg:gap-2">
                    <button className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors text-kalkvit/60 hover:text-kalkvit">
                      <Phone className="w-5 h-5" />
                    </button>
                    <button className="hidden sm:block p-2 rounded-lg hover:bg-white/[0.06] transition-colors text-kalkvit/60 hover:text-kalkvit">
                      <Video className="w-5 h-5" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors text-kalkvit/60 hover:text-kalkvit">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-3 lg:space-y-4">
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
                  {!messagesLoading && !messagesError && messages.length === 0 && (
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
                </div>

                {/* Message Input */}
                <div className="p-3 lg:p-4 border-t border-white/10">
                  <div className="flex items-center gap-2 lg:gap-3">
                    <GlassInput
                      placeholder="Type a message..."
                      className="flex-1"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !sendMessage.isPending && handleSendMessage()}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim() || sendMessage.isPending}
                      className={cn(
                        'p-3 rounded-xl transition-all flex-shrink-0',
                        messageInput.trim() && !sendMessage.isPending
                          ? 'bg-koppar text-kalkvit hover:bg-koppar/80'
                          : 'bg-white/[0.06] text-kalkvit/30 cursor-not-allowed'
                      )}
                    >
                      {sendMessage.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-kalkvit/40 p-4 text-center">
                Select a conversation to start messaging
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </MainLayout>
  )
}
