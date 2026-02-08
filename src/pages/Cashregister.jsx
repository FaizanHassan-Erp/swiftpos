import { useState, useEffect } from 'react'
import { useApp } from '../Context/AppContext'

export default function CashRegister() {
  const { state, dispatch } = useApp()
  const { registerSessions = [], sales = [], business } = state
  const currency = business?.currency || 'Rs'

  const [showOpenModal, setShowOpenModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [showCashModal, setShowCashModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState(null)
  const [cashMovementType, setCashMovementType] = useState('in')
  const [activeTab, setActiveTab] = useState('current')

  // Form states
  const [openingAmount, setOpeningAmount] = useState('')
  const [openingNote, setOpeningNote] = useState('')
  const [closingAmount, setClosingAmount] = useState('')
  const [closingNote, setClosingNote] = useState('')
  const [cashAmount, setCashAmount] = useState('')
  const [cashNote, setCashNote] = useState('')

  // Get current active session
  const activeSession = registerSessions.find(s => s.status === 'open')

  // Get today's sessions
  const todaySessions = registerSessions.filter(s => {
    const sessionDate = new Date(s.openedAt).toDateString()
    const today = new Date().toDateString()
    return sessionDate === today
  })

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

  // Calculate expected cash
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

  // Open register
  const handleOpenRegister = (e) => {
    e.preventDefault()
    if (!openingAmount || parseFloat(openingAmount) < 0) {
      alert('Please enter a valid opening amount')
      return
    }

    const newSession = {
      id: `REG-${Date.now()}`,
      openedAt: new Date().toISOString(),
      openingAmount: parseFloat(openingAmount),
      openingNote: openingNote || '',
      status: 'open',
      cashMovements: [],
      openedBy: 'Admin',
      createdAt: new Date().toISOString()
    }

    dispatch({ type: 'OPEN_REGISTER_SESSION', payload: newSession })
    setShowOpenModal(false)
    setOpeningAmount('')
    setOpeningNote('')
  }

  // Close register
  const handleCloseRegister = (e) => {
    e.preventDefault()
    if (!closingAmount || parseFloat(closingAmount) < 0) {
      alert('Please enter the actual closing amount')
      return
    }

    const expectedCash = getExpectedCash(activeSession)
    const actualCash = parseFloat(closingAmount)
    const difference = actualCash - expectedCash

    const closedSession = {
      ...activeSession,
      closedAt: new Date().toISOString(),
      closingAmount: actualCash,
      expectedAmount: expectedCash,
      difference: difference,
      closingNote: closingNote || '',
      status: 'closed',
      closedBy: 'Admin'
    }

    dispatch({ type: 'CLOSE_REGISTER_SESSION', payload: closedSession })
    setShowCloseModal(false)
    setClosingAmount('')
    setClosingNote('')
  }

  // Add cash movement
  const handleCashMovement = (e) => {
    e.preventDefault()
    if (!cashAmount || parseFloat(cashAmount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    const movement = {
      id: `CM-${Date.now()}`,
      type: cashMovementType,
      amount: parseFloat(cashAmount),
      note: cashNote || '',
      createdAt: new Date().toISOString(),
      addedBy: 'Admin'
    }

    dispatch({ type: 'ADD_CASH_MOVEMENT', payload: { sessionId: activeSession.id, movement } })
    setShowCashModal(false)
    setCashAmount('')
    setCashNote('')
  }

  // View session details
  const openViewModal = (session) => {
    setSelectedSession(session)
    setShowViewModal(true)
  }

  // Current session sales
  const currentSales = activeSession ? getSessionSales(activeSession) : { cash: 0, card: 0, other: 0, total: 0, count: 0 }
  const expectedCash = activeSession ? getExpectedCash(activeSession) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Cash Register</h1>
          <p className="text-slate-400 text-sm">Manage register sessions and track cash flow</p>
        </div>
        {!activeSession ? (
          <button
            onClick={() => setShowOpenModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-cyan-600 transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Open Register
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => { setCashMovementType('in'); setShowCashModal(true) }}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m0-16l-4 4m4-4l4 4" />
              </svg>
              Cash In
            </button>
            <button
              onClick={() => { setCashMovementType('out'); setShowCashModal(true) }}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20V4m0 16l4-4m-4 4l-4-4" />
              </svg>
              Cash Out
            </button>
            <button
              onClick={() => setShowCloseModal(true)}
              className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Close Register
            </button>
          </div>
        )}
      </div>

      {/* Current Session Status */}
      {activeSession ? (
        <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/20 rounded-xl">
                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Register is OPEN</h2>
                <p className="text-emerald-400 text-sm">
                  Opened at {new Date(activeSession.openedAt).toLocaleTimeString()} by {activeSession.openedBy}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-sm">Session ID</p>
              <p className="text-cyan-400 font-mono">{activeSession.id}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-slate-900/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Opening Amount</p>
              <p className="text-xl font-bold text-white">{currency} {activeSession.openingAmount.toLocaleString()}</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Cash Sales</p>
              <p className="text-xl font-bold text-emerald-400">{currency} {currentSales.cash.toLocaleString()}</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Card Sales</p>
              <p className="text-xl font-bold text-blue-400">{currency} {currentSales.card.toLocaleString()}</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Total Sales ({currentSales.count})</p>
              <p className="text-xl font-bold text-cyan-400">{currency} {currentSales.total.toLocaleString()}</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Expected Cash</p>
              <p className="text-xl font-bold text-yellow-400">{currency} {expectedCash.toLocaleString()}</p>
            </div>
          </div>

          {/* Cash Movements */}
          {activeSession.cashMovements && activeSession.cashMovements.length > 0 && (
            <div className="mt-4 bg-slate-900/50 rounded-lg p-4">
              <h3 className="text-white font-medium mb-3">Cash Movements</h3>
              <div className="space-y-2">
                {activeSession.cashMovements.map((movement, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        movement.type === 'in' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {movement.type === 'in' ? 'IN' : 'OUT'}
                      </span>
                      <span className="text-slate-300">{movement.note || 'No note'}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-500">{new Date(movement.createdAt).toLocaleTimeString()}</span>
                      <span className={`font-medium ${movement.type === 'in' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {movement.type === 'in' ? '+' : '-'}{currency} {movement.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-12 text-center">
          <div className="w-20 h-20 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Register is Closed</h2>
          <p className="text-slate-400 mb-6">Open the register to start a new session</p>
          <button
            onClick={() => setShowOpenModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-cyan-600 transition-all"
          >
            Open Register
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('current')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'current' 
              ? 'text-emerald-400 border-b-2 border-emerald-400' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Today's Sessions
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'history' 
              ? 'text-emerald-400 border-b-2 border-emerald-400' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Session History
        </button>
      </div>

      {/* Sessions Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-900/50">
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Session ID</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Opened At</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Closed At</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Opening</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Cash Sales</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Expected</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Actual</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Difference</th>
                <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Status</th>
                <th className="text-center px-4 py-3 text-slate-400 font-medium text-sm">Action</th>
              </tr>
            </thead>
            <tbody>
              {(activeTab === 'current' ? todaySessions : registerSessions)
                .sort((a, b) => new Date(b.openedAt) - new Date(a.openedAt))
                .map(session => {
                  const sessionSales = getSessionSales(session)
                  const expected = session.status === 'closed' ? session.expectedAmount : getExpectedCash(session)
                  return (
                    <tr key={session.id} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                      <td className="px-4 py-3 text-cyan-400 font-mono text-sm">{session.id}</td>
                      <td className="px-4 py-3 text-white">
                        <div>{new Date(session.openedAt).toLocaleDateString()}</div>
                        <div className="text-slate-400 text-xs">{new Date(session.openedAt).toLocaleTimeString()}</div>
                      </td>
                      <td className="px-4 py-3 text-white">
                        {session.closedAt ? (
                          <>
                            <div>{new Date(session.closedAt).toLocaleDateString()}</div>
                            <div className="text-slate-400 text-xs">{new Date(session.closedAt).toLocaleTimeString()}</div>
                          </>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-white">{currency} {session.openingAmount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-emerald-400">{currency} {sessionSales.cash.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-yellow-400">{currency} {expected.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-white">
                        {session.closingAmount !== undefined ? `${currency} ${session.closingAmount.toLocaleString()}` : '-'}
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
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => openViewModal(session)}
                          className="px-3 py-1 bg-slate-700 text-white rounded-lg text-sm hover:bg-slate-600 transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  )
                })}
              {(activeTab === 'current' ? todaySessions : registerSessions).length === 0 && (
                <tr>
                  <td colSpan="10" className="text-center py-8 text-slate-500">
                    No sessions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
              <p className="text-slate-400 text-sm">Today's Sessions</p>
              <p className="text-2xl font-bold text-white">{todaySessions.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Today's Cash Sales</p>
              <p className="text-2xl font-bold text-emerald-400">
                {currency} {todaySessions.reduce((sum, s) => sum + getSessionSales(s).cash, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Sessions</p>
              <p className="text-2xl font-bold text-cyan-400">{registerSessions.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Discrepancies</p>
              <p className="text-2xl font-bold text-red-400">
                {currency} {Math.abs(registerSessions
                  .filter(s => s.status === 'closed')
                  .reduce((sum, s) => sum + (s.difference || 0), 0)).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Open Register Modal */}
      {showOpenModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Open Register</h2>
              <button onClick={() => setShowOpenModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleOpenRegister} className="p-6 space-y-4">
              <div>
                <label htmlFor="openingAmount" className="block text-sm font-medium text-slate-300 mb-2">Opening Cash Amount *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{currency}</span>
                  <input
                    id="openingAmount"
                    name="openingAmount"
                    type="number"
                    step="0.01"
                    value={openingAmount}
                    onChange={(e) => setOpeningAmount(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    placeholder="0.00"
                    autoComplete="off"
                    required
                  />
                </div>
                <p className="text-slate-500 text-xs mt-1">Count the cash in the drawer before opening</p>
              </div>
              <div>
                <label htmlFor="openingNote" className="block text-sm font-medium text-slate-300 mb-2">Note (Optional)</label>
                <textarea
                  id="openingNote"
                  name="openingNote"
                  value={openingNote}
                  onChange={(e) => setOpeningNote(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white resize-none focus:outline-none focus:border-emerald-500"
                  rows="2"
                  placeholder="Any notes about the opening..."
                  autoComplete="off"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all"
              >
                Open Register
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Close Register Modal */}
      {showCloseModal && activeSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Close Register</h2>
              <button onClick={() => setShowCloseModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCloseRegister} className="p-6 space-y-4">
              <div className="bg-slate-900/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Opening Amount</span>
                  <span className="text-white">{currency} {activeSession.openingAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Cash Sales</span>
                  <span className="text-emerald-400">+ {currency} {currentSales.cash.toLocaleString()}</span>
                </div>
                {activeSession.cashMovements?.filter(m => m.type === 'in').length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Cash In</span>
                    <span className="text-emerald-400">+ {currency} {activeSession.cashMovements.filter(m => m.type === 'in').reduce((s, m) => s + m.amount, 0).toLocaleString()}</span>
                  </div>
                )}
                {activeSession.cashMovements?.filter(m => m.type === 'out').length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Cash Out</span>
                    <span className="text-red-400">- {currency} {activeSession.cashMovements.filter(m => m.type === 'out').reduce((s, m) => s + m.amount, 0).toLocaleString()}</span>
                  </div>
                )}
                <hr className="border-slate-700" />
                <div className="flex justify-between font-medium">
                  <span className="text-white">Expected Cash</span>
                  <span className="text-yellow-400">{currency} {expectedCash.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label htmlFor="closingAmount" className="block text-sm font-medium text-slate-300 mb-2">Actual Cash Count *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{currency}</span>
                  <input
                    id="closingAmount"
                    name="closingAmount"
                    type="number"
                    step="0.01"
                    value={closingAmount}
                    onChange={(e) => setClosingAmount(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    placeholder="0.00"
                    autoComplete="off"
                    required
                  />
                </div>
                <p className="text-slate-500 text-xs mt-1">Count all cash in the drawer</p>
              </div>

              {closingAmount && (
                <div className={`p-3 rounded-lg ${
                  parseFloat(closingAmount) === expectedCash ? 'bg-emerald-500/10 border border-emerald-500/30' :
                  parseFloat(closingAmount) > expectedCash ? 'bg-blue-500/10 border border-blue-500/30' :
                  'bg-red-500/10 border border-red-500/30'
                }`}>
                  <div className="flex justify-between">
                    <span className={
                      parseFloat(closingAmount) === expectedCash ? 'text-emerald-400' :
                      parseFloat(closingAmount) > expectedCash ? 'text-blue-400' : 'text-red-400'
                    }>
                      {parseFloat(closingAmount) === expectedCash ? '✓ Balanced' :
                       parseFloat(closingAmount) > expectedCash ? '↑ Over' : '↓ Short'}
                    </span>
                    <span className={`font-bold ${
                      parseFloat(closingAmount) === expectedCash ? 'text-emerald-400' :
                      parseFloat(closingAmount) > expectedCash ? 'text-blue-400' : 'text-red-400'
                    }`}>
                      {parseFloat(closingAmount) >= expectedCash ? '+' : ''}{currency} {(parseFloat(closingAmount) - expectedCash).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="closingNote" className="block text-sm font-medium text-slate-300 mb-2">Closing Note (Optional)</label>
                <textarea
                  id="closingNote"
                  name="closingNote"
                  value={closingNote}
                  onChange={(e) => setClosingNote(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white resize-none focus:outline-none focus:border-emerald-500"
                  rows="2"
                  placeholder="Any notes about the closing..."
                  autoComplete="off"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-all"
              >
                Close Register
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Cash In/Out Modal */}
      {showCashModal && activeSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {cashMovementType === 'in' ? 'Cash In' : 'Cash Out'}
              </h2>
              <button onClick={() => setShowCashModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCashMovement} className="p-6 space-y-4">
              <div className={`p-3 rounded-lg text-sm ${
                cashMovementType === 'in' 
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-orange-500/10 border border-orange-500/30 text-orange-400'
              }`}>
                {cashMovementType === 'in' 
                  ? '💰 Adding cash to the register (e.g., change refill, petty cash return)'
                  : '📤 Removing cash from the register (e.g., petty cash, bank deposit)'}
              </div>

              <div>
                <label htmlFor="cashAmount" className="block text-sm font-medium text-slate-300 mb-2">Amount *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{currency}</span>
                  <input
                    id="cashAmount"
                    name="cashAmount"
                    type="number"
                    step="0.01"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    placeholder="0.00"
                    autoComplete="off"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="cashNote" className="block text-sm font-medium text-slate-300 mb-2">Reason / Note *</label>
                <textarea
                  id="cashNote"
                  name="cashNote"
                  value={cashNote}
                  onChange={(e) => setCashNote(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white resize-none focus:outline-none focus:border-emerald-500"
                  rows="2"
                  placeholder={cashMovementType === 'in' ? 'e.g., Change refill' : 'e.g., Petty cash for supplies'}
                  autoComplete="off"
                  required
                />
              </div>

              <button
                type="submit"
                className={`w-full py-3 text-white rounded-lg font-semibold transition-all ${
                  cashMovementType === 'in' 
                    ? 'bg-emerald-500 hover:bg-emerald-600' 
                    : 'bg-orange-500 hover:bg-orange-600'
                }`}
              >
                {cashMovementType === 'in' ? 'Add Cash' : 'Remove Cash'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* View Session Modal */}
      {showViewModal && selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800">
              <h2 className="text-xl font-bold text-white">Session Details - {selectedSession.id}</h2>
              <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Session Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 p-4 rounded-lg">
                  <p className="text-slate-400 text-sm">Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    selectedSession.status === 'open' 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : 'bg-slate-500/20 text-slate-400'
                  }`}>
                    {selectedSession.status === 'open' ? 'Open' : 'Closed'}
                  </span>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-lg">
                  <p className="text-slate-400 text-sm">Opened By</p>
                  <p className="text-white font-medium">{selectedSession.openedBy}</p>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-lg">
                  <p className="text-slate-400 text-sm">Opened At</p>
                  <p className="text-white font-medium">{new Date(selectedSession.openedAt).toLocaleString()}</p>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-lg">
                  <p className="text-slate-400 text-sm">Closed At</p>
                  <p className="text-white font-medium">
                    {selectedSession.closedAt ? new Date(selectedSession.closedAt).toLocaleString() : '-'}
                  </p>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="bg-slate-900/50 rounded-lg p-4">
                <h3 className="text-white font-medium mb-3">Financial Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Opening Amount</span>
                    <span className="text-white">{currency} {selectedSession.openingAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cash Sales</span>
                    <span className="text-emerald-400">{currency} {getSessionSales(selectedSession).cash.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Card Sales</span>
                    <span className="text-blue-400">{currency} {getSessionSales(selectedSession).card.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Sales ({getSessionSales(selectedSession).count})</span>
                    <span className="text-cyan-400">{currency} {getSessionSales(selectedSession).total.toLocaleString()}</span>
                  </div>
                  {selectedSession.status === 'closed' && (
                    <>
                      <hr className="border-slate-700" />
                      <div className="flex justify-between">
                        <span className="text-slate-400">Expected Cash</span>
                        <span className="text-yellow-400">{currency} {selectedSession.expectedAmount?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Actual Cash</span>
                        <span className="text-white">{currency} {selectedSession.closingAmount?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span className="text-white">Difference</span>
                        <span className={
                          selectedSession.difference === 0 ? 'text-emerald-400' :
                          selectedSession.difference > 0 ? 'text-blue-400' : 'text-red-400'
                        }>
                          {selectedSession.difference >= 0 ? '+' : ''}{currency} {selectedSession.difference?.toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Cash Movements */}
              {selectedSession.cashMovements && selectedSession.cashMovements.length > 0 && (
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-3">Cash Movements</h3>
                  <div className="space-y-2">
                    {selectedSession.cashMovements.map((movement, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                        <div>
                          <span className={`px-2 py-0.5 rounded text-xs mr-2 ${
                            movement.type === 'in' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {movement.type === 'in' ? 'IN' : 'OUT'}
                          </span>
                          <span className="text-slate-300">{movement.note}</span>
                        </div>
                        <div className="text-right">
                          <span className={`font-medium ${movement.type === 'in' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {movement.type === 'in' ? '+' : '-'}{currency} {movement.amount.toLocaleString()}
                          </span>
                          <p className="text-slate-500 text-xs">{new Date(movement.createdAt).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {(selectedSession.openingNote || selectedSession.closingNote) && (
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-3">Notes</h3>
                  {selectedSession.openingNote && (
                    <div className="mb-2">
                      <span className="text-slate-400 text-sm">Opening: </span>
                      <span className="text-white">{selectedSession.openingNote}</span>
                    </div>
                  )}
                  {selectedSession.closingNote && (
                    <div>
                      <span className="text-slate-400 text-sm">Closing: </span>
                      <span className="text-white">{selectedSession.closingNote}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end">
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
    </div>
  )
}