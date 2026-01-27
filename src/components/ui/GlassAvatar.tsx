import { cn } from '../../lib/utils'

interface GlassAvatarProps {
  src?: string | null
  alt?: string
  initials?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
}

export function GlassAvatar({
  src,
  alt = 'Avatar',
  initials,
  size = 'md',
  className,
}: GlassAvatarProps) {
  const displayInitials = initials || alt.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold',
        'bg-gradient-to-br from-koppar to-jordbrun text-kalkvit',
        'ring-2 ring-white/10',
        sizeClasses[size],
        className
      )}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        displayInitials
      )}
    </div>
  )
}
