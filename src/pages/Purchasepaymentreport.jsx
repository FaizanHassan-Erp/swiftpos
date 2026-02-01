import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'

export default function PurchasePaymentReport() {
  const { state } = useApp()
  const { purchases = [], suppliers = [], purchasePayments = [], business = {} } = state
  const currency = business.currency || '₨'

  const [dateRange, setDateRange] = useState('this_month')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('purchases')

  const getDateRange = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch (dateRange) {
      case 'today': return { start: today, end: new Date(today.getTime() + 86400000) }
      case 'yesterday': return { start: new Date(today.getTime() - 86400000), end: today }
      case 'this_week':
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay())
        return { start: weekStart, end: new Date(today.getTime() + 86400000) }
      case 'last_week':
        const lastWeekEnd = new Date(today)
        lastWeekEnd.setDate(today.getDate() - today.getDay())
        const lastWeekStart = new Date(lastWeekEnd)
        lastWeekStart.setDate(lastWeekEnd.getDate() - 7)
        return { start: lastWeekStart, end: lastWeekEnd }
      case 'this_month': return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(today.getTime() + 86400000) }
      case 'last_month': return { start: new Date(now.getFullYear(), now.getMonth() - 1, 1), end: new Date(now.getFullYear(), now.getMonth(), 1) }
      case 'this_quarter':
        const quarter = Math.floor(now.getMonth() / 3)
        return { start: new Date(now.getFullYear(), quarter * 3, 1), end: new Date(today.getTime() + 86400000) }
      case 'this_year': return { start: new Date(now.getFullYear(), 0, 1), end: new Date(today.getTime() + 86400000) }
      case 'last_year': return { start: new Date(now.getFullYear() - 1, 0, 1), end: new Date(now.getFullYear(), 0, 1) }
      case 'all': return { start: new Date(0), end: new Date(Date.now() + 86400000) }
      case 'custom': return { start: customStartDate ? new Date(customStartDate) : new Date(0), end: customEndDate ? new Date(new Date(customEndDate).getTime() + 86400000) : new Date() }
      default: return { start: new Date(0), end: new Date() }
    }
  }

  const getSupplierName = (supplierId) => {
    if (!supplierId) return 'Unknown Supplier'
    const supplier = suppliers.find(s => String(s.id) === String(supplierId))
    return supplier?.businessName || supplier?.name || supplier?.companyName || 'Unknown Supplier'
  }

  const paymentMethods = useMemo(() => {
    const methods = new Set(['all'])
    purchases.forEach(p => { if (p.paymentMethod) methods.add(p.paymentMethod) })
    purchasePayments.forEach(p => { if (p.method) methods.add(p.method) })
    return Array.from(methods)
  }, [purchases, purchasePayments])

  const filteredPurchases = useMemo(() => {
    const { start, end } = getDateRange()
    
    return purchases.filter(purchase => {
      const purchaseDate = new Date(purchase.date || purchase.createdAt)
      if (purchaseDate < start || purchaseDate >= end) return false
      if (selectedSupplier !== 'all' && String(purchase.supplierId) !== String(selectedSupplier)) return false
      
      if (selectedStatus !== 'all') {
        const total = parseFloat(purchase.total) || 0
        const paid = parseFloat(purchase.amountPaid) || 0
        let status = paid >= total ? 'paid' : paid > 0 ? 'partial' : 'due'
        if (status !== selectedStatus) return false
      }
      
      if (selectedPaymentMethod !== 'all' && purchase.paymentMethod !== selectedPaymentMethod) return false
      
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const matchesPO = (purchase.purchaseNo || purchase.referenceNo || purchase.reference || '').toLowerCase().includes(search)
        const matchesSupplier = getSupplierName(purchase.supplierId).toLowerCase().includes(search)
        if (!matchesPO && !matchesSupplier) return false
      }
      
      return true
    }).sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
  }, [purchases, dateRange, customStartDate, customEndDate, selectedSupplier, selectedStatus, selectedPaymentMethod, searchTerm, suppliers])

  const filteredPayments = useMemo(() => {
    const { start, end } = getDateRange()
    
    return purchasePayments.filter(payment => {
      const paymentDate = new Date(payment.date || payment.createdAt)
      if (paymentDate < start || paymentDate >= end) return false
      if (selectedPaymentMethod !== 'all' && payment.method !== selectedPaymentMethod) return false
      return true
    }).map(payment => {
      const purchase = purchases.find(p => p.id === payment.purchaseId)
      return {
        ...payment,
        purchaseNo: purchase?.purchaseNo || purchase?.referenceNo || purchase?.reference || '-',
        supplierName: getSupplierName(purchase?.supplierId)
      }
    }).sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
  }, [purchasePayments, dateRange, customStartDate, customEndDate, selectedPaymentMethod, purchases, suppliers])

  const reportStats = useMemo(() => {
    const stats = {
      totalPurchases: 0, totalPaid: 0, totalDue: 0,
      purchasesCount: filteredPurchases.length, paymentsCount: filteredPayments.length,
      fullyPaidCount: 0, partialPaidCount: 0, unpaidCount: 0,
      bySupplier: {}, byPaymentMethod: {}, overdueInvoices: []
    }

    filteredPurchases.forEach(purchase => {
      const total = parseFloat(purchase.total) || 0
      const paid = parseFloat(purchase.amountPaid) || 0
      const due = Math.max(0, total - paid)
      const supplierId = purchase.supplierId || 'unknown'
      const supplierName = getSupplierName(purchase.supplierId)

      stats.totalPurchases += total
      stats.totalPaid += paid
      stats.totalDue += due

      if (paid >= total) stats.fullyPaidCount++
      else if (paid > 0) stats.partialPaidCount++
      else stats.unpaidCount++

      if (!stats.bySupplier[supplierId]) stats.bySupplier[supplierId] = { name: supplierName, total: 0, paid: 0, due: 0, count: 0 }
      stats.bySupplier[supplierId].total += total
      stats.bySupplier[supplierId].paid += paid
      stats.bySupplier[supplierId].due += due
      stats.bySupplier[supplierId].count += 1

      const daysSincePurchase = (new Date() - new Date(purchase.date || purchase.createdAt)) / (1000 * 60 * 60 * 24)
      if (due > 0 && daysSincePurchase > 30) {
        stats.overdueInvoices.push({ ...purchase, dueAmount: due, daysSincePurchase: Math.floor(daysSincePurchase), supplierName })
      }
    })

    filteredPayments.forEach(payment => {
      const method = payment.method || 'Cash'
      if (!stats.byPaymentMethod[method]) stats.byPaymentMethod[method] = { total: 0, count: 0 }
      stats.byPaymentMethod[method].total += parseFloat(payment.amount) || 0
      stats.byPaymentMethod[method].count += 1
    })

    stats.overdueInvoices.sort((a, b) => b.dueAmount - a.dueAmount)
    return stats
  }, [filteredPurchases, filteredPayments])

  const formatCurrency = (amount) => `${currency} ${Math.abs(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

  const getPeriodLabel = () => {
    if (dateRange === 'all') return 'All Time'
    const { start, end } = getDateRange()
    const options = { year: 'numeric', month: 'short', day: 'numeric' }
    return `${start.toLocaleDateString('en-US', options)} - ${new Date(end.getTime() - 86400000).toLocaleDateString('en-US', options)}`
  }

  const getStatusBadge = (purchase) => {
    const total = parseFloat(purchase.total) || 0
    const paid = parseFloat(purchase.amountPaid) || 0
    if (paid >= total) return <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">Paid</span>
    if (paid > 0) return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">Partial</span>
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">Due</span>
  }

  // Export to CSV
  const handleExport = () => {
    let csvContent = ''
    
    if (viewMode === 'purchases') {
      csvContent = 'Date,PO Number,Supplier,Total,Paid,Due,Status\n'
      filteredPurchases.forEach(purchase => {
        const total = parseFloat(purchase.total) || 0
        const paid = parseFloat(purchase.amountPaid) || 0
        const due = Math.max(0, total - paid)
        const status = paid >= total ? 'Paid' : paid > 0 ? 'Partial' : 'Due'
        csvContent += `${formatDate(purchase.date || purchase.createdAt)},`
        csvContent += `${purchase.purchaseNo || purchase.referenceNo || purchase.reference || '-'},`
        csvContent += `"${getSupplierName(purchase.supplierId)}",`
        csvContent += `${total.toFixed(2)},`
        csvContent += `${paid.toFixed(2)},`
        csvContent += `${due.toFixed(2)},`
        csvContent += `${status}\n`
      })
    } else {
      csvContent = 'Date,PO Number,Supplier,Payment Method,Amount\n'
      filteredPayments.forEach(payment => {
        csvContent += `${formatDate(payment.date || payment.createdAt)},`
        csvContent += `${payment.purchaseNo},`
        csvContent += `"${payment.supplierName}",`
        csvContent += `${payment.method || 'Cash'},`
        csvContent += `${(parseFloat(payment.amount) || 0).toFixed(2)}\n`
      })
    }

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `purchase-payment-report-${viewMode}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Purchase Payment Report</h1>
          <p className="text-slate-400 text-sm">{getPeriodLabel()}</p>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0 print:hidden">
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Print
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm">Total Purchases</span>
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(reportStats.totalPurchases)}</p>
          <p className="text-slate-500 text-xs mt-1">{reportStats.purchasesCount} orders</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm">Total Paid</span>
            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(reportStats.totalPaid)}</p>
          <p className="text-slate-500 text-xs mt-1">{reportStats.totalPurchases > 0 ? ((reportStats.totalPaid / reportStats.totalPurchases) * 100).toFixed(1) : 0}% paid</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm">Total Payable</span>
            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-orange-400">{formatCurrency(reportStats.totalDue)}</p>
          <p className="text-slate-500 text-xs mt-1">{reportStats.totalPurchases > 0 ? ((reportStats.totalDue / reportStats.totalPurchases) * 100).toFixed(1) : 0}% outstanding</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm">Order Status</span>
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center"><p className="text-lg font-bold text-emerald-400">{reportStats.fullyPaidCount}</p><p className="text-slate-500 text-xs">Paid</p></div>
            <div className="text-center"><p className="text-lg font-bold text-yellow-400">{reportStats.partialPaidCount}</p><p className="text-slate-500 text-xs">Partial</p></div>
            <div className="text-center"><p className="text-lg font-bold text-red-400">{reportStats.unpaidCount}</p><p className="text-slate-500 text-xs">Unpaid</p></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 print:hidden">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-slate-400 text-sm mb-1">Period</label>
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="bg-slate-900 text-white px-4 py-2 rounded-lg border border-slate-700 focus:border-emerald-500 focus:outline-none min-w-[150px]">
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="last_week">Last Week</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_quarter">This Quarter</option>
              <option value="this_year">This Year</option>
              <option value="last_year">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {dateRange === 'custom' && (
            <>
              <div>
                <label className="block text-slate-400 text-sm mb-1">Start Date</label>
                <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="bg-slate-900 text-white px-4 py-2 rounded-lg border border-slate-700 focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-1">End Date</label>
                <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="bg-slate-900 text-white px-4 py-2 rounded-lg border border-slate-700 focus:border-emerald-500 focus:outline-none" />
              </div>
            </>
          )}

          <div>
            <label className="block text-slate-400 text-sm mb-1">Supplier</label>
            <select value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)} className="bg-slate-900 text-white px-4 py-2 rounded-lg border border-slate-700 focus:border-emerald-500 focus:outline-none min-w-[150px]">
              <option value="all">All Suppliers</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.businessName || s.name || s.companyName}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 text-sm mb-1">Status</label>
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="bg-slate-900 text-white px-4 py-2 rounded-lg border border-slate-700 focus:border-emerald-500 focus:outline-none min-w-[120px]">
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="due">Due</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 text-sm mb-1">Payment Method</label>
            <select value={selectedPaymentMethod} onChange={(e) => setSelectedPaymentMethod(e.target.value)} className="bg-slate-900 text-white px-4 py-2 rounded-lg border border-slate-700 focus:border-emerald-500 focus:outline-none min-w-[130px]">
              {paymentMethods.map(m => <option key={m} value={m}>{m === 'all' ? 'All Methods' : m}</option>)}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-slate-400 text-sm mb-1">Search</label>
            <div className="relative">
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search PO or supplier..." className="w-full bg-slate-900 text-white px-4 py-2 pl-10 rounded-lg border border-slate-700 focus:border-emerald-500 focus:outline-none" />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex gap-2 print:hidden">
        <button onClick={() => setViewMode('purchases')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'purchases' ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
          By Purchase Order ({filteredPurchases.length})
        </button>
        <button onClick={() => setViewMode('payments')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'payments' ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
          Payment History ({filteredPayments.length})
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700/50">
            <h2 className="text-lg font-semibold text-white">{viewMode === 'purchases' ? 'Purchase Orders' : 'Payment Transactions'}</h2>
          </div>
          
          <div className="overflow-x-auto">
            {viewMode === 'purchases' ? (
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-900/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">PO #</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Supplier</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">Total</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">Paid</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">Due</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {filteredPurchases.length > 0 ? filteredPurchases.map((purchase, i) => {
                    const total = parseFloat(purchase.total) || 0
                    const paid = parseFloat(purchase.amountPaid) || 0
                    return (
                      <tr key={purchase.id || i} className="hover:bg-slate-800/30">
                        <td className="px-4 py-3 text-sm text-slate-300">{formatDate(purchase.date || purchase.createdAt)}</td>
                        <td className="px-4 py-3 text-sm text-cyan-400 font-medium">{purchase.purchaseNo || purchase.referenceNo || purchase.reference || '-'}</td>
                        <td className="px-4 py-3 text-sm text-slate-300">{getSupplierName(purchase.supplierId)}</td>
                        <td className="px-4 py-3 text-sm text-white text-right">{formatCurrency(total)}</td>
                        <td className="px-4 py-3 text-sm text-emerald-400 text-right">{formatCurrency(paid)}</td>
                        <td className="px-4 py-3 text-sm text-orange-400 text-right">{formatCurrency(Math.max(0, total - paid))}</td>
                        <td className="px-4 py-3 text-center">{getStatusBadge(purchase)}</td>
                      </tr>
                    )
                  }) : <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No purchases found</td></tr>}
                </tbody>
              </table>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-900/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">PO #</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Supplier</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Method</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {filteredPayments.length > 0 ? filteredPayments.map((payment, i) => (
                    <tr key={i} className="hover:bg-slate-800/30">
                      <td className="px-4 py-3 text-sm text-slate-300">{formatDate(payment.date || payment.createdAt)}</td>
                      <td className="px-4 py-3 text-sm text-cyan-400 font-medium">{payment.purchaseNo}</td>
                      <td className="px-4 py-3 text-sm text-slate-300">{payment.supplierName}</td>
                      <td className="px-4 py-3"><span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">{payment.method || 'Cash'}</span></td>
                      <td className="px-4 py-3 text-sm text-emerald-400 text-right font-medium">{formatCurrency(payment.amount)}</td>
                    </tr>
                  )) : <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No payments found</td></tr>}
                </tbody>
              </table>
            )}
          </div>

          <div className="px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">{viewMode === 'purchases' ? `${filteredPurchases.length} orders` : `${filteredPayments.length} payments`}</span>
              <div className="flex gap-6">
                <div className="text-right"><p className="text-slate-400 text-xs">Total</p><p className="text-white font-semibold">{formatCurrency(reportStats.totalPurchases)}</p></div>
                <div className="text-right"><p className="text-slate-400 text-xs">Paid</p><p className="text-emerald-400 font-semibold">{formatCurrency(reportStats.totalPaid)}</p></div>
                <div className="text-right"><p className="text-slate-400 text-xs">Payable</p><p className="text-orange-400 font-semibold">{formatCurrency(reportStats.totalDue)}</p></div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">Payment Progress</h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-emerald-400 text-sm font-medium">{reportStats.totalPurchases > 0 ? ((reportStats.totalPaid / reportStats.totalPurchases) * 100).toFixed(1) : 0}% Paid</span>
              <span className="text-slate-400 text-sm">{formatCurrency(reportStats.totalPaid)} / {formatCurrency(reportStats.totalPurchases)}</span>
            </div>
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full" style={{ width: `${reportStats.totalPurchases > 0 ? (reportStats.totalPaid / reportStats.totalPurchases) * 100 : 0}%` }} />
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">By Payment Method</h3>
            <div className="space-y-3">
              {Object.entries(reportStats.byPaymentMethod).sort((a, b) => b[1].total - a[1].total).map(([method, data], i) => {
                const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-orange-500']
                return (
                  <div key={method}>
                    <div className="flex justify-between text-sm mb-1"><span className="text-slate-400">{method}</span><span className="text-white">{formatCurrency(data.total)}</span></div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${colors[i % colors.length]}`} style={{ width: `${reportStats.totalPaid > 0 ? (data.total / reportStats.totalPaid) * 100 : 0}%` }} />
                      </div>
                      <span className="text-slate-500 text-xs w-8 text-right">{data.count}</span>
                    </div>
                  </div>
                )
              })}
              {Object.keys(reportStats.byPaymentMethod).length === 0 && <p className="text-slate-500 text-sm text-center py-4">No payment data</p>}
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">Payable by Supplier</h3>
            <div className="space-y-3">
              {Object.entries(reportStats.bySupplier).filter(([_, d]) => d.due > 0).sort((a, b) => b[1].due - a[1].due).slice(0, 5).map(([id, data]) => (
                <div key={id} className="flex items-center justify-between p-2 bg-slate-700/50 rounded-lg">
                  <div><p className="text-white text-sm font-medium truncate max-w-[140px]">{data.name}</p><p className="text-slate-500 text-xs">{data.count} order(s)</p></div>
                  <div className="text-right"><p className="text-orange-400 font-medium">{formatCurrency(data.due)}</p><p className="text-slate-500 text-xs">of {formatCurrency(data.total)}</p></div>
                </div>
              ))}
              {Object.entries(reportStats.bySupplier).filter(([_, d]) => d.due > 0).length === 0 && <p className="text-slate-500 text-sm text-center py-4">No outstanding payables</p>}
            </div>
          </div>

          {reportStats.overdueInvoices.length > 0 && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <h3 className="text-red-400 font-semibold">Overdue (&gt;30 days)</h3>
              </div>
              <div className="space-y-2">
                {reportStats.overdueInvoices.slice(0, 5).map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div><p className="text-white">{p.purchaseNo || p.referenceNo || p.reference}</p><p className="text-slate-500 text-xs">{p.daysSincePurchase} days overdue</p></div>
                    <p className="text-red-400 font-medium">{formatCurrency(p.dueAmount)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}