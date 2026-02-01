import { useState, useMemo } from 'react'
import { useApp } from '../Context/AppContext'

export default function Suppliercustomerreport() {
  const { state } = useApp()
  const { 
    suppliers, 
    customers, 
    purchases, 
    sales, 
    purchasePayments, 
    salePayments,
    purchaseReturns,
    saleReturns,
    business 
  } = state

  // Filters
  const [viewMode, setViewMode] = useState('suppliers') // suppliers, customers
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // all, active, inactive, with_balance
  const [sortBy, setSortBy] = useState('total_amount') // total_amount, balance, transactions, name

  // Calculate supplier statistics
  const supplierStats = useMemo(() => {
    return (suppliers || []).map(supplier => {
      // Get all purchases for this supplier
      const supplierPurchases = (purchases || []).filter(p => p.supplierId === supplier.id)
      const totalPurchases = supplierPurchases.reduce((sum, p) => sum + (p.total || 0), 0)
      const purchaseCount = supplierPurchases.length

      // Get all payments to this supplier
      const supplierPayments = (purchasePayments || []).filter(p => p.supplierId === supplier.id)
      const totalPaid = supplierPayments.reduce((sum, p) => sum + (p.amount || 0), 0)

      // Get all purchase returns from this supplier
      const supplierReturns = (purchaseReturns || []).filter(pr => pr.supplierId === supplier.id)
      const totalReturns = supplierReturns.reduce((sum, pr) => sum + (pr.total || 0), 0)

      // Calculate balance
      const openingBalance = supplier.openingBalance || 0
      const calculatedBalance = openingBalance + totalPurchases - totalPaid - totalReturns
      const balance = supplier.balance !== undefined ? supplier.balance : calculatedBalance

      // Get last transaction date
      const lastPurchaseDate = supplierPurchases.length > 0 
        ? new Date(Math.max(...supplierPurchases.map(p => new Date(p.date || p.createdAt))))
        : null

      return {
        id: supplier.id,
        name: supplier.businessName || supplier.name,
        contactName: supplier.name,
        phone: supplier.phone,
        email: supplier.email,
        status: supplier.status || 'active',
        openingBalance,
        totalPurchases,
        purchaseCount,
        totalPaid,
        totalReturns,
        balance,
        advanceBalance: supplier.advanceBalance || 0,
        lastTransactionDate: lastPurchaseDate,
        payTerm: supplier.payTerm
      }
    })
  }, [suppliers, purchases, purchasePayments, purchaseReturns])

  // Calculate customer statistics
  const customerStats = useMemo(() => {
    return (customers || []).map(customer => {
      // Get all sales for this customer
      const customerSales = (sales || []).filter(s => s.customerId === customer.id)
      const totalSales = customerSales.reduce((sum, s) => sum + (s.total || 0), 0)
      const saleCount = customerSales.length

      // Get all payments from this customer
      const customerPayments = (salePayments || []).filter(p => p.customerId === customer.id)
      const totalReceived = customerPayments.reduce((sum, p) => sum + (p.amount || 0), 0)

      // Get all sale returns for this customer
      const customerReturns = (saleReturns || []).filter(sr => sr.customerId === customer.id)
      const totalReturns = customerReturns.reduce((sum, sr) => sum + (sr.total || 0), 0)

      // Calculate balance
      const openingBalance = customer.openingBalance || 0
      const calculatedBalance = openingBalance + totalSales - totalReceived - totalReturns
      const balance = customer.balance !== undefined ? customer.balance : calculatedBalance

      // Get last transaction date
      const lastSaleDate = customerSales.length > 0 
        ? new Date(Math.max(...customerSales.map(s => new Date(s.date || s.createdAt))))
        : null

      return {
        id: customer.id,
        name: customer.name || 'Walk-in Customer',
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        status: customer.status || 'active',
        openingBalance,
        totalSales,
        saleCount,
        totalReceived,
        totalReturns,
        balance,
        advanceBalance: customer.advanceBalance || 0,
        lastTransactionDate: lastSaleDate
      }
    })
  }, [customers, sales, salePayments, saleReturns])

  // Filter and sort data
  const filteredData = useMemo(() => {
    let data = viewMode === 'suppliers' ? supplierStats : customerStats

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      data = data.filter(item => 
        item.name?.toLowerCase().includes(search) ||
        item.phone?.includes(search) ||
        item.email?.toLowerCase().includes(search)
      )
    }

    // Apply status filter
    if (statusFilter === 'active') {
      data = data.filter(item => item.status === 'active')
    } else if (statusFilter === 'inactive') {
      data = data.filter(item => item.status === 'inactive')
    } else if (statusFilter === 'with_balance') {
      data = data.filter(item => item.balance > 0)
    }

    // Apply sorting
    data = [...data].sort((a, b) => {
      switch (sortBy) {
        case 'total_amount':
          return viewMode === 'suppliers' 
            ? b.totalPurchases - a.totalPurchases 
            : b.totalSales - a.totalSales
        case 'balance':
          return b.balance - a.balance
        case 'transactions':
          return viewMode === 'suppliers'
            ? b.purchaseCount - a.purchaseCount
            : b.saleCount - a.saleCount
        case 'name':
          return (a.name || '').localeCompare(b.name || '')
        default:
          return 0
      }
    })

    return data
  }, [viewMode, supplierStats, customerStats, searchTerm, statusFilter, sortBy])

  // Summary calculations
  const summary = useMemo(() => {
    if (viewMode === 'suppliers') {
      const totalPurchases = supplierStats.reduce((sum, s) => sum + s.totalPurchases, 0)
      const totalPaid = supplierStats.reduce((sum, s) => sum + s.totalPaid, 0)
      const totalReturns = supplierStats.reduce((sum, s) => sum + s.totalReturns, 0)
      const totalBalance = supplierStats.reduce((sum, s) => sum + s.balance, 0)
      const totalAdvance = supplierStats.reduce((sum, s) => sum + s.advanceBalance, 0)
      const activeSuppliers = supplierStats.filter(s => s.status === 'active').length
      const withBalance = supplierStats.filter(s => s.balance > 0).length

      return {
        totalAmount: totalPurchases,
        totalPaidReceived: totalPaid,
        totalReturns,
        totalBalance,
        totalAdvance,
        activeCount: activeSuppliers,
        totalCount: supplierStats.length,
        withBalanceCount: withBalance
      }
    } else {
      const totalSales = customerStats.reduce((sum, c) => sum + c.totalSales, 0)
      const totalReceived = customerStats.reduce((sum, c) => sum + c.totalReceived, 0)
      const totalReturns = customerStats.reduce((sum, c) => sum + c.totalReturns, 0)
      const totalBalance = customerStats.reduce((sum, c) => sum + c.balance, 0)
      const totalAdvance = customerStats.reduce((sum, c) => sum + c.advanceBalance, 0)
      const activeCustomers = customerStats.filter(c => c.status === 'active').length
      const withBalance = customerStats.filter(c => c.balance > 0).length

      return {
        totalAmount: totalSales,
        totalPaidReceived: totalReceived,
        totalReturns,
        totalBalance,
        totalAdvance,
        activeCount: activeCustomers,
        totalCount: customerStats.length,
        withBalanceCount: withBalance
      }
    }
  }, [viewMode, supplierStats, customerStats])

  // Export to CSV
  function exportToCSV() {
    let csvContent = ''
    
    if (viewMode === 'suppliers') {
      csvContent = 'Name,Phone,Email,Status,Total Purchases,Total Paid,Returns,Balance,Advance\n'
      filteredData.forEach(s => {
        csvContent += `"${s.name}",`
        csvContent += `${s.phone || '-'},`
        csvContent += `${s.email || '-'},`
        csvContent += `${s.status},`
        csvContent += `${s.totalPurchases.toFixed(2)},`
        csvContent += `${s.totalPaid.toFixed(2)},`
        csvContent += `${s.totalReturns.toFixed(2)},`
        csvContent += `${s.balance.toFixed(2)},`
        csvContent += `${s.advanceBalance.toFixed(2)}\n`
      })
    } else {
      csvContent = 'Name,Phone,Email,Status,Total Sales,Total Received,Returns,Balance,Advance\n'
      filteredData.forEach(c => {
        csvContent += `"${c.name}",`
        csvContent += `${c.phone || '-'},`
        csvContent += `${c.email || '-'},`
        csvContent += `${c.status},`
        csvContent += `${c.totalSales.toFixed(2)},`
        csvContent += `${c.totalReceived.toFixed(2)},`
        csvContent += `${c.totalReturns.toFixed(2)},`
        csvContent += `${c.balance.toFixed(2)},`
        csvContent += `${c.advanceBalance.toFixed(2)}\n`
      })
    }

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${viewMode}-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Print report
  function printReport() {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-white">Supplier & Customer Report</h1>
          <p className="text-slate-400 text-sm">Overview of supplier and customer accounts</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
          <button
            onClick={printReport}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-2 inline-flex gap-2">
        <button
          onClick={() => setViewMode('suppliers')}
          className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
            viewMode === 'suppliers'
              ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Suppliers ({supplierStats.length})
        </button>
        <button
          onClick={() => setViewMode('customers')}
          className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
            viewMode === 'customers'
              ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Customers ({customerStats.length})
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 ${viewMode === 'suppliers' ? 'bg-orange-500/20' : 'bg-cyan-500/20'} rounded-lg flex items-center justify-center`}>
              <svg className={`w-4 h-4 ${viewMode === 'suppliers' ? 'text-orange-400' : 'text-cyan-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-slate-400 text-xs">{viewMode === 'suppliers' ? 'Total Purchases' : 'Total Sales'}</p>
          <p className={`text-xl font-bold ${viewMode === 'suppliers' ? 'text-orange-400' : 'text-cyan-400'}`}>
            {business.currency} {summary.totalAmount.toLocaleString()}
          </p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-slate-400 text-xs">{viewMode === 'suppliers' ? 'Total Paid' : 'Total Received'}</p>
          <p className="text-xl font-bold text-emerald-400">{business.currency} {summary.totalPaidReceived.toLocaleString()}</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
              </svg>
            </div>
          </div>
          <p className="text-slate-400 text-xs">Total Returns</p>
          <p className="text-xl font-bold text-red-400">{business.currency} {summary.totalReturns.toLocaleString()}</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-slate-400 text-xs">Balance Due</p>
          <p className="text-xl font-bold text-yellow-400">{business.currency} {summary.totalBalance.toLocaleString()}</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <p className="text-slate-400 text-xs">Advance Balance</p>
          <p className="text-xl font-bold text-purple-400">{business.currency} {summary.totalAdvance.toLocaleString()}</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <p className="text-slate-400 text-xs">Active</p>
          <p className="text-xl font-bold text-blue-400">{summary.activeCount} / {summary.totalCount}</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <p className="text-slate-400 text-xs">With Balance</p>
          <p className="text-xl font-bold text-pink-400">{summary.withBalanceCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 print:hidden">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder={`Search ${viewMode}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
              <option value="with_balance">With Balance Due</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="total_amount">Sort by {viewMode === 'suppliers' ? 'Purchases' : 'Sales'}</option>
              <option value="balance">Sort by Balance</option>
              <option value="transactions">Sort by Transactions</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-900/50">
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">#</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Name</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Contact</th>
                <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Status</th>
                <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">
                  {viewMode === 'suppliers' ? 'Purchases' : 'Sales'}
                </th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">
                  {viewMode === 'suppliers' ? 'Total Purchased' : 'Total Sales'}
                </th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">
                  {viewMode === 'suppliers' ? 'Paid' : 'Received'}
                </th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Returns</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Balance</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Last Transaction</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-12 text-slate-500">
                    No {viewMode} found
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => (
                  <tr key={item.id} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-yellow-500 text-black' :
                        index === 1 ? 'bg-slate-400 text-black' :
                        index === 2 ? 'bg-orange-600 text-white' :
                        'bg-slate-700 text-white'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white font-medium">{item.name}</p>
                        {viewMode === 'suppliers' && item.contactName && item.contactName !== item.name && (
                          <p className="text-slate-500 text-xs">{item.contactName}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-slate-300 text-sm">{item.phone || '-'}</p>
                        <p className="text-slate-500 text-xs">{item.email || '-'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.status === 'active' 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-white">
                      {viewMode === 'suppliers' ? item.purchaseCount : item.saleCount}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={viewMode === 'suppliers' ? 'text-orange-400' : 'text-cyan-400'}>
                        {business.currency} {(viewMode === 'suppliers' ? item.totalPurchases : item.totalSales).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-400">
                      {business.currency} {(viewMode === 'suppliers' ? item.totalPaid : item.totalReceived).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-red-400">
                      {item.totalReturns > 0 ? `${business.currency} ${item.totalReturns.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-medium ${
                        item.balance > 0 ? 'text-yellow-400' : 
                        item.balance < 0 ? 'text-emerald-400' : 'text-slate-400'
                      }`}>
                        {business.currency} {item.balance.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-sm">
                      {item.lastTransactionDate 
                        ? new Date(item.lastTransactionDate).toLocaleDateString() 
                        : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredData.length > 0 && (
              <tfoot>
                <tr className="bg-slate-900/50 border-t border-slate-700">
                  <td colSpan="5" className="px-4 py-3 text-white font-bold">Total</td>
                  <td className="px-4 py-3 text-right font-bold">
                    <span className={viewMode === 'suppliers' ? 'text-orange-400' : 'text-cyan-400'}>
                      {business.currency} {summary.totalAmount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-400 font-bold">
                    {business.currency} {summary.totalPaidReceived.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-red-400 font-bold">
                    {business.currency} {summary.totalReturns.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-yellow-400 font-bold">
                    {business.currency} {summary.totalBalance.toLocaleString()}
                  </td>
                  <td className="px-4 py-3"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-4 border-t border-slate-700/50">
          <span className="text-slate-400 text-sm">
            Showing {filteredData.length} of {viewMode === 'suppliers' ? supplierStats.length : customerStats.length} {viewMode}
          </span>
        </div>
      </div>

      {/* Top 5 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top by Amount */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <span className="text-xl">🏆</span>
            Top 5 by {viewMode === 'suppliers' ? 'Purchases' : 'Sales'}
          </h3>
          <div className="space-y-3">
            {[...filteredData]
              .sort((a, b) => viewMode === 'suppliers' 
                ? b.totalPurchases - a.totalPurchases 
                : b.totalSales - a.totalSales)
              .slice(0, 5)
              .map((item, index) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-500 text-black' :
                      index === 1 ? 'bg-slate-400 text-black' :
                      index === 2 ? 'bg-orange-600 text-white' :
                      'bg-slate-700 text-white'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="text-white">{item.name}</span>
                  </div>
                  <span className={viewMode === 'suppliers' ? 'text-orange-400' : 'text-cyan-400'}>
                    {business.currency} {(viewMode === 'suppliers' ? item.totalPurchases : item.totalSales).toLocaleString()}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Top by Balance Due */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            Top 5 by Balance Due
          </h3>
          <div className="space-y-3">
            {[...filteredData]
              .filter(item => item.balance > 0)
              .sort((a, b) => b.balance - a.balance)
              .slice(0, 5)
              .map((item, index) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-red-500 text-white' :
                      index === 1 ? 'bg-orange-500 text-white' :
                      index === 2 ? 'bg-yellow-500 text-black' :
                      'bg-slate-700 text-white'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="text-white">{item.name}</span>
                  </div>
                  <span className="text-yellow-400 font-medium">
                    {business.currency} {item.balance.toLocaleString()}
                  </span>
                </div>
              ))}
            {filteredData.filter(item => item.balance > 0).length === 0 && (
              <p className="text-slate-500 text-center py-4">No outstanding balances</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}