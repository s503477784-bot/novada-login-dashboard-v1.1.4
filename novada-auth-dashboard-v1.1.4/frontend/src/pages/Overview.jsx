import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle, ArrowRight,
  Terminal, Shield, Code, RotateCw,
  TrendingUp, Wallet, Copy, Check,
  MessageSquare,
  BookOpen, ChevronRight,
  AlertTriangle, Bell
} from 'lucide-react'
import {
  XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, AreaChart, Area
} from 'recharts'

/* ── mini 7-day traffic data ── */
const weeklyTraffic = [
  { d: 'Mon', gb: 5.2 },
  { d: 'Tue', gb: 7.8 },
  { d: 'Wed', gb: 6.1 },
  { d: 'Thu', gb: 9.4 },
  { d: 'Fri', gb: 8.3 },
  { d: 'Sat', gb: 4.6 },
  { d: 'Sun', gb: 6.9 },
]

/* ── messages ── */
const messages = [
  { id: 1, type: 'warning', title: 'Bandwidth at 78%', desc: 'Your Rotating quota is nearing the limit. Consider upgrading to avoid interruption.', time: '2 hours ago' },
  { id: 2, type: 'info', title: 'US-West node maintenance', desc: 'Scheduled maintenance on Feb 26, 02:00–04:00 UTC. Expect brief latency spikes.', time: '5 hours ago' },
  { id: 3, type: 'success', title: 'New country added: Vietnam', desc: 'Vietnam (VN) is now available in our residential pool with city-level targeting.', time: '1 day ago' },
]

/* ── code snippets ── */
const codeSnippets = {
  cURL: `curl -x http://USER:PASS@gate.novada.io:1080 \\
     -k https://httpbin.org/ip`,
  Python: `import requests

proxies = {
    "http":  "http://USER:PASS@gate.novada.io:1080",
    "https": "http://USER:PASS@gate.novada.io:1080",
}

resp = requests.get("https://httpbin.org/ip",
                     proxies=proxies, timeout=15)
print(resp.json())`,
  'Node.js': `import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

const agent = new HttpsProxyAgent(
  'http://USER:PASS@gate.novada.io:1080'
);

const res = await fetch('https://httpbin.org/ip',
                        { agent });
console.log(await res.json());`,
}

/* ── quick start steps ── */
const steps = [
  { icon: Shield, title: 'Set up IP Whitelist', desc: 'Authorize your server IPs for direct access', to: '/tools/whitelist' },
  { icon: Terminal, title: 'Generate Endpoints', desc: 'Extract proxy list with our generator tool', to: '/tools/generator' },
  { icon: Code, title: 'Integrate your code', desc: 'Use our cURL / Python / Node.js snippets', to: '/tools/generator' },
]

/* ── tooltip ── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-lg">
      <p className="text-[11px] text-gray-400 font-medium">{label}</p>
      <p className="text-sm font-bold text-gray-900">{payload[0].value} GB</p>
    </div>
  )
}

/* ── message icon ── */
const MsgIcon = ({ type }) => {
  if (type === 'warning') return <AlertTriangle size={15} className="text-amber-500" />
  if (type === 'success') return <CheckCircle size={15} className="text-emerald-500" />
  return <Bell size={15} className="text-violet-500" />
}

