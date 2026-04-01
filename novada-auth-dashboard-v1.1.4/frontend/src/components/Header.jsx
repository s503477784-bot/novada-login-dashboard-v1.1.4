import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, Menu, LogOut, ArrowRightLeft, ChevronDown } from 'lucide-react'
import { sessionProfile } from '../utils/session'

const routeMap = {
  '/overview': ['Dashboard', 'Overview'],
  '/products/rotating': ['Dashboard', 'Products', 'Rotating Proxies'],
  '/products/static-isp': ['Dashboard', 'Products', 'Static ISP Proxies'],
  '/tools/generator': ['Dashboard', 'Tools', 'Endpoint Generator'],
  '/tools/users': ['Dashboard', 'Tools', 'Users'],
  '/tools/whitelist': ['Dashboard', 'Tools', 'Whitelist'],
  '/account/billing': ['Dashboard', 'Account', 'Billing'],
  '/account/settings': ['Dashboard', 'Account', 'Settings'],
}

export default function Header({ onMenuToggle }) {
  const location = useLocation()
  const crumbs = routeMap[location.pathname] || ['Dashboard']
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    const handleEscape = (e) => {
      if (e.key === 'Escape') setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const handleLogout = async () => {
    setDropdownOpen(false)
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-Requested-With': 'NovadaClient' },
      })
    } catch {
      // proceed to redirect regardless
    } finally {
      window.location.replace('/auth/login.html')
    }
  }

  const handleSwitchAccount = () => {
    setDropdownOpen(false)
    window.location.href = '/auth/login.html'
  }

  return (
    <header className="flex h-14 md:h-16 flex-shrink-0 items-center justify-between border-b border-gray-100 bg-white/80 px-3 backdrop-blur-md sm:px-4 md:px-6">
      <div className="flex items-center gap-2 md:gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          className="rounded-xl p-2 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 md:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        <nav className="flex items-center gap-1.5 text-sm">
          {crumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-gray-300">/</span>}
              <span className={`${i === crumbs.length - 1 ? 'font-semibold text-gray-800' : 'text-gray-400'} ${i < crumbs.length - 1 ? 'hidden sm:inline' : ''}`}>
                {crumb}
              </span>
            </span>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 lg:flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold text-emerald-600">Network Healthy</span>
        </div>

        <button type="button" className="relative rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-700" aria-label="Notifications">
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-violet-500 ring-2 ring-white"></span>
        </button>

        {/* User menu dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-gray-50 sm:px-3"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-100 to-purple-100">
              <span className="text-xs font-bold text-violet-600">{sessionProfile.initials}</span>
            </div>
            <span className="hidden text-sm font-medium text-gray-600 max-w-[180px] truncate sm:block" title={sessionProfile.email}>{sessionProfile.email}</span>
            <ChevronDown size={14} className={`hidden text-gray-400 transition-transform duration-200 sm:block ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-gray-100 bg-white shadow-2xl animate-[fadeIn_0.15s_ease-out] z-50">
              <div className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-purple-100">
                  <span className="text-sm font-bold text-violet-600">{sessionProfile.initials}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-800">{sessionProfile.displayName}</p>
                  <p className="truncate text-xs text-gray-400">{sessionProfile.email}</p>
                </div>
              </div>

              <div className="border-t border-gray-100" />

              <div className="p-1.5">
                <button
                  type="button"
                  onClick={handleSwitchAccount}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-800"
                >
                  <ArrowRightLeft size={16} className="text-gray-400" />
                  Switch Account
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut size={16} className="text-gray-400" />
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
