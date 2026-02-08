import { useState } from 'react'
import { useApp } from '../Context/AppContext'

export default function TaxRates() {
  const { state, dispatch } = useApp()
  const { taxRates = [], taxGroups = [] } = state

  const [activeTab, setActiveTab] = useState('rates')
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('rate') // 'rate' or 'group'
  const [editingItem, setEditingItem] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })

  // Form state for tax rate
  const [rateForm, setRateForm] = useState({
    name: '',
    rate: '',
    forTaxGroupOnly: false
  })

  // Form state for tax group
  const [groupForm, setGroupForm] = useState({
    name: '',
    subTaxes: []
  })

  // Filter tax rates
  const filteredRates = taxRates.filter(tax =>
    tax.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Filter tax groups
  const filteredGroups = taxGroups.filter(group =>
    group.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  function showMessage(type, text) {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  function openAddModal(type) {
    setModalType(type)
    setEditingItem(null)
    if (type === 'rate') {
      setRateForm({ name: '', rate: '', forTaxGroupOnly: false })
    } else {
      setGroupForm({ name: '', subTaxes: [] })
    }
    setShowModal(true)
  }

  function openEditModal(item, type) {
    setModalType(type)
    setEditingItem(item)
    if (type === 'rate') {
      setRateForm({
        name: item.name,
        rate: item.rate,
        forTaxGroupOnly: item.forTaxGroupOnly || false
      })
    } else {
      setGroupForm({
        name: item.name,
        subTaxes: item.subTaxes || []
      })
    }
    setShowModal(true)
  }

  function handleSaveRate(e) {
    e.preventDefault()
    
    if (!rateForm.name || rateForm.rate === '') {
      showMessage('error', 'Please fill all required fields')
      return
    }

    const payload = {
      ...rateForm,
      rate: parseFloat(rateForm.rate)
    }

    if (editingItem) {
      dispatch({
        type: 'UPDATE_TAX_RATE',
        payload: { ...payload, id: editingItem.id }
      })
      showMessage('success', 'Tax rate updated successfully')
    } else {
      dispatch({
        type: 'ADD_TAX_RATE',
        payload
      })
      showMessage('success', 'Tax rate added successfully')
    }

    setShowModal(false)
  }

  function handleSaveGroup(e) {
    e.preventDefault()
    
    if (!groupForm.name || groupForm.subTaxes.length === 0) {
      showMessage('error', 'Please enter name and select at least one tax')
      return
    }

    // Calculate total rate from sub taxes
    const totalRate = groupForm.subTaxes.reduce((sum, taxId) => {
      const tax = taxRates.find(t => t.id === taxId)
      return sum + (tax?.rate || 0)
    }, 0)

    const payload = {
      ...groupForm,
      rate: totalRate
    }

    if (editingItem) {
      dispatch({
        type: 'UPDATE_TAX_GROUP',
        payload: { ...payload, id: editingItem.id }
      })
      showMessage('success', 'Tax group updated successfully')
    } else {
      dispatch({
        type: 'ADD_TAX_GROUP',
        payload
      })
      showMessage('success', 'Tax group added successfully')
    }

    setShowModal(false)
  }

  function handleDelete(id, type) {
    if (!confirm(`Are you sure you want to delete this tax ${type}?`)) return

    dispatch({
      type: type === 'rate' ? 'DELETE_TAX_RATE' : 'DELETE_TAX_GROUP',
      payload: id
    })
    showMessage('success', `Tax ${type} deleted successfully`)
  }

  function handleSubTaxToggle(taxId) {
    setGroupForm(prev => ({
      ...prev,
      subTaxes: prev.subTaxes.includes(taxId)
        ? prev.subTaxes.filter(id => id !== taxId)
        : [...prev.subTaxes, taxId]
    }))
  }

  function getSubTaxNames(subTaxIds) {
    return subTaxIds
      .map(id => taxRates.find(t => t.id === id)?.name)
      .filter(Boolean)
      .join(', ')
  }

  function exportCSV(data, filename) {
    const headers = ['Name', 'Tax Rate %']
    const rows = data.map(item => [item.name, item.rate])
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.csv`
    a.click()
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tax Rates</h1>
          <p className="text-slate-400 text-sm">Manage your tax rates and tax groups</p>
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

      {/* Tax Rates Section */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">All Tax Rates</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportCSV(taxRates, 'tax-rates')}
                className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-600 transition-colors"
              >
                Export CSV
              </button>
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-600 transition-colors"
              >
                Print
              </button>
            </div>
            <div className="relative">
              <input
                id="trSearch"
                name="trSearch"
                autoComplete="off"
                aria-label="Search tax rates"
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-48 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
              />
              <svg className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button
              onClick={() => openAddModal('rate')}
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
                  <div className="flex items-center gap-2 cursor-pointer hover:text-white">
                    Name
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">
                  <div className="flex items-center gap-2 cursor-pointer hover:text-white">
                    Tax Rate %
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRates.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center py-8 text-slate-500">
                    No tax rates found. Click "Add" to create one.
                  </td>
                </tr>
              ) : (
                filteredRates.map(tax => (
                  <tr key={tax.id} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                    <td className="px-4 py-3 text-white">
                      {tax.name}
                      {tax.forTaxGroupOnly && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                          Group Only
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{tax.rate}%</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(tax, 'rate')}
                          className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(tax.id, 'rate')}
                          className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-700/50 text-slate-400 text-sm">
          Showing {filteredRates.length} of {taxRates.length} entries
        </div>
      </div>

      {/* Tax Groups Section */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-white">Tax Groups</h2>
            <span className="text-slate-400 text-sm">(Combination of multiple taxes)</span>
            <span className="text-emerald-400 cursor-help" title="Tax groups combine multiple individual taxes into one">ⓘ</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => exportCSV(taxGroups, 'tax-groups')}
              className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-600 transition-colors"
            >
              Export CSV
            </button>
            <button
              onClick={() => openAddModal('group')}
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
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Tax Rate %</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Sub Taxes</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-slate-500">
                    No tax groups found. Click "Add" to create one.
                  </td>
                </tr>
              ) : (
                filteredGroups.map(group => (
                  <tr key={group.id} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                    <td className="px-4 py-3 text-white">{group.name}</td>
                    <td className="px-4 py-3 text-slate-300">{group.rate}%</td>
                    <td className="px-4 py-3 text-slate-400 text-sm">
                      {getSubTaxNames(group.subTaxes || [])}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(group, 'group')}
                          className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(group.id, 'group')}
                          className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-700/50 text-slate-400 text-sm">
          Showing {filteredGroups.length} of {taxGroups.length} entries
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingItem ? 'Edit' : 'Add'} {modalType === 'rate' ? 'Tax Rate' : 'Tax Group'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {modalType === 'rate' ? (
              // Tax Rate Form
              <form onSubmit={handleSaveRate} className="p-6 space-y-4">
                <div>
                  <label htmlFor="trRateName" className="block text-sm font-medium text-slate-300 mb-2">
                    Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="trRateName"
                    name="trRateName"
                    autoComplete="off"
                    type="text"
                    value={rateForm.name}
                    onChange={(e) => setRateForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g., GST, VAT, Sales Tax"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="trRatePercent" className="block text-sm font-medium text-slate-300 mb-2">
                    Tax Rate % <span className="text-red-400">*</span>
                    <span className="ml-1 text-emerald-400 cursor-help" title="Enter the tax percentage">ⓘ</span>
                  </label>
                  <input
                    id="trRatePercent"
                    name="trRatePercent"
                    autoComplete="off"
                    type="number"
                    step="0.01"
                    value={rateForm.rate}
                    onChange={(e) => setRateForm(prev => ({ ...prev, rate: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g., 17"
                    required
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="forTaxGroupOnly"
                    name="forTaxGroupOnly"
                    checked={rateForm.forTaxGroupOnly}
                    onChange={(e) => setRateForm(prev => ({ ...prev, forTaxGroupOnly: e.target.checked }))}
                    className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-emerald-500 focus:ring-emerald-500"
                  />
                  <label htmlFor="forTaxGroupOnly" className="text-slate-300 cursor-pointer">
                    For tax group only
                    <span className="ml-1 text-emerald-400 cursor-help" title="This tax will only be available for use in tax groups">ⓘ</span>
                  </label>
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
              // Tax Group Form
              <form onSubmit={handleSaveGroup} className="p-6 space-y-4">
                <div>
                  <label htmlFor="trGroupName" className="block text-sm font-medium text-slate-300 mb-2">
                    Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="trGroupName"
                    name="trGroupName"
                    autoComplete="off"
                    type="text"
                    value={groupForm.name}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g., Combined Tax, GST + PST"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Select Sub Taxes <span className="text-red-400">*</span>
                  </label>
                  <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                    {taxRates.length === 0 ? (
                      <p className="text-slate-500 text-sm text-center py-2">
                        No tax rates available. Create tax rates first.
                      </p>
                    ) : (
                      taxRates.map(tax => (
                        <label
                          key={tax.id}
                          className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded-lg cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            name="trSubTaxes"
                            checked={groupForm.subTaxes.includes(tax.id)}
                            onChange={() => handleSubTaxToggle(tax.id)}
                            className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-emerald-500 focus:ring-emerald-500"
                          />
                          <span className="text-white flex-1">{tax.name}</span>
                          <span className="text-slate-400">{tax.rate}%</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                {groupForm.subTaxes.length > 0 && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400 font-medium">Total Tax Rate:</span>
                      <span className="text-emerald-400 font-bold text-lg">
                        {groupForm.subTaxes.reduce((sum, taxId) => {
                          const tax = taxRates.find(t => t.id === taxId)
                          return sum + (tax?.rate || 0)
                        }, 0)}%
                      </span>
                    </div>
                  </div>
                )}

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