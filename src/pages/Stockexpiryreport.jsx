import { useState, useRef } from 'react'
import { useApp } from '../Context/AppContext'

export default function Stockexpiryreport() {
  const { state } = useApp()
  const { products = [], purchases = [], categories = [], brands = [], business } = state
  const printRef = useRef()

  const [filterCategory, setFilterCategory] = useState('')
  const [filterBrand, setFilterBrand] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDays, setFilterDays] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('products') // products | batches

  // Get expiry status helper
  function getExpiryStatus(expiryDate) {
    if (!expiryDate) return { status: 'none', label: 'No Expiry', color: 'slate', days: null, priority: 6 }
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expiry = new Date(expiryDate)
    expiry.setHours(0, 0, 0, 0)
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', label: 'Expired', color: 'red', days: daysUntilExpiry, priority: 1 }
    } else if (daysUntilExpiry === 0) {
      return { status: 'today', label: 'Expires Today', color: 'red', days: 0, priority: 2 }
    } else if (daysUntilExpiry <= 7) {
      return { status: 'critical', label: `${daysUntilExpiry} days left`, color: 'red', days: daysUntilExpiry, priority: 3 }
    } else if (daysUntilExpiry <= 30) {
      return { status: 'warning', label: `${daysUntilExpiry} days left`, color: 'yellow', days: daysUntilExpiry, priority: 4 }
    } else if (daysUntilExpiry <= 90) {
      return { status: 'attention', label: `${daysUntilExpiry} days left`, color: 'orange', days: daysUntilExpiry, priority: 5 }
    }
    return { status: 'ok', label: `${daysUntilExpiry} days left`, color: 'emerald', days: daysUntilExpiry, priority: 7 }
  }

  // Build expiry data from products
  function getProductExpiryData() {
    return products
      .filter(p => p.expiryDate)
      .map(p => {
        const status = getExpiryStatus(p.expiryDate)
        return {
          id: p.id,
          type: 'product',
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          categoryId: p.categoryId,
          brandId: p.brandId,
          expiryDate: p.expiryDate,
          quantity: p.currentStock || 0,
          costPrice: p.costPrice || 0,
          sellingPrice: p.sellingPrice || 0,
          stockValue: (p.currentStock || 0) * (p.costPrice || 0),
          retailValue: (p.currentStock || 0) * (p.sellingPrice || 0),
          status: status.status,
          statusLabel: status.label,
          statusColor: status.color,
          daysUntilExpiry: status.days,
          priority: status.priority,
          source: 'Product Default'
        }
      })
  }

  // Build expiry data from purchase batches
  function getBatchExpiryData() {
    const batches = []
    
    purchases.forEach(purchase => {
      (purchase.items || []).forEach(item => {
        if (item.expiryDate) {
          const product = products.find(p => p.id === item.productId)
          const status = getExpiryStatus(item.expiryDate)
          
          batches.push({
            id: `${purchase.id}-${item.productId}`,
            type: 'batch',
            productId: item.productId,
            productName: item.name || product?.name || 'Unknown',
            sku: item.sku || product?.sku || '',
            categoryId: product?.categoryId,
            brandId: product?.brandId,
            expiryDate: item.expiryDate,
            quantity: item.quantity || 0,
            costPrice: item.unitCost || product?.costPrice || 0,
            sellingPrice: product?.sellingPrice || 0,
            stockValue: (item.quantity || 0) * (item.unitCost || 0),
            retailValue: (item.quantity || 0) * (product?.sellingPrice || 0),
            status: status.status,
            statusLabel: status.label,
            statusColor: status.color,
            daysUntilExpiry: status.days,
            priority: status.priority,
            source: `PO: ${purchase.purchaseNo || purchase.referenceNo || 'N/A'}`,
            purchaseDate: purchase.date || purchase.createdAt,
            purchaseNo: purchase.purchaseNo
          })
        }
      })
    })
    
    return batches
  }

  // Combine and filter data based on view mode
  function getAllExpiryData() {
    if (viewMode === 'products') {
      return getProductExpiryData()
    } else if (viewMode === 'batches') {
      return getBatchExpiryData()
    }
    // Combined view
    return [...getProductExpiryData(), ...getBatchExpiryData()]
  }

  // Apply filters
  const filteredData = getAllExpiryData().filter(item => {
    // Search filter
    const matchesSearch = !searchTerm || 
      item.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Category filter
    const matchesCategory = !filterCategory || item.categoryId === parseInt(filterCategory)
    
    // Brand filter
    const matchesBrand = !filterBrand || item.brandId === parseInt(filterBrand)
    
    // Status filter
    let matchesStatus = true
    if (filterStatus === 'expired') matchesStatus = item.status === 'expired'
    else if (filterStatus === 'critical') matchesStatus = ['expired', 'today', 'critical'].includes(item.status)
    else if (filterStatus === 'warning') matchesStatus = item.status === 'warning'
    else if (filterStatus === 'attention') matchesStatus = item.status === 'attention'
    else if (filterStatus === 'ok') matchesStatus = item.status === 'ok'
    
    // Days filter
    let matchesDays = true
    if (filterDays === '7') matchesDays = item.daysUntilExpiry !== null && item.daysUntilExpiry <= 7
    else if (filterDays === '30') matchesDays = item.daysUntilExpiry !== null && item.daysUntilExpiry <= 30
    else if (filterDays === '60') matchesDays = item.daysUntilExpiry !== null && item.daysUntilExpiry <= 60
    else if (filterDays === '90') matchesDays = item.daysUntilExpiry !== null && item.daysUntilExpiry <= 90
    else if (filterDays === 'expired') matchesDays = item.daysUntilExpiry !== null && item.daysUntilExpiry < 0
    
    return matchesSearch && matchesCategory && matchesBrand && matchesStatus && matchesDays
  }).sort((a, b) => a.priority - b.priority || (a.daysUntilExpiry || 999) - (b.daysUntilExpiry || 999))

  // Calculate summary stats
  const allData = getAllExpiryData()
  const expiredItems = allData.filter(i => i.status === 'expired')
  const criticalItems = allData.filter(i => ['today', 'critical'].includes(i.status))
  const warningItems = allData.filter(i => i.status === 'warning')
  const attentionItems = allData.filter(i => i.status === 'attention')
  const okItems = allData.filter(i => i.status === 'ok')

  const totalExpiredValue = expiredItems.reduce((sum, i) => sum + i.stockValue, 0)
  const totalAtRiskValue = [...expiredItems, ...criticalItems, ...warningItems].reduce((sum, i) => sum + i.stockValue, 0)
  const totalExpiredQty = expiredItems.reduce((sum, i) => sum + i.quantity, 0)
  const totalAtRiskQty = [...expiredItems, ...criticalItems, ...warningItems].reduce((sum, i) => sum + i.quantity, 0)

  // Get helper names
  function getCategoryName(id) {
    return categories.find(c => c.id === id)?.name || '-'
  }
  
  function getBrandName(id) {
    return brands.find(b => b.id === id)?.name || '-'
  }

  // Expiry badge component
  function ExpiryBadge({ status, label, color }) {
    const colorClasses = {
      red: 'bg-red-500/20 text-red-400',
      yellow: 'bg-yellow-500/20 text-yellow-400',
      orange: 'bg-orange-500/20 text-orange-400',
      emerald: 'bg-emerald-500/20 text-emerald-400',
      slate: 'bg-slate-500/20 text-slate-400'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClasses[color]}`}>
        {label}
      </span>
    )
  }

  // Group by category for chart
  const categoryStats = categories.map(cat => {
    const catItems = allData.filter(i => i.categoryId === cat.id)
    const expired = catItems.filter(i => i.status === 'expired').length
    const critical = catItems.filter(i => ['today', 'critical'].includes(i.status)).length
    const warning = catItems.filter(i => i.status === 'warning').length
    const value = catItems.reduce((sum, i) => sum + i.stockValue, 0)
    return { ...cat, total: catItems.length, expired, critical, warning, value }
  }).filter(c => c.total > 0).sort((a, b) => (b.expired + b.critical) - (a.expired + a.critical))

  // Export to CSV
  function handleExport() {
    const headers = ['Product', 'SKU', 'Category', 'Brand', 'Expiry Date', 'Days Left', 'Status', 'Quantity', 'Cost Price', 'Stock Value', 'Source']
    
    const rows = filteredData.map(item => [
      item.productName,
      item.sku || '',
      getCategoryName(item.categoryId),
      getBrandName(item.brandId),
      item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '',
      item.daysUntilExpiry !== null ? item.daysUntilExpiry : '',
      item.statusLabel,
      item.quantity,
      item.costPrice,
      item.stockValue.toFixed(2),
      item.source
    ])

    const csvContent = [
      `Stock Expiry Report - ${new Date().toLocaleDateString()}`,
      `View: ${viewMode === 'products' ? 'By Products' : 'By Purchase Batches'}`,
      '',
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stock-expiry-report-${viewMode}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Print function
  function handlePrint() {
    const printContent = printRef.current
    const printWindow = window.open('', '', 'height=600,width=800')
    printWindow.document.write('<html><head><title>Stock Expiry Report</title>')
    printWindow.document.write('<style>')
    printWindow.document.write(`
      body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
      h1 { color: #059669; margin-bottom: 5px; }
      .subtitle { color: #666; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background-color: #059669; color: white; }
      tr:nth-child(even) { background-color: #f9f9f9; }
      .summary { display: flex; gap: 20px; margin-bottom: 20px; flex-wrap: wrap; }
      .summary-card { padding: 15px; border-radius: 8px; min-width: 150px; }
      .expired { background: #fef2f2; border: 1px solid #fecaca; }
      .critical { background: #fef3c7; border: 1px solid #fde68a; }
      .warning { background: #fffbeb; border: 1px solid #fef3c7; }
      .total { background: #f0fdf4; border: 1px solid #bbf7d0; }
      .status-expired { color: #dc2626; font-weight: bold; }
      .status-critical { color: #ea580c; font-weight: bold; }
      .status-warning { color: #ca8a04; }
      .status-ok { color: #16a34a; }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    `)
    printWindow.document.write('</style></head><body>')
    printWindow.document.write(`<h1>📦 Stock Expiry Report</h1>`)
    printWindow.document.write(`<p class="subtitle">${business?.name || 'Business'} | Generated: ${new Date().toLocaleString()}</p>`)
    
    // Summary
    printWindow.document.write('<div class="summary">')
    printWindow.document.write(`<div class="summary-card expired"><strong>Expired</strong><br>${expiredItems.length} items<br>${business.currency} ${totalExpiredValue.toLocaleString()}</div>`)
    printWindow.document.write(`<div class="summary-card critical"><strong>Critical (7 days)</strong><br>${criticalItems.length} items</div>`)
    printWindow.document.write(`<div class="summary-card warning"><strong>Warning (30 days)</strong><br>${warningItems.length} items</div>`)
    printWindow.document.write(`<div class="summary-card total"><strong>Total At Risk</strong><br>${totalAtRiskQty} units<br>${business.currency} ${totalAtRiskValue.toLocaleString()}</div>`)
    printWindow.document.write('</div>')
    
    // Table
    printWindow.document.write('<table>')
    printWindow.document.write('<thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Expiry Date</th><th>Days Left</th><th>Status</th><th>Qty</th><th>Stock Value</th><th>Source</th></tr></thead>')
    printWindow.document.write('<tbody>')
    filteredData.forEach(item => {
      const statusClass = item.status === 'expired' ? 'status-expired' : 
                         ['today', 'critical'].includes(item.status) ? 'status-critical' : 
                         item.status === 'warning' ? 'status-warning' : 'status-ok'
      printWindow.document.write(`<tr>
        <td>${item.productName}</td>
        <td>${item.sku || '-'}</td>
        <td>${getCategoryName(item.categoryId)}</td>
        <td>${item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '-'}</td>
        <td class="${statusClass}">${item.daysUntilExpiry !== null ? item.daysUntilExpiry : '-'}</td>
        <td class="${statusClass}">${item.statusLabel}</td>
        <td>${item.quantity}</td>
        <td>${business.currency} ${item.stockValue.toLocaleString()}</td>
        <td>${item.source}</td>
      </tr>`)
    })
    printWindow.document.write('</tbody></table>')
    printWindow.document.write('</body></html>')
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  return (
    <div className="space-y-6" ref={printRef}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Stock Expiry Report</h1>
          <p className="text-slate-400 text-sm">Track product expiration dates and manage inventory</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <span className="text-xl">🚨</span>
            </div>
            <div>
              <p className="text-red-400 text-sm font-medium">Expired</p>
              <p className="text-2xl font-bold text-white">{expiredItems.length}</p>
              <p className="text-red-400 text-xs">{business.currency} {totalExpiredValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-orange-900/30 border border-orange-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <span className="text-xl">⚠️</span>
            </div>
            <div>
              <p className="text-orange-400 text-sm font-medium">Critical (≤7 days)</p>
              <p className="text-2xl font-bold text-white">{criticalItems.length}</p>
              <p className="text-orange-400 text-xs">{criticalItems.reduce((s, i) => s + i.quantity, 0)} units</p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <span className="text-xl">⏰</span>
            </div>
            <div>
              <p className="text-yellow-400 text-sm font-medium">Warning (≤30 days)</p>
              <p className="text-2xl font-bold text-white">{warningItems.length}</p>
              <p className="text-yellow-400 text-xs">{warningItems.reduce((s, i) => s + i.quantity, 0)} units</p>
            </div>
          </div>
        </div>
        <div className="bg-cyan-900/30 border border-cyan-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
            <div>
              <p className="text-cyan-400 text-sm font-medium">Attention (≤90 days)</p>
              <p className="text-2xl font-bold text-white">{attentionItems.length}</p>
              <p className="text-cyan-400 text-xs">{attentionItems.reduce((s, i) => s + i.quantity, 0)} units</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <span className="text-xl">💰</span>
            </div>
            <div>
              <p className="text-emerald-400 text-sm font-medium">Total At Risk</p>
              <p className="text-2xl font-bold text-white">{totalAtRiskQty}</p>
              <p className="text-emerald-400 text-xs">{business.currency} {totalAtRiskValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Tabs & Filters */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl">
        <div className="p-4 border-b border-slate-700/50">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-4 mb-4">
            <span className="text-slate-400 text-sm">View:</span>
            <div className="flex bg-slate-900 rounded-lg p-1">
              <button
                onClick={() => setViewMode('products')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'products'
                    ? 'bg-emerald-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                📦 By Products
              </button>
              <button
                onClick={() => setViewMode('batches')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'batches'
                    ? 'bg-emerald-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                📋 By Purchase Batches
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              id="serFilterDays"
              name="serFilterDays"
              aria-label="Filter by expiry date range"
              value={filterDays}
              onChange={(e) => setFilterDays(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Expiry Dates</option>
              <option value="expired">Expired Only</option>
              <option value="7">Expiring in 7 Days</option>
              <option value="30">Expiring in 30 Days</option>
              <option value="60">Expiring in 60 Days</option>
              <option value="90">Expiring in 90 Days</option>
            </select>

            <select
              id="serFilterStatus"
              name="serFilterStatus"
              aria-label="Filter by expiry status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Status</option>
              <option value="expired">🚨 Expired</option>
              <option value="critical">⚠️ Critical</option>
              <option value="warning">⏰ Warning</option>
              <option value="attention">📊 Attention</option>
              <option value="ok">✅ OK</option>
            </select>

            <select
              id="serFilterCategory"
              name="serFilterCategory"
              aria-label="Filter by category"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              id="serFilterBrand"
              name="serFilterBrand"
              aria-label="Filter by brand"
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Brands</option>
              {brands.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>

            <div className="flex-1"></div>

            <div className="relative">
              <input
                id="serSearch"
                name="serSearch"
                autoComplete="off"
                aria-label="Search stock expiry products"
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm w-64 focus:outline-none focus:border-emerald-500 pl-10"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-900/50">
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Product</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">SKU</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Category</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Expiry Date</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Days Left</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Status</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Quantity</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Stock Value</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Source</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center gap-3">
                      <span className="text-4xl">📦</span>
                      <p>No expiry data found</p>
                      <p className="text-sm text-slate-600">Add expiry dates to products or purchases to see them here</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => (
                  <tr key={item.id || idx} className={`border-t border-slate-700/50 hover:bg-slate-800/30 ${
                    item.status === 'expired' ? 'bg-red-900/10' : 
                    ['today', 'critical'].includes(item.status) ? 'bg-orange-900/10' : ''
                  }`}>
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{item.productName}</p>
                    </td>
                    <td className="px-4 py-3 text-cyan-400 font-mono text-sm">{item.sku || '-'}</td>
                    <td className="px-4 py-3 text-slate-300">{getCategoryName(item.categoryId)}</td>
                    <td className="px-4 py-3 text-white">
                      {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${
                        item.daysUntilExpiry < 0 ? 'text-red-400' :
                        item.daysUntilExpiry <= 7 ? 'text-orange-400' :
                        item.daysUntilExpiry <= 30 ? 'text-yellow-400' :
                        'text-emerald-400'
                      }`}>
                        {item.daysUntilExpiry !== null ? (
                          item.daysUntilExpiry < 0 ? `${Math.abs(item.daysUntilExpiry)} days ago` : 
                          item.daysUntilExpiry === 0 ? 'Today' : 
                          `${item.daysUntilExpiry} days`
                        ) : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ExpiryBadge status={item.status} label={item.statusLabel} color={item.statusColor} />
                    </td>
                    <td className="px-4 py-3 text-right text-white font-medium">{item.quantity}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={item.status === 'expired' ? 'text-red-400 font-medium' : 'text-emerald-400'}>
                        {business.currency} {item.stockValue.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-sm">{item.source}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        {filteredData.length > 0 && (
          <div className="p-4 border-t border-slate-700/50 flex items-center justify-between">
            <span className="text-slate-400 text-sm">
              Showing {filteredData.length} of {allData.length} entries
            </span>
            <div className="flex items-center gap-4">
              <span className="text-slate-400 text-sm">
                Total Value: <span className="text-white font-medium">{business.currency} {filteredData.reduce((s, i) => s + i.stockValue, 0).toLocaleString()}</span>
              </span>
              <span className="text-slate-400 text-sm">
                Total Qty: <span className="text-white font-medium">{filteredData.reduce((s, i) => s + i.quantity, 0).toLocaleString()}</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By Category */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            📊 Expiry by Category
          </h3>
          {categoryStats.length === 0 ? (
            <p className="text-slate-400 text-sm">No category data available</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {categoryStats.map(cat => (
                <div key={cat.id} className="p-3 bg-slate-900/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{cat.name}</span>
                    <span className="text-slate-400 text-sm">{cat.total} items</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {cat.expired > 0 && (
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full">
                        {cat.expired} expired
                      </span>
                    )}
                    {cat.critical > 0 && (
                      <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full">
                        {cat.critical} critical
                      </span>
                    )}
                    {cat.warning > 0 && (
                      <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full">
                        {cat.warning} warning
                      </span>
                    )}
                    <span className="ml-auto text-slate-400">
                      {business.currency} {cat.value.toLocaleString()}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden flex">
                    {cat.expired > 0 && (
                      <div 
                        className="bg-red-500 h-full" 
                        style={{ width: `${(cat.expired / cat.total) * 100}%` }}
                      />
                    )}
                    {cat.critical > 0 && (
                      <div 
                        className="bg-orange-500 h-full" 
                        style={{ width: `${(cat.critical / cat.total) * 100}%` }}
                      />
                    )}
                    {cat.warning > 0 && (
                      <div 
                        className="bg-yellow-500 h-full" 
                        style={{ width: `${(cat.warning / cat.total) * 100}%` }}
                      />
                    )}
                    <div 
                      className="bg-emerald-500 h-full flex-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expiry Timeline */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            📅 Expiry Timeline
          </h3>
          <div className="space-y-4">
            {/* Already Expired */}
            <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🚨</span>
                  <div>
                    <p className="text-red-400 font-medium">Already Expired</p>
                    <p className="text-slate-400 text-sm">{expiredItems.length} products</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold">{totalExpiredQty} units</p>
                  <p className="text-red-400 text-sm">{business.currency} {totalExpiredValue.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Next 7 Days */}
            <div className="p-4 bg-orange-900/20 border border-orange-500/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="text-orange-400 font-medium">Next 7 Days</p>
                    <p className="text-slate-400 text-sm">{criticalItems.length} products</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold">{criticalItems.reduce((s, i) => s + i.quantity, 0)} units</p>
                  <p className="text-orange-400 text-sm">{business.currency} {criticalItems.reduce((s, i) => s + i.stockValue, 0).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Next 30 Days */}
            <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⏰</span>
                  <div>
                    <p className="text-yellow-400 font-medium">Next 30 Days</p>
                    <p className="text-slate-400 text-sm">{warningItems.length} products</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold">{warningItems.reduce((s, i) => s + i.quantity, 0)} units</p>
                  <p className="text-yellow-400 text-sm">{business.currency} {warningItems.reduce((s, i) => s + i.stockValue, 0).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Next 90 Days */}
            <div className="p-4 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📊</span>
                  <div>
                    <p className="text-cyan-400 font-medium">Next 90 Days</p>
                    <p className="text-slate-400 text-sm">{attentionItems.length} products</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold">{attentionItems.reduce((s, i) => s + i.quantity, 0)} units</p>
                  <p className="text-cyan-400 text-sm">{business.currency} {attentionItems.reduce((s, i) => s + i.stockValue, 0).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Safe */}
            <div className="p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="text-emerald-400 font-medium">Safe (90+ days)</p>
                    <p className="text-slate-400 text-sm">{okItems.length} products</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold">{okItems.reduce((s, i) => s + i.quantity, 0)} units</p>
                  <p className="text-emerald-400 text-sm">{business.currency} {okItems.reduce((s, i) => s + i.stockValue, 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {(expiredItems.length > 0 || criticalItems.length > 0) && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💡</span>
            <div className="flex-1">
              <p className="text-white font-medium">Action Required</p>
              <p className="text-slate-400 text-sm">
                You have {expiredItems.length} expired products and {criticalItems.length} products expiring within 7 days.
                Consider running a clearance sale or removing expired items from inventory.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}