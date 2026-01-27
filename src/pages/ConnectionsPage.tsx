import { useState, useEffect } from 'react'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassInput, GlassAvatar, GlassBadge } from '../components/ui'
import { Search, UserPlus, UserCheck, MessageCircle, MoreHorizontal, Loader2, Users } from 'lucide-react'
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
} from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

const tabs = ['All', 'Connected', 'Pending', 'Suggestions']

interface ConnectionCardProps {
  connection: Connection
  currentUserId?: string
  onAccept?: () => void
  onReject?: () => void
  isAccepting?: boolean
  isRejecting?: boolean
}

function ConnectionCard({ connection, currentUserId, onAccept, onReject, isAccepting, isRejecting }: ConnectionCardProps) {
  // Determine which user is the "other" person
  const otherUser = connection.requester_id === currentUserId
    ? connection.recipient
    : connection.requester

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
  const isIncoming = isPending && connection.recipient_id === currentUserId

  return (
    <GlassCard variant="base" className="p-4 overflow-hidden">
      <div className="flex items-start gap-4">
        <GlassAvatar initials={initials} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-kalkvit">{displayName}</h3>
              {otherUser?.archetype && (
                <p className="text-sm text-kalkvit/60">{otherUser.archetype}</p>
              )}
              {location && (
                <p className="text-xs text-kalkvit/40 mt-1">{location}</p>
              )}
            </div>
            <button className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors text-kalkvit/50 hover:text-kalkvit">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          {otherUser?.bio && (
            <p className="text-xs text-kalkvit/50 mt-2 line-clamp-2">{otherUser.bio}</p>
          )}

          <div className="flex items-center gap-2 mt-4 overflow-hidden">
            {isConnected ? (
              <>
                <GlassButton variant="secondary" className="flex-1 min-w-0">
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  <span className="truncate">Message</span>
                </GlassButton>
                <GlassBadge variant="success" className="shrink-0">
                  <UserCheck className="w-3 h-3 mr-1" />
                  Connected
                </GlassBadge>
              </>
            ) : isIncoming ? (
              <div className="flex gap-2 w-full">
                <GlassButton
                  variant="primary"
                  className="flex-1"
                  onClick={onAccept}
                  disabled={isAccepting}
                >
                  {isAccepting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Accept'}
                </GlassButton>
                <GlassButton
                  variant="secondary"
                  className="flex-1"
                  onClick={onReject}
                  disabled={isRejecting}
                >
                  {isRejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Decline'}
                </GlassButton>
              </div>
            ) : isPending ? (
              <GlassBadge variant="warning" className="w-full justify-center py-2">
                Request Sent
              </GlassBadge>
            ) : null}
          </div>
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

  const acceptConnection = useAcceptConnection()
  const rejectConnection = useRejectConnection()
  const sendConnection = useSendConnectionRequest()

  // Debug logging
  useEffect(() => {
    console.log('[ConnectionsPage] Connections state:', {
      loading: connectionsLoading,
      error: connectionsError,
      data: connectionsData,
      pendingData,
      suggestionsData,
    })
  }, [connectionsData, connectionsLoading, connectionsError, pendingData, suggestionsData])

  const connections = connectionsData?.data || []
  const pendingConnections = pendingData?.data || []
  const suggestions = suggestionsData || []

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

  // Show suggestions when on that tab
  const displayItems = activeTab === 'Suggestions' ? suggestions : filteredConnections

  const stats = {
    total: connections.filter(c => c.status === 'accepted').length,
    pending: pendingConnections.length,
    suggestions: suggestions.length,
  }

  const isLoading = connectionsLoading || (activeTab === 'Pending' && pendingLoading) || (activeTab === 'Suggestions' && suggestionsLoading)

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-kalkvit mb-2">Connections</h1>
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

        {/* Connections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredConnections.map((connection) => (
            <ConnectionCard key={connection.id} connection={connection} />
          ))}
        </div>

        {filteredConnections.length === 0 && (
          <div className="text-center py-12">
            <p className="text-kalkvit/60">No connections found matching your criteria.</p>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
