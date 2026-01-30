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
import { useCurrentProfile, useUpdateProfile, useUploadAvatar } from '../lib/api/hooks'
import { useInterests, useMemberInterests, useUpdateMemberInterests } from '../hooks/useInterests'
import { ARCHETYPES, PILLARS, PILLAR_IDS } from '../lib/constants'
import type { Archetype, PillarId } from '../lib/constants'
import type { UpdateProfileRequest } from '../lib/api/types'
import { Camera, Save, Loader2 } from 'lucide-react'

export function ProfilePage() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle'|'success'|'error'>('idle')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch profile data
  const { data: profile, isLoading: profileLoading } = useCurrentProfile()
  const { data: interests = [], isLoading: interestsLoading } = useInterests()
  const { data: memberInterestIds = [], isLoading: memberInterestsLoading } = useMemberInterests(
    user?.id
  )

  // Mutations
  const updateProfile = useUpdateProfile()
  const uploadAvatar = useUploadAvatar()
  const updateMemberInterests = useUpdateMemberInterests()

  // Local form state
  const [formData, setFormData] = useState({
    display_name: '',
    whatsapp_number: '',
    city: '',
    country: '',
    bio: '',
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

    try {
      await uploadAvatar.mutateAsync(file)
    } catch {
      setSaveStatus('error')
    }
  }

  const handleSave = async () => {
    if (!user?.id) return

    setSaveStatus('idle')

    try {
      // Update profile via API
      const profileData: UpdateProfileRequest = {
        display_name: formData.display_name || undefined,
        whatsapp_number: formData.whatsapp_number || undefined,
        city: formData.city || undefined,
        country: formData.country || undefined,
        bio: formData.bio || undefined,
        archetype: formData.archetype || undefined,
        pillar_focus: formData.pillar_focus.length > 0 ? formData.pillar_focus : undefined,
        notification_preferences: {
          email_notifications: formData.email_notifications,
          weekly_digest: formData.weekly_digest,
        },
      }
      await updateProfile.mutateAsync(profileData)

      // Update interests
      await updateMemberInterests.mutateAsync({
        userId: user.id,
        interestIds: selectedInterests,
      })

      setSaveStatus('success')
      setIsEditing(false)
    } catch {
      setSaveStatus('error')
    }
  }

  const isLoading = profileLoading || interestsLoading || memberInterestsLoading
  const isSaving = updateProfile.isPending || updateMemberInterests.isPending || uploadAvatar.isPending

  // Options for dropdowns
  const archetypeOptions = [
    { value: '', label: 'Select your archetype' },
    ...ARCHETYPES.map((arch) => ({ value: arch, label: arch })),
  ]

  const pillarItems = PILLAR_IDS.map((id) => ({
    value: id,
    label: PILLARS[id].name,
  }))

  const interestItems = interests.map((interest) => ({
    value: interest.id,
    label: interest.name,
    description: interest.description || undefined,
  }))

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-kalkvit mb-2">Profile</h1>
            <p className="text-kalkvit/60">Manage your account settings and preferences</p>
          </div>
          <GlassButton
            variant={isEditing ? 'primary' : 'secondary'}
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : isEditing ? (
              <>
                <Save className="w-4 h-4" />
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
            <Loader2 className="w-8 h-8 animate-spin text-koppar" />
          </div>
        ) : (
          <>
            {/* Profile Header */}
            <GlassCard variant="elevated" className="mb-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <GlassAvatar initials={initials} size="xl" />
                  {uploadAvatar.isPending && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                      <Loader2 className="w-6 h-6 animate-spin text-kalkvit" />
                    </div>
                  )}
                  {isEditing && (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 p-2 rounded-full bg-koppar text-kalkvit hover:bg-koppar/80 transition-colors"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
                <div>
                  <h2 className="font-serif text-2xl font-bold text-kalkvit">{displayName}</h2>
                  <p className="text-kalkvit/60">{user?.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {formData.archetype && (
                      <span className="px-2 py-0.5 rounded-md bg-koppar/20 text-koppar text-sm">
                        {formData.archetype}
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
                  label="Email"
                  type="email"
                  placeholder="your@email.com"
                  value={user?.email || ''}
                  disabled
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
              </div>
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
                  <GlassMultiSelect
                    label="Your Interests"
                    items={interestItems}
                    value={selectedInterests}
                    onChange={setSelectedInterests}
                    placeholder="Select your interests"
                    disabled={!isEditing}
                    maxDisplay={5}
                  />
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
            <GlassCard variant="base">
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
                      onChange={(e) =>
                        setFormData({ ...formData, email_notifications: e.target.checked })
                      }
                      disabled={!isEditing}
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
                      onChange={(e) =>
                        setFormData({ ...formData, weekly_digest: e.target.checked })
                      }
                      disabled={!isEditing}
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-kalkvit after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-koppar"></div>
                  </label>
                </div>
              </div>
            </GlassCard>
          </>
        )}
      </div>
    </MainLayout>
  )
}
