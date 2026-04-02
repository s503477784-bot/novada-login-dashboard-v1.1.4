import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  User, Lock, Mail, Bell, Shield, X, Clock, Check, AlertTriangle, Save
} from 'lucide-react'
import { sessionProfile } from '../utils/session'
import { usePersistentList } from '../utils/store'

const formatDate = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${checked ? 'bg-violet-600' : 'bg-gray-200'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

export default function Settings() {
  const [settings, setSettings] = usePersistentList('accountSettings')
  const [passwordModal, setPasswordModal] = useState(false)
  const [emailModal, setEmailModal] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [feedback, setFeedback] = useState(null)
  const feedbackTimer = useRef(null)

  useEffect(() => {
    return () => clearTimeout(feedbackTimer.current)
  }, [])

  const notify = (type, message) => {
    clearTimeout(feedbackTimer.current)
    setFeedback({ type, message })
    feedbackTimer.current = setTimeout(() => setFeedback(null), 3000)
  }

  const handleRequestPasswordChange = () => {
    setSettings((prev) => ({
      ...prev,
      pendingPasswordChange: { requestedAt: new Date().toISOString() },
    }))
    setPasswordModal(false)
    notify('success', 'Password change request submitted. Awaiting admin approval.')
  }

  const handleCancelPasswordRequest = () => {
    setSettings((prev) => ({ ...prev, pendingPasswordChange: null }))
    notify('success', 'Password change request cancelled.')
  }

  const handleRequestEmailChange = () => {
    const trimmed = newEmail.trim()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) {
      setEmailError('Please enter a valid email address.')
      return
    }
    if (trimmed.toLowerCase() === (sessionProfile.email || '').toLowerCase()) {
      setEmailError('New email must be different from your current email.')
      return
    }
    setSettings((prev) => ({
      ...prev,
      pendingEmailChange: { requestedAt: new Date().toISOString(), newEmail: trimmed },
    }))
    setEmailModal(false)
    setNewEmail('')
    setEmailError('')
    notify('success', 'Email change request submitted. Awaiting admin approval.')
  }

  const handleCancelEmailRequest = () => {
    setSettings((prev) => ({ ...prev, pendingEmailChange: null }))
    notify('success', 'Email change request cancelled.')
  }

  const handleNotificationEmailChange = (value) => {
    setSettings((prev) => ({ ...prev, notificationEmail: value }))
  }

  const handleToggle = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value },
    }))
  }

  const handleSaveNotifications = () => {
    notify('success', 'Notification preferences saved.')
  }

  return (
    <div className="space-y-6 animate-[slideUp_0.5s_ease-out]">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Account Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Update your profile, manage security requests, and customize notifications.</p>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium animate-[fadeIn_0.2s_ease-out] ${
          feedback.type === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-red-200 bg-red-50 text-red-700'
        }`}>
          {feedback.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
          {feedback.message}
        </div>
      )}

      {/* Profile card */}
      <div className="card p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-5">
          <User size={18} className="text-violet-600" />
          <h2 className="text-sm font-bold text-gray-900">Profile</h2>
        </div>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100">
            <span className="text-xl font-bold text-violet-600">{sessionProfile.initials}</span>
          </div>
          <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Display Name</p>
              <p className="mt-0.5 text-sm font-semibold text-gray-800">{sessionProfile.displayName}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Login Email</p>
              <p className="mt-0.5 text-sm font-semibold text-gray-800 break-all">{sessionProfile.email}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Plan</p>
              <p className="mt-0.5 text-sm font-semibold text-gray-800">{sessionProfile.plan}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Security — Password */}
      <div className="card p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-5">
          <Lock size={18} className="text-violet-600" />
          <h2 className="text-sm font-bold text-gray-900">Password</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Password changes require administrator approval. Once approved, a reset link will be sent to your email.
        </p>
        {settings.pendingPasswordChange ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-2">
              <Clock size={16} className="mt-0.5 flex-shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Awaiting Admin Approval</p>
                <p className="text-xs text-amber-600">Requested on {formatDate(settings.pendingPasswordChange.requestedAt)}</p>
              </div>
            </div>
            <button onClick={handleCancelPasswordRequest} className="self-start rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-white hover:text-gray-800">
              Cancel Request
            </button>
          </div>
        ) : (
          <button onClick={() => setPasswordModal(true)} className="btn-primary text-sm">
            Request Password Change
          </button>
        )}
      </div>

      {/* Security — Email */}
      <div className="card p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-5">
          <Mail size={18} className="text-violet-600" />
          <h2 className="text-sm font-bold text-gray-900">Login Email</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Changing your login email requires administrator approval. A verification link will be sent to both the old and new addresses.
        </p>
        {settings.pendingEmailChange ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-2">
              <Clock size={16} className="mt-0.5 flex-shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Awaiting Admin Approval</p>
                <p className="text-xs text-amber-600 break-all">
                  {sessionProfile.email} &rarr; {settings.pendingEmailChange.newEmail}
                </p>
                <p className="text-xs text-amber-600">Requested on {formatDate(settings.pendingEmailChange.requestedAt)}</p>
              </div>
            </div>
            <button onClick={handleCancelEmailRequest} className="self-start rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-white hover:text-gray-800">
              Cancel Request
            </button>
          </div>
        ) : (
          <button onClick={() => { setEmailModal(true); setNewEmail(''); setEmailError('') }} className="btn-primary text-sm">
            Request Email Change
          </button>
        )}
      </div>

      {/* Notifications */}
      <div className="card p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-5">
          <Bell size={18} className="text-violet-600" />
          <h2 className="text-sm font-bold text-gray-900">Notifications</h2>
        </div>

        <div className="space-y-5">
          <div>
            <label htmlFor="notification-email" className="mb-1.5 block text-sm font-medium text-gray-700">Notification Email</label>
            <input
              id="notification-email"
              type="email"
              value={settings.notificationEmail}
              onChange={(e) => handleNotificationEmailChange(e.target.value)}
              placeholder="Leave blank to use your login email"
              className="input-field max-w-md"
            />
            <p className="mt-1 text-xs text-gray-400">Receive notifications at a different address than your login email.</p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Email Notifications</p>
            <div className="space-y-3">
              {[
                { key: 'billing', label: 'Billing & Payments', desc: 'Payment confirmations, invoice reminders, and balance notifications' },
                { key: 'security', label: 'Security Alerts', desc: 'Login attempts, password changes, and unusual activity warnings' },
                { key: 'updates', label: 'Product Updates', desc: 'New features, maintenance windows, and service announcements' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between rounded-xl border border-gray-100 p-3 sm:p-4">
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                  <Toggle
                    checked={settings.notifications?.[item.key] ?? false}
                    onChange={(val) => handleToggle(item.key, val)}
                    label={`Toggle ${item.label}`}
                  />
                </div>
              ))}
            </div>
          </div>

          <button onClick={handleSaveNotifications} className="btn-primary flex items-center gap-1.5 text-sm">
            <Save size={14} />
            Save Preferences
          </button>
        </div>
      </div>

      {/* Password change confirmation modal */}
      {passwordModal && createPortal(
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setPasswordModal(false)}>
          <div className="w-[440px] max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-100 bg-white shadow-2xl animate-[fadeIn_0.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <h2 className="text-base font-bold text-gray-900">Request Password Change</h2>
              <button onClick={() => setPasswordModal(false)} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <Shield size={18} className="mt-0.5 flex-shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Admin Approval Required</p>
                  <p className="mt-1 text-xs text-amber-700">
                    Your request will be reviewed by an administrator. Once approved, a password reset link will be sent to <strong>{sessionProfile.email}</strong>.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 p-5">
              <button onClick={() => setPasswordModal(false)} className="btn-ghost text-sm">Cancel</button>
              <button onClick={handleRequestPasswordChange} className="btn-primary text-sm">Submit Request</button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* Email change modal */}
      {emailModal && createPortal(
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setEmailModal(false)}>
          <div className="w-[440px] max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-100 bg-white shadow-2xl animate-[fadeIn_0.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <h2 className="text-base font-bold text-gray-900">Request Email Change</h2>
              <button onClick={() => setEmailModal(false)} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <Shield size={18} className="mt-0.5 flex-shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Admin Approval Required</p>
                  <p className="mt-1 text-xs text-amber-700">
                    After approval, a verification link will be sent to your new email address.
                  </p>
                </div>
              </div>
              <div>
                <label htmlFor="current-email" className="mb-1.5 block text-sm font-medium text-gray-700">Current Email</label>
                <input id="current-email" type="email" value={sessionProfile.email} disabled className="input-field !bg-gray-100 !text-gray-500 cursor-not-allowed" />
              </div>
              <div>
                <label htmlFor="new-email" className="mb-1.5 block text-sm font-medium text-gray-700">New Email</label>
                <input
                  id="new-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => { setNewEmail(e.target.value); setEmailError('') }}
                  placeholder="Enter your new email address"
                  className="input-field"
                  autoFocus
                />
                {emailError && <p className="mt-1 text-xs text-red-500">{emailError}</p>}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 p-5">
              <button onClick={() => setEmailModal(false)} className="btn-ghost text-sm">Cancel</button>
              <button onClick={handleRequestEmailChange} className="btn-primary text-sm">Submit Request</button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
