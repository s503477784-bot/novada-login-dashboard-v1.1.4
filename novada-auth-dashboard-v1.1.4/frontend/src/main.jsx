import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import App from './App'
import './index.css'

const renderApp = (rootEl) => {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <ErrorBoundary>
        <BrowserRouter basename="/app">
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </React.StrictMode>,
  )
}

async function bootstrap() {
  const rootEl = document.getElementById('root')

  if (!rootEl) return

  if (window.__APP_AUTH_USER__) {
    renderApp(rootEl)
    return
  }

  rootEl.innerHTML = `
    <div style="display:flex;min-height:100vh;align-items:center;justify-content:center;background:#f4f6fb;color:#4b5563;font-family:Inter,system-ui,sans-serif;">
      <div style="padding:20px 24px;border-radius:16px;background:white;border:1px solid #e5e7eb;box-shadow:0 10px 30px rgba(15,23,42,.06);">
        Verifying your session…
      </div>
    </div>
  `

  try {
    const response = await fetch('/api/auth/verify', { credentials: 'include' })
    if (!response.ok) throw new Error('UNAUTHORIZED')

    const payload = await response.json().catch(() => ({}))
    window.__APP_AUTH_USER__ = payload?.data?.user || null
    Object.freeze(window.__APP_AUTH_USER__)
    renderApp(rootEl)
  } catch (error) {
    window.location.replace('/auth/login.html')
  }
}

bootstrap()
