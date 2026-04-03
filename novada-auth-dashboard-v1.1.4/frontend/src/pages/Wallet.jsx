import { useState, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Wallet as WalletIcon, Plus, DollarSign, TrendingUp, Hash,
  ArrowDownLeft, ArrowUpRight, X,
  AlertTriangle, Check, Zap, CreditCard,
  RefreshCw, Calendar, Edit2, Power, PowerOff, Clock
} from 'lucide-react'
import { usePersistentList } from '../utils/store'
import { rotatingPlans } from '../data/mockData'

const formatCurrency = (n) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const formatDate = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const presetAmounts = [10, 25, 50, 100, 200, 500]

const paymentMethods = [
  { id: 'visa', label: 'Visa ••••4242', icon: CreditCard },
  { id: 'paypal', label: 'PayPal', icon: DollarSign },
  { id: 'crypto', label: 'Crypto (BTC)', icon: TrendingUp },
]

const cycleOptions = [
  { value: 'monthly', label: 'Monthly', months: 1 },
  { value: 'quarterly', label: 'Quarterly', months: 3, discount: '5% off' },
  { value: 'yearly', label: 'Yearly', months: 12, discount: '15% off' },
]

function getNextRenewalDate(fromDate, cycle) {
  const d = new Date(fromDate)
  const months = cycleOptions.find((c) => c.value === cycle)?.months || 1
  d.setMonth(d.getMonth() + months)
  return d.toISOString().split('T')[0]
}

function getCyclePrice(basePrice, cycle) {
  const opt = cycleOptions.find((c) => c.value === cycle)
  if (!opt) return basePrice
  if (cycle === 'quarterly') return +(basePrice * opt.months * 0.95).toFixed(2)
  if (cycle === 'yearly') return +(basePrice * opt.months * 0.85).toFixed(2)
  return basePrice
}

function daysUntil(dateStr) {
  const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24))
  return diff
}

