import { useState, useMemo } from 'react'
import { useApp } from '../Context/AppContext'

export default function Stockreport() {
  const { state } = useApp()
  const { products, categories, brands, units, business, stockAdjustments = [], purchases = [], sales = [] } = state

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterBrand, setFilterBrand] = useState('')
  const [filterStatus, setFilterStatus] = useState('all') // all, in_stock, low_stock, out_of_stock
  const [sortBy, setSortBy] = useState('name') // name, stock_asc, stock_desc, value_asc, value_desc
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  // Helper functions
  function getCategoryName(id) {
    return categories.find(c => c.id === id)?.name || '-'
  }

  function getBrandName(id) {
    return brands.find(b => b.id === id)?.name || '-'
  }

  function getUnitName(id) {
    const unit = units.find(u => u.id === id)
    return unit?.shortName || unit?.name || '-'
  }

  function getStockStatus(product) {
    if (product.currentStock <= 0) return 'out_of_stock'
    if (product.currentStock <= product.alertQuantity) return 'low_stock'
    return 'in_stock'
  }

  function getStatusBadge(status) {
    const styles = {
      in_stock: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'In Stock' },
      low_stock: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Low Stock' },
      out_of_stock: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Out of Stock' }
    }
    const style = styles[status] || styles.in_stock
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    )
  }

  // Get stock movement for a product
  function getProductStockMovement(productId) {
    // Purchases (stock in)
    const productPurchases = purchases.filter(p => 
      p.items?.some(item => item.productId === productId)
    )
    const totalPurchased = productPurchases.reduce((sum, purchase) => {
      const item = purchase.items.find(i => i.productId === productId)
      return sum + (item?.quantity || 0)
    }, 0)

    // Sales (stock out)
    const productSales = sales.filter(s => 
      s.items?.some(item => item.productId === productId)
    )
    const totalSold = productSales.reduce((sum, sale) => {
      const item = sale.items.find(i => i.productId === productId)
      return sum + (item?.quantity || 0)
    }, 0)

    // Adjustments
    const productAdjustments = (stockAdjustments || []).filter(adj =>
      adj.items?.some(item => item.productId === productId)
    )
    const totalAdjusted = productAdjustments.reduce((sum, adj) => {
      const item = adj.items.find(i => i.productId === productId)
      return sum + (item?.quantity || 0)
    }, 0)

    return { totalPurchased, totalSold, totalAdjusted, productPurchases, productSales, productAdjustments }
  }

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = products.filter(product => {
      // Search filter
      const matchesSearch = 
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      
      // Category filter
      const matchesCategory = !filterCategory || product.categoryId === parseInt(filterCategory)
      
      // Brand filter
      const matchesBrand = !filterBrand || product.brandId === parseInt(filterBrand)
      
      // Status filter
      const status = getStockStatus(product)
      const matchesStatus = filterStatus === 'all' || status === filterStatus

      return matchesSearch && matchesCategory && matchesBrand && matchesStatus
    })

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '')
        case 'stock_asc':
          return (a.currentStock || 0) - (b.currentStock || 0)
        case 'stock_desc':
          return (b.currentStock || 0) - (a.currentStock || 0)
        case 'value_asc':
          return ((a.currentStock || 0) * (a.costPrice || 0)) - ((b.currentStock || 0) * (b.costPrice || 0))
        case 'value_desc':
          return ((b.currentStock || 0) * (b.costPrice || 0)) - ((a.currentStock || 0) * (a.costPrice || 0))
        default:
          return 0
      }
    })

    return result
  }, [products, searchTerm, filterCategory, filterBrand, filterStatus, sortBy])

  // Calculate summary statistics
  const stats = useMemo(() => {
    const totalProducts = products.length
    const totalQuantity = products.reduce((sum, p) => sum + (p.currentStock || 0), 0)
    const totalCostValue = products.reduce((sum, p) => sum + ((p.currentStock || 0) * (p.costPrice || 0)), 0)
    const totalRetailValue = products.reduce((sum, p) => sum + ((p.currentStock || 0) * (p.sellingPrice || 0)), 0)
    const potentialProfit = totalRetailValue - totalCostValue
    const lowStockCount = products.filter(p => p.currentStock > 0 && p.currentStock <= p.alertQuantity).length
    const outOfStockCount = products.filter(p => p.currentStock <= 0).length
    const inStockCount = products.filter(p => p.currentStock > p.alertQuantity).length

    return {
      totalProducts,
      totalQuantity,
      totalCostValue,
      totalRetailValue,
      potentialProfit,
      lowStockCount,
      outOfStockCount,
      inStockCount
    }
  }, [products])

  // Stock by category
  const stockByCategory = useMemo(() => {
    return categories.map(category => {
      const categoryProducts = products.filter(p => p.categoryId === category.id)
      const totalStock = categoryProducts.reduce((sum, p) => sum + (p.currentStock || 0), 0)
      const totalValue = categoryProducts.reduce((sum, p) => sum + ((p.currentStock || 0) * (p.costPrice || 0)), 0)
      const lowStockCount = categoryProducts.filter(p => p.currentStock > 0 && p.currentStock <= p.alertQuantity).length
      const outOfStockCount = categoryProducts.filter(p => p.currentStock <= 0).length
      
      return {
        ...category,
        productCount: categoryProducts.length,
        totalStock,
        totalValue,
        lowStockCount,
        outOfStockCount
      }
    }).filter(c => c.productCount > 0)
  }, [products, categories])

  // Stock by brand
  const stockByBrand = useMemo(() => {
    return brands.map(brand => {
      const brandProducts = products.filter(p => p.brandId === brand.id)
      const totalStock = brandProducts.reduce((sum, p) => sum + (p.currentStock || 0), 0)
      const totalValue = brandProducts.reduce((sum, p) => sum + ((p.currentStock || 0) * (p.costPrice || 0)), 0)
      
      return {
        ...brand,
        productCount: brandProducts.length,
        totalStock,
        totalValue
      }
    }).filter(b => b.productCount > 0)
  }, [products, brands])

  // Low stock products
  const lowStockProducts = useMemo(() => {
    return products
      .filter(p => p.currentStock <= p.alertQuantity)
      .sort((a, b) => (a.currentStock || 0) - (b.currentStock || 0))
  }, [products])

  // Open detail modal
  function openDetailModal(product) {
    setSelectedProduct(product)
    setShowDetailModal(true)
  }

  // Export to CSV
  function exportToCSV() {
    const headers = ['SKU', 'Product Name', 'Category', 'Brand', 'Unit', 'Current Stock', 'Alert Qty', 'Cost Price', 'Selling Price', 'Stock Value (Cost)', 'Stock Value (Retail)', 'Status']
    
    const rows = filteredProducts.map(p => [
      p.sku || '',
      p.name || '',
      getCategoryName(p.categoryId),
      getBrandName(p.brandId),
      getUnitName(p.unitId),
      p.currentStock || 0,
      p.alertQuantity || 0,
      p.costPrice || 0,
      p.sellingPrice || 0,
      ((p.currentStock || 0) * (p.costPrice || 0)).toFixed(2),
      ((p.currentStock || 0) * (p.sellingPrice || 0)).toFixed(2),
      getStockStatus(p) === 'in_stock' ? 'In Stock' : getStockStatus(p) === 'low_stock' ? 'Low Stock' : 'Out of Stock'
    ])

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stock-report-${new Date().toISOString().split('T')[0]}.csv`
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Stock Report</h1>
          <p className="text-slate-400 text-sm">Complete inventory overview and analysis</p>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Total Products</p>
              <p className="text-xl font-bold text-white">{stats.totalProducts}</p>
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
              <p className="text-slate-400 text-xs">Total Quantity</p>
              <p className="text-xl font-bold text-purple-400">{stats.totalQuantity.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Cost Value</p>
              <p className="text-lg font-bold text-cyan-400">{business.currency} {stats.totalCostValue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Retail Value</p>
              <p className="text-lg font-bold text-emerald-400">{business.currency} {stats.totalRetailValue.toLocaleString()}</p>
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
              <p className="text-slate-400 text-xs">In Stock</p>
              <p className="text-xl font-bold text-green-400">{stats.inStockCount}</p>
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
              <p className="text-slate-400 text-xs">Low Stock</p>
              <p className="text-xl font-bold text-yellow-400">{stats.lowStockCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Out of Stock</p>
              <p className="text-xl font-bold text-red-400">{stats.outOfStockCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Potential Profit Banner */}
      <div className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/30 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-emerald-300 text-sm">Potential Profit (if all stock sold at retail price)</p>
              <p className="text-2xl font-bold text-emerald-400">{business.currency} {stats.potentialProfit.toLocaleString()}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-sm">Margin</p>
            <p className="text-xl font-bold text-cyan-400">
              {stats.totalCostValue > 0 
                ? ((stats.potentialProfit / stats.totalCostValue) * 100).toFixed(1) 
                : 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Stock by Category & Low Stock Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock by Category */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl">
          <div className="p-4 border-b border-slate-700/50">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="text-blue-400">📊</span> Stock by Category
            </h3>
          </div>
          <div className="p-4 max-h-80 overflow-y-auto">
            {stockByCategory.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No categories found</p>
            ) : (
              <div className="space-y-3">
                {stockByCategory.map(category => (
                  <div key={category.id} className="bg-slate-900/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-white font-medium">{category.name}</p>
                        <p className="text-slate-400 text-xs">{category.productCount} products</p>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-400 font-medium">{category.totalStock} units</p>
                        <p className="text-slate-400 text-xs">{business.currency} {category.totalValue.toLocaleString()}</p>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                        style={{ width: `${Math.min((category.totalStock / stats.totalQuantity) * 100, 100)}%` }}
                      />
                    </div>
                    {(category.lowStockCount > 0 || category.outOfStockCount > 0) && (
                      <div className="flex gap-2 mt-2">
                        {category.lowStockCount > 0 && (
                          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                            {category.lowStockCount} low stock
                          </span>
                        )}
                        {category.outOfStockCount > 0 && (
                          <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
                            {category.outOfStockCount} out
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl">
          <div className="p-4 border-b border-slate-700/50">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="text-red-400">⚠️</span> Low Stock Alert
              {lowStockProducts.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs">
                  {lowStockProducts.length} items
                </span>
              )}
            </h3>
          </div>
          <div className="p-4 max-h-80 overflow-y-auto">
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-emerald-400 font-medium">All products are well stocked!</p>
                <p className="text-slate-500 text-sm">No items below alert quantity</p>
              </div>
            ) : (
              <div className="space-y-2">
                {lowStockProducts.slice(0, 10).map(product => (
                  <div 
                    key={product.id} 
                    className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg hover:bg-slate-900 cursor-pointer transition-colors"
                    onClick={() => openDetailModal(product)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        product.currentStock <= 0 ? 'bg-red-500/20' : 'bg-yellow-500/20'
                      }`}>
                        {product.currentStock <= 0 ? (
                          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{product.name}</p>
                        <p className="text-slate-400 text-xs">{product.sku} • Alert at: {product.alertQuantity}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        product.currentStock <= 0 
                          ? 'bg-red-500/20 text-red-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {product.currentStock} left
                      </span>
                    </div>
                  </div>
                ))}
                {lowStockProducts.length > 10 && (
                  <p className="text-slate-500 text-center text-sm py-2">
                    +{lowStockProducts.length - 10} more items
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stock by Brand */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl">
        <div className="p-4 border-b border-slate-700/50">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="text-purple-400">🏷️</span> Stock by Brand
          </h3>
        </div>
        <div className="p-4">
          {stockByBrand.length === 0 ? (
            <p className="text-slate-500 text-center py-4">No brands found</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {stockByBrand.map(brand => (
                <div key={brand.id} className="bg-slate-900/50 rounded-lg p-3 text-center">
                  <p className="text-white font-medium truncate">{brand.name}</p>
                  <p className="text-2xl font-bold text-purple-400">{brand.totalStock}</p>
                  <p className="text-slate-500 text-xs">{brand.productCount} products</p>
                  <p className="text-slate-400 text-xs">{business.currency} {brand.totalValue.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl">
        {/* Table Filters */}
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <input
                id="srSearch"
                name="srSearch"
                autoComplete="off"
                aria-label="Search by product name or SKU"
                type="text"
                placeholder="Search by product name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 pl-10"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <select
              id="srCategory"
              name="srCategory"
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
              id="srBrand"
              name="srBrand"
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

            <select
              id="srStatus"
              name="srStatus"
              aria-label="Filter by stock status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Status</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>

            <select
              id="srSortBy"
              name="srSortBy"
              aria-label="Sort products"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="name">Sort by Name</option>
              <option value="stock_asc">Stock: Low to High</option>
              <option value="stock_desc">Stock: High to Low</option>
              <option value="value_asc">Value: Low to High</option>
              <option value="value_desc">Value: High to Low</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-900/50">
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Product</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">SKU</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Category</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Brand</th>
                <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Current Stock</th>
                <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Alert Qty</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Cost Price</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Sell Price</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Stock Value</th>
                <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Status</th>
                <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="11" className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center gap-3">
                      <svg className="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <p>No products match your filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                  const status = getStockStatus(product)
                  const stockValue = (product.currentStock || 0) * (product.costPrice || 0)
                  
                  return (
                    <tr key={product.id} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                            ) : (
                              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="text-white font-medium">{product.name}</p>
                            <p className="text-slate-500 text-xs">{getUnitName(product.unitId)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-cyan-400 font-mono text-sm">{product.sku || '-'}</td>
                      <td className="px-4 py-3 text-slate-300">{getCategoryName(product.categoryId)}</td>
                      <td className="px-4 py-3 text-slate-300">{getBrandName(product.brandId)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-lg font-bold ${
                          status === 'out_of_stock' ? 'text-red-400' :
                          status === 'low_stock' ? 'text-yellow-400' :
                          'text-emerald-400'
                        }`}>
                          {product.currentStock || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-400">{product.alertQuantity || 0}</td>
                      <td className="px-4 py-3 text-right text-slate-300">
                        {business.currency} {(product.costPrice || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-400">
                        {business.currency} {(product.sellingPrice || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-cyan-400 font-medium">
                        {business.currency} {stockValue.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getStatusBadge(status)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => openDetailModal(product)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-4 border-t border-slate-700/50 flex items-center justify-between">
          <span className="text-slate-400 text-sm">
            Showing {filteredProducts.length} of {products.length} products
          </span>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-400">
              Filtered Stock Value: <span className="text-cyan-400 font-medium">
                {business.currency} {filteredProducts.reduce((sum, p) => sum + ((p.currentStock || 0) * (p.costPrice || 0)), 0).toLocaleString()}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Product Detail Modal */}
      {showDetailModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Stock Details</h2>
                <p className="text-cyan-400">{selectedProduct.sku}</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Product Info */}
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 bg-slate-700 rounded-xl flex items-center justify-center flex-shrink-0">
                  {selectedProduct.image ? (
                    <img src={selectedProduct.image} alt={selectedProduct.name} className="w-20 h-20 rounded-xl object-cover" />
                  ) : (
                    <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">{selectedProduct.name}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm">
                    <span className="text-slate-400">{getCategoryName(selectedProduct.categoryId)}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400">{getBrandName(selectedProduct.brandId)}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400">{getUnitName(selectedProduct.unitId)}</span>
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(getStockStatus(selectedProduct))}
                </div>
              </div>

              {/* Stock Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                  <p className="text-slate-400 text-sm">Current Stock</p>
                  <p className={`text-2xl font-bold ${
                    getStockStatus(selectedProduct) === 'out_of_stock' ? 'text-red-400' :
                    getStockStatus(selectedProduct) === 'low_stock' ? 'text-yellow-400' :
                    'text-emerald-400'
                  }`}>
                    {selectedProduct.currentStock || 0}
                  </p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                  <p className="text-slate-400 text-sm">Alert Quantity</p>
                  <p className="text-2xl font-bold text-yellow-400">{selectedProduct.alertQuantity || 0}</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                  <p className="text-slate-400 text-sm">Cost Price</p>
                  <p className="text-xl font-bold text-white">{business.currency} {(selectedProduct.costPrice || 0).toLocaleString()}</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                  <p className="text-slate-400 text-sm">Selling Price</p>
                  <p className="text-xl font-bold text-emerald-400">{business.currency} {(selectedProduct.sellingPrice || 0).toLocaleString()}</p>
                </div>
              </div>

              {/* Stock Value */}
              <div className="bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 rounded-xl p-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-slate-400 text-sm">Stock Value (Cost)</p>
                    <p className="text-xl font-bold text-cyan-400">
                      {business.currency} {((selectedProduct.currentStock || 0) * (selectedProduct.costPrice || 0)).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-400 text-sm">Stock Value (Retail)</p>
                    <p className="text-xl font-bold text-emerald-400">
                      {business.currency} {((selectedProduct.currentStock || 0) * (selectedProduct.sellingPrice || 0)).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-400 text-sm">Potential Profit</p>
                    <p className="text-xl font-bold text-green-400">
                      {business.currency} {((selectedProduct.currentStock || 0) * ((selectedProduct.sellingPrice || 0) - (selectedProduct.costPrice || 0))).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stock Movement */}
              {(() => {
                const movement = getProductStockMovement(selectedProduct.id)
                return (
                  <div className="bg-slate-900/50 rounded-xl p-4">
                    <h4 className="text-white font-medium mb-4">Stock Movement Summary</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                        <p className="text-purple-400 text-sm">Total Purchased</p>
                        <p className="text-white font-bold text-xl">+{movement.totalPurchased}</p>
                        <p className="text-slate-500 text-xs">{movement.productPurchases.length} purchases</p>
                      </div>
                      <div className="text-center p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                        <p className="text-cyan-400 text-sm">Total Sold</p>
                        <p className="text-white font-bold text-xl">-{movement.totalSold}</p>
                        <p className="text-slate-500 text-xs">{movement.productSales.length} sales</p>
                      </div>
                      <div className={`text-center p-3 rounded-lg ${
                        movement.totalAdjusted >= 0 
                          ? 'bg-emerald-500/10 border border-emerald-500/30' 
                          : 'bg-red-500/10 border border-red-500/30'
                      }`}>
                        <p className={movement.totalAdjusted >= 0 ? 'text-emerald-400 text-sm' : 'text-red-400 text-sm'}>
                          Total Adjusted
                        </p>
                        <p className="text-white font-bold text-xl">
                          {movement.totalAdjusted >= 0 ? '+' : ''}{movement.totalAdjusted}
                        </p>
                        <p className="text-slate-500 text-xs">{movement.productAdjustments.length} adjustments</p>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>

            <div className="p-4 border-t border-slate-700 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}