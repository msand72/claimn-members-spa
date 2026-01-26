import { useState } from 'react'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassInput, GlassAvatar, GlassBadge } from '../components/ui'
import { Search, UserPlus, UserCheck, MessageCircle, MoreHorizontal } from 'lucide-react'
import { cn } from '../lib/utils'

interface Connection {
  id: number
  name: string
  initials: string
  role: string
  location: string
  mutualConnections: number
  isConnected: boolean
  isPending: boolean
}

const mockConnections: Connection[] = [
  { id: 1, name: 'John Davidson', initials: 'JD', role: 'Entrepreneur', location: 'New York, USA', mutualConnections: 12, isConnected: true, isPending: false },
  { id: 2, name: 'Michael Chen', initials: 'MC', role: 'Expert Coach', location: 'Los Angeles, USA', mutualConnections: 8, isConnected: true, isPending: false },
  { id: 3, name: 'Sarah Williams', initials: 'SW', role: 'Business Owner', location: 'Chicago, USA', mutualConnections: 5, isConnected: true, isPending: false },
  { id: 4, name: 'David Miller', initials: 'DM', role: 'Investor', location: 'Miami, USA', mutualConnections: 15, isConnected: true, isPending: false },
  { id: 5, name: 'Robert Johnson', initials: 'RJ', role: 'Startup Founder', location: 'Austin, USA', mutualConnections: 3, isConnected: false, isPending: true },
  { id: 6, name: 'Emily Davis', initials: 'ED', role: 'Marketing Lead', location: 'Seattle, USA', mutualConnections: 7, isConnected: false, isPending: false },
]

const tabs = ['All', 'Connected', 'Pending', 'Suggestions']

function ConnectionCard({ connection }: { connection: Connection }) {
  const [isConnected] = useState(connection.isConnected)
  const [isPending, setIsPending] = useState(connection.isPending)

  const handleConnect = () => {
    if (!isConnected && !isPending) {
      setIsPending(true)
    }
  }

  return (
    <GlassCard variant="base" className="p-4">
      <div className="flex items-start gap-4">
        <GlassAvatar initials={connection.initials} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-kalkvit">{connection.name}</h3>
              <p className="text-sm text-kalkvit/60">{connection.role}</p>
              <p className="text-xs text-kalkvit/40 mt-1">{connection.location}</p>
            </div>
            <button className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors text-kalkvit/50 hover:text-kalkvit">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-kalkvit/50 mt-2">
            {connection.mutualConnections} mutual connections
          </p>

          <div className="flex items-center gap-2 mt-4">
            {isConnected ? (
              <>
                <GlassButton variant="secondary" className="flex-1">
                  <MessageCircle className="w-4 h-4" />
                  Message
                </GlassButton>
                <GlassBadge variant="success">
                  <UserCheck className="w-3 h-3 mr-1" />
                  Connected
                </GlassBadge>
              </>
            ) : isPending ? (
              <GlassBadge variant="warning" className="w-full justify-center py-2">
                Request Pending
              </GlassBadge>
            ) : (
              <GlassButton variant="primary" className="w-full" onClick={handleConnect}>
                <UserPlus className="w-4 h-4" />
                Connect
              </GlassButton>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  )
}

export function ConnectionsPage() {
  const [activeTab, setActiveTab] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredConnections = mockConnections.filter((conn) => {
    const matchesSearch = conn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conn.role.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeTab === 'All') return matchesSearch
    if (activeTab === 'Connected') return matchesSearch && conn.isConnected
    if (activeTab === 'Pending') return matchesSearch && conn.isPending
    if (activeTab === 'Suggestions') return matchesSearch && !conn.isConnected && !conn.isPending
    return matchesSearch
  })

  const stats = {
    total: mockConnections.filter(c => c.isConnected).length,
    pending: mockConnections.filter(c => c.isPending).length,
    suggestions: mockConnections.filter(c => !c.isConnected && !c.isPending).length,
  }

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
