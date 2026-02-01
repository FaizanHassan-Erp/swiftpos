import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'

export default function Productpurchasereport() {
  const { state } = useApp()
  const { purchases, products, suppliers, categories, brands, business } = state

  // Filters
  const [dateRange, setDateRange] = useState('this_month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [filterProduct, setFilterProduct] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterBrand, setFilterBrand] = useState('')
  const [filterSupplier, setFilterSupplier] = useState('')
  const [viewMode, setViewMode] = useState('transactions') // transactions, products, suppliers
  const [searchTerm, setSearchTerm] = useState('')

  // Helper functions
  function getProductName(id) {
    return products.find(p => p.id === id)?.name || 'Unknown Product'
  }

  function getProduct(id) {
    return products.find(p => p.id === id)
  }

  function getSupplierName(id) {
    const supplier = suppliers.find(s => s.id === id)
    return supplier?.businessName || supplier?.name || 'Unknown Supplier'
  }

  function getCategoryName(id) {
    return categories.find(c => c.id === id)?.name || '-'
  }

  function getBrandName(id) {
    return brands.find(b => b.id === id)?.name || '-'
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

  // Filter purchases by date
  const filteredPurchases = useMemo(() => {
    const { start, end } = getDateRange()
    return (purchases || []).filter(purchase => {
      const purchaseDate = new Date(purchase.date || purchase.createdAt)
      if (purchaseDate < start || purchaseDate > end) return false
      if (filterSupplier && purchase.supplierId !== parseInt(filterSupplier)) return false
      return true
    })
  }, [purchases, dateRange, startDate, endDate, filterSupplier])

  // Extract all purchase items with purchase info
  const allPurchaseItems = useMemo(() => {
    const items = []

    filteredPurchases.forEach(purchase => {
      (purchase.items || []).forEach(item => {
        const product = getProduct(item.productId)
        if (!product) return

        // Apply product filters
        if (filterProduct && item.productId !== parseInt(filterProduct)) return
        if (filterCategory && product.categoryId !== parseInt(filterCategory)) return
        if (filterBrand && product.brandId !== parseInt(filterBrand)) return

        // Apply search filter
        if (searchTerm) {
          const search = searchTerm.toLowerCase()
          const matchesProduct = product.name.toLowerCase().includes(search) || 
                                 product.sku?.toLowerCase().includes(search)
          const matchesSupplier = getSupplierName(purchase.supplierId).toLowerCase().includes(search)
          const matchesReference = purchase.purchaseNo?.toLowerCase().includes(search) ||
                                   purchase.referenceNo?.toLowerCase().includes(search)
          if (!matchesProduct && !matchesSupplier && !matchesReference) return
        }

        const quantity = item.quantity || 0
        const unitCost = item.unitCost || item.costPrice || item.unitPrice || 0
        const sellingPrice = product.sellingPrice || 0
        const subtotal = quantity * unitCost
        const potentialRevenue = quantity * sellingPrice
        const potentialProfit = potentialRevenue - subtotal

        items.push({
          purchaseId: purchase.id,
          purchaseDate: purchase.date || purchase.createdAt,
          purchaseNo: purchase.purchaseNo || purchase.referenceNo,
          supplierId: purchase.supplierId,
          supplierName: getSupplierName(purchase.supplierId),
          productId: item.productId,
          productName: product.name,
          sku: product.sku,
          categoryId: product.categoryId,
          categoryName: getCategoryName(product.categoryId),
          brandId: product.brandId,
          brandName: getBrandName(product.brandId),
          quantity,
          unitCost,
          sellingPrice,
          subtotal,
          potentialRevenue,
          potentialProfit,
          profitMargin: potentialRevenue > 0 ? (potentialProfit / potentialRevenue) * 100 : 0
        })
      })
    })

    return items.sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate))
  }, [filteredPurchases, filterProduct, filterCategory, filterBrand, searchTerm])

  // Summary statistics
  const summary = useMemo(() => {
    const totalQuantity = allPurchaseItems.reduce((sum, item) => sum + item.quantity, 0)
    const totalCost = allPurchaseItems.reduce((sum, item) => sum + item.subtotal, 0)
    const totalPotentialRevenue = allPurchaseItems.reduce((sum, item) => sum + item.potentialRevenue, 0)
    const totalPotentialProfit = allPurchaseItems.reduce((sum, item) => sum + item.potentialProfit, 0)
    const uniqueProducts = new Set(allPurchaseItems.map(item => item.productId)).size
    const uniqueSuppliers = new Set(allPurchaseItems.map(item => item.supplierId)).size
    const transactionCount = new Set(allPurchaseItems.map(item => item.purchaseId)).size
    const avgUnitCost = totalQuantity > 0 ? totalCost / totalQuantity : 0

    return {
      totalQuantity,
      totalCost,
      totalPotentialRevenue,
      totalPotentialProfit,
      uniqueProducts,
      uniqueSuppliers,
      transactionCount,
      avgUnitCost,
      avgProfitMargin: totalPotentialRevenue > 0 ? (totalPotentialProfit / totalPotentialRevenue) * 100 : 0
    }
  }, [allPurchaseItems])

  // Product-wise summary
  const productSummary = useMemo(() => {
    const productMap = new Map()

    allPurchaseItems.forEach(item => {
      if (productMap.has(item.productId)) {
        const existing = productMap.get(item.productId)
        existing.quantity += item.quantity
        existing.totalCost += item.subtotal
        existing.potentialRevenue += item.potentialRevenue
        existing.potentialProfit += item.potentialProfit
        existing.purchaseCount += 1
        existing.suppliers.add(item.supplierId)
      } else {
        productMap.set(item.productId, {
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          categoryName: item.categoryName,
          brandName: item.brandName,
          quantity: item.quantity,
          totalCost: item.subtotal,
          potentialRevenue: item.potentialRevenue,
          potentialProfit: item.potentialProfit,
          purchaseCount: 1,
          suppliers: new Set([item.supplierId])
        })
      }
    })

    return Array.from(productMap.values())
      .map(p => ({
        ...p,
        supplierCount: p.suppliers.size,
        avgCost: p.quantity > 0 ? p.totalCost / p.quantity : 0,
        profitMargin: p.potentialRevenue > 0 ? (p.potentialProfit / p.potentialRevenue) * 100 : 0
      }))
      .sort((a, b) => b.quantity - a.quantity)
  }, [allPurchaseItems])

  // Supplier-wise summary
  const supplierSummary = useMemo(() => {
    const supplierMap = new Map()

    allPurchaseItems.forEach(item => {
      if (supplierMap.has(item.supplierId)) {
        const existing = supplierMap.get(item.supplierId)
        existing.quantity += item.quantity
        existing.totalCost += item.subtotal
        existing.potentialProfit += item.potentialProfit
        existing.purchaseCount += 1
        existing.products.add(item.productId)
      } else {
        supplierMap.set(item.supplierId, {
          supplierId: item.supplierId,
          supplierName: item.supplierName,
          quantity: item.quantity,
          totalCost: item.subtotal,
          potentialProfit: item.potentialProfit,
          purchaseCount: 1,
          products: new Set([item.productId])
        })
      }
    })

    return Array.from(supplierMap.values())
      .map(s => ({
        ...s,
        productCount: s.products.size,
        avgOrderValue: s.purchaseCount > 0 ? s.totalCost / s.purchaseCount : 0
      }))
      .sort((a, b) => b.totalCost - a.totalCost)
  }, [allPurchaseItems])

  // Export to CSV
  function exportToCSV() {
    let csvContent = ''
    
    if (viewMode === 'transactions') {
      csvContent = 'Date,Purchase No,Supplier,Product,SKU,Category,Brand,Qty,Unit Cost,Subtotal,Sell Price,Potential Profit\n'
      allPurchaseItems.forEach(item => {
        csvContent += `${new Date(item.purchaseDate).toLocaleDateString()},`
        csvContent += `${item.purchaseNo || '-'},`
        csvContent += `"${item.supplierName}",`
        csvContent += `"${item.productName}",`
        csvContent += `${item.sku || '-'},`
        csvContent += `"${item.categoryName}",`
        csvContent += `"${item.brandName}",`
        csvContent += `${item.quantity},`
        csvContent += `${item.unitCost.toFixed(2)},`
        csvContent += `${item.subtotal.toFixed(2)},`
        csvContent += `${item.sellingPrice.toFixed(2)},`
        csvContent += `${item.potentialProfit.toFixed(2)}\n`
      })
    } else if (viewMode === 'products') {
      csvContent = 'Product,SKU,Category,Brand,Qty Purchased,Total Cost,Avg Cost,Potential Profit,Margin %,Purchases,Suppliers\n'
      productSummary.forEach(p => {
        csvContent += `"${p.productName}",`
        csvContent += `${p.sku || '-'},`
        csvContent += `"${p.categoryName}",`
        csvContent += `"${p.brandName}",`
        csvContent += `${p.quantity},`
        csvContent += `${p.totalCost.toFixed(2)},`
        csvContent += `${p.avgCost.toFixed(2)},`
        csvContent += `${p.potentialProfit.toFixed(2)},`
        csvContent += `${p.profitMargin.toFixed(1)},`
        csvContent += `${p.purchaseCount},`
        csvContent += `${p.supplierCount}\n`
      })
    } else {
      csvContent = 'Supplier,Qty Supplied,Total Cost,Potential Profit,Orders,Products,Avg Order Value\n'
      supplierSummary.forEach(s => {
        csvContent += `"${s.supplierName}",`
        csvContent += `${s.quantity},`
        csvContent += `${s.totalCost.toFixed(2)},`
        csvContent += `${s.potentialProfit.toFixed(2)},`
        csvContent += `${s.purchaseCount},`
        csvContent += `${s.productCount},`
        csvContent += `${s.avgOrderValue.toFixed(2)}\n`
      })
    }

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `product-purchase-report-${viewMode}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Print report
  function printReport() {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-white">Product Purchase Report</h1>
          <p className="text-slate-400 text-sm">Detailed purchase history by product</p>
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
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 print:hidden">
        <div className="flex items-center gap-2 text-cyan-400 mb-4">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="font-medium">Filters</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
            <label className="block text-sm text-slate-400 mb-1">Product</label>
            <select
              value={filterProduct}
              onChange={(e) => setFilterProduct(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">All Products</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

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

          <div>
            <label className="block text-sm text-slate-400 mb-1">Supplier</label>
            <select
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">All Suppliers</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.businessName || s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4">
          <div className="relative">
            <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search product, supplier, purchase no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
          </div>
          <p className="text-slate-400 text-xs">Total Qty Purchased</p>
          <p className="text-xl font-bold text-purple-400">{summary.totalQuantity.toLocaleString()}</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-slate-400 text-xs">Total Cost</p>
          <p className="text-xl font-bold text-orange-400">{business.currency} {summary.totalCost.toLocaleString()}</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <p className="text-slate-400 text-xs">Potential Revenue</p>
          <p className="text-xl font-bold text-cyan-400">{business.currency} {summary.totalPotentialRevenue.toLocaleString()}</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <p className="text-slate-400 text-xs">Potential Profit</p>
          <p className="text-xl font-bold text-emerald-400">{business.currency} {summary.totalPotentialProfit.toLocaleString()}</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <p className="text-slate-400 text-xs">Products</p>
          <p className="text-xl font-bold text-blue-400">{summary.uniqueProducts}</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <p className="text-slate-400 text-xs">Suppliers</p>
          <p className="text-xl font-bold text-pink-400">{summary.uniqueSuppliers}</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <p className="text-slate-400 text-xs">Purchase Orders</p>
          <p className="text-xl font-bold text-yellow-400">{summary.transactionCount}</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-teal-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
          </div>
          <p className="text-slate-400 text-xs">Avg Margin</p>
          <p className="text-xl font-bold text-teal-400">{summary.avgProfitMargin.toFixed(1)}%</p>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl">
        <div className="border-b border-slate-700/50 p-2">
          <div className="flex gap-2">
            {[
              { id: 'transactions', name: 'Purchase Transactions', icon: '📋' },
              { id: 'products', name: 'By Product', icon: '📦' },
              { id: 'suppliers', name: 'By Supplier', icon: '🏭' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === tab.id
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {tab.icon} {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions View */}
        {viewMode === 'transactions' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-900/50">
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Date</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Purchase No</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Supplier</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Product</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Category</th>
                  <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Qty</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Unit Cost</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Subtotal</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Sell Price</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Pot. Profit</th>
                </tr>
              </thead>
              <tbody>
                {allPurchaseItems.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-12 text-slate-500">
                      No purchases found for the selected filters
                    </td>
                  </tr>
                ) : (
                  allPurchaseItems.slice(0, 100).map((item, index) => (
                    <tr key={`${item.purchaseId}-${item.productId}-${index}`} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                      <td className="px-4 py-3 text-white">{new Date(item.purchaseDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-cyan-400">{item.purchaseNo || '-'}</td>
                      <td className="px-4 py-3 text-slate-300">{item.supplierName}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-white font-medium">{item.productName}</p>
                          <p className="text-slate-500 text-xs">{item.sku || '-'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{item.categoryName}</td>
                      <td className="px-4 py-3 text-center text-white">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-slate-300">{business.currency} {item.unitCost.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-orange-400 font-medium">{business.currency} {item.subtotal.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-cyan-400">{business.currency} {item.sellingPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={item.potentialProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {business.currency} {item.potentialProfit.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {allPurchaseItems.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-900/50 border-t border-slate-700">
                    <td colSpan="5" className="px-4 py-3 text-white font-bold">Total</td>
                    <td className="px-4 py-3 text-center text-white font-bold">{summary.totalQuantity}</td>
                    <td className="px-4 py-3 text-right text-slate-400">-</td>
                    <td className="px-4 py-3 text-right text-orange-400 font-bold">{business.currency} {summary.totalCost.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-cyan-400 font-bold">{business.currency} {summary.totalPotentialRevenue.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-emerald-400 font-bold">{business.currency} {summary.totalPotentialProfit.toFixed(2)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
            {allPurchaseItems.length > 100 && (
              <div className="p-4 text-center text-slate-400 text-sm">
                Showing first 100 of {allPurchaseItems.length} records. Export CSV for full data.
              </div>
            )}
          </div>
        )}

        {/* Products View */}
        {viewMode === 'products' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-900/50">
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">#</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Product</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Category</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Brand</th>
                  <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Qty Purchased</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Total Cost</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Avg Cost</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Pot. Profit</th>
                  <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Margin</th>
                  <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Purchases</th>
                  <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Suppliers</th>
                </tr>
              </thead>
              <tbody>
                {productSummary.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="text-center py-12 text-slate-500">
                      No product purchases found
                    </td>
                  </tr>
                ) : (
                  productSummary.map((product, index) => (
                    <tr key={product.productId} className="border-t border-slate-700/50 hover:bg-slate-800/30">
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
                          <p className="text-white font-medium">{product.productName}</p>
                          <p className="text-slate-500 text-xs">{product.sku || '-'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{product.categoryName}</td>
                      <td className="px-4 py-3 text-slate-400">{product.brandName}</td>
                      <td className="px-4 py-3 text-center text-purple-400 font-medium">{product.quantity}</td>
                      <td className="px-4 py-3 text-right text-orange-400 font-medium">{business.currency} {product.totalCost.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-slate-300">{business.currency} {product.avgCost.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-emerald-400 font-medium">{business.currency} {product.potentialProfit.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          product.profitMargin >= 30 ? 'bg-emerald-500/20 text-emerald-400' :
                          product.profitMargin >= 15 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-orange-500/20 text-orange-400'
                        }`}>
                          {product.profitMargin.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-300">{product.purchaseCount}</td>
                      <td className="px-4 py-3 text-center text-slate-300">{product.supplierCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Suppliers View */}
        {viewMode === 'suppliers' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-900/50">
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">#</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Supplier</th>
                  <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Qty Supplied</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Total Cost</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Pot. Profit</th>
                  <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Orders</th>
                  <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Products</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Avg Order Value</th>
                </tr>
              </thead>
              <tbody>
                {supplierSummary.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-12 text-slate-500">
                      No supplier purchases found
                    </td>
                  </tr>
                ) : (
                  supplierSummary.map((supplier, index) => (
                    <tr key={supplier.supplierId} className="border-t border-slate-700/50 hover:bg-slate-800/30">
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
                      <td className="px-4 py-3 text-white font-medium">{supplier.supplierName}</td>
                      <td className="px-4 py-3 text-center text-purple-400 font-medium">{supplier.quantity}</td>
                      <td className="px-4 py-3 text-right text-orange-400 font-medium">{business.currency} {supplier.totalCost.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-emerald-400 font-medium">{business.currency} {supplier.potentialProfit.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center text-slate-300">{supplier.purchaseCount}</td>
                      <td className="px-4 py-3 text-center text-slate-300">{supplier.productCount}</td>
                      <td className="px-4 py-3 text-right text-yellow-400">{business.currency} {supplier.avgOrderValue.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer */}
        <div className="p-4 border-t border-slate-700/50">
          <span className="text-slate-400 text-sm">
            {viewMode === 'transactions' && `${allPurchaseItems.length} purchase items`}
            {viewMode === 'products' && `${productSummary.length} products`}
            {viewMode === 'suppliers' && `${supplierSummary.length} suppliers`}
          </span>
        </div>
      </div>
    </div>
  )
}