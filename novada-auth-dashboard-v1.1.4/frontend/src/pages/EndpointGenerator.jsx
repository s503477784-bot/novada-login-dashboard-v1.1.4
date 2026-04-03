import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Copy, Download, Check, Wand2, ShieldCheck, MapPin, Clock3, ExternalLink, Info, SlidersHorizontal } from 'lucide-react'
import { authUsers, defaultGeneratorPassword } from '../data/mockData'
import { copyText } from '../utils/clipboard'
import { usePersistentList } from '../utils/store'


const rotatingRegions = [
  {
    value: 'global',
    label: 'Global Pool',
    helper: 'Shared global residential pool',
    host: 'gate.novada.io',
    port: 7777,
    countryCodes: ['US', 'GB', 'DE', 'JP'],
  },
  {
    value: 'us-resi',
    label: 'Residential Pool · US',
    helper: 'General US residential traffic',
    host: 'us-resi.novada.io',
    port: 7701,
    countryCodes: ['US'],
  },
  {
    value: 'asn-7922',
    label: 'ASN 7922 · Comcast',
    helper: 'US ASN targeting',
    host: 'asn-7922.novada.io',
    port: 7788,
    countryCodes: ['US'],
  },
  {
    value: 'eu-mix',
    label: 'EU Mix Pool',
    helper: 'Balanced EU residential traffic',
    host: 'eu.novada.io',
    port: 7710,
    countryCodes: ['GB', 'DE'],
  },
]

const locationCatalog = {
  US: {
    name: 'United States',
    states: [
      { code: 'CA', name: 'California', cities: ['Los Angeles', 'San Francisco', 'San Diego'] },
      { code: 'NY', name: 'New York', cities: ['New York City', 'Buffalo', 'Albany'] },
      { code: 'TX', name: 'Texas', cities: ['Dallas', 'Austin', 'Houston'] },
    ],
  },
  GB: {
    name: 'United Kingdom',
    states: [
      { code: 'ENG', name: 'England', cities: ['London', 'Manchester', 'Birmingham'] },
      { code: 'SCT', name: 'Scotland', cities: ['Glasgow', 'Edinburgh'] },
    ],
  },
  DE: {
    name: 'Germany',
    states: [
      { code: 'BE', name: 'Berlin', cities: ['Berlin'] },
      { code: 'BY', name: 'Bavaria', cities: ['Munich', 'Nuremberg'] },
    ],
  },
  JP: {
    name: 'Japan',
    states: [
      { code: '13', name: 'Tokyo', cities: ['Shinjuku', 'Shibuya', 'Minato'] },
      { code: '27', name: 'Osaka', cities: ['Osaka', 'Sakai'] },
    ],
  },
}

const outputFormats = [
  { value: 'ip:port:user:pass', label: 'IP:Port:User:Pass' },
  { value: 'user:pass@ip:port', label: 'User:Pass@IP:Port' },
  { value: 'ip:port', label: 'IP:Port only' },
]

function formatEndpoint({ host, port, user, pass }, format) {
  if (format === 'user:pass@ip:port') return `${user}:${pass}@${host}:${port}`
  if (format === 'ip:port') return `${host}:${port}`
  return `${host}:${port}:${user}:${pass}`
}

function buildSessionUsername(baseUser, sessionMode, stickyMin, rotateOnFailure, seed) {
  if (sessionMode !== 'sticky') return baseUser
  const rotateFlag = rotateOnFailure ? '-autoreplace' : ''
  return `${baseUser}-session-${seed}-time-${stickyMin}${rotateFlag}`
}

