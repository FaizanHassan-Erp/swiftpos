import { useState } from 'react'
import { useApp } from '../Context/AppContext'

export default function BarcodeSettings() {
  const { state, dispatch } = useApp()
  const { barcodeSettings = [] } = state

  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })
  const [previewMode, setPreviewMode] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    // Paper Settings
    paperWidth: 210,
    paperHeight: 297,
    // Sticker Settings
    stickerWidth: 50,
    stickerHeight: 25,
    paperStickerGapWidth: 2,
    paperStickerGapHeight: 2,
    stickersInOneRow: 4,
    rowsPerPage: 10,
    topMargin: 10,
    leftMargin: 5,
    rowDistance: 2,
    // Barcode Settings
    showBusinessName: true,
    showProductName: true,
    showProductVariation: false,
    showPrice: true,
    showProductSKU: true,
    showBarcode: true,
    barcodeType: 'C128',
    isDefault: false,
    isActive: true
  })

  const barcodeTypes = [
    { value: 'C128', label: 'Code 128' },
    { value: 'C39', label: 'Code 39' },
    { value: 'EAN13', label: 'EAN-13' },
    { value: 'EAN8', label: 'EAN-8' },
    { value: 'UPCA', label: 'UPC-A' },
    { value: 'UPCE', label: 'UPC-E' },
    { value: 'QR', label: 'QR Code' }
  ]

  const paperSizes = [
    { name: 'A4', width: 210, height: 297 },
    { name: 'A5', width: 148, height: 210 },
    { name: 'Letter', width: 216, height: 279 },
    { name: 'Legal', width: 216, height: 356 },
    { name: 'Custom', width: 0, height: 0 }
  ]

  // Filter settings
  const filteredSettings = barcodeSettings.filter(setting =>
    setting.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  function showMessage(type, text) {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  function openAddModal() {
    setEditingItem(null)
    setFormData({
      name: '',
      description: '',
      paperWidth: 210,
      paperHeight: 297,
      stickerWidth: 50,
      stickerHeight: 25,
      paperStickerGapWidth: 2,
      paperStickerGapHeight: 2,
      stickersInOneRow: 4,
      rowsPerPage: 10,
      topMargin: 10,
      leftMargin: 5,
      rowDistance: 2,
      showBusinessName: true,
      showProductName: true,
      showProductVariation: false,
      showPrice: true,
      showProductSKU: true,
      showBarcode: true,
      barcodeType: 'C128',
      isDefault: barcodeSettings.length === 0,
      isActive: true
    })
    setShowModal(true)
  }

  function openEditModal(item) {
    setEditingItem(item)
    setFormData({
      name: item.name || '',
      description: item.description || '',
      paperWidth: item.paperWidth || 210,
      paperHeight: item.paperHeight || 297,
      stickerWidth: item.stickerWidth || 50,
      stickerHeight: item.stickerHeight || 25,
      paperStickerGapWidth: item.paperStickerGapWidth || 2,
      paperStickerGapHeight: item.paperStickerGapHeight || 2,
      stickersInOneRow: item.stickersInOneRow || 4,
      rowsPerPage: item.rowsPerPage || 10,
      topMargin: item.topMargin || 10,
      leftMargin: item.leftMargin || 5,
      rowDistance: item.rowDistance || 2,
      showBusinessName: item.showBusinessName !== false,
      showProductName: item.showProductName !== false,
      showProductVariation: item.showProductVariation || false,
      showPrice: item.showPrice !== false,
      showProductSKU: item.showProductSKU !== false,
      showBarcode: item.showBarcode !== false,
      barcodeType: item.barcodeType || 'C128',
      isDefault: item.isDefault || false,
      isActive: item.isActive !== false
    })
    setShowModal(true)
  }

  function handleSave(e) {
    e.preventDefault()
    
    if (!formData.name) {
      showMessage('error', 'Please enter a name')
      return
    }

    if (editingItem) {
      dispatch({
        type: 'UPDATE_BARCODE_SETTING',
        payload: { ...formData, id: editingItem.id }
      })
      showMessage('success', 'Barcode setting updated successfully')
    } else {
      dispatch({
        type: 'ADD_BARCODE_SETTING',
        payload: formData
      })
      showMessage('success', 'Barcode setting added successfully')
    }

    setShowModal(false)
  }

  function handleDelete(id) {
    const item = barcodeSettings.find(s => s.id === id)
    
    if (item?.isDefault) {
      showMessage('error', 'Cannot delete default setting')
      return
    }

    if (!confirm('Are you sure you want to delete this barcode setting?')) return

    dispatch({
      type: 'DELETE_BARCODE_SETTING',
      payload: id
    })
    showMessage('success', 'Barcode setting deleted successfully')
  }

  function handleSetDefault(id) {
    dispatch({
      type: 'SET_DEFAULT_BARCODE_SETTING',
      payload: id
    })
    showMessage('success', 'Default setting updated')
  }

  function handleChange(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  function handlePaperSizeChange(sizeName) {
    const size = paperSizes.find(s => s.name === sizeName)
    if (size && size.name !== 'Custom') {
      setFormData(prev => ({
        ...prev,
        paperWidth: size.width,
        paperHeight: size.height
      }))
    }
  }

  function calculateTotalStickers() {
    return formData.stickersInOneRow * formData.rowsPerPage
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
          <h1 className="text-2xl font-bold text-white">Barcode Settings</h1>
          <p className="text-slate-400 text-sm">Configure barcode sticker sheet settings for label printing</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-cyan-600 transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Setting
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

      {/* Info Card */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
        <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="text-blue-400 font-medium">About Barcode Settings</p>
          <p className="text-slate-400 text-sm mt-1">
            Configure sticker sheet layouts for printing product barcodes. Define paper size, sticker dimensions, 
            and what information to display on each label (business name, product name, price, SKU, barcode).
          </p>
        </div>
      </div>

      {/* Settings Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">All Barcode Sticker Settings</h2>
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
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-900/50">
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Name</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Paper Size</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Sticker Size</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Stickers/Row</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Rows/Page</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Total</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Barcode Type</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSettings.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-500">
                    <svg className="w-12 h-12 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    <p className="text-lg font-medium">No barcode settings found</p>
                    <p className="text-sm">Click "Add Setting" to create a sticker configuration</p>
                  </td>
                </tr>
              ) : (
                filteredSettings.map(setting => (
                  <tr key={setting.id} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{setting.name}</span>
                        {setting.isDefault && (
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      {setting.description && (
                        <p className="text-slate-500 text-xs mt-0.5">{setting.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{setting.paperWidth} x {setting.paperHeight} mm</td>
                    <td className="px-4 py-3 text-slate-300">{setting.stickerWidth} x {setting.stickerHeight} mm</td>
                    <td className="px-4 py-3 text-slate-300">{setting.stickersInOneRow}</td>
                    <td className="px-4 py-3 text-slate-300">{setting.rowsPerPage}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-sm rounded">
                        {setting.stickersInOneRow * setting.rowsPerPage}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {barcodeTypes.find(b => b.value === setting.barcodeType)?.label || setting.barcodeType}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(setting)}
                          className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
                        >
                          Edit
                        </button>
                        {!setting.isDefault && (
                          <>
                            <button
                              onClick={() => handleSetDefault(setting.id)}
                              className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm hover:bg-emerald-500/30 transition-colors"
                            >
                              Set Default
                            </button>
                            <button
                              onClick={() => handleDelete(setting.id)}
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

        {filteredSettings.length > 0 && (
          <div className="p-4 border-t border-slate-700/50 text-slate-400 text-sm">
            Showing {filteredSettings.length} of {barcodeSettings.length} settings
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800 z-10">
              <h2 className="text-xl font-bold text-white">
                {editingItem ? 'Edit Barcode Setting' : 'Add New Barcode Setting'}
              </h2>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    previewMode 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {previewMode ? 'Hide Preview' : 'Show Preview'}
                </button>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSave} className="p-6">
              <div className={`grid ${previewMode ? 'grid-cols-1 lg:grid-cols-2 gap-6' : 'grid-cols-1'}`}>
                {/* Form Fields */}
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleChange('name', e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                          placeholder="e.g., A4 4x10 Layout"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                        <input
                          type="text"
                          value={formData.description}
                          onChange={(e) => handleChange('description', e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                          placeholder="Brief description"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Paper Size */}
                  <div>
                    <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Paper Size (mm)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Preset</label>
                        <select
                          onChange={(e) => handlePaperSizeChange(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                        >
                          {paperSizes.map(size => (
                            <option key={size.name} value={size.name}>
                              {size.name} {size.width > 0 ? `(${size.width}x${size.height})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Width</label>
                        <input
                          type="number"
                          value={formData.paperWidth}
                          onChange={(e) => handleChange('paperWidth', parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Height</label>
                        <input
                          type="number"
                          value={formData.paperHeight}
                          onChange={(e) => handleChange('paperHeight', parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sticker Size */}
                  <div>
                    <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                      Sticker Size (mm)
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Width</label>
                        <input
                          type="number"
                          value={formData.stickerWidth}
                          onChange={(e) => handleChange('stickerWidth', parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Height</label>
                        <input
                          type="number"
                          value={formData.stickerHeight}
                          onChange={(e) => handleChange('stickerHeight', parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Stickers/Row</label>
                        <input
                          type="number"
                          value={formData.stickersInOneRow}
                          onChange={(e) => handleChange('stickersInOneRow', parseInt(e.target.value) || 1)}
                          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Rows/Page</label>
                        <input
                          type="number"
                          value={formData.rowsPerPage}
                          onChange={(e) => handleChange('rowsPerPage', parseInt(e.target.value) || 1)}
                          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                          min="1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Margins & Gaps */}
                  <div>
                    <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                      </svg>
                      Margins & Gaps (mm)
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Top Margin</label>
                        <input
                          type="number"
                          value={formData.topMargin}
                          onChange={(e) => handleChange('topMargin', parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Left Margin</label>
                        <input
                          type="number"
                          value={formData.leftMargin}
                          onChange={(e) => handleChange('leftMargin', parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Column Gap</label>
                        <input
                          type="number"
                          value={formData.paperStickerGapWidth}
                          onChange={(e) => handleChange('paperStickerGapWidth', parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Row Gap</label>
                        <input
                          type="number"
                          value={formData.rowDistance}
                          onChange={(e) => handleChange('rowDistance', parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Barcode Settings */}
                  <div>
                    <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                      Barcode Settings
                    </h3>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-300 mb-2">Barcode Type</label>
                      <select
                        value={formData.barcodeType}
                        onChange={(e) => handleChange('barcodeType', e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      >
                        {barcodeTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Display Options */}
                  <div>
                    <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Display Options
                    </h3>
                    <div className="bg-slate-900/50 rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <Toggle 
                          enabled={formData.showBusinessName} 
                          onChange={() => handleChange('showBusinessName', !formData.showBusinessName)} 
                          label="Business Name" 
                        />
                        <Toggle 
                          enabled={formData.showProductName} 
                          onChange={() => handleChange('showProductName', !formData.showProductName)} 
                          label="Product Name" 
                        />
                        <Toggle 
                          enabled={formData.showProductVariation} 
                          onChange={() => handleChange('showProductVariation', !formData.showProductVariation)} 
                          label="Product Variation" 
                        />
                        <Toggle 
                          enabled={formData.showPrice} 
                          onChange={() => handleChange('showPrice', !formData.showPrice)} 
                          label="Price" 
                        />
                        <Toggle 
                          enabled={formData.showProductSKU} 
                          onChange={() => handleChange('showProductSKU', !formData.showProductSKU)} 
                          label="Product SKU" 
                        />
                        <Toggle 
                          enabled={formData.showBarcode} 
                          onChange={() => handleChange('showBarcode', !formData.showBarcode)} 
                          label="Barcode" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400 font-medium">Total Stickers per Page:</span>
                      <span className="text-emerald-400 font-bold text-xl">{calculateTotalStickers()}</span>
                    </div>
                  </div>
                </div>

                {/* Preview */}
                {previewMode && (
                  <div className="bg-white rounded-lg p-4 flex items-center justify-center">
                    <div 
                      className="border-2 border-dashed border-slate-300 relative"
                      style={{
                        width: `${Math.min(formData.paperWidth, 200)}px`,
                        height: `${Math.min(formData.paperHeight, 280)}px`,
                      }}
                    >
                      <div 
                        className="absolute grid"
                        style={{
                          top: `${formData.topMargin * 0.5}px`,
                          left: `${formData.leftMargin * 0.5}px`,
                          gap: `${formData.rowDistance * 0.5}px ${formData.paperStickerGapWidth * 0.5}px`,
                          gridTemplateColumns: `repeat(${formData.stickersInOneRow}, ${formData.stickerWidth * 0.5}px)`,
                        }}
                      >
                        {Array.from({ length: Math.min(calculateTotalStickers(), 40) }).map((_, i) => (
                          <div 
                            key={i}
                            className="bg-slate-100 border border-slate-300 rounded flex flex-col items-center justify-center text-[6px] text-slate-600 overflow-hidden p-0.5"
                            style={{
                              width: `${formData.stickerWidth * 0.5}px`,
                              height: `${formData.stickerHeight * 0.5}px`,
                            }}
                          >
                            {formData.showBusinessName && <div className="font-bold truncate w-full text-center">Business</div>}
                            {formData.showProductName && <div className="truncate w-full text-center">Product</div>}
                            {formData.showPrice && <div>Rs 100</div>}
                            {formData.showBarcode && (
                              <div className="flex gap-px mt-0.5">
                                {Array.from({ length: 8 }).map((_, j) => (
                                  <div key={j} className={`w-px h-2 ${j % 2 === 0 ? 'bg-black' : 'bg-white'}`}></div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-700">
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
                  {editingItem ? 'Update Setting' : 'Add Setting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}