import { useState, useEffect, useRef } from 'react'
import { MainLayout } from '../components/layout/MainLayout'
import {
  GlassCard,
  GlassButton,
  GlassInput,
  GlassTextarea,
  GlassAvatar,
  GlassSelect,
  GlassMultiSelect,
} from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { useCurrentProfile, useUpdateProfile, useUploadAvatar, useAssessmentSharing, useUpdateAssessmentSharing, useCoachingPreferences, useUpdateCoachingPreferences } from '../lib/api/hooks'
import { useInterests, useMemberInterests, useUpdateMemberInterests } from '../hooks/useInterests'
import { ARCHETYPES, ARCHETYPE_LABELS, PILLARS, PILLAR_IDS } from '../lib/constants'
import type { Archetype, PillarId } from '../lib/constants'
import type { UpdateProfileRequest } from '../lib/api/types'
import { CameraIcon, ArrowDownOnSquareIcon, ArrowPathIcon, ExclamationTriangleIcon, CheckIcon } from '@heroicons/react/24/outline'
import { validateImageFile } from '../lib/image-utils'
import { cn } from '../lib/utils'
import { changeEmail, changePhone } from '../lib/auth'

/** Display formatter — Swedish mobile (46 + 9 digits) → "+46 XXX XXX XXX".
 *  Other formats fall back to "+<digits>". Storage stays raw E.164-no-+. */
function formatPhone(raw: string): string {
  const digits = (raw || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('46') && digits.length === 11) {
    const rest = digits.slice(2)
    return `+46 ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6)}`
  }
  return `+${digits}`
}

