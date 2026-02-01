import { useState } from 'react'
import { useApp } from '../context/AppContext'

export default function StockAdjustment() {
  const { state, dispatch } = useApp()
  const { stockAdjustments, products, business } = state
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedAdjustment, setSelectedAdjustment] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })

  // Add form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 16),
    adjustmentType: '',
    totalAmountRecovered: 0,
    reason: ''
  })
  const [adjustmentItems, setAdjustmentItems] = useState([])
  const [productSearch, setProductSearch] = useState('')
  const [showProductDropdown, setShowProductDropdown] = useState(false)

  // Filter adjustments
  const filteredAdjustments = (stockAdjustments || []).filter(adj => {
    const matchesSearch = adj.referenceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         adj.reason?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || adj.adjustmentType === typeFilter
    return matchesSearch && matchesType
  })

  // Summary calculations
  const totalAdjustments = filteredAdjustments.length
  const totalNormal = filteredAdjustments.filter(a => a.adjustmentType === 'normal').length
  const totalAbnormal = filteredAdjustments.filter(a => a.adjustmentType === 'abnormal').length
  const totalLoss = filteredAdjustments.reduce((sum, a) => sum + ((a.totalAmount || 0) - (a.totalAmountRecovered || 0)), 0)

  // Product helpers
  const getProduct = (id) => products.find(p => p.id === id) || { name: 'Unknown', sku: '-' }
  
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku?.toLowerCase().includes(productSearch.toLowerCase())
  )

  // Adjustment types
  const adjustmentTypes = [
    { value: 'normal', label: 'Normal', description: 'Regular stock correction' },
    { value: 'abnormal', label: 'Abnormal', description: 'Damaged, expired, or theft' }
  ]

  function resetForm() {
    setFormData({
      date: new Date().toISOString().slice(0, 16),
      adjustmentType: '',
      totalAmountRecovered: 0,
      reason: ''
    })
    setAdjustmentItems([])
    setProductSearch('')
  }

  function openAddModal() {
    resetForm()
    setShowAddModal(true)
  }

  function addProduct(product) {
    // Check if product already added
    if (adjustmentItems.find(item => item.productId === product.id)) {
      setProductSearch('')
      setShowProductDropdown(false)
      return
    }

    setAdjustmentItems([...adjustmentItems, {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      currentStock: product.currentStock || 0,
      quantity: 0,
      unitPrice: product.costPrice || 0,
      subtotal: 0
    }])
    setProductSearch('')
    setShowProductDropdown(false)
  }

  function updateItemQuantity(index, quantity) {
    const updated = [...adjustmentItems]
    updated[index].quantity = parseInt(quantity) || 0
    updated[index].subtotal = Math.abs(updated[index].quantity) * updated[index].unitPrice
    setAdjustmentItems(updated)
  }

  function updateItemPrice(index, price) {
    const updated = [...adjustmentItems]
    updated[index].unitPrice = parseFloat(price) || 0
    updated[index].subtotal = Math.abs(updated[index].quantity) * updated[index].unitPrice
    setAdjustmentItems(updated)
  }

  function removeItem(index) {
    setAdjustmentItems(adjustmentItems.filter((_, i) => i !== index))
  }

  function calculateTotalAmount() {
    return adjustmentItems.reduce((sum, item) => sum + (item.subtotal || 0), 0)
  }

  function handleSubmit(e) {
    e.preventDefault()
    
    if (!formData.adjustmentType) {
      alert('Please select adjustment type')
      return
    }
    if (adjustmentItems.length === 0) {
      alert('Please add at least one product')
      return
    }
    if (adjustmentItems.some(item => item.quantity === 0)) {
      alert('Quantity cannot be zero for any product')
      return
    }

    const adjustmentData = {
      ...formData,
      date: new Date(formData.date).toISOString(),
      items: adjustmentItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal
      })),
      totalAmount: calculateTotalAmount(),
      totalAmountRecovered: parseFloat(formData.totalAmountRecovered) || 0,
      location: business.name
    }

    dispatch({ type: 'ADD_STOCK_ADJUSTMENT_FULL', payload: adjustmentData })
    setShowAddModal(false)
    resetForm()
  }

  function handleDropdownClick(e, adjustmentId) {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setDropdownPosition({ top: rect.bottom + 4, left: rect.left })
    setActiveDropdown(activeDropdown === adjustmentId ? null : adjustmentId)
  }

  function openViewModal(adjustment) {
    setSelectedAdjustment(adjustment)
    setShowViewModal(true)
    setActiveDropdown(null)
  }

  function handleDelete(id) {
    if (confirm('Are you sure you want to delete this adjustment? This will NOT reverse the stock changes.')) {
      dispatch({ type: 'DELETE_STOCK_ADJUSTMENT', payload: id })
    }
    setActiveDropdown(null)
  }

  const activeAdj = stockAdjustments?.find(a => a.id === activeDropdown)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Stock Adjustments</h1>
          <p className="text-slate-400 text-sm">Manage inventory corrections and adjustments</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-cyan-600 transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Adjustment
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Adjustments</p>
              <p className="text-2xl font-bold text-white">{totalAdjustments}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Normal Adjustments</p>
              <p className="text-2xl font-bold text-emerald-400">{totalNormal}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Abnormal Adjustments</p>
              <p className="text-2xl font-bold text-orange-400">{totalAbnormal}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Loss</p>
              <p className="text-2xl font-bold text-red-400">{business.currency} {totalLoss.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm"
          >
            <option value="all">All Types</option>
            <option value="normal">Normal</option>
            <option value="abnormal">Abnormal</option>
          </select>
          <div className="flex-1"></div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 pl-10 text-white text-sm w-64"
            />
            <svg className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-900/50">
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Action</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Date</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Reference No</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Location</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Adjustment Type</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Total Amount</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Amount Recovered</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Reason</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Added By</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdjustments.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-slate-500">No data available in table</td>
                </tr>
              ) : (
                filteredAdjustments.map(adjustment => (
                  <tr key={adjustment.id} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => handleDropdownClick(e, adjustment.id)}
                        className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600 transition-colors flex items-center gap-1"
                      >
                        Actions
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-white">{new Date(adjustment.date || adjustment.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-cyan-400 font-medium">{adjustment.referenceNo}</td>
                    <td className="px-4 py-3 text-slate-300">{adjustment.location || business.name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        adjustment.adjustmentType === 'normal' 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-orange-500/20 text-orange-400'
                      }`}>
                        {adjustment.adjustmentType === 'normal' ? 'Normal' : 'Abnormal'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white">{business.currency} {(adjustment.totalAmount || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-emerald-400">{business.currency} {(adjustment.totalAmountRecovered || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-300 max-w-[200px] truncate">{adjustment.reason || '-'}</td>
                    <td className="px-4 py-3 text-slate-300">{adjustment.addedBy || 'Admin'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-700/50 flex items-center justify-between">
          <span className="text-slate-400 text-sm">Showing {filteredAdjustments.length} entries</span>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 bg-slate-700 text-slate-300 rounded-lg text-sm">Previous</button>
            <button className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-sm">1</button>
            <button className="px-3 py-1 bg-slate-700 text-slate-300 rounded-lg text-sm">Next</button>
          </div>
        </div>
      </div>

      {/* Dropdown Portal */}
      {activeDropdown && activeAdj && (
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setActiveDropdown(null)} />
          <div 
            className="fixed w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-[9999]"
            style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
          >
            <div className="py-1">
              <button onClick={() => openViewModal(activeAdj)} className="w-full flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-700 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                View
              </button>
              <button className="w-full flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-700 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                Print
              </button>
              <hr className="my-1 border-slate-700" />
              <button onClick={() => handleDelete(activeAdj.id)} className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-slate-700 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Delete
              </button>
            </div>
          </div>
        </>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800 z-10">
              <h2 className="text-xl font-bold text-white">Add Stock Adjustment</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Top Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Business Location *</label>
                  <input
                    type="text"
                    value={business.name}
                    readOnly
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Reference No</label>
                  <input
                    type="text"
                    placeholder="Auto generated"
                    readOnly
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Date *</label>
                  <input
                    type="datetime-local"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Adjustment Type *</label>
                  <select
                    value={formData.adjustmentType}
                    onChange={(e) => setFormData({ ...formData, adjustmentType: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    required
                  >
                    <option value="">Please Select</option>
                    {adjustmentTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Type Description */}
              {formData.adjustmentType && (
                <div className={`p-3 rounded-lg text-sm ${
                  formData.adjustmentType === 'normal' 
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : 'bg-orange-500/10 border border-orange-500/30 text-orange-400'
                }`}>
                  {formData.adjustmentType === 'normal' 
                    ? '📦 Normal Adjustment: Use for regular stock corrections (counting errors, stock takes, transfers)'
                    : '⚠️ Abnormal Adjustment: Use for damaged goods, expired items, theft, or other losses'}
                </div>
              )}

              {/* Product Search */}
              <div className="bg-slate-900/50 rounded-xl p-4">
                <div className="relative">
                  <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search products for stock adjustment"
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value)
                        setShowProductDropdown(true)
                      }}
                      onFocus={() => setShowProductDropdown(true)}
                      className="flex-1 bg-transparent text-white outline-none placeholder-slate-500"
                    />
                  </div>
                  
                  {/* Product Dropdown */}
                  {showProductDropdown && productSearch && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
                      {filteredProducts.length === 0 ? (
                        <div className="p-4 text-slate-500 text-center">No products found</div>
                      ) : (
                        filteredProducts.slice(0, 10).map(product => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => addProduct(product)}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700 text-left"
                          >
                            <div>
                              <div className="text-white font-medium">{product.name}</div>
                              <div className="text-slate-400 text-sm">SKU: {product.sku}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-cyan-400 text-sm">Stock: {product.currentStock || 0}</div>
                              <div className="text-slate-400 text-sm">{business.currency} {product.costPrice || 0}</div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Products Table */}
              <div className="bg-slate-900/50 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-900">
                      <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Product</th>
                      <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Current Stock</th>
                      <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Quantity (+/-)</th>
                      <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Unit Price</th>
                      <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Subtotal</th>
                      <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {adjustmentItems.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-8 text-slate-500">
                          Search and add products above
                        </td>
                      </tr>
                    ) : (
                      adjustmentItems.map((item, index) => (
                        <tr key={index} className="border-t border-slate-700/50">
                          <td className="px-4 py-3">
                            <div className="text-white font-medium">{item.productName}</div>
                            <div className="text-slate-400 text-sm">SKU: {item.sku}</div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2 py-1 bg-slate-700 rounded text-cyan-400 text-sm">{item.currentStock}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateItemQuantity(index, e.target.value)}
                                className="w-24 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-center"
                                placeholder="0"
                              />
                              <span className={`text-xs ${item.quantity > 0 ? 'text-emerald-400' : item.quantity < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                                {item.quantity > 0 ? '↑ Add' : item.quantity < 0 ? '↓ Remove' : ''}
                              </span>
                            </div>
                            {item.quantity !== 0 && (
                              <div className="text-center text-xs text-slate-400 mt-1">
                                New Stock: <span className={item.currentStock + item.quantity < 0 ? 'text-red-400' : 'text-emerald-400'}>
                                  {item.currentStock + item.quantity}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateItemPrice(index, e.target.value)}
                              className="w-28 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-center"
                            />
                          </td>
                          <td className="px-4 py-3 text-right text-cyan-400 font-medium">
                            {business.currency} {(item.subtotal || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="p-1.5 bg-red-500/20 rounded-lg hover:bg-red-500/30 text-red-400"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-700 bg-slate-900/50">
                      <td colSpan="4" className="px-4 py-3 text-right text-slate-300 font-medium">Total Amount:</td>
                      <td className="px-4 py-3 text-right text-xl font-bold text-cyan-400">{business.currency} {calculateTotalAmount().toFixed(2)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Bottom Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Total Amount Recovered
                    <span className="ml-2 text-slate-500 text-xs" title="Amount recovered from damaged/expired goods">ℹ️</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{business.currency}</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.totalAmountRecovered}
                      onChange={(e) => setFormData({ ...formData, totalAmountRecovered: e.target.value })}
                      className="w-full px-4 py-2 pl-10 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-slate-500 text-xs mt-1">Amount recovered from selling damaged items at discount or insurance claims</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Reason</label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white resize-none"
                    rows="3"
                    placeholder="Enter reason for adjustment..."
                  />
                </div>
              </div>

              {/* Net Loss Display */}
              {calculateTotalAmount() > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-red-400">Net Loss:</span>
                    <span className="text-xl font-bold text-red-400">
                      {business.currency} {(calculateTotalAmount() - (parseFloat(formData.totalAmountRecovered) || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Submit Button */}
              <div className="flex justify-center pt-4">
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedAdjustment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Stock Adjustment - {selectedAdjustment.referenceNo}</h2>
              <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/50 p-3 rounded-lg">
                  <p className="text-slate-400 text-sm">Date</p>
                  <p className="text-white font-medium">{new Date(selectedAdjustment.date || selectedAdjustment.createdAt).toLocaleString()}</p>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-lg">
                  <p className="text-slate-400 text-sm">Location</p>
                  <p className="text-white font-medium">{selectedAdjustment.location || business.name}</p>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-lg">
                  <p className="text-slate-400 text-sm">Type</p>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    selectedAdjustment.adjustmentType === 'normal' 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : 'bg-orange-500/20 text-orange-400'
                  }`}>
                    {selectedAdjustment.adjustmentType === 'normal' ? 'Normal' : 'Abnormal'}
                  </span>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-lg">
                  <p className="text-slate-400 text-sm">Added By</p>
                  <p className="text-white font-medium">{selectedAdjustment.addedBy || 'Admin'}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="text-white font-medium mb-3">Adjusted Products</h3>
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-900/50">
                      <th className="text-left px-4 py-2 text-slate-400 text-sm">Product</th>
                      <th className="text-center px-4 py-2 text-slate-400 text-sm">Quantity</th>
                      <th className="text-right px-4 py-2 text-slate-400 text-sm">Unit Price</th>
                      <th className="text-right px-4 py-2 text-slate-400 text-sm">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedAdjustment.items || []).map((item, idx) => {
                      const product = getProduct(item.productId)
                      return (
                        <tr key={idx} className="border-t border-slate-700/50">
                          <td className="px-4 py-2 text-white">{product.name}</td>
                          <td className="px-4 py-2 text-center">
                            <span className={item.quantity > 0 ? 'text-emerald-400' : 'text-red-400'}>
                              {item.quantity > 0 ? '+' : ''}{item.quantity}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right text-slate-300">{business.currency} {(item.unitPrice || 0).toFixed(2)}</td>
                          <td className="px-4 py-2 text-right text-cyan-400">{business.currency} {(item.subtotal || 0).toFixed(2)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="bg-slate-900/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Amount:</span>
                  <span className="text-white font-medium">{business.currency} {(selectedAdjustment.totalAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount Recovered:</span>
                  <span className="text-emerald-400">{business.currency} {(selectedAdjustment.totalAmountRecovered || 0).toFixed(2)}</span>
                </div>
                <hr className="border-slate-700" />
                <div className="flex justify-between text-lg font-medium">
                  <span className="text-slate-300">Net Loss:</span>
                  <span className="text-red-400">{business.currency} {((selectedAdjustment.totalAmount || 0) - (selectedAdjustment.totalAmountRecovered || 0)).toFixed(2)}</span>
                </div>
              </div>

              {/* Reason */}
              {selectedAdjustment.reason && (
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-1">Reason</p>
                  <p className="text-white">{selectedAdjustment.reason}</p>
                </div>
              )}

              <div className="flex justify-end">
                <button onClick={() => setShowViewModal(false)} className="px-4 py-2 bg-slate-700 text-white rounded-lg">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}