import { useState, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassTextarea, GlassAvatar, GlassBadge, GlassInput } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import {
  useCircle,
  useCircleMembers,
  useCirclePosts,
  useCreateCirclePost,
  useJoinCircle,
  useLeaveCircle,
  useLikePost,
  useUnlikePost,
  usePostComments,
  useAddComment,
} from '../lib/api/hooks'
import type { CirclePost, CircleMember, FeedComment } from '../lib/api/types'
import {
  Users,
  MessageCircle,
  ArrowLeft,
  Heart,
  Send,
  Share2,
  Bell,
  BellOff,
  UserPlus,
  UserMinus,
  Clock,
  Loader2,
  AlertCircle,
  Check,
} from 'lucide-react'

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

function PostCard({ post }: { post: CirclePost }) {
  const likePost = useLikePost()
  const unlikePost = useUnlikePost()
  const addComment = useAddComment()

  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [shareCopied, setShareCopied] = useState(false)
  const shareTimerRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => () => { if (shareTimerRef.current) clearTimeout(shareTimerRef.current) }, [])

  // Fetch comments only when section is open
  const { data: commentsData, isLoading: commentsLoading } = usePostComments(
    showComments ? post.id : ''
  )
  const comments: FeedComment[] = Array.isArray(commentsData) ? commentsData : []

  const handleLike = () => {
    if (post.is_liked) {
      unlikePost.mutate(post.id)
    } else {
      likePost.mutate(post.id)
    }
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/circles/${post.circle_id || ''}`
    try {
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
      shareTimerRef.current = setTimeout(() => setShareCopied(false), 2000)
    } catch {
      // Fallback: silently fail
    }
  }

  const handleAddComment = () => {
    if (!commentText.trim()) return
    addComment.mutate(
      { postId: post.id, data: { content: commentText.trim() } },
      { onSuccess: () => setCommentText('') }
    )
  }

  const authorName = post.author?.display_name || 'Anonymous'
  const initials = authorName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <GlassCard variant="base" className="mb-4">
      <div className="flex gap-4">
        <GlassAvatar initials={initials} size="md" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-kalkvit">{authorName}</span>
            <span className="text-xs text-kalkvit/40">{formatTimeAgo(post.created_at)}</span>
          </div>
          <p className="text-kalkvit/80 mb-4">{post.content}</p>
          {post.image_url && (
            <img
              src={post.image_url}
              alt="Post attachment"
              className="rounded-lg mb-4 max-h-64 object-cover"
            />
          )}
          <div className="flex items-center gap-4 pt-3 border-t border-white/10">
            <button
              onClick={handleLike}
              disabled={likePost.isPending || unlikePost.isPending}
              className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                post.is_liked ? 'text-tegelrod' : 'text-kalkvit/50 hover:text-kalkvit'
              }`}
            >
              <Heart className={`w-4 h-4 ${post.is_liked ? 'fill-current' : ''}`} />
              {post.likes_count}
            </button>
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1 text-sm font-medium text-kalkvit/50 hover:text-kalkvit transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              {post.comments_count}
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-1 text-sm font-medium text-kalkvit/50 hover:text-kalkvit transition-colors"
            >
              {shareCopied ? (
                <>
                  <Check className="w-4 h-4 text-skogsgron" />
                  <span className="text-skogsgron">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  Share
                </>
              )}
            </button>
          </div>

          {/* Inline comments section */}
          {showComments && (
            <div className="mt-4 pt-3 border-t border-white/10">
              {commentsLoading && (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-4 h-4 text-koppar animate-spin" />
                </div>
              )}
              {!commentsLoading && comments.length > 0 && (
                <div className="space-y-3 mb-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-2">
                      <GlassAvatar
                        initials={
                          (comment.author?.display_name || 'A')
                            .split(' ')
                            .map((n: string) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()
                        }
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-kalkvit">
                          {comment.author?.display_name || 'Anonymous'}
                        </span>
                        <p className="text-sm text-kalkvit/70">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!commentsLoading && comments.length === 0 && (
                <p className="text-xs text-kalkvit/40 mb-3">No comments yet</p>
              )}
              <div className="flex gap-2">
                <GlassInput
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleAddComment()
                    }
                  }}
                  className="flex-1 text-sm"
                />
                <GlassButton
                  variant="primary"
                  onClick={handleAddComment}
                  disabled={!commentText.trim() || addComment.isPending}
                  className="px-3"
                >
                  {addComment.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </GlassButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  )
}

function MemberCard({ member }: { member: CircleMember }) {
  const initials = member.display_name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03]">
      <div className="flex items-center gap-3">
        <GlassAvatar initials={initials} size="md" />
        <div>
          <p className="font-medium text-kalkvit">{member.display_name}</p>
          <p className="text-xs text-kalkvit/50 capitalize">{member.role}</p>
        </div>
      </div>
      {member.role === 'admin' && <GlassBadge variant="koppar">Admin</GlassBadge>}
      {member.role === 'moderator' && <GlassBadge variant="default">Moderator</GlassBadge>}
    </div>
  )
}

