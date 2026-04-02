import { useState, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Wallet as WalletIcon, Plus, DollarSign, TrendingUp, Hash,
  ArrowDownLeft, ArrowUpRight, RotateCcw, Filter, X,
  AlertTriangle, Check, Zap, CreditCard
} from 'lucide-react'
import DataTable from '../components/DataTable'
import { usePersistentList } from '../utils/store'
import { rotatingPlans } from '../data/mockData'

const formatCurrency = (n) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const formatDate = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const typeBadge = {
  Recharge: { bg: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: ArrowDownLeft },
  Purchase: { bg: 'bg-violet-50 text-violet-600 border-violet-200', icon: ArrowUpRight },
  Refund:   { bg: 'bg-amber-50 text-amber-600 border-amber-200',   icon: RotateCcw },
}

const statusClass = {
  Completed: 'badge-active',
  Pending:   'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-600 border border-amber-200',
  Failed:    'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-red-50 text-red-500 border border-red-200',
}

const presetAmounts = [10, 25, 50, 100, 200, 500]

const paymentMethods = [
  { id: 'visa', label: 'Visa ••••4242', icon: CreditCard },
  { id: 'paypal', label: 'PayPal', icon: DollarSign },
  { id: 'crypto', label: 'Crypto (BTC)', icon: TrendingUp },
]

export default function Wallet() {
  const [walletData, setWalletData] = usePersistentList('walletData')
  const [typeFilter, setTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showTopUp, setShowTopUp] = useState(false)
  const [topUpPreset, setTopUpPreset] = useState(null)
  const [customAmount, setCustomAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('visa')
  const [purchaseConfirm, setPurchaseConfirm] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const successTimer = useRef(null)

  useEffect(() => () => clearTimeout(successTimer.current), [])

  const showSuccess = (msg) => {
    setSuccessMsg(msg)
    clearTimeout(successTimer.current)
    successTimer.current = setTimeout(() => setSuccessMsg(null), 3000)
  }

  const filtered = useMemo(() => {
    let list = walletData.transactions
    if (typeFilter !== 'All') list = list.filter((r) => r.type === typeFilter)
    if (statusFilter !== 'All') list = list.filter((r) => r.status === statusFilter)
    return list
  }, [walletData.transactions, typeFilter, statusFilter])

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
    showSuccess(`Successfully added ${formatCurrency(topUpAmount)} to your wallet`)
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
    setWalletData((prev) => ({
      ...prev,
      balance: prev.balance - plan.monthlyBase,
      transactions: [newTx, ...prev.transactions],
    }))
    setPurchaseConfirm(null)
    showSuccess(`Purchased ${plan.name} plan for ${formatCurrency(plan.monthlyBase)}`)
  }

  return (
    <div className="space-y-6 animate-[slideUp_0.5s_ease-out]">
      {/* Success toast */}
      {successMsg && createPortal(
        <div className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-lg animate-[fadeIn_0.2s_ease-out]">
          <Check size={16} />
          {successMsg}
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
              <Hash size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400">Transactions</p>
              <p className="text-lg font-bold text-gray-900">{walletData.transactions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick purchase */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <Zap size={16} className="text-violet-500" />
          <h2 className="text-sm font-bold text-gray-800">Quick Purchase</h2>
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

      {/* Transaction history */}
      <div className="card">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-gray-400" />
            <span className="text-sm font-semibold text-gray-700">Wallet Transactions</span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">{filtered.length}</span>
          </div>
          <div className="flex gap-2">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="Filter by type" className="input-field w-auto !py-1.5 !text-xs">
              <option>All</option>
              <option>Recharge</option>
              <option>Purchase</option>
              <option>Refund</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status" className="input-field w-auto !py-1.5 !text-xs">
              <option>All</option>
              <option>Completed</option>
              <option>Pending</option>
              <option>Failed</option>
            </select>
          </div>
        </div>

        <DataTable
          columns={['Date', 'Type', 'Description', 'Amount', 'Payment', 'Status']}
          data={filtered}
          renderRow={(row) => (
            <tr key={row.id} className="transition-colors hover:bg-gray-50/50">
              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{formatDate(row.date)}</td>
              <td className="px-4 py-3">
                {(() => {
                  const badge = typeBadge[row.type]
                  const Icon = badge.icon
                  return (
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${badge.bg}`}>
                      <Icon size={11} />
                      {row.type}
                    </span>
                  )
                })()}
              </td>
              <td className="max-w-[260px] truncate px-4 py-3 text-sm text-gray-600" title={row.description}>{row.description}</td>
              <td className={`whitespace-nowrap px-4 py-3 text-sm font-semibold ${row.type === 'Refund' ? 'text-emerald-600' : row.type === 'Recharge' ? 'text-emerald-600' : 'text-gray-900'}`}>
                {row.type === 'Purchase' ? '-' : '+'}{formatCurrency(row.amount)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">{row.paymentMethod}</td>
              <td className="px-4 py-3">
                <span className={statusClass[row.status]}>{row.status}</span>
              </td>
            </tr>
          )}
        />
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-500">No transactions match your filters</div>
        )}
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
              {/* Preset amounts */}
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

              {/* Custom amount */}
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

              {/* Payment method */}
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

              {/* Summary */}
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
          <div className="w-[440px] max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-100 bg-white shadow-2xl animate-[fadeIn_0.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
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
    </div>
  )
}
