import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { App as AntApp, ConfigProvider } from 'antd'
import ruRU from 'antd/locale/ru_RU'
import { App } from './App'
import { AuthProvider } from './app/auth/AuthProvider'
import { crossfitBuddyTheme } from './app/designSystem'
import './styles.css'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={ruRU} theme={crossfitBuddyTheme}>
        <AntApp>
          <AuthProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </AuthProvider>
        </AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  </StrictMode>,
)
