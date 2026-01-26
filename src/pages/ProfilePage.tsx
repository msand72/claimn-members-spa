import { useState } from 'react'
import { MainLayout } from '../components/layout/MainLayout'
import { GlassCard, GlassButton, GlassInput, GlassTextarea, GlassAvatar } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { Camera, Save } from 'lucide-react'

export function ProfilePage() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member'
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

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
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            ) : (
              'Edit Profile'
            )}
          </GlassButton>
        </div>

        {/* Profile Header */}
        <GlassCard variant="elevated" className="mb-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <GlassAvatar initials={initials} size="xl" />
              {isEditing && (
                <button className="absolute bottom-0 right-0 p-2 rounded-full bg-koppar text-kalkvit hover:bg-koppar/80 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-kalkvit">{displayName}</h2>
              <p className="text-kalkvit/60">{user?.email}</p>
              <p className="text-sm text-koppar mt-1">Brotherhood Member</p>
            </div>
          </div>
        </GlassCard>

        {/* Personal Information */}
        <GlassCard variant="base" className="mb-6">
          <h3 className="font-display text-xl font-semibold text-kalkvit mb-6">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassInput
              label="Full Name"
              placeholder="Your full name"
              defaultValue={displayName}
              disabled={!isEditing}
            />
            <GlassInput
              label="Email"
              type="email"
              placeholder="your@email.com"
              defaultValue={user?.email || ''}
              disabled
            />
            <GlassInput
              label="Phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              disabled={!isEditing}
            />
            <GlassInput
              label="Location"
              placeholder="City, Country"
              disabled={!isEditing}
            />
          </div>
        </GlassCard>

        {/* Bio */}
        <GlassCard variant="base" className="mb-6">
          <h3 className="font-display text-xl font-semibold text-kalkvit mb-6">About Me</h3>
          <GlassTextarea
            label="Bio"
            placeholder="Tell the community about yourself..."
            rows={4}
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
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-kalkvit after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-koppar"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.04]">
              <div>
                <p className="text-kalkvit font-medium">Weekly Digest</p>
                <p className="text-sm text-kalkvit/50">Get a summary of community activity</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-kalkvit after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-koppar"></div>
              </label>
            </div>
          </div>
        </GlassCard>
      </div>
    </MainLayout>
  )
}
