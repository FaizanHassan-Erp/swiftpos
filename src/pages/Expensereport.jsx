import { useState, useMemo } from 'react'
import { useApp } from '../Context/AppContext'

export default function ExpenseReport() {
  const { state } = useApp()
  const { expenses = [], expenseCategories = [], paymentAccounts = [], business = {} } = state
  const currency = business.currency || '₨'

  const [dateRange, setDateRange] = useState('this_month')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')

  // Get category name helper
  function getCategoryName(categoryId) {
    const category = expenseCategories.find(c => c.id === categoryId)
    return category?.name || 'Uncategorized'
  }

  // Get account name helper
  function getAccountName(accountId) {
    const account = paymentAccounts.find(a => a.id === accountId)
    return account?.name || '-'
  }

  const getDateRange = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch (dateRange) {
      case 'today': return { start: today, end: new Date(today.getTime() + 86400000) }
      case 'yesterday': return { start: new Date(today.getTime() - 86400000), end: today }
      case 'this_week':
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay())
        return { start: weekStart, end: new Date(today.getTime() + 86400000) }
      case 'last_week':
        const lastWeekEnd = new Date(today)
        lastWeekEnd.setDate(today.getDate() - today.getDay())
        const lastWeekStart = new Date(lastWeekEnd)
        lastWeekStart.setDate(lastWeekEnd.getDate() - 7)
        return { start: lastWeekStart, end: lastWeekEnd }
      case 'this_month': return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(today.getTime() + 86400000) }
      case 'last_month': return { start: new Date(now.getFullYear(), now.getMonth() - 1, 1), end: new Date(now.getFullYear(), now.getMonth(), 1) }
      case 'this_quarter':
        const quarter = Math.floor(now.getMonth() / 3)
        return { start: new Date(now.getFullYear(), quarter * 3, 1), end: new Date(today.getTime() + 86400000) }
      case 'this_year': return { start: new Date(now.getFullYear(), 0, 1), end: new Date(today.getTime() + 86400000) }
      case 'last_year': return { start: new Date(now.getFullYear() - 1, 0, 1), end: new Date(now.getFullYear(), 0, 1) }
      case 'custom': return { 
        start: customStartDate ? new Date(customStartDate) : new Date(0), 
        end: customEndDate ? new Date(new Date(customEndDate).getTime() + 86400000) : new Date() 
      }
      case 'all': return { start: new Date(0), end: new Date(Date.now() + 86400000) }
      default: return { start: new Date(0), end: new Date() }
    }
  }

  const filteredExpenses = useMemo(() => {
    const { start, end } = getDateRange()
    
    return expenses.filter(expense => {
      // Date filter
      const expenseDate = new Date(expense.date || expense.createdAt)
      if (expenseDate < start || expenseDate >= end) return false
      
      // Category filter
      if (selectedCategory !== 'all') {
        if (expense.categoryId !== parseInt(selectedCategory)) return false
      }
      
      // Status filter
      if (selectedStatus !== 'all') {
        const status = expense.paymentStatus || 'due'
        if (status !== selectedStatus) return false
      }
      
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const matchesRef = (expense.referenceNo || '').toLowerCase().includes(search)
        const matchesNote = (expense.note || '').toLowerCase().includes(search)
        const matchesCat = getCategoryName(expense.categoryId).toLowerCase().includes(search)
        if (!matchesRef && !matchesNote && !matchesCat) return false
      }
      
      return true
    }).sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'date': 
          comparison = new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt)
          break
        case 'amount': 
          comparison = (a.totalAmount || 0) - (b.totalAmount || 0)
          break
        case 'category': 
          comparison = getCategoryName(a.categoryId).localeCompare(getCategoryName(b.categoryId))
          break
        default: 
          comparison = 0
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [expenses, dateRange, customStartDate, customEndDate, selectedCategory, selectedStatus, searchTerm, sortBy, sortOrder, expenseCategories])

  const reportStats = useMemo(() => {
    const stats = {
      totalExpenses: 0,
      paidAmount: 0,
      dueAmount: 0,
      partialAmount: 0,
      expenseCount: filteredExpenses.length,
      byCategory: {},
      byMonth: {},
      byPaymentAccount: {},
      averageExpense: 0,
      highestExpense: null,
      lowestExpense: null,
    }

    filteredExpenses.forEach(expense => {
      const amount = expense.totalAmount || 0
      const paid = expense.amountPaid || 0
      const status = expense.paymentStatus || 'due'
      const categoryName = getCategoryName(expense.categoryId)
      const accountName = getAccountName(expense.paymentAccountId)
      const date = new Date(expense.date || expense.createdAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      stats.totalExpenses += amount

      if (status === 'paid') {
        stats.paidAmount += amount
      } else if (status === 'partial') {
        stats.partialAmount += amount
        stats.paidAmount += paid
        stats.dueAmount += (amount - paid)
      } else {
        stats.dueAmount += amount
      }

      // By category
      if (!stats.byCategory[categoryName]) {
        stats.byCategory[categoryName] = { total: 0, count: 0 }
      }
      stats.byCategory[categoryName].total += amount
      stats.byCategory[categoryName].count += 1

      // By month
      if (!stats.byMonth[monthKey]) {
        stats.byMonth[monthKey] = { total: 0, count: 0 }
      }
      stats.byMonth[monthKey].total += amount
      stats.byMonth[monthKey].count += 1

      // By payment account
      if (!stats.byPaymentAccount[accountName]) {
        stats.byPaymentAccount[accountName] = { total: 0, count: 0 }
      }
      stats.byPaymentAccount[accountName].total += amount
      stats.byPaymentAccount[accountName].count += 1

      // Highest/Lowest
      if (!stats.highestExpense || amount > (stats.highestExpense.totalAmount || 0)) {
        stats.highestExpense = expense
      }
      if (!stats.lowestExpense || amount < (stats.lowestExpense.totalAmount || 0)) {
        stats.lowestExpense = expense
      }
    })

    stats.averageExpense = stats.expenseCount > 0 ? stats.totalExpenses / stats.expenseCount : 0
    return stats
  }, [filteredExpenses, expenseCategories, paymentAccounts])

  const formatCurrency = (amount) => `${currency} ${Math.abs(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

  const getPeriodLabel = () => {
    if (dateRange === 'all') return 'All Time'
    const { start, end } = getDateRange()
    const options = { year: 'numeric', month: 'short', day: 'numeric' }
    return `${start.toLocaleDateString('en-US', options)} - ${new Date(end.getTime() - 86400000).toLocaleDateString('en-US', options)}`
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      paid: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Paid' },
      partial: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Partial' },
      due: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Due' },
    }
    const config = statusConfig[status] || statusConfig.due
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>{config.label}</span>
  }

  const getCategoryColor = (index) => {
    const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-cyan-500', 'bg-yellow-500', 'bg-red-500']
    return colors[index % colors.length]
  }

  const handleSort = (field) => {
    if (sortBy === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    else { setSortBy(field); setSortOrder('desc') }
  }

  // Export to CSV
  function exportToCSV() {
    let csvContent = 'Date,Reference No,Category,Account,Status,Total Amount,Amount Paid,Amount Due,Note\n'
    
    filteredExpenses.forEach(expense => {
      const due = (expense.totalAmount || 0) - (expense.amountPaid || 0)
      csvContent += `${formatDate(expense.date || expense.createdAt)},`
      csvContent += `${expense.referenceNo || '-'},`
      csvContent += `"${getCategoryName(expense.categoryId)}",`
      csvContent += `"${getAccountName(expense.paymentAccountId)}",`
      csvContent += `${expense.paymentStatus || 'due'},`
      csvContent += `${(expense.totalAmount || 0).toFixed(2)},`
      csvContent += `${(expense.amountPaid || 0).toFixed(2)},`
      csvContent += `${due.toFixed(2)},`
      csvContent += `"${expense.note || ''}"\n`
    })

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `expense-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Expense Report</h1>
          <p className="text-slate-400 text-sm">{getPeriodLabel()}</p>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0 print:hidden">
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Print
          </button>
          <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm">Total Expenses</span>
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(reportStats.totalExpenses)}</p>
          <p className="text-slate-500 text-xs mt-1">{reportStats.expenseCount} entries</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm">Paid Amount</span>
            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(reportStats.paidAmount)}</p>
          <p className="text-slate-500 text-xs mt-1">{reportStats.totalExpenses > 0 ? ((reportStats.paidAmount / reportStats.totalExpenses) * 100).toFixed(1) : 0}% of total</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm">Due Amount</span>
            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-orange-400">{formatCurrency(reportStats.dueAmount)}</p>
          <p className="text-slate-500 text-xs mt-1">{reportStats.totalExpenses > 0 ? ((reportStats.dueAmount / reportStats.totalExpenses) * 100).toFixed(1) : 0}% pending</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm">Average Expense</span>
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(reportStats.averageExpense)}</p>
          <p className="text-slate-500 text-xs mt-1">per transaction</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 print:hidden">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="erPeriod" className="block text-slate-400 text-sm mb-1">Period</label>
            <select id="erPeriod" name="erPeriod" value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="bg-slate-900 text-white px-4 py-2 rounded-lg border border-slate-700 focus:border-emerald-500 focus:outline-none min-w-[150px]">
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="last_week">Last Week</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_quarter">This Quarter</option>
              <option value="this_year">This Year</option>
              <option value="last_year">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {dateRange === 'custom' && (
            <>
              <div>
                <label htmlFor="erStartDate" className="block text-slate-400 text-sm mb-1">Start Date</label>
                <input id="erStartDate" name="erStartDate" type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="bg-slate-900 text-white px-4 py-2 rounded-lg border border-slate-700 focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label htmlFor="erEndDate" className="block text-slate-400 text-sm mb-1">End Date</label>
                <input id="erEndDate" name="erEndDate" type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="bg-slate-900 text-white px-4 py-2 rounded-lg border border-slate-700 focus:border-emerald-500 focus:outline-none" />
              </div>
            </>
          )}

          <div>
            <label htmlFor="erCategory" className="block text-slate-400 text-sm mb-1">Category</label>
            <select id="erCategory" name="erCategory" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="bg-slate-900 text-white px-4 py-2 rounded-lg border border-slate-700 focus:border-emerald-500 focus:outline-none min-w-[150px]">
              <option value="all">All Categories</option>
              {expenseCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="erStatus" className="block text-slate-400 text-sm mb-1">Status</label>
            <select id="erStatus" name="erStatus" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="bg-slate-900 text-white px-4 py-2 rounded-lg border border-slate-700 focus:border-emerald-500 focus:outline-none min-w-[120px]">
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="due">Due</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label htmlFor="erSearch" className="block text-slate-400 text-sm mb-1">Search</label>
            <div className="relative">
              <input id="erSearch" name="erSearch" autoComplete="off" type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by reference, note, category..." className="w-full bg-slate-900 text-white px-4 py-2 pl-10 rounded-lg border border-slate-700 focus:border-emerald-500 focus:outline-none" />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expense Table */}
        <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Expense Details</h2>
            <span className="text-slate-400 text-sm">{filteredExpenses.length} records</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-900/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('date')}>
                    <div className="flex items-center gap-1">
                      Date 
                      {sortBy === 'date' && (
                        <svg className={`w-3 h-3 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Reference</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('category')}>
                    <div className="flex items-center gap-1">
                      Category
                      {sortBy === 'category' && (
                        <svg className={`w-3 h-3 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('amount')}>
                    <div className="flex items-center justify-end gap-1">
                      Amount
                      {sortBy === 'amount' && (
                        <svg className={`w-3 h-3 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredExpenses.length > 0 ? (
                  filteredExpenses.map((expense, index) => (
                    <tr key={expense.id || index} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-300">{formatDate(expense.date || expense.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-cyan-400 font-mono">{expense.referenceNo || '-'}</div>
                        {expense.note && <div className="text-xs text-slate-500 truncate max-w-[150px]">{expense.note}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">
                          {getCategoryName(expense.categoryId)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-white">
                        {formatCurrency(expense.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getStatusBadge(expense.paymentStatus || 'due')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-3">
                        <svg className="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p>No expenses found for the selected filters</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredExpenses.length > 0 && (
            <div className="px-5 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Total ({filteredExpenses.length} entries)</span>
                <span className="text-lg font-bold text-white">{formatCurrency(reportStats.totalExpenses)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* By Category */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">By Category</h3>
            <div className="space-y-3">
              {Object.entries(reportStats.byCategory)
                .sort((a, b) => b[1].total - a[1].total)
                .slice(0, 8)
                .map(([category, data], index) => {
                  const percentage = reportStats.totalExpenses > 0 ? (data.total / reportStats.totalExpenses) * 100 : 0
                  return (
                    <div key={category}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-400 truncate flex-1">{category}</span>
                        <span className="text-white ml-2">{formatCurrency(data.total)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${getCategoryColor(index)}`} style={{ width: `${percentage}%` }} />
                        </div>
                        <span className="text-slate-500 text-xs w-12 text-right">{percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  )
                })}
              {Object.keys(reportStats.byCategory).length === 0 && (
                <p className="text-slate-500 text-sm text-center py-4">No data available</p>
              )}
            </div>
          </div>

          {/* Payment Status */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">Payment Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-slate-400 text-sm">Paid</span>
                </div>
                <span className="text-emerald-400 font-medium">{formatCurrency(reportStats.paidAmount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-slate-400 text-sm">Partial</span>
                </div>
                <span className="text-yellow-400 font-medium">{formatCurrency(reportStats.partialAmount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-slate-400 text-sm">Due</span>
                </div>
                <span className="text-red-400 font-medium">{formatCurrency(reportStats.dueAmount)}</span>
              </div>
              <div className="h-3 bg-slate-700 rounded-full overflow-hidden flex">
                {reportStats.totalExpenses > 0 && (
                  <>
                    <div className="h-full bg-emerald-500" style={{ width: `${(reportStats.paidAmount / reportStats.totalExpenses) * 100}%` }} />
                    <div className="h-full bg-yellow-500" style={{ width: `${(reportStats.partialAmount / reportStats.totalExpenses) * 100}%` }} />
                    <div className="h-full bg-red-500" style={{ width: `${(reportStats.dueAmount / reportStats.totalExpenses) * 100}%` }} />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Highlights */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">Highlights</h3>
            <div className="space-y-4">
              {reportStats.highestExpense && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    <span className="text-red-400 text-xs font-medium">Highest Expense</span>
                  </div>
                  <p className="text-white font-semibold">{formatCurrency(reportStats.highestExpense.totalAmount)}</p>
                  <p className="text-slate-400 text-xs">
                    {getCategoryName(reportStats.highestExpense.categoryId)} • {formatDate(reportStats.highestExpense.date || reportStats.highestExpense.createdAt)}
                  </p>
                </div>
              )}
              {reportStats.lowestExpense && reportStats.expenseCount > 1 && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    <span className="text-emerald-400 text-xs font-medium">Lowest Expense</span>
                  </div>
                  <p className="text-white font-semibold">{formatCurrency(reportStats.lowestExpense.totalAmount)}</p>
                  <p className="text-slate-400 text-xs">
                    {getCategoryName(reportStats.lowestExpense.categoryId)} • {formatDate(reportStats.lowestExpense.date || reportStats.lowestExpense.createdAt)}
                  </p>
                </div>
              )}
              {!reportStats.highestExpense && (
                <p className="text-slate-500 text-sm text-center py-4">No expense data available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}