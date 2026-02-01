import { useState } from 'react'
import { useApp } from '../context/AppContext'

export default function Suppliers() {
  const { state, dispatch } = useApp()
  const { suppliers, business, purchasePayments, purchaseReturns, products } = state
  
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const [activeTab, setActiveTab] = useState('ledger')
  
  const [formData, setFormData] = useState({
    contactType: 'supplier',
    businessType: 'business',
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
    dateOfBirth: '',
    assignedTo: ''
  })

  const [contactPersonForm, setContactPersonForm] = useState({
    username: '',
    name: '',
    email: '',
    department: '',
    designation: ''
  })

  const filteredSuppliers = suppliers.filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone?.includes(searchTerm) ||
    s.contactId?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activeSupplier = suppliers.find(s => s.id === activeDropdown)

  function openAddModal() {
    setEditingSupplier(null)
    setFormData({
      contactType: 'supplier',
      businessType: 'business',
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
      dateOfBirth: '',
      assignedTo: ''
    })
    setShowModal(true)
  }

  function openEditModal(supplier) {
    setEditingSupplier(supplier)
    setFormData({
      contactType: 'supplier',
      businessType: supplier.businessType || 'business',
      businessName: supplier.businessName || '',
      name: supplier.name || '',
      phone: supplier.phone || '',
      alternatePhone: supplier.alternatePhone || '',
      landline: supplier.landline || '',
      email: supplier.email || '',
      taxNumber: supplier.taxNumber || '',
      payTerm: supplier.payTerm || '',
      openingBalance: supplier.openingBalance || 0,
      address: supplier.address || '',
      dateOfBirth: supplier.dateOfBirth || '',
      assignedTo: supplier.assignedTo || ''
    })
    setShowModal(true)
    setActiveDropdown(null)
  }

  function openViewModal(supplier) {
    setSelectedSupplier(supplier)
    setActiveTab('ledger')
    setShowViewModal(true)
    setActiveDropdown(null)
  }

  function handleDropdownClick(e, supplierId) {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setDropdownPosition({
      top: rect.bottom + 4,
      left: rect.left
    })
    setActiveDropdown(activeDropdown === supplierId ? null : supplierId)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!formData.name && !formData.businessName) {
      alert('Name or Business Name is required')
      return
    }
    if (!formData.phone) {
      alert('Mobile number is required')
      return
    }

    if (editingSupplier) {
      dispatch({ type: 'UPDATE_SUPPLIER', payload: { ...editingSupplier, ...formData } })
    } else {
      dispatch({ type: 'ADD_SUPPLIER', payload: { ...formData, status: 'active' } })
    }
    setShowModal(false)
  }

  function handleDelete(id) {
    if (confirm('Are you sure you want to delete this supplier?')) {
      dispatch({ type: 'DELETE_SUPPLIER', payload: id })
    }
    setActiveDropdown(null)
  }

  function handleDeactivate(id) {
    dispatch({ type: 'DEACTIVATE_SUPPLIER', payload: id })
    setActiveDropdown(null)
  }

  function handleAddContactPerson(e) {
    e.preventDefault()
    if (!contactPersonForm.name) {
      alert('Name is required')
      return
    }
    dispatch({
      type: 'ADD_SUPPLIER_CONTACT_PERSON',
      payload: {
        supplierId: selectedSupplier.id,
        person: contactPersonForm
      }
    })
    setContactPersonForm({ username: '', name: '', email: '', department: '', designation: '' })
    const updated = state.suppliers.find(s => s.id === selectedSupplier.id)
    if (updated) setSelectedSupplier({ ...updated, contactPersons: [...(updated.contactPersons || []), { ...contactPersonForm, id: Date.now() }] })
  }

  // Get supplier purchases
  const supplierPurchases = selectedSupplier 
    ? state.purchases.filter(p => p.supplierId === selectedSupplier.id)
    : []

  // Get supplier payments
  const supplierPayments = selectedSupplier
    ? (purchasePayments || []).filter(p => p.supplierId === selectedSupplier.id)
    : []

  // Get supplier purchase returns
  const supplierPurchaseReturns = selectedSupplier
    ? (purchaseReturns || []).filter(pr => pr.supplierId === selectedSupplier.id)
    : []

  // Helper function to calculate actual paid amount for a specific purchase
  function getActualPaidForPurchase(purchaseId) {
    return (purchasePayments || [])
      .filter(p => p.purchaseId === purchaseId)
      .reduce((sum, p) => sum + (p.amount || 0), 0)
  }

  // Helper function to get returns for a specific purchase
  function getReturnsForPurchase(purchaseId) {
    return (purchaseReturns || [])
      .filter(pr => pr.purchaseId === purchaseId)
      .reduce((sum, pr) => sum + (pr.total || 0), 0)
  }

  // Calculate totals
  const totalPurchasesAmount = supplierPurchases.reduce((sum, p) => sum + (p.total || 0), 0)
  const totalPaidToSupplier = supplierPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
  const totalPurchaseReturns = supplierPurchaseReturns.reduce((sum, pr) => sum + (pr.total || 0), 0)

  // Get products purchased from this supplier
  const getSupplierProducts = () => {
    if (!selectedSupplier) return []
    
    const productMap = new Map()
    
    supplierPurchases.forEach(purchase => {
      (purchase.items || []).forEach(item => {
        const product = products.find(p => p.id === item.productId)
        if (product) {
          if (productMap.has(item.productId)) {
            const existing = productMap.get(item.productId)
            existing.totalQuantity += item.quantity || 0
            existing.totalValue += (item.quantity || 0) * (item.unitCost || item.costPrice || 0)
            existing.purchases.push({
              purchaseNo: purchase.purchaseNo,
              date: purchase.date || purchase.createdAt,
              quantity: item.quantity,
              unitCost: item.unitCost || item.costPrice
            })
          } else {
            productMap.set(item.productId, {
              id: product.id,
              name: product.name,
              sku: product.sku,
              currentStock: product.currentStock,
              totalQuantity: item.quantity || 0,
              totalValue: (item.quantity || 0) * (item.unitCost || item.costPrice || 0),
              purchases: [{
                purchaseNo: purchase.purchaseNo,
                date: purchase.date || purchase.createdAt,
                quantity: item.quantity,
                unitCost: item.unitCost || item.costPrice
              }]
            })
          }
        }
      })
    })
    
    return Array.from(productMap.values())
  }

  const supplierProducts = selectedSupplier ? getSupplierProducts() : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Suppliers</h1>
          <p className="text-slate-400 text-sm">Manage your Suppliers</p>
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
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm w-full sm:w-64 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-900/50">
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Action</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Contact ID</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Business Name</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Name</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Email</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Tax Number</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Pay Term</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Opening Balance</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Advance Balance</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Added On</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Mobile</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan="11" className="text-center py-8 text-slate-500">No suppliers found</td>
                </tr>
              ) : (
                filteredSuppliers.map(supplier => (
                  <tr key={supplier.id} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => handleDropdownClick(e, supplier.id)}
                        className="px-3 py-1.5 bg-cyan-500 text-white rounded-lg text-sm hover:bg-cyan-600 transition-colors flex items-center gap-1"
                      >
                        Actions
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-cyan-400 font-medium">{supplier.contactId || '-'}</td>
                    <td className="px-4 py-3 text-white">{supplier.businessName || '-'}</td>
                    <td className="px-4 py-3 text-white">{supplier.name}</td>
                    <td className="px-4 py-3 text-slate-300">{supplier.email || '-'}</td>
                    <td className="px-4 py-3 text-slate-300">{supplier.taxNumber || '-'}</td>
                    <td className="px-4 py-3 text-slate-300">{supplier.payTerm || '-'}</td>
                    <td className="px-4 py-3 text-slate-300">{business.currency} {(supplier.openingBalance || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-emerald-400">{business.currency} {(supplier.advanceBalance || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-300">{supplier.createdAt || '-'}</td>
                    <td className="px-4 py-3 text-slate-300">{supplier.phone}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-700/50 flex items-center justify-between">
          <span className="text-slate-400 text-sm">Showing 1 to {filteredSuppliers.length} of {filteredSuppliers.length} entries</span>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 bg-slate-700 text-slate-300 rounded-lg text-sm">Previous</button>
            <button className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-sm">1</button>
            <button className="px-3 py-1 bg-slate-700 text-slate-300 rounded-lg text-sm">Next</button>
          </div>
        </div>
      </div>

      {/* Dropdown Portal - WITHOUT Pay option */}
      {activeDropdown && activeSupplier && (
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setActiveDropdown(null)} />
          <div 
            className="fixed w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-[9999]"
            style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
          >
            <div className="py-1">
              <button onClick={() => openViewModal(activeSupplier)} className="w-full flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-700 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                View
              </button>
              <button onClick={() => openEditModal(activeSupplier)} className="w-full flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-700 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Edit
              </button>
              <button onClick={() => handleDelete(activeDropdown)} className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-slate-700 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Delete
              </button>
              <button onClick={() => handleDeactivate(activeDropdown)} className="w-full flex items-center gap-2 px-4 py-2 text-yellow-400 hover:bg-slate-700 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                {activeSupplier.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
              <hr className="my-1 border-slate-700" />
              <button onClick={() => openViewModal(activeSupplier)} className="w-full flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-700 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Ledger
              </button>
              <button onClick={() => { openViewModal(activeSupplier); setActiveTab('purchases'); }} className="w-full flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-700 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                Purchases
              </button>
              <button onClick={() => { openViewModal(activeSupplier); setActiveTab('returns'); }} className="w-full flex items-center gap-2 px-4 py-2 text-orange-400 hover:bg-slate-700 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" /></svg>
                Purchase Returns
              </button>
              <button onClick={() => { openViewModal(activeSupplier); setActiveTab('stock'); }} className="w-full flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-700 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                Stock Report
              </button>
              <button onClick={() => { openViewModal(activeSupplier); setActiveTab('documents'); }} className="w-full flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-700 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Documents & Note
              </button>
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800">
              <h2 className="text-xl font-bold text-white">{editingSupplier ? 'Edit Contact' : 'Add Contact'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Contact Type *</label>
                  <select value={formData.contactType} onChange={(e) => setFormData({ ...formData, contactType: e.target.value })} className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500">
                    <option value="supplier">Suppliers</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Contact ID</label>
                  <input type="text" value={editingSupplier?.contactId || 'Auto-generated'} disabled className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-400" />
                  <p className="text-xs text-slate-500 mt-1">Leave empty to autogenerate</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-slate-300">
                  <input type="radio" name="businessType" value="individual" checked={formData.businessType === 'individual'} onChange={(e) => setFormData({ ...formData, businessType: e.target.value })} className="text-emerald-500" />
                  Individual
                </label>
                <label className="flex items-center gap-2 text-slate-300">
                  <input type="radio" name="businessType" value="business" checked={formData.businessType === 'business'} onChange={(e) => setFormData({ ...formData, businessType: e.target.value })} className="text-emerald-500" />
                  Business
                </label>
              </div>

              {formData.businessType === 'business' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Business Name</label>
                  <input type="text" value={formData.businessName} onChange={(e) => setFormData({ ...formData, businessName: e.target.value })} className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500" placeholder="Business Name" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Mobile *</label>
                  <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500" placeholder="Mobile Number" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Alternate Contact Number</label>
                  <input type="text" value={formData.alternatePhone} onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })} className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500" placeholder="Alternate Number" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Landline</label>
                  <input type="text" value={formData.landline} onChange={(e) => setFormData({ ...formData, landline: e.target.value })} className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500" placeholder="Landline" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500" placeholder="Email" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500" placeholder="Contact Name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Tax Number</label>
                  <input type="text" value={formData.taxNumber} onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })} className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500" placeholder="Tax Number" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Opening Balance</label>
                  <input type="number" step="0.01" value={formData.openingBalance} onChange={(e) => setFormData({ ...formData, openingBalance: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Pay Term</label>
                  <select value={formData.payTerm} onChange={(e) => setFormData({ ...formData, payTerm: e.target.value })} className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500">
                    <option value="">Select Pay Term</option>
                    <option value="Net 7">Net 7</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 45">Net 45</option>
                    <option value="Net 60">Net 60</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Address</label>
                <textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500" rows="2" placeholder="Address" />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">Close</button>
                <button type="submit" className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all">{editingSupplier ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedSupplier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">View Contact</h2>
                <p className="text-slate-400 text-sm">{selectedSupplier.name} • {selectedSupplier.contactId}</p>
              </div>
              <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 bg-slate-900/30 border-b border-slate-700">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">{selectedSupplier.name}</h3>
                  {selectedSupplier.businessName && <p className="text-slate-300 text-sm mb-1">{selectedSupplier.businessName}</p>}
                  <p className="text-slate-400 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {selectedSupplier.address || 'No address'}
                  </p>
                  <p className="text-slate-400 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    {selectedSupplier.phone || 'No phone'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Tax Number: <span className="text-white">{selectedSupplier.taxNumber || '-'}</span></p>
                  <p className="text-slate-400 text-sm">Email: <span className="text-white">{selectedSupplier.email || '-'}</span></p>
                  <p className="text-slate-400 text-sm">Pay Term: <span className="text-white">{selectedSupplier.payTerm || '-'}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-sm">Balance Due</p>
                  <p className="text-2xl font-bold text-yellow-400">{business.currency} {(selectedSupplier.balance || 0).toFixed(2)}</p>
                  {selectedSupplier.advanceBalance > 0 && <p className="text-emerald-400 text-sm">Advance: {business.currency} {selectedSupplier.advanceBalance.toFixed(2)}</p>}
                </div>
              </div>
            </div>
            
            <div className="border-b border-slate-700">
              <div className="flex gap-1 px-6 overflow-x-auto">
                {[
                  { id: 'ledger', name: 'Ledger', icon: '📊' },
                  { id: 'purchases', name: 'Purchases', icon: '🛒' },
                  { id: 'returns', name: 'Purchase Returns', icon: '↩️' },
                  { id: 'stock', name: 'Stock Report', icon: '📦' },
                  { id: 'documents', name: 'Documents & Note', icon: '📄' },
                  { id: 'payments', name: 'Payments', icon: '💳' },
                  { id: 'activities', name: 'Activities', icon: '📝' },
                  { id: 'contacts', name: 'Contact Persons', icon: '👥' },
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
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/50 p-4 rounded-lg">
                      <h4 className="text-white font-medium mb-3">Account Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-slate-400">Total Purchase:</span><span className="text-cyan-400">{business.currency} {totalPurchasesAmount.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Total Paid:</span><span className="text-emerald-400">{business.currency} {totalPaidToSupplier.toFixed(2)}</span></div>
                        {totalPurchaseReturns > 0 && <div className="flex justify-between"><span className="text-slate-400">Purchase Returns:</span><span className="text-orange-400">- {business.currency} {totalPurchaseReturns.toFixed(2)}</span></div>}
                        <hr className="border-slate-700 my-2" />
                        <div className="flex justify-between font-medium"><span className="text-slate-300">Balance Due:</span><span className="text-yellow-400">{business.currency} {(selectedSupplier.balance || 0).toFixed(2)}</span></div>
                      </div>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-lg">
                      <h4 className="text-white font-medium mb-3">Overall Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-slate-400">Opening Balance:</span><span className="text-white">{business.currency} {(selectedSupplier.openingBalance || 0).toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Advance Balance:</span><span className="text-emerald-400">{business.currency} {(selectedSupplier.advanceBalance || 0).toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Total Purchases:</span><span className="text-white">{supplierPurchases.length}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Total Returns:</span><span className="text-orange-400">{supplierPurchaseReturns.length}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Purchases Tab */}
              {activeTab === 'purchases' && (
                <div>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-900/50">
                        <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Date</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Purchase No</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Status</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Grand Total</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Paid</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Returns</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplierPurchases.length === 0 ? (
                        <tr><td colSpan="7" className="text-center py-8 text-slate-500">No purchases found</td></tr>
                      ) : (
                        supplierPurchases.map(purchase => {
                          const actualPaid = getActualPaidForPurchase(purchase.id)
                          const purchaseReturnsAmount = getReturnsForPurchase(purchase.id)
                          const paymentDue = (purchase.total || 0) - actualPaid - purchaseReturnsAmount
                          return (
                            <tr key={purchase.id} className="border-t border-slate-700/50">
                              <td className="px-4 py-3 text-white">{new Date(purchase.date || purchase.createdAt).toLocaleDateString()}</td>
                              <td className="px-4 py-3 text-cyan-400">{purchase.purchaseNo || '-'}</td>
                              <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${paymentDue <= 0 ? 'bg-emerald-500/20 text-emerald-400' : paymentDue < (purchase.total || 0) ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>{paymentDue <= 0 ? 'paid' : paymentDue < (purchase.total || 0) ? 'partial' : 'due'}</span></td>
                              <td className="px-4 py-3 text-white">{business.currency} {(purchase.total || 0).toFixed(2)}</td>
                              <td className="px-4 py-3 text-emerald-400">{business.currency} {actualPaid.toFixed(2)}</td>
                              <td className="px-4 py-3 text-orange-400">{purchaseReturnsAmount > 0 ? `- ${business.currency} ${purchaseReturnsAmount.toFixed(2)}` : '-'}</td>
                              <td className="px-4 py-3 text-yellow-400">{business.currency} {paymentDue.toFixed(2)}</td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                  {supplierPurchases.length > 0 && (
                    <div className="mt-4 p-4 bg-slate-900/50 rounded-lg">
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div className="flex justify-between"><span className="text-slate-400">Total Purchases:</span><span className="text-cyan-400 font-medium">{business.currency} {totalPurchasesAmount.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Total Paid:</span><span className="text-emerald-400 font-medium">{business.currency} {totalPaidToSupplier.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Total Returns:</span><span className="text-orange-400 font-medium">- {business.currency} {totalPurchaseReturns.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Balance Due:</span><span className="text-yellow-400 font-medium">{business.currency} {(selectedSupplier.balance || 0).toFixed(2)}</span></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Purchase Returns Tab */}
              {activeTab === 'returns' && (
                <div>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-900/50">
                        <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Date</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Return No</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Against Purchase</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Items</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Total Amount</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplierPurchaseReturns.length === 0 ? (
                        <tr><td colSpan="6" className="text-center py-8 text-slate-500">No purchase returns found</td></tr>
                      ) : (
                        supplierPurchaseReturns.map(pr => {
                          const relatedPurchase = pr.purchaseId ? state.purchases.find(p => p.id === pr.purchaseId) : null
                          return (
                            <tr key={pr.id} className="border-t border-slate-700/50">
                              <td className="px-4 py-3 text-white">{new Date(pr.createdAt || pr.date).toLocaleDateString()}</td>
                              <td className="px-4 py-3 text-orange-400 font-medium">{pr.returnNo}</td>
                              <td className="px-4 py-3 text-cyan-400">{relatedPurchase?.purchaseNo || '-'}</td>
                              <td className="px-4 py-3 text-slate-300">{(pr.items || []).length} items</td>
                              <td className="px-4 py-3 text-orange-400">{business.currency} {(pr.total || 0).toFixed(2)}</td>
                              <td className="px-4 py-3"><span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs">{pr.status || 'completed'}</span></td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                  {supplierPurchaseReturns.length > 0 && (
                    <div className="mt-4 p-4 bg-slate-900/50 rounded-lg">
                      <div className="flex justify-between text-sm"><span className="text-slate-400">Total Purchase Returns:</span><span className="text-orange-400 font-medium">{business.currency} {totalPurchaseReturns.toFixed(2)}</span></div>
                    </div>
                  )}
                </div>
              )}

              {/* Stock Report Tab */}
              {activeTab === 'stock' && (
                <div>
                  {supplierProducts.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">No products purchased from this supplier yet</p>
                  ) : (
                    <>
                      <table className="w-full">
                        <thead>
                          <tr className="bg-slate-900/50">
                            <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Product</th>
                            <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">SKU</th>
                            <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Total Qty Purchased</th>
                            <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Total Value</th>
                            <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Current Stock</th>
                            <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Purchase Count</th>
                          </tr>
                        </thead>
                        <tbody>
                          {supplierProducts.map(product => (
                            <tr key={product.id} className="border-t border-slate-700/50">
                              <td className="px-4 py-3 text-white font-medium">{product.name}</td>
                              <td className="px-4 py-3 text-slate-300">{product.sku || '-'}</td>
                              <td className="px-4 py-3 text-cyan-400">{product.totalQuantity}</td>
                              <td className="px-4 py-3 text-emerald-400">{business.currency} {product.totalValue.toFixed(2)}</td>
                              <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${product.currentStock <= 0 ? 'bg-red-500/20 text-red-400' : product.currentStock < 10 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{product.currentStock}</span></td>
                              <td className="px-4 py-3 text-slate-300">{product.purchases.length}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="mt-4 p-4 bg-slate-900/50 rounded-lg">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="flex justify-between"><span className="text-slate-400">Total Products:</span><span className="text-white font-medium">{supplierProducts.length}</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">Total Qty Purchased:</span><span className="text-cyan-400 font-medium">{supplierProducts.reduce((sum, p) => sum + p.totalQuantity, 0)}</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">Total Purchase Value:</span><span className="text-emerald-400 font-medium">{business.currency} {supplierProducts.reduce((sum, p) => sum + p.totalValue, 0).toFixed(2)}</span></div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Documents Tab */}
              {activeTab === 'documents' && <div><p className="text-slate-400 text-center py-8">No documents uploaded yet</p></div>}

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
                      {supplierPayments.length === 0 ? (
                        <tr><td colSpan="5" className="text-center py-8 text-slate-500">No payments found</td></tr>
                      ) : (
                        supplierPayments.map(payment => {
                          const relatedPurchase = payment.purchaseId ? state.purchases.find(p => p.id === payment.purchaseId) : null
                          return (
                            <tr key={payment.id} className="border-t border-slate-700/50">
                              <td className="px-4 py-3 text-white">{new Date(payment.date).toLocaleString()}</td>
                              <td className="px-4 py-3 text-cyan-400">{relatedPurchase?.purchaseNo || '-'}</td>
                              <td className="px-4 py-3 text-slate-300">{payment.method}</td>
                              <td className="px-4 py-3 text-emerald-400">{business.currency} {(payment.amount || 0).toFixed(2)}</td>
                              <td className="px-4 py-3 text-slate-400">{payment.note || '-'}</td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                  {supplierPayments.length > 0 && (
                    <div className="mt-4 p-4 bg-slate-900/50 rounded-lg">
                      <div className="flex justify-between text-sm"><span className="text-slate-400">Total Paid:</span><span className="text-emerald-400 font-medium">{business.currency} {totalPaidToSupplier.toFixed(2)}</span></div>
                    </div>
                  )}
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
                      {(selectedSupplier.activities || []).length === 0 ? (
                        <tr><td colSpan="4" className="text-center py-8 text-slate-500">No activities found</td></tr>
                      ) : (
                        (selectedSupplier.activities || []).map((activity, index) => (
                          <tr key={index} className="border-t border-slate-700/50">
                            <td className="px-4 py-3 text-white">{new Date(activity.date).toLocaleString()}</td>
                            <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${activity.action.includes('Return') ? 'bg-orange-500/20 text-orange-400' : activity.action.includes('Payment') ? 'bg-emerald-500/20 text-emerald-400' : activity.action.includes('Purchase') ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-500/20 text-slate-400'}`}>{activity.action}</span></td>
                            <td className="px-4 py-3 text-slate-300">{activity.by}</td>
                            <td className="px-4 py-3 text-slate-400">{activity.note || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Contact Persons Tab */}
              {activeTab === 'contacts' && (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <button onClick={() => document.getElementById('addContactFormSupplier').classList.toggle('hidden')} className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg text-sm">+ Add</button>
                  </div>
                  <div id="addContactFormSupplier" className="hidden bg-slate-900/50 p-4 rounded-lg">
                    <div className="grid grid-cols-5 gap-4">
                      <input type="text" placeholder="Username" value={contactPersonForm.username} onChange={(e) => setContactPersonForm({ ...contactPersonForm, username: e.target.value })} className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm" />
                      <input type="text" placeholder="Name *" value={contactPersonForm.name} onChange={(e) => setContactPersonForm({ ...contactPersonForm, name: e.target.value })} className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm" />
                      <input type="email" placeholder="Email" value={contactPersonForm.email} onChange={(e) => setContactPersonForm({ ...contactPersonForm, email: e.target.value })} className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm" />
                      <input type="text" placeholder="Department" value={contactPersonForm.department} onChange={(e) => setContactPersonForm({ ...contactPersonForm, department: e.target.value })} className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm" />
                      <button onClick={handleAddContactPerson} className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600 transition-colors">Add</button>
                    </div>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-900/50">
                        <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Action</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Username</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Name</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Email</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Department</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Designation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedSupplier.contactPersons || []).length === 0 ? (
                        <tr><td colSpan="6" className="text-center py-8 text-slate-500">No contact persons found</td></tr>
                      ) : (
                        (selectedSupplier.contactPersons || []).map(person => (
                          <tr key={person.id} className="border-t border-slate-700/50">
                            <td className="px-4 py-3">
                              <button onClick={() => { if (confirm('Delete this contact person?')) { dispatch({ type: 'DELETE_SUPPLIER_CONTACT_PERSON', payload: { supplierId: selectedSupplier.id, personId: person.id } }); setSelectedSupplier({ ...selectedSupplier, contactPersons: selectedSupplier.contactPersons.filter(p => p.id !== person.id) }) } }} className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30">Delete</button>
                            </td>
                            <td className="px-4 py-3 text-white">{person.username || '-'}</td>
                            <td className="px-4 py-3 text-white">{person.name}</td>
                            <td className="px-4 py-3 text-slate-300">{person.email || '-'}</td>
                            <td className="px-4 py-3 text-slate-300">{person.department || '-'}</td>
                            <td className="px-4 py-3 text-slate-300">{person.designation || '-'}</td>
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