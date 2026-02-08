import { useState } from 'react'
import { useApp } from '../Context/AppContext'

export default function Paymentaccounts() {
  const { state, dispatch } = useApp()
  const { 
    paymentAccounts = [], 
    accountTypes = [],
    fundTransfers = [],
    deposits = [],
    sales = [], 
    purchases = [], 
    expenses = [],
    customers = [],
    suppliers = [],
    products = [],
    business 
  } = state

  const [activeTab, setActiveTab] = useState('accounts')
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('')
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    accountNumber: '',
    accountType: '',
    accountSubType: '',
    openingBalance: 0,
    note: '',
    customFields: [{ label: '', value: '' }],
    status: 'active'
  })

  const [transferData, setTransferData] = useState({
    fromAccount: '',
    toAccount: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    note: ''
  })

  const [depositData, setDepositData] = useState({
    accountId: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
    note: ''
  })

  const [accountTypeForm, setAccountTypeForm] = useState({ name: '', description: '' })

  // Default account types
  const defaultAccountTypes = [
    { id: 'default', name: 'Default', description: 'Default account type' },
    { id: 'cash', name: 'Cash', description: 'Cash accounts' },
    { id: 'bank', name: 'Bank', description: 'Bank accounts' },
    { id: 'mobile', name: 'Mobile Wallet', description: 'Mobile payment accounts' },
    { id: 'credit', name: 'Credit Card', description: 'Credit card accounts' }
  ]

  const allAccountTypes = [...defaultAccountTypes, ...(accountTypes || [])]

  // Safe arrays
  const safePaymentAccounts = paymentAccounts || []
  const safeSales = sales || []
  const safePurchases = purchases || []
  const safeExpenses = expenses || []
  const safeDeposits = deposits || []
  const safeFundTransfers = fundTransfers || []
  const safeCustomers = customers || []
  const safeSuppliers = suppliers || []
  const safeProducts = products || []

  // Helper function to compare IDs (handles string/number mismatch)
  const isSameId = (id1, id2) => {
    if (id1 === undefined || id1 === null || id1 === '') return false
    if (id2 === undefined || id2 === null || id2 === '') return false
    return String(id1) === String(id2)
  }

  // Calculate account balance - FIXED with proper ID comparison
  const calculateAccountBalance = (account) => {
    let balance = parseFloat(account.openingBalance) || 0

    // Add deposits
    safeDeposits.filter(d => isSameId(d.accountId, account.id)).forEach(d => {
      balance += parseFloat(d.amount) || 0
    })

    // Add incoming transfers (money coming IN to this account)
    safeFundTransfers.filter(t => isSameId(t.toAccount, account.id)).forEach(t => {
      balance += parseFloat(t.amount) || 0
    })

    // Subtract outgoing transfers (money going OUT from this account)
    safeFundTransfers.filter(t => isSameId(t.fromAccount, account.id)).forEach(t => {
      balance -= parseFloat(t.amount) || 0
    })

    // Add sales payments linked to this account
    safeSales.filter(s => isSameId(s.paymentAccountId, account.id)).forEach(s => {
      balance += parseFloat(s.amountPaid) || 0
    })

    // Subtract purchase payments linked to this account
    safePurchases.filter(p => isSameId(p.paymentAccountId, account.id)).forEach(p => {
      balance -= parseFloat(p.amountPaid) || 0
    })

    // Subtract expenses linked to this account
    safeExpenses.filter(e => isSameId(e.paymentAccountId, account.id)).forEach(e => {
      balance -= parseFloat(e.amountPaid) || 0
    })

    return balance
  }

  // Get account transactions - FIXED
  const getAccountTransactions = (accountId) => {
    const transactions = []
    const account = safePaymentAccounts.find(a => isSameId(a.id, accountId))

    // Opening balance
    if (account && account.openingBalance > 0) {
      transactions.push({
        date: account.createdAt || new Date().toISOString(),
        description: 'Opening Balance',
        type: 'opening',
        debit: 0,
        credit: parseFloat(account.openingBalance) || 0,
        paymentMethod: '',
        addedBy: account.addedBy || 'Admin'
      })
    }

    // Deposits
    safeDeposits.filter(d => isSameId(d.accountId, accountId)).forEach(d => {
      transactions.push({
        date: d.date,
        description: 'Deposit',
        type: 'deposit',
        debit: 0,
        credit: parseFloat(d.amount) || 0,
        paymentMethod: d.paymentMethod,
        note: d.note,
        addedBy: d.addedBy || 'Admin'
      })
    })

    // Incoming transfers
    safeFundTransfers.filter(t => isSameId(t.toAccount, accountId)).forEach(t => {
      const fromAcc = safePaymentAccounts.find(a => isSameId(a.id, t.fromAccount))
      transactions.push({
        date: t.date,
        description: `Transfer from ${fromAcc?.name || 'Unknown'}`,
        type: 'transfer_in',
        debit: 0,
        credit: parseFloat(t.amount) || 0,
        paymentMethod: 'Transfer',
        note: t.note,
        addedBy: t.addedBy || 'Admin'
      })
    })

    // Outgoing transfers
    safeFundTransfers.filter(t => isSameId(t.fromAccount, accountId)).forEach(t => {
      const toAcc = safePaymentAccounts.find(a => isSameId(a.id, t.toAccount))
      transactions.push({
        date: t.date,
        description: `Transfer to ${toAcc?.name || 'Unknown'}`,
        type: 'transfer_out',
        debit: parseFloat(t.amount) || 0,
        credit: 0,
        paymentMethod: 'Transfer',
        note: t.note,
        addedBy: t.addedBy || 'Admin'
      })
    })

    // Sales payments
    safeSales.filter(s => isSameId(s.paymentAccountId, accountId)).forEach(s => {
      const customer = safeCustomers.find(c => isSameId(c.id, s.customerId))
      transactions.push({
        date: s.date || s.createdAt,
        description: `Sell - Customer: ${customer?.name || 'Walk-in'} - Invoice: ${s.invoiceNo || s.referenceNo}`,
        type: 'sale',
        debit: 0,
        credit: parseFloat(s.amountPaid) || 0,
        paymentMethod: s.paymentMethod || 'Cash',
        addedBy: s.addedBy || 'Admin'
      })
    })

    // Purchase payments
    safePurchases.filter(p => isSameId(p.paymentAccountId, accountId)).forEach(p => {
      const supplier = safeSuppliers.find(s => isSameId(s.id, p.supplierId))
      transactions.push({
        date: p.date || p.createdAt,
        description: `Purchase - Supplier: ${supplier?.name || 'Unknown'}`,
        type: 'purchase',
        debit: parseFloat(p.amountPaid) || 0,
        credit: 0,
        paymentMethod: p.paymentMethod || 'Cash',
        addedBy: p.addedBy || 'Admin'
      })
    })

    // Expense payments
    safeExpenses.filter(e => isSameId(e.paymentAccountId, accountId)).forEach(e => {
      transactions.push({
        date: e.date || e.createdAt,
        description: `Expense - ${e.note || e.referenceNo || 'General'}`,
        type: 'expense',
        debit: parseFloat(e.amountPaid) || 0,
        credit: 0,
        paymentMethod: e.paymentMethod || 'Cash',
        addedBy: e.addedBy || 'Admin'
      })
    })

    // Sort by date and calculate running balance
    transactions.sort((a, b) => new Date(a.date) - new Date(b.date))
    let runningBalance = 0
    transactions.forEach(t => {
      runningBalance += t.credit - t.debit
      t.balance = runningBalance
    })

    return transactions
  }

  // Get cash flow transactions - FIXED
  const getCashFlowTransactions = () => {
    const transactions = []

    // Opening balances
    safePaymentAccounts.forEach(acc => {
      if (acc.openingBalance > 0) {
        transactions.push({
          date: acc.createdAt || new Date().toISOString(),
          account: acc.name,
          accountId: acc.id,
          description: 'Opening Balance',
          paymentMethod: '',
          debit: 0,
          credit: parseFloat(acc.openingBalance) || 0
        })
      }
    })

    // Deposits
    safeDeposits.forEach(d => {
      const account = safePaymentAccounts.find(a => isSameId(a.id, d.accountId))
      transactions.push({
        date: d.date,
        account: account?.name || 'Unknown',
        accountId: d.accountId,
        description: 'Deposit',
        paymentMethod: d.paymentMethod,
        debit: 0,
        credit: parseFloat(d.amount) || 0
      })
    })

    // Transfers
    safeFundTransfers.forEach(t => {
      const fromAcc = safePaymentAccounts.find(a => isSameId(a.id, t.fromAccount))
      const toAcc = safePaymentAccounts.find(a => isSameId(a.id, t.toAccount))
      
      // Outgoing from source
      transactions.push({
        date: t.date,
        account: fromAcc?.name || 'Unknown',
        accountId: t.fromAccount,
        description: `Transfer to ${toAcc?.name || 'Unknown'}`,
        paymentMethod: 'Transfer',
        debit: parseFloat(t.amount) || 0,
        credit: 0
      })
      
      // Incoming to destination
      transactions.push({
        date: t.date,
        account: toAcc?.name || 'Unknown',
        accountId: t.toAccount,
        description: `Transfer from ${fromAcc?.name || 'Unknown'}`,
        paymentMethod: 'Transfer',
        debit: 0,
        credit: parseFloat(t.amount) || 0
      })
    })

    // Sales with linked accounts
    safeSales.filter(s => s.paymentAccountId).forEach(s => {
      const account = safePaymentAccounts.find(a => isSameId(a.id, s.paymentAccountId))
      const customer = safeCustomers.find(c => isSameId(c.id, s.customerId))
      transactions.push({
        date: s.date || s.createdAt,
        account: account?.name || 'Unknown',
        accountId: s.paymentAccountId,
        description: `Sell - Customer: ${customer?.name || 'Walk-in'} - Invoice: ${s.invoiceNo || s.referenceNo}`,
        paymentMethod: s.paymentMethod || 'Cash',
        debit: 0,
        credit: parseFloat(s.amountPaid) || 0
      })
    })

    // Purchases with linked accounts
    safePurchases.filter(p => p.paymentAccountId).forEach(p => {
      const account = safePaymentAccounts.find(a => isSameId(a.id, p.paymentAccountId))
      const supplier = safeSuppliers.find(s => isSameId(s.id, p.supplierId))
      transactions.push({
        date: p.date || p.createdAt,
        account: account?.name || 'Unknown',
        accountId: p.paymentAccountId,
        description: `Purchase - Supplier: ${supplier?.name || 'Unknown'}`,
        paymentMethod: p.paymentMethod || 'Cash',
        debit: parseFloat(p.amountPaid) || 0,
        credit: 0
      })
    })

    // Expenses with linked accounts
    safeExpenses.filter(e => e.paymentAccountId).forEach(e => {
      const account = safePaymentAccounts.find(a => isSameId(a.id, e.paymentAccountId))
      transactions.push({
        date: e.date || e.createdAt,
        account: account?.name || 'Unknown',
        accountId: e.paymentAccountId,
        description: `Expense - ${e.note || e.referenceNo || 'General'}`,
        paymentMethod: e.paymentMethod || 'Cash',
        debit: parseFloat(e.amountPaid) || 0,
        credit: 0
      })
    })

    // Sort and calculate balances
    transactions.sort((a, b) => new Date(a.date) - new Date(b.date))
    const accountBalances = {}
    let totalBalance = 0
    transactions.forEach(t => {
      const accKey = String(t.accountId)
      if (!accountBalances[accKey]) accountBalances[accKey] = 0
      accountBalances[accKey] += t.credit - t.debit
      totalBalance += t.credit - t.debit
      t.accountBalance = accountBalances[accKey]
      t.totalBalance = totalBalance
    })

    return transactions
  }

  // Get unlinked payments
  const getUnlinkedPayments = () => {
    const unlinked = []

    safeSales.filter(s => !s.paymentAccountId && s.amountPaid > 0).forEach(s => {
      const customer = safeCustomers.find(c => isSameId(c.id, s.customerId))
      unlinked.push({
        id: s.id,
        type: 'sale',
        date: s.date || s.createdAt,
        paymentRefNo: `SP${new Date(s.date || s.createdAt).getFullYear()}/${String(s.id).padStart(4, '0')}`,
        invoiceNo: s.invoiceNo || s.referenceNo,
        amount: parseFloat(s.amountPaid) || 0,
        paymentType: 'Sell',
        description: `Customer: ${customer?.name || 'Walk-in Customer'}`
      })
    })

    safePurchases.filter(p => !p.paymentAccountId && p.amountPaid > 0).forEach(p => {
      const supplier = safeSuppliers.find(s => isSameId(s.id, p.supplierId))
      unlinked.push({
        id: p.id,
        type: 'purchase',
        date: p.date || p.createdAt,
        paymentRefNo: `PP${new Date(p.date || p.createdAt).getFullYear()}/${String(p.id).padStart(4, '0')}`,
        invoiceNo: p.referenceNo,
        amount: parseFloat(p.amountPaid) || 0,
        paymentType: 'Purchase',
        description: `Supplier: ${supplier?.name || 'Unknown'}`
      })
    })

    return unlinked.sort((a, b) => new Date(a.date) - new Date(b.date))
  }

  // Balance Sheet data
  const getBalanceSheetData = () => {
    const supplierDue = safePurchases.reduce((sum, p) => {
      const total = parseFloat(p.total) || parseFloat(p.totalAmount) || parseFloat(p.grandTotal) || 0
      const paid = parseFloat(p.amountPaid) || 0
      return sum + (total - paid)
    }, 0)

    const customerDue = safeSales.reduce((sum, s) => {
      const total = parseFloat(s.total) || parseFloat(s.totalAmount) || parseFloat(s.grandTotal) || 0
      const paid = parseFloat(s.amountPaid) || 0
      return sum + (total - paid)
    }, 0)

    const closingStock = safeProducts.reduce((sum, p) => {
      const qty = parseFloat(p.currentStock) || parseFloat(p.quantity) || 0
      const cost = parseFloat(p.costPrice) || parseFloat(p.purchasePrice) || 0
      return sum + (qty * cost)
    }, 0)

    const accountBalances = safePaymentAccounts.filter(a => a.status !== 'closed').map(acc => ({
      name: acc.name,
      balance: calculateAccountBalance(acc)
    }))

    const totalAccountBalance = accountBalances.reduce((sum, a) => sum + a.balance, 0)

    return {
      supplierDue,
      customerDue,
      closingStock,
      accountBalances,
      totalLiability: supplierDue,
      totalAssets: customerDue + closingStock + totalAccountBalance
    }
  }

  // Trial Balance data
  const getTrialBalanceData = () => {
    const supplierDue = safePurchases.reduce((sum, p) => {
      const total = parseFloat(p.total) || parseFloat(p.totalAmount) || parseFloat(p.grandTotal) || 0
      const paid = parseFloat(p.amountPaid) || 0
      return sum + (total - paid)
    }, 0)

    const customerDue = safeSales.reduce((sum, s) => {
      const total = parseFloat(s.total) || parseFloat(s.totalAmount) || parseFloat(s.grandTotal) || 0
      const paid = parseFloat(s.amountPaid) || 0
      return sum + (total - paid)
    }, 0)

    const accountBalances = safePaymentAccounts.filter(a => a.status !== 'closed').map(acc => ({
      name: acc.name,
      balance: calculateAccountBalance(acc)
    }))

    let totalDebit = customerDue
    let totalCredit = supplierDue

    accountBalances.forEach(a => {
      if (a.balance >= 0) totalDebit += a.balance
      else totalCredit += Math.abs(a.balance)
    })

    return { supplierDue, customerDue, accountBalances, totalDebit, totalCredit }
  }

  // Filtered accounts
  const filteredAccounts = safePaymentAccounts.filter(acc => {
    const matchesSearch = acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (acc.accountNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || acc.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalBalance = filteredAccounts.reduce((sum, acc) => sum + calculateAccountBalance(acc), 0)

  // Modal handlers
  const openAddAccount = () => {
    setFormData({
      name: '', accountNumber: '', accountType: '', accountSubType: '',
      openingBalance: 0, note: '', customFields: [{ label: '', value: '' }], status: 'active'
    })
    setModalType('add-account')
    setShowModal(true)
  }

  const openEditAccount = (account) => {
    setFormData({ ...account, customFields: account.customFields || [{ label: '', value: '' }] })
    setSelectedAccount(account)
    setModalType('edit-account')
    setShowModal(true)
  }

  const openFundTransfer = (account = null) => {
    setTransferData({
      fromAccount: account?.id || '',
      toAccount: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      note: ''
    })
    setModalType('fund-transfer')
    setShowModal(true)
  }

  const openDeposit = (account) => {
    setDepositData({
      accountId: account.id,
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Cash',
      note: ''
    })
    setSelectedAccount(account)
    setModalType('deposit')
    setShowModal(true)
  }

  const openAccountBook = (account) => {
    setSelectedAccount(account)
    setModalType('account-book')
    setShowModal(true)
  }

  // Save handlers
  const saveAccount = () => {
    if (!formData.name.trim()) {
      alert('Account name is required')
      return
    }

    const accountData = {
      ...formData,
      openingBalance: parseFloat(formData.openingBalance) || 0,
      customFields: formData.customFields.filter(f => f.label.trim()),
      addedBy: 'Admin',
      createdAt: new Date().toISOString()
    }

    if (modalType === 'edit-account') {
      dispatch({ type: 'UPDATE_PAYMENT_ACCOUNT', payload: { id: selectedAccount.id, ...accountData } })
    } else {
      // Generate temp ID so the account can be properly tracked before Firestore assigns real ID
      dispatch({ type: 'ADD_PAYMENT_ACCOUNT', payload: { ...accountData, id: Date.now().toString() } })
    }
    setShowModal(false)
  }

  // FIXED: Save Fund Transfer with proper number conversion
  const saveFundTransfer = () => {
    if (!transferData.fromAccount || !transferData.toAccount) {
      alert('Select both accounts')
      return
    }
    if (String(transferData.fromAccount) === String(transferData.toAccount)) {
      alert('Cannot transfer to same account')
      return
    }
    if (parseFloat(transferData.amount) <= 0) {
      alert('Amount must be greater than 0')
      return
    }

    // Get account names for better tracking
    const fromAcc = safePaymentAccounts.find(a => isSameId(a.id, transferData.fromAccount))
    const toAcc = safePaymentAccounts.find(a => isSameId(a.id, transferData.toAccount))

    // FIXED: Keep IDs as strings - Firestore uses string IDs
    const transferPayload = {
      fromAccount: transferData.fromAccount,
      toAccount: transferData.toAccount,
      amount: parseFloat(transferData.amount),
      date: transferData.date,
      note: transferData.note || `Transfer from ${fromAcc?.name} to ${toAcc?.name}`,
      addedBy: 'Admin',
      createdAt: new Date().toISOString()
    }

    console.log('Saving fund transfer:', transferPayload) // Debug log

    dispatch({
      type: 'ADD_FUND_TRANSFER',
      payload: transferPayload
    })
    
    setShowModal(false)
  }

  // FIXED: Save Deposit with proper number conversion
  const saveDeposit = () => {
    if (parseFloat(depositData.amount) <= 0) {
      alert('Amount must be greater than 0')
      return
    }

    const depositPayload = {
      accountId: depositData.accountId,
      amount: parseFloat(depositData.amount),
      date: depositData.date,
      paymentMethod: depositData.paymentMethod,
      note: depositData.note,
      addedBy: 'Admin',
      createdAt: new Date().toISOString()
    }

    console.log('Saving deposit:', depositPayload) // Debug log

    dispatch({
      type: 'ADD_DEPOSIT',
      payload: depositPayload
    })
    
    setShowModal(false)
  }

  const saveAccountType = () => {
    if (!accountTypeForm.name.trim()) {
      alert('Type name is required')
      return
    }
    dispatch({ type: 'ADD_ACCOUNT_TYPE', payload: { ...accountTypeForm, id: Date.now().toString() } })
    setShowModal(false)
  }

  const closeAccount = (account) => {
    if (window.confirm(`Close "${account.name}" account?`)) {
      dispatch({ type: 'UPDATE_PAYMENT_ACCOUNT', payload: { id: account.id, status: 'closed' } })
    }
  }

  const linkPaymentToAccount = (payment, accountId) => {
    if (payment.type === 'sale') {
      dispatch({ type: 'UPDATE_SALE', payload: { id: payment.id, paymentAccountId: accountId } })
    } else {
      dispatch({ type: 'UPDATE_PURCHASE', payload: { id: payment.id, paymentAccountId: accountId } })
    }
  }

  const formatCurrency = (amount) => {
    const currency = business?.currency || 'Rs'
    return `${currency} ${parseFloat(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString()
  }

  const formatDateTime = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleString()
  }

  // Tabs
  const tabs = [
    { id: 'accounts', label: 'Accounts', icon: '💳' },
    { id: 'account-types', label: 'Account Types', icon: '📋' },
    { id: 'balance-sheet', label: 'Balance Sheet', icon: '📊' },
    { id: 'trial-balance', label: 'Trial Balance', icon: '⚖️' },
    { id: 'cash-flow', label: 'Cash Flow', icon: '💰' },
    { id: 'payment-report', label: 'Payment Report', icon: '📄' }
  ]

  // Get data for rendering
  const unlinkedPayments = getUnlinkedPayments()
  const cashFlowTransactions = getCashFlowTransactions()
  const balanceSheetData = getBalanceSheetData()
  const trialBalanceData = getTrialBalanceData()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Payment Accounts</h1>
          <p className="text-slate-400">Manage your accounts and view financial reports</p>
        </div>
        {activeTab === 'accounts' && (
          <div className="flex gap-2">
            <button onClick={() => openFundTransfer()} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2">
              🔄 Fund Transfer
            </button>
            <button onClick={openAddAccount} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2">
              + Add Account
            </button>
          </div>
        )}
        {activeTab === 'account-types' && (
          <button onClick={() => { setAccountTypeForm({ name: '', description: '' }); setModalType('add-account-type'); setShowModal(true) }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">+ Add Type</button>
        )}
      </div>

      {/* Unlinked payments alert */}
      {unlinkedPayments.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between">
          <span className="text-amber-400">
            ⚠️ Total <strong>{unlinkedPayments.length}</strong> payments not linked with any account.
          </span>
          <button onClick={() => setActiveTab('payment-report')} className="text-amber-400 hover:text-amber-300 underline">View Details</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap border-b border-slate-700 pb-4">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
            <span>{tab.icon}</span>{tab.label}
          </button>
        ))}
      </div>

      {/* ACCOUNTS TAB */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <div className="flex gap-4 items-center">
            <select id="paFilterStatus" name="paFilterStatus" aria-label="Filter by account status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white">
              <option value="active">Active</option>
              <option value="closed">Closed</option>
              <option value="all">All</option>
            </select>
            <input id="paSearch" name="paSearch" autoComplete="off" aria-label="Search payment accounts" type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white flex-1 max-w-xs" />
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-900/50">
                  <th className="text-left p-4 text-slate-400 font-medium">Name</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Account Type</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Account Number</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Note</th>
                  <th className="text-right p-4 text-slate-400 font-medium">Balance</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Added By</th>
                  <th className="text-center p-4 text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.length === 0 ? (
                  <tr><td colSpan="7" className="p-8 text-center text-slate-500">No accounts found</td></tr>
                ) : filteredAccounts.map(account => {
                  const balance = calculateAccountBalance(account)
                  return (
                    <tr key={account.id} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                      <td className="p-4 text-white font-medium">{account.name}</td>
                      <td className="p-4 text-slate-300">{account.accountType || '-'}</td>
                      <td className="p-4 text-slate-300">{account.accountNumber || '-'}</td>
                      <td className="p-4 text-slate-400 text-sm">{account.note || '-'}</td>
                      <td className={`p-4 text-right font-semibold ${balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(balance)}</td>
                      <td className="p-4 text-slate-300">{account.addedBy || 'Admin'}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          <button onClick={() => openEditAccount(account)} className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs hover:bg-yellow-500/30">Edit</button>
                          <button onClick={() => openAccountBook(account)} className="px-2 py-1 bg-slate-500/20 text-slate-300 rounded text-xs hover:bg-slate-500/30">Book</button>
                          <button onClick={() => openFundTransfer(account)} className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs hover:bg-purple-500/30">Transfer</button>
                          <button onClick={() => openDeposit(account)} className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs hover:bg-emerald-500/30">Deposit</button>
                          {account.status !== 'closed' && (
                            <button onClick={() => closeAccount(account)} className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30">Close</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              {filteredAccounts.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-900/50 border-t border-slate-700">
                    <td colSpan="4" className="p-4 text-white font-semibold">Total:</td>
                    <td className={`p-4 text-right font-bold ${totalBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(totalBalance)}</td>
                    <td colSpan="2"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* ACCOUNT TYPES TAB */}
      {activeTab === 'account-types' && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-900/50">
                <th className="text-left p-4 text-slate-400 font-medium">Name</th>
                <th className="text-left p-4 text-slate-400 font-medium">Description</th>
                <th className="text-center p-4 text-slate-400 font-medium">Accounts</th>
                <th className="text-center p-4 text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allAccountTypes.map(type => (
                <tr key={type.id} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                  <td className="p-4 text-white font-medium">{type.name}</td>
                  <td className="p-4 text-slate-300">{type.description || '-'}</td>
                  <td className="p-4 text-center text-slate-300">{safePaymentAccounts.filter(a => a.accountType === type.name).length}</td>
                  <td className="p-4 text-center">
                    {defaultAccountTypes.find(t => t.id === type.id) ? <span className="text-slate-500 text-sm">Default</span> : (
                      <button onClick={() => dispatch({ type: 'DELETE_ACCOUNT_TYPE', payload: type.id })}
                        className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-sm hover:bg-red-500/30">Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* BALANCE SHEET TAB */}
      {activeTab === 'balance-sheet' && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Balance Sheet</h2>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">🖨️ Print</button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Liability */}
            <div className="bg-slate-900/50 rounded-xl overflow-hidden">
              <div className="bg-blue-500/20 p-4"><h3 className="text-lg font-semibold text-blue-400">Liability</h3></div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between"><span className="text-slate-300">Supplier Due:</span><span className="text-white font-medium">{formatCurrency(balanceSheetData.supplierDue)}</span></div>
              </div>
              <div className="bg-blue-500/10 p-4 border-t border-slate-700">
                <div className="flex justify-between"><span className="text-blue-400 font-semibold">Total Liability:</span><span className="text-blue-400 font-bold">{formatCurrency(balanceSheetData.totalLiability)}</span></div>
              </div>
            </div>
            {/* Assets */}
            <div className="bg-slate-900/50 rounded-xl overflow-hidden">
              <div className="bg-emerald-500/20 p-4"><h3 className="text-lg font-semibold text-emerald-400">Assets</h3></div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between"><span className="text-slate-300">Customer Due:</span><span className="text-white font-medium">{formatCurrency(balanceSheetData.customerDue)}</span></div>
                <div className="flex justify-between"><span className="text-slate-300">Closing Stock:</span><span className="text-white font-medium">{formatCurrency(balanceSheetData.closingStock)}</span></div>
                <div className="border-t border-slate-700 pt-3">
                  <p className="text-slate-400 text-sm mb-2">Account Balances:</p>
                  {balanceSheetData.accountBalances.map((acc, i) => (
                    <div key={i} className="flex justify-between pl-4"><span className="text-slate-400">{acc.name}:</span><span className={acc.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}>{formatCurrency(acc.balance)}</span></div>
                  ))}
                </div>
              </div>
              <div className="bg-emerald-500/10 p-4 border-t border-slate-700">
                <div className="flex justify-between"><span className="text-emerald-400 font-semibold">Total Assets:</span><span className="text-emerald-400 font-bold">{formatCurrency(balanceSheetData.totalAssets)}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TRIAL BALANCE TAB */}
      {activeTab === 'trial-balance' && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Trial Balance</h2>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">🖨️ Print</button>
          </div>
          <table className="w-full">
            <thead><tr className="bg-blue-500/20">
              <th className="text-left p-4 text-blue-400 font-semibold">Trial Balance</th>
              <th className="text-right p-4 text-blue-400 font-semibold">Debit</th>
              <th className="text-right p-4 text-blue-400 font-semibold">Credit</th>
            </tr></thead>
            <tbody>
              <tr className="border-t border-slate-700/50"><td className="p-4 text-slate-300">Supplier Due:</td><td className="p-4 text-right text-slate-400">-</td><td className="p-4 text-right text-white">{formatCurrency(trialBalanceData.supplierDue)}</td></tr>
              <tr className="border-t border-slate-700/50"><td className="p-4 text-slate-300">Customer Due:</td><td className="p-4 text-right text-white">{formatCurrency(trialBalanceData.customerDue)}</td><td className="p-4 text-right text-slate-400">-</td></tr>
              <tr className="border-t border-slate-700/50"><td className="p-4 text-slate-300 font-medium" colSpan="3">Account Balances:</td></tr>
              {trialBalanceData.accountBalances.map((acc, i) => (
                <tr key={i} className="border-t border-slate-700/50"><td className="p-4 pl-8 text-slate-400">{acc.name}:</td><td className="p-4 text-right text-white">{acc.balance >= 0 ? formatCurrency(acc.balance) : '-'}</td><td className="p-4 text-right text-white">{acc.balance < 0 ? formatCurrency(Math.abs(acc.balance)) : '-'}</td></tr>
              ))}
            </tbody>
            <tfoot><tr className="bg-blue-500/20 border-t border-slate-700">
              <td className="p-4 text-blue-400 font-bold">Total</td>
              <td className="p-4 text-right text-blue-400 font-bold">{formatCurrency(trialBalanceData.totalDebit)}</td>
              <td className="p-4 text-right text-blue-400 font-bold">{formatCurrency(trialBalanceData.totalCredit)}</td>
            </tr></tfoot>
          </table>
        </div>
      )}

      {/* CASH FLOW TAB */}
      {activeTab === 'cash-flow' && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-700"><h2 className="text-lg font-semibold text-white">Cash Flow</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-slate-900/50">
                <th className="text-left p-3 text-slate-400 font-medium text-sm">Date</th>
                <th className="text-left p-3 text-slate-400 font-medium text-sm">Account</th>
                <th className="text-left p-3 text-slate-400 font-medium text-sm">Description</th>
                <th className="text-left p-3 text-slate-400 font-medium text-sm">Payment Method</th>
                <th className="text-right p-3 text-slate-400 font-medium text-sm">Debit</th>
                <th className="text-right p-3 text-slate-400 font-medium text-sm">Credit</th>
                <th className="text-right p-3 text-slate-400 font-medium text-sm">Account Balance</th>
                <th className="text-right p-3 text-slate-400 font-medium text-sm">Total Balance</th>
              </tr></thead>
              <tbody>
                {cashFlowTransactions.length === 0 ? (
                  <tr><td colSpan="8" className="p-8 text-center text-slate-500">No transactions found</td></tr>
                ) : cashFlowTransactions.map((t, i) => (
                  <tr key={i} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                    <td className="p-3 text-slate-300 text-sm">{formatDateTime(t.date)}</td>
                    <td className="p-3 text-white text-sm">{t.account}</td>
                    <td className="p-3 text-slate-300 text-sm">{t.description}</td>
                    <td className="p-3 text-slate-300 text-sm">{t.paymentMethod || '-'}</td>
                    <td className="p-3 text-right text-red-400 text-sm">{t.debit > 0 ? formatCurrency(t.debit) : '-'}</td>
                    <td className="p-3 text-right text-emerald-400 text-sm">{t.credit > 0 ? formatCurrency(t.credit) : '-'}</td>
                    <td className={`p-3 text-right text-sm ${t.accountBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(t.accountBalance)}</td>
                    <td className={`p-3 text-right text-sm font-medium ${t.totalBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(t.totalBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PAYMENT REPORT TAB */}
      {activeTab === 'payment-report' && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white">Payment Account Report</h2>
            <p className="text-slate-400 text-sm">Payments not linked to any account</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-slate-900/50">
                <th className="text-left p-3 text-slate-400 font-medium text-sm">Date</th>
                <th className="text-left p-3 text-slate-400 font-medium text-sm">Payment Ref No.</th>
                <th className="text-left p-3 text-slate-400 font-medium text-sm">Invoice/Ref No.</th>
                <th className="text-right p-3 text-slate-400 font-medium text-sm">Amount</th>
                <th className="text-left p-3 text-slate-400 font-medium text-sm">Type</th>
                <th className="text-left p-3 text-slate-400 font-medium text-sm">Description</th>
                <th className="text-center p-3 text-slate-400 font-medium text-sm">Action</th>
              </tr></thead>
              <tbody>
                {unlinkedPayments.length === 0 ? (
                  <tr><td colSpan="7" className="p-8 text-center text-emerald-400">✓ All payments are linked to accounts</td></tr>
                ) : unlinkedPayments.map((payment, i) => (
                  <tr key={i} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                    <td className="p-3 text-slate-300 text-sm">{formatDateTime(payment.date)}</td>
                    <td className="p-3 text-white text-sm">{payment.paymentRefNo}</td>
                    <td className="p-3"><span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs">{payment.invoiceNo}</span></td>
                    <td className="p-3 text-right text-white text-sm">{formatCurrency(payment.amount)}</td>
                    <td className="p-3 text-slate-300 text-sm">{payment.paymentType}</td>
                    <td className="p-3 text-slate-300 text-sm">{payment.description}</td>
                    <td className="p-3 text-center">
                      <select aria-label={`Link account for ${payment.paymentRefNo}`} onChange={(e) => { if (e.target.value) { linkPaymentToAccount(payment, e.target.value); e.target.value = '' } }}
                        className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-xs">
                        <option value="">Link Account</option>
                        {safePaymentAccounts.filter(a => a.status !== 'closed').map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODALS */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Add/Edit Account */}
            {(modalType === 'add-account' || modalType === 'edit-account') && (
              <>
                <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">{modalType === 'edit-account' ? 'Edit Account' : 'Add Account'}</h3>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xl">×</button>
                </div>
                <div className="p-4 space-y-4">
                  <div><label htmlFor="paAccName" className="block text-sm text-slate-300 mb-1">Name: *</label>
                    <input id="paAccName" name="paAccName" autoComplete="off" type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" placeholder="Account Name" /></div>
                  <div><label htmlFor="paAccNumber" className="block text-sm text-slate-300 mb-1">Account Number:</label>
                    <input id="paAccNumber" name="paAccNumber" autoComplete="off" type="text" value={formData.accountNumber} onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" placeholder="Account Number" /></div>
                  <div><label htmlFor="paAccType" className="block text-sm text-slate-300 mb-1">Account Type:</label>
                    <select id="paAccType" name="paAccType" value={formData.accountType} onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white">
                      <option value="">Select Type</option>
                      {allAccountTypes.map(type => <option key={type.id} value={type.name}>{type.name}</option>)}
                    </select></div>
                  <div><label htmlFor="paAccOpenBal" className="block text-sm text-slate-300 mb-1">Opening Balance:</label>
                    <input id="paAccOpenBal" name="paAccOpenBal" autoComplete="off" type="number" value={formData.openingBalance} onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" placeholder="0" /></div>
                  <div><label htmlFor="paAccNote" className="block text-sm text-slate-300 mb-1">Note:</label>
                    <textarea id="paAccNote" name="paAccNote" value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" rows="2" /></div>
                </div>
                <div className="p-4 border-t border-slate-700 flex justify-end gap-2">
                  <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">Cancel</button>
                  <button onClick={saveAccount} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">{modalType === 'edit-account' ? 'Update' : 'Save'}</button>
                </div>
              </>
            )}

            {/* Fund Transfer - FIXED */}
            {modalType === 'fund-transfer' && (
              <>
                <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Fund Transfer</h3>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xl">×</button>
                </div>
                <div className="p-4 space-y-4">
                  <div><label htmlFor="paXferFrom" className="block text-sm text-slate-300 mb-1">Transfer from: *</label>
                    <select id="paXferFrom" name="paXferFrom" value={transferData.fromAccount} onChange={(e) => setTransferData({ ...transferData, fromAccount: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white">
                      <option value="">Select Account</option>
                      {safePaymentAccounts.filter(a => a.status !== 'closed').map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(calculateAccountBalance(acc))})</option>
                      ))}
                    </select>
                  </div>
                  <div><label htmlFor="paXferTo" className="block text-sm text-slate-300 mb-1">Transfer To: *</label>
                    <select id="paXferTo" name="paXferTo" value={transferData.toAccount} onChange={(e) => setTransferData({ ...transferData, toAccount: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white">
                      <option value="">Select Account</option>
                      {safePaymentAccounts.filter(a => a.status !== 'closed' && String(a.id) !== String(transferData.fromAccount)).map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(calculateAccountBalance(acc))})</option>
                      ))}
                    </select>
                  </div>
                  <div><label htmlFor="paXferAmount" className="block text-sm text-slate-300 mb-1">Amount: *</label>
                    <input id="paXferAmount" name="paXferAmount" autoComplete="off" type="number" value={transferData.amount} onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" placeholder="0" /></div>
                  <div><label htmlFor="paXferDate" className="block text-sm text-slate-300 mb-1">Date: *</label>
                    <input id="paXferDate" name="paXferDate" type="date" value={transferData.date} onChange={(e) => setTransferData({ ...transferData, date: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" /></div>
                  <div><label htmlFor="paXferNote" className="block text-sm text-slate-300 mb-1">Note:</label>
                    <textarea id="paXferNote" name="paXferNote" value={transferData.note} onChange={(e) => setTransferData({ ...transferData, note: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" rows="3" /></div>
                  
                  {/* Preview */}
                  {transferData.fromAccount && transferData.toAccount && transferData.amount > 0 && (
                    <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                      <p className="text-slate-400 text-sm mb-2">Transfer Preview:</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white">
                          {safePaymentAccounts.find(a => isSameId(a.id, transferData.fromAccount))?.name}
                        </span>
                        <span className="text-purple-400">→ {formatCurrency(transferData.amount)} →</span>
                        <span className="text-white">
                          {safePaymentAccounts.find(a => isSameId(a.id, transferData.toAccount))?.name}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4 border-t border-slate-700 flex justify-end gap-2">
                  <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">Close</button>
                  <button onClick={saveFundTransfer} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Submit</button>
                </div>
              </>
            )}

            {/* Deposit */}
            {modalType === 'deposit' && (
              <>
                <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Deposit to {selectedAccount?.name}</h3>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xl">×</button>
                </div>
                <div className="p-4 space-y-4">
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <p className="text-slate-400 text-sm">Current Balance:</p>
                    <p className="text-emerald-400 font-semibold">{formatCurrency(calculateAccountBalance(selectedAccount))}</p>
                  </div>
                  <div><label htmlFor="paDepAmount" className="block text-sm text-slate-300 mb-1">Amount: *</label>
                    <input id="paDepAmount" name="paDepAmount" autoComplete="off" type="number" value={depositData.amount} onChange={(e) => setDepositData({ ...depositData, amount: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" placeholder="0" /></div>
                  <div><label htmlFor="paDepDate" className="block text-sm text-slate-300 mb-1">Date: *</label>
                    <input id="paDepDate" name="paDepDate" type="date" value={depositData.date} onChange={(e) => setDepositData({ ...depositData, date: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" /></div>
                  <div><label htmlFor="paDepMethod" className="block text-sm text-slate-300 mb-1">Payment Method:</label>
                    <select id="paDepMethod" name="paDepMethod" value={depositData.paymentMethod} onChange={(e) => setDepositData({ ...depositData, paymentMethod: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white">
                      <option value="Cash">Cash</option><option value="Bank Transfer">Bank Transfer</option><option value="Cheque">Cheque</option><option value="Other">Other</option>
                    </select></div>
                  <div><label htmlFor="paDepNote" className="block text-sm text-slate-300 mb-1">Note:</label>
                    <textarea id="paDepNote" name="paDepNote" value={depositData.note} onChange={(e) => setDepositData({ ...depositData, note: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" rows="2" /></div>
                </div>
                <div className="p-4 border-t border-slate-700 flex justify-end gap-2">
                  <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">Cancel</button>
                  <button onClick={saveDeposit} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Deposit</button>
                </div>
              </>
            )}

            {/* Account Book */}
            {modalType === 'account-book' && selectedAccount && (
              <>
                <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Account Book</h3>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xl">×</button>
                </div>
                <div className="p-4">
                  <div className="bg-slate-900/50 rounded-lg p-4 mb-4 grid grid-cols-2 gap-4">
                    <div><p className="text-slate-400 text-sm">Account Name:</p><p className="text-white font-medium">{selectedAccount.name}</p></div>
                    <div><p className="text-slate-400 text-sm">Account Type:</p><p className="text-white">{selectedAccount.accountType || '-'}</p></div>
                    <div><p className="text-slate-400 text-sm">Account Number:</p><p className="text-white">{selectedAccount.accountNumber || '-'}</p></div>
                    <div><p className="text-slate-400 text-sm">Balance:</p><p className={`font-semibold ${calculateAccountBalance(selectedAccount) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(calculateAccountBalance(selectedAccount))}</p></div>
                  </div>
                  <div className="overflow-x-auto max-h-80">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-slate-800"><tr>
                        <th className="text-left p-2 text-slate-400">Date</th>
                        <th className="text-left p-2 text-slate-400">Description</th>
                        <th className="text-right p-2 text-slate-400">Debit</th>
                        <th className="text-right p-2 text-slate-400">Credit</th>
                        <th className="text-right p-2 text-slate-400">Balance</th>
                      </tr></thead>
                      <tbody>
                        {getAccountTransactions(selectedAccount.id).length === 0 ? (
                          <tr><td colSpan="5" className="p-4 text-center text-slate-500">No transactions</td></tr>
                        ) : getAccountTransactions(selectedAccount.id).map((t, i) => (
                          <tr key={i} className="border-t border-slate-700/50">
                            <td className="p-2 text-slate-300">{formatDate(t.date)}</td>
                            <td className="p-2 text-white">{t.description}</td>
                            <td className="p-2 text-right text-red-400">{t.debit > 0 ? formatCurrency(t.debit) : '-'}</td>
                            <td className="p-2 text-right text-emerald-400">{t.credit > 0 ? formatCurrency(t.credit) : '-'}</td>
                            <td className={`p-2 text-right ${t.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(t.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="p-4 border-t border-slate-700 flex justify-end">
                  <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">Close</button>
                </div>
              </>
            )}

            {/* Add Account Type */}
            {modalType === 'add-account-type' && (
              <>
                <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Add Account Type</h3>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xl">×</button>
                </div>
                <div className="p-4 space-y-4">
                  <div><label htmlFor="paTypeName" className="block text-sm text-slate-300 mb-1">Name: *</label>
                    <input id="paTypeName" name="paTypeName" autoComplete="off" type="text" value={accountTypeForm.name} onChange={(e) => setAccountTypeForm({ ...accountTypeForm, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" placeholder="Type Name" /></div>
                  <div><label htmlFor="paTypeDesc" className="block text-sm text-slate-300 mb-1">Description:</label>
                    <textarea id="paTypeDesc" name="paTypeDesc" value={accountTypeForm.description} onChange={(e) => setAccountTypeForm({ ...accountTypeForm, description: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" rows="2" /></div>
                </div>
                <div className="p-4 border-t border-slate-700 flex justify-end gap-2">
                  <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">Cancel</button>
                  <button onClick={saveAccountType} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Save</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}