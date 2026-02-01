import { useState, useEffect } from 'react'
import { useApp } from '../Context/AppContext'

export default function Stockadjustmentreport() {
  const { state } = useApp()
  const { stockAdjustments = [], products = [], business } = state
  const currency = business?.currency || 'Rs'

  // Filters
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [adjustmentType, setAdjustmentType] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('summary') // summary, detailed, by-product
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' })

  // Get product details
  const getProduct = (id) => products.find(p => p.id === id) || { name: 'Unknown Product', sku: '-', category: '-' }

  // Filter adjustments
  const filteredAdjustments = stockAdjustments.filter(adj => {
    const adjDate = new Date(adj.date || adj.createdAt)
    const startDate = new Date(dateRange.start)
    const endDate = new Date(dateRange.end)
    endDate.setHours(23, 59, 59, 999)

    const matchesDate = adjDate >= startDate && adjDate <= endDate
    const matchesType = adjustmentType === 'all' || adj.adjustmentType === adjustmentType
    const matchesSearch = adj.referenceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         adj.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         adj.location?.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Check if selected product is in this adjustment
    const matchesProduct = selectedProduct === 'all' || 
                          (adj.items || []).some(item => item.productId === selectedProduct)

    return matchesDate && matchesType && matchesSearch && matchesProduct
  })

  // Sort adjustments
  const sortedAdjustments = [...filteredAdjustments].sort((a, b) => {
    let aVal, bVal
    switch (sortConfig.key) {
      case 'date':
        aVal = new Date(a.date || a.createdAt)
        bVal = new Date(b.date || b.createdAt)
        break
      case 'totalAmount':
        aVal = a.totalAmount || 0
        bVal = b.totalAmount || 0
        break
      case 'netLoss':
        aVal = (a.totalAmount || 0) - (a.totalAmountRecovered || 0)
        bVal = (b.totalAmount || 0) - (b.totalAmountRecovered || 0)
        break
      case 'referenceNo':
        aVal = a.referenceNo || ''
        bVal = b.referenceNo || ''
        break
      default:
        aVal = a[sortConfig.key]
        bVal = b[sortConfig.key]
    }
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  // Calculate summary statistics
  const totalAdjustments = filteredAdjustments.length
  const normalAdjustments = filteredAdjustments.filter(a => a.adjustmentType === 'normal')
  const abnormalAdjustments = filteredAdjustments.filter(a => a.adjustmentType === 'abnormal')
  
  const totalAmount = filteredAdjustments.reduce((sum, a) => sum + (a.totalAmount || 0), 0)
  const totalRecovered = filteredAdjustments.reduce((sum, a) => sum + (a.totalAmountRecovered || 0), 0)
  const netLoss = totalAmount - totalRecovered

  // Calculate stock changes
  const totalStockAdded = filteredAdjustments.reduce((sum, adj) => {
    return sum + (adj.items || []).reduce((itemSum, item) => {
      return itemSum + (item.quantity > 0 ? item.quantity : 0)
    }, 0)
  }, 0)

  const totalStockRemoved = filteredAdjustments.reduce((sum, adj) => {
    return sum + (adj.items || []).reduce((itemSum, item) => {
      return itemSum + (item.quantity < 0 ? Math.abs(item.quantity) : 0)
    }, 0)
  }, 0)

  // Group by product for product view
  const productAdjustments = {}
  filteredAdjustments.forEach(adj => {
    (adj.items || []).forEach(item => {
      if (!productAdjustments[item.productId]) {
        const product = getProduct(item.productId)
        productAdjustments[item.productId] = {
          productId: item.productId,
          productName: product.name,
          sku: product.sku,
          adjustments: [],
          totalQuantityAdded: 0,
          totalQuantityRemoved: 0,
          totalValue: 0
        }
      }
      productAdjustments[item.productId].adjustments.push({
        ...adj,
        itemQuantity: item.quantity,
        itemValue: item.subtotal || 0
      })
      if (item.quantity > 0) {
        productAdjustments[item.productId].totalQuantityAdded += item.quantity
      } else {
        productAdjustments[item.productId].totalQuantityRemoved += Math.abs(item.quantity)
      }
      productAdjustments[item.productId].totalValue += item.subtotal || 0
    })
  })

  const productList = Object.values(productAdjustments).sort((a, b) => b.totalValue - a.totalValue)

  // Group by date for trend chart
  const dailyData = {}
  filteredAdjustments.forEach(adj => {
    const date = new Date(adj.date || adj.createdAt).toLocaleDateString()
    if (!dailyData[date]) {
      dailyData[date] = { date, normal: 0, abnormal: 0, totalLoss: 0, recovered: 0 }
    }
    if (adj.adjustmentType === 'normal') {
      dailyData[date].normal++
    } else {
      dailyData[date].abnormal++
    }
    dailyData[date].totalLoss += (adj.totalAmount || 0) - (adj.totalAmountRecovered || 0)
    dailyData[date].recovered += adj.totalAmountRecovered || 0
  })

  const trendData = Object.values(dailyData).sort((a, b) => new Date(a.date) - new Date(b.date))

  // Top reasons for adjustments
  const reasonCounts = {}
  filteredAdjustments.forEach(adj => {
    const reason = adj.reason || 'No reason specified'
    if (!reasonCounts[reason]) {
      reasonCounts[reason] = { reason, count: 0, value: 0 }
    }
    reasonCounts[reason].count++
    reasonCounts[reason].value += (adj.totalAmount || 0) - (adj.totalAmountRecovered || 0)
  })
  const topReasons = Object.values(reasonCounts).sort((a, b) => b.value - a.value).slice(0, 5)

  // Get unique products that have adjustments
  const productsWithAdjustments = [...new Set(
    stockAdjustments.flatMap(adj => (adj.items || []).map(item => item.productId))
  )].map(id => {
    const product = getProduct(id)
    return { id, name: product.name }
  }).sort((a, b) => a.name.localeCompare(b.name))

  function handleSort(key) {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  function exportToCSV() {
    const headers = ['Date', 'Reference No', 'Type', 'Location', 'Products', 'Total Amount', 'Recovered', 'Net Loss', 'Reason', 'Added By']
    const rows = sortedAdjustments.map(adj => {
      const productNames = (adj.items || []).map(item => {
        const p = getProduct(item.productId)
        return `${p.name} (${item.quantity > 0 ? '+' : ''}${item.quantity})`
      }).join('; ')
      
      return [
        new Date(adj.date || adj.createdAt).toLocaleDateString(),
        adj.referenceNo || '-',
        adj.adjustmentType === 'normal' ? 'Normal' : 'Abnormal',
        adj.location || '-',
        productNames,
        (adj.totalAmount || 0).toFixed(2),
        (adj.totalAmountRecovered || 0).toFixed(2),
        ((adj.totalAmount || 0) - (adj.totalAmountRecovered || 0)).toFixed(2),
        adj.reason || '-',
        adj.addedBy || 'Admin'
      ]
    })

    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stock-adjustment-report-${dateRange.start}-to-${dateRange.end}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Max value for chart scaling
  const maxLoss = Math.max(...trendData.map(d => d.totalLoss), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Stock Adjustment Report</h1>
          <p className="text-slate-400 text-sm">Analyze inventory adjustments and track losses</p>
        </div>
        <div className="flex gap-2">
          <button
          onClick={exportToCSV}
          className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </button>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print
        </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Adjustment Type</label>
            <select
              value={adjustmentType}
              onChange={(e) => setAdjustmentType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="all">All Types</option>
              <option value="normal">Normal</option>
              <option value="abnormal">Abnormal</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Product</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="all">All Products</option>
              {productsWithAdjustments.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ref#, reason, location..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Total Adjustments</p>
              <p className="text-xl font-bold text-white">{totalAdjustments}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Normal</p>
              <p className="text-xl font-bold text-emerald-400">{normalAdjustments.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Abnormal</p>
              <p className="text-xl font-bold text-orange-400">{abnormalAdjustments.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Total Amount</p>
              <p className="text-lg font-bold text-cyan-400">{currency} {totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Recovered</p>
              <p className="text-lg font-bold text-green-400">{currency} {totalRecovered.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Net Loss</p>
              <p className="text-lg font-bold text-red-400">{currency} {netLoss.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Movement Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <h3 className="text-white font-medium mb-3">Stock Movement</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Stock Added (+)</span>
              <span className="text-emerald-400 font-medium">+{totalStockAdded.toLocaleString()} units</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Stock Removed (-)</span>
              <span className="text-red-400 font-medium">-{totalStockRemoved.toLocaleString()} units</span>
            </div>
            <hr className="border-slate-700" />
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">Net Change</span>
              <span className={`font-bold ${totalStockAdded - totalStockRemoved >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {totalStockAdded - totalStockRemoved >= 0 ? '+' : ''}{(totalStockAdded - totalStockRemoved).toLocaleString()} units
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <h3 className="text-white font-medium mb-3">Top Reasons for Adjustments</h3>
          {topReasons.length === 0 ? (
            <p className="text-slate-500 text-sm">No adjustments in selected period</p>
          ) : (
            <div className="space-y-2">
              {topReasons.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-slate-300 truncate flex-1 mr-2">{item.reason}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">{item.count}x</span>
                    <span className="text-red-400 font-medium">{currency} {item.value.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Trend Chart */}
      {trendData.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <h3 className="text-white font-medium mb-4">Adjustment Trend (Net Loss)</h3>
          <div className="h-48 flex items-end gap-1">
            {trendData.slice(-30).map((day, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div 
                  className="w-full bg-red-500/60 rounded-t transition-all hover:bg-red-500"
                  style={{ height: `${Math.max((day.totalLoss / maxLoss) * 100, 2)}%` }}
                />
                <span className="text-slate-500 text-xs rotate-45 origin-left whitespace-nowrap hidden lg:block">
                  {day.date.slice(0, 5)}
                </span>
                <div className="absolute bottom-full mb-2 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  <div className="text-white">{day.date}</div>
                  <div className="text-slate-400">Normal: {day.normal} | Abnormal: {day.abnormal}</div>
                  <div className="text-red-400">Loss: {currency} {day.totalLoss.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View Mode Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode('summary')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'summary' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Summary View
        </button>
        <button
          onClick={() => setViewMode('detailed')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'detailed' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Detailed View
        </button>
        <button
          onClick={() => setViewMode('by-product')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'by-product' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          By Product
        </button>
      </div>

      {/* Summary View Table */}
      {viewMode === 'summary' && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-900/50">
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm cursor-pointer hover:text-white" onClick={() => handleSort('date')}>
                    Date {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm cursor-pointer hover:text-white" onClick={() => handleSort('referenceNo')}>
                    Reference No {sortConfig.key === 'referenceNo' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Type</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Location</th>
                  <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Items</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm cursor-pointer hover:text-white" onClick={() => handleSort('totalAmount')}>
                    Total Amount {sortConfig.key === 'totalAmount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Recovered</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm cursor-pointer hover:text-white" onClick={() => handleSort('netLoss')}>
                    Net Loss {sortConfig.key === 'netLoss' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedAdjustments.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-slate-500">No adjustments found for selected filters</td>
                  </tr>
                ) : (
                  sortedAdjustments.map(adj => {
                    const loss = (adj.totalAmount || 0) - (adj.totalAmountRecovered || 0)
                    return (
                      <tr key={adj.id} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                        <td className="px-4 py-3 text-white">{new Date(adj.date || adj.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-cyan-400 font-medium">{adj.referenceNo || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            adj.adjustmentType === 'normal' 
                              ? 'bg-emerald-500/20 text-emerald-400' 
                              : 'bg-orange-500/20 text-orange-400'
                          }`}>
                            {adj.adjustmentType === 'normal' ? 'Normal' : 'Abnormal'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300">{adj.location || '-'}</td>
                        <td className="px-4 py-3 text-center text-slate-300">{(adj.items || []).length}</td>
                        <td className="px-4 py-3 text-right text-white">{currency} {(adj.totalAmount || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-emerald-400">{currency} {(adj.totalAmountRecovered || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-red-400 font-medium">{currency} {loss.toLocaleString()}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
              {sortedAdjustments.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-900/50 border-t border-slate-700">
                    <td colSpan="5" className="px-4 py-3 text-white font-medium">Total ({sortedAdjustments.length} adjustments)</td>
                    <td className="px-4 py-3 text-right text-white font-bold">{currency} {totalAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-emerald-400 font-bold">{currency} {totalRecovered.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-red-400 font-bold">{currency} {netLoss.toLocaleString()}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Detailed View Table */}
      {viewMode === 'detailed' && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-900/50">
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Date</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Reference</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Type</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Product</th>
                  <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Quantity</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Unit Price</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Subtotal</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Reason</th>
                </tr>
              </thead>
              <tbody>
                {sortedAdjustments.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-slate-500">No adjustments found</td>
                  </tr>
                ) : (
                  sortedAdjustments.flatMap(adj => 
                    (adj.items || []).map((item, idx) => {
                      const product = getProduct(item.productId)
                      return (
                        <tr key={`${adj.id}-${idx}`} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                          <td className="px-4 py-3 text-white">{new Date(adj.date || adj.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-cyan-400">{adj.referenceNo || '-'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              adj.adjustmentType === 'normal' 
                                ? 'bg-emerald-500/20 text-emerald-400' 
                                : 'bg-orange-500/20 text-orange-400'
                            }`}>
                              {adj.adjustmentType === 'normal' ? 'Normal' : 'Abnormal'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-white">{product.name}</div>
                            <div className="text-slate-500 text-xs">SKU: {product.sku}</div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-medium ${item.quantity > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {item.quantity > 0 ? '+' : ''}{item.quantity}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-300">{currency} {(item.unitPrice || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-cyan-400">{currency} {(item.subtotal || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-slate-400 text-sm max-w-[200px] truncate">{adj.reason || '-'}</td>
                        </tr>
                      )
                    })
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* By Product View */}
      {viewMode === 'by-product' && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-900/50">
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Product</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">SKU</th>
                  <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Adjustments</th>
                  <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Qty Added</th>
                  <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Qty Removed</th>
                  <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Net Change</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Total Value</th>
                </tr>
              </thead>
              <tbody>
                {productList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-slate-500">No product adjustments found</td>
                  </tr>
                ) : (
                  productList.map(item => {
                    const netChange = item.totalQuantityAdded - item.totalQuantityRemoved
                    return (
                      <tr key={item.productId} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                        <td className="px-4 py-3 text-white font-medium">{item.productName}</td>
                        <td className="px-4 py-3 text-slate-400">{item.sku}</td>
                        <td className="px-4 py-3 text-center text-cyan-400">{item.adjustments.length}</td>
                        <td className="px-4 py-3 text-center text-emerald-400">+{item.totalQuantityAdded}</td>
                        <td className="px-4 py-3 text-center text-red-400">-{item.totalQuantityRemoved}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-medium ${netChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {netChange >= 0 ? '+' : ''}{netChange}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-cyan-400 font-medium">{currency} {item.totalValue.toLocaleString()}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
              {productList.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-900/50 border-t border-slate-700">
                    <td colSpan="3" className="px-4 py-3 text-white font-medium">Total ({productList.length} products)</td>
                    <td className="px-4 py-3 text-center text-emerald-400 font-bold">+{totalStockAdded}</td>
                    <td className="px-4 py-3 text-center text-red-400 font-bold">-{totalStockRemoved}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${totalStockAdded - totalStockRemoved >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {totalStockAdded - totalStockRemoved >= 0 ? '+' : ''}{totalStockAdded - totalStockRemoved}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-cyan-400 font-bold">{currency} {totalAmount.toLocaleString()}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Info Footer */}
      <div className="text-center text-slate-500 text-sm">
        Showing data from {new Date(dateRange.start).toLocaleDateString()} to {new Date(dateRange.end).toLocaleDateString()}
      </div>
    </div>
  )
}