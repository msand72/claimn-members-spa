/**
 * Image compression and resizing utilities
 * Ported from claimn-web for use in members-spa
 */

export interface CompressImageOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  outputType?: 'image/jpeg' | 'image/png' | 'image/webp'
}

export async function compressImage(
  file: File,
  options: CompressImageOptions = {}
): Promise<Blob> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.85,
    outputType = 'image/jpeg',
  } = options

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)

    reader.onload = (e) => {
      const img = document.createElement('img')
      img.src = e.target?.result as string

      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to compress image'))
            }
          },
          outputType,
          quality
        )
      }

      img.onerror = () => reject(new Error('Failed to load image'))
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
  })
}

export function blobToFile(blob: Blob, fileName: string, mimeType: string): File {
  return new File([blob], fileName, { type: mimeType })
}

export function validateImageFile(
  file: File,
  options: { maxSizeMB?: number; allowedTypes?: string[] } = {}
): string | null {
  const { maxSizeMB = 10, allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] } = options

  if (!file.type.startsWith('image/')) {
    return 'Please select an image file'
  }

  if (!allowedTypes.includes(file.type)) {
    return `File type ${file.type} is not supported. Please use JPG, PNG, GIF, or WebP.`
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxSizeBytes) {
    return `File size must be less than ${maxSizeMB}MB`
  }

  return null
}

const MESSAGE_IMAGE_PRESET: CompressImageOptions = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.85,
  outputType: 'image/jpeg',
}

export async function compressMessageImage(file: File): Promise<Blob> {
  return compressImage(file, MESSAGE_IMAGE_PRESET)
}
