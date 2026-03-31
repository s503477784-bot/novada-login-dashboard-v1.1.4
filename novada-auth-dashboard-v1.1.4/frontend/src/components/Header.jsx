import { useLocation } from 'react-router-dom'
import { Bell, Mail, Menu } from 'lucide-react'
import { sessionProfile } from '../utils/session'

const routeMap = {
  '/overview': ['Dashboard', 'Overview'],
  '/products/rotating': ['Dashboard', 'Products', 'Rotating Proxies'],
  '/products/static-isp': ['Dashboard', 'Products', 'Static ISP Proxies'],
  '/tools/generator': ['Dashboard', 'Tools', 'Endpoint Generator'],
  '/tools/users': ['Dashboard', 'Tools', 'Users'],
  '/tools/whitelist': ['Dashboard', 'Tools', 'Whitelist'],
}

export default function Header({ onMenuToggle }) {
  const location = useLocation()
  const crumbs = routeMap[location.pathname] || ['Dashboard']

  return (
    <header className="flex h-14 md:h-16 flex-shrink-0 items-center justify-between border-b border-gray-100 bg-white/80 px-3 backdrop-blur-md sm:px-4 md:px-6">
      <div className="flex items-center gap-2 md:gap-3">
        {/* Mobile menu button */}
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

        <button type="button" className="hidden items-center gap-2 rounded-xl px-3 py-1.5 transition-colors hover:bg-gray-50 sm:flex">
          <Mail size={15} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-600 max-w-[180px] truncate" title={sessionProfile.email}>{sessionProfile.email}</span>
        </button>
      </div>
    </header>
  )
}
