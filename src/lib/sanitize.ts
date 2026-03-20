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
