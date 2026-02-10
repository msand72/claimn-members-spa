import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassInput, GlassAvatar, GlassBadge } from '../components/ui'
import { Search, UserPlus, UserCheck, MessageCircle, MoreHorizontal, Loader2, Users, Trash2, Heart } from 'lucide-react'
import { cn } from '../lib/utils'
import {
  useConnections,
  usePendingConnections,
  useAcceptConnection,
  useRejectConnection,
  useRemoveConnection,
  useNetworkSuggestions,
  useSendConnectionRequest,
  type Connection,
  type NetworkMember,
} from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { PILLARS, type PillarId } from '../lib/constants'

/** Map pillar color tokens to Tailwind bg/text class pairs */
const PILLAR_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  koppar:   { bg: 'bg-koppar/20',   text: 'text-koppar',   border: 'border-koppar/40' },
  oliv:     { bg: 'bg-oliv/20',     text: 'text-oliv',     border: 'border-oliv/40' },
  jordbrun: { bg: 'bg-jordbrun/20', text: 'text-jordbrun', border: 'border-jordbrun/40' },
  charcoal: { bg: 'bg-charcoal/40', text: 'text-kalkvit/70', border: 'border-kalkvit/20' },
}

function PillarBadge({ pillarId }: { pillarId: string }) {
  const pillar = PILLARS[pillarId as PillarId]
  if (!pillar) return null
  const style = PILLAR_STYLES[pillar.color] ?? PILLAR_STYLES.charcoal
  return (
    <span
      className={cn(
        'px-2 py-0.5 text-xs rounded-full border capitalize',
        style.bg, style.text, style.border,
      )}
    >
      {pillar.name}
    </span>
  )
}

const tabs = ['All', 'Connected', 'Pending', 'Suggestions']

// Suggestion card for network suggestions (not yet connected)
// Each card owns its own mutation hook to avoid shared pending state (Block 12.1)
interface SuggestionCardProps {
  member: NetworkMember
}

function SuggestionCard({ member }: SuggestionCardProps) {
  const sendConnection = useSendConnectionRequest()

  const displayName = member.display_name || 'Unknown'
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const location = [member.city, member.country].filter(Boolean).join(', ')

  return (
    <GlassCard variant="base" className="p-6 md:p-8 overflow-hidden flex flex-col">
      {/* Header: avatar + name */}
      <div className="flex items-center gap-5 mb-5">
        <GlassAvatar initials={initials} src={member.avatar_url} size="xl" className="!w-20 !h-20 !text-2xl" />
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-xl font-bold text-kalkvit truncate">{displayName}</h3>
          {member.archetype && (
            <p className="text-sm text-koppar font-semibold mt-0.5">{member.archetype}</p>
          )}
          {location && (
            <p className="text-sm text-kalkvit/50 mt-1">{location}</p>
          )}
        </div>
      </div>

      {/* Bio */}
      <p className="text-sm text-kalkvit/60 line-clamp-3 mb-4 min-h-[3.75rem]">
        {member.bio || 'No bio yet.'}
      </p>

      {/* Pillar focus badges */}
      {member.pillar_focus && member.pillar_focus.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {member.pillar_focus.map((pillar) => (
            <PillarBadge key={pillar} pillarId={pillar} />
          ))}
        </div>
      )}

      {/* Shared interests */}
      {member.shared_interests && member.shared_interests > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-4 h-4 text-koppar fill-koppar/30" />
          <span className="text-sm font-medium text-koppar">
            {member.shared_interests} shared interests
          </span>
        </div>
      )}

      {/* Action */}
      <div className="pt-4 border-t border-white/[0.08] mt-auto">
        <GlassButton
          variant="primary"
          className="w-full justify-center"
          onClick={() => sendConnection.mutate({ addressee_id: member.user_id })}
          disabled={sendConnection.isPending}
        >
          {sendConnection.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <UserPlus className="w-4 h-4 shrink-0" />
          )}
          <span>{sendConnection.isPending ? 'Sending...' : 'Connect'}</span>
        </GlassButton>
      </div>
    </GlassCard>
  )
}

// Connection card with its own mutation hooks to avoid shared pending state (Block 12.1)
interface ConnectionCardProps {
  connection: Connection
  currentUserId?: string
}

