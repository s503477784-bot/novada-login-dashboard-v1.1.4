import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  DollarSign, Wallet, Calendar, FileText, X, Download,
  ArrowDownLeft, ArrowUpRight, RotateCcw, Filter, Check
} from 'lucide-react'
import DataTable from '../components/DataTable'
import { usePersistentList } from '../utils/store'
import { sessionProfile } from '../utils/session'

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

export default function Billing() {
  const [records] = usePersistentList('billingRecords')
  const [typeFilter, setTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [invoiceRecord, setInvoiceRecord] = useState(null)
  const [pdfNotice, setPdfNotice] = useState(false)

  const filtered = useMemo(() => {
    let list = records
    if (typeFilter !== 'All') list = list.filter((r) => r.type === typeFilter)
    if (statusFilter !== 'All') list = list.filter((r) => r.status === statusFilter)
    return list
  }, [records, typeFilter, statusFilter])

  const totalSpent = useMemo(() =>
    records
      .filter((r) => r.status === 'Completed' && r.type !== 'Refund')
      .reduce((sum, r) => sum + r.amount, 0),
    [records],
  )

  const totalRefunded = useMemo(() =>
    records
      .filter((r) => r.status === 'Completed' && r.type === 'Refund')
      .reduce((sum, r) => sum + r.amount, 0),
    [records],
  )

  const lastPayment = useMemo(() => {
    const completed = records.filter((r) => r.status === 'Completed').sort((a, b) => b.date.localeCompare(a.date))
    return completed.length > 0 ? formatDate(completed[0].date) : '—'
  }, [records])

  const handleDownloadPdf = () => {
    setPdfNotice(true)
    setTimeout(() => setPdfNotice(false), 3000)
  }

  return (
    <div className="space-y-6 animate-[slideUp_0.5s_ease-out]">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Billing & Invoices</h1>
        <p className="mt-1 text-sm text-gray-500">View your transaction history and download invoices.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
              <DollarSign size={20} className="text-violet-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400">Total Spent</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(totalSpent)}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
              <Wallet size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400">Service Credits</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(totalRefunded)}</p>
            </div>
          </div>
        </div>
        <div className="card p-5 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
              <Calendar size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400">Last Payment</p>
              <p className="text-lg font-bold text-gray-900">{lastPayment}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction table */}
      <div className="card">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-gray-400" />
            <span className="text-sm font-semibold text-gray-700">Transaction History</span>
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
          columns={['Date', 'Type', 'Description', 'Amount', 'Payment', 'Status', '']}
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
              <td className="px-4 py-3 text-sm text-gray-600 max-w-[260px] truncate" title={row.description}>{row.description}</td>
              <td className={`whitespace-nowrap px-4 py-3 text-sm font-semibold ${row.type === 'Refund' ? 'text-emerald-600' : 'text-gray-900'}`}>
                {row.type === 'Refund' ? '+' : ''}{formatCurrency(row.amount)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">{row.paymentMethod}</td>
              <td className="px-4 py-3">
                <span className={statusClass[row.status]}>{row.status}</span>
              </td>
              <td className="px-4 py-3 text-right">
                {row.status === 'Completed' && row.invoiceNumber && (
                  <button
                    onClick={() => setInvoiceRecord(row)}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-violet-600 transition-colors hover:bg-violet-50"
                  >
                    <FileText size={13} />
                    Invoice
                  </button>
                )}
              </td>
            </tr>
          )}
        />
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-500">No transactions match your filters</div>
        )}
      </div>

      {/* Invoice modal */}
      {invoiceRecord && createPortal(
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setInvoiceRecord(null)}>
          <div className="w-[520px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-4rem)] overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-2xl animate-[fadeIn_0.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
            {/* Invoice header */}
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <div>
                <h2 className="text-base font-bold text-gray-900">Invoice</h2>
                <p className="mt-0.5 text-xs text-gray-400">{invoiceRecord.invoiceNumber}</p>
              </div>
              <button onClick={() => setInvoiceRecord(null)} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            {/* Invoice body */}
            <div className="space-y-5 p-5">
              {/* From / To */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">From</p>
                  <p className="mt-1 text-sm font-semibold text-gray-800">Novada Ltd.</p>
                  <p className="text-xs text-gray-500">billing@novada.io</p>
                  <p className="text-xs text-gray-500">Suite 400, 100 King St W</p>
                  <p className="text-xs text-gray-500">Toronto, ON M5X 1A9</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Bill To</p>
                  <p className="mt-1 text-sm font-semibold text-gray-800">{sessionProfile.displayName}</p>
                  <p className="text-xs text-gray-500">{sessionProfile.email}</p>
                </div>
              </div>

              {/* Meta */}
              <div className="grid grid-cols-3 gap-3 rounded-xl bg-gray-50 p-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Date</p>
                  <p className="mt-0.5 text-sm font-semibold text-gray-700">{formatDate(invoiceRecord.date)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Payment</p>
                  <p className="mt-0.5 text-sm font-semibold text-gray-700">{invoiceRecord.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Status</p>
                  <p className="mt-0.5 text-sm font-semibold text-emerald-600">Paid</p>
                </div>
              </div>

              {/* Line items */}
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">Description</th>
                      <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider text-gray-400">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-50">
                      <td className="px-4 py-3 text-gray-700">{invoiceRecord.description}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-700">{formatCurrency(invoiceRecord.amount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(invoiceRecord.amount)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Tax (0%)</span>
                  <span>$0.00</span>
                </div>
                <div className="border-t border-gray-100 pt-1.5" />
                <div className="flex justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span>{formatCurrency(invoiceRecord.amount)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col gap-3 border-t border-gray-100 p-5">
              {pdfNotice && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 animate-[fadeIn_0.2s_ease-out]">
                  <Check size={14} />
                  PDF download will be available once the billing backend is connected.
                </div>
              )}
              <div className="flex items-center justify-end gap-3">
                <button onClick={() => setInvoiceRecord(null)} className="btn-ghost text-sm">Close</button>
                <button
                  onClick={handleDownloadPdf}
                  className="btn-primary flex items-center gap-1.5 text-sm"
                >
                  <Download size={14} />
                  Download PDF
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
