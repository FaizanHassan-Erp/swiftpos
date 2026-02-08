import { useState } from 'react'
import { useApp } from '../Context/AppContext'

export default function Activitylogreport() {
  const { state } = useApp()
  const { activityLogs = [], users = [] } = state

  // Filters
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [moduleFilter, setModuleFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')
  const [userFilter, setUserFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Get unique modules and actions
  const modules = [...new Set(activityLogs.map(log => log.module))].filter(Boolean).sort()
  const actions = [...new Set(activityLogs.map(log => log.action))].filter(Boolean).sort()
  const logUsers = [...new Set(activityLogs.map(log => log.userName))].filter(Boolean).sort()

  // Filter logs
  const filteredLogs = activityLogs.filter(log => {
    const logDate = new Date(log.timestamp)
    const startDate = new Date(dateRange.start)
    const endDate = new Date(dateRange.end)
    endDate.setHours(23, 59, 59, 999)

    const matchesDate = logDate >= startDate && logDate <= endDate
    const matchesModule = moduleFilter === 'all' || log.module === moduleFilter
    const matchesAction = actionFilter === 'all' || log.action === actionFilter
    const matchesUser = userFilter === 'all' || log.userName === userFilter
    const matchesSearch = log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.module?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesDate && matchesModule && matchesAction && matchesUser && matchesSearch
  })

  // Group logs by date for summary
  const logsByDate = {}
  filteredLogs.forEach(log => {
    const date = new Date(log.timestamp).toISOString().split('T')[0]
    if (!logsByDate[date]) {
      logsByDate[date] = { date, count: 0, modules: {} }
    }
    logsByDate[date].count++
    logsByDate[date].modules[log.module] = (logsByDate[date].modules[log.module] || 0) + 1
  })
  const dailySummary = Object.values(logsByDate).sort((a, b) => new Date(b.date) - new Date(a.date))

  // Activity stats
  const totalLogs = filteredLogs.length
  const uniqueUsers = [...new Set(filteredLogs.map(l => l.userName))].length
  const moduleStats = {}
  filteredLogs.forEach(log => {
    moduleStats[log.module] = (moduleStats[log.module] || 0) + 1
  })
  const topModule = Object.entries(moduleStats).sort((a, b) => b[1] - a[1])[0]

  // Action type icons
  const getActionIcon = (action) => {
    if (action?.includes('CREATED') || action?.includes('ADDED') || action === 'LOGIN') {
      return (
        <div className="p-2 bg-emerald-500/20 rounded-lg">
          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
      )
    } else if (action?.includes('UPDATED') || action?.includes('MODIFIED')) {
      return (
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
      )
    } else if (action?.includes('DELETED') || action?.includes('REMOVED')) {
      return (
        <div className="p-2 bg-red-500/20 rounded-lg">
          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
      )
    } else if (action === 'LOGOUT') {
      return (
        <div className="p-2 bg-orange-500/20 rounded-lg">
          <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </div>
      )
    } else if (action?.includes('REGISTER')) {
      return (
        <div className="p-2 bg-purple-500/20 rounded-lg">
          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
      )
    }
    return (
      <div className="p-2 bg-slate-500/20 rounded-lg">
        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    )
  }

  // Module color
  const getModuleColor = (module) => {
    const colors = {
      'Sales': 'bg-emerald-500/20 text-emerald-400',
      'Purchases': 'bg-blue-500/20 text-blue-400',
      'Products': 'bg-purple-500/20 text-purple-400',
      'Expenses': 'bg-orange-500/20 text-orange-400',
      'Stock Adjustment': 'bg-yellow-500/20 text-yellow-400',
      'Cash Register': 'bg-cyan-500/20 text-cyan-400',
      'Authentication': 'bg-pink-500/20 text-pink-400',
      'Customers': 'bg-indigo-500/20 text-indigo-400',
      'Suppliers': 'bg-teal-500/20 text-teal-400'
    }
    return colors[module] || 'bg-slate-500/20 text-slate-400'
  }

  function exportToCSV() {
    const headers = ['Timestamp', 'User', 'Role', 'Module', 'Action', 'Description']
    const rows = filteredLogs.map(log => [
      new Date(log.timestamp).toLocaleString(),
      log.userName || 'Unknown',
      log.userRole || '-',
      log.module || '-',
      log.action || '-',
      log.description || '-'
    ])

    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `activity-log-${dateRange.start}-to-${dateRange.end}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Activity Log Report</h1>
          <p className="text-slate-400 text-sm">Track all system activities and user actions</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label htmlFor="alrStartDate" className="block text-sm text-slate-400 mb-1">Start Date</label>
            <input
              id="alrStartDate"
              name="alrStartDate"
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
          <div>
            <label htmlFor="alrEndDate" className="block text-sm text-slate-400 mb-1">End Date</label>
            <input
              id="alrEndDate"
              name="alrEndDate"
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
          <div>
            <label htmlFor="alrModule" className="block text-sm text-slate-400 mb-1">Module</label>
            <select
              id="alrModule"
              name="alrModule"
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="all">All Modules</option>
              {modules.map(mod => (
                <option key={mod} value={mod}>{mod}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="alrAction" className="block text-sm text-slate-400 mb-1">Action Type</label>
            <select
              id="alrAction"
              name="alrAction"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="all">All Actions</option>
              {actions.map(act => (
                <option key={act} value={act}>{act.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="alrUser" className="block text-sm text-slate-400 mb-1">User</label>
            <select
              id="alrUser"
              name="alrUser"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="all">All Users</option>
              {logUsers.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="alrSearch" className="block text-sm text-slate-400 mb-1">Search</label>
            <input
              id="alrSearch"
              name="alrSearch"
              autoComplete="off"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search activities..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Activities</p>
              <p className="text-2xl font-bold text-white">{totalLogs}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Active Users</p>
              <p className="text-2xl font-bold text-emerald-400">{uniqueUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Modules</p>
              <p className="text-2xl font-bold text-purple-400">{Object.keys(moduleStats).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Most Active</p>
              <p className="text-lg font-bold text-cyan-400">{topModule ? topModule[0] : '-'}</p>
              <p className="text-xs text-slate-500">{topModule ? `${topModule[1]} activities` : ''}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Module Activity Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Module Stats */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <h3 className="text-white font-medium mb-4">Activity by Module</h3>
          <div className="space-y-3">
            {Object.entries(moduleStats).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([module, count]) => {
              const percentage = totalLogs > 0 ? (count / totalLogs) * 100 : 0
              return (
                <div key={module}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{module}</span>
                    <span className="text-slate-400">{count} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {Object.keys(moduleStats).length === 0 && (
              <p className="text-slate-500 text-center py-4">No activity data</p>
            )}
          </div>
        </div>

        {/* Daily Activity Chart */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <h3 className="text-white font-medium mb-4">Daily Activity</h3>
          {dailySummary.length > 0 ? (
            <div className="h-48 flex items-end gap-1">
              {dailySummary.slice(0, 14).reverse().map((day, idx) => {
                const maxCount = Math.max(...dailySummary.map(d => d.count), 1)
                const height = (day.count / maxCount) * 100
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-slate-400">{day.count}</span>
                    <div 
                      className="w-full bg-gradient-to-t from-emerald-500 to-cyan-500 rounded-t"
                      style={{ height: `${Math.max(height, 5)}%` }}
                      title={`${day.date}: ${day.count} activities`}
                    />
                    <span className="text-[10px] text-slate-500 transform -rotate-45 origin-left whitespace-nowrap">
                      {new Date(day.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-500">
              No activity data for the selected period
            </div>
          )}
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50">
          <h3 className="text-white font-medium">Activity Timeline</h3>
          <p className="text-slate-400 text-sm">Recent activities in chronological order</p>
        </div>
        
        <div className="divide-y divide-slate-700/50 max-h-[600px] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p>No activities found for the selected filters</p>
              <p className="text-sm mt-1">Try adjusting your date range or filters</p>
            </div>
          ) : (
            filteredLogs.slice(0, 100).map((log, idx) => (
              <div key={log.id || idx} className="p-4 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-start gap-4">
                  {getActionIcon(log.action)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-white font-medium">{log.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${getModuleColor(log.module)}`}>
                            {log.module}
                          </span>
                          <span className="text-slate-500 text-xs">•</span>
                          <span className="text-slate-400 text-sm">{log.userName}</span>
                          {log.userRole && (
                            <>
                              <span className="text-slate-500 text-xs">•</span>
                              <span className="text-slate-500 text-xs">{log.userRole}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-slate-400 text-sm">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </p>
                        <p className="text-slate-500 text-xs">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {filteredLogs.length > 100 && (
          <div className="p-4 border-t border-slate-700/50 text-center">
            <p className="text-slate-400 text-sm">Showing 100 of {filteredLogs.length} activities. Export CSV for full data.</p>
          </div>
        )}
      </div>
    </div>
  )
}