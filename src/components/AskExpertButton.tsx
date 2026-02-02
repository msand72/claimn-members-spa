import { useState } from 'react'
import { GlassButton, GlassModal, GlassModalFooter, GlassTextarea } from './ui'
import { useCreatePost } from '../lib/api/hooks'
import { useAuth } from '../contexts/AuthContext'
import { HelpCircle, Send } from 'lucide-react'

interface AskExpertButtonProps {
  /** Pre-filled context, e.g. "Sleep Protocol — Week 2, Step 3" */
  context?: string
  /** Protocol slug for automatic tagging */
  protocolSlug?: string
  /** Circle ID to post in (optional) */
  circleId?: string
  /** Button size */
  size?: 'sm' | 'md'
}

/**
 * Contextual button that lets members ask questions to experts.
 * Posts to the community feed with is_expert_question flag.
 * Experts see these in their admin-spa Community Questions feed.
 */
export function AskExpertButton({ context, circleId }: AskExpertButtonProps) {
  const { userType } = useAuth()
  const createPost = useCreatePost()
  const [isOpen, setIsOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [submitted, setSubmitted] = useState(false)

  // Only show for member and client types
  if (userType === 'guest') return null

  const handleSubmit = async () => {
    if (!question.trim()) return

    const content = context
      ? `[Context: ${context}]\n\n${question}`
      : question

    await createPost.mutateAsync({
      content,
      is_expert_question: true,
      ...(circleId ? { circle_id: circleId } : {}),
    } as Parameters<typeof createPost.mutateAsync>[0])

    setSubmitted(true)
    setTimeout(() => {
      setIsOpen(false)
      setQuestion('')
      setSubmitted(false)
    }, 2000)
  }

  return (
    <>
      <GlassButton
        variant="secondary"
        onClick={() => setIsOpen(true)}
      >
        <HelpCircle className="w-4 h-4" />
        Ask Expert
      </GlassButton>

      <GlassModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Ask an Expert"
        size="md"
      >
        {submitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-kalkvit font-medium text-lg mb-2">Question Sent!</h3>
            <p className="text-kalkvit/60 text-sm">
              Our experts will respond in the community feed. You'll get a notification when they reply.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {context && (
              <div className="px-3 py-2 rounded-lg bg-koppar/5 border border-koppar/20">
                <span className="text-kalkvit/50 text-xs block mb-0.5">Context</span>
                <span className="text-kalkvit/80 text-sm">{context}</span>
              </div>
            )}
            <GlassTextarea
              label="What are you struggling with?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Describe your question or challenge..."
              rows={4}
            />
            <GlassModalFooter>
              <GlassButton variant="secondary" onClick={() => setIsOpen(false)}>
                Cancel
              </GlassButton>
              <GlassButton
                variant="primary"
                onClick={handleSubmit}
                disabled={!question.trim() || createPost.isPending}
              >
                <Send className="w-4 h-4" />
                {createPost.isPending ? 'Sending...' : 'Send to Experts'}
              </GlassButton>
            </GlassModalFooter>
          </div>
        )}
      </GlassModal>
    </>
  )
}
