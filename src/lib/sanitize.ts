/**
 * Basic HTML sanitizer — strips script tags and inline event handlers.
 * Use for rendering trusted backend HTML (e.g. program descriptions from admin CMS).
 */
export function sanitizeHtml(html: string | undefined | null): string {
  if (!html) return ''
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\bon\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\bon\w+\s*=\s*'[^']*'/gi, '')
}

/**
 * Strip all HTML tags and decode common entities — produces plain text.
 * Use for card previews / line-clamped summaries where HTML rendering is undesirable.
 */
export function stripHtml(html: string | undefined | null): string {
  if (!html) return ''
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
