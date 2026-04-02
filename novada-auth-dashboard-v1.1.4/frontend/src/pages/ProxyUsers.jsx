import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Search, Eye, EyeOff, Copy, Edit2, RefreshCw, Trash2, X, Zap, Info } from 'lucide-react'
import DataTable from '../components/DataTable'
import { appProfile } from '../data/mockData'
import { copyText } from '../utils/clipboard'
import { usePersistentList } from '../utils/store'

const MAX_USERS = 10

function createStrongPassword() {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lower = 'abcdefghijklmnopqrstuvwxyz'
  const digits = '0123456789'
  const symbols = '#@$%&*!^'
  const all = upper + lower + digits + symbols
  let pwd = ''
  pwd += upper[Math.floor(Math.random() * upper.length)]
  pwd += lower[Math.floor(Math.random() * lower.length)]
  pwd += digits[Math.floor(Math.random() * digits.length)]
  pwd += symbols[Math.floor(Math.random() * symbols.length)]
  for (let i = 4; i < 12; i += 1) pwd += all[Math.floor(Math.random() * all.length)]
  return pwd.split('').sort(() => Math.random() - 0.5).join('')
}

function getTrafficLimitValue(traffic) {
  const [, limit = ''] = traffic.split('/')
  const normalized = limit.trim()
  if (!normalized || normalized.toLowerCase().includes('shared')) return ''
  if (normalized.includes('GB')) return normalized.replace('GB', '').trim()
  return normalized
}

function buildTrafficLabel(limit) {
  const cleaned = String(limit || '').trim()
  if (!cleaned) return '0 GB / Shared'
  return `0 GB / ${cleaned} GB`
}

const emptyForm = {
  usernameSuffix: '',
  password: '',
  note: '',
  trafficLimit: '',
}

