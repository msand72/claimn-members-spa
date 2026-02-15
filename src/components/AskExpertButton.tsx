import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GlassButton, GlassModal, GlassModalFooter, GlassAvatar, GlassBadge } from './ui'
import { useMyExpert } from '../lib/api/hooks/useMyExpert'
import { useExperts } from '../lib/api/hooks/useExperts'
import { useAuth } from '../contexts/AuthContext'
import { HelpCircle, Loader2, MessageCircle } from 'lucide-react'

interface AskExpertButtonProps {
  /** Pre-filled context, e.g. "Sleep Protocol — Week 2, Step 3" */
  context?: string
  /** Protocol slug (kept for potential future use) */
  protocolSlug?: string
  /** Button size */
  size?: 'sm' | 'md'
}

/**
 * Contextual button that lets members message an expert directly.
 * If the member has an assigned expert, navigates straight to messages.
 * Otherwise, shows a picker to choose which expert to contact.
 */
export function AskExpertButton({ context }: AskExpertButtonProps) {
  const { userType } = useAuth()
  const navigate = useNavigate()
  const { data: myExpertData, isLoading: myExpertLoading } = useMyExpert()
  const [isOpen, setIsOpen] = useState(false)

  // Only show for member and client types
  if (userType === 'guest') return null

  const navigateToExpert = (expert: { id: string; name: string; avatar_url: string | null }) => {
    const initialMessage = context ? `[Context: ${context}]\n\n` : ''
    navigate(`/messages?user=${expert.id}`, {
      state: {
        participantName: expert.name,
        participantAvatar: expert.avatar_url,
        participantType: 'expert',
        initialMessage,
      },
    })
  }

  const handleClick = () => {
    if (myExpertLoading) return

    if (myExpertData?.expert) {
      navigateToExpert({
        id: myExpertData.expert.id,
        name: myExpertData.expert.name,
        avatar_url: myExpertData.expert.avatar_url,
      })
    } else {
      setIsOpen(true)
    }
  }

  return (
    <>
      <GlassButton
        variant="secondary"
        onClick={handleClick}
        disabled={myExpertLoading}
      >
        {myExpertLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <HelpCircle className="w-4 h-4" />
        )}
        Ask Expert
      </GlassButton>

      <ExpertPickerModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSelect={(expert) => {
          setIsOpen(false)
          navigateToExpert(expert)
        }}
      />
    </>
  )
}

function ExpertPickerModal({
  isOpen,
  onClose,
  onSelect,
}: {
  isOpen: boolean
  onClose: () => void
  onSelect: (expert: { id: string; name: string; avatar_url: string | null }) => void
}) {
  const { data: expertsData, isLoading } = useExperts({ limit: 20 })
  const experts = Array.isArray(expertsData?.data) ? expertsData.data : []

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="Choose an Expert"
      size="md"
    >
      <div className="max-h-[350px] overflow-y-auto space-y-1">
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-koppar animate-spin" />
          </div>
        )}

        {!isLoading && experts.length === 0 && (
          <div className="text-center py-8">
            <p className="text-kalkvit/50 text-sm">No experts available right now.</p>
          </div>
        )}

        {!isLoading && experts.map((expert) => {
          const initials = expert.name
            ?.split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || '?'

          return (
            <button
              key={expert.id}
              onClick={() => onSelect({
                id: expert.id,
                name: expert.name,
                avatar_url: expert.avatar_url,
              })}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.06] transition-colors text-left"
            >
              <GlassAvatar
                initials={initials}
                src={expert.avatar_url}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-kalkvit truncate">{expert.name}</p>
                {expert.title && (
                  <p className="text-xs text-koppar truncate">{expert.title}</p>
                )}
              </div>
              {expert.specialties?.length > 0 && (
                <GlassBadge variant="default" className="text-xs hidden sm:inline-flex">
                  {expert.specialties[0]}
                </GlassBadge>
              )}
              <MessageCircle className="w-4 h-4 text-kalkvit/40 flex-shrink-0" />
            </button>
          )
        })}
      </div>

      <GlassModalFooter>
        <GlassButton variant="ghost" onClick={onClose}>
          Cancel
        </GlassButton>
      </GlassModalFooter>
    </GlassModal>
  )
}
