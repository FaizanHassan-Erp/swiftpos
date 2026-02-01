import { useState, useEffect } from 'react'
import { useAuth } from '../Context/AuthContext'
import { 
  createUserWithoutSignIn, 
  getBusinessUsers, 
  updateUserData, 
  deleteUserData,
  toggleUserStatus 
} from '../firebase/config'

export default function Users() {
  const { currentUser, userData, businessId, isOwner, isAdmin } = useAuth()
  
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    role: '',
    status: 'active'
  })

  const roles = [
    { id: 'admin', name: 'Admin' },
    { id: 'manager', name: 'Manager' },
    { id: 'cashier', name: 'Cashier' },
    { id: 'inventory', name: 'Inventory Manager' },
    { id: 'accountant', name: 'Accountant' }
  ]

  // Fetch users on mount
  useEffect(() => {
    fetchUsers()
  }, [businessId])

  async function fetchUsers() {
    if (!businessId) return
    
    setLoading(true)
    const result = await getBusinessUsers(businessId)
    if (result.success) {
      setUsers(result.users)
    }
    setLoading(false)
  }

  // Filter users
  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  function showMessage(type, text) {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 4000)
  }

  function openAddModal() {
    if (!isAdmin) {
      showMessage('error', 'Only admins and owners can add users')
      return
    }
    setEditingUser(null)
    setFormData({ username: '', name: '', email: '', password: '', role: '', status: 'active' })
    setShowModal(true)
  }

  function openEditModal(user) {
    if (!isAdmin) {
      showMessage('error', 'Only admins and owners can edit users')
      return
    }
    if (user.isOwner) {
      showMessage('error', 'Cannot edit business owner account')
      return
    }
    setEditingUser(user)
    setFormData({ 
      username: user.username || '',
      name: user.name || '',
      email: user.email || '',
      password: '', // Don't show existing password
      role: user.role || '',
      status: user.status || 'active'
    })
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.role) {
      showMessage('error', 'Please fill all required fields')
      return
    }

    setActionLoading(true)

    if (editingUser) {
      // Update existing user
      const result = await updateUserData(editingUser.id, {
        name: formData.name,
        username: formData.username,
        role: formData.role,
        status: formData.status
        // Note: Email and password can't be changed from here (requires Firebase Admin SDK)
      })
      
      if (result.success) {
        showMessage('success', 'User updated successfully')
        fetchUsers()
        setShowModal(false)
      } else {
        showMessage('error', result.message)
      }
    } else {
      // Create new user
      if (!formData.password) {
        showMessage('error', 'Password is required for new users')
        setActionLoading(false)
        return
      }

      if (formData.password.length < 6) {
        showMessage('error', 'Password must be at least 6 characters')
        setActionLoading(false)
        return
      }

      const result = await createUserWithoutSignIn(formData.email, formData.password, {
        name: formData.name,
        username: formData.username || formData.email.split('@')[0],
        role: formData.role,
        status: formData.status,
        businessId: businessId,
        createdBy: currentUser?.uid
      })
      
      if (result.success) {
        showMessage('success', `User "${formData.name}" created successfully. They can now login with their email and password.`)
        fetchUsers()
        setShowModal(false)
      } else {
        showMessage('error', result.message)
      }
    }
    
    setActionLoading(false)
  }

  async function handleDelete(user) {
    if (!isAdmin) {
      showMessage('error', 'Only admins and owners can delete users')
      return
    }
    if (user.isOwner) {
      showMessage('error', 'Cannot delete business owner account')
      return
    }
    if (user.id === currentUser?.uid) {
      showMessage('error', 'Cannot delete your own account')
      return
    }
    
    if (!confirm(`Are you sure you want to delete "${user.name}"? They will no longer be able to access this business.`)) {
      return
    }

    setActionLoading(true)
    const result = await deleteUserData(user.id)
    
    if (result.success) {
      showMessage('success', 'User deleted successfully')
      fetchUsers()
    } else {
      showMessage('error', result.message)
    }
    setActionLoading(false)
  }

  async function handleToggleStatus(user) {
    if (!isAdmin) {
      showMessage('error', 'Only admins and owners can change user status')
      return
    }
    if (user.isOwner) {
      showMessage('error', 'Cannot deactivate business owner account')
      return
    }
    if (user.id === currentUser?.uid) {
      showMessage('error', 'Cannot deactivate your own account')
      return
    }

    const newStatus = user.status === 'active' ? 'inactive' : 'active'
    
    setActionLoading(true)
    const result = await toggleUserStatus(user.id, newStatus)
    
    if (result.success) {
      showMessage('success', result.message)
      fetchUsers()
    } else {
      showMessage('error', result.message)
    }
    setActionLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-slate-400 text-sm">Manage staff accounts for your business</p>
        </div>
        {isAdmin && (
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-cyan-600 transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add User
          </button>
        )}
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border border-emerald-500/30' 
            : 'bg-red-500/10 border border-red-500/30'
        }`}>
          <svg className={`w-5 h-5 ${message.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {message.type === 'success' ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            )}
          </svg>
          <p className={message.type === 'success' ? 'text-emerald-400' : 'text-red-400'}>{message.text}</p>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-blue-400 font-medium">How User Management Works</p>
            <p className="text-slate-400 text-sm mt-1">
              Add your staff members (cashiers, managers, etc.) here. They will receive login credentials 
              to access this POS system. You can control their permissions by assigning roles and 
              deactivate accounts when employees leave.
            </p>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="p-4 border-b border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-sm">Total Users:</span>
            <span className="text-white font-medium">{users.length}</span>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm w-full sm:w-64 focus:outline-none focus:border-emerald-500"
            />
            <svg className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-900/50">
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">User</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Email</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Role</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Status</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-8">
                    <div className="flex items-center justify-center gap-2 text-slate-400">
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading users...
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-slate-500">
                    {searchTerm ? 'No users found matching your search' : 'No users added yet. Click "Add User" to get started.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                          user.isOwner 
                            ? 'bg-gradient-to-br from-amber-400 to-orange-500' 
                            : 'bg-gradient-to-br from-emerald-400 to-cyan-500'
                        }`}>
                          {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-white font-medium flex items-center gap-2">
                            {user.name}
                            {user.isOwner && (
                              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">Owner</span>
                            )}
                            {user.id === currentUser?.uid && (
                              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">You</span>
                            )}
                          </div>
                          <div className="text-slate-500 text-xs">@{user.username || user.email?.split('@')[0]}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.role === 'Owner' ? 'bg-amber-500/20 text-amber-400' :
                        user.role === 'Admin' ? 'bg-purple-500/20 text-purple-400' :
                        user.role === 'Manager' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        disabled={user.isOwner || user.id === currentUser?.uid || actionLoading || !isAdmin}
                        className={`px-2 py-1 text-xs rounded-full transition-colors ${
                          user.status === 'active' 
                            ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
                            : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        } ${(user.isOwner || user.id === currentUser?.uid || !isAdmin) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {user.status === 'active' ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {user.isOwner ? (
                        <span className="text-slate-500 text-sm">-</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(user)}
                            disabled={actionLoading || !isAdmin}
                            className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            disabled={user.id === currentUser?.uid || actionLoading || !isAdmin}
                            className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors disabled:opacity-50"
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
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    placeholder="johndoe"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                  placeholder="john@example.com"
                  disabled={!!editingUser}
                  required
                />
                {editingUser && (
                  <p className="text-slate-500 text-xs mt-1">Email cannot be changed after creation</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Password {editingUser ? '(Cannot change)' : '*'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                  placeholder={editingUser ? '••••••••' : 'Minimum 6 characters'}
                  disabled={!!editingUser}
                  minLength={editingUser ? 0 : 6}
                />
                {editingUser && (
                  <p className="text-slate-500 text-xs mt-1">User can reset their own password via login page</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    required
                  >
                    <option value="">Select Role</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.name}>{role.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {!editingUser && (
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-amber-400 font-medium text-sm">Important</p>
                      <p className="text-slate-400 text-xs mt-1">
                        Share the email and password with this user. They can login immediately 
                        using these credentials. Make sure to use a strong password.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
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
                  disabled={actionLoading}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading && (
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}