export function CircleDetailPage() {
  const { id: circleId } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [postContent, setPostContent] = useState('')
  const [notifications, setNotifications] = useState(true)
  const [activeTab, setActiveTab] = useState<'feed' | 'members'>('feed')

  // API hooks
  const { data: circle, isLoading: circleLoading, error: circleError } = useCircle(circleId || '')
  const { data: membersData, isLoading: membersLoading, error: membersError } = useCircleMembers(circleId || '')
  const { data: postsData, isLoading: postsLoading, error: postsError } = useCirclePosts(circleId || '')
  const createPost = useCreateCirclePost()
  const joinCircle = useJoinCircle()
  const leaveCircle = useLeaveCircle()

  const members = Array.isArray(membersData?.data) ? membersData.data : []
  const posts = Array.isArray(postsData?.data) ? postsData.data : []

  const displayName = user?.display_name || user?.email?.split('@')[0] || 'Member'
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const handlePost = () => {
    if (postContent.trim() && circleId) {
      createPost.mutate(
        { circleId, content: postContent },
        {
          onSuccess: () => setPostContent(''),
        }
      )
    }
  }

  const handleJoinLeave = () => {
    if (!circleId) return
    if (circle?.is_member) {
      leaveCircle.mutate(circleId)
    } else {
      joinCircle.mutate(circleId)
    }
  }

  // Loading state
  if (circleLoading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-koppar animate-spin" />
        </div>
      </MainLayout>
    )
  }

  // Error state
  if (circleError || !circle) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <Link
            to="/circles"
            className="inline-flex items-center gap-2 text-kalkvit/60 hover:text-kalkvit mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Circles
          </Link>
          <GlassCard variant="base" className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-tegelrod/50 mx-auto mb-4" />
            <h3 className="font-medium text-kalkvit mb-2">Circle not found</h3>
            <p className="text-kalkvit/50 text-sm">
              The circle you're looking for doesn't exist or you don't have access.
            </p>
          </GlassCard>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link
          to="/circles"
          className="inline-flex items-center gap-2 text-kalkvit/60 hover:text-kalkvit mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Circles
        </Link>

        {/* Circle Header */}
        <GlassCard variant="elevated" className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-display text-2xl font-bold text-kalkvit">{circle.name}</h1>
                {circle.is_member && <GlassBadge variant="success">Member</GlassBadge>}
                {circle.is_admin && <GlassBadge variant="koppar">Admin</GlassBadge>}
              </div>
              {circle.description && (
                <p className="text-kalkvit/60 mb-4">{circle.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-kalkvit/50">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {circle.member_count} members
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Since {new Date(circle.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <GlassButton
                variant="ghost"
                onClick={() => setNotifications(!notifications)}
                className="p-2"
              >
                {notifications ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
              </GlassButton>
              <GlassButton
                variant={circle.is_member ? 'secondary' : 'primary'}
                onClick={handleJoinLeave}
                disabled={joinCircle.isPending || leaveCircle.isPending}
              >
                {joinCircle.isPending || leaveCircle.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : circle.is_member ? (
                  <>
                    <UserMinus className="w-4 h-4" />
                    Leave
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Join
                  </>
                )}
              </GlassButton>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-t border-white/10 pt-4 -mb-6 -mx-6 px-6">
            {(['feed', 'members'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 px-2 text-sm font-medium transition-colors capitalize ${
                  activeTab === tab
                    ? 'text-koppar border-b-2 border-koppar'
                    : 'text-kalkvit/60 hover:text-kalkvit'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Tab Content */}
        {activeTab === 'feed' && (
          <div>
            {/* Create Post */}
            {circle.is_member && (
              <GlassCard variant="base" className="mb-6">
                <div className="flex gap-4">
                  <GlassAvatar initials={initials} size="md" />
                  <div className="flex-1">
                    <GlassTextarea
                      placeholder="Share an update with the circle..."
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      className="mb-3"
                    />
                    <div className="flex justify-end">
                      <GlassButton
                        variant="primary"
                        onClick={handlePost}
                        disabled={!postContent.trim() || createPost.isPending}
                      >
                        {createPost.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        {createPost.isPending ? 'Posting...' : 'Post'}
                      </GlassButton>
                    </div>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Loading posts */}
            {postsLoading && (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-koppar animate-spin" />
              </div>
            )}

            {/* Posts error */}
            {!postsLoading && postsError && (
              <GlassCard variant="base" className="text-center py-8">
                <AlertCircle className="w-10 h-10 text-tegelrod/50 mx-auto mb-3" />
                <p className="text-kalkvit/50 text-sm">Unable to load posts</p>
                <p className="text-kalkvit/30 text-xs mt-1">You may not have access yet. Try refreshing.</p>
              </GlassCard>
            )}

            {/* Posts */}
            {!postsLoading && !postsError && posts.length > 0 && (
              <div>
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}

            {/* Empty posts */}
            {!postsLoading && !postsError && posts.length === 0 && (
              <GlassCard variant="base" className="text-center py-8">
                <MessageCircle className="w-10 h-10 text-kalkvit/20 mx-auto mb-3" />
                <p className="text-kalkvit/50 text-sm">No posts yet</p>
                {circle.is_member && (
                  <p className="text-kalkvit/30 text-xs mt-1">Be the first to share something!</p>
                )}
              </GlassCard>
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <GlassCard variant="base">
            <h3 className="font-semibold text-kalkvit mb-4">
              Members ({circle.member_count})
            </h3>

            {/* Loading members */}
            {membersLoading && (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-koppar animate-spin" />
              </div>
            )}

            {/* Members error */}
            {!membersLoading && membersError && (
              <div className="text-center py-8">
                <AlertCircle className="w-10 h-10 text-tegelrod/50 mx-auto mb-3" />
                <p className="text-kalkvit/50 text-sm">Unable to load members</p>
              </div>
            )}

            {/* Members list */}
            {!membersLoading && !membersError && members.length > 0 && (
              <div className="space-y-3">
                {members.map((member) => (
                  <MemberCard key={member.user_id} member={member} />
                ))}
              </div>
            )}

            {/* Empty members */}
            {!membersLoading && !membersError && members.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-10 h-10 text-kalkvit/20 mx-auto mb-3" />
                <p className="text-kalkvit/50 text-sm">No members yet</p>
              </div>
            )}
          </GlassCard>
        )}
      </div>
    </MainLayout>
  )
}

export default CircleDetailPage;
