import { useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Edit2, Trash2, X, Info, Locate, Loader2 } from 'lucide-react'
import DataTable from '../components/DataTable'
import { usePersistentList } from '../utils/store'

const MAX_SLOTS = 10
const emptyForm = { ip: '', note: '' }

function isValidIpv4(value) {
  const parts = value.trim().split('.')
  if (parts.length !== 4) return false
  return parts.every((part) => /^\d+$/.test(part) && part === String(Number(part)) && Number(part) >= 0 && Number(part) <= 255)
}

export default function WhitelistedIPs() {
  const [items, setItems] = usePersistentList('whitelistedIps')
  const [modalOpen, setModalOpen] = useState(false)
  const [editIp, setEditIp] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [feedback, setFeedback] = useState(null)
  const [detectingIp, setDetectingIp] = useState(false)
  const feedbackTimer = useRef(null)

  const notify = (type, message) => {
    setFeedback({ type, message })
    clearTimeout(feedbackTimer.current)
    feedbackTimer.current = setTimeout(() => setFeedback(null), 2200)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditIp(null)
    setForm(emptyForm)
  }

  const openAdd = () => {
    setEditIp(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (item) => {
    setEditIp(item)
    setForm({ ip: item.ip, note: item.note })
    setModalOpen(true)
  }

  const handleSave = () => {
    const ip = form.ip.trim()
    const note = form.note.trim() || 'No note provided'

    if (!isValidIpv4(ip)) {
      notify('error', 'Enter a valid IPv4 address.')
      return
    }

    const duplicate = items.some((item) => item.ip === ip && item.id !== editIp?.id)
    if (duplicate) {
      notify('error', 'That IP is already in the whitelist.')
      return
    }

    if (!editIp && items.length >= MAX_SLOTS) {
      notify('error', 'You have reached the whitelist slot limit.')
      return
    }

    const payload = {
      id: editIp?.id || Date.now(),
      ip,
      note,
      addedDate: editIp?.addedDate || new Date().toISOString().slice(0, 10),
    }

    setItems((current) => (
      editIp
        ? current.map((item) => (item.id === editIp.id ? payload : item))
        : [payload, ...current]
    ))

    notify('success', editIp ? 'Whitelisted IP updated.' : 'Whitelisted IP added.')
    closeModal()
  }

  const handleDelete = (item) => {
    if (!window.confirm(`Remove ${item.ip} from the whitelist?`)) return
    setItems((current) => current.filter((entry) => entry.id !== item.id))
    if (editIp?.id === item.id) closeModal()
    notify('success', `${item.ip} removed.`)
  }

  const fillCurrentIp = useCallback(async () => {
    setDetectingIp(true)
    try {
      const res = await fetch('/api/client-ip', { credentials: 'include' })
      const data = await res.json()
      if (data.success && data.data?.ip) {
        setForm((prev) => ({ ...prev, ip: data.data.ip }))
        notify('success', `Detected your current IP: ${data.data.ip}`)
      } else {
        notify('error', 'Unable to detect your IP. Please enter it manually.')
      }
    } catch {
      notify('error', 'Unable to detect your IP. Please enter it manually.')
    } finally {
      setDetectingIp(false)
    }
  }, [])

  return (
    <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Whitelisted IPs</h1>
          <p className="mt-1 text-sm text-gray-400">Authorize specific IP addresses for passwordless proxy access</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm"><Plus size={15} /> Add IP</button>
      </div>

      {feedback && (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${feedback.type === 'error' ? 'border-red-100 bg-red-50 text-red-600' : 'border-emerald-100 bg-emerald-50 text-emerald-700'}`}>
          {feedback.message}
        </div>
      )}

      <div className="flex items-center gap-3 rounded-2xl border border-violet-100 bg-violet-50/60 p-4">
        <Info size={16} className="flex-shrink-0 text-violet-500" />
        <p className="text-sm text-gray-600">
          You have used <span className="font-bold text-violet-600">{items.length}/{MAX_SLOTS}</span> whitelist IP slots. IPs typically take 1-3 minutes to become active after adding.
        </p>
      </div>

      <div className="card">
        <DataTable columns={['IP Address', 'Note', 'Added Date', 'Actions']} data={items}
          renderRow={(item) => (
            <tr key={item.id} className="transition-colors hover:bg-gray-50/50">
              <td className="px-4 py-3.5"><span className="text-sm font-mono text-gray-700">{item.ip}</span></td>
              <td className="px-4 py-3.5"><span className="text-sm text-gray-500">{item.note}</span></td>
              <td className="px-4 py-3.5"><span className="text-sm text-gray-400">{item.addedDate}</span></td>
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-1.5">
                  <button onClick={() => openEdit(item)} className="rounded-lg p-1.5 text-gray-400 transition-all hover:bg-violet-50 hover:text-violet-600" title="Edit" aria-label={`Edit ${item.ip}`}><Edit2 size={13} /></button>
                  <button onClick={() => handleDelete(item)} className="rounded-lg p-1.5 text-gray-400 transition-all hover:bg-red-50 hover:text-red-500" title="Delete" aria-label={`Delete ${item.ip}`}><Trash2 size={13} /></button>
                </div>
              </td>
            </tr>
          )}
        />
        {items.length === 0 && <div className="py-12 text-center text-sm text-gray-400">No IPs added yet</div>}
      </div>

      {modalOpen && createPortal(
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={closeModal}>
          <div className="w-[480px] max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-100 bg-white shadow-2xl animate-[fadeIn_0.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <h2 className="text-base font-bold text-gray-900">{editIp ? 'Edit Whitelisted IP' : 'Add Whitelisted IP'}</h2>
              <button onClick={closeModal} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600" aria-label="Close"><X size={18} /></button>
            </div>
            <div className="space-y-5 p-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">IP Address</label>
                <input type="text" value={form.ip} onChange={(e) => setForm((prev) => ({ ...prev, ip: e.target.value }))} placeholder="e.g., 203.0.113.42" className="input-field font-mono" />
                <button onClick={fillCurrentIp} disabled={detectingIp} className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-violet-600 transition-colors hover:text-violet-700 disabled:opacity-50">
                  {detectingIp ? <Loader2 size={12} className="animate-spin" /> : <Locate size={12} />}
                  {detectingIp ? 'Detecting...' : 'Use my current IP'}
                </button>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Note</label>
                <input type="text" value={form.note} onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))} placeholder="e.g., Cloud Server - New York" className="input-field" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 p-5">
              <button onClick={closeModal} className="btn-ghost text-sm">Cancel</button>
              <button onClick={handleSave} className="btn-primary text-sm">Save</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
