import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Design tokens as TypeScript constants
export const colors = {
  charcoal: '#1C1C1E',
  jordbrun: '#5E503F',
  sandbeige: '#E5D9C7',
  oliv: '#3A4A42',
  dimblag: '#A1B1C6',
  koppar: '#B87333',
  kalkvit: '#F9F7F4',
  tegelrod: '#B54A46',
  brandAmber: '#CC8B3C',
  skogsgron: '#6B8E6F',
  glassDark: '#0A0A0B',
} as const

export type ColorKey = keyof typeof colors
