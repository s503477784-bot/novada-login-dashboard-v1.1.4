import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Overview from './pages/Overview'
import RotatingProxies from './pages/RotatingProxies'
import UnlimitedProxies from './pages/UnlimitedProxies'
import EndpointGenerator from './pages/EndpointGenerator'
import ProxyUsers from './pages/ProxyUsers'
import WhitelistedIPs from './pages/WhitelistedIPs'
import Billing from './pages/Billing'
import Wallet from './pages/Wallet'
import AccountSettings from './pages/Settings'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  // Close sidebar on escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSidebarOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="flex h-screen min-h-0 bg-[#f4f6fb]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:z-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="min-h-0 flex-1 overflow-y-auto bg-waves" style={{ scrollbarGutter: 'stable' }}>
          <div className="mx-auto max-w-[var(--app-shell-max-width)] px-3 pb-20 pt-3 sm:px-4 md:px-6 md:pt-6">
            <Routes>
              <Route path="/" element={<Navigate to="/overview" replace />} />
              <Route path="/overview" element={<Overview />} />
              <Route path="/products/rotating" element={<RotatingProxies />} />
              <Route path="/products/static-isp" element={<UnlimitedProxies />} />
              <Route path="/tools/generator" element={<EndpointGenerator />} />
              <Route path="/tools/users" element={<ProxyUsers />} />
              <Route path="/tools/whitelist" element={<WhitelistedIPs />} />
              <Route path="/account/billing" element={<Billing />} />
              <Route path="/account/wallet" element={<Wallet />} />
              <Route path="/account/settings" element={<AccountSettings />} />
              <Route path="*" element={
                <div className="flex flex-col items-center justify-center py-32 text-center">
                  <p className="text-6xl font-bold text-gray-200">404</p>
                  <p className="mt-3 text-sm font-semibold text-gray-500">Page not found</p>
                  <Link to="/overview" className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 transition-colors">Back to Overview</Link>
                </div>
              } />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  )
}
