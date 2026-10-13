import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { initApiClient } from './lib/api'
import { useUIStore } from './store/uiStore'
import './index.css'

// Connect API client to Zustand store for token attachment and toast alerts
initApiClient(
  () => useUIStore.getState().accessToken,
  (msg, variant) => useUIStore.getState().showToast(msg, variant)
)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
)
