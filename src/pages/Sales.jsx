import { useState, useRef } from 'react'
import { useApp } from '../Context/AppContext'

export default function Sales() {
  const { state, dispatch } = useApp()
  const { sales, customers, products, salesPayments, saleReturns, accounts, business } = state
  
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedSale, setSelectedSale] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [customerFilter, setCustomerFilter] = useState('all')
  const [showInvoice, setShowInvoice] = useState(false)
  
  const [paymentData, setPaymentData] = useState({
    method: 'Cash',
    date: new Date().toISOString().slice(0, 16),
    amount: 0,
    accountId: '',
    note: ''
  })

  const printRef = useRef()

  // Helper functions
  const getCustomer = (id) => customers.find(c => c.id === id) || { name: 'Unknown' }
  const getProduct = (id) => products.find(p => p.id === id) || { name: 'Unknown' }
  
  const getActualPaidForSale = (saleId) => {
    return (salesPayments || [])
      .filter(p => p.saleId === saleId)
      .reduce((sum, p) => sum + (p.amount || 0), 0)
  }

  const getReturnsForSale = (saleId) => {
    return (saleReturns || [])
      .filter(sr => sr.saleId === saleId)
      .reduce((sum, sr) => sum + (sr.total || 0), 0)
  }

  // Filtering
  const filteredSales = (sales || []).filter(sale => {
    const customer = getCustomer(sale.customerId)
    const matchesSearch = sale.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || sale.status === statusFilter
    const matchesCustomer = customerFilter === 'all' || sale.customerId === parseInt(customerFilter)
    return matchesSearch && matchesStatus && matchesCustomer
  })

  // Summary calculations
  const totalSales = filteredSales.length
  const totalAmount = filteredSales.reduce((sum, s) => sum + (s.total || 0), 0)
  const totalPaid = filteredSales.reduce((sum, s) => sum + getActualPaidForSale(s.id), 0)
  const totalDue = filteredSales.reduce((sum, s) => {
    const paid = getActualPaidForSale(s.id)
    const returns = getReturnsForSale(s.id)
    return sum + ((s.total || 0) - paid - returns)
  }, 0)

  function openPaymentModal(sale) {
    setSelectedSale(sale)
    const paid = getActualPaidForSale(sale.id)
    const returns = getReturnsForSale(sale.id)
    const due = (sale.total || 0) - paid - returns
    setPaymentData({
      method: 'Cash',
      date: new Date().toISOString().slice(0, 16),
      amount: due > 0 ? due : 0,
      accountId: accounts[0]?.id || '',
      note: ''
    })
    setShowPaymentModal(true)
  }

  function openViewModal(sale) {
    setSelectedSale(sale)
    setShowViewModal(true)
  }

  function handlePaymentSubmit(e) {
    e.preventDefault()
    if (!paymentData.amount || paymentData.amount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    dispatch({ 
      type: 'ADD_SALES_PAYMENT', 
      payload: {
        saleId: selectedSale.id,
        customerId: selectedSale.customerId,
        ...paymentData,
        date: new Date(paymentData.date).toISOString()
      }
    })
    setShowPaymentModal(false)
  }

  function handleDelete(id) {
    if (confirm('Are you sure you want to delete this sale?')) {
      dispatch({ type: 'DELETE_SALE', payload: id })
    }
  }

  function printInvoice(sale) {
    setSelectedSale(sale)
    setShowInvoice(true)
    setTimeout(() => {
      window.print()
    }, 500)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">All Sales</h1>
          <p className="text-slate-400 text-sm">Manage your sales invoices</p>
        </div>
        <button
          onClick={() => dispatch({ type: 'SET_PAGE', payload: 'pos' })}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-cyan-600 transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Sale (POS)
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Sales</p>
              <p className="text-2xl font-bold text-white">{totalSales}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Amount</p>
              <p className="text-2xl font-bold text-cyan-400">{business.currency} {totalAmount.toFixed(2)}</p>
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
              <p className="text-slate-400 text-sm">Amount Received</p>
              <p className="text-2xl font-bold text-emerald-400">{business.currency} {totalPaid.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Amount Due</p>
              <p className="text-2xl font-bold text-yellow-400">{business.currency} {totalDue.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm"
        >
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="due">Due</option>
        </select>
        <select
          value={customerFilter}
          onChange={(e) => setCustomerFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm"
        >
          <option value="all">All Customers</option>
          {customers.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <div className="flex-1"></div>
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm w-64"
        />
      </div>

      {/* Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-900/50">
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Date</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Invoice No</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Customer</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Status</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Total</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Paid</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Returns</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Due</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-slate-500">No sales found</td>
                </tr>
              ) : (
                filteredSales.map(sale => {
                  const customer = getCustomer(sale.customerId)
                  const actualPaid = getActualPaidForSale(sale.id)
                  const returns = getReturnsForSale(sale.id)
                  const due = (sale.total || 0) - actualPaid - returns
                  
                  return (
                    <tr key={sale.id} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                      <td className="px-4 py-3 text-white">{new Date(sale.date || sale.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-cyan-400 font-medium">{sale.invoiceNo}</td>
                      <td className="px-4 py-3 text-white">{customer.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          due <= 0 ? 'bg-emerald-500/20 text-emerald-400' :
                          due < (sale.total || 0) ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {due <= 0 ? 'Paid' : due < (sale.total || 0) ? 'Partial' : 'Due'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white">{business.currency} {(sale.total || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-emerald-400">{business.currency} {actualPaid.toFixed(2)}</td>
                      <td className="px-4 py-3 text-orange-400">{returns > 0 ? `- ${business.currency} ${returns.toFixed(2)}` : '-'}</td>
                      <td className="px-4 py-3 text-yellow-400">{business.currency} {due.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openViewModal(sale)} className="p-1.5 bg-slate-700 rounded-lg hover:bg-slate-600" title="View">
                            <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </button>
                          <button onClick={() => openPaymentModal(sale)} className="p-1.5 bg-emerald-500/20 rounded-lg hover:bg-emerald-500/30" title="Add Payment">
                            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                          </button>
                          <button onClick={() => printInvoice(sale)} className="p-1.5 bg-blue-500/20 rounded-lg hover:bg-blue-500/30" title="Print">
                            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                          </button>
                          <button onClick={() => handleDelete(sale.id)} className="p-1.5 bg-red-500/20 rounded-lg hover:bg-red-500/30" title="Delete">
                            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-700/50">
          <span className="text-slate-400 text-sm">Showing {filteredSales.length} entries</span>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Receive Payment</h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
              <div className="p-4 bg-slate-900/50 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-400">Invoice:</span>
                  <span className="text-cyan-400 font-medium">{selectedSale.invoiceNo}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-400">Customer:</span>
                  <span className="text-white">{getCustomer(selectedSale.customerId).name}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-400">Total Amount:</span>
                  <span className="text-cyan-400">{business.currency} {(selectedSale.total || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-400">Already Paid:</span>
                  <span className="text-emerald-400">{business.currency} {getActualPaidForSale(selectedSale.id).toFixed(2)}</span>
                </div>
                {getReturnsForSale(selectedSale.id) > 0 && (
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-400">Returns:</span>
                    <span className="text-orange-400">- {business.currency} {getReturnsForSale(selectedSale.id).toFixed(2)}</span>
                  </div>
                )}
                <hr className="border-slate-700 my-2" />
                <div className="flex justify-between font-medium">
                  <span className="text-slate-300">Balance Due:</span>
                  <span className="text-yellow-400">{business.currency} {((selectedSale.total || 0) - getActualPaidForSale(selectedSale.id) - getReturnsForSale(selectedSale.id)).toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Payment Method *</label>
                  <select value={paymentData.method} onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })} className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white">
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Online">Online</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Amount *</label>
                  <input type="number" step="0.01" value={paymentData.amount} onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Payment Account</label>
                <select value={paymentData.accountId} onChange={(e) => setPaymentData({ ...paymentData, accountId: e.target.value })} className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white">
                  <option value="">None</option>
                  {accounts.map(acc => (<option key={acc.id} value={acc.id}>{acc.name}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Note</label>
                <textarea value={paymentData.note} onChange={(e) => setPaymentData({ ...paymentData, note: e.target.value })} className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" rows="2" />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="px-4 py-2 bg-slate-700 text-white rounded-lg">Close</button>
                <button type="submit" className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg">Save Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Invoice Details - {selectedSale.invoiceNo}</h2>
              <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-900/50 p-4 rounded-lg">
                  <h3 className="text-white font-medium mb-3">Invoice Info</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-400">Invoice No:</span><span className="text-cyan-400">{selectedSale.invoiceNo}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Date:</span><span className="text-white">{new Date(selectedSale.date || selectedSale.createdAt).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Status:</span><span className={`px-2 py-0.5 rounded text-xs ${selectedSale.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : selectedSale.status === 'partial' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>{selectedSale.status}</span></div>
                  </div>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-lg">
                  <h3 className="text-white font-medium mb-3">Customer Info</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-400">Name:</span><span className="text-white">{getCustomer(selectedSale.customerId).name}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Phone:</span><span className="text-white">{getCustomer(selectedSale.customerId).phone || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Email:</span><span className="text-white">{getCustomer(selectedSale.customerId).email || '-'}</span></div>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="text-white font-medium mb-3">Items</h3>
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-900/50">
                      <th className="text-left px-4 py-2 text-slate-400 text-sm">Product</th>
                      <th className="text-left px-4 py-2 text-slate-400 text-sm">Qty</th>
                      <th className="text-left px-4 py-2 text-slate-400 text-sm">Unit Price</th>
                      <th className="text-left px-4 py-2 text-slate-400 text-sm">Discount</th>
                      <th className="text-left px-4 py-2 text-slate-400 text-sm">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedSale.items || []).map((item, idx) => (
                      <tr key={idx} className="border-t border-slate-700/50">
                        <td className="px-4 py-2 text-white">{getProduct(item.productId).name}</td>
                        <td className="px-4 py-2 text-white">{item.quantity}</td>
                        <td className="px-4 py-2 text-white">{business.currency} {(item.unitPrice || item.sellingPrice || 0).toFixed(2)}</td>
                        <td className="px-4 py-2 text-orange-400">{item.discount ? `${business.currency} ${item.discount}` : '-'}</td>
                        <td className="px-4 py-2 text-cyan-400">{business.currency} {(item.subtotal || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-400">Subtotal:</span><span className="text-white">{business.currency} {(selectedSale.subtotal || selectedSale.total || 0).toFixed(2)}</span></div>
                  {selectedSale.discount > 0 && <div className="flex justify-between"><span className="text-slate-400">Discount:</span><span className="text-orange-400">- {business.currency} {selectedSale.discount.toFixed(2)}</span></div>}
                  {selectedSale.tax > 0 && <div className="flex justify-between"><span className="text-slate-400">Tax:</span><span className="text-white">{business.currency} {selectedSale.tax.toFixed(2)}</span></div>}
                  {selectedSale.shipping > 0 && <div className="flex justify-between"><span className="text-slate-400">Shipping:</span><span className="text-white">{business.currency} {selectedSale.shipping.toFixed(2)}</span></div>}
                  <hr className="border-slate-700" />
                  <div className="flex justify-between font-medium text-lg"><span className="text-slate-300">Total:</span><span className="text-cyan-400">{business.currency} {(selectedSale.total || 0).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Paid:</span><span className="text-emerald-400">{business.currency} {getActualPaidForSale(selectedSale.id).toFixed(2)}</span></div>
                  {getReturnsForSale(selectedSale.id) > 0 && <div className="flex justify-between"><span className="text-slate-400">Returns:</span><span className="text-orange-400">- {business.currency} {getReturnsForSale(selectedSale.id).toFixed(2)}</span></div>}
                  <div className="flex justify-between font-medium"><span className="text-slate-300">Balance:</span><span className="text-yellow-400">{business.currency} {((selectedSale.total || 0) - getActualPaidForSale(selectedSale.id) - getReturnsForSale(selectedSale.id)).toFixed(2)}</span></div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button onClick={() => { setShowViewModal(false); printInvoice(selectedSale); }} className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  Print Invoice
                </button>
                <button onClick={() => setShowViewModal(false)} className="px-4 py-2 bg-slate-700 text-white rounded-lg">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Invoice (Hidden) */}
      {showInvoice && selectedSale && (
        <div className="fixed inset-0 bg-white z-[9999] print:block hidden">
          <div ref={printRef} className="p-8 max-w-2xl mx-auto">
            {/* Business Header */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold">{business.name}</h1>
              {business.address && <p className="text-gray-600">{business.address}</p>}
              {business.phone && <p className="text-gray-600">Mobile: {business.phone}</p>}
            </div>

            {/* Invoice Info */}
            <div className="flex justify-between mb-6">
              <div>
                <p><strong>Invoice No:</strong> {selectedSale.invoiceNo}</p>
                <p><strong>Customer:</strong> {getCustomer(selectedSale.customerId).name}</p>
                <p><strong>Mobile:</strong> {getCustomer(selectedSale.customerId).phone || '-'}</p>
              </div>
              <div className="text-right">
                <p><strong>Date:</strong> {new Date(selectedSale.date || selectedSale.createdAt).toLocaleString()}</p>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full mb-6 border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-2">Product</th>
                  <th className="text-center py-2">Qty</th>
                  <th className="text-right py-2">Price</th>
                  <th className="text-right py-2">Discount</th>
                  <th className="text-right py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {(selectedSale.items || []).map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-200">
                    <td className="py-2">{getProduct(item.productId).name}</td>
                    <td className="text-center py-2">{item.quantity}</td>
                    <td className="text-right py-2">{(item.unitPrice || item.sellingPrice || 0).toFixed(2)}</td>
                    <td className="text-right py-2">{item.discount || 0}</td>
                    <td className="text-right py-2">{(item.subtotal || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64">
                <div className="flex justify-between py-1"><span>Subtotal:</span><span>{business.currency} {(selectedSale.subtotal || selectedSale.total || 0).toFixed(2)}</span></div>
                {selectedSale.discount > 0 && <div className="flex justify-between py-1"><span>Discount:</span><span>- {business.currency} {selectedSale.discount.toFixed(2)}</span></div>}
                {selectedSale.tax > 0 && <div className="flex justify-between py-1"><span>Tax:</span><span>{business.currency} {selectedSale.tax.toFixed(2)}</span></div>}
                <div className="flex justify-between py-1 font-bold text-lg border-t border-gray-300"><span>Total:</span><span>{business.currency} {(selectedSale.total || 0).toFixed(2)}</span></div>
                <div className="flex justify-between py-1"><span>Paid:</span><span>{business.currency} {getActualPaidForSale(selectedSale.id).toFixed(2)}</span></div>
                <div className="flex justify-between py-1 font-medium"><span>Balance:</span><span>{business.currency} {((selectedSale.total || 0) - getActualPaidForSale(selectedSale.id)).toFixed(2)}</span></div>
              </div>
            </div>

            <div className="text-center mt-8 text-gray-500 text-sm">
              <p>Thank you for your business!</p>
            </div>
          </div>
          <button onClick={() => setShowInvoice(false)} className="fixed top-4 right-4 px-4 py-2 bg-gray-800 text-white rounded print:hidden">Close</button>
        </div>
      )}
    </div>
  )
}