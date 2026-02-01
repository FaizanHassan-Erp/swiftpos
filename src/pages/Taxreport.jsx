import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'

export default function Taxreport() {
  const { state } = useApp()
  const { sales, purchases, customers, suppliers, business } = state

  // Filters
  const [dateRange, setDateRange] = useState('this_month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [viewMode, setViewMode] = useState('summary') // summary, sales, purchases

  // Get date range
  function getDateRange() {
    const now = new Date()
    let start, end

    switch (dateRange) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
        break
      case 'yesterday':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59)
        break
      case 'this_week':
        const dayOfWeek = now.getDay()
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek)
        end = now
        break
      case 'last_week':
        const lastWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() - 7)
        start = lastWeekStart
        end = new Date(lastWeekStart.getFullYear(), lastWeekStart.getMonth(), lastWeekStart.getDate() + 6, 23, 59, 59)
        break
      case 'this_month':
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        end = now
        break
      case 'last_month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
        break
      case 'this_quarter':
        const quarter = Math.floor(now.getMonth() / 3)
        start = new Date(now.getFullYear(), quarter * 3, 1)
        end = now
        break
      case 'last_quarter':
        const lastQuarter = Math.floor(now.getMonth() / 3) - 1
        const lastQuarterYear = lastQuarter < 0 ? now.getFullYear() - 1 : now.getFullYear()
        const adjustedQuarter = lastQuarter < 0 ? 3 : lastQuarter
        start = new Date(lastQuarterYear, adjustedQuarter * 3, 1)
        end = new Date(lastQuarterYear, adjustedQuarter * 3 + 3, 0, 23, 59, 59)
        break
      case 'this_year':
        start = new Date(now.getFullYear(), 0, 1)
        end = now
        break
      case 'last_year':
        start = new Date(now.getFullYear() - 1, 0, 1)
        end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59)
        break
      case 'custom':
        start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1)
        end = endDate ? new Date(endDate + 'T23:59:59') : now
        break
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        end = now
    }

    return { start, end }
  }

  // Helper functions
  function getCustomerName(id) {
    return customers.find(c => c.id === id)?.name || 'Walk-in Customer'
  }

  function getSupplierName(id) {
    return suppliers.find(s => s.id === id)?.name || 'Unknown Supplier'
  }

  // Filter sales by date
  const filteredSales = useMemo(() => {
    const { start, end } = getDateRange()
    return (sales || []).filter(sale => {
      const saleDate = new Date(sale.date || sale.createdAt)
      return saleDate >= start && saleDate <= end
    })
  }, [sales, dateRange, startDate, endDate])

  // Filter purchases by date
  const filteredPurchases = useMemo(() => {
    const { start, end } = getDateRange()
    return (purchases || []).filter(purchase => {
      const purchaseDate = new Date(purchase.date || purchase.createdAt)
      return purchaseDate >= start && purchaseDate <= end
    })
  }, [purchases, dateRange, startDate, endDate])

  // Calculate tax collected from sales
  const salesTaxData = useMemo(() => {
    const taxByRate = new Map()
    let totalTaxCollected = 0
    let totalTaxableSales = 0
    let totalExemptSales = 0

    filteredSales.forEach(sale => {
      const taxAmount = sale.tax || 0
      const taxPercent = sale.taxPercent || 0
      const subtotal = sale.subtotal || sale.total || 0
      const discount = sale.discount || 0

      totalTaxCollected += taxAmount

      if (taxAmount > 0) {
        totalTaxableSales += (subtotal - discount)
        
        // Group by tax rate
        const rateKey = `${taxPercent}%`
        if (taxByRate.has(rateKey)) {
          const existing = taxByRate.get(rateKey)
          existing.taxAmount += taxAmount
          existing.taxableAmount += (subtotal - discount)
          existing.count += 1
        } else {
          taxByRate.set(rateKey, {
            rate: taxPercent,
            taxAmount: taxAmount,
            taxableAmount: (subtotal - discount),
            count: 1
          })
        }
      } else {
        totalExemptSales += (subtotal - discount)
      }
    })

    return {
      totalTaxCollected,
      totalTaxableSales,
      totalExemptSales,
      taxByRate: Array.from(taxByRate.values()).sort((a, b) => b.rate - a.rate),
      salesCount: filteredSales.length
    }
  }, [filteredSales])

  // Calculate tax paid on purchases
  const purchasesTaxData = useMemo(() => {
    const taxByRate = new Map()
    let totalTaxPaid = 0
    let totalTaxablePurchases = 0
    let totalExemptPurchases = 0

    filteredPurchases.forEach(purchase => {
      const taxAmount = purchase.taxAmount || 0
      const taxRate = purchase.taxRate || 0
      const subtotal = purchase.subtotal || purchase.total || 0
      const discount = purchase.discount || 0

      totalTaxPaid += taxAmount

      if (taxAmount > 0) {
        totalTaxablePurchases += (subtotal - discount)
        
        // Group by tax rate
        const rateKey = `${taxRate}%`
        if (taxByRate.has(rateKey)) {
          const existing = taxByRate.get(rateKey)
          existing.taxAmount += taxAmount
          existing.taxableAmount += (subtotal - discount)
          existing.count += 1
        } else {
          taxByRate.set(rateKey, {
            rate: taxRate,
            taxAmount: taxAmount,
            taxableAmount: (subtotal - discount),
            count: 1
          })
        }
      } else {
        totalExemptPurchases += (subtotal - discount)
      }
    })

    return {
      totalTaxPaid,
      totalTaxablePurchases,
      totalExemptPurchases,
      taxByRate: Array.from(taxByRate.values()).sort((a, b) => b.rate - a.rate),
      purchasesCount: filteredPurchases.length
    }
  }, [filteredPurchases])

  // Net tax liability
  const netTaxLiability = salesTaxData.totalTaxCollected - purchasesTaxData.totalTaxPaid

  // Monthly breakdown for chart
  const monthlyBreakdown = useMemo(() => {
    const { start, end } = getDateRange()
    const monthMap = new Map()

    // Initialize months
    const current = new Date(start.getFullYear(), start.getMonth(), 1)
    while (current <= end) {
      const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`
      monthMap.set(key, {
        month: key,
        label: current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        taxCollected: 0,
        taxPaid: 0,
        netTax: 0
      })
      current.setMonth(current.getMonth() + 1)
    }

    // Aggregate sales tax
    filteredSales.forEach(sale => {
      const saleDate = new Date(sale.date || sale.createdAt)
      const key = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`
      if (monthMap.has(key)) {
        monthMap.get(key).taxCollected += (sale.tax || 0)
      }
    })

    // Aggregate purchase tax
    filteredPurchases.forEach(purchase => {
      const purchaseDate = new Date(purchase.date || purchase.createdAt)
      const key = `${purchaseDate.getFullYear()}-${String(purchaseDate.getMonth() + 1).padStart(2, '0')}`
      if (monthMap.has(key)) {
        monthMap.get(key).taxPaid += (purchase.taxAmount || 0)
      }
    })

    // Calculate net
    monthMap.forEach(data => {
      data.netTax = data.taxCollected - data.taxPaid
    })

    return Array.from(monthMap.values())
  }, [filteredSales, filteredPurchases, dateRange, startDate, endDate])

  // Export to CSV
  function exportToCSV() {
    let csvContent = ''
    
    // Header
    csvContent += 'TAX REPORT\n'
    csvContent += `Period: ${getDateRange().start.toLocaleDateString()} - ${getDateRange().end.toLocaleDateString()}\n`
    csvContent += `Generated: ${new Date().toLocaleString()}\n\n`

    // Summary
    csvContent += 'SUMMARY\n'
    csvContent += `Tax Collected (Output Tax),${salesTaxData.totalTaxCollected.toFixed(2)}\n`
    csvContent += `Tax Paid (Input Tax),${purchasesTaxData.totalTaxPaid.toFixed(2)}\n`
    csvContent += `Net Tax Liability,${netTaxLiability.toFixed(2)}\n\n`

    // Sales Tax Details
    csvContent += 'TAX COLLECTED FROM SALES\n'
    csvContent += 'Date,Invoice No,Customer,Subtotal,Discount,Tax Rate,Tax Amount,Total\n'
    filteredSales.forEach(sale => {
      csvContent += `${new Date(sale.date || sale.createdAt).toLocaleDateString()},`
      csvContent += `${sale.invoiceNo || '-'},`
      csvContent += `"${getCustomerName(sale.customerId)}",`
      csvContent += `${(sale.subtotal || 0).toFixed(2)},`
      csvContent += `${(sale.discount || 0).toFixed(2)},`
      csvContent += `${sale.taxPercent || 0}%,`
      csvContent += `${(sale.tax || 0).toFixed(2)},`
      csvContent += `${(sale.total || 0).toFixed(2)}\n`
    })

    csvContent += '\nTAX PAID ON PURCHASES\n'
    csvContent += 'Date,Reference No,Supplier,Subtotal,Discount,Tax Rate,Tax Amount,Total\n'
    filteredPurchases.forEach(purchase => {
      csvContent += `${new Date(purchase.date || purchase.createdAt).toLocaleDateString()},`
      csvContent += `${purchase.referenceNo || '-'},`
      csvContent += `"${getSupplierName(purchase.supplierId)}",`
      csvContent += `${(purchase.subtotal || 0).toFixed(2)},`
      csvContent += `${(purchase.discount || 0).toFixed(2)},`
      csvContent += `${purchase.taxRate || 0}%,`
      csvContent += `${(purchase.taxAmount || 0).toFixed(2)},`
      csvContent += `${(purchase.total || 0).toFixed(2)}\n`
    })

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tax-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Print report
  function printReport() {
    window.print()
  }

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-white">Tax Report</h1>
          <p className="text-slate-400 text-sm">Tax collected & paid summary for compliance</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
          <button
            onClick={printReport}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center mb-6">
        <h1 className="text-2xl font-bold">{business.name || 'Business'}</h1>
        <h2 className="text-xl">Tax Report</h2>
        <p className="text-gray-600">
          Period: {getDateRange().start.toLocaleDateString()} - {getDateRange().end.toLocaleDateString()}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 print:hidden">
        <div className="flex items-center gap-2 text-cyan-400 mb-4">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="font-medium">Filters</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="last_week">Last Week</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_quarter">This Quarter</option>
              <option value="last_quarter">Last Quarter</option>
              <option value="this_year">This Year</option>
              <option value="last_year">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {dateRange === 'custom' && (
            <>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm text-slate-400 mb-1">View Mode</label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="summary">Summary</option>
              <option value="sales">Sales Tax Details</option>
              <option value="purchases">Purchase Tax Details</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tax Collected */}
        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-emerald-300 text-sm font-medium">Tax Collected (Output)</p>
              <p className="text-slate-400 text-xs">From {salesTaxData.salesCount} sales</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-emerald-400">{business.currency} {salesTaxData.totalTaxCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <div className="mt-4 pt-4 border-t border-emerald-500/20 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Taxable Sales:</span>
              <span className="text-white">{business.currency} {salesTaxData.totalTaxableSales.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tax-Exempt Sales:</span>
              <span className="text-white">{business.currency} {salesTaxData.totalExemptSales.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Tax Paid */}
        <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-orange-300 text-sm font-medium">Tax Paid (Input)</p>
              <p className="text-slate-400 text-xs">From {purchasesTaxData.purchasesCount} purchases</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-orange-400">{business.currency} {purchasesTaxData.totalTaxPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <div className="mt-4 pt-4 border-t border-orange-500/20 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Taxable Purchases:</span>
              <span className="text-white">{business.currency} {purchasesTaxData.totalTaxablePurchases.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tax-Exempt Purchases:</span>
              <span className="text-white">{business.currency} {purchasesTaxData.totalExemptPurchases.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Net Tax Liability */}
        <div className={`bg-gradient-to-br ${netTaxLiability >= 0 ? 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30' : 'from-green-500/20 to-green-600/10 border-green-500/30'} border rounded-xl p-6`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 ${netTaxLiability >= 0 ? 'bg-cyan-500/20' : 'bg-green-500/20'} rounded-xl flex items-center justify-center`}>
              <svg className={`w-6 h-6 ${netTaxLiability >= 0 ? 'text-cyan-400' : 'text-green-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className={`${netTaxLiability >= 0 ? 'text-cyan-300' : 'text-green-300'} text-sm font-medium`}>
                {netTaxLiability >= 0 ? 'Net Tax Payable' : 'Tax Refund Due'}
              </p>
              <p className="text-slate-400 text-xs">Output - Input Tax</p>
            </div>
          </div>
          <p className={`text-3xl font-bold ${netTaxLiability >= 0 ? 'text-cyan-400' : 'text-green-400'}`}>
            {business.currency} {Math.abs(netTaxLiability).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="mt-4 pt-4 border-t border-slate-500/20">
            <div className={`px-3 py-2 rounded-lg ${netTaxLiability >= 0 ? 'bg-cyan-500/10' : 'bg-green-500/10'}`}>
              <p className={`text-sm ${netTaxLiability >= 0 ? 'text-cyan-300' : 'text-green-300'}`}>
                {netTaxLiability >= 0 
                  ? '⚠️ Amount to be paid to tax authority' 
                  : '✓ Amount to be claimed as refund'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tax Rate Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sales Tax by Rate */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl">
          <div className="p-4 border-b border-slate-700/50">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="text-emerald-400">📊</span> Tax Collected by Rate
            </h3>
          </div>
          <div className="p-4">
            {salesTaxData.taxByRate.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No taxable sales in this period</p>
            ) : (
              <div className="space-y-3">
                {salesTaxData.taxByRate.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{item.rate}% Tax Rate</p>
                      <p className="text-slate-400 text-sm">{item.count} transactions</p>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-400 font-bold">{business.currency} {item.taxAmount.toFixed(2)}</p>
                      <p className="text-slate-500 text-xs">on {business.currency} {item.taxableAmount.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Purchase Tax by Rate */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl">
          <div className="p-4 border-b border-slate-700/50">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="text-orange-400">📊</span> Tax Paid by Rate
            </h3>
          </div>
          <div className="p-4">
            {purchasesTaxData.taxByRate.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No taxable purchases in this period</p>
            ) : (
              <div className="space-y-3">
                {purchasesTaxData.taxByRate.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{item.rate}% Tax Rate</p>
                      <p className="text-slate-400 text-sm">{item.count} transactions</p>
                    </div>
                    <div className="text-right">
                      <p className="text-orange-400 font-bold">{business.currency} {item.taxAmount.toFixed(2)}</p>
                      <p className="text-slate-500 text-xs">on {business.currency} {item.taxableAmount.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Breakdown */}
      {monthlyBreakdown.length > 1 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl">
          <div className="p-4 border-b border-slate-700/50">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="text-purple-400">📅</span> Monthly Tax Summary
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-900/50">
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Month</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Tax Collected</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Tax Paid</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Net Tax</th>
                </tr>
              </thead>
              <tbody>
                {monthlyBreakdown.map((month, index) => (
                  <tr key={index} className="border-t border-slate-700/50">
                    <td className="px-4 py-3 text-white font-medium">{month.label}</td>
                    <td className="px-4 py-3 text-right text-emerald-400">{business.currency} {month.taxCollected.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-orange-400">{business.currency} {month.taxPaid.toFixed(2)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${month.netTax >= 0 ? 'text-cyan-400' : 'text-green-400'}`}>
                      {month.netTax >= 0 ? '' : '-'}{business.currency} {Math.abs(month.netTax).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-900/50 border-t border-slate-700">
                  <td className="px-4 py-3 text-white font-bold">Total</td>
                  <td className="px-4 py-3 text-right text-emerald-400 font-bold">{business.currency} {salesTaxData.totalTaxCollected.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-orange-400 font-bold">{business.currency} {purchasesTaxData.totalTaxPaid.toFixed(2)}</td>
                  <td className={`px-4 py-3 text-right font-bold ${netTaxLiability >= 0 ? 'text-cyan-400' : 'text-green-400'}`}>
                    {netTaxLiability >= 0 ? '' : '-'}{business.currency} {Math.abs(netTaxLiability).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Detailed Sales Tax Table */}
      {viewMode === 'sales' && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl">
          <div className="p-4 border-b border-slate-700/50">
            <h3 className="text-lg font-semibold text-white">Sales Tax Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-900/50">
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Date</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Invoice No</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Customer</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Subtotal</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Discount</th>
                  <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Tax Rate</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Tax Amount</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-slate-500">No sales in this period</td>
                  </tr>
                ) : (
                  filteredSales.map(sale => (
                    <tr key={sale.id} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                      <td className="px-4 py-3 text-white">{new Date(sale.date || sale.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-cyan-400">{sale.invoiceNo || '-'}</td>
                      <td className="px-4 py-3 text-slate-300">{getCustomerName(sale.customerId)}</td>
                      <td className="px-4 py-3 text-right text-white">{business.currency} {(sale.subtotal || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-orange-400">{sale.discount > 0 ? `- ${business.currency} ${sale.discount.toFixed(2)}` : '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${sale.taxPercent > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                          {sale.taxPercent || 0}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-400 font-medium">{business.currency} {(sale.tax || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-white font-medium">{business.currency} {(sale.total || 0).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredSales.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-900/50 border-t border-slate-700">
                    <td colSpan="6" className="px-4 py-3 text-white font-bold">Total</td>
                    <td className="px-4 py-3 text-right text-emerald-400 font-bold">{business.currency} {salesTaxData.totalTaxCollected.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-white font-bold">{business.currency} {filteredSales.reduce((sum, s) => sum + (s.total || 0), 0).toFixed(2)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Detailed Purchase Tax Table */}
      {viewMode === 'purchases' && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl">
          <div className="p-4 border-b border-slate-700/50">
            <h3 className="text-lg font-semibold text-white">Purchase Tax Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-900/50">
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Date</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Reference No</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Supplier</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Subtotal</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Discount</th>
                  <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Tax Rate</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Tax Amount</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-slate-500">No purchases in this period</td>
                  </tr>
                ) : (
                  filteredPurchases.map(purchase => (
                    <tr key={purchase.id} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                      <td className="px-4 py-3 text-white">{new Date(purchase.date || purchase.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-cyan-400">{purchase.referenceNo || '-'}</td>
                      <td className="px-4 py-3 text-slate-300">{getSupplierName(purchase.supplierId)}</td>
                      <td className="px-4 py-3 text-right text-white">{business.currency} {(purchase.subtotal || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-orange-400">{purchase.discount > 0 ? `- ${business.currency} ${purchase.discount.toFixed(2)}` : '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${purchase.taxRate > 0 ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-700 text-slate-400'}`}>
                          {purchase.taxRate || 0}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-orange-400 font-medium">{business.currency} {(purchase.taxAmount || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-white font-medium">{business.currency} {(purchase.total || 0).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredPurchases.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-900/50 border-t border-slate-700">
                    <td colSpan="6" className="px-4 py-3 text-white font-bold">Total</td>
                    <td className="px-4 py-3 text-right text-orange-400 font-bold">{business.currency} {purchasesTaxData.totalTaxPaid.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-white font-bold">{business.currency} {filteredPurchases.reduce((sum, p) => sum + (p.total || 0), 0).toFixed(2)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Tax Filing Summary Box */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 print:border print:border-gray-300">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-yellow-400">📋</span> Tax Filing Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/50 p-4 rounded-lg print:border print:border-gray-200">
            <p className="text-slate-400 text-sm">Total Sales</p>
            <p className="text-xl font-bold text-white">{business.currency} {(salesTaxData.totalTaxableSales + salesTaxData.totalExemptSales).toLocaleString()}</p>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-lg print:border print:border-gray-200">
            <p className="text-slate-400 text-sm">Total Purchases</p>
            <p className="text-xl font-bold text-white">{business.currency} {(purchasesTaxData.totalTaxablePurchases + purchasesTaxData.totalExemptPurchases).toLocaleString()}</p>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-lg print:border print:border-gray-200">
            <p className="text-slate-400 text-sm">Output Tax (Collected)</p>
            <p className="text-xl font-bold text-emerald-400">{business.currency} {salesTaxData.totalTaxCollected.toFixed(2)}</p>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-lg print:border print:border-gray-200">
            <p className="text-slate-400 text-sm">Input Tax (Paid)</p>
            <p className="text-xl font-bold text-orange-400">{business.currency} {purchasesTaxData.totalTaxPaid.toFixed(2)}</p>
          </div>
        </div>
        <div className="mt-4 p-4 bg-gradient-to-r from-slate-900 to-slate-800 rounded-lg border border-slate-700 print:border-2 print:border-gray-400">
          <div className="flex justify-between items-center">
            <span className="text-lg text-slate-300">Net Tax {netTaxLiability >= 0 ? 'Payable' : 'Refundable'}:</span>
            <span className={`text-2xl font-bold ${netTaxLiability >= 0 ? 'text-cyan-400' : 'text-green-400'}`}>
              {business.currency} {Math.abs(netTaxLiability).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          * { color: black !important; background: white !important; border-color: #ccc !important; }
        }
      `}</style>
    </div>
  )
}