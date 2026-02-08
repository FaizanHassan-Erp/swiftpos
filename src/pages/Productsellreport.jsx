import { useState, useMemo } from 'react'
import { useApp } from '../Context/AppContext'

export default function Productsellreport() {
  const { state } = useApp()
  const { sales, products, customers, categories, brands, business } = state

  // Filters
  const [dateRange, setDateRange] = useState('this_month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [filterProduct, setFilterProduct] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterBrand, setFilterBrand] = useState('')
  const [filterCustomer, setFilterCustomer] = useState('')
  const [viewMode, setViewMode] = useState('transactions') // transactions, products, customers
  const [searchTerm, setSearchTerm] = useState('')

  // Helper functions
  function getProductName(id) {
    return products.find(p => p.id === id)?.name || 'Unknown Product'
  }

  function getProduct(id) {
    return products.find(p => p.id === id)
  }

  function getCustomerName(id) {
    return customers.find(c => c.id === id)?.name || 'Walk-in Customer'
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

  // Filter sales by date
  const filteredSales = useMemo(() => {
    const { start, end } = getDateRange()
    return (sales || []).filter(sale => {
      const saleDate = new Date(sale.date || sale.createdAt)
      if (saleDate < start || saleDate > end) return false
      if (filterCustomer && sale.customerId !== parseInt(filterCustomer)) return false
      return true
    })
  }, [sales, dateRange, startDate, endDate, filterCustomer])

  // Extract all sale items with sale info
  const allSaleItems = useMemo(() => {
    const items = []

    filteredSales.forEach(sale => {
      (sale.items || []).forEach(item => {
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
          const matchesCustomer = getCustomerName(sale.customerId).toLowerCase().includes(search)
          const matchesInvoice = sale.invoiceNo?.toLowerCase().includes(search)
          if (!matchesProduct && !matchesCustomer && !matchesInvoice) return
        }

        const quantity = item.quantity || 0
        const unitPrice = item.unitPrice || item.sellingPrice || 0
        const costPrice = item.costPrice || product.costPrice || 0
        const discount = item.discount || 0
        const subtotal = item.subtotal || (quantity * unitPrice) - discount
        const cost = quantity * costPrice
        const profit = subtotal - cost

        items.push({
          saleId: sale.id,
          saleDate: sale.date || sale.createdAt,
          invoiceNo: sale.invoiceNo,
          customerId: sale.customerId,
          customerName: getCustomerName(sale.customerId),
          productId: item.productId,
          productName: product.name,
          sku: product.sku,
          categoryId: product.categoryId,
          categoryName: getCategoryName(product.categoryId),
          brandId: product.brandId,
          brandName: getBrandName(product.brandId),
          quantity,
          unitPrice,
          costPrice,
          discount,
          subtotal,
          cost,
          profit,
          profitMargin: subtotal > 0 ? (profit / subtotal) * 100 : 0
        })
      })
    })

    return items.sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate))
  }, [filteredSales, filterProduct, filterCategory, filterBrand, searchTerm])

  // Summary statistics
  const summary = useMemo(() => {
    const totalQuantity = allSaleItems.reduce((sum, item) => sum + item.quantity, 0)
    const totalRevenue = allSaleItems.reduce((sum, item) => sum + item.subtotal, 0)
    const totalCost = allSaleItems.reduce((sum, item) => sum + item.cost, 0)
    const totalProfit = allSaleItems.reduce((sum, item) => sum + item.profit, 0)
    const totalDiscount = allSaleItems.reduce((sum, item) => sum + item.discount, 0)
    const uniqueProducts = new Set(allSaleItems.map(item => item.productId)).size
    const uniqueCustomers = new Set(allSaleItems.map(item => item.customerId)).size
    const transactionCount = new Set(allSaleItems.map(item => item.saleId)).size

    return {
      totalQuantity,
      totalRevenue,
      totalCost,
      totalProfit,
      totalDiscount,
      uniqueProducts,
      uniqueCustomers,
      transactionCount,
      avgProfitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
      avgOrderValue: transactionCount > 0 ? totalRevenue / transactionCount : 0
    }
  }, [allSaleItems])

  // Product-wise summary
  const productSummary = useMemo(() => {
    const productMap = new Map()

    allSaleItems.forEach(item => {
      if (productMap.has(item.productId)) {
        const existing = productMap.get(item.productId)
        existing.quantity += item.quantity
        existing.revenue += item.subtotal
        existing.cost += item.cost
        existing.profit += item.profit
        existing.discount += item.discount
        existing.salesCount += 1
        existing.customers.add(item.customerId)
      } else {
        productMap.set(item.productId, {
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          categoryName: item.categoryName,
          brandName: item.brandName,
          quantity: item.quantity,
          revenue: item.subtotal,
          cost: item.cost,
          profit: item.profit,
          discount: item.discount,
          salesCount: 1,
          customers: new Set([item.customerId])
        })
      }
    })

    return Array.from(productMap.values())
      .map(p => ({
        ...p,
        customerCount: p.customers.size,
        avgPrice: p.quantity > 0 ? p.revenue / p.quantity : 0,
        profitMargin: p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0
      }))
      .sort((a, b) => b.quantity - a.quantity)
  }, [allSaleItems])

  // Customer-wise summary
  const customerSummary = useMemo(() => {
    const customerMap = new Map()

    allSaleItems.forEach(item => {
      if (customerMap.has(item.customerId)) {
        const existing = customerMap.get(item.customerId)
        existing.quantity += item.quantity
        existing.revenue += item.subtotal
        existing.profit += item.profit
        existing.salesCount += 1
        existing.products.add(item.productId)
      } else {
        customerMap.set(item.customerId, {
          customerId: item.customerId,
          customerName: item.customerName,
          quantity: item.quantity,
          revenue: item.subtotal,
          profit: item.profit,
          salesCount: 1,
          products: new Set([item.productId])
        })
      }
    })

    return Array.from(customerMap.values())
      .map(c => ({
        ...c,
        productCount: c.products.size,
        avgOrderValue: c.salesCount > 0 ? c.revenue / c.salesCount : 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
  }, [allSaleItems])

  // Export to CSV
  function exportToCSV() {
    let csvContent = ''
    
    if (viewMode === 'transactions') {
      csvContent = 'Date,Invoice No,Customer,Product,SKU,Category,Brand,Qty,Unit Price,Discount,Subtotal,Cost,Profit,Margin %\n'
      allSaleItems.forEach(item => {
        csvContent += `${new Date(item.saleDate).toLocaleDateString()},`
        csvContent += `${item.invoiceNo || '-'},`
        csvContent += `"${item.customerName}",`
        csvContent += `"${item.productName}",`
        csvContent += `${item.sku || '-'},`
        csvContent += `"${item.categoryName}",`
        csvContent += `"${item.brandName}",`
        csvContent += `${item.quantity},`
        csvContent += `${item.unitPrice.toFixed(2)},`
        csvContent += `${item.discount.toFixed(2)},`
        csvContent += `${item.subtotal.toFixed(2)},`
        csvContent += `${item.cost.toFixed(2)},`
        csvContent += `${item.profit.toFixed(2)},`
        csvContent += `${item.profitMargin.toFixed(1)}\n`
      })
    } else if (viewMode === 'products') {
      csvContent = 'Product,SKU,Category,Brand,Qty Sold,Revenue,Cost,Profit,Margin %,Sales Count,Customers\n'
      productSummary.forEach(p => {
        csvContent += `"${p.productName}",`
        csvContent += `${p.sku || '-'},`
        csvContent += `"${p.categoryName}",`
        csvContent += `"${p.brandName}",`
        csvContent += `${p.quantity},`
        csvContent += `${p.revenue.toFixed(2)},`
        csvContent += `${p.cost.toFixed(2)},`
        csvContent += `${p.profit.toFixed(2)},`
        csvContent += `${p.profitMargin.toFixed(1)},`
        csvContent += `${p.salesCount},`
        csvContent += `${p.customerCount}\n`
      })
    } else {
      csvContent = 'Customer,Qty Purchased,Revenue,Profit,Orders,Products Bought,Avg Order Value\n'
      customerSummary.forEach(c => {
        csvContent += `"${c.customerName}",`
        csvContent += `${c.quantity},`
        csvContent += `${c.revenue.toFixed(2)},`
        csvContent += `${c.profit.toFixed(2)},`
        csvContent += `${c.salesCount},`
        csvContent += `${c.productCount},`
        csvContent += `${c.avgOrderValue.toFixed(2)}\n`
      })
    }

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `product-sell-report-${viewMode}-${new Date().toISOString().split('T')[0]}.csv`
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
          <h1 className="text-2xl font-bold text-white">Product Sell Report</h1>
          <p className="text-slate-400 text-sm">Detailed sales history by product</p>
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
            <label htmlFor="dateRange" className="block text-sm text-slate-400 mb-1">Date Range</label>
            <select
              id="dateRange"
              name="dateRange"
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
                <label htmlFor="startDate" className="block text-sm text-slate-400 mb-1">Start Date</label>
                <input
                  id="startDate"
                  name="startDate"
                  autoComplete="off"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm text-slate-400 mb-1">End Date</label>
                <input
                  id="endDate"
                  name="endDate"
                  autoComplete="off"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
            </>
          )}

          <div>
            <label htmlFor="filterProduct" className="block text-sm text-slate-400 mb-1">Product</label>
            <select
              id="filterProduct"
              name="filterProduct"
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
            <label htmlFor="filterCategory" className="block text-sm text-slate-400 mb-1">Category</label>
            <select
              id="filterCategory"
              name="filterCategory"
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
            <label htmlFor="filterBrand" className="block text-sm text-slate-400 mb-1">Brand</label>
            <select
              id="filterBrand"
              name="filterBrand"
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
            <label htmlFor="filterCustomer" className="block text-sm text-slate-400 mb-1">Customer</label>
            <select
              id="filterCustomer"
              name="filterCustomer"
              value={filterCustomer}
              onChange={(e) => setFilterCustomer(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">All Customers</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
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
              placeholder="Search product, customer, invoice..."
              value={searchTerm}
              id="sellReportSearch"
              name="sellReportSearch"
              autoComplete="off"
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
          <p className="text-slate-400 text-xs">Total Qty Sold</p>
          <p className="text-xl font-bold text-purple-400">{summary.totalQuantity.toLocaleString()}</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-slate-400 text-xs">Total Revenue</p>
          <p className="text-xl font-bold text-cyan-400">{business.currency} {summary.totalRevenue.toLocaleString()}</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <p className="text-slate-400 text-xs">Total Profit</p>
          <p className="text-xl font-bold text-emerald-400">{business.currency} {summary.totalProfit.toLocaleString()}</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <p className="text-slate-400 text-xs">Avg Margin</p>
          <p className="text-xl font-bold text-blue-400">{summary.avgProfitMargin.toFixed(1)}%</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <p className="text-slate-400 text-xs">Products Sold</p>
          <p className="text-xl font-bold text-orange-400">{summary.uniqueProducts}</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <p className="text-slate-400 text-xs">Customers</p>
          <p className="text-xl font-bold text-pink-400">{summary.uniqueCustomers}</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <p className="text-slate-400 text-xs">Transactions</p>
          <p className="text-xl font-bold text-yellow-400">{summary.transactionCount}</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-slate-400 text-xs">Total Discount</p>
          <p className="text-xl font-bold text-red-400">{business.currency} {summary.totalDiscount.toLocaleString()}</p>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl">
        <div className="border-b border-slate-700/50 p-2">
          <div className="flex gap-2">
            {[
              { id: 'transactions', name: 'Sale Transactions', icon: '📋' },
              { id: 'products', name: 'By Product', icon: '📦' },
              { id: 'customers', name: 'By Customer', icon: '👥' },
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
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Invoice</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Customer</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Product</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Category</th>
                  <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Qty</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Unit Price</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Discount</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Subtotal</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Profit</th>
                </tr>
              </thead>
              <tbody>
                {allSaleItems.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-12 text-slate-500">
                      No sales found for the selected filters
                    </td>
                  </tr>
                ) : (
                  allSaleItems.slice(0, 100).map((item, index) => (
                    <tr key={`${item.saleId}-${item.productId}-${index}`} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                      <td className="px-4 py-3 text-white">{new Date(item.saleDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-cyan-400">{item.invoiceNo || '-'}</td>
                      <td className="px-4 py-3 text-slate-300">{item.customerName}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-white font-medium">{item.productName}</p>
                          <p className="text-slate-500 text-xs">{item.sku || '-'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{item.categoryName}</td>
                      <td className="px-4 py-3 text-center text-white">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-slate-300">{business.currency} {item.unitPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-orange-400">{item.discount > 0 ? `- ${item.discount.toFixed(2)}` : '-'}</td>
                      <td className="px-4 py-3 text-right text-cyan-400 font-medium">{business.currency} {item.subtotal.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={item.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {business.currency} {item.profit.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {allSaleItems.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-900/50 border-t border-slate-700">
                    <td colSpan="5" className="px-4 py-3 text-white font-bold">Total</td>
                    <td className="px-4 py-3 text-center text-white font-bold">{summary.totalQuantity}</td>
                    <td className="px-4 py-3 text-right text-slate-400">-</td>
                    <td className="px-4 py-3 text-right text-orange-400 font-bold">{business.currency} {summary.totalDiscount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-cyan-400 font-bold">{business.currency} {summary.totalRevenue.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-emerald-400 font-bold">{business.currency} {summary.totalProfit.toFixed(2)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
            {allSaleItems.length > 100 && (
              <div className="p-4 text-center text-slate-400 text-sm">
                Showing first 100 of {allSaleItems.length} records. Export CSV for full data.
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
                  <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Qty Sold</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Revenue</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Profit</th>
                  <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Margin</th>
                  <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Orders</th>
                  <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Customers</th>
                </tr>
              </thead>
              <tbody>
                {productSummary.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-12 text-slate-500">
                      No product sales found
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
                      <td className="px-4 py-3 text-right text-cyan-400 font-medium">{business.currency} {product.revenue.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-emerald-400 font-medium">{business.currency} {product.profit.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          product.profitMargin >= 30 ? 'bg-emerald-500/20 text-emerald-400' :
                          product.profitMargin >= 15 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-orange-500/20 text-orange-400'
                        }`}>
                          {product.profitMargin.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-300">{product.salesCount}</td>
                      <td className="px-4 py-3 text-center text-slate-300">{product.customerCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Customers View */}
        {viewMode === 'customers' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-900/50">
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">#</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Customer</th>
                  <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Qty Purchased</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Total Spent</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Profit Generated</th>
                  <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Orders</th>
                  <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Products</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Avg Order</th>
                </tr>
              </thead>
              <tbody>
                {customerSummary.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-12 text-slate-500">
                      No customer sales found
                    </td>
                  </tr>
                ) : (
                  customerSummary.map((customer, index) => (
                    <tr key={customer.customerId} className="border-t border-slate-700/50 hover:bg-slate-800/30">
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
                      <td className="px-4 py-3 text-white font-medium">{customer.customerName}</td>
                      <td className="px-4 py-3 text-center text-purple-400 font-medium">{customer.quantity}</td>
                      <td className="px-4 py-3 text-right text-cyan-400 font-medium">{business.currency} {customer.revenue.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-emerald-400 font-medium">{business.currency} {customer.profit.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center text-slate-300">{customer.salesCount}</td>
                      <td className="px-4 py-3 text-center text-slate-300">{customer.productCount}</td>
                      <td className="px-4 py-3 text-right text-yellow-400">{business.currency} {customer.avgOrderValue.toFixed(2)}</td>
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
            {viewMode === 'transactions' && `${allSaleItems.length} sale items`}
            {viewMode === 'products' && `${productSummary.length} products`}
            {viewMode === 'customers' && `${customerSummary.length} customers`}
          </span>
        </div>
      </div>
    </div>
  )
}