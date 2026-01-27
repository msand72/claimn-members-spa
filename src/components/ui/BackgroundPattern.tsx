import { colors } from '../../lib/utils'
import { useTheme } from '../../contexts/ThemeContext'

export function BackgroundPattern() {
  const { theme } = useTheme()
  const isLight = theme === 'light'

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Gradient orbs - more subtle in light mode */}
      <div
        className="absolute -top-[10%] right-[10%] w-[500px] h-[500px] rounded-full blur-[60px]"
        style={{
          background: `radial-gradient(circle, ${colors.koppar}${isLight ? '20' : '40'} 0%, transparent 70%)`,
        }}
      />
      <div
        className="absolute bottom-[10%] left-[5%] w-[600px] h-[600px] rounded-full blur-[80px]"
        style={{
          background: `radial-gradient(circle, ${colors.jordbrun}${isLight ? '15' : '40'} 0%, transparent 70%)`,
        }}
      />
      <div
        className="absolute top-[40%] left-[50%] w-[400px] h-[400px] rounded-full blur-[70px]"
        style={{
          background: `radial-gradient(circle, ${colors.dimblag}${isLight ? '15' : '30'} 0%, transparent 70%)`,
        }}
      />

      {/* Grid pattern - dark lines in light mode, light lines in dark mode */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: isLight
            ? 'linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px)'
            : 'linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />
    </div>
  )
}
