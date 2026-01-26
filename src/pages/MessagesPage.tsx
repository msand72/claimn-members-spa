import { useState } from 'react'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassInput, GlassAvatar, GlassBadge } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { Search, Send, MoreVertical, Phone, Video } from 'lucide-react'
import { cn } from '../lib/utils'

interface Conversation {
  id: number
  user: {
    name: string
    initials: string
    online: boolean
  }
  lastMessage: string
  timestamp: string
  unread: number
}

interface Message {
  id: number
  content: string
  timestamp: string
  isOwn: boolean
}

const mockConversations: Conversation[] = [
  {
    id: 1,
    user: { name: 'John Davidson', initials: 'JD', online: true },
    lastMessage: 'Thanks for the advice on the protocol!',
    timestamp: '2m ago',
    unread: 2,
  },
  {
    id: 2,
    user: { name: 'Michael Chen', initials: 'MC', online: true },
    lastMessage: 'Let me know if you have any questions about the session.',
    timestamp: '1h ago',
    unread: 0,
  },
  {
    id: 3,
    user: { name: 'Sarah Williams', initials: 'SW', online: false },
    lastMessage: 'See you at the next circle meeting!',
    timestamp: '3h ago',
    unread: 0,
  },
  {
    id: 4,
    user: { name: 'David Miller', initials: 'DM', online: false },
    lastMessage: 'Great progress this week!',
    timestamp: '1d ago',
    unread: 0,
  },
]

const mockMessages: Message[] = [
  { id: 1, content: 'Hey! How\'s the 30-day protocol going?', timestamp: '10:30 AM', isOwn: false },
  { id: 2, content: 'It\'s going great! Just finished week 2.', timestamp: '10:32 AM', isOwn: true },
  { id: 3, content: 'That\'s awesome! Any challenges so far?', timestamp: '10:33 AM', isOwn: false },
  { id: 4, content: 'The morning routine was tough at first, but I\'m getting into the rhythm now.', timestamp: '10:35 AM', isOwn: true },
  { id: 5, content: 'That\'s the hardest part. Once it becomes a habit, it\'s second nature.', timestamp: '10:36 AM', isOwn: false },
  { id: 6, content: 'Thanks for the advice on the protocol!', timestamp: '10:38 AM', isOwn: true },
]

export function MessagesPage() {
  const { user } = useAuth()
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(mockConversations[0])
  const [messageInput, setMessageInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // User info available for future use
  void user

  const filteredConversations = mockConversations.filter((conv) =>
    conv.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      // TODO: Implement message sending via API
      console.log('Sending message:', messageInput)
      setMessageInput('')
    }
  }

  return (
    <MainLayout>
      <div className="h-[calc(100vh-8rem)]">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold text-kalkvit mb-2">Messages</h1>
          <p className="text-kalkvit/60">Connect with community members</p>
        </div>

        <div className="flex gap-6 h-[calc(100%-5rem)]">
          {/* Conversations List */}
          <GlassCard variant="base" className="w-80 flex flex-col p-0 overflow-hidden">
            <div className="p-4 border-b border-white/10">
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
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={cn(
                    'w-full p-4 flex items-center gap-3 text-left transition-colors',
                    selectedConversation?.id === conv.id
                      ? 'bg-koppar/20 border-l-4 border-koppar'
                      : 'hover:bg-white/[0.04]'
                  )}
                >
                  <div className="relative">
                    <GlassAvatar initials={conv.user.initials} size="md" />
                    {conv.user.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-skogsgron rounded-full border-2 border-glass-dark" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-kalkvit truncate">{conv.user.name}</span>
                      <span className="text-xs text-kalkvit/40">{conv.timestamp}</span>
                    </div>
                    <p className="text-sm text-kalkvit/60 truncate">{conv.lastMessage}</p>
                  </div>
                  {conv.unread > 0 && (
                    <GlassBadge variant="koppar">{conv.unread}</GlassBadge>
                  )}
                </button>
              ))}
            </div>
          </GlassCard>

          {/* Chat Area */}
          <GlassCard variant="elevated" className="flex-1 flex flex-col p-0 overflow-hidden">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <GlassAvatar initials={selectedConversation.user.initials} size="md" />
                      {selectedConversation.user.online && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-skogsgron rounded-full border-2 border-glass-dark" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-kalkvit">{selectedConversation.user.name}</h3>
                      <p className="text-xs text-kalkvit/50">
                        {selectedConversation.user.online ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors text-kalkvit/60 hover:text-kalkvit">
                      <Phone className="w-5 h-5" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors text-kalkvit/60 hover:text-kalkvit">
                      <Video className="w-5 h-5" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors text-kalkvit/60 hover:text-kalkvit">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {mockMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn('flex', msg.isOwn ? 'justify-end' : 'justify-start')}
                    >
                      <div
                        className={cn(
                          'max-w-[70%] rounded-2xl px-4 py-2',
                          msg.isOwn
                            ? 'bg-koppar text-kalkvit rounded-br-sm'
                            : 'bg-white/[0.08] text-kalkvit rounded-bl-sm'
                        )}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className={cn(
                          'text-xs mt-1',
                          msg.isOwn ? 'text-kalkvit/70' : 'text-kalkvit/40'
                        )}>
                          {msg.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-white/10">
                  <div className="flex items-center gap-3">
                    <GlassInput
                      placeholder="Type a message..."
                      className="flex-1"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim()}
                      className={cn(
                        'p-3 rounded-xl transition-all',
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
              <div className="flex-1 flex items-center justify-center text-kalkvit/40">
                Select a conversation to start messaging
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </MainLayout>
  )
}