export default function Wallet() {
  const [rawWallet, setWalletData] = usePersistentList('walletData')
  const walletData = {
    balance: rawWallet?.balance ?? 0,
    transactions: rawWallet?.transactions ?? [],
    subscriptions: rawWallet?.subscriptions ?? [],
  }
  const [showTopUp, setShowTopUp] = useState(false)
  const [topUpPreset, setTopUpPreset] = useState(null)
  const [customAmount, setCustomAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('visa')
  const [purchaseConfirm, setPurchaseConfirm] = useState(null)
  const [editSub, setEditSub] = useState(null)
  const [editCycle, setEditCycle] = useState('monthly')
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }

  const totalTopUps = useMemo(() =>
    walletData.transactions
      .filter((r) => r.status === 'Completed' && r.type === 'Recharge')
      .reduce((sum, r) => sum + r.amount, 0),
    [walletData.transactions],
  )

  const totalSpent = useMemo(() =>
    walletData.transactions
      .filter((r) => r.status === 'Completed' && r.type === 'Purchase')
      .reduce((sum, r) => sum + r.amount, 0),
    [walletData.transactions],
  )

  const topUpAmount = topUpPreset || parseFloat(customAmount) || 0

  const handleTopUp = () => {
    if (topUpAmount <= 0) return
    const method = paymentMethods.find((m) => m.id === paymentMethod)
    const newTx = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      type: 'Recharge',
      description: 'Wallet top-up',
      amount: topUpAmount,
      paymentMethod: method?.label || paymentMethod,
      status: 'Completed',
    }
    setWalletData((prev) => ({
      ...prev,
      balance: prev.balance + topUpAmount,
      transactions: [newTx, ...prev.transactions],
    }))
    setShowTopUp(false)
    setTopUpPreset(null)
    setCustomAmount('')
    showToast(`Successfully added ${formatCurrency(topUpAmount)} to your wallet`)
  }

  const handlePurchase = () => {
    const plan = purchaseConfirm
    if (!plan || walletData.balance < plan.monthlyBase) return
    const newTx = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      type: 'Purchase',
      description: `Rotating Proxies — ${plan.name} Plan (${plan.bandwidth})`,
      amount: plan.monthlyBase,
      paymentMethod: 'Wallet Balance',
      status: 'Completed',
    }
    const newSub = {
      id: Date.now() + 1,
      planName: plan.name,
      bandwidth: plan.bandwidth,
      price: plan.monthlyBase,
      cycle: 'monthly',
      autoRenew: true,
      nextRenewal: getNextRenewalDate(new Date().toISOString().split('T')[0], 'monthly'),
      startDate: new Date().toISOString().split('T')[0],
    }
    setWalletData((prev) => ({
      ...prev,
      balance: prev.balance - plan.monthlyBase,
      transactions: [newTx, ...prev.transactions],
      subscriptions: [newSub, ...prev.subscriptions],
    }))
    setPurchaseConfirm(null)
    showToast(`Purchased ${plan.name} plan for ${formatCurrency(plan.monthlyBase)}`)
  }

  const toggleAutoRenew = (subId) => {
    const sub = walletData.subscriptions.find((s) => s.id === subId)
    const wasEnabled = sub?.autoRenew
    setWalletData((prev) => ({
      ...prev,
      subscriptions: prev.subscriptions.map((s) =>
        s.id === subId ? { ...s, autoRenew: !s.autoRenew } : s
      ),
    }))
    showToast(wasEnabled ? 'Auto-renewal disabled' : 'Auto-renewal enabled')
  }

  const openEditSub = (sub) => {
    setEditSub(sub)
    setEditCycle(sub.cycle)
  }

  const handleSaveCycle = () => {
    if (!editSub) return
    const newNext = getNextRenewalDate(new Date().toISOString().split('T')[0], editCycle)
    setWalletData((prev) => ({
      ...prev,
      subscriptions: prev.subscriptions.map((s) =>
        s.id === editSub.id ? { ...s, cycle: editCycle, nextRenewal: newNext } : s
      ),
    }))
    setEditSub(null)
    showToast(`Renewal cycle updated to ${editCycle}`)
  }

  const handleCancelSub = (subId) => {
    setWalletData((prev) => ({
      ...prev,
      subscriptions: prev.subscriptions.filter((s) => s.id !== subId),
    }))
    setEditSub(null)
    showToast('Subscription cancelled')
  }

  const handleRenewNow = (sub) => {
    const cost = getCyclePrice(sub.price, sub.cycle)
    if (walletData.balance < cost) {
      showToast('Insufficient balance — please top up first', 'error')
      return
    }
    const newTx = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      type: 'Purchase',
      description: `Renewal — ${sub.planName} Plan (${sub.bandwidth})`,
      amount: cost,
      paymentMethod: 'Wallet Balance',
      status: 'Completed',
    }
    const newNext = getNextRenewalDate(new Date().toISOString().split('T')[0], sub.cycle)
    setWalletData((prev) => ({
      ...prev,
      balance: prev.balance - cost,
      transactions: [newTx, ...prev.transactions],
      subscriptions: prev.subscriptions.map((s) =>
        s.id === sub.id ? { ...s, nextRenewal: newNext } : s
      ),
    }))
    showToast(`Renewed ${sub.planName} plan for ${formatCurrency(cost)}`)
  }

  return (
    <div className="space-y-6 animate-[slideUp_0.5s_ease-out]">
      {/* Toast notification */}
      {toast && createPortal(
        <div className={`fixed right-4 top-4 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg animate-[fadeIn_0.2s_ease-out] ${toast.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          {toast.type === 'error' ? <AlertTriangle size={16} /> : <Check size={16} />}
          {toast.msg}
        </div>,
        document.body,
      )}

      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Wallet</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your wallet balance, top up funds, and purchase proxy plans.</p>
      </div>

      {/* Balance card */}
      <div className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100">
            <WalletIcon size={28} className="text-violet-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400">Current Balance</p>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(walletData.balance)}</p>
          </div>
        </div>
        <button onClick={() => setShowTopUp(true)} className="btn-primary flex items-center justify-center gap-2 text-sm">
          <Plus size={16} />
          Top Up
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
              <ArrowDownLeft size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400">Total Top-Ups</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(totalTopUps)}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
              <ArrowUpRight size={20} className="text-violet-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400">Total Spent</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(totalSpent)}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
              <RefreshCw size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400">Active Subscriptions</p>
              <p className="text-lg font-bold text-gray-900">{walletData.subscriptions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription management */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <RefreshCw size={16} className="text-violet-500" />
          <h2 className="text-sm font-bold text-gray-800">Subscription Renewals</h2>
          <span className="text-xs text-gray-400">Manage auto-renewal and billing cycles</span>
        </div>

        {walletData.subscriptions.length === 0 ? (
          <div className="card py-12 text-center">
            <RefreshCw size={32} className="mx-auto text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">No active subscriptions</p>
            <p className="mt-1 text-xs text-gray-400">Purchase a plan below to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {walletData.subscriptions.map((sub) => {
              const days = daysUntil(sub.nextRenewal)
              const cycleCost = getCyclePrice(sub.price, sub.cycle)
              const isUrgent = days <= 7 && days >= 0
              const isOverdue = days < 0
              return (
                <div key={sub.id} className="card p-5 transition-all">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    {/* Plan info */}
                    <div className="flex items-start gap-4">
                      <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${sub.autoRenew ? 'bg-violet-50' : 'bg-gray-100'}`}>
                        <Zap size={20} className={sub.autoRenew ? 'text-violet-600' : 'text-gray-400'} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-gray-900">{sub.planName} Plan</p>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${sub.autoRenew ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                            {sub.autoRenew ? 'Auto-Renew' : 'Manual'}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500">{sub.bandwidth} bandwidth · {formatCurrency(sub.price)}/mo base</p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} className="text-gray-400" />
                            Cycle: <span className="font-semibold capitalize text-gray-700">{sub.cycle}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign size={12} className="text-gray-400" />
                            Next charge: <span className="font-semibold text-gray-700">{formatCurrency(cycleCost)}</span>
                          </span>
                          <span className={`flex items-center gap-1 ${isUrgent ? 'text-amber-600 font-semibold' : isOverdue ? 'text-red-500 font-semibold' : ''}`}>
                            <Clock size={12} />
                            {isOverdue
                              ? `Overdue by ${Math.abs(days)} days`
                              : days === 0
                                ? 'Renews today'
                                : `Renews in ${days} days`
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleRenewNow(sub)}
                        className="flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50/70 px-3 py-2.5 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-100"
                      >
                        <RefreshCw size={13} />
                        Renew Now
                      </button>
                      <button
                        onClick={() => openEditSub(sub)}
                        className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                      >
                        <Edit2 size={13} />
                        Edit
                      </button>
                      <button
                        onClick={() => toggleAutoRenew(sub.id)}
                        className={`flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors ${sub.autoRenew ? 'border-amber-200 text-amber-600 hover:bg-amber-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}
                        title={sub.autoRenew ? 'Disable auto-renewal' : 'Enable auto-renewal'}
                      >
                        {sub.autoRenew ? <PowerOff size={13} /> : <Power size={13} />}
                        {sub.autoRenew ? 'Pause' : 'Resume'}
                      </button>
                    </div>
                  </div>

                  {/* Urgent / overdue warning */}
                  {(isUrgent || isOverdue) && sub.autoRenew && (
                    <div className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium ${isOverdue ? 'border border-red-200 bg-red-50 text-red-600' : 'border border-amber-200 bg-amber-50 text-amber-700'}`}>
                      <AlertTriangle size={13} />
                      {isOverdue
                        ? `This subscription is overdue. ${walletData.balance >= cycleCost ? 'Click "Renew Now" to restore service.' : 'Please top up your wallet to renew.'}`
                        : `Renewal coming up on ${formatDate(sub.nextRenewal)}. ${walletData.balance >= cycleCost ? 'Sufficient balance for auto-renewal.' : 'Insufficient balance — top up to avoid interruption.'}`
                      }
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick purchase */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <Zap size={16} className="text-violet-500" />
          <h2 className="text-sm font-bold text-gray-800">Purchase New Plan</h2>
          <span className="text-xs text-gray-400">— use your wallet balance to buy proxy plans</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {rotatingPlans.map((plan) => {
            const price = plan.monthlyBase
            const canAfford = walletData.balance >= price
            const isPayPerGb = price === 0
            return (
              <div key={plan.name} className={`card card-hover relative flex flex-col p-5 ${plan.popular ? 'border-violet-200 ring-1 ring-violet-100' : ''}`}>
                {plan.popular && (
                  <div className="absolute left-1/2 top-0 -translate-x-1/2 rounded-b-lg bg-violet-600 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    Popular
                  </div>
                )}
                <h3 className="mt-1 text-base font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-1">
                  {isPayPerGb ? (
                    <><span className="text-2xl font-bold text-gray-900">${plan.pricePerGb}</span><span className="text-xs text-gray-400"> / GB</span></>
                  ) : (
                    <><span className="text-2xl font-bold text-gray-900">{formatCurrency(price)}</span><span className="text-xs text-gray-400"> / mo</span></>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">{plan.bandwidth} bandwidth</p>
                <ul className="mt-3 flex-1 space-y-1.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Check size={12} className="flex-shrink-0 text-emerald-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                {isPayPerGb ? (
                  <button disabled className="btn-ghost mt-4 w-full cursor-not-allowed border border-gray-200 text-center text-xs opacity-60">
                    Pay per GB
                  </button>
                ) : (
                  <button
                    onClick={() => setPurchaseConfirm(plan)}
                    className={`mt-4 w-full text-center text-sm ${plan.popular ? 'btn-amber' : 'btn-primary'} ${!canAfford ? 'opacity-60' : ''}`}
                  >
                    {canAfford ? 'Buy with Wallet' : 'Insufficient Balance'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Top-up modal */}
      {showTopUp && createPortal(
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setShowTopUp(false)}>
          <div className="w-[480px] max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-100 bg-white shadow-2xl animate-[fadeIn_0.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <h2 className="text-base font-bold text-gray-900">Top Up Wallet</h2>
              <button onClick={() => setShowTopUp(false)} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">Select Amount</p>
                <div className="grid grid-cols-3 gap-2">
                  {presetAmounts.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => { setTopUpPreset(amt); setCustomAmount('') }}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all ${topUpPreset === amt ? 'border-violet-400 bg-violet-50 text-violet-700' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'}`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Or Enter Custom Amount</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={customAmount}
                    onChange={(e) => { setCustomAmount(e.target.value); setTopUpPreset(null) }}
                    placeholder="0.00"
                    className="input-field pl-7"
                  />
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">Payment Method</p>
                <div className="space-y-2">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${paymentMethod === method.id ? 'border-violet-400 bg-violet-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={() => setPaymentMethod(method.id)}
                        className="h-4 w-4 border-gray-300 text-violet-600 focus:ring-violet-200"
                      />
                      <method.icon size={16} className={paymentMethod === method.id ? 'text-violet-600' : 'text-gray-400'} />
                      <span className={`text-sm font-medium ${paymentMethod === method.id ? 'text-violet-700' : 'text-gray-600'}`}>{method.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {topUpAmount > 0 && (
                <div className="flex items-center justify-between rounded-xl bg-violet-50 px-4 py-3">
                  <span className="text-sm text-gray-600">Amount to add</span>
                  <span className="text-lg font-bold text-violet-700">{formatCurrency(topUpAmount)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 p-5">
              <button onClick={() => setShowTopUp(false)} className="btn-ghost text-sm">Cancel</button>
              <button onClick={handleTopUp} disabled={topUpAmount <= 0} className="btn-primary flex items-center gap-1.5 text-sm disabled:opacity-50">
                <Plus size={14} />
                Confirm Top-Up
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* Purchase confirm modal */}
      {purchaseConfirm && createPortal(
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setPurchaseConfirm(null)}>
          <div className="w-[480px] max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-100 bg-white shadow-2xl animate-[fadeIn_0.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <h2 className="text-base font-bold text-gray-900">Confirm Purchase</h2>
              <button onClick={() => setPurchaseConfirm(null)} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm font-bold text-gray-800">{purchaseConfirm.name} Plan</p>
                <p className="mt-0.5 text-xs text-gray-500">{purchaseConfirm.bandwidth} bandwidth · Rotating Proxies</p>
                <p className="mt-2 text-xl font-bold text-gray-900">{formatCurrency(purchaseConfirm.monthlyBase)}<span className="text-xs font-normal text-gray-400"> / mo</span></p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Current Balance</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(walletData.balance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Purchase Amount</span>
                  <span className="font-semibold text-red-500">-{formatCurrency(purchaseConfirm.monthlyBase)}</span>
                </div>
                <div className="border-t border-gray-100 pt-2" />
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Balance After</span>
                  <span className={`font-bold ${walletData.balance >= purchaseConfirm.monthlyBase ? 'text-gray-900' : 'text-red-500'}`}>
                    {formatCurrency(walletData.balance - purchaseConfirm.monthlyBase)}
                  </span>
                </div>
              </div>

              {walletData.balance < purchaseConfirm.monthlyBase && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-amber-500" />
                  <div>
                    <p className="text-xs font-semibold text-amber-700">Insufficient balance</p>
                    <p className="mt-0.5 text-xs text-amber-600">Please top up your wallet before purchasing this plan.</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 rounded-xl border border-violet-100 bg-violet-50/50 px-4 py-3">
                <RefreshCw size={14} className="flex-shrink-0 text-violet-500" />
                <p className="text-xs text-violet-700">This plan will be added to your subscriptions with monthly auto-renewal enabled. You can change the billing cycle later.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 p-5">
              <button onClick={() => setPurchaseConfirm(null)} className="btn-ghost text-sm">Cancel</button>
              {walletData.balance < purchaseConfirm.monthlyBase ? (
                <button onClick={() => { setPurchaseConfirm(null); setShowTopUp(true) }} className="btn-primary flex items-center gap-1.5 text-sm">
                  <Plus size={14} />
                  Top Up Wallet
                </button>
              ) : (
                <button onClick={handlePurchase} className="btn-primary text-sm">
                  Confirm Purchase
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* Edit subscription modal */}
      {editSub && createPortal(
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setEditSub(null)}>
          <div className="w-[480px] max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-100 bg-white shadow-2xl animate-[fadeIn_0.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <div>
                <h2 className="text-base font-bold text-gray-900">Edit Subscription</h2>
                <p className="mt-0.5 text-xs text-gray-400">{editSub.planName} Plan · {editSub.bandwidth}</p>
              </div>
              <button onClick={() => setEditSub(null)} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              {/* Billing cycle */}
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">Billing Cycle</p>
                <div className="space-y-2">
                  {cycleOptions.map((opt) => {
                    const cycleCost = getCyclePrice(editSub.price, opt.value)
                    return (
                      <label
                        key={opt.value}
                        className={`flex cursor-pointer items-center justify-between rounded-xl border p-3.5 transition-all ${editCycle === opt.value ? 'border-violet-400 bg-violet-50' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="cycle"
                            value={opt.value}
                            checked={editCycle === opt.value}
                            onChange={() => setEditCycle(opt.value)}
                            className="h-4 w-4 border-gray-300 text-violet-600 focus:ring-violet-200"
                          />
                          <div>
                            <p className={`text-sm font-semibold ${editCycle === opt.value ? 'text-violet-700' : 'text-gray-700'}`}>
                              {opt.label}
                              {opt.discount && (
                                <span className="ml-2 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 border border-emerald-200">
                                  {opt.discount}
                                </span>
                              )}
                            </p>
                            <p className="mt-0.5 text-xs text-gray-400">
                              Billed every {opt.months === 1 ? 'month' : `${opt.months} months`}
                            </p>
                          </div>
                        </div>
                        <p className={`text-sm font-bold ${editCycle === opt.value ? 'text-violet-700' : 'text-gray-700'}`}>
                          {formatCurrency(cycleCost)}
                        </p>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-2 rounded-xl bg-gray-50 p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Base price</span>
                  <span className="font-medium text-gray-700">{formatCurrency(editSub.price)}/mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Cycle charge</span>
                  <span className="font-bold text-gray-900">{formatCurrency(getCyclePrice(editSub.price, editCycle))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Next renewal</span>
                  <span className="font-medium text-gray-700">{formatDate(getNextRenewalDate(new Date().toISOString().split('T')[0], editCycle))}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 p-5">
              <button
                onClick={() => handleCancelSub(editSub.id)}
                className="text-xs font-semibold text-red-500 transition-colors hover:text-red-600 hover:underline"
              >
                Cancel Subscription
              </button>
              <div className="flex items-center gap-3">
                <button onClick={() => setEditSub(null)} className="btn-ghost text-sm">Close</button>
                <button onClick={handleSaveCycle} className="btn-primary text-sm">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