function buildRotatingPreview({
  selectedRegion,
  authType,
  username,
  password,
  country,
  stateCode,
  city,
  sessionMode,
  stickyMin,
  rotateOnFailure,
  quantity,
  outputFormat,
}) {
  const host = selectedRegion.host
  const port = selectedRegion.port
  const seedBase = Math.random().toString(36).slice(2, 8)
  const effectiveUser = buildSessionUsername(username, sessionMode, stickyMin, rotateOnFailure, seedBase)

  const authSegment = authType === 'user'
    ? `-U "${effectiveUser}:${password}" \\\n`
    : '# Authenticated by your whitelisted IP \n'

  const stickyLines = sessionMode === 'sticky'
    ? `  -H "X-Sticky-Minutes: ${stickyMin}" \\\n  -H "X-IP-Rotate-On-Fail: ${rotateOnFailure ? 'true' : 'false'}" \\\n`
    : ''

  const curlCommand = `curl -x ${host}:${port} \\\n  ${authSegment}  -k "https://httpbin.org/ip" \\\n  -H "X-Proxy-Country: ${country.toLowerCase()}" \\\n  -H "X-Proxy-State: ${stateCode.toLowerCase()}" \\\n  -H "X-Proxy-City: ${city.toLowerCase().replace(/\s+/g, '-')}" \\\n${stickyLines}  -H "X-Proxy-Region: ${selectedRegion.value}"`

  const endpoints = Array.from({ length: quantity }, (_, index) => {
    const suffix = Math.random().toString(36).slice(2, 6)
    const indexedUser = buildSessionUsername(username, sessionMode, stickyMin, rotateOnFailure, `${seedBase}${suffix}`)
    return formatEndpoint(
      {
        host,
        port: port + (index % 5),
        user: indexedUser,
        pass: password,
      },
      outputFormat,
    )
  })

  return {
    curlCommand,
    endpoints,
  }
}

