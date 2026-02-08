// AppContext.jsx - FIRESTORE VERSION
// Replaces localStorage with Firestore for multi-user data isolation
// Each business's data is stored under businesses/{businessId}/

import { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'
import {
  addDocument,
  updateDocument,
  deleteDocument,
  getDocuments,
  saveBusinessSettings,
  loadAllBusinessData,
  initializeNewBusiness,
  getNextCounter,
  setDocument,
  batchWrite
} from '../firebase/firestoreService'

// ============================================
// INITIAL STATE (empty - will be loaded from Firestore)
// ============================================
const emptyState = {
  // UI State only
  sidebarCollapsed: false,
  currentPage: 'dashboard',
  isLoading: true,
  dataLoaded: false,
  
  // Business Settings
  business: {
    name: 'My Business',
    currency: 'PKR',
    currencySymbol: 'Rs',
    currencyPlacement: 'before',
    phone: '',
    email: '',
    address: '',
    taxRate: 0,
    logo: null,
    defaultProfitPercent: 10,
    timezone: 'Asia/Karachi',
    financialYearStart: 'January',
    dateFormat: 'dd/mm/yyyy',
    timeFormat: '24',
    currencyPrecision: 2,
    quantityPrecision: 2,
    salePrefix: 'INV-',
    purchasePrefix: 'PUR-',
    expensePrefix: 'EXP-',
    paymentMethods: [
      { id: 1, name: 'Cash', enabled: true, isDefault: true },
      { id: 2, name: 'Card', enabled: true, isDefault: false },
      { id: 3, name: 'Bank Transfer', enabled: true, isDefault: false }
    ]
  },
  
  // Data Collections (loaded from Firestore)
  products: [],
  categories: [],
  brands: [],
  units: [],
  customers: [],
  suppliers: [],
  sales: [],
  purchases: [],
  expenses: [],
  stockAdjustments: [],
  salesPayments: [],
  purchasePayments: [],
  saleReturns: [],
  purchaseReturns: [],
  
  // ===== NEWLY ADDED COLLECTIONS =====
  salesAgents: [],
  paymentAccounts: [],
  taxRates: [],
  roles: [],
  activityLogs: [],
  warranties: [],
  expenseCategories: [],
  accountTypes: [],
  fundTransfers: [],
  deposits: [],
  registerSessions: [],
  
  // Counters
  saleCounter: 1,
  purchaseCounter: 1,
  expenseCounter: 1,
  customerIdCounter: 1,
  contactIdCounter: 1
}

// ============================================
// REDUCER - Handles LOCAL state updates
// (Firestore sync happens in the provider)
// ============================================
function appReducer(state, action) {
  switch (action.type) {
    // ============== DATA LOADING ==============
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    
    case 'LOAD_ALL_DATA':
      return { 
        ...state, 
        ...action.payload,
        isLoading: false,
        dataLoaded: true 
      }
    
    case 'RESET_STATE':
      return { ...emptyState, isLoading: false }
    
    // ============== UI STATE ==============
    case 'SET_PAGE':
      return { ...state, currentPage: action.payload }
    
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed }

    // ============== BUSINESS SETTINGS ==============
    case 'UPDATE_BUSINESS':
    case 'UPDATE_BUSINESS_SETTINGS':
      return { 
        ...state, 
        business: { ...state.business, ...action.payload }
      }

    // ============== PRODUCTS ==============
    case 'ADD_PRODUCT':
      return { 
        ...state, 
        products: [...(state.products || []), action.payload]
      }
    
    case 'UPDATE_PRODUCT':
      return { 
        ...state, 
        products: (state.products || []).map(p => 
          p.id === action.payload.id ? { ...p, ...action.payload } : p
        )
      }
    
    case 'DELETE_PRODUCT':
      return { 
        ...state, 
        products: (state.products || []).filter(p => p.id !== action.payload)
      }
    
    case 'UPDATE_STOCK':
      return { 
        ...state, 
        products: (state.products || []).map(p => 
          p.id === action.payload.id 
            ? { ...p, currentStock: (p.currentStock || 0) + action.payload.quantity } 
            : p
        )
      }
    
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload || [] }

    // ============== CATEGORIES ==============
    case 'ADD_CATEGORY':
      return { ...state, categories: [...(state.categories || []), action.payload] }
    
    case 'UPDATE_CATEGORY':
      return { 
        ...state, 
        categories: (state.categories || []).map(c => 
          c.id === action.payload.id ? action.payload : c
        )
      }
    
    case 'DELETE_CATEGORY':
      return { ...state, categories: (state.categories || []).filter(c => c.id !== action.payload) }

    // ============== BRANDS ==============
    case 'ADD_BRAND':
      return { ...state, brands: [...(state.brands || []), action.payload] }
    
    case 'UPDATE_BRAND':
      return { 
        ...state, 
        brands: (state.brands || []).map(b => b.id === action.payload.id ? action.payload : b)
      }
    
    case 'DELETE_BRAND':
      return { ...state, brands: (state.brands || []).filter(b => b.id !== action.payload) }

    // ============== UNITS ==============
    case 'ADD_UNIT':
      return { ...state, units: [...(state.units || []), action.payload] }
    
    case 'UPDATE_UNIT':
      return { 
        ...state, 
        units: (state.units || []).map(u => u.id === action.payload.id ? action.payload : u)
      }
    
    case 'DELETE_UNIT':
      return { ...state, units: (state.units || []).filter(u => u.id !== action.payload) }

    // ============== WARRANTIES ==============
    case 'ADD_WARRANTY':
      return { ...state, warranties: [...(state.warranties || []), action.payload] }
    
    case 'UPDATE_WARRANTY':
      return { 
        ...state, 
        warranties: (state.warranties || []).map(w => w.id === action.payload.id ? action.payload : w)
      }
    
    case 'DELETE_WARRANTY':
      return { ...state, warranties: (state.warranties || []).filter(w => w.id !== action.payload) }

    // ============== EXPENSE CATEGORIES ==============
    case 'ADD_EXPENSE_CATEGORY':
      return { ...state, expenseCategories: [...(state.expenseCategories || []), action.payload] }
    
    case 'UPDATE_EXPENSE_CATEGORY':
      return { 
        ...state, 
        expenseCategories: (state.expenseCategories || []).map(c => 
          c.id === action.payload.id ? { ...c, ...action.payload } : c
        )
      }
    
    case 'DELETE_EXPENSE_CATEGORY':
      return { ...state, expenseCategories: (state.expenseCategories || []).filter(c => c.id !== action.payload) }

    // ============== ACCOUNT TYPES ==============
    case 'ADD_ACCOUNT_TYPE':
      return { ...state, accountTypes: [...(state.accountTypes || []), action.payload] }
    
    case 'UPDATE_ACCOUNT_TYPE':
      return { 
        ...state, 
        accountTypes: (state.accountTypes || []).map(t => 
          t.id === action.payload.id ? { ...t, ...action.payload } : t
        )
      }
    
    case 'DELETE_ACCOUNT_TYPE':
      return { ...state, accountTypes: (state.accountTypes || []).filter(t => t.id !== action.payload) }

    // ============== FUND TRANSFERS ==============
    case 'ADD_FUND_TRANSFER':
      return { ...state, fundTransfers: [...(state.fundTransfers || []), action.payload] }

    // ============== DEPOSITS ==============
    case 'ADD_DEPOSIT':
      return { ...state, deposits: [...(state.deposits || []), action.payload] }

    // ============== REGISTER SESSIONS ==============
    case 'OPEN_REGISTER_SESSION':
      return { ...state, registerSessions: [...(state.registerSessions || []), action.payload] }

    case 'CLOSE_REGISTER_SESSION':
      return {
        ...state,
        registerSessions: (state.registerSessions || []).map(s =>
          String(s.id) === String(action.payload.id) ? { ...s, ...action.payload } : s
        )
      }

    case 'ADD_CASH_MOVEMENT': {
      const { sessionId, movement } = action.payload
      return {
        ...state,
        registerSessions: (state.registerSessions || []).map(s =>
          String(s.id) === String(sessionId)
            ? { ...s, cashMovements: [...(s.cashMovements || []), movement] }
            : s
        )
      }
    }

    case 'UPDATE_REGISTER_SESSION': {
      const { _tempId, ...updateData } = action.payload
      return {
        ...state,
        registerSessions: (state.registerSessions || []).map(s => {
          const matchById = s.id !== undefined && s.id !== null && String(s.id) === String(updateData.id)
          const matchByTempId = _tempId && s.id !== undefined && s.id !== null && String(s.id) === String(_tempId)
          if (matchById || matchByTempId) {
            return { ...s, ...updateData }
          }
          return s
        })
      }
    }

    // ============== CUSTOMERS ==============
    case 'ADD_CUSTOMER':
      return { 
        ...state, 
        customers: [...(state.customers || []), action.payload],
        customerIdCounter: (state.customerIdCounter || 0) + 1
      }
    
    case 'UPDATE_CUSTOMER':
      return { 
        ...state, 
        customers: (state.customers || []).map(c => 
          c.id === action.payload.id ? { ...c, ...action.payload } : c
        )
      }
    
    case 'DELETE_CUSTOMER':
      return { ...state, customers: (state.customers || []).filter(c => c.id !== action.payload) }
    
    case 'UPDATE_CUSTOMER_BALANCE':
      return { 
        ...state, 
        customers: (state.customers || []).map(c => 
          c.id === action.payload.id 
            ? { ...c, balance: (c.balance || 0) + action.payload.amount } 
            : c
        )
      }

    // ============== SUPPLIERS ==============
    case 'ADD_SUPPLIER':
      return { 
        ...state, 
        suppliers: [...(state.suppliers || []), action.payload],
        contactIdCounter: (state.contactIdCounter || 0) + 1
      }
    
    case 'UPDATE_SUPPLIER':
      return { 
        ...state, 
        suppliers: (state.suppliers || []).map(s => 
          s.id === action.payload.id ? { ...s, ...action.payload } : s
        )
      }
    
    case 'DELETE_SUPPLIER':
      return { ...state, suppliers: (state.suppliers || []).filter(s => s.id !== action.payload) }
    
    case 'UPDATE_SUPPLIER_BALANCE':
      return { 
        ...state, 
        suppliers: (state.suppliers || []).map(s => 
          s.id === action.payload.id 
            ? { ...s, balance: (s.balance || 0) + action.payload.amount } 
            : s
        )
      }

    // ============== SALES AGENTS ==============
    case 'ADD_SALES_AGENT':
      return { ...state, salesAgents: [...(state.salesAgents || []), action.payload] }
    
    case 'UPDATE_SALES_AGENT': {
      const { _tempId, ...updateData } = action.payload
      return { 
        ...state, 
        salesAgents: (state.salesAgents || []).map(a => {
          const matchById = a.id !== undefined && a.id !== null && String(a.id) === String(updateData.id)
          const matchByTempId = _tempId && a.id !== undefined && a.id !== null && String(a.id) === String(_tempId)
          if (matchById || matchByTempId) return { ...a, ...updateData }
          return a
        })
      }
    }
    
    case 'DELETE_SALES_AGENT':
      return { ...state, salesAgents: (state.salesAgents || []).filter(a => a.id !== action.payload) }

    // ============== PAYMENT ACCOUNTS ==============
    case 'ADD_PAYMENT_ACCOUNT':
      return { ...state, paymentAccounts: [...(state.paymentAccounts || []), action.payload] }
    
    case 'UPDATE_PAYMENT_ACCOUNT': {
      const { _tempId, ...updateData } = action.payload
      return { 
        ...state, 
        paymentAccounts: (state.paymentAccounts || []).map(a => {
          // Match by current ID OR by temp ID (for newly added accounts)
          const matchById = a.id !== undefined && a.id !== null && String(a.id) === String(updateData.id)
          const matchByTempId = _tempId && a.id !== undefined && a.id !== null && String(a.id) === String(_tempId)
          if (matchById || matchByTempId) {
            return { ...a, ...updateData }
          }
          return a
        })
      }
    }
    
    case 'DELETE_PAYMENT_ACCOUNT':
      return { ...state, paymentAccounts: (state.paymentAccounts || []).filter(a => a.id !== action.payload) }
    
    case 'UPDATE_ACCOUNT_BALANCE':
      return {
        ...state,
        paymentAccounts: (state.paymentAccounts || []).map(a =>
          a.id === action.payload.id
            ? { ...a, balance: (a.balance || 0) + action.payload.amount }
            : a
        )
      }

    // ============== TAX RATES ==============
    case 'ADD_TAX_RATE':
      return { ...state, taxRates: [...(state.taxRates || []), action.payload] }
    
    case 'UPDATE_TAX_RATE':
      return { 
        ...state, 
        taxRates: (state.taxRates || []).map(t => 
          t.id === action.payload.id ? { ...t, ...action.payload } : t
        )
      }
    
    case 'DELETE_TAX_RATE':
      return { ...state, taxRates: (state.taxRates || []).filter(t => t.id !== action.payload) }

    // ============== ROLES ==============
    case 'ADD_ROLE':
      return { ...state, roles: [...(state.roles || []), action.payload] }
    
    case 'UPDATE_ROLE': {
      const { _tempId, ...updateData } = action.payload
      return { 
        ...state, 
        roles: (state.roles || []).map(r => {
          const matchById = r.id !== undefined && r.id !== null && String(r.id) === String(updateData.id)
          const matchByTempId = _tempId && r.id !== undefined && r.id !== null && String(r.id) === String(_tempId)
          if (matchById || matchByTempId) return { ...r, ...updateData }
          return r
        })
      }
    }
    
    case 'DELETE_ROLE':
      return { ...state, roles: (state.roles || []).filter(r => r.id !== action.payload) }

    // ============== ACTIVITY LOGS ==============
    case 'ADD_ACTIVITY_LOG':
      return { ...state, activityLogs: [...(state.activityLogs || []), action.payload] }

    // ============== SALES ==============
    case 'ADD_SALE': {
      const sale = action.payload
      // Update product stock (reduce)
      const updatedProducts = (state.products || []).map(p => {
        const saleItem = (sale.items || []).find(item => item.productId === p.id)
        if (saleItem) {
          return { ...p, currentStock: (p.currentStock || 0) - saleItem.quantity }
        }
        return p
      })
      // Update customer balance
      const updatedCustomers = (state.customers || []).map(c => {
        if (c.id === sale.customerId) {
          const balanceToAdd = (sale.total || 0) - (sale.amountPaid || 0)
          return { ...c, balance: (c.balance || 0) + balanceToAdd }
        }
        return c
      })
      return { 
        ...state, 
        sales: [...(state.sales || []), sale],
        products: updatedProducts,
        customers: updatedCustomers,
        saleCounter: (state.saleCounter || 0) + 1
      }
    }
    
    case 'UPDATE_SALE':
      return { 
        ...state, 
        sales: (state.sales || []).map(s => 
          s.id === action.payload.id ? { ...s, ...action.payload } : s
        )
      }
    
    case 'DELETE_SALE': {
      const sale = (state.sales || []).find(s => s.id === action.payload)
      if (!sale) return state
      
      // Restore product stock
      const restoredProducts = (state.products || []).map(p => {
        const saleItem = (sale.items || []).find(item => item.productId === p.id)
        if (saleItem) {
          return { ...p, currentStock: (p.currentStock || 0) + saleItem.quantity }
        }
        return p
      })
      // Update customer balance
      const paid = sale.amountPaid || 0
      const saleDue = (sale.total || 0) - paid
      const updatedCustomers = (state.customers || []).map(c => {
        if (c.id === sale.customerId) {
          return { ...c, balance: Math.max(0, (c.balance || 0) - saleDue) }
        }
        return c
      })
      return { 
        ...state, 
        sales: (state.sales || []).filter(s => s.id !== action.payload),
        products: restoredProducts,
        customers: updatedCustomers
      }
    }

    // ============== SALE RETURNS ==============
    case 'ADD_SALE_RETURN': {
      const saleReturn = action.payload
      // Restore product stock
      const updatedProducts = (state.products || []).map(p => {
        const returnItem = (saleReturn.items || []).find(item => item.productId === p.id)
        if (returnItem) {
          return { ...p, currentStock: (p.currentStock || 0) + returnItem.quantity }
        }
        return p
      })
      return {
        ...state,
        saleReturns: [...(state.saleReturns || []), saleReturn],
        products: updatedProducts
      }
    }

    case 'UPDATE_SALE_RETURN':
      return {
        ...state,
        saleReturns: (state.saleReturns || []).map(r =>
          r.id === action.payload.id ? { ...r, ...action.payload } : r
        )
      }

    case 'DELETE_SALE_RETURN':
      return { ...state, saleReturns: (state.saleReturns || []).filter(r => r.id !== action.payload) }

    // ============== PURCHASES ==============
    case 'ADD_PURCHASE': {
      const purchase = action.payload
      // Update product stock (increase)
      const updatedProducts = (state.products || []).map(p => {
        const purchaseItem = (purchase.items || []).find(item => item.productId === p.id)
        if (purchaseItem) {
          return { ...p, currentStock: (p.currentStock || 0) + purchaseItem.quantity }
        }
        return p
      })
      // Update supplier balance
      const updatedSuppliers = (state.suppliers || []).map(s => {
        if (s.id === purchase.supplierId) {
          const balanceToAdd = (purchase.total || 0) - (purchase.amountPaid || 0)
          return { ...s, balance: (s.balance || 0) + balanceToAdd }
        }
        return s
      })
      return { 
        ...state, 
        purchases: [...(state.purchases || []), purchase],
        products: updatedProducts,
        suppliers: updatedSuppliers,
        purchaseCounter: (state.purchaseCounter || 0) + 1
      }
    }
    
    case 'UPDATE_PURCHASE':
      return { 
        ...state, 
        purchases: (state.purchases || []).map(p => 
          p.id === action.payload.id ? { ...p, ...action.payload } : p
        )
      }
    
    case 'DELETE_PURCHASE': {
      const purchase = (state.purchases || []).find(p => p.id === action.payload)
      if (!purchase) return state
      
      // Reduce product stock
      const updatedProducts = (state.products || []).map(p => {
        const purchaseItem = (purchase.items || []).find(item => item.productId === p.id)
        if (purchaseItem) {
          return { ...p, currentStock: Math.max(0, (p.currentStock || 0) - purchaseItem.quantity) }
        }
        return p
      })
      // Update supplier balance
      const paid = purchase.amountPaid || 0
      const purchaseDue = (purchase.total || 0) - paid
      const updatedSuppliers = (state.suppliers || []).map(s => {
        if (s.id === purchase.supplierId) {
          return { ...s, balance: Math.max(0, (s.balance || 0) - purchaseDue) }
        }
        return s
      })
      return { 
        ...state, 
        purchases: (state.purchases || []).filter(p => p.id !== action.payload),
        products: updatedProducts,
        suppliers: updatedSuppliers
      }
    }

    // ============== PURCHASE RETURNS ==============
    case 'ADD_PURCHASE_RETURN': {
      const purchaseReturn = action.payload
      // Reduce product stock
      const updatedProducts = (state.products || []).map(p => {
        const returnItem = (purchaseReturn.items || []).find(item => item.productId === p.id)
        if (returnItem) {
          return { ...p, currentStock: Math.max(0, (p.currentStock || 0) - returnItem.quantity) }
        }
        return p
      })
      return {
        ...state,
        purchaseReturns: [...(state.purchaseReturns || []), purchaseReturn],
        products: updatedProducts
      }
    }

    case 'UPDATE_PURCHASE_RETURN':
      return {
        ...state,
        purchaseReturns: (state.purchaseReturns || []).map(r =>
          r.id === action.payload.id ? { ...r, ...action.payload } : r
        )
      }

    case 'DELETE_PURCHASE_RETURN':
      return { ...state, purchaseReturns: (state.purchaseReturns || []).filter(r => r.id !== action.payload) }

    // ============== EXPENSES ==============
    case 'ADD_EXPENSE':
    case 'ADD_EXPENSE_FULL':
      return { 
        ...state, 
        expenses: [...(state.expenses || []), action.payload],
        expenseCounter: (state.expenseCounter || 0) + 1
      }
    
    case 'UPDATE_EXPENSE':
      return { 
        ...state, 
        expenses: (state.expenses || []).map(e => 
          e.id === action.payload.id ? action.payload : e
        )
      }
    
    case 'DELETE_EXPENSE':
      return { ...state, expenses: (state.expenses || []).filter(e => e.id !== action.payload) }

    // ============== EXPENSE PAYMENTS ==============
    case 'ADD_EXPENSE_PAYMENT': {
      const payment = action.payload
      const updatedExpenses = (state.expenses || []).map(e => {
        if (e.id === payment.expenseId) {
          const newAmountPaid = (e.amountPaid || 0) + payment.amount
          return { 
            ...e, 
            amountPaid: newAmountPaid,
            paymentStatus: newAmountPaid >= (e.totalAmount || 0) ? 'paid' : 'partial'
          }
        }
        return e
      })
      return {
        ...state,
        expenses: updatedExpenses
      }
    }

    // ============== PAYMENTS ==============
    case 'ADD_SALES_PAYMENT': {
      const payment = action.payload
      // Update sale
      const updatedSales = (state.sales || []).map(s => {
        if (s.id === payment.saleId) {
          const newAmountPaid = (s.amountPaid || 0) + payment.amount
          return { 
            ...s, 
            amountPaid: newAmountPaid,
            status: newAmountPaid >= s.total ? 'paid' : 'partial'
          }
        }
        return s
      })
      // Update customer balance
      const updatedCustomers = (state.customers || []).map(c => {
        if (c.id === payment.customerId) {
          return { ...c, balance: Math.max(0, (c.balance || 0) - payment.amount) }
        }
        return c
      })
      return {
        ...state,
        salesPayments: [...(state.salesPayments || []), payment],
        sales: updatedSales,
        customers: updatedCustomers
      }
    }

    case 'ADD_PURCHASE_PAYMENT': {
      const payment = action.payload
      // Update purchase
      const updatedPurchases = (state.purchases || []).map(p => {
        if (p.id === payment.purchaseId) {
          const newAmountPaid = (p.amountPaid || 0) + payment.amount
          return { 
            ...p, 
            amountPaid: newAmountPaid,
            status: newAmountPaid >= p.total ? 'paid' : 'partial'
          }
        }
        return p
      })
      // Update supplier balance
      const updatedSuppliers = (state.suppliers || []).map(s => {
        if (s.id === payment.supplierId) {
          return { ...s, balance: Math.max(0, (s.balance || 0) - payment.amount) }
        }
        return s
      })
      return {
        ...state,
        purchasePayments: [...(state.purchasePayments || []), payment],
        purchases: updatedPurchases,
        suppliers: updatedSuppliers
      }
    }

    // ============== STOCK ADJUSTMENTS ==============
    case 'ADD_STOCK_ADJUSTMENT':
    case 'ADD_STOCK_ADJUSTMENT_FULL': {
      const adjustment = action.payload
      let updatedProducts = [...(state.products || [])]
      
      const items = adjustment.items || [{ productId: adjustment.productId, quantity: adjustment.quantity }]
      items.forEach(item => {
        updatedProducts = updatedProducts.map(p =>
          p.id === item.productId
            ? { ...p, currentStock: (p.currentStock || 0) + item.quantity }
            : p
        )
      })
      
      return {
        ...state,
        stockAdjustments: [...(state.stockAdjustments || []), adjustment],
        products: updatedProducts
      }
    }

    default:
      return state
  }
}

