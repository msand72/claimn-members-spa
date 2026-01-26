import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassTextarea, GlassAvatar, GlassBadge } from '../components/ui'
import { ArrowLeft, Calendar, Clock, Target, CheckCircle, Edit3, Save, Plus, Trash2 } from 'lucide-react'

interface SessionNote {
  id: number
  sessionId: number
  sessionTitle: string
  coach: {
    name: string
    initials: string
  }
  date: string
  duration: number
  goals: string[]
  keyTakeaways: string[]
  actionItems: { text: string; completed: boolean }[]
  personalNotes: string
}

const mockSessionNote: SessionNote = {
  id: 1,
  sessionId: 2,
  sessionTitle: 'Leadership Development Review',
  coach: { name: 'Michael Chen', initials: 'MC' },
  date: 'January 20, 2026',
  duration: 60,
  goals: ['Review delegation progress', 'Discuss team feedback', 'Plan next steps'],
  keyTakeaways: [
    'Delegation is about trust, not just task assignment',
    'Team feedback shows improvement in communication clarity',
    'Need to focus on strategic thinking vs. tactical execution',
    'Weekly 1:1s are critical for team alignment',
  ],
  actionItems: [
    { text: 'Schedule 1:1s with all direct reports by Friday', completed: true },
    { text: 'Create delegation framework document', completed: false },
    { text: 'Review Q1 strategic priorities', completed: false },
    { text: 'Set up feedback loop with team leads', completed: true },
  ],
  personalNotes: 'Great session! Michael helped me realize that my tendency to micromanage comes from a fear of things going wrong. Need to trust my team more and focus on outcomes rather than processes. The delegation framework idea is really valuable - will make this a priority this week.',
}

export function SessionNotesPage() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('id')

  // In real app, would fetch based on sessionId
  void sessionId // Mark as intentionally unused for now

  const [isEditing, setIsEditing] = useState(false)
  const [note, setNote] = useState(mockSessionNote)
  const [newActionItem, setNewActionItem] = useState('')

  const handleToggleActionItem = (index: number) => {
    const updated = [...note.actionItems]
    updated[index].completed = !updated[index].completed
    setNote({ ...note, actionItems: updated })
  }

  const handleAddActionItem = () => {
    if (newActionItem.trim()) {
      setNote({
        ...note,
        actionItems: [...note.actionItems, { text: newActionItem.trim(), completed: false }],
      })
      setNewActionItem('')
    }
  }

  const handleDeleteActionItem = (index: number) => {
    const updated = note.actionItems.filter((_, i) => i !== index)
    setNote({ ...note, actionItems: updated })
  }

  const completedCount = note.actionItems.filter((a) => a.completed).length
  const progress = Math.round((completedCount / note.actionItems.length) * 100)

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
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
              <GlassAvatar initials={note.coach.initials} size="lg" />
              <div>
                <h1 className="font-display text-2xl font-bold text-kalkvit mb-1">
                  {note.sessionTitle}
                </h1>
                <p className="text-koppar">{note.coach.name}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-kalkvit/60">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {note.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {note.duration} min
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
              {note.goals.map((goal, i) => (
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
            {note.keyTakeaways.map((takeaway, i) => (
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
                {completedCount}/{note.actionItems.length} completed
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
            {note.actionItems.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] group"
              >
                <button
                  onClick={() => handleToggleActionItem(i)}
                  className="flex items-center gap-3 flex-1 text-left"
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
            />
            <GlassButton variant="secondary" onClick={handleAddActionItem}>
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
              onClick={() => setIsEditing(!isEditing)}
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
              value={note.personalNotes}
              onChange={(e) => setNote({ ...note, personalNotes: e.target.value })}
              rows={6}
              placeholder="Add your personal notes..."
            />
          ) : (
            <p className="text-kalkvit/70 whitespace-pre-wrap">{note.personalNotes}</p>
          )}
        </GlassCard>
      </div>
    </MainLayout>
  )
}
