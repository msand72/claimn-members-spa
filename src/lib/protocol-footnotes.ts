/**
 * Footnote markers for a protocol's guides.
 *
 * An external reference — a source, a named framework — may not stand in the
 * instruction text. It is marked on the step and set below the guide in small
 * italic. At most two per protocol.
 *
 * ⚠ THE MARKER IS DERIVED, NOT STORED. If the asterisk lived in the `detail`
 * string, adding or removing one footnote would force a rewrite of every step in
 * that guide, in both locales, through a database write, for a typographic
 * detail. So `detail` carries no asterisk and neither does `note`.
 *
 * ⚠ NUMBERED PER PROTOCOL, NOT PER GUIDE. With a cap of two on a page,
 * per-guide numbering is actively wrong: two different sources sitting in two
 * different guides would both render `*` and the reader cannot tell which
 * footnote the marker points at.
 *
 * Mirrors src/lib/protocol-footnotes.ts in claimn-web. The two renderers are
 * separate codebases reading the same column, so this is a deliberate copy
 * rather than shared code — but they must agree, and a change here without the
 * matching change there means the same protocol reads differently on the
 * marketing site and in the portal.
 */

export interface NoteableItem {
  note?: string | null
}

export interface GuideFootnote {
  marker: string
  note: string
  /** Every `guideIndex:itemIndex` this note belongs to. Two steps resting on the
   *  SAME source share a marker rather than printing the source twice. */
  at: string[]
}

/** Absent, null or whitespace-only is not a note. An empty string would claim a
 *  marker and render a dangling asterisk — a promise of a source that never
 *  arrives. */
const hasNote = (item: NoteableItem | null | undefined): boolean =>
  typeof item?.note === 'string' && item.note.trim().length > 0

export interface GuideLike {
  items?: NoteableItem[] | null
}

export function protocolFootnotes(guides: readonly GuideLike[] | null | undefined) {
  const byNote = new Map<string, GuideFootnote>()
  const order: GuideFootnote[] = []
  if (Array.isArray(guides)) {
    guides.forEach((g, gi) => {
      const items: NoteableItem[] = Array.isArray(g?.items) ? g.items : []
      items.forEach((item: NoteableItem, ii: number) => {
        if (!hasNote(item)) return
        const note = (item.note as string).trim()
        let fn = byNote.get(note)
        if (!fn) {
          fn = { marker: '', note, at: [] }
          byNote.set(note, fn)
          order.push(fn)
        }
        fn.at.push(`${gi}:${ii}`)
      })
    })
  }
  order.forEach((fn, i) => {
    fn.marker = '*'.repeat(i + 1)
  })
  return {
    footnotes: order,
    markerFor: (gi: number, ii: number) =>
      order.find((f) => f.at.includes(`${gi}:${ii}`))?.marker ?? '',
    /** Only the sources this guide's own steps reference, so a guide with no
     *  marked step prints nothing beneath it. */
    forGuide: (gi: number) => order.filter((f) => f.at.some((k) => k.startsWith(`${gi}:`))),
  }
}
