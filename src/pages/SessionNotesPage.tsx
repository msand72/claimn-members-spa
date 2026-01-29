import { useState, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassTextarea, GlassAvatar, GlassBadge } from '../components/ui'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Target,
  CheckCircle,
  Edit3,
  Save,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { useCoachingSession, useSessionNotes, useUpdateSessionNotes } from '../lib/api/hooks'
import type { SessionActionItem, UpdateSessionNoteRequest } from '../lib/api/types'
export function SessionNotesPage() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('id') ?? ''

  // --- API hooks ---
  const {
    data: session,
    isLoading: sessionLoading,
    isError: sessionError,
    refetch: refetchSession,
  } = useCoachingSession(sessionId)

  const {
    data: notes,
    isLoading: notesLoading,
    isError: notesError,
    refetch: refetchNotes,
  } = useSessionNotes(sessionId)

  const updateNotes = useUpdateSessionNotes()

  // --- Local UI state ---
  const [isEditing, setIsEditing] = useState(false)
  const [editedPersonalNotes, setEditedPersonalNotes] = useState('')
  const [newActionItem, setNewActionItem] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Helper to persist note updates
  const persistNotes = useCallback(
    (data: UpdateSessionNoteRequest) => {
      updateNotes.mutate(
        { sessionId, data },
        {
          onSuccess: () => {
            setSaveSuccess(true)
            setTimeout(() => setSaveSuccess(false), 2000)
          },
        },
      )
    },
    [sessionId, updateNotes],
  )

  // --- Action item handlers ---
  const handleToggleActionItem = (index: number) => {
    if (!notes) return
    const updated: SessionActionItem[] = notes.action_items.map((item, i) =>
      i === index ? { ...item, completed: !item.completed } : item,
    )
    persistNotes({ action_items: updated })
  }

  const handleAddActionItem = () => {
    if (!notes || !newActionItem.trim()) return
    const newItem: SessionActionItem = {
      id: crypto.randomUUID(),
      text: newActionItem.trim(),
      completed: false,
    }
    persistNotes({ action_items: [...notes.action_items, newItem] })
    setNewActionItem('')
  }

  const handleDeleteActionItem = (index: number) => {
    if (!notes) return
    const updated = notes.action_items.filter((_, i) => i !== index)
    persistNotes({ action_items: updated })
  }

  // --- Personal notes handlers ---
  const handleStartEditing = () => {
    if (!notes) return
    setEditedPersonalNotes(notes.personal_notes)
    setIsEditing(true)
  }

  const handleSavePersonalNotes = () => {
    persistNotes({ personal_notes: editedPersonalNotes })
    setIsEditing(false)
  }

  // --- Loading state ---
  const isLoading = sessionLoading || notesLoading
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-koppar" />
        </div>
      </MainLayout>
    )
  }

  // --- Error state ---
  const isError = sessionError || notesError
  if (isError || !session || !notes) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <AlertTriangle className="w-8 h-8 text-tegelrod" />
          <p className="text-kalkvit/70">Failed to load session notes.</p>
          <GlassButton
            variant="secondary"
            onClick={() => {
              refetchSession()
              refetchNotes()
            }}
          >
            Retry
          </GlassButton>
        </div>
      </MainLayout>
    )
  }

  // --- Derived data ---
  const completedCount = notes.action_items.filter((a) => a.completed).length
  const progress =
    notes.action_items.length > 0
      ? Math.round((completedCount / notes.action_items.length) * 100)
      : 0

  const coachName = session.expert?.name ?? 'Coach'
  const coachInitials = coachName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const formattedDate = new Date(session.scheduled_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        {/* Save confirmation */}
        {saveSuccess && (
          <div className="mb-4 text-center text-sm text-skogsgron font-medium">
            Changes saved successfully
          </div>
        )}

        {/* Back Link */}
        <Link
          to="/coaching/sessions"
          className="inline-flex items-center gap-2 text-kalkvit/60 hover:text-kalkvit mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sessions
        </Link>

        {/* Session Header */}
        <GlassCard variant="elevated" className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex gap-4">
              <GlassAvatar initials={coachInitials} size="lg" />
              <div>
                <h1 className="font-display text-2xl font-bold text-kalkvit mb-1">
                  {session.title}
                </h1>
                <p className="text-koppar">{coachName}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-kalkvit/60">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formattedDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {session.duration} min
                  </span>
                </div>
              </div>
            </div>
            <GlassBadge variant="success">Completed</GlassBadge>
          </div>

          {/* Session Goals */}
          <div className="pt-4 border-t border-white/10">
            <p className="text-sm text-kalkvit/50 mb-2 flex items-center gap-1">
              <Target className="w-4 h-4" />
              Session Goals
            </p>
            <div className="flex flex-wrap gap-2">
              {session.goals.map((goal, i) => (
                <span
                  key={i}
                  className="text-sm px-3 py-1 rounded-lg bg-white/[0.06] text-kalkvit/70"
                >
                  {goal}
                </span>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Key Takeaways */}
        <GlassCard variant="base" className="mb-6">
          <h2 className="font-semibold text-kalkvit mb-4">Key Takeaways</h2>
          <ul className="space-y-3">
            {notes.key_takeaways.map((takeaway, i) => (
              <li key={i} className="flex items-start gap-3 text-kalkvit/80">
                <span className="text-koppar mt-1">•</span>
                {takeaway}
              </li>
            ))}
          </ul>
        </GlassCard>

        {/* Action Items */}
        <GlassCard variant="base" className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-kalkvit">Action Items</h2>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-kalkvit/50">
                {completedCount}/{notes.action_items.length} completed
              </span>
              <div className="w-24 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-skogsgron rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {notes.action_items.map((item, i) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] group"
              >
                <button
                  onClick={() => handleToggleActionItem(i)}
                  className="flex items-center gap-3 flex-1 text-left"
                  disabled={updateNotes.isPending}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      item.completed
                        ? 'bg-skogsgron border-skogsgron'
                        : 'border-kalkvit/30 hover:border-koppar'
                    }`}
                  >
                    {item.completed && <CheckCircle className="w-4 h-4 text-kalkvit" />}
                  </div>
                  <span
                    className={`${
                      item.completed ? 'line-through text-kalkvit/40' : 'text-kalkvit/80'
                    }`}
                  >
                    {item.text}
                  </span>
                </button>
                <button
                  onClick={() => handleDeleteActionItem(i)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-kalkvit/40 hover:text-tegelrod transition-all"
                  disabled={updateNotes.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add new action item */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newActionItem}
              onChange={(e) => setNewActionItem(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddActionItem()}
              placeholder="Add new action item..."
              className="flex-1 px-4 py-2 bg-white/[0.05] border border-white/[0.1] rounded-xl text-kalkvit placeholder-kalkvit/40 focus:outline-none focus:border-koppar/50"
              disabled={updateNotes.isPending}
            />
            <GlassButton
              variant="secondary"
              onClick={handleAddActionItem}
              disabled={updateNotes.isPending}
            >
              <Plus className="w-4 h-4" />
            </GlassButton>
          </div>
        </GlassCard>

        {/* Personal Notes */}
        <GlassCard variant="base">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-kalkvit">Personal Notes</h2>
            <GlassButton
              variant="ghost"
              className="text-sm"
              onClick={isEditing ? handleSavePersonalNotes : handleStartEditing}
              disabled={updateNotes.isPending}
            >
              {isEditing ? (
                <>
                  <Save className="w-4 h-4" />
                  Save
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4" />
                  Edit
                </>
              )}
            </GlassButton>
          </div>

          {isEditing ? (
            <GlassTextarea
              value={editedPersonalNotes}
              onChange={(e) => setEditedPersonalNotes(e.target.value)}
              rows={6}
              placeholder="Add your personal notes..."
            />
          ) : (
            <p className="text-kalkvit/70 whitespace-pre-wrap">{notes.personal_notes}</p>
          )}
        </GlassCard>
      </div>
    </MainLayout>
  )
}