export default function EndpointGenerator() {
  const [whitelistedIps] = usePersistentList('whitelistedIps')
  const [authType, setAuthType] = useState('user')
  const [username, setUsername] = useState(authUsers[0])
  const [password] = useState(defaultGeneratorPassword)
  const [region, setRegion] = useState(rotatingRegions[0].value)
  const [country, setCountry] = useState('US')
  const [stateCode, setStateCode] = useState('CA')
  const [city, setCity] = useState('Los Angeles')
  const [sessionMode, setSessionMode] = useState('rotating')
  const [stickyMin, setStickyMin] = useState(10)
  const rotateOnFailure = true
  const [quantity, setQuantity] = useState(10)
  const [outputFormat, setOutputFormat] = useState('ip:port:user:pass')
  const [generated, setGenerated] = useState({
    curlCommand: '',
    endpoints: [],
  })
  const [copied, setCopied] = useState(null)
  const [notice, setNotice] = useState(null)
  const noticeTimer = useRef(null)
  const copiedTimer = useRef(null)

  useEffect(() => () => {
    clearTimeout(noticeTimer.current)
    clearTimeout(copiedTimer.current)
  }, [])

  const selectedRegion = useMemo(
    () => rotatingRegions.find((item) => item.value === region) || rotatingRegions[0],
    [region],
  )

  const availableCountries = useMemo(
    () => selectedRegion.countryCodes.map((code) => ({ code, name: locationCatalog[code]?.name || code })),
    [selectedRegion],
  )

  const availableStates = useMemo(
    () => locationCatalog[country]?.states || [],
    [country],
  )

  const selectedState = useMemo(
    () => availableStates.find((item) => item.code === stateCode) || availableStates[0],
    [availableStates, stateCode],
  )

  const availableCities = selectedState?.cities || []

  useEffect(() => {
    if (!availableCountries.some((item) => item.code === country)) {
      setCountry(availableCountries[0]?.code || '')
    }
  }, [availableCountries, country])

  useEffect(() => {
    if (!availableStates.some((item) => item.code === stateCode)) {
      setStateCode(availableStates[0]?.code || '')
    }
  }, [availableStates, stateCode])

  useEffect(() => {
    if (availableCities.length && !availableCities.includes(city)) {
      setCity(availableCities[0])
    }
    if (!availableCities.length && city) {
      setCity('')
    }
  }, [availableCities, city])

  const setTransientNotice = (type, message) => {
    setNotice({ type, message })
    clearTimeout(noticeTimer.current)
    noticeTimer.current = setTimeout(() => setNotice(null), 2200)
  }

  const handleCopy = async (value, key) => {
    const ok = await copyText(value)
    if (ok) {
      setCopied(key)
      clearTimeout(copiedTimer.current)
      copiedTimer.current = setTimeout(() => setCopied(null), 1500)
      setTransientNotice('success', 'Copied to clipboard.')
      return
    }

    setTransientNotice('error', 'Clipboard access is unavailable in this browser context.')
  }

  const handleDownload = () => {
    if (!generated.endpoints.length) {
      setTransientNotice('error', 'Generate endpoints before downloading.')
      return
    }

    const content = generated.endpoints.join('\n')
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'rotating-endpoints.txt'
    link.click()
    URL.revokeObjectURL(url)
    setTransientNotice('success', 'TXT file prepared for download.')
  }

  const handleGenerate = () => {
    const nextGenerated = buildRotatingPreview({
      selectedRegion,
      authType,
      username,
      password,
      country,
      stateCode,
      city,
      sessionMode,
      stickyMin,
      rotateOnFailure,
      quantity,
      outputFormat,
    })

    setGenerated(nextGenerated)
  }

  useEffect(() => {
    handleGenerate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="animate-[fadeIn_0.4s_ease-out] space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Endpoint Generator</h1>
        <p className="mt-1 text-sm text-gray-400">Configure and generate rotating proxy endpoints for quick integration.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_396px]">
        <div className="space-y-4">

          <div className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <ShieldCheck size={17} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-800">1. Authentication Method</h3>
                <p className="text-xs text-gray-400">Switch between user authentication and whitelist-based access.</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">Access Mode</p>
                <div className="space-y-2">
                  {[
                    { key: 'user', label: 'User Authentication', desc: 'Authenticate with your proxy username.' },
                    { key: 'whitelist', label: 'Whitelisted IP', desc: 'Allow requests from approved server IPs.' },
                  ].map((option) => (
                    <label key={option.key} className={`block cursor-pointer rounded-xl border p-3 transition-all ${authType === option.key ? 'border-violet-200 bg-white shadow-sm' : 'border-transparent bg-white/60 hover:border-gray-200'}`}>
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="authType"
                          value={option.key}
                          checked={authType === option.key}
                          onChange={() => setAuthType(option.key)}
                          className="mt-1 h-4 w-4 border-gray-300 text-violet-600 focus:ring-violet-200"
                        />
                        <div>
                          <p className="text-sm font-semibold text-gray-700">{option.label}</p>
                          <p className="mt-0.5 text-xs leading-relaxed text-gray-400">{option.desc}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {authType === 'user' ? (
                <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">Selected User</p>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-500">Username</label>
                    <select value={username} onChange={(e) => setUsername(e.target.value)} className="input-field">
                      {authUsers.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                    <p className="mt-1.5 text-xs text-gray-400">Select the proxy user for endpoint authentication.</p>
                  </div>
                  <Link to="/tools/users" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 transition-colors hover:text-violet-700 hover:underline">
                    <ExternalLink size={12} />
                    Manage Users
                  </Link>
                </div>
              ) : (
                <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">Selected IP</p>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-500">Whitelisted IP</label>
                    <select className="input-field font-mono" defaultValue="">
                      <option value="" disabled>Select a whitelisted IP</option>
                      {whitelistedIps.map((item) => (
                        <option key={item.id} value={item.ip}>{item.ip}</option>
                      ))}
                    </select>
                    <p className="mt-1.5 text-xs text-gray-400">No credentials required. Requests from your whitelisted IPs are authenticated automatically.</p>
                  </div>
                  <Link to="/tools/whitelist" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 transition-colors hover:text-violet-700 hover:underline">
                    <ExternalLink size={12} />
                    Manage Whitelist
                  </Link>
                </div>
              )}
            </div>

          </div>

          <div className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <MapPin size={17} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-800">2. Select Proxy Region / ASN</h3>
                <p className="text-xs text-gray-400">Configure region, country, state, and city in one place.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Proxy Region / ASN</label>
                <select value={region} onChange={(e) => setRegion(e.target.value)} className="input-field">
                  {rotatingRegions.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-gray-400">{selectedRegion.helper}</p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Country / Region</label>
                <select value={country} onChange={(e) => setCountry(e.target.value)} className="input-field">
                  {availableCountries.map((item) => (
                    <option key={item.code} value={item.code}>{item.name} ({item.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">State / Province</label>
                <select value={stateCode} onChange={(e) => setStateCode(e.target.value)} className="input-field">
                  {availableStates.map((item) => (
                    <option key={item.code} value={item.code}>{item.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">City</label>
                <select value={city} onChange={(e) => setCity(e.target.value)} className="input-field">
                  {availableCities.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Clock3 size={17} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-800">3. Session Type</h3>
                <p className="text-xs text-gray-400">Choose instant rotation or sticky sessions for longer-lived IPs.</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {[
                { key: 'rotating', label: 'Rotating Session', desc: 'Switch IPs on every new request.' },
                { key: 'sticky', label: 'Sticky Session', desc: 'Keep the same IP for a controlled duration.' },
              ].map((option) => (
                <label key={option.key} className={`cursor-pointer rounded-xl border p-4 transition-all ${sessionMode === option.key ? 'border-violet-200 bg-violet-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="sessionMode"
                      value={option.key}
                      checked={sessionMode === option.key}
                      onChange={() => setSessionMode(option.key)}
                      className="mt-1 h-4 w-4 border-gray-300 text-violet-600 focus:ring-violet-200"
                    />
                    <div>
                      <p className={`text-sm font-semibold ${sessionMode === option.key ? 'text-violet-700' : 'text-gray-700'}`}>{option.label}</p>
                      <p className="mt-0.5 text-xs text-gray-400">{option.desc}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {sessionMode === 'sticky' && (
              <div className="mt-4 space-y-3">
                <div className="max-w-xs">
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">Sticky Minutes</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={stickyMin}
                    onChange={(e) => setStickyMin(Math.min(120, Math.max(1, Number(e.target.value) || 1)))}
                    className="input-field"
                  />
                </div>
                <div className="flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3">
                  <Info size={14} className="mt-0.5 flex-shrink-0 text-amber-500" />
                  <p className="text-xs leading-relaxed text-amber-700">Sticky sessions support a maximum duration of <span className="font-bold">120 minutes</span>. If the assigned IP becomes unavailable during the session, it will be automatically rotated.</p>
                </div>
              </div>
            )}
          </div>

          <div className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <SlidersHorizontal size={17} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-800">4. Output Options</h3>
                <p className="text-xs text-gray-400">Set the number of endpoints to generate and choose the output format.</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Quantity</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.min(500, Math.max(1, Number(e.target.value) || 1)))}
                  min={1}
                  max={500}
                  className="input-field"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Format</label>
                <select value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)} className="input-field">
                  {outputFormats.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

        </div>

        <div className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          {notice && (
            <div className={`rounded-2xl border px-4 py-3 text-sm ${notice.type === 'error' ? 'border-red-100 bg-red-50 text-red-600' : 'border-emerald-100 bg-emerald-50 text-emerald-700'}`}>
              {notice.message}
            </div>
          )}

          <button onClick={handleGenerate} className="btn-primary flex w-full items-center justify-center gap-2 py-3">
            <Wand2 size={16} /> Generate Preview
          </button>

          <div className="card p-4">
            <div className="mb-3 flex items-center justify-between px-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">cURL Test</h3>
              <button onClick={() => handleCopy(generated.curlCommand, 'curl')} className="flex items-center gap-1 text-xs font-medium text-gray-400 transition-colors hover:text-violet-600">
                {copied === 'curl' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                {copied === 'curl' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="terminal-bg w-full rounded-xl p-4">
              <pre className="whitespace-pre-wrap break-all text-xs font-mono leading-relaxed text-emerald-300/80">{generated.curlCommand}</pre>
            </div>
          </div>

          <div className="card p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Endpoint List</h3>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleCopy(generated.endpoints.join('\n'), 'bulk')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50/70 px-3.5 py-2 text-xs font-medium text-violet-700 transition-colors hover:bg-violet-50"
                >
                  {copied === 'bulk' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  {copied === 'bulk' ? 'Copied' : 'Copy All'}
                </button>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                >
                  <Download size={14} /> Download TXT
                </button>
              </div>
            </div>

            <div className="terminal-bg w-full rounded-xl p-4">
              <div className="max-h-[320px] space-y-1 overflow-y-auto pr-1">
                {generated.endpoints.map((endpoint, index) => (
                  <p key={`${endpoint}-${index}`} className="whitespace-pre-wrap break-all text-[11px] font-mono leading-relaxed text-gray-300">
                    {endpoint}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
