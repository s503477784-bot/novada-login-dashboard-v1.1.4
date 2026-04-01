import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, RotateCw, Infinity, Terminal,
  Shield, Users, ChevronRight, X, ChevronUp, Send, Mail,
  CreditCard, Settings
} from 'lucide-react'

const navGroups = [
  {
    label: null,
    items: [
      { to: '/overview', icon: LayoutDashboard, label: 'Overview' },
    ],
  },
  {
    label: 'Products',
    items: [
      { to: '/products/rotating', icon: RotateCw, label: 'Rotating Proxies' },
      { to: '/products/static-isp', icon: Infinity, label: 'Static ISP Proxies' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { to: '/tools/generator', icon: Terminal, label: 'Endpoint Generator' },
      { to: '/tools/users', icon: Users, label: 'Users' },
      { to: '/tools/whitelist', icon: Shield, label: 'Whitelist' },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/account/billing', icon: CreditCard, label: 'Billing' },
      { to: '/account/settings', icon: Settings, label: 'Settings' },
    ],
  },
]

const accountManager = {
  name: 'Sarah Chen',
  title: 'Senior Account Manager',
  initials: 'SC',
  telegram: '@sarah_novada',
  email: 'sarah.chen@novada.io',
}

export default function Sidebar({ onClose }) {
  const [managerExpanded, setManagerExpanded] = useState(false)

  return (
    <aside className="flex h-screen w-[260px] flex-shrink-0 flex-col border-r border-gray-100 bg-white">
      <div className="flex h-14 md:h-16 items-center justify-between border-b border-gray-100 px-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 shadow-md shadow-violet-200">
            <span className="text-sm font-bold text-white">N</span>
          </div>
          <span className="font-display text-[17px] font-bold tracking-tight text-gray-900">
            Novada
          </span>
        </div>
        {/* Mobile close button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600 md:hidden"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="mb-2 px-3 text-[10.5px] font-bold uppercase tracking-[0.08em] text-gray-400">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-violet-50 text-violet-700 shadow-sm shadow-violet-100/50'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        size={18}
                        strokeWidth={isActive ? 2.2 : 1.8}
                        className={isActive ? 'text-violet-600' : 'text-gray-400 group-hover:text-gray-600'}
                      />
                      <span className="flex-1">{item.label}</span>
                      {isActive && (
                        <ChevronRight size={14} className="text-violet-400" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-gray-100 px-3 py-3">
        <button
          type="button"
          onClick={() => setManagerExpanded((prev) => !prev)}
          className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-gray-50"
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 border border-emerald-200/50">
            <span className="text-xs font-bold text-emerald-600">{accountManager.initials}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-800">{accountManager.name}</p>
            <p className="truncate text-[11px] text-gray-400">{accountManager.title}</p>
          </div>
          <ChevronUp size={14} className={`flex-shrink-0 text-gray-400 transition-transform duration-200 ${managerExpanded ? '' : 'rotate-180'}`} />
        </button>

        {managerExpanded && (
          <div className="mt-2 space-y-1.5 rounded-xl border border-gray-100 bg-gray-50/70 px-3 py-3 animate-[fadeIn_0.15s_ease-out]">
            <a
              href={`https://t.me/${accountManager.telegram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs text-gray-500 transition-colors hover:bg-white hover:text-violet-600"
            >
              <Send size={13} className="flex-shrink-0" />
              <span className="truncate">{accountManager.telegram}</span>
            </a>
            <a
              href={`mailto:${accountManager.email}`}
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs text-gray-500 transition-colors hover:bg-white hover:text-violet-600"
            >
              <Mail size={13} className="flex-shrink-0" />
              <span className="truncate">{accountManager.email}</span>
            </a>
          </div>
        )}
      </div>
    </aside>
  )
}
