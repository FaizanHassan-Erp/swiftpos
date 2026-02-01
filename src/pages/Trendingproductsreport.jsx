import { useState, useMemo } from 'react'
import { useApp } from '../Context/AppContext'

export default function Trendingproductsreport() {
  const { state } = useApp()
  const { products, sales, categories, brands, business } = state

  // Date filters
  const [dateRange, setDateRange] = useState('this_month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterBrand, setFilterBrand] = useState('')
  const [activeTab, setActiveTab] = useState('top_selling')
  const [viewMode, setViewMode] = useState('table') // table, cards

  // Helper functions
  function getCategoryName(id) {
    return categories.find(c => c.id === id)?.name || '-'
  }

  function getBrandName(id) {
    return brands.find(b => b.id === id)?.name || '-'
  }

  function getProduct(id) {
    return products.find(p => p.id === id)
  }

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

  // Filter sales by date range
  const filteredSales = useMemo(() => {
    const { start, end } = getDateRange()
    return (sales || []).filter(sale => {
      const saleDate = new Date(sale.date || sale.createdAt)
      return saleDate >= start && saleDate <= end
    })
  }, [sales, dateRange, startDate, endDate])

  // Get previous period sales for comparison
  const previousPeriodSales = useMemo(() => {
    const { start, end } = getDateRange()
    const periodLength = end - start
    const prevStart = new Date(start.getTime() - periodLength)
    const prevEnd = new Date(start.getTime() - 1)
    
    return (sales || []).filter(sale => {
      const saleDate = new Date(sale.date || sale.createdAt)
      return saleDate >= prevStart && saleDate <= prevEnd
    })
  }, [sales, dateRange, startDate, endDate])

  // Calculate product statistics
  const productStats = useMemo(() => {
    const statsMap = new Map()

    // Initialize all products
    products.forEach(product => {
      // Apply filters
      if (filterCategory && product.categoryId !== parseInt(filterCategory)) return
      if (filterBrand && product.brandId !== parseInt(filterBrand)) return

      statsMap.set(product.id, {
        id: product.id,
        name: product.name,
        sku: product.sku,
        categoryId: product.categoryId,
        brandId: product.brandId,
        costPrice: product.costPrice || 0,
        sellingPrice: product.sellingPrice || 0,
        currentStock: product.currentStock || 0,
        quantitySold: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
        salesCount: 0,
        avgOrderQty: 0,
        prevQuantitySold: 0,
        prevRevenue: 0
      })
    })

    // Aggregate current period sales
    filteredSales.forEach(sale => {
      (sale.items || []).forEach(item => {
        if (statsMap.has(item.productId)) {
          const stats = statsMap.get(item.productId)
          const product = getProduct(item.productId)
          const quantity = item.quantity || 0
          const revenue = item.subtotal || (quantity * (item.unitPrice || item.sellingPrice || 0))
          const cost = quantity * (product?.costPrice || 0)

          stats.quantitySold += quantity
          stats.revenue += revenue
          stats.cost += cost
          stats.profit += (revenue - cost)
          stats.salesCount += 1
        }
      })
    })

    // Aggregate previous period sales for comparison
    previousPeriodSales.forEach(sale => {
      (sale.items || []).forEach(item => {
        if (statsMap.has(item.productId)) {
          const stats = statsMap.get(item.productId)
          const quantity = item.quantity || 0
          const revenue = item.subtotal || (quantity * (item.unitPrice || item.sellingPrice || 0))

          stats.prevQuantitySold += quantity
          stats.prevRevenue += revenue
        }
      })
    })

    // Calculate averages and growth
    statsMap.forEach(stats => {
      stats.avgOrderQty = stats.salesCount > 0 ? stats.quantitySold / stats.salesCount : 0
      stats.profitMargin = stats.revenue > 0 ? (stats.profit / stats.revenue) * 100 : 0
      stats.quantityGrowth = stats.prevQuantitySold > 0 
        ? ((stats.quantitySold - stats.prevQuantitySold) / stats.prevQuantitySold) * 100 
        : (stats.quantitySold > 0 ? 100 : 0)
      stats.revenueGrowth = stats.prevRevenue > 0 
        ? ((stats.revenue - stats.prevRevenue) / stats.prevRevenue) * 100 
        : (stats.revenue > 0 ? 100 : 0)
    })

    return Array.from(statsMap.values())
  }, [products, filteredSales, previousPeriodSales, filterCategory, filterBrand])

  // Sort products based on active tab
  const sortedProducts = useMemo(() => {
    const sorted = [...productStats]
    
    switch (activeTab) {
      case 'top_selling':
        return sorted.sort((a, b) => b.quantitySold - a.quantitySold)
      case 'top_revenue':
        return sorted.sort((a, b) => b.revenue - a.revenue)
      case 'most_profitable':
        return sorted.sort((a, b) => b.profit - a.profit)
      case 'best_margin':
        return sorted.sort((a, b) => b.profitMargin - a.profitMargin)
      case 'trending_up':
        return sorted.sort((a, b) => b.quantityGrowth - a.quantityGrowth)
      case 'slow_moving':
        return sorted.sort((a, b) => a.quantitySold - b.quantitySold)
      default:
        return sorted
    }
  }, [productStats, activeTab])

  // Summary statistics
  const summary = useMemo(() => {
    const totalRevenue = productStats.reduce((sum, p) => sum + p.revenue, 0)
    const totalCost = productStats.reduce((sum, p) => sum + p.cost, 0)
    const totalProfit = productStats.reduce((sum, p) => sum + p.profit, 0)
    const totalQuantity = productStats.reduce((sum, p) => sum + p.quantitySold, 0)
    const productsWithSales = productStats.filter(p => p.quantitySold > 0).length
    const productsWithoutSales = productStats.filter(p => p.quantitySold === 0).length

    return {
      totalRevenue,
      totalCost,
      totalProfit,
      totalQuantity,
      productsWithSales,
      productsWithoutSales,
      avgProfitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
    }
  }, [productStats])

  // Sales by day for chart
  const salesByDay = useMemo(() => {
    const { start, end } = getDateRange()
    const dayMap = new Map()

    // Initialize days
    const current = new Date(start)
    while (current <= end) {
      const key = current.toISOString().split('T')[0]
      dayMap.set(key, { date: key, revenue: 0, quantity: 0 })
      current.setDate(current.getDate() + 1)
    }

    // Aggregate sales
    filteredSales.forEach(sale => {
      const saleDate = new Date(sale.date || sale.createdAt).toISOString().split('T')[0]
      if (dayMap.has(saleDate)) {
        const day = dayMap.get(saleDate)
        day.revenue += sale.total || 0
        day.quantity += (sale.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0)
      }
    })

    return Array.from(dayMap.values())
  }, [filteredSales, dateRange, startDate, endDate])

  // Top 5 for each category
  const topSelling = sortedProducts.filter(p => p.quantitySold > 0).slice(0, 5)
  const topRevenue = [...productStats].sort((a, b) => b.revenue - a.revenue).filter(p => p.revenue > 0).slice(0, 5)
  const topProfit = [...productStats].sort((a, b) => b.profit - a.profit).filter(p => p.profit > 0).slice(0, 5)
  const slowMoving = [...productStats].sort((a, b) => a.quantitySold - b.quantitySold).slice(0, 10)

  // Export to CSV
  function exportToCSV() {
    const headers = ['Rank', 'Product', 'SKU', 'Category', 'Brand', 'Qty Sold', 'Revenue', 'Cost', 'Profit', 'Margin %', 'Growth %']
    
    const rows = sortedProducts.map((p, index) => [
      index + 1,
      p.name,
      p.sku || '',
      getCategoryName(p.categoryId),
      getBrandName(p.brandId),
      p.quantitySold,
      p.revenue.toFixed(2),
      p.cost.toFixed(2),
      p.profit.toFixed(2),
      p.profitMargin.toFixed(1),
      p.quantityGrowth.toFixed(1)
    ])

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trending-products-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Print report
  function printReport() {
    window.print()
  }

  // Growth indicator
  function GrowthBadge({ value }) {
    if (value === 0) return <span className="text-slate-400">-</span>
    const isPositive = value > 0
    return (
      <span className={`flex items-center gap-1 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
        {isPositive ? '↑' : '↓'} {Math.abs(value).toFixed(1)}%
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Trending Products Report</h1>
          <p className="text-slate-400 text-sm">Analyze your best and worst performing products</p>
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

      {/* Filters */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
        <div className="flex items-center gap-2 text-cyan-400 mb-4">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="font-medium">Filters</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
            <label className="block text-sm text-slate-400 mb-1">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Brand</label>
            <select
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">All Brands</option>
              {brands.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Total Revenue</p>
              <p className="text-lg font-bold text-cyan-400">{business.currency} {summary.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Total Profit</p>
              <p className="text-lg font-bold text-emerald-400">{business.currency} {summary.totalProfit.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Items Sold</p>
              <p className="text-lg font-bold text-purple-400">{summary.totalQuantity.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Avg Margin</p>
              <p className="text-lg font-bold text-blue-400">{summary.avgProfitMargin.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Active Products</p>
              <p className="text-lg font-bold text-green-400">{summary.productsWithSales}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-xs">No Sales</p>
              <p className="text-lg font-bold text-yellow-400">{summary.productsWithoutSales}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Total Sales</p>
              <p className="text-lg font-bold text-orange-400">{filteredSales.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats - Top 5 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top Selling */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl">
          <div className="p-4 border-b border-slate-700/50">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="text-emerald-400">🏆</span> Top Selling
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {topSelling.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No sales data</p>
            ) : (
              topSelling.map((product, index) => (
                <div key={product.id} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-yellow-500 text-black' :
                    index === 1 ? 'bg-slate-400 text-black' :
                    index === 2 ? 'bg-orange-600 text-white' :
                    'bg-slate-700 text-white'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{product.name}</p>
                    <p className="text-slate-400 text-xs">{getCategoryName(product.categoryId)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 font-medium">{product.quantitySold} sold</p>
                    <p className="text-slate-500 text-xs">{business.currency} {product.revenue.toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Revenue */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl">
          <div className="p-4 border-b border-slate-700/50">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="text-cyan-400">💰</span> Top Revenue
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {topRevenue.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No sales data</p>
            ) : (
              topRevenue.map((product, index) => (
                <div key={product.id} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-yellow-500 text-black' :
                    index === 1 ? 'bg-slate-400 text-black' :
                    index === 2 ? 'bg-orange-600 text-white' :
                    'bg-slate-700 text-white'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{product.name}</p>
                    <p className="text-slate-400 text-xs">{product.quantitySold} units</p>
                  </div>
                  <div className="text-right">
                    <p className="text-cyan-400 font-medium">{business.currency} {product.revenue.toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Most Profitable */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl">
          <div className="p-4 border-b border-slate-700/50">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="text-green-400">📈</span> Most Profitable
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {topProfit.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No profit data</p>
            ) : (
              topProfit.map((product, index) => (
                <div key={product.id} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-yellow-500 text-black' :
                    index === 1 ? 'bg-slate-400 text-black' :
                    index === 2 ? 'bg-orange-600 text-white' :
                    'bg-slate-700 text-white'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{product.name}</p>
                    <p className="text-slate-400 text-xs">{product.profitMargin.toFixed(1)}% margin</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-medium">{business.currency} {product.profit.toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Detailed Table with Tabs */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl">
        {/* Tabs */}
        <div className="border-b border-slate-700/50">
          <div className="flex gap-1 p-2 overflow-x-auto">
            {[
              { id: 'top_selling', name: 'Top Selling', icon: '🏆' },
              { id: 'top_revenue', name: 'Top Revenue', icon: '💰' },
              { id: 'most_profitable', name: 'Most Profitable', icon: '📈' },
              { id: 'best_margin', name: 'Best Margin', icon: '💎' },
              { id: 'trending_up', name: 'Trending Up', icon: '🚀' },
              { id: 'slow_moving', name: 'Slow Moving', icon: '🐢' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {tab.icon} {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-900/50">
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">#</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Product</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Category</th>
                <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Qty Sold</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Revenue</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Cost</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Profit</th>
                <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Margin %</th>
                <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Growth</th>
                <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Stock</th>
              </tr>
            </thead>
            <tbody>
              {sortedProducts.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-12 text-slate-500">
                    No products found matching the filters
                  </td>
                </tr>
              ) : (
                sortedProducts.slice(0, 50).map((product, index) => (
                  <tr key={product.id} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-yellow-500 text-black' :
                        index === 1 ? 'bg-slate-400 text-black' :
                        index === 2 ? 'bg-orange-600 text-white' :
                        'bg-slate-700 text-white'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white font-medium">{product.name}</p>
                        <p className="text-slate-500 text-xs">{product.sku || '-'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{getCategoryName(product.categoryId)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-medium ${product.quantitySold > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {product.quantitySold}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-cyan-400">{business.currency} {product.revenue.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-slate-400">{business.currency} {product.cost.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={product.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {business.currency} {product.profit.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        product.profitMargin >= 30 ? 'bg-emerald-500/20 text-emerald-400' :
                        product.profitMargin >= 15 ? 'bg-yellow-500/20 text-yellow-400' :
                        product.profitMargin >= 0 ? 'bg-orange-500/20 text-orange-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {product.profitMargin.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <GrowthBadge value={product.quantityGrowth} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-medium ${
                        product.currentStock <= 0 ? 'text-red-400' :
                        product.currentStock <= 10 ? 'text-yellow-400' :
                        'text-slate-300'
                      }`}>
                        {product.currentStock}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-4 border-t border-slate-700/50">
          <span className="text-slate-400 text-sm">
            Showing top {Math.min(sortedProducts.length, 50)} of {sortedProducts.length} products
          </span>
        </div>
      </div>

      {/* Slow Moving Products Alert */}
      {slowMoving.filter(p => p.quantitySold === 0).length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-yellow-400 font-medium">Slow Moving Products Alert</h4>
              <p className="text-yellow-300/80 text-sm mt-1">
                {slowMoving.filter(p => p.quantitySold === 0).length} products had no sales in this period. Consider running promotions or reviewing pricing.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {slowMoving.filter(p => p.quantitySold === 0).slice(0, 5).map(product => (
                  <span key={product.id} className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                    {product.name}
                  </span>
                ))}
                {slowMoving.filter(p => p.quantitySold === 0).length > 5 && (
                  <span className="px-2 py-1 bg-slate-700 text-slate-400 rounded text-xs">
                    +{slowMoving.filter(p => p.quantitySold === 0).length - 5} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}