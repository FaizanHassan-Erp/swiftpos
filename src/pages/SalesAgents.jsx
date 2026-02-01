import { useState } from 'react'
import { useApp } from '../Context/AppContext'

export default function SalesAgents() {
  const { state, dispatch } = useApp()
  const { salesAgents } = state
  
  const [showModal, setShowModal] = useState(false)
  const [editingAgent, setEditingAgent] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    commissionPercentage: ''
  })

  const filteredAgents = salesAgents.filter(agent => 
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  function openAddModal() {
    setEditingAgent(null)
    setFormData({ name: '', email: '', phone: '', address: '', commissionPercentage: '' })
    setShowModal(true)
  }

  function openEditModal(agent) {
    setEditingAgent(agent)
    setFormData({ ...agent })
    setShowModal(true)
  }

  function handleSubmit(e) {
    e.preventDefault()
    
    if (!formData.name || !formData.commissionPercentage) {
      alert('Name and Commission Percentage are required')
      return
    }

    if (editingAgent) {
      dispatch({ type: 'UPDATE_SALES_AGENT', payload: { ...editingAgent, ...formData } })
    } else {
      dispatch({ type: 'ADD_SALES_AGENT', payload: formData })
    }
    
    setShowModal(false)
  }

  function handleDelete(id) {
    if (confirm('Are you sure you want to delete this sales agent?')) {
      dispatch({ type: 'DELETE_SALES_AGENT', payload: id })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Sales Commission Agents</h1>
          <p className="text-slate-400 text-sm">Manage sales commission agents</p>
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
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Name</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Email</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Contact Number</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Address</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Sales Commission (%)</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-500">No data available in table</td>
                </tr>
              ) : (
                filteredAgents.map(agent => (
                  <tr key={agent.id} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                    <td className="px-4 py-3 text-white">{agent.name}</td>
                    <td className="px-4 py-3 text-slate-300">{agent.email || '-'}</td>
                    <td className="px-4 py-3 text-slate-300">{agent.phone || '-'}</td>
                    <td className="px-4 py-3 text-slate-300">{agent.address || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm">
                        {agent.commissionPercentage}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(agent)}
                          className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(agent.id)}
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
          <span className="text-slate-400 text-sm">Showing 0 to 0 of 0 entries</span>
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
                {editingAgent ? 'Edit Sales Agent' : 'Add Sales Agent'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Enter name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Enter email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Contact Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Enter phone"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Enter address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Sales Commission Percentage (%) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.commissionPercentage}
                  onChange={(e) => setFormData({ ...formData, commissionPercentage: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Enter commission percentage"
                />
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
                  {editingAgent ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}