import { useState } from 'react'
import { useApp } from '../Context/AppContext'

export default function Products() {
  const { state, dispatch } = useApp()
  const { products, categories, brands, units, business, stockAdjustments, purchases, sales } = state
  
  const [activeTab, setActiveTab] = useState('products')
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [viewTab, setViewTab] = useState('details')
  const [searchTerm, setSearchTerm] = useState('')
  const [pageSize, setPageSize] = useState(25)
  const [currentPage, setCurrentPage] = useState(1)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const [filterCategory, setFilterCategory] = useState('')
  const [filterBrand, setFilterBrand] = useState('')
  const [filterExpiry, setFilterExpiry] = useState('')

  // NEW: Quick Add Modal States
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showBrandModal, setShowBrandModal] = useState(false)
  const [showUnitModal, setShowUnitModal] = useState(false)

  // NEW: Quick Add Form Data
  const [newCategoryData, setNewCategoryData] = useState({
    name: '',
    code: '',
    description: ''
  })
  const [newBrandData, setNewBrandData] = useState({
    name: '',
    description: ''
  })
  const [newUnitData, setNewUnitData] = useState({
    name: '',
    shortName: '',
    allowDecimal: true
  })

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcodeType: 'Code 128 (C128)',
    categoryId: '',
    subCategoryId: '',
    brandId: '',
    unitId: '',
    manageStock: true,
    alertQuantity: 5,
    costPrice: 0,
    sellingPrice: 0,
    currentStock: 0,
    description: '',
    image: null,
    taxType: 'None',
    taxRate: 0,
    productType: 'Single',
    expiryDate: '',
    expiryAlertDays: 30,
    weight: '',
    dimensions: ''
  })

  // Get expiry status helper
  function getExpiryStatus(expiryDate) {
    if (!expiryDate) return { status: 'none', label: 'No Expiry', color: 'slate' }
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expiry = new Date(expiryDate)
    expiry.setHours(0, 0, 0, 0)
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', label: 'Expired', color: 'red', days: Math.abs(daysUntilExpiry) }
    } else if (daysUntilExpiry === 0) {
      return { status: 'today', label: 'Expires Today', color: 'red', days: 0 }
    } else if (daysUntilExpiry <= 7) {
      return { status: 'critical', label: `${daysUntilExpiry}d left`, color: 'red', days: daysUntilExpiry }
    } else if (daysUntilExpiry <= 30) {
      return { status: 'warning', label: `${daysUntilExpiry}d left`, color: 'yellow', days: daysUntilExpiry }
    } else if (daysUntilExpiry <= 90) {
      return { status: 'attention', label: `${daysUntilExpiry}d left`, color: 'orange', days: daysUntilExpiry }
    }
    return { status: 'ok', label: `${daysUntilExpiry}d left`, color: 'emerald', days: daysUntilExpiry }
  }

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !filterCategory || p.categoryId === parseInt(filterCategory)
    const matchesBrand = !filterBrand || p.brandId === parseInt(filterBrand)
    
    // Expiry filter
    let matchesExpiry = true
    if (filterExpiry) {
      const expiryStatus = getExpiryStatus(p.expiryDate)
      if (filterExpiry === 'expired') matchesExpiry = expiryStatus.status === 'expired'
      else if (filterExpiry === 'expiring_soon') matchesExpiry = ['critical', 'warning', 'today'].includes(expiryStatus.status)
      else if (filterExpiry === 'expiring_90') matchesExpiry = expiryStatus.days !== undefined && expiryStatus.days <= 90 && expiryStatus.days >= 0
      else if (filterExpiry === 'no_expiry') matchesExpiry = expiryStatus.status === 'none'
    }
    
    return matchesSearch && matchesCategory && matchesBrand && matchesExpiry
  })
  const totalPages = Math.ceil(filteredProducts.length / pageSize)
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Get active product for dropdown
  const activeProduct = products.find(p => p.id === activeDropdown)

  // Low stock products
  const lowStockProducts = products.filter(p => p.currentStock <= p.alertQuantity)

  // Expiring products (within 30 days)
  const expiringProducts = products.filter(p => {
    const status = getExpiryStatus(p.expiryDate)
    return ['expired', 'today', 'critical', 'warning'].includes(status.status)
  })

  // Expired products
  const expiredProducts = products.filter(p => getExpiryStatus(p.expiryDate).status === 'expired')

  // Get stock adjustments for a product
  function getProductAdjustments(productId) {
    return (stockAdjustments || []).filter(adj => 
      adj.items?.some(item => item.productId === productId)
    ).map(adj => {
      const item = adj.items.find(item => item.productId === productId)
      return {
        ...adj,
        quantity: item?.quantity || 0,
        unitPrice: item?.unitPrice || 0,
        subtotal: item?.subtotal || 0
      }
    }).sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
  }

  // Get purchases for a product (with expiry info)
  function getProductPurchases(productId) {
    return (purchases || []).filter(purchase => 
      purchase.items?.some(item => item.productId === productId)
    ).map(purchase => {
      const item = purchase.items.find(item => item.productId === productId)
      return {
        ...purchase,
        quantity: item?.quantity || 0,
        unitPrice: item?.unitPrice || item?.costPrice || 0,
        subtotal: (item?.quantity || 0) * (item?.unitPrice || item?.costPrice || 0),
        itemExpiryDate: item?.expiryDate || null
      }
    }).sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
  }

  // Get sales for a product
  function getProductSales(productId) {
    return (sales || []).filter(sale => 
      sale.items?.some(item => item.productId === productId)
    ).map(sale => {
      const item = sale.items.find(item => item.productId === productId)
      return {
        ...sale,
        quantity: item?.quantity || 0,
        unitPrice: item?.unitPrice || item?.sellingPrice || 0,
        subtotal: (item?.quantity || 0) * (item?.unitPrice || item?.sellingPrice || 0)
      }
    }).sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
  }

  function resetForm() {
    setFormData({
      name: '',
      sku: '',
      barcodeType: 'Code 128 (C128)',
      categoryId: '',
      subCategoryId: '',
      brandId: '',
      unitId: '',
      manageStock: true,
      alertQuantity: 5,
      costPrice: 0,
      sellingPrice: 0,
      currentStock: 0,
      description: '',
      image: null,
      taxType: 'None',
      taxRate: 0,
      productType: 'Single',
      expiryDate: '',
      expiryAlertDays: 30,
      weight: '',
      dimensions: ''
    })
  }

  // NEW: Reset Quick Add Forms
  function resetCategoryForm() {
    setNewCategoryData({ name: '', code: '', description: '' })
  }
  function resetBrandForm() {
    setNewBrandData({ name: '', description: '' })
  }
  function resetUnitForm() {
    setNewUnitData({ name: '', shortName: '', allowDecimal: true })
  }

  function openAddModal() {
    setEditingProduct(null)
    resetForm()
    const newSku = `PRD-${String(products.length + 1).padStart(4, '0')}`
    setFormData(prev => ({ ...prev, sku: newSku }))
    setShowModal(true)
  }

  function openEditModal(product) {
    setEditingProduct(product)
    setFormData({
      name: product.name || '',
      sku: product.sku || '',
      barcodeType: product.barcodeType || 'Code 128 (C128)',
      categoryId: product.categoryId || '',
      subCategoryId: product.subCategoryId || '',
      brandId: product.brandId || '',
      unitId: product.unitId || '',
      manageStock: product.manageStock !== false,
      alertQuantity: product.alertQuantity || 5,
      costPrice: product.costPrice || 0,
      sellingPrice: product.sellingPrice || 0,
      currentStock: product.currentStock || 0,
      description: product.description || '',
      image: product.image || null,
      taxType: product.taxType || 'None',
      taxRate: product.taxRate || 0,
      productType: product.productType || 'Single',
      expiryDate: product.expiryDate || '',
      expiryAlertDays: product.expiryAlertDays || 30,
      weight: product.weight || '',
      dimensions: product.dimensions || ''
    })
    setShowModal(true)
    setActiveDropdown(null)
  }

  function openViewModal(product) {
    setSelectedProduct(product)
    setViewTab('details')
    setShowViewModal(true)
    setActiveDropdown(null)
  }

  function handleDropdownClick(e, productId) {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setDropdownPosition({ top: rect.bottom + 4, left: rect.left })
    setActiveDropdown(activeDropdown === productId ? null : productId)
  }

  function handleSubmit(e) {
    e.preventDefault()
    
    if (!formData.name) {
      alert('Product name is required')
      return
    }

    if (editingProduct) {
      dispatch({ 
        type: 'UPDATE_PRODUCT', 
        payload: { 
          ...editingProduct, 
          ...formData,
          categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
          brandId: formData.brandId ? parseInt(formData.brandId) : null,
          unitId: formData.unitId ? parseInt(formData.unitId) : null
        } 
      })
    } else {
      dispatch({ 
        type: 'ADD_PRODUCT', 
        payload: {
          ...formData,
          categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
          brandId: formData.brandId ? parseInt(formData.brandId) : null,
          unitId: formData.unitId ? parseInt(formData.unitId) : null
        }
      })
    }
    setShowModal(false)
    resetForm()
  }

  // NEW: Handle Quick Add Category
  function handleCategorySubmit(e) {
    e.preventDefault()
    if (!newCategoryData.name) {
      alert('Category name is required')
      return
    }
    const newCategory = {
      ...newCategoryData,
      id: Date.now()
    }
    dispatch({ type: 'ADD_CATEGORY', payload: newCategory })
    // Auto-select the new category
    setFormData({ ...formData, categoryId: newCategory.id.toString() })
    setShowCategoryModal(false)
    resetCategoryForm()
  }

  // NEW: Handle Quick Add Brand
  function handleBrandSubmit(e) {
    e.preventDefault()
    if (!newBrandData.name) {
      alert('Brand name is required')
      return
    }
    const newBrand = {
      ...newBrandData,
      id: Date.now()
    }
    dispatch({ type: 'ADD_BRAND', payload: newBrand })
    // Auto-select the new brand
    setFormData({ ...formData, brandId: newBrand.id.toString() })
    setShowBrandModal(false)
    resetBrandForm()
  }

  // NEW: Handle Quick Add Unit
  function handleUnitSubmit(e) {
    e.preventDefault()
    if (!newUnitData.name || !newUnitData.shortName) {
      alert('Unit name and short name are required')
      return
    }
    const newUnit = {
      ...newUnitData,
      id: Date.now()
    }
    dispatch({ type: 'ADD_UNIT', payload: newUnit })
    // Auto-select the new unit
    setFormData({ ...formData, unitId: newUnit.id.toString() })
    setShowUnitModal(false)
    resetUnitForm()
  }

  function handleDelete(id) {
    if (confirm('Are you sure you want to delete this product?')) {
      dispatch({ type: 'DELETE_PRODUCT', payload: id })
    }
    setActiveDropdown(null)
  }

  function handleDuplicate(product) {
    const newSku = `PRD-${String(products.length + 1).padStart(4, '0')}`
    dispatch({
      type: 'ADD_PRODUCT',
      payload: {
        ...product,
        id: undefined,
        name: `${product.name} (Copy)`,
        sku: newSku,
        currentStock: 0
      }
    })
    setActiveDropdown(null)
  }

  // Get category/brand/unit names
  function getCategoryName(id) {
    return categories.find(c => c.id === id)?.name || '-'
  }
  function getBrandName(id) {
    return brands.find(b => b.id === id)?.name || '-'
  }
  function getUnitName(id) {
    return units.find(u => u.id === id)?.shortName || units.find(u => u.id === id)?.name || '-'
  }

  // Calculate totals
  const totalStockValue = products.reduce((sum, p) => sum + (p.currentStock * p.costPrice), 0)
  const totalRetailValue = products.reduce((sum, p) => sum + (p.currentStock * p.sellingPrice), 0)

  // Calculate product stock movement summary
  function getStockMovementSummary(productId) {
    const adjustments = getProductAdjustments(productId)
    const productPurchases = getProductPurchases(productId)
    const productSales = getProductSales(productId)
    
    const totalAdjusted = adjustments.reduce((sum, a) => sum + a.quantity, 0)
    const totalPurchased = productPurchases.reduce((sum, p) => sum + p.quantity, 0)
    const totalSold = productSales.reduce((sum, s) => sum + s.quantity, 0)
    
    return { totalAdjusted, totalPurchased, totalSold, adjustments, productPurchases, productSales }
  }

  // Expiry badge component
  function ExpiryBadge({ expiryDate, showDate = false }) {
    const status = getExpiryStatus(expiryDate)
    
    if (status.status === 'none') {
      return <span className="text-slate-500 text-xs">-</span>
    }

    const colorClasses = {
      red: 'bg-red-500/20 text-red-400',
      yellow: 'bg-yellow-500/20 text-yellow-400',
      orange: 'bg-orange-500/20 text-orange-400',
      emerald: 'bg-emerald-500/20 text-emerald-400',
      slate: 'bg-slate-500/20 text-slate-400'
    }

    return (
      <div className="flex flex-col">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorClasses[status.color]}`}>
          {status.label}
        </span>
        {showDate && expiryDate && (
          <span className="text-slate-500 text-xs mt-0.5">
            {new Date(expiryDate).toLocaleDateString()}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="text-slate-400 text-sm">Manage your products inventory</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-cyan-600 transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Products</p>
              <p className="text-xl font-bold text-white">{products.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Stock Value</p>
              <p className="text-xl font-bold text-emerald-400">{business.currency} {totalStockValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Retail Value</p>
              <p className="text-xl font-bold text-cyan-400">{business.currency} {totalRetailValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Expiring Soon</p>
              <p className="text-xl font-bold text-yellow-400">{expiringProducts.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Low Stock</p>
              <p className="text-xl font-bold text-red-400">{lowStockProducts.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl">
        <div className="border-b border-slate-700/50">
          <div className="flex gap-1 p-2">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'products'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              📦 All Products
            </button>
            <button
              onClick={() => setActiveTab('expiry')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'expiry'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              ⏰ Expiry Alerts
              {expiringProducts.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-yellow-500/30 text-yellow-400 rounded text-xs">
                  {expiringProducts.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('stock')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'stock'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              📊 Stock Report
            </button>
          </div>
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <>
            {/* Filters - FIXED: added id/name/aria-label to all filter controls */}
            <div className="p-4 border-b border-slate-700/50 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="text-slate-400 text-sm">Show</span>
                <select id="prodPageSize" name="prodPageSize" aria-label="Entries per page" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1) }} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm">
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-slate-400 text-sm">entries</span>
              </div>
              
              <select
                id="prodFilterCategory"
                name="prodFilterCategory"
                aria-label="Filter by category"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm"
              >
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <select
                id="prodFilterBrand"
                name="prodFilterBrand"
                aria-label="Filter by brand"
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm"
              >
                <option value="">All Brands</option>
                {brands.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>

              <select
                id="prodFilterExpiry"
                name="prodFilterExpiry"
                aria-label="Filter by expiry status"
                value={filterExpiry}
                onChange={(e) => setFilterExpiry(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm"
              >
                <option value="">All Expiry Status</option>
                <option value="expired">Expired</option>
                <option value="expiring_soon">Expiring Soon (30 days)</option>
                <option value="expiring_90">Expiring (90 days)</option>
                <option value="no_expiry">No Expiry Date</option>
              </select>

              <div className="flex-1"></div>

              <div className="relative">
                <input
                  id="prodSearch"
                  name="prodSearch"
                  autoComplete="off"
                  aria-label="Search products"
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

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-900/50">
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Action</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Product</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">SKU</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Category</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Cost Price</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Selling Price</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Stock</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Expiry</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-8 text-slate-500">No products found</td>
                    </tr>
                  ) : (
                    paginatedProducts.map(product => (
                      <tr key={product.id} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                        <td className="px-4 py-3">
                          <button
                            onClick={(e) => handleDropdownClick(e, product.id)}
                            className="px-3 py-1.5 bg-cyan-500 text-white rounded-lg text-sm hover:bg-cyan-600 transition-colors flex items-center gap-1"
                          >
                            Actions
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                              {product.image ? (
                                <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                              ) : (
                                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              )}
                            </div>
                            <div>
                              <p className="text-white font-medium">{product.name}</p>
                              {product.description && (
                                <p className="text-slate-400 text-xs truncate max-w-[200px]">{product.description}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-cyan-400 font-mono text-sm">{product.sku || '-'}</td>
                        <td className="px-4 py-3 text-slate-300">{getCategoryName(product.categoryId)}</td>
                        <td className="px-4 py-3 text-slate-300">{business.currency} {(product.costPrice || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-emerald-400 font-medium">{business.currency} {(product.sellingPrice || 0).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            product.currentStock <= product.alertQuantity
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {product.currentStock || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <ExpiryBadge expiryDate={product.expiryDate} showDate={true} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="p-4 border-t border-slate-700/50 flex items-center justify-between">
              <span className="text-slate-400 text-sm">Showing {Math.min((currentPage - 1) * pageSize + 1, filteredProducts.length)} to {Math.min(currentPage * pageSize, filteredProducts.length)} of {filteredProducts.length} entries</span>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 bg-slate-700 text-slate-300 rounded-lg text-sm disabled:opacity-50">Previous</button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button key={i + 1} onClick={() => setCurrentPage(i + 1)} className={`px-3 py-1 rounded-lg text-sm ${currentPage === i + 1 ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'}`}>{i + 1}</button>
                  ))}
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 bg-slate-700 text-slate-300 rounded-lg text-sm disabled:opacity-50">Next</button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Expiry Alerts Tab */}
        {activeTab === 'expiry' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Expired Products */}
              <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <span className="text-red-400">🚨</span> Expired Products
                  <span className="ml-auto px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-sm">
                    {expiredProducts.length}
                  </span>
                </h3>
                {expiredProducts.length === 0 ? (
                  <p className="text-slate-400 text-sm">No expired products</p>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {expiredProducts.map(product => {
                      const status = getExpiryStatus(product.expiryDate)
                      return (
                        <div key={product.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                          <div>
                            <p className="text-white font-medium">{product.name}</p>
                            <p className="text-slate-400 text-xs">
                              Expired: {new Date(product.expiryDate).toLocaleDateString()}
                              <span className="text-red-400 ml-2">({status.days} days ago)</span>
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-medium">
                              {product.currentStock} in stock
                            </span>
                            <p className="text-slate-500 text-xs mt-1">
                              Value: {business.currency} {(product.currentStock * product.costPrice).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Expiring Soon */}
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <span className="text-yellow-400">⚠️</span> Expiring Soon (30 days)
                  <span className="ml-auto px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
                    {expiringProducts.filter(p => getExpiryStatus(p.expiryDate).status !== 'expired').length}
                  </span>
                </h3>
                {expiringProducts.filter(p => getExpiryStatus(p.expiryDate).status !== 'expired').length === 0 ? (
                  <p className="text-slate-400 text-sm">No products expiring soon</p>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {expiringProducts.filter(p => getExpiryStatus(p.expiryDate).status !== 'expired').map(product => (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <div>
                          <p className="text-white font-medium">{product.name}</p>
                          <p className="text-slate-400 text-xs">
                            Expires: {new Date(product.expiryDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <ExpiryBadge expiryDate={product.expiryDate} />
                          <p className="text-slate-500 text-xs mt-1">
                            Stock: {product.currentStock}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Low Stock Alert */}
              <div className="bg-slate-900/50 rounded-xl p-4">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <span className="text-orange-400">📦</span> Low Stock Alert
                  <span className="ml-auto px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full text-sm">
                    {lowStockProducts.length}
                  </span>
                </h3>
                {lowStockProducts.length === 0 ? (
                  <p className="text-slate-400 text-sm">All products are well stocked</p>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {lowStockProducts.slice(0, 10).map(product => (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <div>
                          <p className="text-white font-medium">{product.name}</p>
                          <p className="text-slate-400 text-xs">Alert at: {product.alertQuantity}</p>
                        </div>
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-medium">
                          {product.currentStock} left
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="bg-slate-900/50 rounded-xl p-4">
                <h3 className="text-lg font-medium text-white mb-4">📊 Expiry Summary</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <span className="text-red-400">Expired Products</span>
                    <div className="text-right">
                      <p className="text-white font-bold">{expiredProducts.length}</p>
                      <p className="text-slate-500 text-xs">
                        {business.currency} {expiredProducts.reduce((sum, p) => sum + (p.currentStock * p.costPrice), 0).toLocaleString()} at risk
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <span className="text-yellow-400">Expiring (7 days)</span>
                    <p className="text-white font-bold">
                      {products.filter(p => {
                        const s = getExpiryStatus(p.expiryDate)
                        return ['critical', 'today'].includes(s.status)
                      }).length}
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                    <span className="text-orange-400">Expiring (30 days)</span>
                    <p className="text-white font-bold">
                      {products.filter(p => {
                        const s = getExpiryStatus(p.expiryDate)
                        return s.days !== undefined && s.days <= 30 && s.days > 7
                      }).length}
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                    <span className="text-emerald-400">Safe (90+ days)</span>
                    <p className="text-white font-bold">
                      {products.filter(p => {
                        const s = getExpiryStatus(p.expiryDate)
                        return s.status === 'ok' || s.status === 'none'
                      }).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stock Report Tab */}
        {activeTab === 'stock' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900/50 rounded-xl p-4">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <span className="text-red-400">⚠️</span> Low Stock Alert
                </h3>
                {lowStockProducts.length === 0 ? (
                  <p className="text-slate-400 text-sm">All products are well stocked</p>
                ) : (
                  <div className="space-y-3">
                    {lowStockProducts.slice(0, 10).map(product => (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <div>
                          <p className="text-white font-medium">{product.name}</p>
                          <p className="text-slate-400 text-xs">Alert at: {product.alertQuantity}</p>
                        </div>
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-medium">
                          {product.currentStock} left
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-slate-900/50 rounded-xl p-4">
                <h3 className="text-lg font-medium text-white mb-4">📊 Stock by Category</h3>
                <div className="space-y-3">
                  {categories.map(category => {
                    const categoryProducts = products.filter(p => p.categoryId === category.id)
                    const totalStock = categoryProducts.reduce((sum, p) => sum + (p.currentStock || 0), 0)
                    const totalValue = categoryProducts.reduce((sum, p) => sum + ((p.currentStock || 0) * (p.costPrice || 0)), 0)
                    return (
                      <div key={category.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <div>
                          <p className="text-white font-medium">{category.name}</p>
                          <p className="text-slate-400 text-xs">{categoryProducts.length} products</p>
                        </div>
                        <div className="text-right">
                          <p className="text-emerald-400 font-medium">{totalStock} units</p>
                          <p className="text-slate-400 text-xs">{business.currency} {totalValue.toLocaleString()}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dropdown Portal */}
      {activeDropdown && activeProduct && (
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setActiveDropdown(null)} />
          <div 
            className="fixed w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-[9999]"
            style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
          >
            <div className="py-1">
              <button onClick={() => openViewModal(activeProduct)} className="w-full flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-700 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                View
              </button>
              <button onClick={() => openEditModal(activeProduct)} className="w-full flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-700 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Edit
              </button>
              <button onClick={() => handleDuplicate(activeProduct)} className="w-full flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-700 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                Duplicate
              </button>
              <hr className="my-1 border-slate-700" />
              <button onClick={() => handleDelete(activeDropdown)} className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-slate-700 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Delete
              </button>
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Product Modal - FIXED: added id/name/htmlFor/autoComplete to all fields */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label htmlFor="prodName" className="block text-sm font-medium text-slate-300 mb-2">Product Name *</label>
                    <input
                      id="prodName"
                      name="prodName"
                      autoComplete="off"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      placeholder="Enter product name"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="prodSku" className="block text-sm font-medium text-slate-300 mb-2">SKU</label>
                    <input
                      id="prodSku"
                      name="prodSku"
                      autoComplete="off"
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      placeholder="Auto-generated"
                    />
                  </div>
                </div>

                {/* UPDATED: Category, Brand, Unit with + Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Category with + Button */}
                  <div>
                    <label htmlFor="prodCategoryId" className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                    <div className="flex gap-2">
                      <select
                        id="prodCategoryId"
                        name="prodCategoryId"
                        value={formData.categoryId}
                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                        className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="">Select Category</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => { resetCategoryForm(); setShowCategoryModal(true); }}
                        className="px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                        title="Add New Category"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* Brand with + Button */}
                  <div>
                    <label htmlFor="prodBrandId" className="block text-sm font-medium text-slate-300 mb-2">Brand</label>
                    <div className="flex gap-2">
                      <select
                        id="prodBrandId"
                        name="prodBrandId"
                        value={formData.brandId}
                        onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                        className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="">Select Brand</option>
                        {brands.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => { resetBrandForm(); setShowBrandModal(true); }}
                        className="px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                        title="Add New Brand"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* Unit with + Button */}
                  <div>
                    <label htmlFor="prodUnitId" className="block text-sm font-medium text-slate-300 mb-2">Unit *</label>
                    <div className="flex gap-2">
                      <select
                        id="prodUnitId"
                        name="prodUnitId"
                        value={formData.unitId}
                        onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                        className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="">Select Unit</option>
                        {units.map(u => (
                          <option key={u.id} value={u.id}>{u.name} ({u.shortName})</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => { resetUnitForm(); setShowUnitModal(true); }}
                        className="px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                        title="Add New Unit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label htmlFor="prodBarcodeType" className="block text-sm font-medium text-slate-300 mb-2">Barcode Type</label>
                    <select
                      id="prodBarcodeType"
                      name="prodBarcodeType"
                      value={formData.barcodeType}
                      onChange={(e) => setFormData({ ...formData, barcodeType: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Code 128 (C128)">Code 128 (C128)</option>
                      <option value="Code 39">Code 39</option>
                      <option value="EAN-13">EAN-13</option>
                      <option value="EAN-8">EAN-8</option>
                      <option value="UPC-A">UPC-A</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="prodProductType" className="block text-sm font-medium text-slate-300 mb-2">Product Type</label>
                    <select
                      id="prodProductType"
                      name="prodProductType"
                      value={formData.productType}
                      onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Single">Single</option>
                      <option value="Variable">Variable</option>
                      <option value="Combo">Combo</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="prodTaxType" className="block text-sm font-medium text-slate-300 mb-2">Tax Type</label>
                    <select
                      id="prodTaxType"
                      name="prodTaxType"
                      value={formData.taxType}
                      onChange={(e) => setFormData({ ...formData, taxType: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="None">None</option>
                      <option value="Inclusive">Inclusive</option>
                      <option value="Exclusive">Exclusive</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="prodTaxRate" className="block text-sm font-medium text-slate-300 mb-2">Tax Rate (%)</label>
                    <input
                      id="prodTaxRate"
                      name="prodTaxRate"
                      autoComplete="off"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.taxRate}
                      onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Stock Management */}
                <div className="p-4 bg-slate-900/50 rounded-xl space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="manageStock"
                      name="manageStock"
                      checked={formData.manageStock}
                      onChange={(e) => setFormData({ ...formData, manageStock: e.target.checked })}
                      className="w-4 h-4 text-emerald-500 bg-slate-900 border-slate-700 rounded focus:ring-emerald-500"
                    />
                    <label htmlFor="manageStock" className="text-slate-300 text-sm font-medium">
                      Manage Stock?
                    </label>
                    <span className="text-slate-500 text-xs">Enable stock management at product level</span>
                  </div>

                  {formData.manageStock && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label htmlFor="prodAlertQuantity" className="block text-sm font-medium text-slate-300 mb-2">Alert Quantity</label>
                        <input
                          id="prodAlertQuantity"
                          name="prodAlertQuantity"
                          autoComplete="off"
                          type="number"
                          min="0"
                          value={formData.alertQuantity}
                          onChange={(e) => setFormData({ ...formData, alertQuantity: parseInt(e.target.value) || 0 })}
                          className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                          placeholder="Low stock alert"
                        />
                      </div>
                      <div>
                        <label htmlFor="prodCurrentStock" className="block text-sm font-medium text-slate-300 mb-2">Opening Stock</label>
                        <input
                          id="prodCurrentStock"
                          name="prodCurrentStock"
                          autoComplete="off"
                          type="number"
                          min="0"
                          value={formData.currentStock}
                          onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value) || 0 })}
                          className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                          placeholder="Initial stock"
                          disabled={editingProduct}
                        />
                        {editingProduct && (
                          <p className="text-xs text-slate-500 mt-1">Use Stock Adjustment to modify stock</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="prodExpiryDate" className="block text-sm font-medium text-slate-300 mb-2">
                          <span className="flex items-center gap-1">
                            Expiry Date
                            <span className="text-yellow-400">⏰</span>
                          </span>
                        </label>
                        <input
                          id="prodExpiryDate"
                          name="prodExpiryDate"
                          type="date"
                          value={formData.expiryDate}
                          onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">Default expiry (can be overridden in purchases)</p>
                      </div>
                      <div>
                        <label htmlFor="prodExpiryAlertDays" className="block text-sm font-medium text-slate-300 mb-2">Expiry Alert (Days)</label>
                        <input
                          id="prodExpiryAlertDays"
                          name="prodExpiryAlertDays"
                          autoComplete="off"
                          type="number"
                          min="1"
                          value={formData.expiryAlertDays}
                          onChange={(e) => setFormData({ ...formData, expiryAlertDays: parseInt(e.target.value) || 30 })}
                          className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                          placeholder="30"
                        />
                        <p className="text-xs text-slate-500 mt-1">Alert before expiry</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="prodCostPrice" className="block text-sm font-medium text-slate-300 mb-2">Cost Price (Purchase Price) *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-2.5 text-slate-400">{business.currency}</span>
                      <input
                        id="prodCostPrice"
                        name="prodCostPrice"
                        autoComplete="off"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.costPrice}
                        onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2 pl-10 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="prodSellingPrice" className="block text-sm font-medium text-slate-300 mb-2">Selling Price *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-2.5 text-slate-400">{business.currency}</span>
                      <input
                        id="prodSellingPrice"
                        name="prodSellingPrice"
                        autoComplete="off"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.sellingPrice}
                        onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2 pl-10 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    {formData.costPrice > 0 && formData.sellingPrice > 0 && (
                      <p className="text-xs text-emerald-400 mt-1">
                        Margin: {business.currency} {(formData.sellingPrice - formData.costPrice).toFixed(2)} ({(((formData.sellingPrice - formData.costPrice) / formData.costPrice) * 100).toFixed(1)}%)
                      </p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="prodDescription" className="block text-sm font-medium text-slate-300 mb-2">Product Description</label>
                  <textarea
                    id="prodDescription"
                    name="prodDescription"
                    autoComplete="off"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    rows="3"
                    placeholder="Enter product description..."
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all"
                  >
                    {editingProduct ? 'Update Product' : 'Save Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Quick Add Category Modal - FIXED: added id/name/htmlFor/autoComplete */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-t-2xl">
              <div>
                <h2 className="text-lg font-bold text-white">Quick Add Category</h2>
                <p className="text-emerald-100 text-sm">Create and select category</p>
              </div>
              <button onClick={() => setShowCategoryModal(false)} className="text-white/80 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleCategorySubmit} className="p-4 space-y-4">
              <div>
                <label htmlFor="qaCatName" className="block text-sm font-medium text-slate-300 mb-1">Category Name *</label>
                <input
                  id="qaCatName"
                  name="qaCatName"
                  autoComplete="off"
                  type="text"
                  value={newCategoryData.name}
                  onChange={(e) => setNewCategoryData({ ...newCategoryData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Category name"
                  required
                />
              </div>
              <div>
                <label htmlFor="qaCatCode" className="block text-sm font-medium text-slate-300 mb-1">Category Code</label>
                <input
                  id="qaCatCode"
                  name="qaCatCode"
                  autoComplete="off"
                  type="text"
                  value={newCategoryData.code}
                  onChange={(e) => setNewCategoryData({ ...newCategoryData, code: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="HSN Code (optional)"
                />
              </div>
              <div>
                <label htmlFor="qaCatDescription" className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  id="qaCatDescription"
                  name="qaCatDescription"
                  value={newCategoryData.description}
                  onChange={(e) => setNewCategoryData({ ...newCategoryData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  rows="2"
                  placeholder="Description (optional)"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all"
                >
                  Create & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW: Quick Add Brand Modal - FIXED: added id/name/htmlFor/autoComplete */}
      {showBrandModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-t-2xl">
              <div>
                <h2 className="text-lg font-bold text-white">Quick Add Brand</h2>
                <p className="text-emerald-100 text-sm">Create and select brand</p>
              </div>
              <button onClick={() => setShowBrandModal(false)} className="text-white/80 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleBrandSubmit} className="p-4 space-y-4">
              <div>
                <label htmlFor="qaBrandName" className="block text-sm font-medium text-slate-300 mb-1">Brand Name *</label>
                <input
                  id="qaBrandName"
                  name="qaBrandName"
                  autoComplete="off"
                  type="text"
                  value={newBrandData.name}
                  onChange={(e) => setNewBrandData({ ...newBrandData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Brand name"
                  required
                />
              </div>
              <div>
                <label htmlFor="qaBrandDescription" className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <input
                  id="qaBrandDescription"
                  name="qaBrandDescription"
                  autoComplete="off"
                  type="text"
                  value={newBrandData.description}
                  onChange={(e) => setNewBrandData({ ...newBrandData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Short description (optional)"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBrandModal(false)}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all"
                >
                  Create & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW: Quick Add Unit Modal - FIXED: added id/name/htmlFor/autoComplete */}
      {showUnitModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-t-2xl">
              <div>
                <h2 className="text-lg font-bold text-white">Quick Add Unit</h2>
                <p className="text-emerald-100 text-sm">Create and select unit</p>
              </div>
              <button onClick={() => setShowUnitModal(false)} className="text-white/80 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleUnitSubmit} className="p-4 space-y-4">
              <div>
                <label htmlFor="qaUnitName" className="block text-sm font-medium text-slate-300 mb-1">Unit Name *</label>
                <input
                  id="qaUnitName"
                  name="qaUnitName"
                  autoComplete="off"
                  type="text"
                  value={newUnitData.name}
                  onChange={(e) => setNewUnitData({ ...newUnitData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g., Kilogram"
                  required
                />
              </div>
              <div>
                <label htmlFor="qaUnitShortName" className="block text-sm font-medium text-slate-300 mb-1">Short Name *</label>
                <input
                  id="qaUnitShortName"
                  name="qaUnitShortName"
                  autoComplete="off"
                  type="text"
                  value={newUnitData.shortName}
                  onChange={(e) => setNewUnitData({ ...newUnitData, shortName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g., Kg"
                  required
                />
              </div>
              <div>
                <label htmlFor="qaUnitAllowDecimal" className="block text-sm font-medium text-slate-300 mb-1">Allow Decimal</label>
                <select
                  id="qaUnitAllowDecimal"
                  name="qaUnitAllowDecimal"
                  value={newUnitData.allowDecimal ? 'yes' : 'no'}
                  onChange={(e) => setNewUnitData({ ...newUnitData, allowDecimal: e.target.value === 'yes' })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUnitModal(false)}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all"
                >
                  Create & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Product Modal */}
      {showViewModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Product Details</h2>
              <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Product Header */}
            <div className="p-6 border-b border-slate-700/50 bg-slate-900/30">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 bg-slate-700 rounded-xl flex items-center justify-center flex-shrink-0">
                  {selectedProduct.image ? (
                    <img src={selectedProduct.image} alt={selectedProduct.name} className="w-20 h-20 rounded-xl object-cover" />
                  ) : (
                    <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">{selectedProduct.name}</h3>
                  <p className="text-cyan-400 font-mono">{selectedProduct.sku}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-slate-400 text-sm">{getCategoryName(selectedProduct.categoryId)}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400 text-sm">{getBrandName(selectedProduct.brandId)}</span>
                    {selectedProduct.expiryDate && (
                      <>
                        <span className="text-slate-600">•</span>
                        <ExpiryBadge expiryDate={selectedProduct.expiryDate} />
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-sm">Current Stock</p>
                  <p className={`text-2xl font-bold ${
                    selectedProduct.currentStock <= selectedProduct.alertQuantity
                      ? 'text-red-400'
                      : 'text-emerald-400'
                  }`}>
                    {selectedProduct.currentStock || 0} {getUnitName(selectedProduct.unitId)}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-700/50">
              <div className="flex gap-1 p-2">
                <button
                  onClick={() => setViewTab('details')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewTab === 'details' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  📋 Details
                </button>
                <button
                  onClick={() => setViewTab('adjustments')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewTab === 'adjustments' ? 'bg-orange-500/20 text-orange-400' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  🔄 Stock Adjustments
                </button>
                <button
                  onClick={() => setViewTab('purchases')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewTab === 'purchases' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  📥 Purchases
                </button>
                <button
                  onClick={() => setViewTab('sales')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewTab === 'sales' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  📤 Sales
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              
              {/* Details Tab */}
              {viewTab === 'details' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-900/50 p-4 rounded-lg">
                      <p className="text-slate-400 text-sm">Category</p>
                      <p className="text-white font-medium">{getCategoryName(selectedProduct.categoryId)}</p>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-lg">
                      <p className="text-slate-400 text-sm">Brand</p>
                      <p className="text-white font-medium">{getBrandName(selectedProduct.brandId)}</p>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-lg">
                      <p className="text-slate-400 text-sm">Unit</p>
                      <p className="text-white font-medium">{getUnitName(selectedProduct.unitId)}</p>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-lg">
                      <p className="text-slate-400 text-sm">Product Type</p>
                      <p className="text-white font-medium">{selectedProduct.productType || 'Single'}</p>
                    </div>
                  </div>

                  {selectedProduct.expiryDate && (
                    <div className={`p-4 rounded-lg border ${
                      getExpiryStatus(selectedProduct.expiryDate).status === 'expired' 
                        ? 'bg-red-900/20 border-red-500/30' 
                        : getExpiryStatus(selectedProduct.expiryDate).status === 'critical' || getExpiryStatus(selectedProduct.expiryDate).status === 'warning'
                          ? 'bg-yellow-900/20 border-yellow-500/30'
                          : 'bg-emerald-900/20 border-emerald-500/30'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-400 text-sm">Expiry Date</p>
                          <p className="text-white font-medium">{new Date(selectedProduct.expiryDate).toLocaleDateString()}</p>
                        </div>
                        <ExpiryBadge expiryDate={selectedProduct.expiryDate} />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-900/50 p-4 rounded-lg">
                      <p className="text-slate-400 text-sm">Cost Price</p>
                      <p className="text-white font-bold text-lg">{business.currency} {(selectedProduct.costPrice || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-lg">
                      <p className="text-slate-400 text-sm">Selling Price</p>
                      <p className="text-emerald-400 font-bold text-lg">{business.currency} {(selectedProduct.sellingPrice || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-lg">
                      <p className="text-slate-400 text-sm">Margin</p>
                      <p className="text-cyan-400 font-bold text-lg">
                        {selectedProduct.costPrice > 0 
                          ? `${(((selectedProduct.sellingPrice - selectedProduct.costPrice) / selectedProduct.costPrice) * 100).toFixed(1)}%`
                          : '-'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-sm">Current Stock</p>
                        <p className={`font-bold text-2xl ${
                          selectedProduct.currentStock <= selectedProduct.alertQuantity
                            ? 'text-red-400'
                            : 'text-emerald-400'
                        }`}>
                          {selectedProduct.currentStock || 0} {getUnitName(selectedProduct.unitId)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-sm">Alert Quantity</p>
                        <p className="text-yellow-400 font-medium">{selectedProduct.alertQuantity || 0}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-sm">Stock Value</p>
                        <p className="text-white font-medium">{business.currency} {((selectedProduct.currentStock || 0) * (selectedProduct.costPrice || 0)).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const summary = getStockMovementSummary(selectedProduct.id)
                    return (
                      <div className="bg-slate-900/50 p-4 rounded-lg">
                        <h4 className="text-white font-medium mb-3">Stock Movement Summary</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                            <p className="text-purple-400 text-sm">Purchased</p>
                            <p className="text-white font-bold text-xl">+{summary.totalPurchased}</p>
                          </div>
                          <div className="text-center p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                            <p className="text-cyan-400 text-sm">Sold</p>
                            <p className="text-white font-bold text-xl">-{summary.totalSold}</p>
                          </div>
                          <div className={`text-center p-3 rounded-lg ${summary.totalAdjusted >= 0 ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                            <p className={summary.totalAdjusted >= 0 ? 'text-emerald-400 text-sm' : 'text-red-400 text-sm'}>Adjusted</p>
                            <p className="text-white font-bold text-xl">{summary.totalAdjusted >= 0 ? '+' : ''}{summary.totalAdjusted}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })()}

                  {selectedProduct.description && (
                    <div className="bg-slate-900/50 p-4 rounded-lg">
                      <p className="text-slate-400 text-sm mb-2">Description</p>
                      <p className="text-white">{selectedProduct.description}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Stock Adjustments Tab */}
              {viewTab === 'adjustments' && (
                <div className="space-y-4">
                  {getProductAdjustments(selectedProduct.id).length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-slate-400">No stock adjustments for this product</p>
                    </div>
                  ) : (
                    <div className="bg-slate-900/30 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-slate-900">
                            <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Date</th>
                            <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Reference</th>
                            <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Quantity</th>
                            <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Type</th>
                            <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getProductAdjustments(selectedProduct.id).map((adj, idx) => (
                            <tr key={idx} className="border-t border-slate-700/50">
                              <td className="px-4 py-3 text-white">{new Date(adj.date || adj.createdAt).toLocaleDateString()}</td>
                              <td className="px-4 py-3 text-cyan-400 font-mono text-sm">{adj.referenceNo}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-1 rounded-full text-sm font-medium ${adj.quantity > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                  {adj.quantity > 0 ? '+' : ''}{adj.quantity}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs ${adj.adjustmentType === 'normal' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                  {adj.adjustmentType === 'normal' ? 'Normal' : 'Abnormal'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-400 text-sm">{adj.reason || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Purchases Tab */}
              {viewTab === 'purchases' && (
                <div className="space-y-4">
                  {getProductPurchases(selectedProduct.id).length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-slate-400">No purchases for this product</p>
                    </div>
                  ) : (
                    <div className="bg-slate-900/30 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-slate-900">
                            <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Date</th>
                            <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Reference</th>
                            <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Quantity</th>
                            <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Unit Price</th>
                            <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Expiry</th>
                            <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getProductPurchases(selectedProduct.id).map((purchase, idx) => (
                            <tr key={idx} className="border-t border-slate-700/50">
                              <td className="px-4 py-3 text-white">{new Date(purchase.date || purchase.createdAt).toLocaleDateString()}</td>
                              <td className="px-4 py-3 text-purple-400 font-mono text-sm">{purchase.referenceNo || purchase.purchaseNo}</td>
                              <td className="px-4 py-3 text-center">
                                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-medium">
                                  +{purchase.quantity}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right text-slate-300">{business.currency} {(purchase.unitPrice || 0).toLocaleString()}</td>
                              <td className="px-4 py-3">
                                {purchase.itemExpiryDate ? (
                                  <ExpiryBadge expiryDate={purchase.itemExpiryDate} />
                                ) : (
                                  <span className="text-slate-500 text-xs">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right text-white font-medium">{business.currency} {(purchase.subtotal || 0).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Sales Tab */}
              {viewTab === 'sales' && (
                <div className="space-y-4">
                  {getProductSales(selectedProduct.id).length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-slate-400">No sales for this product</p>
                    </div>
                  ) : (
                    <div className="bg-slate-900/30 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-slate-900">
                            <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Date</th>
                            <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Invoice</th>
                            <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Quantity</th>
                            <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Unit Price</th>
                            <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getProductSales(selectedProduct.id).map((sale, idx) => (
                            <tr key={idx} className="border-t border-slate-700/50">
                              <td className="px-4 py-3 text-white">{new Date(sale.date || sale.createdAt).toLocaleDateString()}</td>
                              <td className="px-4 py-3 text-cyan-400 font-mono text-sm">{sale.invoiceNo}</td>
                              <td className="px-4 py-3 text-center">
                                <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-medium">
                                  -{sale.quantity}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right text-slate-300">{business.currency} {(sale.unitPrice || 0).toLocaleString()}</td>
                              <td className="px-4 py-3 text-right text-white font-medium">{business.currency} {(sale.subtotal || 0).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => { setShowViewModal(false); openEditModal(selectedProduct); }}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all"
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