import { useState } from 'react'
import { useApp } from '../Context/AppContext'

export default function Units() {
  const { state, dispatch } = useApp()
  const { units } = state
  
  const [showModal, setShowModal] = useState(false)
  const [editingUnit, setEditingUnit] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [pageSize, setPageSize] = useState(25)
  const [currentPage, setCurrentPage] = useState(1)

  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    allowDecimal: true
  })

  const filteredUnits = units.filter(u =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.shortName?.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const totalPages = Math.ceil(filteredUnits.length / pageSize)
  const paginatedUnits = filteredUnits.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  function resetForm() {
    setFormData({ name: '', shortName: '', allowDecimal: true })
  }

  function openAddModal() {
    setEditingUnit(null)
    resetForm()
    setShowModal(true)
  }

  function openEditModal(unit) {
    setEditingUnit(unit)
    setFormData({
      name: unit.name || '',
      shortName: unit.shortName || '',
      allowDecimal: unit.allowDecimal !== false
    })
    setShowModal(true)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!formData.name || !formData.shortName) {
      alert('Name and Short Name are required')
      return
    }

    if (editingUnit) {
      dispatch({ type: 'UPDATE_UNIT', payload: { ...editingUnit, ...formData } })
    } else {
      dispatch({ type: 'ADD_UNIT', payload: formData })
    }
    setShowModal(false)
    resetForm()
  }

  function handleDelete(id) {
    if (confirm('Are you sure you want to delete this unit?')) {
      dispatch({ type: 'DELETE_UNIT', payload: id })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Units</h1>
          <p className="text-slate-400 text-sm">Manage your units of measurement</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-cyan-600 transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Unit
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl">
        {/* Table Header */}
        <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-sm">Show</span>
            <select id="unPageSize" name="unPageSize" aria-label="Entries per page" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1) }} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm">
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-slate-400 text-sm">entries</span>
          </div>
          <div className="relative">
            <input
              id="unSearch"
              name="unSearch"
              autoComplete="off"
              aria-label="Search units"
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm w-64 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-900/50">
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Name</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Short Name</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Allow Decimal</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUnits.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-slate-500">No units found</td>
                </tr>
              ) : (
                paginatedUnits.map(unit => (
                  <tr key={unit.id} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                    <td className="px-4 py-3 text-white font-medium">{unit.name}</td>
                    <td className="px-4 py-3 text-slate-300">{unit.shortName}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        unit.allowDecimal !== false
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-500/20 text-slate-400'
                      }`}>
                        {unit.allowDecimal !== false ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(unit)}
                          className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm hover:bg-cyan-500/30 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(unit.id)}
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

        {/* Table Footer */}
        <div className="p-4 border-t border-slate-700/50 flex items-center justify-between">
          <span className="text-slate-400 text-sm">Showing {Math.min((currentPage - 1) * pageSize + 1, filteredUnits.length)} to {Math.min(currentPage * pageSize, filteredUnits.length)} of {filteredUnits.length} entries</span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 bg-slate-700 text-slate-300 rounded-lg text-sm disabled:opacity-50">Previous</button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i + 1} onClick={() => setCurrentPage(i + 1)} className={`px-3 py-1 rounded-lg text-sm ${currentPage === i + 1 ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'}`}>{i + 1}</button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 bg-slate-700 text-slate-300 rounded-lg text-sm disabled:opacity-50">Next</button>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingUnit ? 'Edit Unit' : 'Add Unit'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="unName" className="block text-sm font-medium text-slate-300 mb-2">Name *</label>
                <input
                  id="unName"
                  name="unName"
                  autoComplete="off"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g., Kilogram"
                  required
                />
              </div>

              <div>
                <label htmlFor="unShortName" className="block text-sm font-medium text-slate-300 mb-2">Short Name *</label>
                <input
                  id="unShortName"
                  name="unShortName"
                  autoComplete="off"
                  type="text"
                  value={formData.shortName}
                  onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g., Kg"
                  required
                />
              </div>

              <div>
                <label htmlFor="unAllowDecimal" className="block text-sm font-medium text-slate-300 mb-2">Allow Decimal *</label>
                <select
                  id="unAllowDecimal"
                  name="unAllowDecimal"
                  value={formData.allowDecimal ? 'yes' : 'no'}
                  onChange={(e) => setFormData({ ...formData, allowDecimal: e.target.value === 'yes' })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
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
          </div>
        </div>
      )}
    </div>
  )
}