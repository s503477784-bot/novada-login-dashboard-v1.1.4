import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Globe, Zap, RefreshCw, FileText, HelpCircle, Star,
  ShieldCheck, Plane,
  CheckCircle, Clock, Layers, RotateCw, AlertCircle
} from 'lucide-react'
import { rotatingPlans } from '../data/mockData'

const docsLinks = [
  { label: 'Getting Started Guide', to: '/tools/generator' },
  { label: 'API Reference', to: '/tools/generator' },
  { label: 'Integration Examples', to: '/tools/generator' },
  { label: 'Country Coverage List', to: '/overview' },
  { label: 'Rate Limiting Policy', to: '/overview' },
]

const faqLinks = [
  { label: 'What is sticky session?', to: '/tools/generator' },
  { label: 'How does geo-targeting work?', to: '/tools/generator' },
  { label: 'Bandwidth calculation', to: '/overview' },
  { label: 'Refund policy', to: '/overview' },
]

export default function RotatingProxies() {
  const [tab, setTab] = useState('info')

  return (
    <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Rotating Proxies</h1>
        <p className="mt-1 text-sm text-gray-400">Residential rotating proxy pool with global coverage</p>
      </div>

      <div className="flex gap-6 border-b border-gray-100">
        {[
          { key: 'info', label: 'Information' },
          { key: 'pricing', label: 'Pricing' },
        ].map((item) => (
          <button key={item.key} onClick={() => setTab(item.key)} className={`pb-3 text-sm transition-colors ${tab === item.key ? 'tab-active' : 'tab-inactive'}`}>
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'info' ? (
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <div className="card p-6 md:p-8">
              <div className="mb-6 flex flex-col items-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-violet-200/40 bg-gradient-to-br from-violet-100 to-purple-100">
                  <RefreshCw size={24} className="text-violet-600" />
                </div>
                <h2 className="mb-2 text-xl font-bold text-gray-900">Residential Proxies</h2>
                <p className="max-w-md text-sm leading-relaxed text-gray-500">
                  Market leading <span className="font-bold text-gray-700">proxy pool of 100M+</span> for demanding web scraping tasks. Avoid blocks with human-like scraping and gather public data effectively.
                </p>
              </div>

              <div className="mb-6 flex flex-col items-center">
                <p className="mb-3 text-sm text-gray-500">
                  Starts from: <span className="text-lg font-bold text-gray-900">$4</span><span className="text-gray-400">/GB</span>
                </p>
                <button type="button" onClick={() => setTab('pricing')} className="btn-amber flex w-full max-w-sm items-center justify-center gap-2 py-3 text-sm">
                  <Zap size={15} />
                  View pricing plans
                </button>
              </div>

              <div className="mb-8 text-center">
                <p className="mb-3 text-sm font-semibold text-gray-700">Works well with these use cases</p>
                <div className="flex flex-wrap items-center justify-center gap-4 md:gap-5">
                  {[
                    { icon: ShieldCheck, label: 'Ad verification', color: 'text-emerald-500' },
                    { icon: Star, label: 'Review monitoring', color: 'text-amber-500' },
                    { icon: Plane, label: 'Travel fare aggregation', color: 'text-blue-500' },
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
                  { icon: CheckCircle, title: 'Avg. 99.95% success rate', desc: 'Forget IP bans and CAPTCHAs with a continuously rotating proxy pool.' },
                  { icon: Globe, title: 'Free geo-targeting', desc: 'Bypass geo-restrictions with country, city, state, ZIP code, coordinates or ASN targeting.' },
                  { icon: Zap, title: 'Avg. 0.6s response time', desc: 'Complete your scraping projects swiftly with a reliable infrastructure.' },
                  { icon: RotateCw, title: 'Automatic proxy rotation', desc: 'Get a different IP address with every new request.' },
                  { icon: Clock, title: '30 min sticky sessions', desc: 'Keep the same IP for up to 30 minutes by adding a parameter.' },
                  { icon: Layers, title: 'Multiple protocols', desc: 'Choose from HTTP/HTTPS/SOCKS5 protocols to run your requests.' },
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-violet-50">
                      <feature.icon size={16} className="text-violet-500" />
                    </div>
                    <div>
                      <p className="mb-0.5 text-sm font-semibold text-gray-800">{feature.title}</p>
                      <p className="text-xs leading-relaxed text-gray-400">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex items-center gap-2 border-t border-gray-100 pt-5">
                <AlertCircle size={14} className="flex-shrink-0 text-gray-400" />
                <p className="text-xs text-gray-400">
                  Ensure your target is supported before proceeding. <Link to="/tools/generator" className="font-semibold text-violet-600 hover:text-violet-700">Open setup checklist</Link>
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-800">
                <FileText size={14} className="text-gray-400" /> Documentation
              </h3>
              <div className="space-y-2">
                {docsLinks.map((item) => (
                  <Link key={item.label} to={item.to} className="block py-1 text-sm text-gray-500 transition-colors hover:text-violet-600">{item.label} →</Link>
                ))}
              </div>
            </div>
            <div className="card p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-800">
                <HelpCircle size={14} className="text-gray-400" /> FAQ
              </h3>
              <div className="space-y-2">
                {faqLinks.map((item) => (
                  <Link key={item.label} to={item.to} className="block py-1 text-sm text-gray-500 transition-colors hover:text-violet-600">{item.label} →</Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {rotatingPlans.map((plan) => (
            <div key={plan.name} className={`card card-hover relative p-6 ${plan.popular ? 'border-violet-200 ring-1 ring-violet-100' : ''}`}>
              {plan.popular && (
                <div className="absolute left-1/2 top-0 -translate-x-1/2 rounded-b-lg bg-violet-600 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  Most Popular
                </div>
              )}
              <h3 className="mt-2 text-lg font-bold text-gray-900">{plan.name}</h3>
              <div className="mb-4 mt-3">
                <span className="text-3xl font-bold text-gray-900">${plan.pricePerGb}</span>
                <span className="text-sm text-gray-400"> / GB</span>
              </div>
              {plan.monthlyBase > 0
                ? <p className="mb-3 text-xs text-gray-400">${plan.monthlyBase}/mo base · {plan.bandwidth} included</p>
                : <p className="mb-3 text-xs text-gray-400">Pay as you go · {plan.bandwidth} minimum</p>
              }
              <div className="mb-6 space-y-2">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="h-1 w-1 rounded-full bg-violet-400" />{feature}
                  </div>
                ))}
              </div>
              <Link to="/tools/generator" className={plan.popular ? 'btn-amber block w-full text-center text-sm' : 'btn-primary block w-full text-center text-sm'}>
                {plan.popular ? 'Get Started' : 'Select Plan'}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
