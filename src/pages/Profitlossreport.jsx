import { useState, useMemo } from 'react'
import { useApp } from '../Context/AppContext'

export default function ProfitLossReport() {
  const { state } = useApp()
  const { sales = [], purchases = [], expenses = [], expenseCategories = [], saleReturns = [], purchaseReturns = [], business = {} } = state
  const currency = business.currency || '₨'

  const [dateRange, setDateRange] = useState('this_month')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  // Get category name helper
  function getCategoryName(categoryId) {
    const category = expenseCategories.find(c => c.id === categoryId)
    return category?.name || 'Uncategorized'
  }

  const getDateRange = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch (dateRange) {
      case 'today':
        return { start: today, end: new Date(today.getTime() + 86400000) }
      case 'yesterday':
        const yesterday = new Date(today.getTime() - 86400000)
        return { start: yesterday, end: today }
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
      case 'this_month':
        return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(today.getTime() + 86400000) }
      case 'last_month':
        return { start: new Date(now.getFullYear(), now.getMonth() - 1, 1), end: new Date(now.getFullYear(), now.getMonth(), 1) }
      case 'this_quarter':
        const quarter = Math.floor(now.getMonth() / 3)
        return { start: new Date(now.getFullYear(), quarter * 3, 1), end: new Date(today.getTime() + 86400000) }
      case 'this_year':
        return { start: new Date(now.getFullYear(), 0, 1), end: new Date(today.getTime() + 86400000) }
      case 'last_year':
        return { start: new Date(now.getFullYear() - 1, 0, 1), end: new Date(now.getFullYear(), 0, 1) }
      case 'all':
        return { start: new Date(0), end: new Date(Date.now() + 86400000) }
      case 'custom':
        return { 
          start: customStartDate ? new Date(customStartDate) : new Date(0), 
          end: customEndDate ? new Date(new Date(customEndDate).getTime() + 86400000) : new Date() 
        }
      default:
        return { start: new Date(0), end: new Date() }
    }
  }

  const filterByDate = (items, dateField = 'date') => {
    const { start, end } = getDateRange()
    return items.filter(item => {
      const itemDate = new Date(item[dateField] || item.createdAt)
      return itemDate >= start && itemDate < end
    })
  }

  const reportData = useMemo(() => {
    const filteredSales = filterByDate(sales, 'date')
    const filteredPurchases = filterByDate(purchases, 'date')
    const filteredExpenses = filterByDate(expenses, 'date')
    const filteredSaleReturns = filterByDate(saleReturns, 'date')
    const filteredPurchaseReturns = filterByDate(purchaseReturns, 'date')

    // Calculate Gross Sales
    const grossSales = filteredSales.reduce((sum, sale) => {
      const amount = parseFloat(sale.total) || parseFloat(sale.grandTotal) || 0
      return sum + amount
    }, 0)

    // Calculate Sales Returns from saleReturns collection
    const salesReturns = filteredSaleReturns.reduce((sum, sr) => {
      return sum + (parseFloat(sr.total) || 0)
    }, 0)

    // Calculate Sales Discounts
    const salesDiscount = filteredSales.reduce((sum, sale) => {
      return sum + (parseFloat(sale.discount) || 0)
    }, 0)

    const netSales = grossSales - salesReturns - salesDiscount

    // Calculate Purchase Cost
    const purchaseCost = filteredPurchases.reduce((sum, purchase) => {
      const amount = parseFloat(purchase.total) || parseFloat(purchase.grandTotal) || 0
      return sum + amount
    }, 0)

    // Calculate Purchase Returns from purchaseReturns collection
    const purchaseReturnsTotal = filteredPurchaseReturns.reduce((sum, pr) => {
      return sum + (parseFloat(pr.total) || 0)
    }, 0)

    // Calculate Purchase Discounts
    const purchaseDiscount = filteredPurchases.reduce((sum, purchase) => {
      return sum + (parseFloat(purchase.discount) || 0)
    }, 0)

    const netPurchases = purchaseCost - purchaseReturnsTotal - purchaseDiscount
    const cogs = netPurchases
    const grossProfit = netSales - cogs
    const grossProfitMargin = netSales > 0 ? (grossProfit / netSales) * 100 : 0

    // Calculate Expenses by Category - FIXED: using correct field names
    const expensesByCategory = {}
    let totalExpenses = 0

    filteredExpenses.forEach(expense => {
      // Use categoryId to lookup category name from expenseCategories
      const categoryName = getCategoryName(expense.categoryId)
      // Use totalAmount (correct field from Expenses.jsx)
      const amount = parseFloat(expense.totalAmount) || 0
      
      if (!expensesByCategory[categoryName]) {
        expensesByCategory[categoryName] = 0
      }
      expensesByCategory[categoryName] += amount
      totalExpenses += amount
    })

    const netProfit = grossProfit - totalExpenses
    const netProfitMargin = netSales > 0 ? (netProfit / netSales) * 100 : 0
    const totalTransactions = filteredSales.length
    const averageTransactionValue = totalTransactions > 0 ? netSales / totalTransactions : 0

    return {
      grossSales,
      salesReturns,
      salesDiscount,
      netSales,
      purchaseCost,
      purchaseReturns: purchaseReturnsTotal,
      purchaseDiscount,
      netPurchases,
      cogs,
      grossProfit,
      grossProfitMargin,
      expensesByCategory,
      totalExpenses,
      netProfit,
      netProfitMargin,
      totalTransactions,
      averageTransactionValue,
      salesCount: filteredSales.length,
      purchasesCount: filteredPurchases.length,
      expensesCount: filteredExpenses.length,
      saleReturnsCount: filteredSaleReturns.length,
      purchaseReturnsCount: filteredPurchaseReturns.length,
    }
  }, [sales, purchases, expenses, saleReturns, purchaseReturns, expenseCategories, dateRange, customStartDate, customEndDate])

  const formatCurrency = (amount) => {
    return `${currency} ${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatPercentage = (value) => `${value.toFixed(2)}%`

  const getPeriodLabel = () => {
    if (dateRange === 'all') return 'All Time'
    const { start, end } = getDateRange()
    const options = { year: 'numeric', month: 'short', day: 'numeric' }
    return `${start.toLocaleDateString('en-US', options)} - ${new Date(end.getTime() - 86400000).toLocaleDateString('en-US', options)}`
  }

  const handlePrint = () => window.print()

  // Export to CSV - FIXED: Added working export function
  const handleExport = () => {
    let csvContent = 'Profit & Loss Report\n'
    csvContent += `Period: ${getPeriodLabel()}\n\n`
    
    csvContent += 'REVENUE\n'
    csvContent += `Gross Sales,${reportData.grossSales.toFixed(2)}\n`
    csvContent += `Less: Sales Returns,${reportData.salesReturns.toFixed(2)}\n`
    csvContent += `Less: Sales Discounts,${reportData.salesDiscount.toFixed(2)}\n`
    csvContent += `Net Sales,${reportData.netSales.toFixed(2)}\n\n`
    
    csvContent += 'COST OF GOODS SOLD\n'
    csvContent += `Purchases,${reportData.purchaseCost.toFixed(2)}\n`
    csvContent += `Less: Purchase Returns,${reportData.purchaseReturns.toFixed(2)}\n`
    csvContent += `Less: Purchase Discounts,${reportData.purchaseDiscount.toFixed(2)}\n`
    csvContent += `Total COGS,${reportData.cogs.toFixed(2)}\n\n`
    
    csvContent += `Gross Profit,${reportData.grossProfit.toFixed(2)}\n`
    csvContent += `Gross Profit Margin,${reportData.grossProfitMargin.toFixed(2)}%\n\n`
    
    csvContent += 'OPERATING EXPENSES\n'
    Object.entries(reportData.expensesByCategory).forEach(([category, amount]) => {
      csvContent += `${category},${amount.toFixed(2)}\n`
    })
    csvContent += `Total Operating Expenses,${reportData.totalExpenses.toFixed(2)}\n\n`
    
    csvContent += `Net ${reportData.netProfit >= 0 ? 'Profit' : 'Loss'},${reportData.netProfit.toFixed(2)}\n`
    csvContent += `Net Profit Margin,${reportData.netProfitMargin.toFixed(2)}%\n\n`
    
    csvContent += 'SUMMARY\n'
    csvContent += `Total Sales Transactions,${reportData.salesCount}\n`
    csvContent += `Total Purchase Orders,${reportData.purchasesCount}\n`
    csvContent += `Total Expense Entries,${reportData.expensesCount}\n`
    csvContent += `Average Transaction Value,${reportData.averageTransactionValue.toFixed(2)}\n`

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `profit-loss-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Profit & Loss Report</h1>
          <p className="text-slate-400 text-sm">{getPeriodLabel()}</p>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0 print:hidden">
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 print:hidden">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label htmlFor="plrPeriod" className="block text-slate-400 text-sm mb-1">Period</label>
            <select id="plrPeriod" name="plrPeriod" value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="bg-slate-900 text-white px-4 py-2 rounded-lg border border-slate-700 focus:border-emerald-500 focus:outline-none min-w-[160px]">
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
                <label htmlFor="plrStartDate" className="block text-slate-400 text-sm mb-1">Start Date</label>
                <input id="plrStartDate" name="plrStartDate" type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="bg-slate-900 text-white px-4 py-2 rounded-lg border border-slate-700 focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label htmlFor="plrEndDate" className="block text-slate-400 text-sm mb-1">End Date</label>
                <input id="plrEndDate" name="plrEndDate" type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="bg-slate-900 text-white px-4 py-2 rounded-lg border border-slate-700 focus:border-emerald-500 focus:outline-none" />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm">Net Sales</span>
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(reportData.netSales)}</p>
          <p className="text-slate-500 text-xs mt-1">{reportData.salesCount} transactions</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm">Gross Profit</span>
            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(reportData.grossProfit)}</p>
          <p className={`text-xs mt-1 ${reportData.grossProfitMargin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatPercentage(reportData.grossProfitMargin)} margin
          </p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm">Total Expenses</span>
            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(reportData.totalExpenses)}</p>
          <p className="text-slate-500 text-xs mt-1">{reportData.expensesCount} expense entries</p>
        </div>

        <div className={`rounded-xl p-5 ${reportData.netProfit >= 0 ? 'bg-emerald-900/30 border border-emerald-500/30' : 'bg-red-900/30 border border-red-500/30'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm">Net Profit/Loss</span>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${reportData.netProfit >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
              {reportData.netProfit >= 0 ? (
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
            </div>
          </div>
          <p className={`text-2xl font-bold ${reportData.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {reportData.netProfit < 0 ? '-' : ''}{formatCurrency(reportData.netProfit)}
          </p>
          <p className={`text-xs mt-1 ${reportData.netProfitMargin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatPercentage(reportData.netProfitMargin)} net margin
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* P&L Statement */}
        <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700/50">
            <h2 className="text-lg font-semibold text-white">Profit & Loss Statement</h2>
          </div>
          <div className="p-5">
            <table className="w-full">
              <tbody className="divide-y divide-slate-700/50">
                {/* Revenue Section */}
                <tr>
                  <td colSpan={2} className="py-3 text-emerald-400 font-semibold text-sm uppercase tracking-wider">Revenue</td>
                </tr>
                <tr>
                  <td className="py-2 pl-4 text-slate-300">Gross Sales</td>
                  <td className="py-2 text-right text-white">{formatCurrency(reportData.grossSales)}</td>
                </tr>
                <tr>
                  <td className="py-2 pl-4 text-slate-300">Less: Sales Returns ({reportData.saleReturnsCount})</td>
                  <td className="py-2 text-right text-red-400">({formatCurrency(reportData.salesReturns)})</td>
                </tr>
                <tr>
                  <td className="py-2 pl-4 text-slate-300">Less: Sales Discounts</td>
                  <td className="py-2 text-right text-red-400">({formatCurrency(reportData.salesDiscount)})</td>
                </tr>
                <tr className="bg-slate-700/30">
                  <td className="py-3 pl-4 text-white font-semibold">Net Sales</td>
                  <td className="py-3 text-right text-white font-semibold">{formatCurrency(reportData.netSales)}</td>
                </tr>

                {/* COGS Section */}
                <tr>
                  <td colSpan={2} className="py-3 pt-5 text-orange-400 font-semibold text-sm uppercase tracking-wider">Cost of Goods Sold</td>
                </tr>
                <tr>
                  <td className="py-2 pl-4 text-slate-300">Purchases ({reportData.purchasesCount})</td>
                  <td className="py-2 text-right text-white">{formatCurrency(reportData.purchaseCost)}</td>
                </tr>
                <tr>
                  <td className="py-2 pl-4 text-slate-300">Less: Purchase Returns ({reportData.purchaseReturnsCount})</td>
                  <td className="py-2 text-right text-emerald-400">({formatCurrency(reportData.purchaseReturns)})</td>
                </tr>
                <tr>
                  <td className="py-2 pl-4 text-slate-300">Less: Purchase Discounts</td>
                  <td className="py-2 text-right text-emerald-400">({formatCurrency(reportData.purchaseDiscount)})</td>
                </tr>
                <tr className="bg-slate-700/30">
                  <td className="py-3 pl-4 text-white font-semibold">Total COGS</td>
                  <td className="py-3 text-right text-white font-semibold">{formatCurrency(reportData.cogs)}</td>
                </tr>

                {/* Gross Profit */}
                <tr className="bg-emerald-900/20">
                  <td className="py-3 pl-4 text-emerald-400 font-semibold">Gross Profit</td>
                  <td className="py-3 text-right text-emerald-400 font-semibold">{formatCurrency(reportData.grossProfit)}</td>
                </tr>

                {/* Operating Expenses */}
                <tr>
                  <td colSpan={2} className="py-3 pt-5 text-red-400 font-semibold text-sm uppercase tracking-wider">Operating Expenses</td>
                </tr>
                {Object.entries(reportData.expensesByCategory).length > 0 ? (
                  Object.entries(reportData.expensesByCategory)
                    .sort((a, b) => b[1] - a[1])
                    .map(([category, amount]) => (
                      <tr key={category}>
                        <td className="py-2 pl-4 text-slate-300">{category}</td>
                        <td className="py-2 text-right text-white">{formatCurrency(amount)}</td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td className="py-2 pl-4 text-slate-500 italic">No expenses recorded</td>
                    <td className="py-2 text-right text-slate-500">{formatCurrency(0)}</td>
                  </tr>
                )}
                <tr className="bg-slate-700/30">
                  <td className="py-3 pl-4 text-white font-semibold">Total Operating Expenses</td>
                  <td className="py-3 text-right text-white font-semibold">{formatCurrency(reportData.totalExpenses)}</td>
                </tr>

                {/* Net Profit/Loss */}
                <tr className={`${reportData.netProfit >= 0 ? 'bg-emerald-900/30' : 'bg-red-900/30'}`}>
                  <td className={`py-4 pl-4 font-bold text-lg ${reportData.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    Net {reportData.netProfit >= 0 ? 'Profit' : 'Loss'}
                  </td>
                  <td className={`py-4 text-right font-bold text-lg ${reportData.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {reportData.netProfit < 0 ? '-' : ''}{formatCurrency(reportData.netProfit)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profitability Metrics */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">Profitability Metrics</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Gross Profit Margin</span>
                  <span className={reportData.grossProfitMargin >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {formatPercentage(reportData.grossProfitMargin)}
                  </span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${reportData.grossProfitMargin >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} 
                    style={{ width: `${Math.min(Math.abs(reportData.grossProfitMargin), 100)}%` }} 
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Net Profit Margin</span>
                  <span className={reportData.netProfitMargin >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {formatPercentage(reportData.netProfitMargin)}
                  </span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${reportData.netProfitMargin >= 0 ? 'bg-cyan-500' : 'bg-red-500'}`} 
                    style={{ width: `${Math.min(Math.abs(reportData.netProfitMargin), 100)}%` }} 
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Expense Ratio</span>
                  <span className="text-orange-400">
                    {formatPercentage(reportData.netSales > 0 ? (reportData.totalExpenses / reportData.netSales) * 100 : 0)}
                  </span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-500 rounded-full" 
                    style={{ width: `${Math.min(reportData.netSales > 0 ? (reportData.totalExpenses / reportData.netSales) * 100 : 0, 100)}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                <span className="text-slate-400 text-sm">Total Transactions</span>
                <span className="text-white font-medium">{reportData.totalTransactions}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                <span className="text-slate-400 text-sm">Avg. Transaction Value</span>
                <span className="text-white font-medium">{formatCurrency(reportData.averageTransactionValue)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                <span className="text-slate-400 text-sm">Purchase Orders</span>
                <span className="text-white font-medium">{reportData.purchasesCount}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                <span className="text-slate-400 text-sm">Expense Entries</span>
                <span className="text-white font-medium">{reportData.expensesCount}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                <span className="text-slate-400 text-sm">Sale Returns</span>
                <span className="text-white font-medium">{reportData.saleReturnsCount}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400 text-sm">Purchase Returns</span>
                <span className="text-white font-medium">{reportData.purchaseReturnsCount}</span>
              </div>
            </div>
          </div>

          {/* Expense Breakdown */}
          {Object.entries(reportData.expensesByCategory).length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-4">Expense Breakdown</h3>
              <div className="space-y-3">
                {Object.entries(reportData.expensesByCategory)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([category, amount]) => {
                    const percentage = reportData.totalExpenses > 0 ? (amount / reportData.totalExpenses) * 100 : 0
                    return (
                      <div key={category}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-400 truncate">{category}</span>
                          <span className="text-white">{formatCurrency(amount)}</span>
                        </div>
                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full" 
                            style={{ width: `${percentage}%` }} 
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}