import { useState, useRef, useEffect } from 'react'
import { MainLayout } from '../components/layout/MainLayout'
import {
  GlassCard,
  GlassButton,
  GlassTextarea,
  GlassAvatar,
  GlassBadge,
  GlassTabs,
  GlassDropdown,
} from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { useMyInterestGroups, useAllInterestGroups, type InterestGroup } from '../hooks/useInterestGroups'
import { useInterests, useMemberInterests } from '../hooks/useInterests'
import {
  useFeed,
  useCreatePost,
  useLikePost,
  useUnlikePost,
  usePostComments,
  useAddComment,
  type FeedPost,
  type FeedComment,
} from '../lib/api'
import { api } from '../lib/api/client'
import { Heart, MessageCircle, Share2, MoreHorizontal, ImagePlus, Send, Users, Loader2, Check, Flag, X } from 'lucide-react'
import { compressMessageImage, validateImageFile, blobToFile } from '../lib/image-utils'

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

function PostCard({ post }: { post: FeedPost }) {
  const likePost = useLikePost()
  const unlikePost = useUnlikePost()
  const addComment = useAddComment()

  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [shareCopied, setShareCopied] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [reported, setReported] = useState(false)
  const moreMenuRef = useRef<HTMLDivElement>(null)

  // Close more menu on outside click
  useEffect(() => {
    if (!showMoreMenu) return
    const handleClick = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showMoreMenu])

  // Fetch comments only when section is open
  const { data: commentsData, isLoading: commentsLoading } = usePostComments(
    showComments ? post.id : ''
  )
  const comments: FeedComment[] = commentsData ?? []

  const handleLike = () => {
    if (post.is_liked) {
      unlikePost.mutate(post.id)
    } else {
      likePost.mutate(post.id)
    }
  }

  const handleShare = async () => {
    const url = window.location.origin + '/feed/' + post.id
    try {
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
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

  const handleReport = () => {
    setReported(true)
    setShowMoreMenu(false)
    setTimeout(() => setReported(false), 3000)
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
        <GlassAvatar initials={initials} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-kalkvit">{authorName}</span>
                {post.author?.archetype && (
                  <GlassBadge variant="koppar">{post.author.archetype}</GlassBadge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-kalkvit/50 flex-wrap">
                <span>{formatTimeAgo(post.created_at)}</span>
                {post.interest_group_id && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:flex items-center gap-1 text-koppar truncate max-w-[150px]">
                      <Users className="w-3 h-3 flex-shrink-0" />
                      Interest Group
                    </span>
                  </>
                )}
              </div>
            </div>
            {/* More menu */}
            <div className="relative" ref={moreMenuRef}>
              <button
                onClick={() => setShowMoreMenu((v) => !v)}
                className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors text-kalkvit/50 hover:text-kalkvit"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              {showMoreMenu && (
                <div className="absolute right-0 top-10 z-20 glass-elevated rounded-lg py-1 min-w-[160px] shadow-lg border border-white/10">
                  <button
                    onClick={handleReport}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-kalkvit/80 hover:bg-white/[0.06] transition-colors"
                  >
                    <Flag className="w-4 h-4" />
                    Report Post
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Reported feedback */}
          {reported && (
            <div className="mb-2 px-3 py-1.5 rounded-lg bg-skogsgron/10 text-skogsgron text-sm flex items-center gap-2">
              <Check className="w-4 h-4" />
              Post reported. Thank you.
            </div>
          )}

          <p className="text-kalkvit/80 leading-relaxed mb-4">{post.content}</p>

          {post.image_url && (
            <img
              src={post.image_url}
              alt="Post attachment"
              className="rounded-lg mb-4 max-h-96 object-cover w-full"
            />
          )}

          <div className="flex items-center gap-6 pt-4 border-t border-white/10">
            <button
              onClick={handleLike}
              disabled={likePost.isPending || unlikePost.isPending}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                post.is_liked ? 'text-tegelrod' : 'text-kalkvit/60 hover:text-kalkvit'
              }`}
            >
              <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''}`} />
              {post.likes_count}
            </button>
            <button
              onClick={() => setShowComments((v) => !v)}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                showComments ? 'text-koppar' : 'text-kalkvit/60 hover:text-kalkvit'
              }`}
            >
              <MessageCircle className={`w-5 h-5 ${showComments ? 'fill-koppar/20' : ''}`} />
              {post.comments_count}
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 text-sm font-medium text-kalkvit/60 hover:text-kalkvit transition-colors"
            >
              {shareCopied ? (
                <>
                  <Check className="w-5 h-5 text-skogsgron" />
                  <span className="text-skogsgron">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-5 h-5" />
                  Share
                </>
              )}
            </button>
          </div>

          {/* Inline comments section */}
          {showComments && (
            <div className="mt-4 pt-4 border-t border-white/10">
              {commentsLoading && (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 text-koppar animate-spin" />
                </div>
              )}
              {!commentsLoading && comments.length === 0 && (
                <p className="text-kalkvit/50 text-sm mb-4">No comments yet. Be the first!</p>
              )}
              {!commentsLoading && comments.length > 0 && (
                <div className="space-y-3 mb-4">
                  {comments.map((comment) => {
                    const cName = comment.author?.display_name || 'Anonymous'
                    const cInitials = cName
                      .split(' ')
                      .map((n: string) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()
                    return (
                      <div key={comment.id} className="flex gap-3">
                        <GlassAvatar initials={cInitials} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-medium text-kalkvit">{cName}</span>
                            <span className="text-xs text-kalkvit/50">
                              {formatTimeAgo(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-kalkvit/80">{comment.content}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              {/* Add comment input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleAddComment()
                    }
                  }}
                  placeholder="Write a comment..."
                  className="flex-1 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-kalkvit placeholder-kalkvit/40 focus:outline-none focus:border-koppar/50 transition-colors"
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

export function FeedPage() {
  const { user } = useAuth()
  const [postContent, setPostContent] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')
  const [postError, setPostError] = useState<string | null>(null)

  // Image upload state
  const [pendingImage, setPendingImage] = useState<{ file: File; preview: string } | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset input so same file can be re-selected
    e.target.value = ''

    const validationError = validateImageFile(file)
    if (validationError) {
      setPostError(validationError)
      return
    }

    const preview = URL.createObjectURL(file)
    setPendingImage({ file, preview })
  }

  const clearPendingImage = () => {
    if (pendingImage?.preview) {
      URL.revokeObjectURL(pendingImage.preview)
    }
    setPendingImage(null)
  }

  const { data: myGroups = [] } = useMyInterestGroups(user?.id)
  const { data: allGroups = [] } = useAllInterestGroups()
  const { data: memberInterestIds = [] } = useMemberInterests(user?.id)
  const { data: allInterests = [] } = useInterests()

  // Derive effective groups with fallback chain:
  // 1. Backend "my groups" (user explicitly joined)
  // 2. All groups filtered by user's selected interests
  // 3. Virtual groups created from user's selected interests
  const effectiveGroups: InterestGroup[] = (() => {
    if (myGroups.length > 0) return myGroups
    if (allGroups.length > 0 && memberInterestIds.length > 0) {
      return allGroups.filter((g) => memberInterestIds.includes(g.interest_id))
    }
    if (allInterests.length > 0 && memberInterestIds.length > 0) {
      return allInterests
        .filter((i) => memberInterestIds.includes(i.id))
        .map((i) => ({
          id: i.id,
          interest_id: i.id,
          name: i.name,
          description: i.description,
          member_count: 0,
          post_count: 0,
          interest: { id: i.id, name: i.name, slug: i.slug, icon: i.icon },
        }))
    }
    return []
  })()

  // Fetch feed from API
  const interestGroupFilter = activeTab !== 'all' && activeTab !== 'my-groups' ? activeTab : undefined
  const { data: feedData, isLoading: feedLoading, error: feedError } = useFeed({
    interest_group_id: interestGroupFilter,
    limit: 20,
  })

  const createPost = useCreatePost()

  const displayName = user?.display_name || user?.email?.split('@')[0] || 'Member'
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  // Determine the group to post to: if viewing a specific group tab, use that; otherwise use dropdown
  const isSpecificGroupTab = activeTab !== 'all' && activeTab !== 'my-groups'
  const postGroupId = isSpecificGroupTab ? activeTab : selectedGroupId

  const handlePost = async () => {
    if (!postContent.trim() && !pendingImage) return

    setPostError(null)
    let imageUrl: string | undefined

    // Upload image if present
    if (pendingImage) {
      setIsUploading(true)
      try {
        const compressed = await compressMessageImage(pendingImage.file)
        const compressedFile = blobToFile(compressed, `feed-${Date.now()}.jpg`, 'image/jpeg')
        const result = await api.uploadFile('/members/feed/upload', compressedFile, 'image')
        imageUrl = result.url
      } catch {
        setPostError('Failed to upload image. Please try again.')
        setIsUploading(false)
        return
      }
      setIsUploading(false)
    }

    createPost.mutate({
      content: postContent || (imageUrl ? '[Image]' : ''),
      image_url: imageUrl,
      interest_group_id: postGroupId || undefined,
    }, {
      onSuccess: () => {
        setPostContent('')
        setSelectedGroupId('')
        clearPendingImage()
      },
      onError: (err) => {
        const message = err instanceof Error ? err.message : 'Failed to create post'
        setPostError(message)
      },
    })
  }

  // Get posts from API response, filter by active tab
  const allPosts = Array.isArray(feedData?.data) ? feedData.data : []
  const effectiveGroupIds = new Set(effectiveGroups.map((g) => g.id))
  const posts = activeTab === 'all'
    ? allPosts
    : activeTab === 'my-groups'
      ? allPosts.filter((p) => p.interest_group_id && (effectiveGroupIds.size === 0 || effectiveGroupIds.has(p.interest_group_id)))
      : allPosts.filter((p) => p.interest_group_id === activeTab)

  // Create tab options — show individual interest tabs
  const tabs = [
    { value: 'all', label: 'All Posts' },
    ...(effectiveGroups.length > 0
      ? [{ value: 'my-groups', label: 'My Groups' }]
      : []),
    ...effectiveGroups.slice(0, 5).map((g) => ({
      value: g.id,
      label: g.name,
    })),
  ]

  // Real backend groups for posting (not virtual groups from raw interests)
  const realGroups = myGroups.length > 0
    ? myGroups
    : allGroups.length > 0 && memberInterestIds.length > 0
      ? allGroups.filter((g) => memberInterestIds.includes(g.interest_id))
      : []

  // Create group dropdown options for posting (only real groups)
  const groupOptions = realGroups.map((g) => ({
    value: g.id,
    label: g.name,
  }))

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-kalkvit mb-2">Community Feed</h1>
          <p className="text-kalkvit/60">Share updates and connect with the brotherhood</p>
        </div>

        {/* Feed Tabs */}
        <div className="mb-6 overflow-x-auto">
          <GlassTabs
            tabs={tabs}
            value={activeTab}
            onChange={setActiveTab}
            className="min-w-max"
          />
        </div>

        {/* Create Post */}
        <GlassCard variant="elevated" className="mb-6 relative z-10">
          <div className="flex gap-4">
            <GlassAvatar initials={initials} size="lg" />
            <div className="flex-1">
              <GlassTextarea
                placeholder="Share something with the community..."
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                className="mb-4 min-h-[100px]"
              />
              {/* Image preview */}
              {pendingImage && (
                <div className="relative inline-block mb-3">
                  <img
                    src={pendingImage.preview}
                    alt="Upload preview"
                    className="max-h-40 rounded-lg object-cover border border-white/10"
                  />
                  <button
                    onClick={clearPendingImage}
                    className="absolute -top-2 -right-2 p-1 rounded-full bg-charcoal border border-white/20 text-kalkvit/70 hover:text-kalkvit hover:bg-charcoal/90 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors text-kalkvit/50 hover:text-kalkvit"
                    title="Add image"
                  >
                    <ImagePlus className="w-5 h-5" />
                  </button>
                  {isSpecificGroupTab ? (
                    <span className="text-sm text-koppar flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      {effectiveGroups.find((g) => g.id === activeTab)?.name || 'Group'}
                    </span>
                  ) : realGroups.length > 0 ? (
                    <GlassDropdown
                      items={groupOptions}
                      value={selectedGroupId}
                      onChange={(val) => setSelectedGroupId(val === selectedGroupId ? '' : val)}
                      placeholder="Post to group (optional)"
                      className="min-w-[200px]"
                    />
                  ) : null}
                </div>
                <GlassButton
                  variant="primary"
                  onClick={handlePost}
                  disabled={(!postContent.trim() && !pendingImage) || createPost.isPending || isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : createPost.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {isUploading ? 'Uploading...' : createPost.isPending ? 'Posting...' : 'Post'}
                </GlassButton>
              </div>
              {postError && (
                <p className="text-sm text-tegelrod mt-2">{postError}</p>
              )}
            </div>
          </div>
        </GlassCard>

        {/* My Interest Groups Summary */}
        {effectiveGroups.length > 0 && activeTab === 'all' && (
          <GlassCard variant="base" className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-kalkvit">My Interests</h3>
              <span className="text-sm text-kalkvit/50">{effectiveGroups.length} topics</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {effectiveGroups.slice(0, 8).map((group) => (
                <button
                  key={group.id}
                  onClick={() => setActiveTab(group.id)}
                  className="px-3 py-1.5 rounded-lg bg-koppar/10 text-koppar text-sm hover:bg-koppar/20 transition-colors flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  {group.name}
                </button>
              ))}
              {effectiveGroups.length > 8 && (
                <span className="px-3 py-1.5 text-kalkvit/50 text-sm">
                  +{effectiveGroups.length - 8} more
                </span>
              )}
            </div>
          </GlassCard>
        )}

        {/* Loading state */}
        {feedLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-koppar animate-spin" />
          </div>
        )}

        {/* Error state */}
        {feedError && (
          <GlassCard variant="base" className="text-center py-12">
            <p className="text-tegelrod mb-2">Failed to load feed</p>
            <p className="text-kalkvit/50 text-sm">Please try again later</p>
          </GlassCard>
        )}

        {/* Empty state */}
        {!feedLoading && !feedError && posts.length === 0 && (
          <GlassCard variant="base" className="text-center py-12">
            <Users className="w-12 h-12 text-kalkvit/20 mx-auto mb-4" />
            <h3 className="font-medium text-kalkvit mb-2">No posts yet</h3>
            <p className="text-kalkvit/50 text-sm mb-4">
              Be the first to share something with the community!
            </p>
            {activeTab !== 'all' && (
              <GlassButton variant="secondary" onClick={() => setActiveTab('all')}>
                View All Posts
              </GlassButton>
            )}
          </GlassCard>
        )}

        {/* Feed Posts */}
        {!feedLoading && !feedError && (
          <div>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}

export default FeedPage;