/* ══════════════════ MAIN COMPONENT ══════════════════ */
export default function Overview() {
  const [codeLang, setCodeLang] = useState('cURL')
  const [copied, setCopied] = useState(false)
  const copiedTimer = useRef(null)

  useEffect(() => () => clearTimeout(copiedTimer.current), [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeSnippets[codeLang])
      setCopied(true)
      clearTimeout(copiedTimer.current)
      copiedTimer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API may be blocked in insecure contexts
    }
  }

  return (
    <div className="space-y-6">

      {/* ═══ SECTION 1 — Welcome ═══ */}
      <div className="card p-6 relative overflow-hidden animate-[fadeIn_0.4s_ease-out]">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-violet-50/80 via-transparent to-transparent" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">Welcome back</h1>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <p className="text-sm text-gray-500">All systems operational — your proxy network is running smoothly.</p>
            </div>
          </div>

          <div className="flex bg-gray-100 rounded-full p-1 gap-0.5 self-start sm:self-auto">
            <div className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold bg-white text-violet-700 shadow-sm shadow-violet-100">
              <RotateCw size={15} strokeWidth={2.3} />
              Rotating Proxies
            </div>
          </div>
        </div>
      </div>

      {/* ═══ SECTION 2 — Dashboard ═══ */}
      <div className="grid gap-5 xl:grid-cols-12">

        {/* ── LEFT: Balance + Traffic + Code (col-span-7) ── */}
        <div className="space-y-5 animate-[slideUp_0.4s_ease-out] xl:col-span-7">

          {/* Account Balance */}
          <div className="card p-6 overflow-hidden">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
                <Wallet size={18} className="text-violet-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-800">Account Balance</h2>
                <p className="text-xs text-gray-400">Current plan overview</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-10">
              {/* Balance amount */}
              <div className="flex-shrink-0">
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">Available Balance</p>
                <p className="text-4xl font-bold text-gray-900 tracking-tight">57.2<span className="text-2xl text-gray-400"> GB</span></p>
              </div>

              {/* Divider */}
              <div className="hidden sm:block w-px h-16 bg-gray-100" />

              {/* Details */}
              <div className="flex-1 space-y-3 w-full">
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                  <span className="text-xs font-medium text-gray-500">Plan Expires</span>
                  <span className="text-sm font-bold text-gray-800">Apr 12, 2026</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                  <span className="text-xs font-medium text-gray-500">Remaining Days</span>
                  <span className="text-sm font-bold text-emerald-600">30 days</span>
                </div>
                <Link to="/products/rotating" className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700 mt-1">
                  Top up balance <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>

          {/* 7-day traffic trend */}
          <div className="card p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-violet-500" />
                <h3 className="text-sm font-bold text-gray-800">7-Day Traffic Peak</h3>
              </div>
              <span className="text-[11px] font-medium text-gray-400">GB / day</span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={weeklyTraffic}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#f1f1f5" vertical={false} />
                <XAxis dataKey="d" tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="gb" stroke="#7c3aed" strokeWidth={2.5} fill="url(#areaGrad)" dot={false}
                  activeDot={{ r: 4, fill: '#7c3aed', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Code Integration */}
          <div className="card p-6 overflow-hidden animate-[slideUp_0.5s_ease-out]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Code size={16} className="text-violet-500" />
                <h3 className="text-sm font-bold text-gray-800">Code Integration</h3>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-violet-600 hover:bg-violet-50 transition-all"
              >
                {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-4">Copy ready-to-use proxy snippets for your preferred language. Replace the credentials and start routing traffic in seconds.</p>

            {/* Language tabs */}
            <div className="flex gap-1 mb-3 bg-gray-100 rounded-lg p-1 w-fit max-w-full overflow-x-auto">
              {Object.keys(codeSnippets).map((lang) => (
                <button
                  key={lang}
                  onClick={() => { setCodeLang(lang); setCopied(false) }}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    codeLang === lang
                      ? 'bg-white text-violet-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            {/* Code block — fixed height */}
            <pre className="bg-gray-900 text-gray-100 rounded-xl p-4 text-[13px] leading-relaxed overflow-auto font-mono h-[220px]">
              <code>{codeSnippets[codeLang]}</code>
            </pre>

            <p className="text-[11px] text-gray-400 mt-3">
              Replace <span className="font-mono text-violet-400">USER:PASS</span> with your proxy credentials from the{' '}
              <Link to="/tools/generator" className="text-violet-500 hover:text-violet-600 font-semibold">Endpoint Generator</Link>.
            </p>
          </div>
        </div>

        {/* ── RIGHT: Quick Start + Messages (col-span-5) ── */}
        <div className="space-y-5 animate-[slideUp_0.45s_ease-out] xl:col-span-5">

          {/* Quick Start */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={16} className="text-violet-500" />
              <h3 className="text-sm font-bold text-gray-800">Quick Start Guide</h3>
            </div>
            <div className="space-y-2">
              {steps.map((s, i) => (
                <Link key={i} to={s.to} className="group flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-violet-50">
                    <s.icon size={16} className="text-violet-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">{s.title}</p>
                    <p className="text-xs text-gray-400">{s.desc}</p>
                  </div>
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          {/* In-site Messages */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-violet-500" />
                <h3 className="text-sm font-bold text-gray-800">Notifications</h3>
              </div>
              <button className="text-xs font-semibold text-violet-600 hover:text-violet-700">View all →</button>
            </div>
            <div className="space-y-1">
              {messages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-3 p-3 rounded-xl transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    msg.type === 'warning' ? 'bg-amber-50' :
                    msg.type === 'success' ? 'bg-emerald-50' : 'bg-violet-50'
                  }`}>
                    <MsgIcon type={msg.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-700">{msg.title}</p>
                    <p className="text-xs text-gray-400 leading-relaxed mt-0.5 line-clamp-2">{msg.desc}</p>
                    <p className="text-[11px] text-gray-300 mt-1">{msg.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
