import { Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton } from '../components/ui'
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  type Notification,
  safeArray,
} from '../lib/api'
import {
  Bell,
  BellOff,
  CheckCheck,
  Target,
  BarChart3,
  Milestone,
  Package,
  ListTodo,
  MessageCircle,
  Calendar,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// Map notification types to icons for visual differentiation
const TYPE_ICONS: Record<string, LucideIcon> = {
  goal_created: Target,
  kpi_created: BarChart3,
  milestone_created: Milestone,
  protocol_assigned: Package,
  action_item_created: ListTodo,
  message_received: MessageCircle,
  session_scheduled: Calendar,
  session_reminder: Calendar,
}

function getNotificationIcon(type: string): LucideIcon {
  return TYPE_ICONS[type] || Bell
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: Notification
  onMarkRead: (id: string) => void
}) {
  const isUnread = !notification.read_at
  const Icon = getNotificationIcon(notification.type)

  const content = (
    <div
      className={`flex items-start gap-4 p-4 rounded-xl transition-colors ${
        isUnread ? 'bg-koppar/[0.06]' : 'bg-white/[0.02]'
      } hover:bg-white/[0.06]`}
      onClick={() => isUnread && onMarkRead(notification.id)}
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
          isUnread ? 'bg-koppar/20 text-koppar' : 'bg-white/[0.06] text-kalkvit/40'
        }`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-sm font-medium ${isUnread ? 'text-kalkvit' : 'text-kalkvit/70'}`}>
            {notification.title}
          </span>
          {isUnread && <span className="w-2 h-2 rounded-full bg-koppar shrink-0" />}
        </div>
        <p className={`text-sm ${isUnread ? 'text-kalkvit/60' : 'text-kalkvit/40'}`}>
          {notification.body}
        </p>
        <span className="text-xs text-kalkvit/30 mt-1 block">
          {formatTimeAgo(notification.created_at)}
        </span>
      </div>
      {notification.action_url && (
        <ArrowRight className="w-4 h-4 text-kalkvit/30 shrink-0 mt-1" />
      )}
    </div>
  )

  if (notification.action_url) {
    return (
      <Link to={notification.action_url} className="block">
        {content}
      </Link>
    )
  }

  return content
}

export function NotificationsPage() {
  const { data, isLoading } = useNotifications({ limit: 50 })
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  const notifications: Notification[] = safeArray<Notification>(data)
  const unreadCount = notifications.filter((n) => !n.read_at).length

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-kalkvit mb-1">
              Notifications
            </h1>
            <p className="text-kalkvit/60 text-sm">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </p>
          </div>
          {unreadCount > 0 && (
            <GlassButton
              variant="secondary"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="text-sm"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </GlassButton>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-koppar" />
          </div>
        ) : notifications.length === 0 ? (
          <GlassCard variant="base">
            <div className="text-center py-12">
              <BellOff className="w-12 h-12 text-kalkvit/15 mx-auto mb-3" />
              <p className="text-kalkvit/50 text-sm">No notifications yet</p>
            </div>
          </GlassCard>
        ) : (
          <GlassCard variant="base" className="divide-y divide-white/[0.06]">
            <div className="space-y-1 p-2">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={(id) => markRead.mutate(id)}
                />
              ))}
            </div>
          </GlassCard>
        )}
      </div>
    </MainLayout>
  )
}

export default NotificationsPage
