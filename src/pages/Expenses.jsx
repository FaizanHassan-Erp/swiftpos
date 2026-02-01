import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function Expenses() {
  const navigate = useNavigate()
  const { state, dispatch } = useApp()
  const { expenses, expenseCategories, business, suppliers, customers, paymentAccounts = [] } = state
  
  const [activeTab, setActiveTab] = useState('expenses')
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [editingCategory, setEditingCategory] = useState(null)
  const [selectedExpense, setSelectedExpense] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })

  // Form data for expense
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 16),
    categoryId: '',
    totalAmount: 0,
    amountPaid: 0,
    paymentStatus: 'due',
    paymentMethod: 'cash',
    paymentAccountId: '',
    expenseFor: 'business',
    contactId: '',
    taxRate: 0,
    taxAmount: 0,
    note: '',
    isRecurring: false,
    recurringInterval: 'monthly',
    isRefund: false
  })

  // Form data for category
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    code: ''
  })

  // Payment form
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    method: 'cash',
    paymentAccountId: '',
    date: new Date().toISOString().slice(0, 10),
    note: ''
  })

  // Filter active payment accounts
  const activeAccounts = paymentAccounts.filter(acc => acc.status !== 'closed')

  // Filter expenses
  const filteredExpenses = (expenses || []).filter(exp => {
    const matchesSearch = exp.referenceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exp.note?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !filterCategory || exp.categoryId === parseInt(filterCategory)
    const matchesStatus = filterStatus === 'all' || exp.paymentStatus === filterStatus
    return matchesSearch && matchesCategory && matchesStatus
  }).sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))

  // Summary calculations
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.totalAmount || 0), 0)
  const totalPaid = filteredExpenses.reduce((sum, e) => sum + (e.amountPaid || 0), 0)
  const totalDue = totalExpenses - totalPaid
  const expenseCount = filteredExpenses.length

  // Get category name
  function getCategoryName(id) {
    return expenseCategories?.find(c => c.id === id)?.name || '-'
  }

  // Get contact name
  function getContactName(type, id) {
    if (type === 'supplier') {
      return suppliers?.find(s => s.id === id)?.name || '-'
    } else if (type === 'customer') {
      return customers?.find(c => c.id === id)?.name || '-'
    }
    return '-'
  }

  // Get payment account name
  function getAccountName(id) {
    return paymentAccounts?.find(a => a.id === id)?.name || '-'
  }

  // Get active expense for dropdown
  const activeExpense = expenses?.find(e => e.id === activeDropdown)

  function resetForm() {
    setFormData({
      date: new Date().toISOString().slice(0, 16),
      categoryId: '',
      totalAmount: 0,
      amountPaid: 0,
      paymentStatus: 'due',
      paymentMethod: 'cash',
      paymentAccountId: '',
      expenseFor: 'business',
      contactId: '',
      taxRate: 0,
      taxAmount: 0,
      note: '',
      isRecurring: false,
      recurringInterval: 'monthly',
      isRefund: false
    })
  }

  function openAddModal() {
    setEditingExpense(null)
    resetForm()
    setShowModal(true)
  }

  function openEditModal(expense) {
    setEditingExpense(expense)
    setFormData({
      date: expense.date ? new Date(expense.date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      categoryId: expense.categoryId || '',
      totalAmount: expense.totalAmount || 0,
      amountPaid: expense.amountPaid || 0,
      paymentStatus: expense.paymentStatus || 'due',
      paymentMethod: expense.paymentMethod || 'cash',
      paymentAccountId: expense.paymentAccountId || '',
      expenseFor: expense.expenseFor || 'business',
      contactId: expense.contactId || '',
      taxRate: expense.taxRate || 0,
      taxAmount: expense.taxAmount || 0,
      note: expense.note || '',
      isRecurring: expense.isRecurring || false,
      recurringInterval: expense.recurringInterval || 'monthly',
      isRefund: expense.isRefund || false
    })
    setShowModal(true)
    setActiveDropdown(null)
  }

  function openViewModal(expense) {
    setSelectedExpense(expense)
    setShowViewModal(true)
    setActiveDropdown(null)
  }

  function openPaymentModal(expense) {
    setSelectedExpense(expense)
    const due = (expense.totalAmount || 0) - (expense.amountPaid || 0)
    setPaymentData({
      amount: due,
      method: 'cash',
      paymentAccountId: '',
      date: new Date().toISOString().slice(0, 10),
      note: ''
    })
    setShowPaymentModal(true)
    setActiveDropdown(null)
  }

  function handleDropdownClick(e, expenseId) {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setDropdownPosition({ top: rect.bottom + 4, left: rect.left })
    setActiveDropdown(activeDropdown === expenseId ? null : expenseId)
  }

  function handleSubmit(e) {
    e.preventDefault()
    
    if (!formData.categoryId) {
      alert('Please select expense category')
      return
    }
    if (formData.totalAmount <= 0) {
      alert('Please enter valid amount')
      return
    }

    // Determine payment status
    let paymentStatus = 'due'
    if (formData.amountPaid >= formData.totalAmount) {
      paymentStatus = 'paid'
    } else if (formData.amountPaid > 0) {
      paymentStatus = 'partial'
    }

    const expenseData = {
      ...formData,
      paymentStatus,
      date: new Date(formData.date).toISOString(),
      categoryId: parseInt(formData.categoryId),
      contactId: formData.contactId ? parseInt(formData.contactId) : null,
      paymentAccountId: formData.paymentAccountId ? parseInt(formData.paymentAccountId) : null,
      location: business.name
    }

    if (editingExpense) {
      dispatch({ type: 'UPDATE_EXPENSE', payload: { ...editingExpense, ...expenseData } })
    } else {
      dispatch({ type: 'ADD_EXPENSE_FULL', payload: expenseData })
    }
    
    setShowModal(false)
    resetForm()
  }

  function handlePayment(e) {
    e.preventDefault()
    
    if (paymentData.amount <= 0) {
      alert('Please enter valid payment amount')
      return
    }

    dispatch({
      type: 'ADD_EXPENSE_PAYMENT',
      payload: {
        expenseId: selectedExpense.id,
        amount: parseFloat(paymentData.amount),
        method: paymentData.method,
        paymentAccountId: paymentData.paymentAccountId ? parseInt(paymentData.paymentAccountId) : null,
        date: paymentData.date,
        note: paymentData.note
      }
    })
    
    setShowPaymentModal(false)
  }

  function handleDelete(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
      dispatch({ type: 'DELETE_EXPENSE', payload: id })
    }
    setActiveDropdown(null)
  }

  // Category functions
  function openCategoryModal(category = null) {
    setEditingCategory(category)
    if (category) {
      setCategoryForm({ name: category.name, code: category.code || '' })
    } else {
      setCategoryForm({ name: '', code: '' })
    }
    setShowCategoryModal(true)
  }

  function handleCategorySubmit(e) {
    e.preventDefault()
    
    if (!categoryForm.name.trim()) {
      alert('Category name is required')
      return
    }

    if (editingCategory) {
      dispatch({ 
        type: 'UPDATE_EXPENSE_CATEGORY', 
        payload: { ...editingCategory, ...categoryForm } 
      })
    } else {
      dispatch({ type: 'ADD_EXPENSE_CATEGORY', payload: categoryForm })
    }
    
    setShowCategoryModal(false)
    setCategoryForm({ name: '', code: '' })
  }

  function handleDeleteCategory(id) {
    const isUsed = expenses?.some(e => e.categoryId === id)
    if (isUsed) {
      alert('Cannot delete category. It is being used by expenses.')
      return
    }
    if (confirm('Are you sure you want to delete this category?')) {
      dispatch({ type: 'DELETE_EXPENSE_CATEGORY', payload: id })
    }
  }

  // Expense for options
  const expenseForOptions = [
    { value: 'business', label: 'Business/General' },
    { value: 'supplier', label: 'Supplier' },
    { value: 'customer', label: 'Customer' }
  ]

  // Recurring intervals
  const recurringIntervals = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Expenses</h1>
          <p className="text-slate-400 text-sm">Track and manage your business expenses</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-cyan-600 transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Expenses</p>
              <p className="text-2xl font-bold text-white">{expenseCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Amount</p>
              <p className="text-2xl font-bold text-red-400">{business.currency} {totalExpenses.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Amount Paid</p>
              <p className="text-2xl font-bold text-emerald-400">{business.currency} {totalPaid.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Amount Due</p>
              <p className="text-2xl font-bold text-orange-400">{business.currency} {totalDue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl">
        <div className="border-b border-slate-700/50">
          <div className="flex gap-1 p-2">
            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'expenses'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              💰 All Expenses
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'categories'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              📁 Expense Categories
            </button>
          </div>
        </div>

        {/* Expenses Tab */}
        {activeTab === 'expenses' && (
          <>
            {/* Filters */}
            <div className="p-4 border-b border-slate-700/50 flex flex-wrap items-center gap-4">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="">All Categories</option>
                {expenseCategories?.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="due">Due</option>
              </select>

              <div className="flex-1"></div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm w-64 pl-10"
                />
                <svg className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-900/50">
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Action</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Date</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Reference No</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Category</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Account</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Status</th>
                    <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Total</th>
                    <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Paid</th>
                    <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Due</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center py-8 text-slate-500">No expenses found</td>
                    </tr>
                  ) : (
                    filteredExpenses.map(expense => {
                      const due = (expense.totalAmount || 0) - (expense.amountPaid || 0)
                      return (
                        <tr key={expense.id} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                          <td className="px-4 py-3">
                            <button
                              onClick={(e) => handleDropdownClick(e, expense.id)}
                              className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600 transition-colors flex items-center gap-1"
                            >
                              Actions
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </td>
                          <td className="px-4 py-3 text-white">
                            {new Date(expense.date || expense.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-cyan-400 font-mono text-sm">{expense.referenceNo}</td>
                          <td className="px-4 py-3 text-slate-300">{getCategoryName(expense.categoryId)}</td>
                          <td className="px-4 py-3 text-slate-300">{getAccountName(expense.paymentAccountId)}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              expense.paymentStatus === 'paid' ? 'bg-emerald-500/20 text-emerald-400' :
                              expense.paymentStatus === 'partial' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {expense.paymentStatus === 'paid' ? 'Paid' :
                               expense.paymentStatus === 'partial' ? 'Partial' : 'Due'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-white font-medium">
                            {business.currency} {(expense.totalAmount || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-emerald-400">
                            {business.currency} {(expense.amountPaid || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-red-400">
                            {business.currency} {due.toLocaleString()}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
                {filteredExpenses.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-900/50 border-t border-slate-700">
                      <td colSpan="6" className="px-4 py-3 text-white font-medium">Total:</td>
                      <td className="px-4 py-3 text-right text-white font-bold">
                        {business.currency} {totalExpenses.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-400 font-bold">
                        {business.currency} {totalPaid.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-red-400 font-bold">
                        {business.currency} {totalDue.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-slate-700/50 flex items-center justify-between">
              <span className="text-slate-400 text-sm">Showing {filteredExpenses.length} entries</span>
            </div>
          </>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <>
            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
              <h3 className="text-white font-medium">All Expense Categories</h3>
              <button
                onClick={() => openCategoryModal()}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-cyan-600 transition-all flex items-center gap-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Category
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-900/50">
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Category Name</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Category Code</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Expenses Count</th>
                    <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Total Spent</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(expenseCategories || []).length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-slate-500">No categories found</td>
                    </tr>
                  ) : (
                    (expenseCategories || []).map(category => {
                      const categoryExpenses = expenses?.filter(e => e.categoryId === category.id) || []
                      const totalSpent = categoryExpenses.reduce((sum, e) => sum + (e.totalAmount || 0), 0)
                      return (
                        <tr key={category.id} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                          <td className="px-4 py-3 text-white font-medium">{category.name}</td>
                          <td className="px-4 py-3 text-slate-400">{category.code || '-'}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-slate-700 rounded-full text-slate-300 text-sm">
                              {categoryExpenses.length}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-red-400 font-medium">
                            {business.currency} {totalSpent.toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openCategoryModal(category)}
                                className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm hover:bg-cyan-500/30 transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(category.id)}
                                className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-700/50">
              <span className="text-slate-400 text-sm">Showing {expenseCategories?.length || 0} categories</span>
            </div>
          </>
        )}
      </div>

      {/* Dropdown Portal */}
      {activeDropdown && activeExpense && (
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setActiveDropdown(null)} />
          <div 
            className="fixed w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-[9999]"
            style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
          >
            <div className="py-1">
              <button onClick={() => openViewModal(activeExpense)} className="w-full flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-700 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                View
              </button>
              <button onClick={() => openEditModal(activeExpense)} className="w-full flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-700 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Edit
              </button>
              {activeExpense.paymentStatus !== 'paid' && (
                <button onClick={() => openPaymentModal(activeExpense)} className="w-full flex items-center gap-2 px-4 py-2 text-emerald-400 hover:bg-slate-700 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  Add Payment
                </button>
              )}
              <hr className="my-1 border-slate-700" />
              <button onClick={() => handleDelete(activeExpense.id)} className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-slate-700 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Delete
              </button>
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800 z-10">
              <h2 className="text-xl font-bold text-white">
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Business Location</label>
                  <input
                    type="text"
                    value={business.name}
                    readOnly
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Expense Category *</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    required
                  >
                    <option value="">Select Category</option>
                    {expenseCategories?.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Date *</label>
                  <input
                    type="datetime-local"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    required
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Expense For</label>
                  <select
                    value={formData.expenseFor}
                    onChange={(e) => setFormData({ ...formData, expenseFor: e.target.value, contactId: '' })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  >
                    {expenseForOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                {formData.expenseFor !== 'business' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Select {formData.expenseFor === 'supplier' ? 'Supplier' : 'Customer'}
                    </label>
                    <select
                      value={formData.contactId}
                      onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    >
                      <option value="">Select...</option>
                      {formData.expenseFor === 'supplier' && suppliers?.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                      {formData.expenseFor === 'customer' && customers?.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Total Amount *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{business.currency}</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.totalAmount}
                      onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 pl-10 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Row 3 - Payment */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Payment Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Payment Account *</label>
                  <select
                    value={formData.paymentAccountId}
                    onChange={(e) => setFormData({ ...formData, paymentAccountId: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="">Select Account</option>
                    {activeAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} ({acc.accountType || 'Default'})</option>
                    ))}
                  </select>
                  {!formData.paymentAccountId && formData.amountPaid > 0 && (
                    <p className="text-yellow-400 text-xs mt-1">⚠️ Select account to track payment</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Amount Paid</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{business.currency}</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amountPaid}
                      onChange={(e) => setFormData({ ...formData, amountPaid: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 pl-10 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Expense Note */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Expense Note</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white resize-none"
                  rows="3"
                  placeholder="Enter notes about this expense..."
                />
              </div>

              {/* Options */}
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isRefund}
                    onChange={(e) => setFormData({ ...formData, isRefund: e.target.checked })}
                    className="w-4 h-4 text-emerald-500 bg-slate-900 border-slate-700 rounded focus:ring-emerald-500"
                  />
                  <span className="text-slate-300 text-sm">Is Refund?</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isRecurring}
                    onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                    className="w-4 h-4 text-emerald-500 bg-slate-900 border-slate-700 rounded focus:ring-emerald-500"
                  />
                  <span className="text-slate-300 text-sm">Is Recurring?</span>
                </label>

                {formData.isRecurring && (
                  <select
                    value={formData.recurringInterval}
                    onChange={(e) => setFormData({ ...formData, recurringInterval: e.target.value })}
                    className="px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
                  >
                    {recurringIntervals.map(int => (
                      <option key={int.value} value={int.value}>{int.label}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all"
                >
                  {editingExpense ? 'Update Expense' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Expense Modal */}
      {showViewModal && selectedExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Expense Details - {selectedExpense.referenceNo}</h2>
              <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/50 p-3 rounded-lg">
                  <p className="text-slate-400 text-sm">Date</p>
                  <p className="text-white font-medium">{new Date(selectedExpense.date || selectedExpense.createdAt).toLocaleString()}</p>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-lg">
                  <p className="text-slate-400 text-sm">Category</p>
                  <p className="text-white font-medium">{getCategoryName(selectedExpense.categoryId)}</p>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-lg">
                  <p className="text-slate-400 text-sm">Payment Account</p>
                  <p className="text-white font-medium">{getAccountName(selectedExpense.paymentAccountId)}</p>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-lg">
                  <p className="text-slate-400 text-sm">Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedExpense.paymentStatus === 'paid' ? 'bg-emerald-500/20 text-emerald-400' :
                    selectedExpense.paymentStatus === 'partial' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {selectedExpense.paymentStatus === 'paid' ? 'Paid' :
                     selectedExpense.paymentStatus === 'partial' ? 'Partial' : 'Due'}
                  </span>
                </div>
              </div>

              {/* Amount Summary */}
              <div className="bg-slate-900/50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-lg font-medium">
                  <span className="text-slate-300">Total Amount:</span>
                  <span className="text-white">{business.currency} {(selectedExpense.totalAmount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-400">Amount Paid:</span>
                  <span className="text-emerald-400">{business.currency} {(selectedExpense.amountPaid || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-medium">
                  <span className="text-red-400">Amount Due:</span>
                  <span className="text-red-400">{business.currency} {((selectedExpense.totalAmount || 0) - (selectedExpense.amountPaid || 0)).toLocaleString()}</span>
                </div>
              </div>

              {/* Note */}
              {selectedExpense.note && (
                <div className="bg-slate-900/50 p-4 rounded-lg">
                  <p className="text-slate-400 text-sm mb-1">Note</p>
                  <p className="text-white">{selectedExpense.note}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3">
                {selectedExpense.paymentStatus !== 'paid' && (
                  <button
                    onClick={() => { setShowViewModal(false); openPaymentModal(selectedExpense); }}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                  >
                    Add Payment
                  </button>
                )}
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showPaymentModal && selectedExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Add Payment</h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handlePayment} className="p-6 space-y-4">
              <div className="bg-slate-900/50 p-4 rounded-lg mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-400">Expense:</span>
                  <span className="text-white">{selectedExpense.referenceNo}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-400">Total Amount:</span>
                  <span className="text-white">{business.currency} {(selectedExpense.totalAmount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount Due:</span>
                  <span className="text-red-400 font-medium">{business.currency} {((selectedExpense.totalAmount || 0) - (selectedExpense.amountPaid || 0)).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Payment Amount *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{business.currency}</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={(selectedExpense.totalAmount || 0) - (selectedExpense.amountPaid || 0)}
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                    className="w-full px-4 py-2 pl-10 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Payment Method</label>
                <select
                  value={paymentData.method}
                  onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Payment Account *</label>
                <select
                  value={paymentData.paymentAccountId}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentAccountId: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  <option value="">Select Account</option>
                  {activeAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({acc.accountType || 'Default'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Payment Date</label>
                <input
                  type="date"
                  value={paymentData.date}
                  onChange={(e) => setPaymentData({ ...paymentData, date: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Note</label>
                <input
                  type="text"
                  value={paymentData.note}
                  onChange={(e) => setPaymentData({ ...paymentData, note: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  placeholder="Optional payment note"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all"
                >
                  Add Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingCategory ? 'Edit Category' : 'Add Expense Category'}
              </h2>
              <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleCategorySubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Category Name *</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  placeholder="e.g., Rent, Utilities, Salary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Category Code</label>
                <input
                  type="text"
                  value={categoryForm.code}
                  onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  placeholder="e.g., EXP-001 (optional)"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all"
                >
                  {editingCategory ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}