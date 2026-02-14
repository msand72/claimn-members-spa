import { type ReactElement, type ReactNode } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

interface WrapperOptions {
  initialEntries?: string[]
}

function createWrapper(options: WrapperOptions = {}) {
  const queryClient = createTestQueryClient()

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={options.initialEntries || ['/']}>
          {children}
        </MemoryRouter>
      </QueryClientProvider>
    )
  }
}

/**
 * Custom render function that wraps components with providers needed for testing.
 * Includes: QueryClientProvider, MemoryRouter
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & WrapperOptions,
) {
  const { initialEntries, ...renderOptions } = options || {}
  return render(ui, {
    wrapper: createWrapper({ initialEntries }),
    ...renderOptions,
  })
}

/**
 * Create a wrapper for testing hooks with renderHook.
 * Returns a fresh QueryClient for each hook test.
 */
export function createHookWrapper(options: WrapperOptions = {}) {
  return createWrapper(options)
}

export { createTestQueryClient }
