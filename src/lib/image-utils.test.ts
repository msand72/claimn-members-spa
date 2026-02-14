import { describe, it, expect } from 'vitest'
import { validateImageFile, blobToFile } from './image-utils'

describe('validateImageFile', () => {
  const createFile = (name: string, type: string, sizeMB: number) =>
    new File([new ArrayBuffer(sizeMB * 1024 * 1024)], name, { type })

  it('accepts valid JPEG', () => {
    expect(validateImageFile(createFile('photo.jpg', 'image/jpeg', 1))).toBeNull()
  })

  it('accepts valid PNG', () => {
    expect(validateImageFile(createFile('photo.png', 'image/png', 1))).toBeNull()
  })

  it('accepts valid WebP', () => {
    expect(validateImageFile(createFile('photo.webp', 'image/webp', 1))).toBeNull()
  })

  it('accepts valid GIF', () => {
    expect(validateImageFile(createFile('anim.gif', 'image/gif', 1))).toBeNull()
  })

  it('rejects non-image files', () => {
    const result = validateImageFile(createFile('doc.pdf', 'application/pdf', 1))
    expect(result).toContain('image')
  })

  it('rejects unsupported image types', () => {
    const result = validateImageFile(createFile('photo.bmp', 'image/bmp', 1))
    expect(result).toContain('not supported')
  })

  it('rejects oversized files (default 10MB)', () => {
    const result = validateImageFile(createFile('huge.jpg', 'image/jpeg', 11))
    expect(result).toContain('10MB')
  })

  it('respects custom maxSizeMB', () => {
    const result = validateImageFile(createFile('big.jpg', 'image/jpeg', 3), { maxSizeMB: 2 })
    expect(result).toContain('2MB')
  })

  it('accepts files under custom maxSizeMB', () => {
    expect(validateImageFile(createFile('ok.jpg', 'image/jpeg', 1), { maxSizeMB: 2 })).toBeNull()
  })
})

describe('blobToFile', () => {
  it('creates a File with correct properties', () => {
    const blob = new Blob(['test'], { type: 'image/jpeg' })
    const file = blobToFile(blob, 'photo.jpg', 'image/jpeg')
    expect(file).toBeInstanceOf(File)
    expect(file.name).toBe('photo.jpg')
    expect(file.type).toBe('image/jpeg')
  })
})
