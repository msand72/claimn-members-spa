/**
 * Detects stale-chunk / dynamic-import failures that happen after a new deploy
 * when the browser still has the old index.html cached referencing old chunk filenames.
 *
 * Covers:
 *  - Chrome:  TypeError "Failed to fetch dynamically imported module: …"
 *  - Firefox: TypeError "error loading dynamically imported module"
 *  - Safari:  TypeError with "Importing a module script failed"
 *  - Webpack: "Loading chunk … failed"  /  "Loading CSS chunk … failed"
 *  - 404 HTML returned for .js request: SyntaxError "Unexpected token '<'"
 */
export function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false

  const msg = error.message.toLowerCase()

  if (
    msg.includes('dynamically imported module') ||
    msg.includes('failed to fetch') ||
    msg.includes('loading chunk') ||
    msg.includes('loading css chunk') ||
    msg.includes('importing a module script failed')
  ) {
    return true
  }

  // When a 404 returns HTML and the browser tries to parse it as JS
  if (error instanceof SyntaxError && msg.includes('unexpected token')) {
    return true
  }

  return false
}
