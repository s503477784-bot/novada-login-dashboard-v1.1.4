import { Link } from 'react-router-dom'
import {
  Server, Lock, Cpu, FileText, HelpCircle,
  Globe, Shield,
  CheckCircle, Layers, Clock, MessageCircle
} from 'lucide-react'

const docsLinks = [
  { label: 'Static ISP Proxy Setup', to: '/tools/generator' },
  { label: 'Port Configuration', to: '/tools/generator' },
  { label: 'cURL Examples', to: '/tools/generator' },
  { label: 'Python SDK', to: '/tools/generator' },
  { label: 'Node.js SDK', to: '/tools/generator' },
]

const faqLinks = [
  { label: 'What is a Static ISP Proxy?', to: '/overview' },
  { label: 'IP replacement policy', to: '/overview' },
  { label: 'Concurrent connection limits', to: '/overview' },
  { label: 'SLA guarantee', to: '/overview' },
]

export default function UnlimitedProxies() {
  return (
    <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Static ISP Proxies</h1>
        <p className="mt-1 text-sm text-gray-400">Real ISP-assigned static residential IPs with dedicated allocation and unlimited bandwidth</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-4">
          <div className="card p-6 md:p-8">
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-amber-200/40 bg-gradient-to-br from-amber-50 to-orange-50">
                <Server size={24} className="text-amber-500" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-gray-900">Product Overview</h2>
              <p className="max-w-md text-sm leading-relaxed text-gray-500">
                <span className="font-bold text-gray-700">Real ISP-assigned residential IPs</span> that remain static and dedicated to your account. Unlike datacenter proxies, Static ISP Proxies carry genuine ISP fingerprints, making them ideal for tasks that require both high trust scores and long-lived sessions.
              </p>
            </div>

            {/* Sales Contact Notice */}
            <div className="mb-6 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50/80 to-orange-50/50 p-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100">
                  <MessageCircle size={16} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Custom Allocation — Contact Sales</p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">
                    Each Static ISP allocation is provisioned individually based on your needs:
                  </p>
                  <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-gray-500">
                    <li className="flex items-start gap-1.5"><span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-amber-400" />Target region &amp; IP quantity</li>
                    <li className="flex items-start gap-1.5"><span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-amber-400" />Protocol &amp; use case requirements</li>
                  </ul>
                  <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
                    Reach out to your account manager or our sales team for a tailored plan.
                  </p>
                  <a href="mailto:sales@novada.io" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-amber-200 transition-all hover:bg-amber-600 hover:shadow-md">
                    <MessageCircle size={13} />
                    Contact Sales Team
                  </a>
                </div>
              </div>
            </div>

            <div className="mb-8 text-center">
              <p className="mb-3 text-sm font-semibold text-gray-700">Ideal use cases for Static ISP Proxies</p>
              <div className="flex flex-wrap items-center justify-center gap-4 md:gap-5">
                {[
                  { icon: Globe, label: 'SEO monitoring', color: 'text-emerald-500' },
                  { icon: Shield, label: 'Account management', color: 'text-amber-500' },
                  { icon: Cpu, label: 'Sneaker & ticket sites', color: 'text-blue-500' },
                ].map((useCase, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <useCase.icon size={16} className={useCase.color} />
                    <span className="text-sm text-gray-600">{useCase.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="my-6 border-t border-gray-100" />

            <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
              {[
                { icon: Lock, title: 'ISP-grade static IPs', desc: 'Real residential IPs assigned by Internet Service Providers — not datacenter ranges.' },
                { icon: Shield, title: 'High trust score', desc: 'Genuine ISP fingerprints ensure maximum compatibility with strict anti-bot systems.' },
                { icon: Cpu, title: 'Dedicated allocation', desc: 'Each IP is exclusively assigned to your account — no sharing with other users.' },
                { icon: CheckCircle, title: '99.9%+ uptime SLA', desc: 'Enterprise-grade infrastructure with guaranteed availability and proactive monitoring.' },
                { icon: Clock, title: 'Long-lived sessions', desc: 'Maintain the same IP for days or weeks — perfect for persistent identity use cases.' },
                { icon: Layers, title: 'HTTP / HTTPS / SOCKS5', desc: 'Full protocol support so you can integrate with any tool or framework.' },
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50">
                    <feature.icon size={16} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="mb-0.5 text-sm font-semibold text-gray-800">{feature.title}</p>
                    <p className="text-xs leading-relaxed text-gray-400">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-800">
              <FileText size={14} className="text-gray-400" /> Integration Guide
            </h3>
            <div className="space-y-2">
              {docsLinks.map((item) => (
                <Link key={item.label} to={item.to} className="block py-1 text-sm text-gray-500 transition-colors hover:text-amber-600">{item.label} →</Link>
              ))}
            </div>
          </div>
          <div className="card p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-800">
              <HelpCircle size={14} className="text-gray-400" /> FAQ
            </h3>
            <div className="space-y-2">
              {faqLinks.map((item) => (
                <Link key={item.label} to={item.to} className="block py-1 text-sm text-gray-500 transition-colors hover:text-amber-600">{item.label} →</Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