export function ProfilePage() {
  const { user, refreshUser, signOut } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle'|'success'|'error'>('idle')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Email change flow — separate from profile save because it goes to the
  // /auth/change-email endpoint and requires the user's current password.
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [emailCurrentPw, setEmailCurrentPw] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [emailSubmitting, setEmailSubmitting] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [emailSuccess, setEmailSuccess] = useState(false)

  // Phone change flow — separate from profile save because it goes to the
  // /auth/change-phone endpoint and requires the user's current password.
  const [showPhoneForm, setShowPhoneForm] = useState(false)
  const [phoneCurrentPw, setPhoneCurrentPw] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [phoneSubmitting, setPhoneSubmitting] = useState(false)
  const [phoneError, setPhoneError] = useState('')
  const [phoneSuccess, setPhoneSuccess] = useState(false)

  const cancelEmailChange = () => {
    setShowEmailForm(false)
    setEmailCurrentPw('')
    setNewEmail('')
    setEmailError('')
  }

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError('')
    setEmailSuccess(false)

    const trimmed = newEmail.trim()
    if (!trimmed || !trimmed.includes('@')) {
      setEmailError('Enter a valid email address')
      return
    }
    if (trimmed.toLowerCase() === (user?.email || '').toLowerCase()) {
      setEmailError('New email must differ from your current email')
      return
    }
    if (!emailCurrentPw) {
      setEmailError('Current password is required')
      return
    }

    setEmailSubmitting(true)
    try {
      await changeEmail(emailCurrentPw, trimmed)
      // The Go JWT issued at login has the OLD email baked into its claims.
      // /auth/me falls back to claims.Email when the token isn't a Supabase
      // token (auth_handlers.go:215), and change-phone / repeat change-email
      // do SignIn(user.Email_from_JWT, password) — both will see the stale
      // email and 401 against a now-non-existent auth.users row. Cleanest
      // fix from the SPA: force a clean re-login so the next JWT carries
      // the correct email claim. (Backend brief queued separately to read
      // canonical email from auth.users by user_id, which would let us drop
      // this workaround.)
      sessionStorage.setItem('email_change_pending_relogin', trimmed)
      await signOut()
      window.location.replace('/login')
      return
    } catch (err) {
      const e = err as Error & { code?: string }
      setEmailError(e.message || 'Failed to change email. Please try again.')
    } finally {
      setEmailSubmitting(false)
    }
  }

  const cancelPhoneChange = () => {
    setShowPhoneForm(false)
    setPhoneCurrentPw('')
    setNewPhone('')
    setPhoneError('')
  }

  const handleChangePhone = async (e: React.FormEvent) => {
    e.preventDefault()
    setPhoneError('')
    setPhoneSuccess(false)

    const digits = newPhone.replace(/\D/g, '')
    if (!digits) {
      setPhoneError('Enter a phone number (digits only, with country code)')
      return
    }
    if (!phoneCurrentPw) {
      setPhoneError('Current password is required')
      return
    }

    setPhoneSubmitting(true)
    try {
      await changePhone(phoneCurrentPw, digits)
      await refreshUser()
      setPhoneSuccess(true)
      setShowPhoneForm(false)
      setPhoneCurrentPw('')
      setNewPhone('')
    } catch (err) {
      const e = err as Error & { code?: string }
      setPhoneError(e.message || 'Failed to change phone number. Please try again.')
    } finally {
      setPhoneSubmitting(false)
    }
  }

  // Fetch profile data - handle both direct shape and { data: ... } wrapper
  const { data: profileRaw, isLoading: profileLoading, isError: profileError, refetch: refetchProfile } = useCurrentProfile()
  const profile = profileRaw && 'display_name' in profileRaw
    ? profileRaw
    : (profileRaw as unknown as { data?: typeof profileRaw })?.data ?? profileRaw
  const { data: interests = [], isLoading: interestsLoading } = useInterests()
  const { data: memberInterestIds = [], isLoading: memberInterestsLoading } = useMemberInterests(
    user?.id
  )

  // Mutations
  const updateProfile = useUpdateProfile()
  const uploadAvatar = useUploadAvatar()
  const updateMemberInterests = useUpdateMemberInterests()

  // Assessment sharing consent (independent of profile save)
  const { data: sharingData } = useAssessmentSharing()
  const updateSharing = useUpdateAssessmentSharing()

  // AI Coach email preferences
  const { data: coachingPrefs } = useCoachingPreferences()
  const updateCoachingPrefs = useUpdateCoachingPreferences()

  // Local form state
  const [formData, setFormData] = useState({
    display_name: '',
    whatsapp_number: '',
    city: '',
    country: '',
    bio: '',
    linkedin: '',
    archetype: '' as Archetype | '',
    pillar_focus: [] as PillarId[],
    email_notifications: true,
    weekly_digest: true,
  })
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])

  // Initialize form when data loads
  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        whatsapp_number: profile.whatsapp_number || '',
        city: profile.city || '',
        country: profile.country || '',
        bio: profile.bio || '',
        linkedin: profile.links?.linkedin || '',
        archetype: (profile.archetype as Archetype) || '',
        pillar_focus: (profile.pillar_focus as PillarId[]) || [],
        email_notifications: profile.notification_preferences?.email_notifications ?? true,
        weekly_digest: profile.notification_preferences?.weekly_digest ?? true,
      })
    } else if (user) {
      // Initialize from user metadata if no profile exists
      setFormData((prev) => ({
        ...prev,
        display_name: user.display_name || user.email?.split('@')[0] || '',
      }))
    }
  }, [profile, user])

  useEffect(() => {
    setSelectedInterests(memberInterestIds)
  }, [memberInterestIds])

  const displayName = formData.display_name || user?.email?.split('@')[0] || 'Member'
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validationError = validateImageFile(file, { maxSizeMB: 5 })
    if (validationError) { setSaveStatus('error'); return }

    try {
      await uploadAvatar.mutateAsync(file)
    } catch {
      setSaveStatus('error')
    }
  }

  const handleSave = async () => {
    if (!user?.id) return
    if (!formData.display_name?.trim()) return

    setSaveStatus('idle')

    const errors: string[] = []

    // Update profile — don't let a failure block interests save
    try {
      // Merge linkedin into existing links so sibling social keys aren't wiped
      // (backend does whole-object replace on the links jsonb column).
      const mergedLinks: Record<string, string> = { ...(profile?.links ?? {}) }
      const linkedinHandle = formData.linkedin.trim()
      if (linkedinHandle) {
        mergedLinks.linkedin = linkedinHandle
      } else {
        delete mergedLinks.linkedin
      }

      const profileData: UpdateProfileRequest = {
        display_name: formData.display_name || undefined,
        whatsapp_number: formData.whatsapp_number || undefined,
        city: formData.city || undefined,
        country: formData.country || undefined,
        bio: formData.bio || undefined,
        links: Object.keys(mergedLinks).length > 0 ? mergedLinks : undefined,
        archetype: formData.archetype || undefined,
        pillar_focus: formData.pillar_focus.length > 0 ? formData.pillar_focus : undefined,
        notification_preferences: {
          email_notifications: formData.email_notifications,
          weekly_digest: formData.weekly_digest,
        },
      }
      await updateProfile.mutateAsync(profileData)
    } catch {
      errors.push('profile')
    }

    // Update interests independently
    try {
      await updateMemberInterests.mutateAsync({
        userId: user.id,
        interestIds: selectedInterests,
      })
    } catch {
      errors.push('interests')
    }

    if (errors.length > 0) {
      setSaveStatus('error')
    } else {
      setSaveStatus('success')
      setIsEditing(false)
    }
  }

  const isLoading = profileLoading || interestsLoading || memberInterestsLoading
  const isSaving = updateProfile.isPending || updateMemberInterests.isPending || uploadAvatar.isPending

  // Options for dropdowns
  const archetypeOptions = [
    { value: '', label: 'Select your archetype' },
    ...ARCHETYPES.map((arch) => ({ value: arch, label: ARCHETYPE_LABELS[arch] })),
  ]

  const pillarItems = PILLAR_IDS.map((id) => ({
    value: id,
    label: PILLARS[id].name,
  }))


  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-kalkvit mb-2">Profile</h1>
            <p className="text-kalkvit/60">Manage your account settings and preferences</p>
          </div>
          <GlassButton
            variant={isEditing ? 'primary' : 'secondary'}
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : isEditing ? (
              <>
                <ArrowDownOnSquareIcon className="w-4 h-4" />
                Save Changes
              </>
            ) : (
              'Edit Profile'
            )}
          </GlassButton>
        </div>

        {saveStatus === 'error' && (
          <p className="text-sm text-tegelrod mt-2 mb-4">Failed to save. Please try again.</p>
        )}
        {saveStatus === 'success' && (
          <p className="text-sm text-skogsgron mt-2 mb-4">Profile saved successfully.</p>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <ArrowPathIcon className="w-8 h-8 animate-spin text-koppar" />
          </div>
        ) : profileError ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <ExclamationTriangleIcon className="w-8 h-8 text-tegelrod" />
            <p className="text-kalkvit/70">Failed to load profile.</p>
            <GlassButton variant="secondary" onClick={() => refetchProfile()}>
              Try Again
            </GlassButton>
          </div>
        ) : (
          <>
            {/* Profile Header */}
            <GlassCard variant="elevated" className="mb-6">
              <div className="flex items-center gap-3 md:gap-6">
                <div className="relative">
                  <GlassAvatar src={profile?.avatar_url} initials={initials} size="xl" />
                  {uploadAvatar.isPending && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                      <ArrowPathIcon className="w-6 h-6 animate-spin text-kalkvit" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadAvatar.isPending}
                    className="absolute bottom-0 right-0 p-2 rounded-full bg-koppar text-kalkvit hover:bg-koppar/80 transition-colors"
                  >
                    <CameraIcon className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <h2 className="font-serif text-2xl font-bold text-kalkvit">{displayName}</h2>
                  <p className="text-kalkvit/60">{user?.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {formData.archetype && (
                      <span className="px-2 py-0.5 rounded-md bg-koppar/20 text-koppar text-sm">
                        {ARCHETYPE_LABELS[formData.archetype] ?? formData.archetype}
                      </span>
                    )}
                    <span className="text-sm text-koppar">Brotherhood Member</span>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Personal Information */}
            <GlassCard variant="base" className="mb-6">
              <h3 className="font-display text-xl font-semibold text-kalkvit mb-6">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GlassInput
                  label="Display Name"
                  placeholder="Your display name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  disabled={!isEditing}
                />
                <GlassInput
                  label="City"
                  placeholder="Your city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  disabled={!isEditing}
                />
                <GlassInput
                  label="Country"
                  placeholder="Your country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  disabled={!isEditing}
                />
                <GlassInput
                  label="WhatsApp Number"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={formData.whatsapp_number}
                  onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                  disabled={!isEditing}
                />
                <div>
                  <GlassInput
                    label="LinkedIn"
                    placeholder="your-linkedin-handle"
                    value={formData.linkedin}
                    onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                    disabled={!isEditing}
                  />
                  {!isEditing && formData.linkedin && (
                    <a
                      href={`https://www.linkedin.com/in/${formData.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-koppar hover:underline mt-1 inline-block"
                    >
                      View on LinkedIn ↗
                    </a>
                  )}
                </div>
              </div>
            </GlassCard>

            {/* Email — separate card because change-flow goes to /auth/change-email
                and requires the user's current password (auth-table data, not profile). */}
            <GlassCard variant="base" className="mb-6">
              <h3 className="font-display text-xl font-semibold text-kalkvit mb-6">
                Email
              </h3>
              {!showEmailForm ? (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-kalkvit">{user?.email || (
                      <span className="text-kalkvit/50">Not set</span>
                    )}</p>
                    {emailSuccess && (
                      <p className="text-sm text-skogsgron mt-1">Email updated. Use the new address to log in next time.</p>
                    )}
                  </div>
                  <GlassButton
                    variant="secondary"
                    onClick={() => {
                      setEmailSuccess(false)
                      setShowEmailForm(true)
                    }}
                  >
                    Change email
                  </GlassButton>
                </div>
              ) : (
                <form onSubmit={handleChangeEmail} className="space-y-4">
                  <GlassInput
                    label="Current Password"
                    type="password"
                    placeholder="Enter your current password"
                    value={emailCurrentPw}
                    onChange={(e) => setEmailCurrentPw(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <GlassInput
                    label="New Email Address"
                    type="email"
                    placeholder="new@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    autoComplete="off"
                    required
                  />
                  {emailError && (
                    <p className="text-sm text-tegelrod">{emailError}</p>
                  )}
                  <div className="flex gap-3">
                    <GlassButton
                      type="submit"
                      variant="primary"
                      disabled={emailSubmitting}
                    >
                      {emailSubmitting ? 'Updating...' : 'Save'}
                    </GlassButton>
                    <GlassButton
                      type="button"
                      variant="secondary"
                      onClick={cancelEmailChange}
                      disabled={emailSubmitting}
                    >
                      Cancel
                    </GlassButton>
                  </div>
                </form>
              )}
            </GlassCard>

            {/* Phone Number — separate card because change-flow goes to /auth/change-phone
                and requires the user's current password (auth-table data, not profile). */}
            <GlassCard variant="base" className="mb-6">
              <h3 className="font-display text-xl font-semibold text-kalkvit mb-6">
                Phone Number
              </h3>
              {!showPhoneForm ? (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-kalkvit">
                      {user?.phone ? formatPhone(user.phone) : (
                        <span className="text-kalkvit/50">Not set</span>
                      )}
                    </p>
                    {phoneSuccess && (
                      <p className="text-sm text-skogsgron mt-1">Phone number updated.</p>
                    )}
                  </div>
                  <GlassButton
                    variant="secondary"
                    onClick={() => {
                      setPhoneSuccess(false)
                      setShowPhoneForm(true)
                    }}
                  >
                    Change phone number
                  </GlassButton>
                </div>
              ) : (
                <form onSubmit={handleChangePhone} className="space-y-4">
                  <GlassInput
                    label="Current Password"
                    type="password"
                    placeholder="Enter your current password"
                    value={phoneCurrentPw}
                    onChange={(e) => setPhoneCurrentPw(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <div>
                    <GlassInput
                      label="New Phone Number"
                      type="tel"
                      placeholder="46707081234"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      autoComplete="off"
                      required
                    />
                    <p className="text-xs text-kalkvit/40 mt-1">
                      Include country code without the + sign. Example: 46707081234
                    </p>
                  </div>
                  {phoneError && (
                    <p className="text-sm text-tegelrod">{phoneError}</p>
                  )}
                  <div className="flex gap-3">
                    <GlassButton
                      type="submit"
                      variant="primary"
                      disabled={phoneSubmitting}
                    >
                      {phoneSubmitting ? 'Updating...' : 'Save'}
                    </GlassButton>
                    <GlassButton
                      type="button"
                      variant="secondary"
                      onClick={cancelPhoneChange}
                      disabled={phoneSubmitting}
                    >
                      Cancel
                    </GlassButton>
                  </div>
                </form>
              )}
            </GlassCard>

            {/* CLAIM'N Profile */}
            <GlassCard variant="base" className="mb-6">
              <h3 className="font-display text-xl font-semibold text-kalkvit mb-6">
                CLAIM'N Profile
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GlassSelect
                  label="Your Archetype"
                  options={archetypeOptions}
                  value={formData.archetype}
                  onChange={(e) =>
                    setFormData({ ...formData, archetype: e.target.value as Archetype | '' })
                  }
                  disabled={!isEditing}
                />
                <GlassMultiSelect
                  label="Focus Pillars"
                  items={pillarItems}
                  value={formData.pillar_focus}
                  onChange={(values) =>
                    setFormData({ ...formData, pillar_focus: values as PillarId[] })
                  }
                  placeholder="Select your focus pillars"
                  disabled={!isEditing}
                  maxDisplay={3}
                />
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-kalkvit/80 mb-3">
                    Your Interests
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {interests.map((interest) => {
                      const isSelected = selectedInterests.includes(interest.id)
                      return (
                        <button
                          key={interest.id}
                          type="button"
                          disabled={!isEditing}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedInterests(selectedInterests.filter((id) => id !== interest.id))
                            } else {
                              setSelectedInterests([...selectedInterests, interest.id])
                            }
                          }}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-200',
                            isSelected
                              ? 'bg-koppar text-kalkvit shadow-[0_2px_8px_rgba(184,115,51,0.3)]'
                              : 'bg-white/[0.06] text-kalkvit/70',
                            isEditing && !isSelected && 'hover:bg-white/[0.12] hover:text-kalkvit',
                            !isEditing && 'cursor-default opacity-80'
                          )}
                        >
                          {isSelected && <CheckIcon className="w-3.5 h-3.5" />}
                          {interest.name}
                        </button>
                      )
                    })}
                  </div>
                  {interests.length === 0 && !interestsLoading && (
                    <p className="text-sm text-kalkvit/40 mt-2">No interests available.</p>
                  )}
                </div>
              </div>
            </GlassCard>

            {/* Bio */}
            <GlassCard variant="base" className="mb-6">
              <h3 className="font-display text-xl font-semibold text-kalkvit mb-6">About Me</h3>
              <GlassTextarea
                label="Bio"
                placeholder="Tell the community about yourself..."
                rows={4}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                disabled={!isEditing}
              />
            </GlassCard>

            {/* Preferences */}
            <GlassCard variant="base" className="mb-6">
              <h3 className="font-display text-xl font-semibold text-kalkvit mb-6">Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.04]">
                  <div>
                    <p className="text-kalkvit font-medium">Email Notifications</p>
                    <p className="text-sm text-kalkvit/50">Receive updates about your activity</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={formData.email_notifications}
                      onChange={(e) => {
                        const val = e.target.checked
                        setFormData((prev) => ({ ...prev, email_notifications: val }))
                        if (!isEditing) {
                          updateProfile.mutate({
                            notification_preferences: {
                              email_notifications: val,
                              weekly_digest: formData.weekly_digest,
                            },
                          })
                        }
                      }}
                      disabled={updateProfile.isPending}
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-kalkvit after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-koppar"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.04]">
                  <div>
                    <p className="text-kalkvit font-medium">Weekly Digest</p>
                    <p className="text-sm text-kalkvit/50">Get a summary of community activity</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={formData.weekly_digest}
                      onChange={(e) => {
                        const val = e.target.checked
                        setFormData((prev) => ({ ...prev, weekly_digest: val }))
                        if (!isEditing) {
                          updateProfile.mutate({
                            notification_preferences: {
                              email_notifications: formData.email_notifications,
                              weekly_digest: val,
                            },
                          })
                        }
                      }}
                      disabled={updateProfile.isPending}
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-kalkvit after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-koppar"></div>
                  </label>
                </div>
              </div>
            </GlassCard>

            {/* Privacy */}
            <GlassCard variant="base">
              <h3 className="font-display text-xl font-semibold text-kalkvit mb-6">Privacy</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.04]">
                  <div className="flex-1 mr-4">
                    <p className="text-kalkvit font-medium">Share assessment results with your coach</p>
                    <p className="text-sm text-kalkvit/50">
                      When enabled, your coach can see your archetype profile and pillar scores to personalize your coaching experience. When disabled, your assessment data remains private.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={sharingData?.consent ?? true}
                      onChange={(e) => updateSharing.mutate(e.target.checked)}
                      disabled={updateSharing.isPending}
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-kalkvit after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-koppar"></div>
                  </label>
                </div>
              </div>
            </GlassCard>

            {/* AI Coach Email Preferences */}
            {coachingPrefs?.ai_coaching_enabled && (
              <GlassCard variant="base">
                <h3 className="font-display text-xl font-semibold text-kalkvit mb-6">AI Coach</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.04]">
                    <div className="flex-1 mr-4">
                      <p className="text-kalkvit font-medium">Email me daily insights</p>
                      <p className="text-sm text-kalkvit/50">
                        Receive a daily email with personalized coaching insights based on your goals and progress.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={coachingPrefs?.email_insights_enabled ?? false}
                        onChange={(e) => updateCoachingPrefs.mutate({ email_insights_enabled: e.target.checked })}
                        disabled={updateCoachingPrefs.isPending}
                      />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-kalkvit after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-koppar"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.04]">
                    <div className="flex-1 mr-4">
                      <p className="text-kalkvit font-medium">Email me weekly review</p>
                      <p className="text-sm text-kalkvit/50">
                        Get a weekly summary of your progress, wins, and suggested focus areas for the coming week.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={coachingPrefs?.email_weekly_review_enabled ?? false}
                        onChange={(e) => updateCoachingPrefs.mutate({ email_weekly_review_enabled: e.target.checked })}
                        disabled={updateCoachingPrefs.isPending}
                      />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-kalkvit after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-koppar"></div>
                    </label>
                  </div>
                </div>
              </GlassCard>
            )}
          </>
        )}
      </div>
    </MainLayout>
  )
}

export default ProfilePage;
