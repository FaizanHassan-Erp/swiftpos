import { useState } from 'react'
import { useApp } from '../Context/AppContext'

export default function Categories() {
  const { state, dispatch } = useApp()
  const { categories } = state
  
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    parentId: null
  })

  const filteredCategories = categories.filter(c =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  function resetForm() {
    setFormData({ name: '', code: '', description: '', parentId: null })
  }

  function openAddModal() {
    setEditingCategory(null)
    resetForm()
    setShowModal(true)
  }

  function openEditModal(category) {
    setEditingCategory(category)
    setFormData({
      name: category.name || '',
      code: category.code || '',
      description: category.description || '',
      parentId: category.parentId || null
    })
    setShowModal(true)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!formData.name) {
      alert('Category name is required')
      return
    }

    if (editingCategory) {
      dispatch({ type: 'UPDATE_CATEGORY', payload: { ...editingCategory, ...formData } })
    } else {
      dispatch({ type: 'ADD_CATEGORY', payload: formData })
    }
    setShowModal(false)
    resetForm()
  }

  function handleDelete(id) {
    if (confirm('Are you sure you want to delete this category?')) {
      dispatch({ type: 'DELETE_CATEGORY', payload: id })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Categories</h1>
          <p className="text-slate-400 text-sm">Manage your product categories</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-cyan-600 transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Category
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl">
        {/* Table Header */}
        <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-sm">Show</span>
            <select id="catPageSize" name="catPageSize" aria-label="Entries per page" className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm">
              <option>25</option>
              <option>50</option>
              <option>100</option>
            </select>
            <span className="text-slate-400 text-sm">entries</span>
          </div>
          <div className="relative">
            <input
              id="catSearch"
              name="catSearch"
              autoComplete="off"
              aria-label="Search categories"
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
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Category</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Category Code</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Description</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-slate-500">No categories found</td>
                </tr>
              ) : (
                filteredCategories.map(category => (
                  <tr key={category.id} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                    <td className="px-4 py-3 text-white font-medium">{category.name}</td>
                    <td className="px-4 py-3 text-cyan-400 font-mono">{category.code || '-'}</td>
                    <td className="px-4 py-3 text-slate-300">{category.description || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(category)}
                          className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm hover:bg-cyan-500/30 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
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
        <div className="p-4 border-t border-slate-700/50">
          <span className="text-slate-400 text-sm">Showing {filteredCategories.length} entries</span>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="catName" className="block text-sm font-medium text-slate-300 mb-2">Category Name *</label>
                <input
                  id="catName"
                  name="catName"
                  autoComplete="off"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Category name"
                  required
                />
              </div>

              <div>
                <label htmlFor="catCode" className="block text-sm font-medium text-slate-300 mb-2">Category Code</label>
                <input
                  id="catCode"
                  name="catCode"
                  autoComplete="off"
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Category Code"
                />
                <p className="text-xs text-slate-500 mt-1">Category code is same as HSN code</p>
              </div>

              <div>
                <label htmlFor="catDescription" className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea
                  id="catDescription"
                  name="catDescription"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  rows="3"
                  placeholder="Description"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-slate-300">
                  <input
                    id="catSubTaxonomy"
                    name="catSubTaxonomy"
                    type="checkbox"
                    checked={formData.parentId !== null}
                    onChange={(e) => setFormData({ ...formData, parentId: e.target.checked ? '' : null })}
                    className="w-4 h-4 text-emerald-500 bg-slate-900 border-slate-700 rounded"
                  />
                  <span className="text-sm">Add as sub taxonomy</span>
                </label>
              </div>

              {formData.parentId !== null && (
                <div>
                  <label htmlFor="catParentId" className="block text-sm font-medium text-slate-300 mb-2">Parent Category</label>
                  <select
                    id="catParentId"
                    name="catParentId"
                    value={formData.parentId || ''}
                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Select Parent Category</option>
                    {categories.filter(c => c.id !== editingCategory?.id).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
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
          </div>
        </div>
      )}
    </div>
  )
}