import { useState } from 'react'
import { useApp } from '../context/AppContext'

export default function Salesorder() {
  const { state, dispatch } = useApp()
  const { sales, customers, business, salesPayments, saleReturns } = state
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [shippingFilter, setShippingFilter] = useState('all')
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })

  // Filter only sales orders (not POS sales)
  const salesOrders = (sales || []).filter(s => s.saleType === 'order')

  const filteredOrders = salesOrders.filter(order => {
    const customer = customers.find(c => c.id === order.customerId)
    const matchesSearch = order.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    const matchesShipping = shippingFilter === 'all' || order.shippingStatus === shippingFilter
    return matchesSearch && matchesStatus && matchesShipping
  })

  const getCustomer = (id) => customers.find(c => c.id === id) || { name: 'Unknown' }

  const getActualPaidForSale = (saleId) => {
    return (salesPayments || [])
      .filter(p => p.saleId === saleId)
      .reduce((sum, p) => sum + (p.amount || 0), 0)
  }

  const getRemainingQuantity = (order) => {
    // Calculate remaining quantity after returns
    const returns = (saleReturns || []).filter(sr => sr.saleId === order.id)
    const returnedQty = returns.reduce((sum, sr) => {
      return sum + (sr.items || []).reduce((iSum, item) => iSum + (item.quantity || 0), 0)
    }, 0)
    const totalQty = (order.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0)
    return totalQty - returnedQty
  }

  function handleDropdownClick(e, orderId) {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setDropdownPosition({ top: rect.bottom + 4, left: rect.left })
    setActiveDropdown(activeDropdown === orderId ? null : orderId)
  }

  function openViewModal(order) {
    setSelectedOrder(order)
    setShowViewModal(true)
    setActiveDropdown(null)
  }

  function updateShippingStatus(orderId, status) {
    dispatch({ type: 'UPDATE_SALE_SHIPPING', payload: { id: orderId, shippingStatus: status } })
    setActiveDropdown(null)
  }

  function handleDelete(orderId) {
    if (confirm('Are you sure you want to delete this sales order?')) {
      dispatch({ type: 'DELETE_SALE', payload: orderId })
    }
    setActiveDropdown(null)
  }

  const activeOrder = salesOrders.find(o => o.id === activeDropdown)

  const getShippingStatusColor = (status) => {
    switch (status) {
      case 'ordered': return 'bg-blue-500/20 text-blue-400'
      case 'packed': return 'bg-purple-500/20 text-purple-400'
      case 'shipped': return 'bg-cyan-500/20 text-cyan-400'
      case 'delivered': return 'bg-emerald-500/20 text-emerald-400'
      case 'cancelled': return 'bg-red-500/20 text-red-400'
      default: return 'bg-slate-500/20 text-slate-400'
    }
  }

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-emerald-500/20 text-emerald-400'
      case 'partial': return 'bg-yellow-500/20 text-yellow-400'
      case 'due': return 'bg-red-500/20 text-red-400'
      default: return 'bg-slate-500/20 text-slate-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Sales Order</h1>
          <p className="text-slate-400 text-sm">Manage your sales orders</p>
        </div>
        <button
          onClick={() => dispatch({ type: 'SET_PAGE', payload: 'add-sale' })}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-cyan-600 transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Sales Order
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
        <div className="flex items-center gap-2 text-cyan-400 mb-4">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="font-medium">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Payment Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="due">Due</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Shipping Status</label>
            <select
              value={shippingFilter}
              onChange={(e) => setShippingFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="all">All</option>
              <option value="ordered">Ordered</option>
              <option value="packed">Packed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Customer</label>
            <select className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm">
              <option value="all">All Customers</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl">
        <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-sm">Show</span>
            <select className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm">
              <option>25</option>
              <option>50</option>
              <option>100</option>
            </select>
            <span className="text-slate-400 text-sm">entries</span>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export CSV
            </button>
            <button className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Print
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-900/50">
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Action</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Date</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Order No.</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Customer name</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Contact Number</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Location</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Status</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Shipping Status</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Quantity Remaining</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Added By</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-8 text-slate-500">No sales orders found</td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const customer = getCustomer(order.customerId)
                  const paid = getActualPaidForSale(order.id)
                  const due = (order.total || 0) - paid
                  const paymentStatus = due <= 0 ? 'paid' : paid > 0 ? 'partial' : 'due'
                  const remainingQty = getRemainingQuantity(order)
                  
                  return (
                    <tr key={order.id} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => handleDropdownClick(e, order.id)}
                          className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600 transition-colors flex items-center gap-1"
                        >
                          Actions
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-white">{new Date(order.date || order.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3 text-cyan-400 font-medium">{order.invoiceNo}</td>
                      <td className="px-4 py-3 text-white">{customer.name}</td>
                      <td className="px-4 py-3 text-slate-300">{customer.phone || '-'}</td>
                      <td className="px-4 py-3 text-slate-300">{business.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${getPaymentStatusColor(paymentStatus)}`}>
                          {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${getShippingStatusColor(order.shippingStatus)}`}>
                          {order.shippingStatus ? order.shippingStatus.charAt(0).toUpperCase() + order.shippingStatus.slice(1) : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white">{remainingQty.toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-300">{order.addedBy || 'Admin'}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-700/50 flex items-center justify-between">
          <span className="text-slate-400 text-sm">Showing 1 to {filteredOrders.length} of {filteredOrders.length} entries</span>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 bg-slate-700 text-slate-300 rounded-lg text-sm">Previous</button>
            <button className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-sm">1</button>
            <button className="px-3 py-1 bg-slate-700 text-slate-300 rounded-lg text-sm">Next</button>
          </div>
        </div>
      </div>

      {/* Dropdown Portal */}
      {activeDropdown && activeOrder && (
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setActiveDropdown(null)} />
          <div 
            className="fixed w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-[9999]"
            style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
          >
            <div className="py-1">
              <button onClick={() => openViewModal(activeOrder)} className="w-full flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-700 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                View
              </button>
              <button className="w-full flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-700 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Edit
              </button>
              <button className="w-full flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-700 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                Print
              </button>
              <hr className="my-1 border-slate-700" />
              <div className="px-4 py-2 text-slate-500 text-xs uppercase">Update Shipping</div>
              <button onClick={() => updateShippingStatus(activeOrder.id, 'ordered')} className="w-full flex items-center gap-2 px-4 py-2 text-blue-400 hover:bg-slate-700 text-sm">📦 Ordered</button>
              <button onClick={() => updateShippingStatus(activeOrder.id, 'packed')} className="w-full flex items-center gap-2 px-4 py-2 text-purple-400 hover:bg-slate-700 text-sm">📋 Packed</button>
              <button onClick={() => updateShippingStatus(activeOrder.id, 'shipped')} className="w-full flex items-center gap-2 px-4 py-2 text-cyan-400 hover:bg-slate-700 text-sm">🚚 Shipped</button>
              <button onClick={() => updateShippingStatus(activeOrder.id, 'delivered')} className="w-full flex items-center gap-2 px-4 py-2 text-emerald-400 hover:bg-slate-700 text-sm">✅ Delivered</button>
              <button onClick={() => updateShippingStatus(activeOrder.id, 'cancelled')} className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-slate-700 text-sm">❌ Cancelled</button>
              <hr className="my-1 border-slate-700" />
              <button onClick={() => handleDelete(activeOrder.id)} className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-slate-700 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Delete
              </button>
            </div>
          </div>
        </>
      )}

      {/* View Modal */}
      {showViewModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Sales Order - {selectedOrder.invoiceNo}</h2>
              <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-900/50 p-4 rounded-lg">
                  <p className="text-slate-400 text-sm">Customer</p>
                  <p className="text-white font-medium">{getCustomer(selectedOrder.customerId).name}</p>
                  <p className="text-slate-400 text-sm">{getCustomer(selectedOrder.customerId).phone || '-'}</p>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-lg">
                  <p className="text-slate-400 text-sm">Order Date</p>
                  <p className="text-white font-medium">{new Date(selectedOrder.date || selectedOrder.createdAt).toLocaleString()}</p>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-lg">
                  <p className="text-slate-400 text-sm">Shipping Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs ${getShippingStatusColor(selectedOrder.shippingStatus)}`}>
                    {selectedOrder.shippingStatus || 'Pending'}
                  </span>
                </div>
              </div>

              {/* Shipping Details */}
              {(selectedOrder.shippingAddress || selectedOrder.shippingDetails) && (
                <div className="bg-slate-900/50 p-4 rounded-lg">
                  <h3 className="text-white font-medium mb-3">Shipping Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedOrder.shippingAddress && (
                      <div>
                        <p className="text-slate-400">Shipping Address</p>
                        <p className="text-white">{selectedOrder.shippingAddress}</p>
                      </div>
                    )}
                    {selectedOrder.shippingDetails && (
                      <div>
                        <p className="text-slate-400">Shipping Details</p>
                        <p className="text-white">{selectedOrder.shippingDetails}</p>
                      </div>
                    )}
                    {selectedOrder.deliveryPerson && (
                      <div>
                        <p className="text-slate-400">Delivery Person</p>
                        <p className="text-white">{selectedOrder.deliveryPerson}</p>
                      </div>
                    )}
                    {selectedOrder.deliveredTo && (
                      <div>
                        <p className="text-slate-400">Delivered To</p>
                        <p className="text-white">{selectedOrder.deliveredTo}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Items */}
              <div>
                <h3 className="text-white font-medium mb-3">Order Items</h3>
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-900/50">
                      <th className="text-left px-4 py-2 text-slate-400 text-sm">Product</th>
                      <th className="text-center px-4 py-2 text-slate-400 text-sm">Qty</th>
                      <th className="text-right px-4 py-2 text-slate-400 text-sm">Price</th>
                      <th className="text-right px-4 py-2 text-slate-400 text-sm">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.items || []).map((item, idx) => {
                      const product = state.products.find(p => p.id === item.productId)
                      return (
                        <tr key={idx} className="border-t border-slate-700/50">
                          <td className="px-4 py-2 text-white">{product?.name || 'Unknown'}</td>
                          <td className="px-4 py-2 text-center text-slate-300">{item.quantity}</td>
                          <td className="px-4 py-2 text-right text-slate-300">{business.currency} {(item.unitPrice || 0).toFixed(2)}</td>
                          <td className="px-4 py-2 text-right text-cyan-400">{business.currency} {(item.subtotal || 0).toFixed(2)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-400">Subtotal:</span><span className="text-white">{business.currency} {(selectedOrder.subtotal || selectedOrder.total || 0).toFixed(2)}</span></div>
                  {selectedOrder.discount > 0 && <div className="flex justify-between"><span className="text-slate-400">Discount:</span><span className="text-orange-400">- {business.currency} {selectedOrder.discount.toFixed(2)}</span></div>}
                  {selectedOrder.tax > 0 && <div className="flex justify-between"><span className="text-slate-400">Tax:</span><span className="text-white">{business.currency} {selectedOrder.tax.toFixed(2)}</span></div>}
                  {selectedOrder.shippingCharges > 0 && <div className="flex justify-between"><span className="text-slate-400">Shipping:</span><span className="text-white">{business.currency} {selectedOrder.shippingCharges.toFixed(2)}</span></div>}
                  <hr className="border-slate-700" />
                  <div className="flex justify-between font-medium text-lg"><span className="text-slate-300">Total:</span><span className="text-cyan-400">{business.currency} {(selectedOrder.total || 0).toFixed(2)}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}