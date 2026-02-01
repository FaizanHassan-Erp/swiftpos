import { useState } from 'react'
import { useApp } from '../Context/AppContext'

export default function InvoiceSettings() {
  const { state, dispatch } = useApp()
  const { invoiceSchemes = [], invoiceLayouts = [] } = state

  const [activeTab, setActiveTab] = useState('schemes')
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('scheme')
  const [editingItem, setEditingItem] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })

  // Form state for invoice scheme
  const [schemeForm, setSchemeForm] = useState({
    name: '',
    prefix: '',
    format: 'XXXX',
    numberingType: 'sequential',
    startFrom: 1,
    numberOfDigits: 4,
    isDefault: false
  })

  // Form state for invoice layout
  const [layoutForm, setLayoutForm] = useState({
    name: '',
    type: 'sale',
    paperSize: 'A4',
    showLogo: true,
    showTax: true,
    showDiscount: true,
    showPaymentInfo: true,
    showShippingAddress: true,
    showBarcode: false,
    showQRCode: false,
    headerText: '',
    footerText: '',
    termsAndConditions: '',
    isDefault: false
  })

  // Filter data
  const filteredSchemes = invoiceSchemes.filter(scheme =>
    scheme.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredLayouts = invoiceLayouts.filter(layout =>
    layout.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  function showMessage(type, text) {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  function openAddModal(type) {
    setModalType(type)
    setEditingItem(null)
    if (type === 'scheme') {
      setSchemeForm({
        name: '',
        prefix: '',
        format: 'XXXX',
        numberingType: 'sequential',
        startFrom: 1,
        numberOfDigits: 4,
        isDefault: invoiceSchemes.length === 0
      })
    } else {
      setLayoutForm({
        name: '',
        type: 'sale',
        paperSize: 'A4',
        showLogo: true,
        showTax: true,
        showDiscount: true,
        showPaymentInfo: true,
        showShippingAddress: true,
        showBarcode: false,
        showQRCode: false,
        headerText: '',
        footerText: '',
        termsAndConditions: '',
        isDefault: invoiceLayouts.length === 0
      })
    }
    setShowModal(true)
  }

  function openEditModal(item, type) {
    setModalType(type)
    setEditingItem(item)
    if (type === 'scheme') {
      setSchemeForm({
        name: item.name || '',
        prefix: item.prefix || '',
        format: item.format || 'XXXX',
        numberingType: item.numberingType || 'sequential',
        startFrom: item.startFrom || 1,
        numberOfDigits: item.numberOfDigits || 4,
        isDefault: item.isDefault || false
      })
    } else {
      setLayoutForm({
        name: item.name || '',
        type: item.type || 'sale',
        paperSize: item.paperSize || 'A4',
        showLogo: item.showLogo !== false,
        showTax: item.showTax !== false,
        showDiscount: item.showDiscount !== false,
        showPaymentInfo: item.showPaymentInfo !== false,
        showShippingAddress: item.showShippingAddress !== false,
        showBarcode: item.showBarcode || false,
        showQRCode: item.showQRCode || false,
        headerText: item.headerText || '',
        footerText: item.footerText || '',
        termsAndConditions: item.termsAndConditions || '',
        isDefault: item.isDefault || false
      })
    }
    setShowModal(true)
  }

  function handleSaveScheme(e) {
    e.preventDefault()
    
    if (!schemeForm.name) {
      showMessage('error', 'Please enter scheme name')
      return
    }

    const payload = {
      ...schemeForm,
      startFrom: parseInt(schemeForm.startFrom) || 1,
      numberOfDigits: parseInt(schemeForm.numberOfDigits) || 4,
      invoiceCount: editingItem?.invoiceCount || 0
    }

    if (editingItem) {
      dispatch({
        type: 'UPDATE_INVOICE_SCHEME',
        payload: { ...payload, id: editingItem.id }
      })
      showMessage('success', 'Invoice scheme updated successfully')
    } else {
      dispatch({
        type: 'ADD_INVOICE_SCHEME',
        payload
      })
      showMessage('success', 'Invoice scheme added successfully')
    }

    setShowModal(false)
  }

  function handleSaveLayout(e) {
    e.preventDefault()
    
    if (!layoutForm.name) {
      showMessage('error', 'Please enter layout name')
      return
    }

    if (editingItem) {
      dispatch({
        type: 'UPDATE_INVOICE_LAYOUT',
        payload: { ...layoutForm, id: editingItem.id }
      })
      showMessage('success', 'Invoice layout updated successfully')
    } else {
      dispatch({
        type: 'ADD_INVOICE_LAYOUT',
        payload: layoutForm
      })
      showMessage('success', 'Invoice layout added successfully')
    }

    setShowModal(false)
  }

  function handleDelete(id, type) {
    const item = type === 'scheme' 
      ? invoiceSchemes.find(s => s.id === id)
      : invoiceLayouts.find(l => l.id === id)
    
    if (item?.isDefault) {
      showMessage('error', `Cannot delete default ${type}`)
      return
    }

    if (!confirm(`Are you sure you want to delete this invoice ${type}?`)) return

    dispatch({
      type: type === 'scheme' ? 'DELETE_INVOICE_SCHEME' : 'DELETE_INVOICE_LAYOUT',
      payload: id
    })
    showMessage('success', `Invoice ${type} deleted successfully`)
  }

  function handleSetDefault(id, type) {
    dispatch({
      type: type === 'scheme' ? 'SET_DEFAULT_INVOICE_SCHEME' : 'SET_DEFAULT_INVOICE_LAYOUT',
      payload: id
    })
    showMessage('success', `Default ${type} updated`)
  }

  function getPreviewNumber(scheme) {
    const num = (scheme.startFrom || 1).toString().padStart(scheme.numberOfDigits || 4, '0')
    const year = new Date().getFullYear()
    
    if (scheme.format === 'YYYY-XXXX') {
      return `${scheme.prefix || ''}${year}-${num}`
    }
    return `${scheme.prefix || ''}${num}`
  }

  // Toggle component
  const Toggle = ({ enabled, onChange, label }) => (
    <label className="flex items-center gap-3 cursor-pointer">
      <div className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-emerald-500' : 'bg-slate-600'}`}>
        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${enabled ? 'translate-x-5' : ''}`} />
      </div>
      <span className="text-slate-300">{label}</span>
      <input type="checkbox" className="sr-only" checked={enabled} onChange={onChange} />
    </label>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Invoice Settings</h1>
          <p className="text-slate-400 text-sm">Manage invoice schemes and layouts</p>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border border-emerald-500/30' 
            : 'bg-red-500/10 border border-red-500/30'
        }`}>
          <svg className={`w-5 h-5 ${message.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={message.type === 'success' ? "M5 13l4 4L19 7" : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
          </svg>
          <p className={message.type === 'success' ? 'text-emerald-400' : 'text-red-400'}>{message.text}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-700">
        <button
          onClick={() => { setActiveTab('schemes'); setSearchTerm('') }}
          className={`px-4 py-3 font-medium transition-colors relative ${
            activeTab === 'schemes' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          Invoice Schemes
          {activeTab === 'schemes' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400"></div>
          )}
        </button>
        <button
          onClick={() => { setActiveTab('layouts'); setSearchTerm('') }}
          className={`px-4 py-3 font-medium transition-colors relative ${
            activeTab === 'layouts' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          Invoice Layouts
          {activeTab === 'layouts' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400"></div>
          )}
        </button>
      </div>

      {/* Invoice Schemes Tab */}
      {activeTab === 'schemes' && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-white">All Invoice Schemes</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-48 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 pl-10"
                />
                <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button
                onClick={() => openAddModal('scheme')}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-cyan-600 transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-900/50">
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">
                    Name
                    <span className="ml-1 text-emerald-400 cursor-help" title="Scheme name for identification">ⓘ</span>
                  </th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Prefix</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">
                    Numbering Type
                    <span className="ml-1 text-emerald-400 cursor-help" title="Sequential or Random">ⓘ</span>
                  </th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">
                    Start From
                    <span className="ml-1 text-emerald-400 cursor-help" title="Starting number for invoices">ⓘ</span>
                  </th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">
                    Invoice Count
                    <span className="ml-1 text-emerald-400 cursor-help" title="Total invoices generated">ⓘ</span>
                  </th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">
                    Digits
                    <span className="ml-1 text-emerald-400 cursor-help" title="Number of digits">ⓘ</span>
                  </th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Preview</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchemes.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-12 text-slate-500">
                      <svg className="w-12 h-12 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-lg font-medium">No invoice schemes found</p>
                      <p className="text-sm">Click "Add" to create your first scheme</p>
                    </td>
                  </tr>
                ) : (
                  filteredSchemes.map(scheme => (
                    <tr key={scheme.id} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{scheme.name}</span>
                          {scheme.isDefault && (
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-mono">{scheme.prefix || '-'}</td>
                      <td className="px-4 py-3 text-slate-300 capitalize">{scheme.numberingType}</td>
                      <td className="px-4 py-3 text-slate-300">{scheme.startFrom}</td>
                      <td className="px-4 py-3 text-slate-300">{scheme.invoiceCount || 0}</td>
                      <td className="px-4 py-3 text-slate-300">{scheme.numberOfDigits}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-sm rounded font-mono">
                          {getPreviewNumber(scheme)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(scheme, 'scheme')}
                            className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
                          >
                            Edit
                          </button>
                          {!scheme.isDefault && (
                            <>
                              <button
                                onClick={() => handleSetDefault(scheme.id, 'scheme')}
                                className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm hover:bg-emerald-500/30 transition-colors"
                              >
                                Set Default
                              </button>
                              <button
                                onClick={() => handleDelete(scheme.id, 'scheme')}
                                className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredSchemes.length > 0 && (
            <div className="p-4 border-t border-slate-700/50 text-slate-400 text-sm">
              Showing {filteredSchemes.length} of {invoiceSchemes.length} entries
            </div>
          )}
        </div>
      )}

      {/* Invoice Layouts Tab */}
      {activeTab === 'layouts' && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-white">All Invoice Layouts</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-48 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 pl-10"
                />
                <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button
                onClick={() => openAddModal('layout')}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-cyan-600 transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-900/50">
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Name</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Type</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Paper Size</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Features</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredLayouts.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-slate-500">
                      <svg className="w-12 h-12 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                      </svg>
                      <p className="text-lg font-medium">No invoice layouts found</p>
                      <p className="text-sm">Click "Add" to create your first layout</p>
                    </td>
                  </tr>
                ) : (
                  filteredLayouts.map(layout => (
                    <tr key={layout.id} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{layout.name}</span>
                          {layout.isDefault && (
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          layout.type === 'sale' ? 'bg-blue-500/20 text-blue-400' :
                          layout.type === 'pos' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-orange-500/20 text-orange-400'
                        }`}>
                          {layout.type === 'sale' ? 'Sale Invoice' : 
                           layout.type === 'pos' ? 'POS Receipt' : 'Quotation'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{layout.paperSize || 'A4'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {layout.showLogo && <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">Logo</span>}
                          {layout.showTax && <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">Tax</span>}
                          {layout.showDiscount && <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">Discount</span>}
                          {layout.showBarcode && <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">Barcode</span>}
                          {layout.showQRCode && <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">QR</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(layout, 'layout')}
                            className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
                          >
                            Edit
                          </button>
                          {!layout.isDefault && (
                            <>
                              <button
                                onClick={() => handleSetDefault(layout.id, 'layout')}
                                className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm hover:bg-emerald-500/30 transition-colors"
                              >
                                Set Default
                              </button>
                              <button
                                onClick={() => handleDelete(layout.id, 'layout')}
                                className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredLayouts.length > 0 && (
            <div className="p-4 border-t border-slate-700/50 text-slate-400 text-sm">
              Showing {filteredLayouts.length} of {invoiceLayouts.length} entries
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800 z-10">
              <h2 className="text-xl font-bold text-white">
                {editingItem ? 'Edit' : 'Add New'} {modalType === 'scheme' ? 'Invoice Scheme' : 'Invoice Layout'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {modalType === 'scheme' ? (
              /* Invoice Scheme Form */
              <form onSubmit={handleSaveScheme} className="p-6 space-y-4">
                {/* Format Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">Format</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSchemeForm(prev => ({ ...prev, format: 'XXXX' }))}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        schemeForm.format === 'XXXX'
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="text-white font-medium">FORMAT:</div>
                      <div className="text-emerald-400 font-bold text-lg">XXXX</div>
                      <div className="text-slate-500 text-xs mt-1">e.g., 0001, 0002</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSchemeForm(prev => ({ ...prev, format: 'YYYY-XXXX' }))}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        schemeForm.format === 'YYYY-XXXX'
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="text-white font-medium">FORMAT:</div>
                      <div className="text-emerald-400 font-bold text-lg">2026-XXXX</div>
                      <div className="text-slate-500 text-xs mt-1">e.g., 2026-0001</div>
                    </button>
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-slate-900/50 rounded-lg p-4 flex items-center justify-between">
                  <span className="text-slate-400">Preview:</span>
                  <span className="text-emerald-400 font-bold font-mono text-lg">{getPreviewNumber(schemeForm)}</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={schemeForm.name}
                    onChange={(e) => setSchemeForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g., Default, Yearly"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Prefix</label>
                  <input
                    type="text"
                    value={schemeForm.prefix}
                    onChange={(e) => setSchemeForm(prev => ({ ...prev, prefix: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g., INV-, BILL-"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Numbering Type <span className="text-red-400">*</span>
                    <span className="ml-1 text-emerald-400 cursor-help" title="Sequential: 1,2,3... Random: Random numbers">ⓘ</span>
                  </label>
                  <select
                    value={schemeForm.numberingType}
                    onChange={(e) => setSchemeForm(prev => ({ ...prev, numberingType: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="sequential">Sequential</option>
                    <option value="random">Aleatory/Random</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Start From</label>
                    <input
                      type="number"
                      value={schemeForm.startFrom}
                      onChange={(e) => setSchemeForm(prev => ({ ...prev, startFrom: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Number of Digits</label>
                    <input
                      type="number"
                      value={schemeForm.numberOfDigits}
                      onChange={(e) => setSchemeForm(prev => ({ ...prev, numberOfDigits: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      min="1"
                      max="10"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all"
                  >
                    Save
                  </button>
                </div>
              </form>
            ) : (
              /* Invoice Layout Form */
              <form onSubmit={handleSaveLayout} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={layoutForm.name}
                    onChange={(e) => setLayoutForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g., Default Layout"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
                    <select
                      value={layoutForm.type}
                      onChange={(e) => setLayoutForm(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="sale">Sale Invoice</option>
                      <option value="pos">POS Receipt</option>
                      <option value="quotation">Quotation</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Paper Size</label>
                    <select
                      value={layoutForm.paperSize}
                      onChange={(e) => setLayoutForm(prev => ({ ...prev, paperSize: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="A4">A4</option>
                      <option value="A5">A5</option>
                      <option value="Letter">Letter</option>
                      <option value="Thermal">Thermal (80mm)</option>
                    </select>
                  </div>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-4 space-y-3">
                  <h3 className="text-white font-medium mb-3">Display Options</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Toggle enabled={layoutForm.showLogo} onChange={() => setLayoutForm(prev => ({ ...prev, showLogo: !prev.showLogo }))} label="Show Logo" />
                    <Toggle enabled={layoutForm.showTax} onChange={() => setLayoutForm(prev => ({ ...prev, showTax: !prev.showTax }))} label="Show Tax" />
                    <Toggle enabled={layoutForm.showDiscount} onChange={() => setLayoutForm(prev => ({ ...prev, showDiscount: !prev.showDiscount }))} label="Show Discount" />
                    <Toggle enabled={layoutForm.showPaymentInfo} onChange={() => setLayoutForm(prev => ({ ...prev, showPaymentInfo: !prev.showPaymentInfo }))} label="Payment Info" />
                    <Toggle enabled={layoutForm.showShippingAddress} onChange={() => setLayoutForm(prev => ({ ...prev, showShippingAddress: !prev.showShippingAddress }))} label="Shipping Address" />
                    <Toggle enabled={layoutForm.showBarcode} onChange={() => setLayoutForm(prev => ({ ...prev, showBarcode: !prev.showBarcode }))} label="Show Barcode" />
                    <Toggle enabled={layoutForm.showQRCode} onChange={() => setLayoutForm(prev => ({ ...prev, showQRCode: !prev.showQRCode }))} label="Show QR Code" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Header Text</label>
                  <input
                    type="text"
                    value={layoutForm.headerText}
                    onChange={(e) => setLayoutForm(prev => ({ ...prev, headerText: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Text to display in header"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Footer Text</label>
                  <input
                    type="text"
                    value={layoutForm.footerText}
                    onChange={(e) => setLayoutForm(prev => ({ ...prev, footerText: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g., Thank you for your business!"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Terms & Conditions</label>
                  <textarea
                    value={layoutForm.termsAndConditions}
                    onChange={(e) => setLayoutForm(prev => ({ ...prev, termsAndConditions: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 resize-none"
                    placeholder="Enter terms and conditions..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all"
                  >
                    Save
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}