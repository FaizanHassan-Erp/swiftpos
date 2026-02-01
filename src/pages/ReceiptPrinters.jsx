import { useState } from 'react'
import { useApp } from '../context/AppContext'

export default function ReceiptPrinters() {
  const { state, dispatch } = useApp()
  const { receiptPrinters = [] } = state

  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })
  const [testingPrinter, setTestingPrinter] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    connectionType: 'network', // 'network', 'usb', 'bluetooth'
    ipAddress: '',
    port: '9100',
    characterPerLine: 42,
    paperWidth: '80', // '58', '80'
    location: '',
    // Print Settings
    printSaleReceipt: true,
    printKitchenOrder: false,
    printQuotation: false,
    autoPrint: false,
    numberOfCopies: 1,
    // Receipt Content
    showLogo: true,
    showBusinessName: true,
    showBusinessAddress: true,
    showBusinessPhone: true,
    showTaxNumber: false,
    showCustomerInfo: true,
    showPaymentInfo: true,
    showBarcode: false,
    showQRCode: false,
    headerText: '',
    footerText: 'Thank you for your business!',
    isDefault: false,
    isActive: true
  })

  const connectionTypes = [
    { value: 'network', label: 'Network (IP)', icon: 'wifi' },
    { value: 'usb', label: 'USB', icon: 'usb' },
    { value: 'bluetooth', label: 'Bluetooth', icon: 'bluetooth' }
  ]

  const paperWidths = [
    { value: '58', label: '58mm (2 inch)' },
    { value: '80', label: '80mm (3 inch)' }
  ]

  // Filter printers
  const filteredPrinters = receiptPrinters.filter(printer =>
    printer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    printer.ipAddress?.includes(searchTerm)
  )

  function showMessage(type, text) {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  function openAddModal() {
    setEditingItem(null)
    setFormData({
      name: '',
      connectionType: 'network',
      ipAddress: '',
      port: '9100',
      characterPerLine: 42,
      paperWidth: '80',
      location: '',
      printSaleReceipt: true,
      printKitchenOrder: false,
      printQuotation: false,
      autoPrint: false,
      numberOfCopies: 1,
      showLogo: true,
      showBusinessName: true,
      showBusinessAddress: true,
      showBusinessPhone: true,
      showTaxNumber: false,
      showCustomerInfo: true,
      showPaymentInfo: true,
      showBarcode: false,
      showQRCode: false,
      headerText: '',
      footerText: 'Thank you for your business!',
      isDefault: receiptPrinters.length === 0,
      isActive: true
    })
    setShowModal(true)
  }

  function openEditModal(printer) {
    setEditingItem(printer)
    setFormData({
      name: printer.name || '',
      connectionType: printer.connectionType || 'network',
      ipAddress: printer.ipAddress || '',
      port: printer.port || '9100',
      characterPerLine: printer.characterPerLine || 42,
      paperWidth: printer.paperWidth || '80',
      location: printer.location || '',
      printSaleReceipt: printer.printSaleReceipt !== false,
      printKitchenOrder: printer.printKitchenOrder || false,
      printQuotation: printer.printQuotation || false,
      autoPrint: printer.autoPrint || false,
      numberOfCopies: printer.numberOfCopies || 1,
      showLogo: printer.showLogo !== false,
      showBusinessName: printer.showBusinessName !== false,
      showBusinessAddress: printer.showBusinessAddress !== false,
      showBusinessPhone: printer.showBusinessPhone !== false,
      showTaxNumber: printer.showTaxNumber || false,
      showCustomerInfo: printer.showCustomerInfo !== false,
      showPaymentInfo: printer.showPaymentInfo !== false,
      showBarcode: printer.showBarcode || false,
      showQRCode: printer.showQRCode || false,
      headerText: printer.headerText || '',
      footerText: printer.footerText || 'Thank you for your business!',
      isDefault: printer.isDefault || false,
      isActive: printer.isActive !== false
    })
    setShowModal(true)
  }

  function handleSave(e) {
    e.preventDefault()
    
    if (!formData.name) {
      showMessage('error', 'Please enter printer name')
      return
    }

    if (formData.connectionType === 'network' && !formData.ipAddress) {
      showMessage('error', 'Please enter IP address for network printer')
      return
    }

    if (editingItem) {
      dispatch({
        type: 'UPDATE_RECEIPT_PRINTER',
        payload: { ...formData, id: editingItem.id }
      })
      showMessage('success', 'Printer updated successfully')
    } else {
      dispatch({
        type: 'ADD_RECEIPT_PRINTER',
        payload: formData
      })
      showMessage('success', 'Printer added successfully')
    }

    setShowModal(false)
  }

  function handleDelete(id) {
    const printer = receiptPrinters.find(p => p.id === id)
    
    if (printer?.isDefault) {
      showMessage('error', 'Cannot delete default printer')
      return
    }

    if (!confirm('Are you sure you want to delete this printer?')) return

    dispatch({
      type: 'DELETE_RECEIPT_PRINTER',
      payload: id
    })
    showMessage('success', 'Printer deleted successfully')
  }

  function handleSetDefault(id) {
    dispatch({
      type: 'SET_DEFAULT_RECEIPT_PRINTER',
      payload: id
    })
    showMessage('success', 'Default printer updated')
  }

  function handleToggleStatus(id) {
    const printer = receiptPrinters.find(p => p.id === id)
    
    if (printer?.isDefault && printer?.isActive) {
      showMessage('error', 'Cannot deactivate default printer')
      return
    }

    dispatch({
      type: 'TOGGLE_RECEIPT_PRINTER_STATUS',
      payload: id
    })
  }

  function handleTestPrint(printer) {
    setTestingPrinter(printer.id)
    
    // Simulate test print
    setTimeout(() => {
      setTestingPrinter(null)
      showMessage('success', `Test page sent to ${printer.name}`)
    }, 2000)
  }

  function handleChange(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }))
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

  // Connection type icon
  const ConnectionIcon = ({ type }) => {
    if (type === 'network') {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        </svg>
      )
    }
    if (type === 'usb') {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18v-3m0-3V9m0 0V6m0 3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Receipt Printers</h1>
          <p className="text-slate-400 text-sm">Configure thermal receipt printers for your POS</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-cyan-600 transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Printer
        </button>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{receiptPrinters.length}</p>
              <p className="text-slate-400 text-sm">Total Printers</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{receiptPrinters.filter(p => p.isActive !== false).length}</p>
              <p className="text-slate-400 text-sm">Active</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{receiptPrinters.filter(p => p.connectionType === 'network').length}</p>
              <p className="text-slate-400 text-sm">Network</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-white truncate max-w-[120px]">
                {receiptPrinters.find(p => p.isDefault)?.name || 'None'}
              </p>
              <p className="text-slate-400 text-sm">Default</p>
            </div>
          </div>
        </div>
      </div>

      {/* Printers Grid */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">All Printers</h2>
          <div className="relative">
            <input
              type="text"
              placeholder="Search printers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 pl-10"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {filteredPrinters.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <p className="text-lg font-medium">No printers configured</p>
            <p className="text-sm">Click "Add Printer" to configure your first receipt printer</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {filteredPrinters.map(printer => (
              <div 
                key={printer.id} 
                className={`bg-slate-900/50 border rounded-xl p-4 transition-all ${
                  printer.isActive !== false ? 'border-slate-700' : 'border-red-500/30 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      printer.connectionType === 'network' ? 'bg-purple-500/20 text-purple-400' :
                      printer.connectionType === 'usb' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-cyan-500/20 text-cyan-400'
                    }`}>
                      <ConnectionIcon type={printer.connectionType} />
                    </div>
                    <div>
                      <h3 className="text-white font-medium flex items-center gap-2">
                        {printer.name}
                        {printer.isDefault && (
                          <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">
                            Default
                          </span>
                        )}
                      </h3>
                      <p className="text-slate-500 text-sm capitalize">{printer.connectionType}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleStatus(printer.id)}
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      printer.isActive !== false
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {printer.isActive !== false ? 'Active' : 'Inactive'}
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  {printer.connectionType === 'network' && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-500">IP:</span>
                      <span className="text-slate-300 font-mono">{printer.ipAddress}:{printer.port}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500">Paper:</span>
                    <span className="text-slate-300">{printer.paperWidth}mm</span>
                  </div>
                  {printer.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-500">Location:</span>
                      <span className="text-slate-300">{printer.location}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {printer.printSaleReceipt && (
                    <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">Sales</span>
                  )}
                  {printer.printKitchenOrder && (
                    <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">Kitchen</span>
                  )}
                  {printer.printQuotation && (
                    <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">Quotation</span>
                  )}
                  {printer.autoPrint && (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded">Auto</span>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-700">
                  <button
                    onClick={() => handleTestPrint(printer)}
                    disabled={testingPrinter === printer.id}
                    className="flex-1 px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {testingPrinter === printer.id ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        Testing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Test
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => openEditModal(printer)}
                    className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
                  >
                    Edit
                  </button>
                  {!printer.isDefault && (
                    <button
                      onClick={() => handleDelete(printer.id)}
                      className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800 z-10">
              <h2 className="text-xl font-bold text-white">
                {editingItem ? 'Edit Printer' : 'Add New Printer'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Printer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Printer Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      placeholder="e.g., Main Receipt Printer"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleChange('location', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      placeholder="e.g., Counter 1, Kitchen"
                    />
                  </div>
                </div>
              </div>

              {/* Connection Settings */}
              <div>
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0" />
                  </svg>
                  Connection Settings
                </h3>
                
                {/* Connection Type Selection */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {connectionTypes.map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleChange('connectionType', type.value)}
                      className={`p-3 rounded-lg border-2 transition-colors flex flex-col items-center gap-2 ${
                        formData.connectionType === type.value
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <ConnectionIcon type={type.value} />
                      <span className={`text-sm ${formData.connectionType === type.value ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {type.label}
                      </span>
                    </button>
                  ))}
                </div>

                {formData.connectionType === 'network' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        IP Address <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.ipAddress}
                        onChange={(e) => handleChange('ipAddress', e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 font-mono"
                        placeholder="192.168.1.100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Port</label>
                      <input
                        type="text"
                        value={formData.port}
                        onChange={(e) => handleChange('port', e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 font-mono"
                        placeholder="9100"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Paper Settings */}
              <div>
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Paper Settings
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Paper Width</label>
                    <select
                      value={formData.paperWidth}
                      onChange={(e) => handleChange('paperWidth', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    >
                      {paperWidths.map(pw => (
                        <option key={pw.value} value={pw.value}>{pw.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Characters Per Line</label>
                    <input
                      type="number"
                      value={formData.characterPerLine}
                      onChange={(e) => handleChange('characterPerLine', parseInt(e.target.value) || 42)}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Print Options */}
              <div>
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  </svg>
                  Print Options
                </h3>
                <div className="bg-slate-900/50 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <Toggle enabled={formData.printSaleReceipt} onChange={() => handleChange('printSaleReceipt', !formData.printSaleReceipt)} label="Sale Receipts" />
                    <Toggle enabled={formData.printKitchenOrder} onChange={() => handleChange('printKitchenOrder', !formData.printKitchenOrder)} label="Kitchen Orders" />
                    <Toggle enabled={formData.printQuotation} onChange={() => handleChange('printQuotation', !formData.printQuotation)} label="Quotations" />
                    <Toggle enabled={formData.autoPrint} onChange={() => handleChange('autoPrint', !formData.autoPrint)} label="Auto Print" />
                  </div>
                  <div className="pt-3">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Number of Copies</label>
                    <input
                      type="number"
                      value={formData.numberOfCopies}
                      onChange={(e) => handleChange('numberOfCopies', parseInt(e.target.value) || 1)}
                      className="w-32 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      min="1"
                      max="5"
                    />
                  </div>
                </div>
              </div>

              {/* Receipt Content */}
              <div>
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Receipt Content
                </h3>
                <div className="bg-slate-900/50 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <Toggle enabled={formData.showLogo} onChange={() => handleChange('showLogo', !formData.showLogo)} label="Business Logo" />
                    <Toggle enabled={formData.showBusinessName} onChange={() => handleChange('showBusinessName', !formData.showBusinessName)} label="Business Name" />
                    <Toggle enabled={formData.showBusinessAddress} onChange={() => handleChange('showBusinessAddress', !formData.showBusinessAddress)} label="Business Address" />
                    <Toggle enabled={formData.showBusinessPhone} onChange={() => handleChange('showBusinessPhone', !formData.showBusinessPhone)} label="Business Phone" />
                    <Toggle enabled={formData.showTaxNumber} onChange={() => handleChange('showTaxNumber', !formData.showTaxNumber)} label="Tax Number" />
                    <Toggle enabled={formData.showCustomerInfo} onChange={() => handleChange('showCustomerInfo', !formData.showCustomerInfo)} label="Customer Info" />
                    <Toggle enabled={formData.showPaymentInfo} onChange={() => handleChange('showPaymentInfo', !formData.showPaymentInfo)} label="Payment Info" />
                    <Toggle enabled={formData.showBarcode} onChange={() => handleChange('showBarcode', !formData.showBarcode)} label="Barcode" />
                    <Toggle enabled={formData.showQRCode} onChange={() => handleChange('showQRCode', !formData.showQRCode)} label="QR Code" />
                  </div>
                </div>
              </div>

              {/* Header/Footer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Header Text</label>
                  <textarea
                    value={formData.headerText}
                    onChange={(e) => handleChange('headerText', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 resize-none"
                    rows={2}
                    placeholder="Text to show at top of receipt"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Footer Text</label>
                  <textarea
                    value={formData.footerText}
                    onChange={(e) => handleChange('footerText', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 resize-none"
                    rows={2}
                    placeholder="Text to show at bottom of receipt"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all"
                >
                  {editingItem ? 'Update Printer' : 'Add Printer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}