import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'

export default function Registerreport() {
  const { state } = useApp()
  const { registerSessions = [], sales = [], business } = state
  const currency = business?.currency || 'Rs'

  // Filters
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [statusFilter, setStatusFilter] = useState('all')
  const [discrepancyFilter, setDiscrepancyFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('summary') // summary, detailed, daily
  const [sortConfig, setSortConfig] = useState({ key: 'openedAt', direction: 'desc' })

  // Calculate session sales
  const getSessionSales = (session) => {
    if (!session) return { cash: 0, card: 0, other: 0, total: 0, count: 0 }
    
    const sessionStart = new Date(session.openedAt)
    const sessionEnd = session.closedAt ? new Date(session.closedAt) : new Date()

    const sessionSales = sales.filter(sale => {
      const saleDate = new Date(sale.createdAt || sale.date)
      return saleDate >= sessionStart && saleDate <= sessionEnd
    })

    const cash = sessionSales
      .filter(s => s.paymentMethod === 'cash' || s.paymentMethod === 'Cash')
      .reduce((sum, s) => sum + (s.total || s.grandTotal || 0), 0)
    
    const card = sessionSales
      .filter(s => s.paymentMethod === 'card' || s.paymentMethod === 'Card' || s.paymentMethod === 'Credit Card')
      .reduce((sum, s) => sum + (s.total || s.grandTotal || 0), 0)
    
    const other = sessionSales
      .filter(s => !['cash', 'Cash', 'card', 'Card', 'Credit Card'].includes(s.paymentMethod))
      .reduce((sum, s) => sum + (s.total || s.grandTotal || 0), 0)

    return {
      cash,
      card,
      other,
      total: cash + card + other,
      count: sessionSales.length
    }
  }

  // Calculate expected cash for a session
  const getExpectedCash = (session) => {
    if (!session) return 0
    const sessionSales = getSessionSales(session)
    const cashIn = (session.cashMovements || [])
      .filter(m => m.type === 'in')
      .reduce((sum, m) => sum + m.amount, 0)
    const cashOut = (session.cashMovements || [])
      .filter(m => m.type === 'out')
      .reduce((sum, m) => sum + m.amount, 0)
    
    return session.openingAmount + sessionSales.cash + cashIn - cashOut
  }

  // Get session duration
  const getSessionDuration = (session) => {
    if (!session.openedAt) return '-'
    const start = new Date(session.openedAt)
    const end = session.closedAt ? new Date(session.closedAt) : new Date()
    const diffMs = end - start
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  // Filter sessions
  const filteredSessions = registerSessions.filter(session => {
    const sessionDate = new Date(session.openedAt)
    const startDate = new Date(dateRange.start)
    const endDate = new Date(dateRange.end)
    endDate.setHours(23, 59, 59, 999)

    const matchesDate = sessionDate >= startDate && sessionDate <= endDate
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter
    const matchesSearch = session.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.openedBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.closedBy?.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Discrepancy filter
    let matchesDiscrepancy = true
    if (discrepancyFilter !== 'all' && session.status === 'closed') {
      const diff = session.difference || 0
      if (discrepancyFilter === 'balanced') matchesDiscrepancy = diff === 0
      else if (discrepancyFilter === 'over') matchesDiscrepancy = diff > 0
      else if (discrepancyFilter === 'short') matchesDiscrepancy = diff < 0
    }

    return matchesDate && matchesStatus && matchesSearch && matchesDiscrepancy
  })

  // Sort sessions
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    let aVal, bVal
    switch (sortConfig.key) {
      case 'openedAt':
        aVal = new Date(a.openedAt)
        bVal = new Date(b.openedAt)
        break
      case 'closedAt':
        aVal = a.closedAt ? new Date(a.closedAt) : new Date(0)
        bVal = b.closedAt ? new Date(b.closedAt) : new Date(0)
        break
      case 'openingAmount':
        aVal = a.openingAmount || 0
        bVal = b.openingAmount || 0
        break
      case 'closingAmount':
        aVal = a.closingAmount || 0
        bVal = b.closingAmount || 0
        break
      case 'difference':
        aVal = a.difference || 0
        bVal = b.difference || 0
        break
      case 'totalSales':
        aVal = getSessionSales(a).total
        bVal = getSessionSales(b).total
        break
      default:
        aVal = a[sortConfig.key]
        bVal = b[sortConfig.key]
    }
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  // Calculate summary stats
  const totalSessions = sortedSessions.length
  const closedSessions = sortedSessions.filter(s => s.status === 'closed')
  const openSessions = sortedSessions.filter(s => s.status === 'open')
  
  const totalCashSales = sortedSessions.reduce((sum, s) => sum + getSessionSales(s).cash, 0)
  const totalCardSales = sortedSessions.reduce((sum, s) => sum + getSessionSales(s).card, 0)
  const totalOtherSales = sortedSessions.reduce((sum, s) => sum + getSessionSales(s).other, 0)
  const totalAllSales = totalCashSales + totalCardSales + totalOtherSales
  const totalTransactions = sortedSessions.reduce((sum, s) => sum + getSessionSales(s).count, 0)

  const totalDiscrepancy = closedSessions.reduce((sum, s) => sum + (s.difference || 0), 0)
  const shortSessions = closedSessions.filter(s => (s.difference || 0) < 0)
  const overSessions = closedSessions.filter(s => (s.difference || 0) > 0)
  const balancedSessions = closedSessions.filter(s => (s.difference || 0) === 0)

  const totalCashIn = sortedSessions.reduce((sum, s) => 
    sum + (s.cashMovements || []).filter(m => m.type === 'in').reduce((s, m) => s + m.amount, 0), 0)
  const totalCashOut = sortedSessions.reduce((sum, s) => 
    sum + (s.cashMovements || []).filter(m => m.type === 'out').reduce((s, m) => s + m.amount, 0), 0)

  // Daily aggregation for chart and daily view
  const dailyData = {}
  sortedSessions.forEach(session => {
    const date = new Date(session.openedAt).toISOString().split('T')[0]
    if (!dailyData[date]) {
      dailyData[date] = {
        date,
        sessions: 0,
        cashSales: 0,
        cardSales: 0,
        totalSales: 0,
        transactions: 0,
        discrepancy: 0,
        cashIn: 0,
        cashOut: 0
      }
    }
    const sales = getSessionSales(session)
    dailyData[date].sessions++
    dailyData[date].cashSales += sales.cash
    dailyData[date].cardSales += sales.card
    dailyData[date].totalSales += sales.total
    dailyData[date].transactions += sales.count
    if (session.status === 'closed') {
      dailyData[date].discrepancy += session.difference || 0
    }
    dailyData[date].cashIn += (session.cashMovements || []).filter(m => m.type === 'in').reduce((s, m) => s + m.amount, 0)
    dailyData[date].cashOut += (session.cashMovements || []).filter(m => m.type === 'out').reduce((s, m) => s + m.amount, 0)
  })
  const dailyArray = Object.values(dailyData).sort((a, b) => new Date(a.date) - new Date(b.date))

  // Max value for chart scaling
  const maxSales = Math.max(...dailyArray.map(d => d.totalSales), 1)

  function handleSort(key) {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  function exportToCSV() {
    const headers = ['Session ID', 'Opened At', 'Closed At', 'Duration', 'Opened By', 'Closed By', 'Opening Amount', 'Cash Sales', 'Card Sales', 'Total Sales', 'Transactions', 'Cash In', 'Cash Out', 'Expected', 'Actual', 'Difference', 'Status']
    const rows = sortedSessions.map(session => {
      const sales = getSessionSales(session)
      const expected = session.status === 'closed' ? session.expectedAmount : getExpectedCash(session)
      const cashIn = (session.cashMovements || []).filter(m => m.type === 'in').reduce((s, m) => s + m.amount, 0)
      const cashOut = (session.cashMovements || []).filter(m => m.type === 'out').reduce((s, m) => s + m.amount, 0)
      
      return [
        session.id,
        new Date(session.openedAt).toLocaleString(),
        session.closedAt ? new Date(session.closedAt).toLocaleString() : '-',
        getSessionDuration(session),
        session.openedBy || 'Admin',
        session.closedBy || '-',
        (session.openingAmount || 0).toFixed(2),
        sales.cash.toFixed(2),
        sales.card.toFixed(2),
        sales.total.toFixed(2),
        sales.count,
        cashIn.toFixed(2),
        cashOut.toFixed(2),
        (expected || 0).toFixed(2),
        session.closingAmount !== undefined ? session.closingAmount.toFixed(2) : '-',
        session.difference !== undefined ? session.difference.toFixed(2) : '-',
        session.status === 'open' ? 'Open' : 'Closed'
      ]
    })

    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `register-report-${dateRange.start}-to-${dateRange.end}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Register Report</h1>
          <p className="text-slate-400 text-sm">Analyze cash register sessions and discrepancies</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Discrepancy</label>
            <select
              value={discrepancyFilter}
              onChange={(e) => setDiscrepancyFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="all">All</option>
              <option value="balanced">Balanced</option>
              <option value="over">Over</option>
              <option value="short">Short</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Session ID, User..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-blue-500/20 rounded-lg">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="text-slate-400 text-sm">Sessions</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalSessions}</p>
          <p className="text-xs text-slate-500">{openSessions.length} open, {closedSessions.length} closed</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-emerald-500/20 rounded-lg">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="text-slate-400 text-sm">Cash Sales</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{currency} {totalCashSales.toLocaleString()}</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-purple-500/20 rounded-lg">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <span className="text-slate-400 text-sm">Card Sales</span>
          </div>
          <p className="text-2xl font-bold text-purple-400">{currency} {totalCardSales.toLocaleString()}</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-cyan-500/20 rounded-lg">
              <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="text-slate-400 text-sm">Total Sales</span>
          </div>
          <p className="text-2xl font-bold text-cyan-400">{currency} {totalAllSales.toLocaleString()}</p>
          <p className="text-xs text-slate-500">{totalTransactions} transactions</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-yellow-500/20 rounded-lg">
              <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <span className="text-slate-400 text-sm">Cash Flow</span>
          </div>
          <p className="text-sm text-emerald-400">In: {currency} {totalCashIn.toLocaleString()}</p>
          <p className="text-sm text-red-400">Out: {currency} {totalCashOut.toLocaleString()}</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded-lg ${totalDiscrepancy === 0 ? 'bg-emerald-500/20' : totalDiscrepancy > 0 ? 'bg-blue-500/20' : 'bg-red-500/20'}`}>
              <svg className={`w-4 h-4 ${totalDiscrepancy === 0 ? 'text-emerald-400' : totalDiscrepancy > 0 ? 'text-blue-400' : 'text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <span className="text-slate-400 text-sm">Discrepancy</span>
          </div>
          <p className={`text-2xl font-bold ${totalDiscrepancy === 0 ? 'text-emerald-400' : totalDiscrepancy > 0 ? 'text-blue-400' : 'text-red-400'}`}>
            {totalDiscrepancy >= 0 ? '+' : ''}{currency} {totalDiscrepancy.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500">{shortSessions.length} short, {overSessions.length} over</p>
        </div>
      </div>

      {/* Discrepancy Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-400 text-sm font-medium">Balanced Sessions</p>
              <p className="text-3xl font-bold text-white">{balancedSessions.length}</p>
            </div>
            <div className="p-3 bg-emerald-500/20 rounded-xl">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <p className="text-slate-400 text-xs mt-2">
            {closedSessions.length > 0 ? ((balancedSessions.length / closedSessions.length) * 100).toFixed(1) : 0}% of closed sessions
          </p>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-400 text-sm font-medium">Over Sessions</p>
              <p className="text-3xl font-bold text-white">{overSessions.length}</p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </div>
          </div>
          <p className="text-slate-400 text-xs mt-2">
            Total over: {currency} {overSessions.reduce((sum, s) => sum + (s.difference || 0), 0).toLocaleString()}
          </p>
        </div>

        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-400 text-sm font-medium">Short Sessions</p>
              <p className="text-3xl font-bold text-white">{shortSessions.length}</p>
            </div>
            <div className="p-3 bg-red-500/20 rounded-xl">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
          <p className="text-slate-400 text-xs mt-2">
            Total short: {currency} {Math.abs(shortSessions.reduce((sum, s) => sum + (s.difference || 0), 0)).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Daily Sales Chart */}
      {dailyArray.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <h3 className="text-white font-medium mb-4">Daily Sales Trend</h3>
          <div className="h-48 flex items-end gap-1">
            {dailyArray.slice(-30).map((day, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col gap-0.5" style={{ height: '160px' }}>
                  <div 
                    className="w-full bg-emerald-500 rounded-t"
                    style={{ height: `${(day.cashSales / maxSales) * 100}%` }}
                    title={`Cash: ${currency} ${day.cashSales.toLocaleString()}`}
                  />
                  <div 
                    className="w-full bg-purple-500"
                    style={{ height: `${(day.cardSales / maxSales) * 100}%` }}
                    title={`Card: ${currency} ${day.cardSales.toLocaleString()}`}
                  />
                </div>
                <span className="text-[10px] text-slate-500 transform -rotate-45 origin-left">
                  {new Date(day.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded"></div>
              <span className="text-slate-400 text-xs">Cash Sales</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <span className="text-slate-400 text-xs">Card Sales</span>
            </div>
          </div>
        </div>
      )}

      {/* View Mode Tabs */}
      <div className="flex gap-2 border-b border-slate-700">
        <button
          onClick={() => setViewMode('summary')}
          className={`px-4 py-2 font-medium transition-colors ${
            viewMode === 'summary' 
              ? 'text-emerald-400 border-b-2 border-emerald-400' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Session Summary
        </button>
        <button
          onClick={() => setViewMode('detailed')}
          className={`px-4 py-2 font-medium transition-colors ${
            viewMode === 'detailed' 
              ? 'text-emerald-400 border-b-2 border-emerald-400' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Detailed View
        </button>
        <button
          onClick={() => setViewMode('daily')}
          className={`px-4 py-2 font-medium transition-colors ${
            viewMode === 'daily' 
              ? 'text-emerald-400 border-b-2 border-emerald-400' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Daily Summary
        </button>
      </div>

      {/* Session Summary View */}
      {viewMode === 'summary' && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-900/50">
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm cursor-pointer hover:text-white" onClick={() => handleSort('id')}>
                    Session ID {sortConfig.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm cursor-pointer hover:text-white" onClick={() => handleSort('openedAt')}>
                    Opened {sortConfig.key === 'openedAt' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Duration</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm cursor-pointer hover:text-white" onClick={() => handleSort('totalSales')}>
                    Total Sales {sortConfig.key === 'totalSales' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Cash / Card</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm cursor-pointer hover:text-white" onClick={() => handleSort('difference')}>
                    Difference {sortConfig.key === 'difference' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedSessions.map(session => {
                  const sales = getSessionSales(session)
                  return (
                    <tr key={session.id} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                      <td className="px-4 py-3 text-cyan-400 font-mono text-sm">{session.id}</td>
                      <td className="px-4 py-3 text-white">
                        <div>{new Date(session.openedAt).toLocaleDateString()}</div>
                        <div className="text-slate-400 text-xs">{new Date(session.openedAt).toLocaleTimeString()}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-300 text-sm">{getSessionDuration(session)}</td>
                      <td className="px-4 py-3 text-right text-white font-medium">{currency} {sales.total.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-emerald-400">{currency} {sales.cash.toLocaleString()}</span>
                        <span className="text-slate-500 mx-1">/</span>
                        <span className="text-purple-400">{currency} {sales.card.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {session.difference !== undefined ? (
                          <span className={`font-medium ${
                            session.difference === 0 ? 'text-emerald-400' :
                            session.difference > 0 ? 'text-blue-400' : 'text-red-400'
                          }`}>
                            {session.difference >= 0 ? '+' : ''}{currency} {session.difference.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          session.status === 'open' 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : 'bg-slate-500/20 text-slate-400'
                        }`}>
                          {session.status === 'open' ? 'Open' : 'Closed'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {sortedSessions.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-slate-500">
                      No sessions found for the selected filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detailed View */}
      {viewMode === 'detailed' && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-900/50">
                  <th className="text-left px-3 py-3 text-slate-400 font-medium">Session</th>
                  <th className="text-left px-3 py-3 text-slate-400 font-medium">Opened</th>
                  <th className="text-left px-3 py-3 text-slate-400 font-medium">Closed</th>
                  <th className="text-left px-3 py-3 text-slate-400 font-medium">By</th>
                  <th className="text-right px-3 py-3 text-slate-400 font-medium">Opening</th>
                  <th className="text-right px-3 py-3 text-slate-400 font-medium">Cash Sales</th>
                  <th className="text-right px-3 py-3 text-slate-400 font-medium">Card Sales</th>
                  <th className="text-right px-3 py-3 text-slate-400 font-medium">Cash In</th>
                  <th className="text-right px-3 py-3 text-slate-400 font-medium">Cash Out</th>
                  <th className="text-right px-3 py-3 text-slate-400 font-medium">Expected</th>
                  <th className="text-right px-3 py-3 text-slate-400 font-medium">Actual</th>
                  <th className="text-right px-3 py-3 text-slate-400 font-medium">Diff</th>
                </tr>
              </thead>
              <tbody>
                {sortedSessions.map(session => {
                  const sales = getSessionSales(session)
                  const expected = session.status === 'closed' ? session.expectedAmount : getExpectedCash(session)
                  const cashIn = (session.cashMovements || []).filter(m => m.type === 'in').reduce((s, m) => s + m.amount, 0)
                  const cashOut = (session.cashMovements || []).filter(m => m.type === 'out').reduce((s, m) => s + m.amount, 0)
                  
                  return (
                    <tr key={session.id} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                      <td className="px-3 py-2 text-cyan-400 font-mono">{session.id}</td>
                      <td className="px-3 py-2 text-white">{new Date(session.openedAt).toLocaleString()}</td>
                      <td className="px-3 py-2 text-white">{session.closedAt ? new Date(session.closedAt).toLocaleString() : '-'}</td>
                      <td className="px-3 py-2 text-slate-300">{session.openedBy || 'Admin'}</td>
                      <td className="px-3 py-2 text-right text-white">{currency} {(session.openingAmount || 0).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-emerald-400">{currency} {sales.cash.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-purple-400">{currency} {sales.card.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-emerald-400">{cashIn > 0 ? `+${currency} ${cashIn.toLocaleString()}` : '-'}</td>
                      <td className="px-3 py-2 text-right text-red-400">{cashOut > 0 ? `-${currency} ${cashOut.toLocaleString()}` : '-'}</td>
                      <td className="px-3 py-2 text-right text-yellow-400">{currency} {(expected || 0).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-white">{session.closingAmount !== undefined ? `${currency} ${session.closingAmount.toLocaleString()}` : '-'}</td>
                      <td className="px-3 py-2 text-right">
                        {session.difference !== undefined ? (
                          <span className={`font-medium ${
                            session.difference === 0 ? 'text-emerald-400' :
                            session.difference > 0 ? 'text-blue-400' : 'text-red-400'
                          }`}>
                            {session.difference >= 0 ? '+' : ''}{currency} {session.difference.toLocaleString()}
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Daily Summary View */}
      {viewMode === 'daily' && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-900/50">
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Date</th>
                  <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Sessions</th>
                  <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Transactions</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Cash Sales</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Card Sales</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Total Sales</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Cash In</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Cash Out</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Discrepancy</th>
                </tr>
              </thead>
              <tbody>
                {dailyArray.map((day, idx) => (
                  <tr key={idx} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                    <td className="px-4 py-3 text-white font-medium">
                      {new Date(day.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-300">{day.sessions}</td>
                    <td className="px-4 py-3 text-center text-slate-300">{day.transactions}</td>
                    <td className="px-4 py-3 text-right text-emerald-400">{currency} {day.cashSales.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-purple-400">{currency} {day.cardSales.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-cyan-400 font-medium">{currency} {day.totalSales.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-emerald-400">{day.cashIn > 0 ? `+${currency} ${day.cashIn.toLocaleString()}` : '-'}</td>
                    <td className="px-4 py-3 text-right text-red-400">{day.cashOut > 0 ? `-${currency} ${day.cashOut.toLocaleString()}` : '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-medium ${
                        day.discrepancy === 0 ? 'text-emerald-400' :
                        day.discrepancy > 0 ? 'text-blue-400' : 'text-red-400'
                      }`}>
                        {day.discrepancy >= 0 ? '+' : ''}{currency} {day.discrepancy.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
                {dailyArray.length === 0 && (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-slate-500">
                      No data for the selected date range
                    </td>
                  </tr>
                )}
              </tbody>
              {dailyArray.length > 0 && (
                <tfoot className="bg-slate-900/50">
                  <tr className="border-t border-slate-600">
                    <td className="px-4 py-3 text-white font-bold">Total</td>
                    <td className="px-4 py-3 text-center text-white font-bold">{totalSessions}</td>
                    <td className="px-4 py-3 text-center text-white font-bold">{totalTransactions}</td>
                    <td className="px-4 py-3 text-right text-emerald-400 font-bold">{currency} {totalCashSales.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-purple-400 font-bold">{currency} {totalCardSales.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-cyan-400 font-bold">{currency} {totalAllSales.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-emerald-400 font-bold">+{currency} {totalCashIn.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-red-400 font-bold">-{currency} {totalCashOut.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${
                        totalDiscrepancy === 0 ? 'text-emerald-400' :
                        totalDiscrepancy > 0 ? 'text-blue-400' : 'text-red-400'
                      }`}>
                        {totalDiscrepancy >= 0 ? '+' : ''}{currency} {totalDiscrepancy.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  )
}