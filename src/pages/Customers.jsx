import { useState } from 'react'
import { useApp } from '../Context/AppContext'

export default function Customers() {
  const { state, dispatch } = useApp()
  const { customers, business, salesPayments, saleReturns, products, sales } = state
  
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const [activeTab, setActiveTab] = useState('ledger')
  
  const [formData, setFormData] = useState({
    contactType: 'customer',
    businessType: 'individual',
    businessName: '',
    name: '',
    phone: '',
    alternatePhone: '',
    landline: '',
    email: '',
    taxNumber: '',
    payTerm: '',
    openingBalance: 0,
    address: '',
    creditLimit: 0
  })

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm) ||
    c.contactId?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activeCustomer = customers.find(c => c.id === activeDropdown)

  // Get customer sales
  const customerSales = selectedCustomer 
    ? sales.filter(s => s.customerId === selectedCustomer.id)
    : []

  // Get customer payments
  const customerPayments = selectedCustomer
    ? (salesPayments || []).filter(p => p.customerId === selectedCustomer.id)
    : []

  // Get customer sale returns
  const customerSaleReturns = selectedCustomer
    ? (saleReturns || []).filter(sr => sr.customerId === selectedCustomer.id)
    : []

  // Helper functions
  function getActualPaidForSale(saleId) {
    return (salesPayments || [])
      .filter(p => p.saleId === saleId)
      .reduce((sum, p) => sum + (p.amount || 0), 0)
  }

  function getReturnsForSale(saleId) {
    return (saleReturns || [])
      .filter(sr => sr.saleId === saleId)
      .reduce((sum, sr) => sum + (sr.total || 0), 0)
  }

  // Calculate totals
  const totalSalesAmount = customerSales.reduce((sum, s) => sum + (s.total || 0), 0)
  const totalReceivedFromCustomer = customerPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
  const totalSaleReturns = customerSaleReturns.reduce((sum, sr) => sum + (sr.total || 0), 0)

  // Get products sold to this customer
  const getCustomerProducts = () => {
    if (!selectedCustomer) return []
    
    const productMap = new Map()
    
    customerSales.forEach(sale => {
      (sale.items || []).forEach(item => {
        const product = products.find(p => p.id === item.productId)
        if (product) {
          if (productMap.has(item.productId)) {
            const existing = productMap.get(item.productId)
            existing.totalQuantity += item.quantity || 0
            existing.totalValue += (item.subtotal || 0)
          } else {
            productMap.set(item.productId, {
              id: product.id,
              name: product.name,
              sku: product.sku,
              totalQuantity: item.quantity || 0,
              totalValue: item.subtotal || 0
            })
          }
        }
      })
    })
    
    return Array.from(productMap.values())
  }

  const customerProducts = selectedCustomer ? getCustomerProducts() : []

  function openAddModal() {
    setEditingCustomer(null)
    setFormData({
      contactType: 'customer',
      businessType: 'individual',
      businessName: '',
      name: '',
      phone: '',
      alternatePhone: '',
      landline: '',
      email: '',
      taxNumber: '',
      payTerm: '',
      openingBalance: 0,
      address: '',
      creditLimit: 0
    })
    setShowModal(true)
  }

  function openEditModal(customer) {
    setEditingCustomer(customer)
    setFormData({
      contactType: 'customer',
      businessType: customer.businessType || 'individual',
      businessName: customer.businessName || '',
      name: customer.name || '',
      phone: customer.phone || '',
      alternatePhone: customer.alternatePhone || '',
      landline: customer.landline || '',
      email: customer.email || '',
      taxNumber: customer.taxNumber || '',
      payTerm: customer.payTerm || '',
      openingBalance: customer.openingBalance || 0,
      address: customer.address || '',
      creditLimit: customer.creditLimit || 0
    })
    setShowModal(true)
    setActiveDropdown(null)
  }

  function openViewModal(customer) {
    setSelectedCustomer(customer)
    setActiveTab('ledger')
    setShowViewModal(true)
    setActiveDropdown(null)
  }

  function handleDropdownClick(e, customerId) {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setDropdownPosition({ top: rect.bottom + 4, left: rect.left })
    setActiveDropdown(activeDropdown === customerId ? null : customerId)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!formData.name) {
      alert('Name is required')
      return
    }

    if (editingCustomer) {
      dispatch({ type: 'UPDATE_CUSTOMER', payload: { ...editingCustomer, ...formData } })
    } else {
      dispatch({ type: 'ADD_CUSTOMER', payload: { ...formData, status: 'active' } })
    }
    setShowModal(false)
  }

  function handleDelete(id) {
    if (confirm('Are you sure you want to delete this customer?')) {
      dispatch({ type: 'DELETE_CUSTOMER', payload: id })
    }
    setActiveDropdown(null)
  }

  function handleDeactivate(id) {
    dispatch({ type: 'DEACTIVATE_CUSTOMER', payload: id })
    setActiveDropdown(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Customers</h1>
          <p className="text-slate-400 text-sm">Manage your Customers</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-cyan-600 transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl">
        <div className="p-4 border-b border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-sm">Show</span>
            <select className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm">
              <option>25</option>
              <option>50</option>
              <option>100</option>
            </select>
            <span className="text-slate-400 text-sm">entries</span>
          </div>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm w-full sm:w-64 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-900/50">
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Action</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Contact ID</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Name</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Business Name</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Email</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Credit Limit</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Balance</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Mobile</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-slate-500">No customers found</td>
                </tr>
              ) : (
                filteredCustomers.map(customer => (
                  <tr key={customer.id} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => handleDropdownClick(e, customer.id)}
                        className="px-3 py-1.5 bg-cyan-500 text-white rounded-lg text-sm hover:bg-cyan-600 transition-colors flex items-center gap-1"
                      >
                        Actions
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-cyan-400 font-medium">{customer.contactId || '-'}</td>
                    <td className="px-4 py-3 text-white">{customer.name}</td>
                    <td className="px-4 py-3 text-slate-300">{customer.businessName || '-'}</td>
                    <td className="px-4 py-3 text-slate-300">{customer.email || '-'}</td>
                    <td className="px-4 py-3 text-slate-300">{business.currency} {(customer.creditLimit || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-yellow-400">{business.currency} {(customer.balance || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-300">{customer.phone || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dropdown Portal - WITHOUT Receive Payment */}
      {activeDropdown && activeCustomer && (
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setActiveDropdown(null)} />
          <div className="fixed w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-[9999]" style={{ top: dropdownPosition.top, left: dropdownPosition.left }}>
            <div className="py-1">
              <button onClick={() => openViewModal(activeCustomer)} className="w-full flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-700 text-sm">👁️ View</button>
              <button onClick={() => openEditModal(activeCustomer)} className="w-full flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-700 text-sm">✏️ Edit</button>
              <button onClick={() => handleDelete(activeDropdown)} className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-slate-700 text-sm">🗑️ Delete</button>
              <button onClick={() => handleDeactivate(activeDropdown)} className="w-full flex items-center gap-2 px-4 py-2 text-yellow-400 hover:bg-slate-700 text-sm">
                {activeCustomer.status === 'active' ? '🚫 Deactivate' : '✅ Activate'}
              </button>
              <hr className="my-1 border-slate-700" />
              <button onClick={() => { openViewModal(activeCustomer); setActiveTab('sales'); }} className="w-full flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-700 text-sm">🛒 Sales</button>
              <button onClick={() => { openViewModal(activeCustomer); setActiveTab('returns'); }} className="w-full flex items-center gap-2 px-4 py-2 text-orange-400 hover:bg-slate-700 text-sm">↩️ Sales Returns</button>
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">{editingCustomer ? 'Edit Customer' : 'Add Customer'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-slate-300">
                  <input type="radio" name="businessType" value="individual" checked={formData.businessType === 'individual'} onChange={(e) => setFormData({ ...formData, businessType: e.target.value })} />
                  Individual
                </label>
                <label className="flex items-center gap-2 text-slate-300">
                  <input type="radio" name="businessType" value="business" checked={formData.businessType === 'business'} onChange={(e) => setFormData({ ...formData, businessType: e.target.value })} />
                  Business
                </label>
              </div>

              {formData.businessType === 'business' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Business Name</label>
                  <input type="text" value={formData.businessName} onChange={(e) => setFormData({ ...formData, businessName: e.target.value })} className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" placeholder="Business Name" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Name *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" placeholder="Customer Name" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Mobile</label>
                  <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" placeholder="Mobile Number" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" placeholder="Email" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Credit Limit</label>
                  <input type="number" step="0.01" value={formData.creditLimit} onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Opening Balance</label>
                  <input type="number" step="0.01" value={formData.openingBalance} onChange={(e) => setFormData({ ...formData, openingBalance: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Pay Term</label>
                  <select value={formData.payTerm} onChange={(e) => setFormData({ ...formData, payTerm: e.target.value })} className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white">
                    <option value="">Select Pay Term</option>
                    <option value="Net 7">Net 7</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Address</label>
                <textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" rows="2" />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-700 text-white rounded-lg">Close</button>
                <button type="submit" className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg">{editingCustomer ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">View Customer</h2>
                <p className="text-slate-400 text-sm">{selectedCustomer.name} • {selectedCustomer.contactId}</p>
              </div>
              <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-6 bg-slate-900/30 border-b border-slate-700">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">{selectedCustomer.name}</h3>
                  {selectedCustomer.businessName && <p className="text-slate-300 text-sm">{selectedCustomer.businessName}</p>}
                  <p className="text-slate-400 text-sm">📍 {selectedCustomer.address || 'No address'}</p>
                  <p className="text-slate-400 text-sm">📱 {selectedCustomer.phone || 'No phone'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Email: <span className="text-white">{selectedCustomer.email || '-'}</span></p>
                  <p className="text-slate-400 text-sm">Credit Limit: <span className="text-white">{business.currency} {(selectedCustomer.creditLimit || 0).toFixed(2)}</span></p>
                  <p className="text-slate-400 text-sm">Pay Term: <span className="text-white">{selectedCustomer.payTerm || '-'}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-sm">Balance Due</p>
                  <p className="text-2xl font-bold text-yellow-400">{business.currency} {(selectedCustomer.balance || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>
            
            <div className="border-b border-slate-700">
              <div className="flex gap-1 px-6 overflow-x-auto">
                {[
                  { id: 'ledger', name: 'Ledger', icon: '📊' },
                  { id: 'sales', name: 'Sales', icon: '🛒' },
                  { id: 'returns', name: 'Sales Returns', icon: '↩️' },
                  { id: 'products', name: 'Products Sold', icon: '📦' },
                  { id: 'payments', name: 'Payments', icon: '💳' },
                  { id: 'activities', name: 'Activities', icon: '📝' },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-slate-400 hover:text-white'}`}>
                    {tab.icon} {tab.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Ledger Tab */}
              {activeTab === 'ledger' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900/50 p-4 rounded-lg">
                    <h4 className="text-white font-medium mb-3">Account Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-slate-400">Total Sales:</span><span className="text-cyan-400">{business.currency} {totalSalesAmount.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Total Received:</span><span className="text-emerald-400">{business.currency} {totalReceivedFromCustomer.toFixed(2)}</span></div>
                      {totalSaleReturns > 0 && <div className="flex justify-between"><span className="text-slate-400">Sales Returns:</span><span className="text-orange-400">- {business.currency} {totalSaleReturns.toFixed(2)}</span></div>}
                      <hr className="border-slate-700 my-2" />
                      <div className="flex justify-between font-medium"><span className="text-slate-300">Balance Due:</span><span className="text-yellow-400">{business.currency} {(selectedCustomer.balance || 0).toFixed(2)}</span></div>
                    </div>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-lg">
                    <h4 className="text-white font-medium mb-3">Overall Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-slate-400">Opening Balance:</span><span className="text-white">{business.currency} {(selectedCustomer.openingBalance || 0).toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Advance Balance:</span><span className="text-emerald-400">{business.currency} {(selectedCustomer.advanceBalance || 0).toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Total Sales:</span><span className="text-white">{customerSales.length}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Total Returns:</span><span className="text-orange-400">{customerSaleReturns.length}</span></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sales Tab */}
              {activeTab === 'sales' && (
                <div>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-900/50">
                        <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Date</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Invoice No</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Status</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Total</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Paid</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Returns</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerSales.length === 0 ? (
                        <tr><td colSpan="7" className="text-center py-8 text-slate-500">No sales found</td></tr>
                      ) : (
                        customerSales.map(sale => {
                          const paid = getActualPaidForSale(sale.id)
                          const returns = getReturnsForSale(sale.id)
                          const due = (sale.total || 0) - paid - returns
                          return (
                            <tr key={sale.id} className="border-t border-slate-700/50">
                              <td className="px-4 py-3 text-white">{new Date(sale.date || sale.createdAt).toLocaleDateString()}</td>
                              <td className="px-4 py-3 text-cyan-400">{sale.invoiceNo}</td>
                              <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${due <= 0 ? 'bg-emerald-500/20 text-emerald-400' : due < (sale.total || 0) ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>{due <= 0 ? 'paid' : due < (sale.total || 0) ? 'partial' : 'due'}</span></td>
                              <td className="px-4 py-3 text-white">{business.currency} {(sale.total || 0).toFixed(2)}</td>
                              <td className="px-4 py-3 text-emerald-400">{business.currency} {paid.toFixed(2)}</td>
                              <td className="px-4 py-3 text-orange-400">{returns > 0 ? `- ${business.currency} ${returns.toFixed(2)}` : '-'}</td>
                              <td className="px-4 py-3 text-yellow-400">{business.currency} {due.toFixed(2)}</td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Sales Returns Tab */}
              {activeTab === 'returns' && (
                <div>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-900/50">
                        <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Date</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Return No</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Against Invoice</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Items</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerSaleReturns.length === 0 ? (
                        <tr><td colSpan="5" className="text-center py-8 text-slate-500">No sales returns found</td></tr>
                      ) : (
                        customerSaleReturns.map(sr => {
                          const sale = sales.find(s => s.id === sr.saleId)
                          return (
                            <tr key={sr.id} className="border-t border-slate-700/50">
                              <td className="px-4 py-3 text-white">{new Date(sr.createdAt || sr.date).toLocaleDateString()}</td>
                              <td className="px-4 py-3 text-orange-400">{sr.returnNo}</td>
                              <td className="px-4 py-3 text-cyan-400">{sale?.invoiceNo || '-'}</td>
                              <td className="px-4 py-3 text-slate-300">{(sr.items || []).length} items</td>
                              <td className="px-4 py-3 text-orange-400">{business.currency} {(sr.total || 0).toFixed(2)}</td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Products Sold Tab */}
              {activeTab === 'products' && (
                <div>
                  {customerProducts.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">No products sold to this customer yet</p>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-900/50">
                          <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Product</th>
                          <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">SKU</th>
                          <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Total Qty Sold</th>
                          <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Total Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerProducts.map(product => (
                          <tr key={product.id} className="border-t border-slate-700/50">
                            <td className="px-4 py-3 text-white font-medium">{product.name}</td>
                            <td className="px-4 py-3 text-slate-300">{product.sku || '-'}</td>
                            <td className="px-4 py-3 text-cyan-400">{product.totalQuantity}</td>
                            <td className="px-4 py-3 text-emerald-400">{business.currency} {product.totalValue.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Payments Tab */}
              {activeTab === 'payments' && (
                <div>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-900/50">
                        <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Date</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Reference</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Method</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Amount</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerPayments.length === 0 ? (
                        <tr><td colSpan="5" className="text-center py-8 text-slate-500">No payments found</td></tr>
                      ) : (
                        customerPayments.map(payment => {
                          const sale = payment.saleId ? sales.find(s => s.id === payment.saleId) : null
                          return (
                            <tr key={payment.id} className="border-t border-slate-700/50">
                              <td className="px-4 py-3 text-white">{new Date(payment.date).toLocaleString()}</td>
                              <td className="px-4 py-3 text-cyan-400">{sale?.invoiceNo || '-'}</td>
                              <td className="px-4 py-3 text-slate-300">{payment.method}</td>
                              <td className="px-4 py-3 text-emerald-400">{business.currency} {(payment.amount || 0).toFixed(2)}</td>
                              <td className="px-4 py-3 text-slate-400">{payment.note || '-'}</td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Activities Tab */}
              {activeTab === 'activities' && (
                <div>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-900/50">
                        <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Date</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Action</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">By</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedCustomer.activities || []).length === 0 ? (
                        <tr><td colSpan="4" className="text-center py-8 text-slate-500">No activities found</td></tr>
                      ) : (
                        (selectedCustomer.activities || []).map((activity, index) => (
                          <tr key={index} className="border-t border-slate-700/50">
                            <td className="px-4 py-3 text-white">{new Date(activity.date).toLocaleString()}</td>
                            <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${activity.action.includes('Return') ? 'bg-orange-500/20 text-orange-400' : activity.action.includes('Payment') ? 'bg-emerald-500/20 text-emerald-400' : activity.action.includes('Sale') ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-500/20 text-slate-400'}`}>{activity.action}</span></td>
                            <td className="px-4 py-3 text-slate-300">{activity.by}</td>
                            <td className="px-4 py-3 text-slate-400">{activity.note || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}