// ============================================
// CONTEXT
// ============================================
const AppContext = createContext()

// ============================================
// PROVIDER COMPONENT
// ============================================
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, emptyState)
  const { currentUser, userData, businessId, loading: authLoading } = useAuth()
  const [initialized, setInitialized] = useState(false)

  // ============================================
  // LOAD DATA WHEN USER LOGS IN
  // ============================================
  useEffect(() => {
    async function loadData() {
      if (authLoading) return
      
      if (!currentUser || !businessId) {
        dispatch({ type: 'RESET_STATE' })
        setInitialized(false)
        return
      }

      dispatch({ type: 'SET_LOADING', payload: true })

      try {
        const result = await loadAllBusinessData(businessId)
        
        if (result.success && result.data) {
          dispatch({ type: 'LOAD_ALL_DATA', payload: result.data })
        } else {
          console.log('Initializing new business...')
          await initializeNewBusiness(businessId, userData?.businessName, userData?.name)
          const newResult = await loadAllBusinessData(businessId)
          if (newResult.success) {
            dispatch({ type: 'LOAD_ALL_DATA', payload: newResult.data })
          }
        }
        
        setInitialized(true)
      } catch (error) {
        console.error('Error loading data:', error)
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }

    loadData()
  }, [currentUser, businessId, authLoading, userData?.businessName, userData?.name])

  // ============================================
  // FIRESTORE-SYNCED DISPATCH
  // Wraps dispatch to also save to Firestore
  // ============================================
  const syncedDispatch = useCallback(async (action) => {
    if (!businessId) {
      console.warn('No businessId - cannot sync to Firestore')
      dispatch(action)
      return
    }

    // First update local state for immediate UI response
    dispatch(action)

    // Then sync to Firestore
    try {
      switch (action.type) {
        // ============== BUSINESS SETTINGS ==============
        case 'UPDATE_BUSINESS':
        case 'UPDATE_BUSINESS_SETTINGS':
          await saveBusinessSettings(businessId, action.payload)
          break

        // ============== PRODUCTS ==============
        case 'ADD_PRODUCT': {
          const result = await addDocument(businessId, 'products', action.payload)
          if (result.success) {
            dispatch({ type: 'UPDATE_PRODUCT', payload: { ...action.payload, id: result.id }})
          }
          break
        }
        case 'UPDATE_PRODUCT':
          await updateDocument(businessId, 'products', action.payload.id, action.payload)
          break
        case 'DELETE_PRODUCT':
          await deleteDocument(businessId, 'products', action.payload)
          break

        // ============== CATEGORIES ==============
        case 'ADD_CATEGORY': {
          const result = await addDocument(businessId, 'categories', action.payload)
          if (result.success) {
            dispatch({ type: 'UPDATE_CATEGORY', payload: { ...action.payload, id: result.id }})
          }
          break
        }
        case 'UPDATE_CATEGORY':
          await updateDocument(businessId, 'categories', action.payload.id, action.payload)
          break
        case 'DELETE_CATEGORY':
          await deleteDocument(businessId, 'categories', action.payload)
          break

        // ============== BRANDS ==============
        case 'ADD_BRAND': {
          const result = await addDocument(businessId, 'brands', action.payload)
          if (result.success) {
            dispatch({ type: 'UPDATE_BRAND', payload: { ...action.payload, id: result.id }})
          }
          break
        }
        case 'UPDATE_BRAND':
          await updateDocument(businessId, 'brands', action.payload.id, action.payload)
          break
        case 'DELETE_BRAND':
          await deleteDocument(businessId, 'brands', action.payload)
          break

        // ============== UNITS ==============
        case 'ADD_UNIT': {
          const result = await addDocument(businessId, 'units', action.payload)
          if (result.success) {
            dispatch({ type: 'UPDATE_UNIT', payload: { ...action.payload, id: result.id }})
          }
          break
        }
        case 'UPDATE_UNIT':
          await updateDocument(businessId, 'units', action.payload.id, action.payload)
          break
        case 'DELETE_UNIT':
          await deleteDocument(businessId, 'units', action.payload)
          break

        // ============== WARRANTIES ==============
        case 'ADD_WARRANTY': {
          const result = await addDocument(businessId, 'warranties', action.payload)
          if (result.success) {
            dispatch({ type: 'UPDATE_WARRANTY', payload: { ...action.payload, id: result.id }})
          }
          break
        }
        case 'UPDATE_WARRANTY':
          await updateDocument(businessId, 'warranties', action.payload.id, action.payload)
          break
        case 'DELETE_WARRANTY':
          await deleteDocument(businessId, 'warranties', action.payload)
          break

        // ============== EXPENSE CATEGORIES ==============
        case 'ADD_EXPENSE_CATEGORY': {
          const result = await addDocument(businessId, 'expenseCategories', action.payload)
          if (result.success) {
            dispatch({ type: 'UPDATE_EXPENSE_CATEGORY', payload: { ...action.payload, id: result.id }})
          }
          break
        }
        case 'UPDATE_EXPENSE_CATEGORY':
          await updateDocument(businessId, 'expenseCategories', action.payload.id, action.payload)
          break
        case 'DELETE_EXPENSE_CATEGORY':
          await deleteDocument(businessId, 'expenseCategories', action.payload)
          break

        // ============== ACCOUNT TYPES ==============
        case 'ADD_ACCOUNT_TYPE': {
          const result = await addDocument(businessId, 'accountTypes', action.payload)
          if (result.success) {
            dispatch({ type: 'UPDATE_ACCOUNT_TYPE', payload: { ...action.payload, id: result.id }})
          }
          break
        }
        case 'UPDATE_ACCOUNT_TYPE':
          await updateDocument(businessId, 'accountTypes', action.payload.id, action.payload)
          break
        case 'DELETE_ACCOUNT_TYPE':
          await deleteDocument(businessId, 'accountTypes', action.payload)
          break

        // ============== FUND TRANSFERS ==============
        case 'ADD_FUND_TRANSFER': {
          await addDocument(businessId, 'fundTransfers', action.payload)
          break
        }

        // ============== DEPOSITS ==============
        case 'ADD_DEPOSIT': {
          await addDocument(businessId, 'deposits', action.payload)
          break
        }

        // ============== REGISTER SESSIONS ==============
        case 'OPEN_REGISTER_SESSION': {
          const tempId = action.payload.id
          const result = await addDocument(businessId, 'registerSessions', action.payload)
          if (result.success) {
            dispatch({ type: 'UPDATE_REGISTER_SESSION', payload: { _tempId: tempId, ...action.payload, id: result.id } })
          }
          break
        }

        case 'CLOSE_REGISTER_SESSION': {
          if (action.payload.id) {
            await updateDocument(businessId, 'registerSessions', action.payload.id, action.payload)
          }
          break
        }

        case 'ADD_CASH_MOVEMENT': {
          const { sessionId, movement } = action.payload
          // Find the session from current state and manually add the movement
          // (state in this closure is stale - dispatch already ran but state hasn't updated yet)
          const currentSession = (state.registerSessions || []).find(s => String(s.id) === String(sessionId))
          if (currentSession && sessionId) {
            const updatedSession = {
              ...currentSession,
              cashMovements: [...(currentSession.cashMovements || []), movement]
            }
            await updateDocument(businessId, 'registerSessions', sessionId, updatedSession)
          }
          break
        }

        // ============== CUSTOMERS ==============
        case 'ADD_CUSTOMER': {
          const counter = await getNextCounter(businessId, 'customers')
          const customerData = {
            ...action.payload,
            contactId: `CU${String(counter.value).padStart(4, '0')}`,
            createdAt: new Date().toISOString()
          }
          const result = await addDocument(businessId, 'customers', customerData)
          if (result.success) {
            dispatch({ type: 'UPDATE_CUSTOMER', payload: { ...customerData, id: result.id }})
          }
          break
        }
        case 'UPDATE_CUSTOMER':
        case 'UPDATE_CUSTOMER_BALANCE':
          if (action.type === 'UPDATE_CUSTOMER_BALANCE') {
            const customer = (state.customers || []).find(c => c.id === action.payload.id)
            if (customer) {
              await updateDocument(businessId, 'customers', action.payload.id, {
                balance: (customer.balance || 0) + action.payload.amount
              })
            }
          } else {
            await updateDocument(businessId, 'customers', action.payload.id, action.payload)
          }
          break
        case 'DELETE_CUSTOMER':
          await deleteDocument(businessId, 'customers', action.payload)
          break

        // ============== SUPPLIERS ==============
        case 'ADD_SUPPLIER': {
          const counter = await getNextCounter(businessId, 'suppliers')
          const supplierData = {
            ...action.payload,
            contactId: `CO${String(counter.value).padStart(4, '0')}`,
            createdAt: new Date().toISOString()
          }
          const result = await addDocument(businessId, 'suppliers', supplierData)
          if (result.success) {
            dispatch({ type: 'UPDATE_SUPPLIER', payload: { ...supplierData, id: result.id }})
          }
          break
        }
        case 'UPDATE_SUPPLIER':
        case 'UPDATE_SUPPLIER_BALANCE':
          if (action.type === 'UPDATE_SUPPLIER_BALANCE') {
            const supplier = (state.suppliers || []).find(s => s.id === action.payload.id)
            if (supplier) {
              await updateDocument(businessId, 'suppliers', action.payload.id, {
                balance: (supplier.balance || 0) + action.payload.amount
              })
            }
          } else {
            await updateDocument(businessId, 'suppliers', action.payload.id, action.payload)
          }
          break
        case 'DELETE_SUPPLIER':
          await deleteDocument(businessId, 'suppliers', action.payload)
          break

        // ============== SALES AGENTS ==============
        case 'ADD_SALES_AGENT': {
          const tempId = action.payload.id
          const result = await addDocument(businessId, 'salesAgents', action.payload)
          if (result.success) {
            dispatch({ type: 'UPDATE_SALES_AGENT', payload: { _tempId: tempId, ...action.payload, id: result.id }})
          }
          break
        }
        case 'UPDATE_SALES_AGENT':
          await updateDocument(businessId, 'salesAgents', action.payload.id, action.payload)
          break
        case 'DELETE_SALES_AGENT':
          await deleteDocument(businessId, 'salesAgents', action.payload)
          break

        // ============== PAYMENT ACCOUNTS ==============
        case 'ADD_PAYMENT_ACCOUNT': {
          const tempId = action.payload.id
          const result = await addDocument(businessId, 'paymentAccounts', action.payload)
          if (result.success) {
            dispatch({ type: 'UPDATE_PAYMENT_ACCOUNT', payload: { _tempId: tempId, ...action.payload, id: result.id }})
          }
          break
        }
        case 'UPDATE_PAYMENT_ACCOUNT':
          await updateDocument(businessId, 'paymentAccounts', action.payload.id, action.payload)
          break
        case 'DELETE_PAYMENT_ACCOUNT':
          await deleteDocument(businessId, 'paymentAccounts', action.payload)
          break
        case 'UPDATE_ACCOUNT_BALANCE': {
          const account = (state.paymentAccounts || []).find(a => a.id === action.payload.id)
          if (account) {
            await updateDocument(businessId, 'paymentAccounts', action.payload.id, {
              balance: (account.balance || 0) + action.payload.amount
            })
          }
          break
        }

        // ============== TAX RATES ==============
        case 'ADD_TAX_RATE': {
          const result = await addDocument(businessId, 'taxRates', action.payload)
          if (result.success) {
            dispatch({ type: 'UPDATE_TAX_RATE', payload: { ...action.payload, id: result.id }})
          }
          break
        }
        case 'UPDATE_TAX_RATE':
          await updateDocument(businessId, 'taxRates', action.payload.id, action.payload)
          break
        case 'DELETE_TAX_RATE':
          await deleteDocument(businessId, 'taxRates', action.payload)
          break

        // ============== ROLES ==============
        case 'ADD_ROLE': {
          const tempId = action.payload.id
          const result = await addDocument(businessId, 'roles', action.payload)
          if (result.success) {
            dispatch({ type: 'UPDATE_ROLE', payload: { _tempId: tempId, ...action.payload, id: result.id }})
          }
          break
        }
        case 'UPDATE_ROLE':
          await updateDocument(businessId, 'roles', action.payload.id, action.payload)
          break
        case 'DELETE_ROLE':
          await deleteDocument(businessId, 'roles', action.payload)
          break

        // ============== ACTIVITY LOGS ==============
        case 'ADD_ACTIVITY_LOG': {
          const logData = {
            ...action.payload,
            timestamp: new Date().toISOString()
          }
          await addDocument(businessId, 'activityLogs', logData)
          break
        }

        // ============== SALES ==============
        case 'ADD_SALE': {
          const counter = await getNextCounter(businessId, 'sales')
          const saleData = {
            ...action.payload,
            invoiceNo: `${state.business.salePrefix || 'INV-'}${String(counter.value).padStart(4, '0')}`,
            status: action.payload.amountPaid >= action.payload.total ? 'paid' : 
                    action.payload.amountPaid > 0 ? 'partial' : 'due',
            createdAt: new Date().toISOString()
          }
          const result = await addDocument(businessId, 'sales', saleData)
          
          // Update products stock in Firestore
          for (const item of action.payload.items || []) {
            const product = (state.products || []).find(p => p.id === item.productId)
            if (product) {
              await updateDocument(businessId, 'products', item.productId, {
                currentStock: (product.currentStock || 0) - item.quantity
              })
            }
          }
          
          // Update customer balance in Firestore
          if (action.payload.customerId) {
            const customer = (state.customers || []).find(c => c.id === action.payload.customerId)
            if (customer) {
              const balanceToAdd = (action.payload.total || 0) - (action.payload.amountPaid || 0)
              await updateDocument(businessId, 'customers', action.payload.customerId, {
                balance: (customer.balance || 0) + balanceToAdd
              })
            }
          }
          
          if (result.success) {
            dispatch({ type: 'UPDATE_SALE', payload: { ...saleData, id: result.id }})
          }
          break
        }
        case 'UPDATE_SALE':
          await updateDocument(businessId, 'sales', action.payload.id, action.payload)
          break
        case 'DELETE_SALE': {
          const sale = (state.sales || []).find(s => s.id === action.payload)
          if (sale) {
            // Restore stock
            for (const item of sale.items || []) {
              const product = (state.products || []).find(p => p.id === item.productId)
              if (product) {
                await updateDocument(businessId, 'products', item.productId, {
                  currentStock: (product.currentStock || 0) + item.quantity
                })
              }
            }
            // Update customer balance
            if (sale.customerId) {
              const customer = (state.customers || []).find(c => c.id === sale.customerId)
              if (customer) {
                const saleDue = (sale.total || 0) - (sale.amountPaid || 0)
                await updateDocument(businessId, 'customers', sale.customerId, {
                  balance: Math.max(0, (customer.balance || 0) - saleDue)
                })
              }
            }
            await deleteDocument(businessId, 'sales', action.payload)
          }
          break
        }

        // ============== SALE RETURNS ==============
        case 'ADD_SALE_RETURN': {
          const result = await addDocument(businessId, 'saleReturns', action.payload)
          // Restore stock in Firestore
          for (const item of action.payload.items || []) {
            const product = (state.products || []).find(p => p.id === item.productId)
            if (product) {
              await updateDocument(businessId, 'products', item.productId, {
                currentStock: (product.currentStock || 0) + item.quantity
              })
            }
          }
          if (result.success) {
            dispatch({ type: 'UPDATE_SALE_RETURN', payload: { ...action.payload, id: result.id }})
          }
          break
        }
        case 'UPDATE_SALE_RETURN':
          await updateDocument(businessId, 'saleReturns', action.payload.id, action.payload)
          break
        case 'DELETE_SALE_RETURN':
          await deleteDocument(businessId, 'saleReturns', action.payload)
          break

        // ============== PURCHASES ==============
        case 'ADD_PURCHASE': {
          const counter = await getNextCounter(businessId, 'purchases')
          const purchaseData = {
            ...action.payload,
            purchaseNo: `${state.business.purchasePrefix || 'PUR-'}${String(counter.value).padStart(4, '0')}`,
            status: action.payload.amountPaid >= action.payload.total ? 'paid' : 
                    action.payload.amountPaid > 0 ? 'partial' : 'due',
            createdAt: new Date().toISOString()
          }
          const result = await addDocument(businessId, 'purchases', purchaseData)
          
          // Update products stock in Firestore
          for (const item of action.payload.items || []) {
            const product = (state.products || []).find(p => p.id === item.productId)
            if (product) {
              await updateDocument(businessId, 'products', item.productId, {
                currentStock: (product.currentStock || 0) + item.quantity
              })
            }
          }
          
          // Update supplier balance in Firestore
          if (action.payload.supplierId) {
            const supplier = (state.suppliers || []).find(s => s.id === action.payload.supplierId)
            if (supplier) {
              const balanceToAdd = (action.payload.total || 0) - (action.payload.amountPaid || 0)
              await updateDocument(businessId, 'suppliers', action.payload.supplierId, {
                balance: (supplier.balance || 0) + balanceToAdd
              })
            }
          }
          
          if (result.success) {
            dispatch({ type: 'UPDATE_PURCHASE', payload: { ...purchaseData, id: result.id }})
          }
          break
        }
        case 'UPDATE_PURCHASE':
          await updateDocument(businessId, 'purchases', action.payload.id, action.payload)
          break
        case 'DELETE_PURCHASE': {
          const purchase = (state.purchases || []).find(p => p.id === action.payload)
          if (purchase) {
            // Reduce stock
            for (const item of purchase.items || []) {
              const product = (state.products || []).find(p => p.id === item.productId)
              if (product) {
                await updateDocument(businessId, 'products', item.productId, {
                  currentStock: Math.max(0, (product.currentStock || 0) - item.quantity)
                })
              }
            }
            // Update supplier balance
            if (purchase.supplierId) {
              const supplier = (state.suppliers || []).find(s => s.id === purchase.supplierId)
              if (supplier) {
                const purchaseDue = (purchase.total || 0) - (purchase.amountPaid || 0)
                await updateDocument(businessId, 'suppliers', purchase.supplierId, {
                  balance: Math.max(0, (supplier.balance || 0) - purchaseDue)
                })
              }
            }
            await deleteDocument(businessId, 'purchases', action.payload)
          }
          break
        }

        // ============== PURCHASE RETURNS ==============
        case 'ADD_PURCHASE_RETURN': {
          const result = await addDocument(businessId, 'purchaseReturns', action.payload)
          // Reduce stock in Firestore
          for (const item of action.payload.items || []) {
            const product = (state.products || []).find(p => p.id === item.productId)
            if (product) {
              await updateDocument(businessId, 'products', item.productId, {
                currentStock: Math.max(0, (product.currentStock || 0) - item.quantity)
              })
            }
          }
          if (result.success) {
            dispatch({ type: 'UPDATE_PURCHASE_RETURN', payload: { ...action.payload, id: result.id }})
          }
          break
        }
        case 'UPDATE_PURCHASE_RETURN':
          await updateDocument(businessId, 'purchaseReturns', action.payload.id, action.payload)
          break
        case 'DELETE_PURCHASE_RETURN':
          await deleteDocument(businessId, 'purchaseReturns', action.payload)
          break

        // ============== EXPENSES ==============
        case 'ADD_EXPENSE':
        case 'ADD_EXPENSE_FULL': {
          const counter = await getNextCounter(businessId, 'expenses')
          const expenseData = {
            ...action.payload,
            referenceNo: `${state.business.expensePrefix || 'EXP-'}${String(counter.value).padStart(4, '0')}`,
            createdAt: new Date().toISOString()
          }
          const result = await addDocument(businessId, 'expenses', expenseData)
          if (result.success) {
            dispatch({ type: 'UPDATE_EXPENSE', payload: { ...expenseData, id: result.id }})
          }
          break
        }
        case 'UPDATE_EXPENSE':
          await updateDocument(businessId, 'expenses', action.payload.id, action.payload)
          break
        case 'DELETE_EXPENSE':
          await deleteDocument(businessId, 'expenses', action.payload)
          break

        // ============== EXPENSE PAYMENTS ==============
        case 'ADD_EXPENSE_PAYMENT': {
          const expense = (state.expenses || []).find(e => e.id === action.payload.expenseId)
          if (expense) {
            const newAmountPaid = (expense.amountPaid || 0) + action.payload.amount
            await updateDocument(businessId, 'expenses', action.payload.expenseId, {
              amountPaid: newAmountPaid,
              paymentStatus: newAmountPaid >= (expense.totalAmount || 0) ? 'paid' : 'partial'
            })
          }
          break
        }

        // ============== PAYMENTS ==============
        case 'ADD_SALES_PAYMENT': {
          await addDocument(businessId, 'salesPayments', action.payload)
          // Update sale
          const sale = (state.sales || []).find(s => s.id === action.payload.saleId)
          if (sale) {
            const newAmountPaid = (sale.amountPaid || 0) + action.payload.amount
            await updateDocument(businessId, 'sales', action.payload.saleId, {
              amountPaid: newAmountPaid,
              status: newAmountPaid >= sale.total ? 'paid' : 'partial'
            })
          }
          // Update customer
          const customer = (state.customers || []).find(c => c.id === action.payload.customerId)
          if (customer) {
            await updateDocument(businessId, 'customers', action.payload.customerId, {
              balance: Math.max(0, (customer.balance || 0) - action.payload.amount)
            })
          }
          break
        }
        
        case 'ADD_PURCHASE_PAYMENT': {
          await addDocument(businessId, 'purchasePayments', action.payload)
          // Update purchase
          const purchase = (state.purchases || []).find(p => p.id === action.payload.purchaseId)
          if (purchase) {
            const newAmountPaid = (purchase.amountPaid || 0) + action.payload.amount
            await updateDocument(businessId, 'purchases', action.payload.purchaseId, {
              amountPaid: newAmountPaid,
              status: newAmountPaid >= purchase.total ? 'paid' : 'partial'
            })
          }
          // Update supplier
          const supplier = (state.suppliers || []).find(s => s.id === action.payload.supplierId)
          if (supplier) {
            await updateDocument(businessId, 'suppliers', action.payload.supplierId, {
              balance: Math.max(0, (supplier.balance || 0) - action.payload.amount)
            })
          }
          break
        }

        // ============== STOCK ADJUSTMENTS ==============
        case 'ADD_STOCK_ADJUSTMENT':
        case 'ADD_STOCK_ADJUSTMENT_FULL': {
          await addDocument(businessId, 'stockAdjustments', action.payload)
          // Update product stock
          const items = action.payload.items || [{ productId: action.payload.productId, quantity: action.payload.quantity }]
          for (const item of items) {
            const product = (state.products || []).find(p => p.id === item.productId)
            if (product) {
              await updateDocument(businessId, 'products', item.productId, {
                currentStock: (product.currentStock || 0) + item.quantity
              })
            }
          }
          break
        }

        // UI-only actions (no Firestore sync needed)
        case 'SET_PAGE':
        case 'TOGGLE_SIDEBAR':
        case 'SET_LOADING':
        case 'LOAD_ALL_DATA':
        case 'RESET_STATE':
        case 'SET_PRODUCTS':
        case 'UPDATE_STOCK':
          break

        default:
          console.warn(`Unhandled action type for Firestore sync: ${action.type}`)
      }
    } catch (error) {
      console.error(`Error syncing ${action.type} to Firestore:`, error)
    }
  }, [businessId, state])

  // ============================================
  // CONTEXT VALUE
  // ============================================
  const value = {
    state,
    dispatch: syncedDispatch,
    isLoading: state.isLoading || authLoading,
    isInitialized: initialized && state.dataLoaded
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

// ============================================
// CUSTOM HOOK
// ============================================
export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}