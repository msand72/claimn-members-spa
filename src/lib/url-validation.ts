/**
 * URL validation utilities to prevent open redirects and unsafe navigation.
 */

/**
 * Returns true if the URL is a safe internal redirect (relative path starting with `/`).
 * Rejects protocol-relative URLs, absolute URLs, and URLs with `@` (credential injection).
 */
export function isSafeRedirect(url: string): boolean {
  if (!url || typeof url !== 'string') return false

  const trimmed = url.trim()

  // Must start with exactly one `/` (reject `//` protocol-relative URLs)
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return false

  // Reject if it contains a protocol
  if (/^\/.*:\/\//i.test(trimmed)) return false

  // Reject URLs with `@` — potential credential/redirect injection
  if (trimmed.includes('@')) return false

  return true
}

/**
 * Returns the URL if it passes `isSafeRedirect`, otherwise returns the fallback.
 */
export function sanitizeRedirect(url: string | null | undefined, fallback: string): string {
  if (url && isSafeRedirect(url)) return url
  return fallback
}

/** Allowed external hosts for checkout/billing redirects */
const ALLOWED_EXTERNAL_HOSTS = new Set([
  'checkout.stripe.com',
  'billing.stripe.com',
])

/**
 * Returns true if the URL is an allowed external URL (e.g. Stripe checkout).
 */
export function isAllowedExternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return false
    return ALLOWED_EXTERNAL_HOSTS.has(parsed.hostname)
  } catch {
    return false
  }
}

/**
 * Safely opens a URL in a new tab. Only allows `http:` and `https:` protocols.
 * Returns true if the URL was opened, false if it was blocked.
 */
export function safeOpenUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false

  try {
    const parsed = new URL(url, window.location.origin)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false
    window.open(parsed.href, '_blank', 'noopener,noreferrer')
    return true
  } catch {
    return false
  }
}
