import { useState } from 'react'
import { useApp } from '../Context/AppContext'

export default function Roles() {
  const { state, dispatch } = useApp()
  const { roles } = state
  
  const [showModal, setShowModal] = useState(false)
  const [editingRole, setEditingRole] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    permissions: []
  })

  const allPermissions = [
    { id: 'dashboard', name: 'Dashboard' },
    { id: 'user-management', name: 'User Management' },
    { id: 'contacts', name: 'Contacts' },
    { id: 'products', name: 'Products' },
    { id: 'purchases', name: 'Purchases' },
    { id: 'sales', name: 'Sales' },
    { id: 'pos', name: 'POS' },
    { id: 'stock', name: 'Stock Adjustment' },
    { id: 'expenses', name: 'Expenses' },
    { id: 'reports', name: 'Reports' },
    { id: 'settings', name: 'Settings' }
  ]

  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  function openAddModal() {
    setEditingRole(null)
    setFormData({ name: '', permissions: [] })
    setShowModal(true)
  }

  function openEditModal(role) {
    setEditingRole(role)
    setFormData({ name: role.name, permissions: role.permissions || [] })
    setShowModal(true)
  }

  function handlePermissionChange(permId) {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId]
    }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    
    if (!formData.name) {
      alert('Role name is required')
      return
    }

    if (editingRole) {
      dispatch({ type: 'UPDATE_ROLE', payload: { ...editingRole, ...formData } })
    } else {
      dispatch({ type: 'ADD_ROLE', payload: formData })
    }
    
    setShowModal(false)
  }

  function handleDelete(id, canDelete) {
    if (!canDelete) {
      alert('This role cannot be deleted')
      return
    }
    if (confirm('Are you sure you want to delete this role?')) {
      dispatch({ type: 'DELETE_ROLE', payload: id })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Roles</h1>
          <p className="text-slate-400 text-sm">Manage roles</p>
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
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="p-4 border-b border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-sm">Show</span>
            <select className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm">
              <option>25</option>
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-900/50">
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Roles</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoles.length === 0 ? (
                <tr>
                  <td colSpan="2" className="text-center py-8 text-slate-500">No roles found</td>
                </tr>
              ) : (
                filteredRoles.map(role => (
                  <tr key={role.id} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                    <td className="px-4 py-3 text-white">{role.name}</td>
                    <td className="px-4 py-3">
                      {role.canDelete === false ? (
                        <span className="text-slate-500 text-sm">System Role</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(role)}
                            className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(role.id, role.canDelete)}
                            className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-4 border-t border-slate-700/50 flex items-center justify-between">
          <span className="text-slate-400 text-sm">Showing 1 to {filteredRoles.length} of {filteredRoles.length} entries</span>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 bg-slate-700 text-slate-300 rounded-lg text-sm">Previous</button>
            <button className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-sm">1</button>
            <button className="px-3 py-1 bg-slate-700 text-slate-300 rounded-lg text-sm">Next</button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingRole ? 'Edit Role' : 'Add Role'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Role Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Enter role name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">Permissions</label>
                <div className="grid grid-cols-2 gap-2">
                  {allPermissions.map(perm => (
                    <label key={perm.id} className="flex items-center gap-2 p-2 bg-slate-900/50 rounded-lg cursor-pointer hover:bg-slate-900">
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(perm.id)}
                        onChange={() => handlePermissionChange(perm.id)}
                        className="rounded bg-slate-700 border-slate-600 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="text-slate-300 text-sm">{perm.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all"
                >
                  {editingRole ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}