function ConnectionCard({ connection, currentUserId }: ConnectionCardProps) {
  const navigate = useNavigate()
  const acceptConnection = useAcceptConnection()
  const rejectConnection = useRejectConnection()
  const removeConnection = useRemoveConnection()

  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  // Determine which user is the "other" person
  const otherUser = (connection.is_requester === true || connection.requester_id === currentUserId)
    ? connection.recipient
    : connection.requester

  const isRequester = connection.is_requester === true || connection.requester_id === currentUserId
  const otherUserId = isRequester
    ? (connection.addressee_id || connection.recipient_id)
    : connection.requester_id

  const displayName = otherUser?.display_name || 'Unknown'
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const location = [otherUser?.city, otherUser?.country].filter(Boolean).join(', ')
  const isConnected = connection.status === 'accepted'
  const isPending = connection.status === 'pending'
  const isIncoming = isPending && (connection.addressee_id || connection.recipient_id) === currentUserId

  return (
    <GlassCard variant="base" className="p-6 md:p-8 overflow-hidden flex flex-col">
      {/* Header: avatar + name + menu */}
      <div className="flex items-center gap-5 mb-5">
        <GlassAvatar initials={initials} src={otherUser?.avatar_url} size="xl" className="!w-20 !h-20 !text-2xl" />
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-xl font-bold text-kalkvit truncate">{displayName}</h3>
          {otherUser?.archetype && (
            <p className="text-sm text-koppar font-semibold mt-0.5">{otherUser.archetype}</p>
          )}
          {location && (
            <p className="text-sm text-kalkvit/50 mt-1">{location}</p>
          )}
        </div>
        {isConnected && (
          <div className="relative shrink-0 self-start" ref={menuRef}>
            <button
              onClick={() => setShowMenu((prev) => !prev)}
              className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors text-kalkvit/50 hover:text-kalkvit"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 z-50 min-w-[200px] rounded-xl bg-charcoal border border-white/15 py-1 shadow-xl shadow-black/40">
                <button
                  onClick={() => {
                    if (!window.confirm('Are you sure you want to remove this connection?')) return
                    removeConnection.mutate(connection.id)
                    setShowMenu(false)
                  }}
                  disabled={removeConnection.isPending}
                  className="w-full text-left px-4 py-2.5 text-sm text-tegelrod hover:bg-white/[0.06] transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {removeConnection.isPending ? 'Removing...' : 'Remove Connection'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bio */}
      <p className="text-sm text-kalkvit/60 line-clamp-3 mb-4 min-h-[3.75rem]">
        {otherUser?.bio || 'No bio yet.'}
      </p>

      {/* Pillar focus badges */}
      {otherUser?.pillar_focus && otherUser.pillar_focus.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {otherUser.pillar_focus.map((pillar) => (
            <PillarBadge key={pillar} pillarId={pillar} />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="pt-4 border-t border-white/[0.08] mt-auto">
        <div className="flex items-center gap-3">
          {isConnected ? (
            <>
              <GlassButton
                variant="secondary"
                className="flex-1 justify-center"
                onClick={() => navigate(`/messages?user=${otherUserId}`)}
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>Message</span>
              </GlassButton>
              <GlassBadge variant="success" className="shrink-0 px-3 py-1.5">
                <UserCheck className="w-3.5 h-3.5 mr-1" />
                Connected
              </GlassBadge>
            </>
          ) : isIncoming ? (
            <div className="flex gap-3 w-full">
              <GlassButton
                variant="primary"
                className="flex-1 justify-center"
                onClick={() => acceptConnection.mutate(connection.id)}
                disabled={acceptConnection.isPending}
              >
                {acceptConnection.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Accept'}
              </GlassButton>
              <GlassButton
                variant="secondary"
                className="flex-1 justify-center"
                onClick={() => rejectConnection.mutate(connection.id)}
                disabled={rejectConnection.isPending}
              >
                {rejectConnection.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Decline'}
              </GlassButton>
            </div>
          ) : isPending ? (
            <GlassBadge variant="warning" className="w-full justify-center py-2.5">
              Request Sent
            </GlassBadge>
          ) : null}
        </div>
      </div>
    </GlassCard>
  )
}

export function ConnectionsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch connections from API
  const {
    data: connectionsData,
    isLoading: connectionsLoading,
    error: connectionsError,
  } = useConnections({ status: activeTab === 'Connected' ? 'accepted' : undefined, limit: 50 })

  const {
    data: pendingData,
    isLoading: pendingLoading,
  } = usePendingConnections()

  const {
    data: suggestionsData,
    isLoading: suggestionsLoading,
  } = useNetworkSuggestions(10)

  const connections = Array.isArray(connectionsData?.data) ? connectionsData.data : []
  const pendingConnections = Array.isArray(pendingData?.data) ? pendingData.data : []
  const suggestions = Array.isArray(suggestionsData) ? suggestionsData : []

  // Filter based on search and tab
  const filteredConnections = connections.filter((conn) => {
    const otherUser = conn.requester_id === user?.id ? conn.recipient : conn.requester
    const name = otherUser?.display_name || ''
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeTab === 'All') return matchesSearch
    if (activeTab === 'Connected') return matchesSearch && conn.status === 'accepted'
    if (activeTab === 'Pending') return matchesSearch && conn.status === 'pending'
    return matchesSearch
  })

  const stats = {
    total: connections.filter(c => c.status === 'accepted').length,
    pending: pendingConnections.length,
    suggestions: suggestions.length,
  }

  const isLoading = connectionsLoading || (activeTab === 'Pending' && pendingLoading) || (activeTab === 'Suggestions' && suggestionsLoading)

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-kalkvit mb-2">Connections</h1>
            <p className="text-kalkvit/60">Build your network within the brotherhood</p>
          </div>
          <div className="flex gap-4 text-center">
            <div className="px-4">
              <p className="font-display text-2xl font-bold text-kalkvit">{stats.total}</p>
              <p className="text-xs text-kalkvit/50">Connected</p>
            </div>
            <div className="px-4 border-l border-white/10">
              <p className="font-display text-2xl font-bold text-brand-amber">{stats.pending}</p>
              <p className="text-xs text-kalkvit/50">Pending</p>
            </div>
            <div className="px-4 border-l border-white/10">
              <p className="font-display text-2xl font-bold text-koppar">{stats.suggestions}</p>
              <p className="text-xs text-kalkvit/50">Suggestions</p>
            </div>
          </div>
        </div>

        {/* Search and Tabs */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-kalkvit/40" />
            <GlassInput
              placeholder="Search connections..."
              className="pl-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                  activeTab === tab
                    ? 'bg-koppar text-kalkvit'
                    : 'bg-white/[0.06] text-kalkvit/70 hover:bg-white/[0.1] hover:text-kalkvit'
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-koppar animate-spin" />
          </div>
        )}

        {/* Error state */}
        {connectionsError && (
          <GlassCard variant="base" className="text-center py-12">
            <p className="text-tegelrod mb-2">Failed to load connections</p>
            <p className="text-kalkvit/50 text-sm">Please try again later</p>
          </GlassCard>
        )}

        {/* Suggestions Grid - for NetworkMember type */}
        {!isLoading && !connectionsError && activeTab === 'Suggestions' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {suggestions.map((member) => (
              <SuggestionCard
                key={member.user_id}
                member={member}
              />
            ))}
          </div>
        )}

        {/* Connections Grid - for Connection type */}
        {!isLoading && !connectionsError && activeTab !== 'Suggestions' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredConnections.map((connection) => (
              <ConnectionCard
                key={connection.id}
                connection={connection}
                currentUserId={user?.id}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !connectionsError && (
          (activeTab === 'Suggestions' && suggestions.length === 0) ||
          (activeTab !== 'Suggestions' && filteredConnections.length === 0)
        ) && (
          <GlassCard variant="base" className="text-center py-12">
            <Users className="w-12 h-12 text-kalkvit/20 mx-auto mb-4" />
            <h3 className="font-medium text-kalkvit mb-2">
              {activeTab === 'Suggestions' ? 'No suggestions available' : 'No connections found'}
            </h3>
            <p className="text-kalkvit/50 text-sm">
              {searchQuery ? 'Try a different search term' :
               activeTab === 'Suggestions' ? 'Check back later for new suggestions' :
               'Start connecting with other members'}
            </p>
          </GlassCard>
        )}
      </div>
    </MainLayout>
  )
}

export default ConnectionsPage;
