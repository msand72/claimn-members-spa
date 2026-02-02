import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom'
import { AlertTriangle, FileQuestion, Home, RefreshCw } from 'lucide-react'

function isChunkLoadError(error: unknown): boolean {
  return (
    error instanceof TypeError &&
    (error.message.includes('dynamically imported module') ||
      error.message.includes('Failed to fetch') ||
      error.message.includes('Loading chunk'))
  )
}

export function RouteErrorBoundary() {
  const error = useRouteError()
  const isNotFound = isRouteErrorResponse(error) && error.status === 404
  const isChunkError = isChunkLoadError(error)

  return (
    <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center p-4">
      <div className="bg-white/[0.1] backdrop-blur-[16px] border border-white/[0.2] rounded-[20px] p-8 max-w-md w-full text-center">
        {isChunkError ? (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#B87333]/20 flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-[#B87333]" />
            </div>
            <h1 className="text-2xl font-bold text-[#F9F7F4] mb-2">
              App updated
            </h1>
            <p className="text-[#F9F7F4]/60 mb-6">
              A new version has been deployed. Please reload to continue.
            </p>
          </>
        ) : isNotFound ? (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#B87333]/20 flex items-center justify-center">
              <FileQuestion className="w-8 h-8 text-[#B87333]" />
            </div>
            <h1 className="text-2xl font-bold text-[#F9F7F4] mb-2">
              Page not found
            </h1>
            <p className="text-[#F9F7F4]/60 mb-6">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#C85A40]/20 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-[#C85A40]" />
            </div>
            <h1 className="text-2xl font-bold text-[#F9F7F4] mb-2">
              Something went wrong
            </h1>
            <p className="text-[#F9F7F4]/60 mb-6">
              {error instanceof Error
                ? error.message
                : 'An unexpected error occurred.'}
            </p>
          </>
        )}
        <div className="flex items-center justify-center gap-3">
          {isChunkError && (
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-br from-[#B87333] to-[#A66529] text-[#F9F7F4] shadow-[0_4px_20px_rgba(184,115,51,0.4)] hover:shadow-[0_6px_24px_rgba(184,115,51,0.5)] hover:-translate-y-0.5 transition-all duration-200"
            >
              <RefreshCw size={18} />
              Reload
            </button>
          )}
          <Link
            to="/"
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-br from-[#B87333] to-[#A66529] text-[#F9F7F4] shadow-[0_4px_20px_rgba(184,115,51,0.4)] hover:shadow-[0_6px_24px_rgba(184,115,51,0.5)] hover:-translate-y-0.5 transition-all duration-200"
          >
            <Home size={18} />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  )
}