export default function ProxyUsers() {
  const [users, setUsers] = usePersistentList('proxyUsers')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showPasswords, setShowPasswords] = useState({})
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [feedback, setFeedback] = useState(null)

  const notify = (type, message) => {
    setFeedback({ type, message })
    window.clearTimeout(window.__proxyUsersFeedbackTimer)
    window.__proxyUsersFeedbackTimer = window.setTimeout(() => setFeedback(null), 2200)
  }

  const filtered = useMemo(() => users.filter((user) => {
    const query = search.trim().toLowerCase()
    const matchSearch = !query
      || user.username.toLowerCase().includes(query)
      || user.note.toLowerCase().includes(query)
    const matchStatus = statusFilter === 'all' || user.status === statusFilter
    return matchSearch && matchStatus
  }), [users, search, statusFilter])

  const togglePassword = (id) => setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }))

  const closeDrawer = () => {
    setDrawerOpen(false)
    setEditUser(null)
    setForm(emptyForm)
  }

  const openCreate = () => {
    setEditUser(null)
    setForm({ ...emptyForm, password: createStrongPassword() })
    setDrawerOpen(true)
  }

  const openEdit = (user) => {
    const prefix = appProfile.defaultUserPrefix
    const suffix = user.username.startsWith(prefix) ? user.username.slice(prefix.length) : user.username
    setEditUser(user)
    setForm({
      usernameSuffix: suffix,
      password: user.password,
      note: user.note,
      trafficLimit: getTrafficLimitValue(user.traffic),
    })
    setDrawerOpen(true)
  }

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  const handleCopy = async (value, label) => {
    const ok = await copyText(value)
    notify(ok ? 'success' : 'error', ok ? `${label} copied.` : `Could not copy ${label.toLowerCase()}.`)
  }

  const handleRegenerate = (user) => {
    const nextPassword = createStrongPassword()
    setUsers((current) => current.map((item) => (
      item.id === user.id ? { ...item, password: nextPassword } : item
    )))
    if (editUser?.id === user.id) {
      setForm((prev) => ({ ...prev, password: nextPassword }))
    }
    notify('success', `Password regenerated for ${user.username}.`)
  }

  const handleDelete = (user) => {
    setUsers((current) => current.filter((item) => item.id !== user.id))
    if (editUser?.id === user.id) closeDrawer()
    notify('success', `${user.username} deleted.`)
  }

  const handleSave = () => {
    const suffix = form.usernameSuffix.trim().replace(/\s+/g, '_')
    const password = form.password.trim()
    const note = form.note.trim()

    if (!suffix) {
      notify('error', 'Username suffix is required.')
      return
    }

    if (!password || password.length < 8) {
      notify('error', 'Password must be at least 8 characters.')
      return
    }

    if (!editUser && users.length >= MAX_USERS) {
      notify('error', 'You have reached the user slot limit.')
      return
    }

    const username = `${appProfile.defaultUserPrefix}${suffix}`
    const usernameTaken = users.some((item) => item.username === username && item.id !== editUser?.id)

    if (usernameTaken) {
      notify('error', 'That username already exists.')
      return
    }

    const payload = {
      id: editUser?.id || Date.now(),
      username,
      password,
      status: editUser?.status || 'active',
      note: note || 'No note provided',
      traffic: buildTrafficLabel(form.trafficLimit),
    }

    setUsers((current) => (
      editUser
        ? current.map((item) => (item.id === editUser.id ? payload : item))
        : [payload, ...current]
    ))

    notify('success', editUser ? 'User updated.' : 'User created.')
    closeDrawer()
  }

  return (
    <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-400">Manage your proxy authentication sub-accounts and passwords</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm"><Plus size={15} /> Create User</button>
      </div>

      {feedback && (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${feedback.type === 'error' ? 'border-red-100 bg-red-50 text-red-600' : 'border-emerald-100 bg-emerald-50 text-emerald-700'}`}>
          {feedback.message}
        </div>
      )}

      <div className="flex items-center gap-3 rounded-2xl border border-violet-100 bg-violet-50/60 p-4">
        <Info size={16} className="flex-shrink-0 text-violet-500" />
        <p className="text-sm text-gray-600">
          You have used <span className="font-bold text-violet-600">{users.length}/{MAX_USERS}</span> user slots. New users are available immediately after creation.
        </p>
      </div>

      <div className="card">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 md:flex-row md:items-center">
          <div className="relative flex-1 md:max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search by username or note..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-9 text-sm" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field w-full text-sm md:w-36">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
        <DataTable columns={['Username', 'Password', 'Status', 'Note', 'Traffic', 'Actions']} data={filtered}
          renderRow={(user) => (
            <tr key={user.id} className="transition-colors hover:bg-gray-50/50">
              <td className="px-4 py-3.5"><span className="text-sm font-mono text-gray-700">{user.username}</span></td>
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-gray-500">{showPasswords[user.id] ? user.password : '••••••••••••'}</span>
                  <button onClick={() => togglePassword(user.id)} className="p-1 text-gray-400 transition-colors hover:text-gray-600" aria-label="Toggle password visibility">
                    {showPasswords[user.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                  <button onClick={() => handleCopy(user.password, 'Password')} className="p-1 text-gray-400 transition-colors hover:text-gray-600" aria-label="Copy password"><Copy size={13} /></button>
                </div>
              </td>
              <td className="px-4 py-3.5">
                <span className={user.status === 'active' ? 'badge-active' : 'badge-disabled'}>
                  <span className={`h-1.5 w-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                  {user.status === 'active' ? 'Active' : 'Disabled'}
                </span>
              </td>
              <td className="px-4 py-3.5"><span className="text-sm text-gray-500">{user.note}</span></td>
              <td className="px-4 py-3.5"><span className="text-sm font-mono text-gray-500">{user.traffic}</span></td>
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-1.5">
                  <button onClick={() => openEdit(user)} className="rounded-lg p-1.5 text-gray-400 transition-all hover:bg-violet-50 hover:text-violet-600" title="Edit" aria-label={`Edit ${user.username}`}><Edit2 size={13} /></button>
                  <button onClick={() => handleRegenerate(user)} className="rounded-lg p-1.5 text-gray-400 transition-all hover:bg-amber-50 hover:text-amber-500" title="Regenerate" aria-label={`Regenerate password for ${user.username}`}><RefreshCw size={13} /></button>
                  <button onClick={() => handleDelete(user)} className="rounded-lg p-1.5 text-gray-400 transition-all hover:bg-red-50 hover:text-red-500" title="Delete" aria-label={`Delete ${user.username}`}><Trash2 size={13} /></button>
                </div>
              </td>
            </tr>
          )}
        />
        {filtered.length === 0 && <div className="py-12 text-center text-sm text-gray-400">No users found</div>}
      </div>

      {drawerOpen && createPortal(
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={closeDrawer}>
          <div className="w-[480px] max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-100 bg-white shadow-2xl animate-[fadeIn_0.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <h2 className="text-base font-bold text-gray-900">{editUser ? 'Edit User' : 'Create User'}</h2>
              <button onClick={closeDrawer} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600" aria-label="Close"><X size={18} /></button>
            </div>
            <div className="space-y-5 p-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Username</label>
                <div className="flex">
                  <span className="rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 px-3 py-2.5 text-xs font-mono text-gray-400">{appProfile.defaultUserPrefix}</span>
                  <input type="text" value={form.usernameSuffix} onChange={(e) => handleChange('usernameSuffix', e.target.value)} placeholder="suffix" className="input-field flex-1 rounded-l-none font-mono" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
                <div className="flex gap-2">
                  <input type="text" value={form.password} onChange={(e) => handleChange('password', e.target.value)} placeholder="Enter password" className="input-field flex-1 font-mono" />
                  <button onClick={() => handleChange('password', createStrongPassword())} className="btn-ghost flex items-center gap-1 whitespace-nowrap border border-gray-200 text-xs"><Zap size={12} /> Generate</button>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Note / Tag</label>
                <input type="text" value={form.note} onChange={(e) => handleChange('note', e.target.value)} placeholder="e.g., Web Scraper Server A" className="input-field" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Traffic Limit (GB)</label>
                <input type="number" value={form.trafficLimit} onChange={(e) => handleChange('trafficLimit', e.target.value)} min={0} placeholder="Leave empty for shared quota" className="input-field" />
                <p className="mt-1 text-xs text-gray-400">Optional. Leave blank to inherit the shared parent quota.</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 p-5">
              <button onClick={closeDrawer} className="btn-ghost text-sm">Cancel</button>
              <button onClick={handleSave} className="btn-primary text-sm">Save</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
