import { useState } from 'react'
import { useApp } from '../Context/AppContext'

export default function PurchaseReturns() {
  const { state, dispatch } = useApp()
  const { 
    purchaseReturns = [], 
    suppliers = [], 
    products = [], 
    purchases = [], 
    business = { currency: '₨' } 
  } = state
  
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [formData, setFormData] = useState({
    supplierId: '',
    purchaseId: '',
    date: new Date().toISOString().slice(0, 16),
    items: [],
    note: ''
  })

  const [productSearch, setProductSearch] = useState('')

  // Safe filter with null checks
  const filteredReturns = Array.isArray(purchaseReturns) ? purchaseReturns.filter(pr => {
    if (!pr) return false
    const supplier = suppliers.find(s => s.id === pr.supplierId)
    return (
      (pr.returnNo?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (supplier?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (supplier?.businessName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    )
  }) : []

  // Get supplier purchases for dropdown
  const supplierPurchases = formData.supplierId 
    ? (purchases || []).filter(p => p.supplierId === parseInt(formData.supplierId))
    : []

  // Filter products for search
  const searchedProducts = productSearch.trim()
    ? (products || []).filter(p =>
        p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku?.toLowerCase().includes(productSearch.toLowerCase())
      )
    : []

  // Calculate total
  const total = formData.items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0)

  function resetForm() {
    setFormData({
      supplierId: '',
      purchaseId: '',
      date: new Date().toISOString().slice(0, 16),
      items: [],
      note: ''
    })
    setProductSearch('')
  }

  function openAddModal() {
    resetForm()
    setShowModal(true)
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
          unitCost: product.costPrice || 0
        }]
      })
    }
    setProductSearch('')
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

  function removeItem(productId) {
    setFormData({
      ...formData,
      items: formData.items.filter(item => item.productId !== productId)
    })
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

    try {
      dispatch({
        type: 'ADD_PURCHASE_RETURN',
        payload: {
          supplierId: parseInt(formData.supplierId),
          purchaseId: formData.purchaseId ? parseInt(formData.purchaseId) : null,
          date: formData.date,
          items: formData.items,
          note: formData.note,
          total: total
        }
      })

      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('Error adding purchase return:', error)
      alert('Error adding purchase return. Please try again.')
    }
  }

  function handleDelete(id) {
    if (confirm('Are you sure you want to delete this return?')) {
      dispatch({ type: 'DELETE_PURCHASE_RETURN', payload: id })
    }
  }

  // Get supplier name helper
  function getSupplierName(supplierId) {
    const supplier = suppliers.find(s => s.id === supplierId)
    return supplier?.businessName || supplier?.name || '-'
  }

  // Calculate totals - with safety checks
  const totalReturns = filteredReturns.reduce((sum, pr) => sum + (pr?.total || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Purchase Returns</h1>
          <p className="text-slate-400 text-sm">Manage returns to suppliers</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-cyan-600 transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Return
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Returns</p>
              <p className="text-2xl font-bold text-white">{filteredReturns.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Value</p>
              <p className="text-2xl font-bold text-red-400">{business.currency} {totalReturns.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl">
        {/* Table Header */}
        <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
          <span className="text-slate-400 text-sm">All Purchase Returns</span>
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
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
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Date</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Return No</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Supplier</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Items</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Total</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center gap-3">
                      <svg className="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p>No purchase returns found</p>
                      <button 
                        onClick={openAddModal}
                        className="text-emerald-400 hover:underline text-sm"
                      >
                        + Create your first return
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReturns.map(pr => (
                  <tr key={pr.id} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                    <td className="px-4 py-3 text-white">
                      {new Date(pr.date || pr.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-cyan-400 font-medium">{pr.returnNo}</td>
                    <td className="px-4 py-3 text-white">{getSupplierName(pr.supplierId)}</td>
                    <td className="px-4 py-3 text-slate-300">{pr.items?.length || 0} items</td>
                    <td className="px-4 py-3 text-red-400 font-medium">
                      {business.currency} {(pr.total || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(pr.id)}
                        className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        {filteredReturns.length > 0 && (
          <div className="p-4 border-t border-slate-700/50 flex items-center justify-between">
            <span className="text-slate-400 text-sm">
              Showing {filteredReturns.length} entries
            </span>
            <span className="text-slate-400 text-sm">
              Total: <span className="text-red-400 font-medium">{business.currency} {totalReturns.toLocaleString()}</span>
            </span>
          </div>
        )}
      </div>

      {/* Add Return Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[95vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Add Purchase Return</h2>
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
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Supplier *</label>
                    <select
                      value={formData.supplierId}
                      onChange={(e) => setFormData({ ...formData, supplierId: e.target.value, purchaseId: '' })}
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
                    <label className="block text-sm font-medium text-slate-300 mb-2">Parent Purchase</label>
                    <select
                      value={formData.purchaseId}
                      onChange={(e) => setFormData({ ...formData, purchaseId: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      disabled={!formData.supplierId}
                    >
                      <option value="">Select Purchase (Optional)</option>
                      {supplierPurchases.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.purchaseNo || p.referenceNo} - {business.currency} {p.total}
                        </option>
                      ))}
                    </select>
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
                </div>

                {/* Product Search */}
                <div className="bg-slate-900/50 rounded-xl p-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Search Products</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 pl-10"
                      placeholder="Search by product name or SKU..."
                    />
                    <svg className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    
                    {productSearch && searchedProducts.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 max-h-60 overflow-y-auto">
                        {searchedProducts.slice(0, 10).map(product => (
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
                            <span className="text-emerald-400">{business.currency} {product.costPrice || 0}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {productSearch && searchedProducts.length === 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 p-4 text-center text-slate-400">
                        No products found
                      </div>
                    )}
                  </div>
                </div>

                {/* Products Table */}
                <div className="bg-slate-900/50 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-red-600">
                        <th className="text-left px-4 py-3 text-white font-medium text-sm">Product</th>
                        <th className="text-left px-4 py-3 text-white font-medium text-sm">Quantity</th>
                        <th className="text-left px-4 py-3 text-white font-medium text-sm">Unit Price</th>
                        <th className="text-left px-4 py-3 text-white font-medium text-sm">Subtotal</th>
                        <th className="text-left px-4 py-3 text-white font-medium text-sm"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-8 text-slate-500">
                            No products added. Search and add products above.
                          </td>
                        </tr>
                      ) : (
                        formData.items.map(item => (
                          <tr key={item.productId} className="border-t border-slate-700/50">
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
                            <td className="px-4 py-3 text-red-400 font-medium">
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

                {/* Total */}
                <div className="bg-slate-900/50 rounded-xl p-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span className="text-white">Total Return Amount:</span>
                    <span className="text-red-400">{business.currency} {total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Note</label>
                  <textarea
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    rows="2"
                    placeholder="Return note (optional)..."
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
                    disabled={formData.items.length === 0 || !formData.supplierId}
                    className="px-6 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg hover:from-red-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit Return
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}