import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function Purchases() {
  const navigate = useNavigate()
  const { state, dispatch } = useApp()
  const { purchases = [], suppliers = [], products = [], categories = [], brands = [], units = [], business, paymentAccounts = [] } = state
  
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSupplier, setFilterSupplier] = useState('all')

  const [formData, setFormData] = useState({
    supplierId: '',
    referenceNo: '',
    date: new Date().toISOString().slice(0, 16),
    status: 'received',
    items: [],
    discount: 0,
    taxRate: 0,
    shipping: 0,
    amountPaid: 0,
    paymentMethod: 'cash',
    paymentAccountId: '',
    note: ''
  })

  const [productSearch, setProductSearch] = useState('')
  const [showProductDropdown, setShowProductDropdown] = useState(false)

  // New Product Form Data
  const [newProductData, setNewProductData] = useState({
    name: '',
    sku: '',
    categoryId: '',
    brandId: '',
    unitId: '',
    costPrice: '',
    sellingPrice: '',
    currentStock: 0,
    alertQuantity: 5,
    expiryDate: '',
    description: ''
  })

  // Filter active payment accounts
  const activeAccounts = paymentAccounts.filter(acc => acc.status !== 'closed')

  // Filter purchases
  const filteredPurchases = purchases.filter(p => {
    const supplier = suppliers.find(s => s.id === p.supplierId)
    const matchSearch = 
      p.purchaseNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.referenceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier?.businessName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchStatus = filterStatus === 'all' || p.status === filterStatus
    const matchSupplier = filterSupplier === 'all' || p.supplierId === parseInt(filterSupplier)
    
    return matchSearch && matchStatus && matchSupplier
  })

  // Filter products for search
  const searchedProducts = productSearch.trim()
    ? products.filter(p =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku?.toLowerCase().includes(productSearch.toLowerCase())
      )
    : []

  // Calculate totals
  const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0)
  const discountAmount = formData.discount || 0
  const taxAmount = ((subtotal - discountAmount) * (formData.taxRate || 0)) / 100
  const total = subtotal - discountAmount + taxAmount + (parseFloat(formData.shipping) || 0)

  // Generate SKU
  function generateSKU() {
    const prefix = 'PRD'
    const number = String(products.length + 1).padStart(4, '0')
    return `${prefix}-${number}`
  }

  // Get account name helper
  function getAccountName(id) {
    return paymentAccounts?.find(a => a.id === id)?.name || '-'
  }

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

  // Expiry badge component
  function ExpiryBadge({ expiryDate }) {
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
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorClasses[status.color]}`}>
        {status.label}
      </span>
    )
  }

  function resetForm() {
    setFormData({
      supplierId: '',
      referenceNo: '',
      date: new Date().toISOString().slice(0, 16),
      status: 'received',
      items: [],
      discount: 0,
      taxRate: 0,
      shipping: 0,
      amountPaid: 0,
      paymentMethod: 'cash',
      paymentAccountId: '',
      note: ''
    })
    setProductSearch('')
  }

  function resetProductForm() {
    setNewProductData({
      name: '',
      sku: generateSKU(),
      categoryId: '',
      brandId: '',
      unitId: '',
      costPrice: '',
      sellingPrice: '',
      currentStock: 0,
      alertQuantity: 5,
      expiryDate: '',
      description: ''
    })
  }

  function openAddModal() {
    resetForm()
    setShowModal(true)
  }

  function openProductModal() {
    resetProductForm()
    setShowProductModal(true)
    setShowProductDropdown(false)
  }

  function addProduct(product) {
    const existing = formData.items.find(item => item.productId === product.id)
    if (existing) {
      setFormData({
        ...formData,
        items: formData.items.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      })
    } else {
      setFormData({
        ...formData,
        items: [...formData.items, {
          productId: product.id,
          name: product.name,
          sku: product.sku || '',
          quantity: 1,
          unitCost: product.costPrice || 0,
          expiryDate: product.expiryDate || '' // Default to product's expiry date
        }]
      })
    }
    setProductSearch('')
    setShowProductDropdown(false)
  }

  function updateItemQuantity(productId, quantity) {
    if (quantity <= 0) {
      setFormData({
        ...formData,
        items: formData.items.filter(item => item.productId !== productId)
      })
      return
    }
    setFormData({
      ...formData,
      items: formData.items.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      )
    })
  }

  function updateItemCost(productId, unitCost) {
    setFormData({
      ...formData,
      items: formData.items.map(item =>
        item.productId === productId ? { ...item, unitCost: parseFloat(unitCost) || 0 } : item
      )
    })
  }

  // Update item expiry date
  function updateItemExpiry(productId, expiryDate) {
    setFormData({
      ...formData,
      items: formData.items.map(item =>
        item.productId === productId ? { ...item, expiryDate } : item
      )
    })
  }

  function removeItem(productId) {
    setFormData({
      ...formData,
      items: formData.items.filter(item => item.productId !== productId)
    })
  }

  // Handle New Product Submit
  function handleProductSubmit(e) {
    e.preventDefault()
    
    if (!newProductData.name) {
      alert('Product name is required')
      return
    }

    const newProduct = {
      ...newProductData,
      costPrice: parseFloat(newProductData.costPrice) || 0,
      sellingPrice: parseFloat(newProductData.sellingPrice) || 0,
      currentStock: parseInt(newProductData.currentStock) || 0,
      alertQuantity: parseInt(newProductData.alertQuantity) || 5,
      categoryId: newProductData.categoryId ? parseInt(newProductData.categoryId) : null,
      brandId: newProductData.brandId ? parseInt(newProductData.brandId) : null,
      unitId: newProductData.unitId ? parseInt(newProductData.unitId) : null,
      expiryDate: newProductData.expiryDate || '',
      id: Date.now()
    }

    dispatch({ type: 'ADD_PRODUCT', payload: newProduct })

    setFormData({
      ...formData,
      items: [...formData.items, {
        productId: newProduct.id,
        name: newProduct.name,
        sku: newProduct.sku || '',
        quantity: 1,
        unitCost: newProduct.costPrice || 0,
        expiryDate: newProduct.expiryDate || ''
      }]
    })

    setShowProductModal(false)
    resetProductForm()
  }

  function handleSubmit(e) {
    e.preventDefault()
    
    if (!formData.supplierId) {
      alert('Please select a supplier')
      return
    }
    if (formData.items.length === 0) {
      alert('Please add at least one product')
      return
    }

    dispatch({
      type: 'ADD_PURCHASE',
      payload: {
        ...formData,
        supplierId: parseInt(formData.supplierId),
        paymentAccountId: formData.paymentAccountId ? parseInt(formData.paymentAccountId) : null,
        total,
        subtotal,
        taxAmount,
        discountAmount
      }
    })

    setShowModal(false)
    resetForm()
  }

  function handleDelete(id) {
    if (confirm('Are you sure you want to delete this purchase?')) {
      dispatch({ type: 'DELETE_PURCHASE', payload: id })
    }
  }

  function openPaymentModal(purchase) {
    setSelectedPurchase(purchase)
    setShowPaymentModal(true)
  }

  function openViewModal(purchase) {
    setSelectedPurchase(purchase)
    setShowViewModal(true)
  }

  // Get supplier name helper
  function getSupplierName(supplierId) {
    const supplier = suppliers.find(s => s.id === supplierId)
    return supplier?.businessName || supplier?.name || '-'
  }

  // Status badge
  function getStatusBadge(status) {
    const styles = {
      paid: 'bg-emerald-500/20 text-emerald-400',
      partial: 'bg-yellow-500/20 text-yellow-400',
      due: 'bg-red-500/20 text-red-400',
      ordered: 'bg-blue-500/20 text-blue-400',
      received: 'bg-cyan-500/20 text-cyan-400'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-slate-500/20 text-slate-400'}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    )
  }

  // Calculate totals for summary
  const totalPurchases = filteredPurchases.reduce((sum, p) => sum + (p.total || 0), 0)
  const totalPaid = filteredPurchases.reduce((sum, p) => sum + (p.amountPaid || 0), 0)
  const totalDue = totalPurchases - totalPaid

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Purchases</h1>
          <p className="text-slate-400 text-sm">Manage your purchase orders</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-cyan-600 transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Purchase
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Purchases</p>
              <p className="text-2xl font-bold text-white">{filteredPurchases.length}</p>
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
              <p className="text-slate-400 text-sm">Total Amount</p>
              <p className="text-2xl font-bold text-emerald-400">{business.currency} {totalPurchases.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Amount Paid</p>
              <p className="text-2xl font-bold text-cyan-400">{business.currency} {totalPaid.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Amount Due</p>
              <p className="text-2xl font-bold text-red-400">{business.currency} {totalDue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl">
        {/* Table Header */}
        <div className="p-4 border-b border-slate-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="due">Due</option>
            </select>
            <select
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Suppliers</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.businessName || s.name}</option>
              ))}
            </select>
          </div>
          <div className="relative w-full md:w-auto">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm w-full md:w-64 focus:outline-none focus:border-emerald-500 pl-10"
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
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Date</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Purchase No</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Supplier</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Account</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Status</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Total</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Paid</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Due</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center gap-3">
                      <svg className="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p>No purchases found</p>
                      <button 
                        onClick={openAddModal}
                        className="text-emerald-400 hover:underline text-sm"
                      >
                        + Create your first purchase
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPurchases.map(purchase => (
                  <tr key={purchase.id} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                    <td className="px-4 py-3 text-white">
                      {new Date(purchase.date || purchase.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-cyan-400 font-medium">{purchase.purchaseNo}</td>
                    <td className="px-4 py-3 text-white">{getSupplierName(purchase.supplierId)}</td>
                    <td className="px-4 py-3 text-slate-300">{getAccountName(purchase.paymentAccountId)}</td>
                    <td className="px-4 py-3">{getStatusBadge(purchase.status)}</td>
                    <td className="px-4 py-3 text-white font-medium">
                      {business.currency} {(purchase.total || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-emerald-400">
                      {business.currency} {(purchase.amountPaid || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-red-400">
                      {business.currency} {((purchase.total || 0) - (purchase.amountPaid || 0)).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openViewModal(purchase)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                          title="View"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        {purchase.status !== 'paid' && (
                          <button
                            onClick={() => openPaymentModal(purchase)}
                            className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 rounded-lg transition-colors"
                            title="Add Payment"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(purchase.id)}
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        {filteredPurchases.length > 0 && (
          <div className="p-4 border-t border-slate-700/50 flex items-center justify-between">
            <span className="text-slate-400 text-sm">
              Showing {filteredPurchases.length} entries
            </span>
          </div>
        )}
      </div>

      {/* Add Purchase Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Add Purchase</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Supplier *</label>
                    <select
                      value={formData.supplierId}
                      onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      required
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.businessName || s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Reference No</label>
                    <input
                      type="text"
                      value={formData.referenceNo}
                      onChange={(e) => setFormData({ ...formData, referenceNo: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      placeholder="Optional reference"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Date *</label>
                    <input
                      type="datetime-local"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="received">Received</option>
                      <option value="ordered">Ordered</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>

                {/* Product Search */}
                <div className="bg-slate-900/50 rounded-xl p-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Add Products</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value)
                        setShowProductDropdown(true)
                      }}
                      onFocus={() => setShowProductDropdown(true)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 pl-10"
                      placeholder="Search by product name or SKU..."
                    />
                    <svg className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    
                    {showProductDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 max-h-60 overflow-y-auto">
                        {/* Add New Product Button */}
                        <button
                          type="button"
                          onClick={openProductModal}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-500/20 text-left border-b border-slate-700 bg-slate-900/50"
                        >
                          <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-emerald-400 font-medium">Add New Product</p>
                            <p className="text-slate-500 text-xs">Create a new product and add to this purchase</p>
                          </div>
                        </button>

                        {/* Search Results */}
                        {searchedProducts.length > 0 ? (
                          searchedProducts.slice(0, 10).map(product => (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => addProduct(product)}
                              className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700 text-left"
                            >
                              <div>
                                <p className="text-white font-medium">{product.name}</p>
                                <p className="text-slate-400 text-sm">SKU: {product.sku || '-'} | Stock: {product.currentStock || 0}</p>
                              </div>
                              <div className="text-right">
                                <span className="text-emerald-400">{business.currency} {product.costPrice || 0}</span>
                                {product.expiryDate && (
                                  <p className="text-xs mt-0.5">
                                    <ExpiryBadge expiryDate={product.expiryDate} />
                                  </p>
                                )}
                              </div>
                            </button>
                          ))
                        ) : productSearch ? (
                          <div className="px-4 py-3 text-center text-slate-400">
                            <p>No products found for "{productSearch}"</p>
                            <button
                              type="button"
                              onClick={openProductModal}
                              className="text-emerald-400 hover:underline mt-1"
                            >
                              + Create new product
                            </button>
                          </div>
                        ) : (
                          <div className="px-4 py-3 text-center text-slate-500 text-sm">
                            Type to search products or click "Add New Product"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {showProductDropdown && (
                    <div 
                      className="fixed inset-0 z-0" 
                      onClick={() => setShowProductDropdown(false)}
                    />
                  )}
                </div>

                {/* Products Table with Expiry Date */}
                <div className="bg-slate-900/50 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-emerald-600">
                        <th className="text-left px-4 py-3 text-white font-medium text-sm">#</th>
                        <th className="text-left px-4 py-3 text-white font-medium text-sm">Product</th>
                        <th className="text-left px-4 py-3 text-white font-medium text-sm">Quantity</th>
                        <th className="text-left px-4 py-3 text-white font-medium text-sm">Unit Cost</th>
                        <th className="text-left px-4 py-3 text-white font-medium text-sm">
                          <span className="flex items-center gap-1">
                            Expiry Date
                            <span className="text-yellow-300">⏰</span>
                          </span>
                        </th>
                        <th className="text-left px-4 py-3 text-white font-medium text-sm">Total</th>
                        <th className="text-left px-4 py-3 text-white font-medium text-sm"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center py-8 text-slate-500">
                            No products added. Search and add products above.
                          </td>
                        </tr>
                      ) : (
                        formData.items.map((item, idx) => (
                          <tr key={item.productId} className="border-t border-slate-700/50">
                            <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                            <td className="px-4 py-3">
                              <p className="text-white">{item.name}</p>
                              <p className="text-slate-400 text-xs">{item.sku || '-'}</p>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateItemQuantity(item.productId, parseInt(e.target.value) || 0)}
                                className="w-20 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white text-center"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitCost}
                                onChange={(e) => updateItemCost(item.productId, e.target.value)}
                                className="w-24 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white text-center"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="date"
                                value={item.expiryDate || ''}
                                onChange={(e) => updateItemExpiry(item.productId, e.target.value)}
                                className="w-36 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                              />
                              {item.expiryDate && (
                                <div className="mt-1">
                                  <ExpiryBadge expiryDate={item.expiryDate} />
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-emerald-400 font-medium">
                              {business.currency} {(item.quantity * item.unitCost).toFixed(2)}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => removeItem(item.productId)}
                                className="p-1 text-red-400 hover:bg-red-500/20 rounded"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Additional Details & Payment Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Additional Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Additional Details</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Discount</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.discount}
                          onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                          className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Tax %</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.taxRate}
                          onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                          className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Shipping</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.shipping}
                          onChange={(e) => setFormData({ ...formData, shipping: parseFloat(e.target.value) || 0 })}
                          className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Note</label>
                      <textarea
                        value={formData.note}
                        onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                        rows="2"
                        placeholder="Purchase note (optional)..."
                      />
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div className="bg-slate-900/50 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Payment Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Items ({formData.items.length})</span>
                        <span className="text-white">{business.currency} {subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Discount</span>
                        <span className="text-red-400">- {business.currency} {discountAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tax ({formData.taxRate}%)</span>
                        <span className="text-white">{business.currency} {taxAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Shipping</span>
                        <span className="text-white">{business.currency} {(parseFloat(formData.shipping) || 0).toFixed(2)}</span>
                      </div>
                      <hr className="border-slate-700" />
                      <div className="flex justify-between text-lg font-bold">
                        <span className="text-white">Grand Total</span>
                        <span className="text-emerald-400">{business.currency} {total.toFixed(2)}</span>
                      </div>
                      <hr className="border-slate-700" />
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Amount Paid</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.amountPaid}
                          onChange={(e) => setFormData({ ...formData, amountPaid: parseFloat(e.target.value) || 0 })}
                          className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Payment Method</label>
                        <select
                          value={formData.paymentMethod}
                          onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                        >
                          <option value="cash">Cash</option>
                          <option value="bank">Bank Transfer</option>
                          <option value="cheque">Cheque</option>
                          <option value="card">Card</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Payment Account *</label>
                        <select
                          value={formData.paymentAccountId}
                          onChange={(e) => setFormData({ ...formData, paymentAccountId: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                        >
                          <option value="">Select Account</option>
                          {activeAccounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name} ({acc.accountType || 'Default'})</option>
                          ))}
                        </select>
                        {!formData.paymentAccountId && formData.amountPaid > 0 && (
                          <p className="text-yellow-400 text-xs mt-1">⚠️ Select account to track payment</p>
                        )}
                      </div>
                      <div className="flex justify-between text-lg font-bold">
                        <span className="text-white">Balance Due</span>
                        <span className="text-red-400">{business.currency} {(total - (formData.amountPaid || 0)).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
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
                    disabled={formData.items.length === 0}
                    className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save Purchase
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add New Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-cyan-600">
              <div>
                <h2 className="text-xl font-bold text-white">Add New Product</h2>
                <p className="text-emerald-100 text-sm">Create product and add to purchase</p>
              </div>
              <button onClick={() => setShowProductModal(false)} className="text-white/80 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleProductSubmit} className="space-y-4">
                {/* Product Name & SKU */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Product Name *</label>
                    <input
                      type="text"
                      value={newProductData.name}
                      onChange={(e) => setNewProductData({ ...newProductData, name: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      placeholder="Enter product name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">SKU</label>
                    <input
                      type="text"
                      value={newProductData.sku}
                      onChange={(e) => setNewProductData({ ...newProductData, sku: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      placeholder="Auto-generated"
                    />
                  </div>
                </div>

                {/* Category, Brand, Unit */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                    <select
                      value={newProductData.categoryId}
                      onChange={(e) => setNewProductData({ ...newProductData, categoryId: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Brand</label>
                    <select
                      value={newProductData.brandId}
                      onChange={(e) => setNewProductData({ ...newProductData, brandId: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">Select Brand</option>
                      {brands.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Unit</label>
                    <select
                      value={newProductData.unitId}
                      onChange={(e) => setNewProductData({ ...newProductData, unitId: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">Select Unit</option>
                      {units.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.shortName})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Prices */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Cost Price *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400">{business.currency}</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newProductData.costPrice}
                        onChange={(e) => setNewProductData({ ...newProductData, costPrice: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Selling Price *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400">{business.currency}</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newProductData.sellingPrice}
                        onChange={(e) => setNewProductData({ ...newProductData, sellingPrice: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Margin Display */}
                {newProductData.costPrice && newProductData.sellingPrice && (
                  <div className="bg-slate-900/50 rounded-lg p-3 flex items-center justify-between">
                    <span className="text-slate-400">Profit Margin:</span>
                    <span className={`font-medium ${(newProductData.sellingPrice - newProductData.costPrice) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {business.currency} {(newProductData.sellingPrice - newProductData.costPrice).toFixed(2)} 
                      ({newProductData.costPrice > 0 
                        ? (((newProductData.sellingPrice - newProductData.costPrice) / newProductData.costPrice) * 100).toFixed(1) 
                        : 0}%)
                    </span>
                  </div>
                )}

                {/* Stock, Alert & Expiry */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Opening Stock</label>
                    <input
                      type="number"
                      min="0"
                      value={newProductData.currentStock}
                      onChange={(e) => setNewProductData({ ...newProductData, currentStock: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      placeholder="0"
                    />
                    <p className="text-xs text-slate-500 mt-1">Stock will be added from this purchase</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Alert Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={newProductData.alertQuantity}
                      onChange={(e) => setNewProductData({ ...newProductData, alertQuantity: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      placeholder="5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <span className="flex items-center gap-1">
                        Expiry Date
                        <span className="text-yellow-400">⏰</span>
                      </span>
                    </label>
                    <input
                      type="date"
                      value={newProductData.expiryDate}
                      onChange={(e) => setNewProductData({ ...newProductData, expiryDate: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    />
                    <p className="text-xs text-slate-500 mt-1">Default expiry for this product</p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                  <textarea
                    value={newProductData.description}
                    onChange={(e) => setNewProductData({ ...newProductData, description: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    rows="2"
                    placeholder="Product description (optional)..."
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all"
                  >
                    Create & Add to Purchase
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Purchase Modal - with Expiry Info */}
      {showViewModal && selectedPurchase && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Purchase Details</h2>
                <p className="text-cyan-400">{selectedPurchase.purchaseNo}</p>
              </div>
              <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-sm">Supplier</p>
                  <p className="text-white font-medium">{getSupplierName(selectedPurchase.supplierId)}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Date</p>
                  <p className="text-white font-medium">{new Date(selectedPurchase.date || selectedPurchase.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Reference No</p>
                  <p className="text-white font-medium">{selectedPurchase.referenceNo || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Payment Account</p>
                  <p className="text-white font-medium">{getAccountName(selectedPurchase.paymentAccountId)}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedPurchase.status)}</div>
                </div>
              </div>

              {/* Items Table with Expiry */}
              <div className="bg-slate-900/50 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-700">
                      <th className="text-left px-4 py-2 text-slate-300 font-medium text-sm">Product</th>
                      <th className="text-left px-4 py-2 text-slate-300 font-medium text-sm">Qty</th>
                      <th className="text-left px-4 py-2 text-slate-300 font-medium text-sm">Unit Cost</th>
                      <th className="text-left px-4 py-2 text-slate-300 font-medium text-sm">Expiry</th>
                      <th className="text-left px-4 py-2 text-slate-300 font-medium text-sm">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPurchase.items?.map((item, idx) => (
                      <tr key={idx} className="border-t border-slate-700/50">
                        <td className="px-4 py-2 text-white">{item.name}</td>
                        <td className="px-4 py-2 text-slate-300">{item.quantity}</td>
                        <td className="px-4 py-2 text-slate-300">{business.currency} {item.unitCost}</td>
                        <td className="px-4 py-2">
                          {item.expiryDate ? (
                            <div>
                              <p className="text-slate-300 text-sm">{new Date(item.expiryDate).toLocaleDateString()}</p>
                              <ExpiryBadge expiryDate={item.expiryDate} />
                            </div>
                          ) : (
                            <span className="text-slate-500 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-emerald-400">{business.currency} {(item.quantity * item.unitCost).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-900/50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="text-white">{business.currency} {(selectedPurchase.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Discount</span>
                  <span className="text-red-400">- {business.currency} {(selectedPurchase.discountAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tax</span>
                  <span className="text-white">{business.currency} {(selectedPurchase.taxAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Shipping</span>
                  <span className="text-white">{business.currency} {(selectedPurchase.shipping || 0).toFixed(2)}</span>
                </div>
                <hr className="border-slate-700" />
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-white">Total</span>
                  <span className="text-emerald-400">{business.currency} {(selectedPurchase.total || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Paid</span>
                  <span className="text-cyan-400">{business.currency} {(selectedPurchase.amountPaid || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-white">Due</span>
                  <span className="text-red-400">{business.currency} {((selectedPurchase.total || 0) - (selectedPurchase.amountPaid || 0)).toFixed(2)}</span>
                </div>
              </div>

              {selectedPurchase.note && (
                <div>
                  <p className="text-slate-400 text-sm">Note</p>
                  <p className="text-white">{selectedPurchase.note}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedPurchase && (
        <PaymentModal 
          purchase={selectedPurchase}
          business={business}
          paymentAccounts={activeAccounts}
          onClose={() => setShowPaymentModal(false)}
          dispatch={dispatch}
        />
      )}
    </div>
  )
}

// Payment Modal Component
function PaymentModal({ purchase, business, paymentAccounts, onClose, dispatch }) {
  const [amount, setAmount] = useState((purchase.total || 0) - (purchase.amountPaid || 0))
  const [method, setMethod] = useState('cash')
  const [paymentAccountId, setPaymentAccountId] = useState('')
  const [note, setNote] = useState('')

  const dueAmount = (purchase.total || 0) - (purchase.amountPaid || 0)

  function handleSubmit(e) {
    e.preventDefault()
    
    if (amount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    dispatch({
      type: 'ADD_PURCHASE_PAYMENT',
      payload: {
        purchaseId: purchase.id,
        supplierId: purchase.supplierId,
        amount: parseFloat(amount),
        method,
        paymentAccountId: paymentAccountId ? parseInt(paymentAccountId) : null,
        note,
        date: new Date().toISOString()
      }
    })

    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Add Payment</h2>
            <p className="text-cyan-400 text-sm">{purchase.purchaseNo}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-900/50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Amount</span>
              <span className="text-white font-medium">{business.currency} {(purchase.total || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Already Paid</span>
              <span className="text-emerald-400">{business.currency} {(purchase.amountPaid || 0).toFixed(2)}</span>
            </div>
            <hr className="border-slate-700" />
            <div className="flex justify-between text-lg font-bold">
              <span className="text-white">Balance Due</span>
              <span className="text-red-400">{business.currency} {dueAmount.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Payment Amount *</label>
            <input
              type="number"
              min="0"
              max={dueAmount}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Payment Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="cash">Cash</option>
              <option value="bank">Bank Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="card">Card</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Payment Account *</label>
            <select
              value={paymentAccountId}
              onChange={(e) => setPaymentAccountId(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">Select Account</option>
              {paymentAccounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name} ({acc.accountType || 'Default'})</option>
              ))}
            </select>
            {!paymentAccountId && (
              <p className="text-yellow-400 text-xs mt-1">⚠️ Select account to track payment</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Note</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              placeholder="Payment note (optional)"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all"
            >
              Add Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}