import { describe, it, expect } from 'vitest'
import { protocolFootnotes } from './protocol-footnotes'

describe('protocolFootnotes', () => {
  const guides = [
    { items: [{ note: 'The Gottman Institute' }, {}, { note: 'The Gottman Institute' }] },
    { items: [{}, { note: 'ZERO TO THREE' }] },
    { items: [{ note: 'The Gottman Institute' }] },
  ]

  it('gives one marker per DISTINCT source, however many guides it spans', () => {
    const f = protocolFootnotes(guides)
    expect(f.footnotes.map((x) => [x.marker, x.note])).toEqual([
      ['*', 'The Gottman Institute'],
      ['**', 'ZERO TO THREE'],
    ])
  })

  it('does not restart at * in each guide', () => {
    // Two different sources in two different guides must not both be `*`.
    const f = protocolFootnotes(guides)
    expect(f.markerFor(0, 0)).toBe('*')
    expect(f.markerFor(1, 1)).toBe('**')
    expect(f.markerFor(2, 0)).toBe('*')
  })

  it('returns no marker for an unnoted step', () => {
    const f = protocolFootnotes(guides)
    expect(f.markerFor(0, 1)).toBe('')
    expect(f.markerFor(9, 9)).toBe('')
  })

  it('prints under a guide only the sources that guide cites', () => {
    const f = protocolFootnotes(guides)
    expect(f.forGuide(0).map((x) => x.marker)).toEqual(['*'])
    expect(f.forGuide(1).map((x) => x.marker)).toEqual(['**'])
  })

  it('ignores an empty or whitespace note rather than claiming a marker', () => {
    expect(protocolFootnotes([{ items: [{ note: '' }, { note: '   ' }] }]).footnotes).toEqual([])
  })

  it('survives missing guides and malformed items rather than throwing', () => {
    expect(protocolFootnotes(null).footnotes).toEqual([])
    expect(protocolFootnotes([{ items: null }, {}]).footnotes).toEqual([])
  })
})
