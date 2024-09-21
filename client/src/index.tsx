import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import App from '@/App'
import { ErrorProvider } from '@/utils/error'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ErrorProvider>
      <ReactQueryDevtools />
    </QueryClientProvider>
  </StrictMode>
)
