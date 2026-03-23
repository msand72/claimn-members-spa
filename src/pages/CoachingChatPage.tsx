import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassButton, GlassAvatar } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import {
  SparklesIcon,
  ArrowLeftIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline'
import { cn } from '../lib/utils'
import { ChatQuickChips } from '../components/coaching/ChatQuickChips'
import {
  useCoachingConversations,
  useCoachingMessages,
  useSendCoachingMessage,
  type CoachingMessage,
} from '../lib/api/hooks/useCoaching'

// ── Types ────────────────────────────────────────────

interface DisplayMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
  _loading?: boolean
  _error?: boolean
}

// ── Helpers ──────────────────────────────────────────

function formatMessageTime(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const hours = Math.floor(diffMs / 3600000)
  if (hours < 24) return `${hours}h ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ── Loading Bubble ───────────────────────────────────

function LoadingBubble() {
  return (
    <div className="flex items-end gap-2 justify-start">
      <GlassAvatar
        initials="AI"
        size="sm"
        className="ring-2 ring-koppar/30 flex-shrink-0"
      />
      <div className="max-w-[80%] sm:max-w-[65%] rounded-2xl rounded-bl-sm bg-white/[0.08] px-4 py-3">
        <div className="flex gap-1.5 items-center h-5">
          <div className="w-2 h-2 rounded-full bg-koppar/60 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-koppar/60 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-koppar/60 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────

export function CoachingChatPage() {
  const { user } = useAuth()
  const [inputText, setInputText] = useState('')
  const [optimisticMessages, setOptimisticMessages] = useState<DisplayMessage[]>([])
  const [isWaitingForAI, setIsWaitingForAI] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Get latest conversation
  const { data: conversations } = useCoachingConversations()
  const latestConversation = Array.isArray(conversations) && conversations.length > 0
    ? conversations[0]
    : null
  const conversationId = latestConversation?.id || ''

  // Get messages for the conversation
  const { data: messagesData } = useCoachingMessages(conversationId)
  const serverMessages: CoachingMessage[] = Array.isArray(messagesData?.data)
    ? messagesData.data
    : []

  const sendMessage = useSendCoachingMessage()

  // Merge server messages with optimistic ones (remove optimistic once server has them)
  const allMessages: DisplayMessage[] = [
    ...serverMessages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      created_at: m.created_at,
    })),
    ...optimisticMessages.filter(
      (om) => !serverMessages.some((sm) => sm.content === om.content && sm.role === om.role)
    ),
  ]

  const isEmpty = allMessages.length === 0 && !isWaitingForAI

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [allMessages.length, isWaitingForAI])

  const handleSend = (text?: string) => {
    const content = (text || inputText).trim()
    if (!content || isWaitingForAI) return

    // Add optimistic user message
    const userMsg: DisplayMessage = {
      id: `opt-user-${Date.now()}`,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }
    setOptimisticMessages((prev) => [...prev, userMsg])
    setInputText('')
    setIsWaitingForAI(true)

    sendMessage.mutate(
      {
        conversation_id: conversationId || undefined,
        content,
      },
      {
        onSuccess: (response) => {
          // Add AI response to optimistic messages
          const aiMsg: DisplayMessage = {
            id: response.id || `opt-ai-${Date.now()}`,
            role: 'assistant',
            content: response.content,
            created_at: response.created_at || new Date().toISOString(),
          }
          setOptimisticMessages((prev) => [...prev, aiMsg])
          setIsWaitingForAI(false)
        },
        onError: () => {
          // Mark last optimistic user message as errored
          setOptimisticMessages((prev) => {
            const updated = [...prev]
            const lastUser = [...updated].reverse().find((m) => m.role === 'user')
            if (lastUser) lastUser._error = true
            return updated
          })
          setIsWaitingForAI(false)
        },
      }
    )
  }

  const handleRetry = (message: DisplayMessage) => {
    // Remove the errored message and resend
    setOptimisticMessages((prev) => prev.filter((m) => m.id !== message.id))
    handleSend(message.content)
  }

  const displayName = user?.display_name || user?.email?.split('@')[0] || 'You'
  const userInitials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto flex flex-col" style={{ minHeight: 'calc(100dvh - 140px)' }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Link
            to="/coaching/ai"
            className="p-2 rounded-lg hover:bg-white/[0.06] text-kalkvit/50 hover:text-kalkvit transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <GlassAvatar
            initials="AI"
            size="md"
            className="ring-2 ring-koppar/30"
          />
          <div>
            <h1 className="font-display text-lg font-semibold text-kalkvit">AI Coach</h1>
            <p className="text-xs text-kalkvit/50">Powered by your goals, protocols & progress</p>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
          {/* Empty state with quick chips */}
          {isEmpty && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-koppar/10 flex items-center justify-center mb-4">
                <SparklesIcon className="w-8 h-8 text-koppar" />
              </div>
              <h2 className="font-display text-xl font-semibold text-kalkvit mb-2">
                Ask your AI Coach
              </h2>
              <p className="text-sm text-kalkvit/50 max-w-sm mb-6">
                Get personalized advice based on your goals, KPIs, protocols, and assessment results.
              </p>
              <ChatQuickChips onSelect={handleSend} disabled={isWaitingForAI} />
            </div>
          )}

          {/* Message bubbles */}
          {allMessages.map((msg) => {
            const isUser = msg.role === 'user'
            return (
              <div
                key={msg.id}
                className={cn('flex items-end gap-2', isUser ? 'justify-end' : 'justify-start')}
              >
                {!isUser && (
                  <GlassAvatar
                    initials="AI"
                    size="sm"
                    className="ring-2 ring-koppar/30 flex-shrink-0"
                  />
                )}
                <div className="flex flex-col gap-1 max-w-[80%] sm:max-w-[65%]">
                  <div
                    className={cn(
                      'rounded-2xl px-3.5 py-2.5',
                      isUser
                        ? 'bg-koppar text-kalkvit rounded-br-sm'
                        : 'bg-white/[0.08] text-kalkvit rounded-bl-sm'
                    )}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  <div className={cn('flex items-center gap-2', isUser ? 'justify-end' : 'justify-start')}>
                    <span className="text-[10px] text-kalkvit/30">
                      {formatMessageTime(msg.created_at)}
                    </span>
                    {msg._error && (
                      <button
                        onClick={() => handleRetry(msg)}
                        className="flex items-center gap-1 text-[10px] text-tegelrod hover:text-tegelrod/80 transition-colors"
                      >
                        <ExclamationCircleIcon className="w-3 h-3" />
                        Retry
                      </button>
                    )}
                  </div>
                </div>
                {isUser && (
                  <GlassAvatar
                    initials={userInitials}
                    src={user?.avatar_url ?? undefined}
                    size="sm"
                    className="flex-shrink-0"
                  />
                )}
              </div>
            )
          })}

          {/* AI loading bubble */}
          {isWaitingForAI && <LoadingBubble />}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick chips (shown when conversation has messages but not waiting) */}
        {!isEmpty && !isWaitingForAI && (
          <div className="py-2">
            <ChatQuickChips onSelect={handleSend} disabled={isWaitingForAI} />
          </div>
        )}

        {/* Input */}
        <div className="pt-3 pb-2 border-t border-white/10 safe-area-bottom">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Ask your coach anything..."
              disabled={isWaitingForAI}
              className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-kalkvit placeholder-kalkvit/40 focus:outline-none focus:border-koppar/50 transition-colors disabled:opacity-50"
            />
            <GlassButton
              variant="primary"
              onClick={() => handleSend()}
              disabled={!inputText.trim() || isWaitingForAI}
              className="px-4"
            >
              {isWaitingForAI ? (
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
              ) : (
                <PaperAirplaneIcon className="w-5 h-5" />
              )}
            </GlassButton>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default CoachingChatPage
