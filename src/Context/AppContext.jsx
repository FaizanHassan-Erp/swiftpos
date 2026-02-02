import { createContext, useContext, useReducer, useEffect } from 'react'

// Load state from localStorage or use default
function loadState() {
  try {
    const savedState = localStorage.getItem('swiftpos-data')
    if (savedState) {
      return JSON.parse(savedState)
    }
  } catch (error) {
    console.error('Error loading state from localStorage:', error)
  }
  return null
}

// Default Initial State
const defaultState = {
  // Authentication
  isAuthenticated: false,
  currentUser: null,

  // Activity Logs
  activityLogs: [],

  // User Management
  users: [
    { id: 1, username: 'admin', name: 'Admin User', email: 'admin@swiftpos.com', password: 'admin123', role: 'Admin', status: 'active', createdAt: '2024-01-01' }
  ],
  
  roles: [
    { id: 1, name: 'Admin', permissions: ['all'], canDelete: false },
    { id: 2, name: 'Manager', permissions: ['sales', 'purchases', 'inventory', 'reports'], canDelete: true },
    { id: 3, name: 'Cashier', permissions: ['pos', 'sales'], canDelete: true },
    { id: 4, name: 'Waiter', permissions: ['pos'], canDelete: true }
  ],
  
  salesAgents: [],

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
    startDate: '',
    defaultProfitPercent: 10,
    timezone: 'Asia/Karachi',
    financialYearStart: 'January',
    stockAccountingMethod: 'FIFO',
    transactionEditDays: 30,
    dateFormat: 'dd/mm/yyyy',
    timeFormat: '24',
    currencyPrecision: 2,
    quantityPrecision: 2,
    // Prefixes
    salePrefix: 'INV-',
    saleReturnPrefix: 'SR-',
    purchasePrefix: 'PUR-',
    purchaseReturnPrefix: 'PR-',
    expensePrefix: 'EXP-',
    stockAdjustmentPrefix: 'SA-',
    quotationPrefix: 'QUO-',
    salesOrderPrefix: 'SO-',
    purchaseOrderPrefix: 'PO-',
    // Payment methods
    paymentMethods: [
      { id: 1, name: 'Cash', enabled: true, isDefault: true },
      { id: 2, name: 'Card', enabled: true, isDefault: false },
      { id: 3, name: 'Cheque', enabled: true, isDefault: false },
      { id: 4, name: 'Bank Transfer', enabled: true, isDefault: false },
      { id: 5, name: 'Other', enabled: false, isDefault: false }
    ]
  },

  // Tax Rates
  taxRates: [
    { id: 1, name: 'GST', rate: 17, forTaxGroupOnly: false },
    { id: 2, name: 'Sales Tax', rate: 5, forTaxGroupOnly: false },
    { id: 3, name: 'Service Tax', rate: 10, forTaxGroupOnly: true }
  ],

  taxGroups: [
    { id: 1, name: 'GST + Sales Tax', rate: 22, subTaxes: [1, 2] }
  ],

  // Invoice Settings
  invoiceSchemes: [
    { id: 1, name: 'Default', prefix: '', format: 'number_only', numberingType: 'random', startFrom: 1, numberOfDigits: 4, invoiceCount: 0, isDefault: true }
  ],

  invoiceLayouts: [
    { id: 1, name: 'Default', paperSize: 'A4', showLogo: true, showTaxDetails: true, showPaymentInfo: true, showTerms: true, showSignature: false, headerText: '', footerText: '', isDefault: true }
  ],

  // Business Locations
  businessLocations: [
    { id: 1, name: 'Main Branch', locationId: 'LOC-001', city: 'Lahore', state: 'Punjab', country: 'Pakistan', mobile: '', email: '', isActive: true, isPrimary: true }
  ],

  // Barcode Settings
  barcodeSettings: [
    { id: 1, name: 'A4 Standard (4x10)', description: '40 stickers per A4 sheet', paperWidth: 210, paperHeight: 297, stickerWidth: 50, stickerHeight: 25, stickersInOneRow: 4, rowsPerPage: 10, topMargin: 10, leftMargin: 5, paperStickerGapWidth: 2, rowDistance: 2, showBusinessName: true, showProductName: true, showProductVariation: false, showPrice: true, showProductSKU: true, showBarcode: true, barcodeType: 'C128', isDefault: true, isActive: true }
  ],

  // Receipt Printers
  receiptPrinters: [
    { id: 1, name: 'Main POS Printer', connectionType: 'network', ipAddress: '192.168.1.100', port: '9100', paperWidth: '80', characterPerLine: 42, location: 'Counter 1', printSaleReceipt: true, printKitchenOrder: false, printQuotation: false, autoPrint: true, numberOfCopies: 1, showLogo: true, showBusinessName: true, showBusinessAddress: true, showBusinessPhone: true, showTaxNumber: false, showCustomerInfo: true, showPaymentInfo: true, showBarcode: false, showQRCode: false, headerText: '', footerText: 'Thank you for your business!', isDefault: true, isActive: true }
  ],

  // Master Data
  units: [
    { id: 1, name: 'Piece', shortName: 'Pc', allowDecimal: false },
    { id: 2, name: 'Kilogram', shortName: 'Kg', allowDecimal: true },
    { id: 3, name: 'Liter', shortName: 'L', allowDecimal: true },
    { id: 4, name: 'Box', shortName: 'Box', allowDecimal: false },
    { id: 5, name: 'Dozen', shortName: 'Dz', allowDecimal: false }
  ],

  categories: [
    { id: 1, name: 'Electronics', code: 'ELEC', description: '', parentId: null },
    { id: 2, name: 'Groceries', code: 'GROC', description: '', parentId: null },
    { id: 3, name: 'Clothing', code: 'CLOTH', description: '', parentId: null }
  ],

  brands: [
    { id: 1, name: 'Samsung', description: '' },
    { id: 2, name: 'Apple', description: '' },
    { id: 3, name: 'Local', description: '' }
  ],

  // Warranties
  warranties: [
    { id: 1, name: '1 Year Standard', description: 'Standard manufacturer warranty', duration: 12, durationType: 'months' },
    { id: 2, name: '2 Year Extended', description: 'Extended warranty coverage', duration: 24, durationType: 'months' },
    { id: 3, name: '6 Month Limited', description: 'Limited warranty for accessories', duration: 6, durationType: 'months' }
  ],

  // Contact ID Counter (for suppliers)
  contactIdCounter: 3,

  // Customer ID Counter
  customerIdCounter: 3,

  // Contacts - Suppliers (Enhanced Structure)
  suppliers: [
    { 
      id: 1, 
      contactId: 'CO0001',
      contactType: 'supplier',
      businessType: 'business',
      businessName: 'ABC Traders',
      name: 'Mr. Ahmed',
      phone: '0300-1234567',
      alternatePhone: '',
      landline: '',
      email: 'abc@email.com',
      taxNumber: '',
      payTerm: 'Net 30',
      openingBalance: 0,
      advanceBalance: 0,
      balance: 0,
      address: 'Lahore',
      dateOfBirth: '',
      assignedTo: '',
      status: 'active',
      createdAt: '2024-01-01',
      activities: [{ date: '2024-01-01T00:00:00.000Z', action: 'Added', by: 'Admin', note: '' }],
      documents: [],
      contactPersons: []
    },
    { 
      id: 2, 
      contactId: 'CO0002',
      contactType: 'supplier',
      businessType: 'business',
      businessName: 'XYZ Wholesale',
      name: 'Mr. Khan',
      phone: '0321-7654321',
      alternatePhone: '',
      landline: '',
      email: 'xyz@email.com',
      taxNumber: '',
      payTerm: 'Net 15',
      openingBalance: 0,
      advanceBalance: 0,
      balance: 0,
      address: 'Karachi',
      dateOfBirth: '',
      assignedTo: '',
      status: 'active',
      createdAt: '2024-01-01',
      activities: [{ date: '2024-01-01T00:00:00.000Z', action: 'Added', by: 'Admin', note: '' }],
      documents: [],
      contactPersons: []
    }
  ],

  // Contacts - Customers (Enhanced Structure)
  customers: [
    { 
      id: 1, 
      contactId: 'CU0001',
      contactType: 'customer',
      businessType: 'individual',
      businessName: '',
      name: 'Walk-in Customer',
      phone: '',
      alternatePhone: '',
      landline: '',
      email: '',
      taxNumber: '',
      payTerm: '',
      openingBalance: 0,
      advanceBalance: 0,
      balance: 0,
      address: '',
      dateOfBirth: '',
      assignedTo: '',
      creditLimit: 0,
      status: 'active',
      createdAt: '2024-01-01',
      activities: [],
      documents: [],
      contactPersons: []
    },
    { 
      id: 2, 
      contactId: 'CU0002',
      contactType: 'customer',
      businessType: 'individual',
      businessName: '',
      name: 'Ali Hassan',
      phone: '0333-1112222',
      alternatePhone: '',
      landline: '',
      email: 'ali@email.com',
      taxNumber: '',
      payTerm: '',
      openingBalance: 0,
      advanceBalance: 0,
      balance: 0,
      address: 'Lahore',
      dateOfBirth: '',
      assignedTo: '',
      creditLimit: 5000,
      status: 'active',
      createdAt: '2024-01-01',
      activities: [{ date: '2024-01-01T00:00:00.000Z', action: 'Added', by: 'Admin', note: '' }],
      documents: [],
      contactPersons: []
    }
  ],

  // Products
  products: [
    { id: 1, name: 'Samsung Galaxy A54', sku: 'SAM-A54', categoryId: 1, brandId: 1, unitId: 1, costPrice: 45000, sellingPrice: 52000, currentStock: 15, alertQuantity: 5, warrantyId: 1 },
    { id: 2, name: 'iPhone 14', sku: 'APL-14', categoryId: 1, brandId: 2, unitId: 1, costPrice: 180000, sellingPrice: 210000, currentStock: 8, alertQuantity: 3, warrantyId: 2 },
    { id: 3, name: 'Rice Basmati 5kg', sku: 'GRC-001', categoryId: 2, brandId: 3, unitId: 1, costPrice: 1200, sellingPrice: 1500, currentStock: 50, alertQuantity: 10, warrantyId: null }
  ],

  // Purchase Orders (pending orders not yet received)
  purchaseOrders: [],
  purchaseOrderCounter: 1,

  // Purchases (completed/received)
  purchases: [],
  purchaseCounter: 1,

  // Purchase Returns
  purchaseReturns: [],
  purchaseReturnCounter: 1,

  // Sales
  sales: [],
  saleCounter: 1,

  // Sale Returns
  saleReturns: [],
  saleReturnCounter: 1,

  // Payments
  purchasePayments: [],
  salesPayments: [],

  // Expenses
  expenses: [],
  expenseCounter: 1,

  // Stock Adjustments
  stockAdjustments: [],
  stockAdjustmentCounter: 1,

  // Register Sessions (Cash Register)
  registerSessions: [],
  registerSessionCounter: 1,

  // Expense Categories
  expenseCategories: [
    { id: 1, name: 'Rent' },
    { id: 2, name: 'Utilities' },
    { id: 3, name: 'Salaries' },
    { id: 4, name: 'Transport' },
    { id: 5, name: 'Other' }
  ],

  // Payment Accounts (Legacy - keeping for backward compatibility)
  accounts: [
    { id: 1, name: 'Cash', balance: 100000 },
    { id: 2, name: 'Bank - HBL', balance: 500000 },
    { id: 3, name: 'JazzCash', balance: 25000 }
  ],

  // Payment Accounts (New comprehensive system)
  paymentAccounts: [
    { id: 1, name: 'Cash', accountNumber: '001', accountType: 'Cash', openingBalance: 100000, status: 'active', addedBy: 'Admin', createdAt: '2024-01-01' },
    { id: 2, name: 'Bank - HBL', accountNumber: '15067900354503', accountType: 'Bank', openingBalance: 500000, status: 'active', addedBy: 'Admin', createdAt: '2024-01-01' },
    { id: 3, name: 'JazzCash', accountNumber: '03001234567', accountType: 'Mobile Wallet', openingBalance: 25000, status: 'active', addedBy: 'Admin', createdAt: '2024-01-01' }
  ],

  // Account Types (custom types added by user)
  accountTypes: [],

  // Fund Transfers
  fundTransfers: [],

  // Deposits
  deposits: [],

  // UI State
  sidebarCollapsed: false,
  currentPage: 'dashboard'
}

// Use saved state or default
const initialState = loadState() || defaultState

// Reducer - Handles all state updates
function appReducer(state, action) {
  switch (action.type) {
    // ============== AUTHENTICATION ==============
    case 'LOGIN':
      return { 
        ...state, 
        isAuthenticated: true, 
        currentUser: action.payload 
      }

    case 'LOGOUT':
      return { 
        ...state, 
        isAuthenticated: false, 
        currentUser: null 
      }

    // ============== ACTIVITY LOGGING ==============
    case 'ADD_ACTIVITY_LOG': {
      const logEntry = {
        id: Date.now(),
        ...action.payload,
        timestamp: new Date().toISOString(),
        ipAddress: 'localhost' // In real app, get from server
      }
      return {
        ...state,
        activityLogs: [logEntry, ...(state.activityLogs || [])].slice(0, 1000) // Keep last 1000 logs
      }
    }

    case 'CLEAR_ACTIVITY_LOGS':
      return { ...state, activityLogs: [] }

    // Navigation
    case 'SET_PAGE':
      return { ...state, currentPage: action.payload }
    
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed }

    // Business Settings
    case 'UPDATE_BUSINESS':
      return { ...state, business: { ...state.business, ...action.payload } }

    case 'UPDATE_BUSINESS_SETTINGS':
      return { 
        ...state, 
        business: { 
          ...state.business, 
          ...action.payload,
          updatedAt: new Date().toISOString()
        } 
      }

    // ============== USER MANAGEMENT ==============
    // Users
    case 'ADD_USER':
      return { 
        ...state, 
        users: [...state.users, { ...action.payload, id: Date.now(), createdAt: new Date().toISOString().split('T')[0] }] 
      }
    case 'UPDATE_USER':
      return { ...state, users: state.users.map(u => u.id === action.payload.id ? action.payload : u) }
    case 'DELETE_USER':
      return { ...state, users: state.users.filter(u => u.id !== action.payload) }

    // Roles
    case 'ADD_ROLE':
      return { ...state, roles: [...state.roles, { ...action.payload, id: Date.now(), canDelete: true }] }
    case 'UPDATE_ROLE':
      return { ...state, roles: state.roles.map(r => r.id === action.payload.id ? action.payload : r) }
    case 'DELETE_ROLE':
      return { ...state, roles: state.roles.filter(r => r.id !== action.payload) }

    // Sales Agents
    case 'ADD_SALES_AGENT':
      return { ...state, salesAgents: [...state.salesAgents, { ...action.payload, id: Date.now() }] }
    case 'UPDATE_SALES_AGENT':
      return { ...state, salesAgents: state.salesAgents.map(a => a.id === action.payload.id ? action.payload : a) }
    case 'DELETE_SALES_AGENT':
      return { ...state, salesAgents: state.salesAgents.filter(a => a.id !== action.payload) }

    // ============== MASTER DATA ==============
    // Tax Rates
    case 'ADD_TAX_RATE':
      return { ...state, taxRates: [...state.taxRates, { ...action.payload, id: Date.now() }] }
    case 'UPDATE_TAX_RATE':
      return { ...state, taxRates: state.taxRates.map(t => t.id === action.payload.id ? action.payload : t) }
    case 'DELETE_TAX_RATE':
      return { ...state, taxRates: state.taxRates.filter(t => t.id !== action.payload) }

    // Tax Groups
    case 'ADD_TAX_GROUP':
      return { ...state, taxGroups: [...state.taxGroups, { ...action.payload, id: Date.now() }] }
    case 'UPDATE_TAX_GROUP':
      return { ...state, taxGroups: state.taxGroups.map(t => t.id === action.payload.id ? action.payload : t) }
    case 'DELETE_TAX_GROUP':
      return { ...state, taxGroups: state.taxGroups.filter(t => t.id !== action.payload) }

    // Invoice Schemes
    case 'ADD_INVOICE_SCHEME':
      return { ...state, invoiceSchemes: [...state.invoiceSchemes, { ...action.payload, id: Date.now() }] }
    case 'UPDATE_INVOICE_SCHEME':
      return { ...state, invoiceSchemes: state.invoiceSchemes.map(s => s.id === action.payload.id ? action.payload : s) }
    case 'DELETE_INVOICE_SCHEME':
      return { ...state, invoiceSchemes: state.invoiceSchemes.filter(s => s.id !== action.payload) }
    case 'SET_DEFAULT_INVOICE_SCHEME':
      return { 
        ...state, 
        invoiceSchemes: state.invoiceSchemes.map(s => ({ ...s, isDefault: s.id === action.payload }))
      }

    // Invoice Layouts
    case 'ADD_INVOICE_LAYOUT':
      return { ...state, invoiceLayouts: [...state.invoiceLayouts, { ...action.payload, id: Date.now() }] }
    case 'UPDATE_INVOICE_LAYOUT':
      return { ...state, invoiceLayouts: state.invoiceLayouts.map(l => l.id === action.payload.id ? action.payload : l) }
    case 'DELETE_INVOICE_LAYOUT':
      return { ...state, invoiceLayouts: state.invoiceLayouts.filter(l => l.id !== action.payload) }
    case 'SET_DEFAULT_INVOICE_LAYOUT':
      return { 
        ...state, 
        invoiceLayouts: state.invoiceLayouts.map(l => ({ ...l, isDefault: l.id === action.payload }))
      }

    // Business Locations
    case 'ADD_BUSINESS_LOCATION':
      return { ...state, businessLocations: [...state.businessLocations, { ...action.payload, id: Date.now() }] }
    case 'UPDATE_BUSINESS_LOCATION':
      return { ...state, businessLocations: state.businessLocations.map(l => l.id === action.payload.id ? action.payload : l) }
    case 'DELETE_BUSINESS_LOCATION':
      return { ...state, businessLocations: state.businessLocations.filter(l => l.id !== action.payload) }
    case 'SET_PRIMARY_BUSINESS_LOCATION':
      return { 
        ...state, 
        businessLocations: state.businessLocations.map(l => ({ ...l, isPrimary: l.id === action.payload }))
      }
    case 'TOGGLE_BUSINESS_LOCATION_STATUS':
      return { 
        ...state, 
        businessLocations: state.businessLocations.map(l => 
          l.id === action.payload ? { ...l, isActive: !l.isActive } : l
        )
      }

    // Barcode Settings
    case 'ADD_BARCODE_SETTING':
      return { ...state, barcodeSettings: [...state.barcodeSettings, { ...action.payload, id: Date.now() }] }
    case 'UPDATE_BARCODE_SETTING':
      return { ...state, barcodeSettings: state.barcodeSettings.map(s => s.id === action.payload.id ? action.payload : s) }
    case 'DELETE_BARCODE_SETTING':
      return { ...state, barcodeSettings: state.barcodeSettings.filter(s => s.id !== action.payload) }
    case 'SET_DEFAULT_BARCODE_SETTING':
      return { 
        ...state, 
        barcodeSettings: state.barcodeSettings.map(s => ({ ...s, isDefault: s.id === action.payload }))
      }

    // Receipt Printers
    case 'ADD_RECEIPT_PRINTER':
      return { ...state, receiptPrinters: [...state.receiptPrinters, { ...action.payload, id: Date.now() }] }
    case 'UPDATE_RECEIPT_PRINTER':
      return { ...state, receiptPrinters: state.receiptPrinters.map(p => p.id === action.payload.id ? action.payload : p) }
    case 'DELETE_RECEIPT_PRINTER':
      return { ...state, receiptPrinters: state.receiptPrinters.filter(p => p.id !== action.payload) }
    case 'SET_DEFAULT_RECEIPT_PRINTER':
      return { 
        ...state, 
        receiptPrinters: state.receiptPrinters.map(p => ({ ...p, isDefault: p.id === action.payload }))
      }
    case 'TOGGLE_RECEIPT_PRINTER_STATUS':
      return { 
        ...state, 
        receiptPrinters: state.receiptPrinters.map(p => 
          p.id === action.payload ? { ...p, isActive: !p.isActive } : p
        )
      }

    // Units
    case 'ADD_UNIT':
      return { ...state, units: [...state.units, { ...action.payload, id: Date.now() }] }
    case 'UPDATE_UNIT':
      return { ...state, units: state.units.map(u => u.id === action.payload.id ? action.payload : u) }
    case 'DELETE_UNIT':
      return { ...state, units: state.units.filter(u => u.id !== action.payload) }

    // Categories
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, { ...action.payload, id: Date.now() }] }
    case 'UPDATE_CATEGORY':
      return { ...state, categories: state.categories.map(c => c.id === action.payload.id ? action.payload : c) }
    case 'DELETE_CATEGORY':
      return { ...state, categories: state.categories.filter(c => c.id !== action.payload) }

    // Brands
    case 'ADD_BRAND':
      return { ...state, brands: [...state.brands, { ...action.payload, id: Date.now() }] }
    case 'UPDATE_BRAND':
      return { ...state, brands: state.brands.map(b => b.id === action.payload.id ? action.payload : b) }
    case 'DELETE_BRAND':
      return { ...state, brands: state.brands.filter(b => b.id !== action.payload) }

    // ============== WARRANTIES ==============
    case 'ADD_WARRANTY':
      return { ...state, warranties: [...(state.warranties || []), { ...action.payload, id: Date.now() }] }
    case 'UPDATE_WARRANTY':
      return { ...state, warranties: (state.warranties || []).map(w => w.id === action.payload.id ? action.payload : w) }
    case 'DELETE_WARRANTY':
      return { ...state, warranties: (state.warranties || []).filter(w => w.id !== action.payload) }

    // ============== SUPPLIERS ==============
    case 'ADD_SUPPLIER': {
      const newContactId = `CO${String(state.contactIdCounter).padStart(4, '0')}`
      return { 
        ...state, 
        suppliers: [...state.suppliers, { 
          ...action.payload, 
          id: Date.now(), 
          contactId: newContactId,
          balance: action.payload.openingBalance || 0,
          advanceBalance: 0,
          activities: [{ date: new Date().toISOString(), action: 'Added', by: 'Admin', note: '' }],
          documents: [],
          contactPersons: [],
          createdAt: new Date().toISOString().split('T')[0]
        }],
        contactIdCounter: state.contactIdCounter + 1
      }
    }

    case 'UPDATE_SUPPLIER':
      return { 
        ...state, 
        suppliers: state.suppliers.map(s => {
          if (s.id === action.payload.id) {
            return {
              ...s,
              ...action.payload,
              activities: [...(s.activities || []), { date: new Date().toISOString(), action: 'Updated', by: 'Admin', note: '' }]
            }
          }
          return s
        })
      }

    case 'DELETE_SUPPLIER':
      return { ...state, suppliers: state.suppliers.filter(s => s.id !== action.payload) }

    case 'DEACTIVATE_SUPPLIER':
      return { 
        ...state, 
        suppliers: state.suppliers.map(s => {
          if (s.id === action.payload) {
            const newStatus = s.status === 'active' ? 'inactive' : 'active'
            return { 
              ...s, 
              status: newStatus,
              activities: [...(s.activities || []), { 
                date: new Date().toISOString(), 
                action: newStatus === 'active' ? 'Activated' : 'Deactivated', 
                by: 'Admin', 
                note: '' 
              }]
            }
          }
          return s
        })
      }

    case 'UPDATE_SUPPLIER_BALANCE':
      return { 
        ...state, 
        suppliers: state.suppliers.map(s => 
          s.id === action.payload.id 
            ? { ...s, balance: s.balance + action.payload.amount } 
            : s
        ) 
      }

    case 'ADD_SUPPLIER_PAYMENT': {
      const supplierPayment = { ...action.payload, id: Date.now() }
      return {
        ...state,
        suppliers: state.suppliers.map(s => {
          if (s.id === action.payload.supplierId) {
            const newBalance = s.balance - action.payload.amount
            return { 
              ...s, 
              balance: newBalance < 0 ? 0 : newBalance,
              advanceBalance: newBalance < 0 ? Math.abs(newBalance) : s.advanceBalance,
              activities: [...(s.activities || []), { 
                date: new Date().toISOString(), 
                action: 'Payment Added', 
                by: 'Admin', 
                note: `₨${action.payload.amount} paid via ${action.payload.method}` 
              }]
            }
          }
          return s
        }),
        purchasePayments: [...state.purchasePayments, supplierPayment]
      }
    }

    case 'ADD_SUPPLIER_DOCUMENT':
      return {
        ...state,
        suppliers: state.suppliers.map(s =>
          s.id === action.payload.supplierId
            ? { 
                ...s, 
                documents: [...(s.documents || []), { ...action.payload.document, id: Date.now() }],
                activities: [...(s.activities || []), { 
                  date: new Date().toISOString(), 
                  action: 'Document Added', 
                  by: 'Admin', 
                  note: action.payload.document.name 
                }]
              }
            : s
        )
      }

    case 'ADD_SUPPLIER_CONTACT_PERSON':
      return {
        ...state,
        suppliers: state.suppliers.map(s =>
          s.id === action.payload.supplierId
            ? { 
                ...s, 
                contactPersons: [...(s.contactPersons || []), { ...action.payload.person, id: Date.now() }],
                activities: [...(s.activities || []), { 
                  date: new Date().toISOString(), 
                  action: 'Contact Person Added', 
                  by: 'Admin', 
                  note: action.payload.person.name 
                }]
              }
            : s
        )
      }

    case 'DELETE_SUPPLIER_CONTACT_PERSON':
      return {
        ...state,
        suppliers: state.suppliers.map(s =>
          s.id === action.payload.supplierId
            ? { ...s, contactPersons: (s.contactPersons || []).filter(p => p.id !== action.payload.personId) }
            : s
        )
      }

    // ============== CUSTOMERS ==============
    case 'ADD_CUSTOMER': {
      const newCustomerId = `CU${String(state.customerIdCounter).padStart(4, '0')}`
      return { 
        ...state, 
        customers: [...state.customers, { 
          ...action.payload, 
          id: Date.now(), 
          contactId: newCustomerId,
          balance: action.payload.openingBalance || 0,
          advanceBalance: 0,
          activities: [{ date: new Date().toISOString(), action: 'Added', by: 'Admin', note: '' }],
          documents: [],
          contactPersons: [],
          createdAt: new Date().toISOString().split('T')[0]
        }],
        customerIdCounter: state.customerIdCounter + 1
      }
    }

    case 'UPDATE_CUSTOMER':
      return { 
        ...state, 
        customers: state.customers.map(c => {
          if (c.id === action.payload.id) {
            return {
              ...c,
              ...action.payload,
              activities: [...(c.activities || []), { date: new Date().toISOString(), action: 'Updated', by: 'Admin', note: '' }]
            }
          }
          return c
        })
      }

    case 'DELETE_CUSTOMER':
      return { ...state, customers: state.customers.filter(c => c.id !== action.payload) }

    case 'DEACTIVATE_CUSTOMER':
      return { 
        ...state, 
        customers: state.customers.map(c => {
          if (c.id === action.payload) {
            const newStatus = c.status === 'active' ? 'inactive' : 'active'
            return { 
              ...c, 
              status: newStatus,
              activities: [...(c.activities || []), { 
                date: new Date().toISOString(), 
                action: newStatus === 'active' ? 'Activated' : 'Deactivated', 
                by: 'Admin', 
                note: '' 
              }]
            }
          }
          return c
        })
      }

    case 'UPDATE_CUSTOMER_BALANCE':
      return { 
        ...state, 
        customers: state.customers.map(c => 
          c.id === action.payload.id 
            ? { ...c, balance: c.balance + action.payload.amount } 
            : c
        ) 
      }

    case 'ADD_CUSTOMER_PAYMENT': {
      const customerPayment = { ...action.payload, id: Date.now() }
      return {
        ...state,
        customers: state.customers.map(c => {
          if (c.id === action.payload.customerId) {
            const newBalance = c.balance - action.payload.amount
            return { 
              ...c, 
              balance: newBalance < 0 ? 0 : newBalance,
              advanceBalance: newBalance < 0 ? Math.abs(newBalance) : c.advanceBalance,
              activities: [...(c.activities || []), { 
                date: new Date().toISOString(), 
                action: 'Payment Received', 
                by: 'Admin', 
                note: `₨${action.payload.amount} received via ${action.payload.method}` 
              }]
            }
          }
          return c
        }),
        salesPayments: [...state.salesPayments, customerPayment]
      }
    }

    case 'ADD_CUSTOMER_CONTACT_PERSON':
      return {
        ...state,
        customers: state.customers.map(c =>
          c.id === action.payload.customerId
            ? { 
                ...c, 
                contactPersons: [...(c.contactPersons || []), { ...action.payload.person, id: Date.now() }],
                activities: [...(c.activities || []), { 
                  date: new Date().toISOString(), 
                  action: 'Contact Person Added', 
                  by: 'Admin', 
                  note: action.payload.person.name 
                }]
              }
            : c
        )
      }

    case 'DELETE_CUSTOMER_CONTACT_PERSON':
      return {
        ...state,
        customers: state.customers.map(c =>
          c.id === action.payload.customerId
            ? { ...c, contactPersons: (c.contactPersons || []).filter(p => p.id !== action.payload.personId) }
            : c
        )
      }

    // ============== PRODUCTS ==============
    case 'ADD_PRODUCT': {
      const newProduct = { ...action.payload, id: Date.now() }
      const productLog = {
        id: Date.now() + 1,
        action: 'PRODUCT_CREATED',
        module: 'Products',
        description: `Added new product: ${action.payload.name}`,
        userId: state.currentUser?.id || 1,
        userName: state.currentUser?.name || 'Admin',
        userRole: state.currentUser?.role || 'Admin',
        timestamp: new Date().toISOString(),
        details: { productId: newProduct.id, productName: action.payload.name, sku: action.payload.sku }
      }
      return { 
        ...state, 
        products: [...state.products, newProduct],
        activityLogs: [productLog, ...(state.activityLogs || [])].slice(0, 1000)
      }
    }
    case 'UPDATE_PRODUCT': {
      const oldProduct = state.products.find(p => p.id === action.payload.id)
      const productUpdateLog = {
        id: Date.now(),
        action: 'PRODUCT_UPDATED',
        module: 'Products',
        description: `Updated product: ${action.payload.name}`,
        userId: state.currentUser?.id || 1,
        userName: state.currentUser?.name || 'Admin',
        userRole: state.currentUser?.role || 'Admin',
        timestamp: new Date().toISOString(),
        details: { productId: action.payload.id, productName: action.payload.name, oldName: oldProduct?.name }
      }
      return { 
        ...state, 
        products: state.products.map(p => p.id === action.payload.id ? action.payload : p),
        activityLogs: [productUpdateLog, ...(state.activityLogs || [])].slice(0, 1000)
      }
    }
    case 'DELETE_PRODUCT': {
      const deletedProduct = state.products.find(p => p.id === action.payload)
      const productDeleteLog = {
        id: Date.now(),
        action: 'PRODUCT_DELETED',
        module: 'Products',
        description: `Deleted product: ${deletedProduct?.name || 'Unknown'}`,
        userId: state.currentUser?.id || 1,
        userName: state.currentUser?.name || 'Admin',
        userRole: state.currentUser?.role || 'Admin',
        timestamp: new Date().toISOString(),
        details: { productId: action.payload, productName: deletedProduct?.name }
      }
      return { 
        ...state, 
        products: state.products.filter(p => p.id !== action.payload),
        activityLogs: [productDeleteLog, ...(state.activityLogs || [])].slice(0, 1000)
      }
    }
    case 'UPDATE_STOCK':
      return { 
        ...state, 
        products: state.products.map(p => 
          p.id === action.payload.id 
            ? { ...p, currentStock: p.currentStock + action.payload.quantity } 
            : p
        ) 
      }

    // ============== PURCHASE ORDERS ==============
    case 'ADD_PURCHASE_ORDER': {
      const orderNo = `PO-${String(state.purchaseOrderCounter).padStart(4, '0')}`
      const newOrder = {
        ...action.payload,
        id: Date.now(),
        orderNo,
        status: action.payload.status || 'ordered',
        createdAt: new Date().toISOString(),
        createdBy: 'Admin'
      }
      return {
        ...state,
        purchaseOrders: [...state.purchaseOrders, newOrder],
        purchaseOrderCounter: state.purchaseOrderCounter + 1
      }
    }

    case 'UPDATE_PURCHASE_ORDER':
      return {
        ...state,
        purchaseOrders: state.purchaseOrders.map(po =>
          po.id === action.payload.id ? { ...po, ...action.payload } : po
        )
      }

    case 'DELETE_PURCHASE_ORDER':
      return {
        ...state,
        purchaseOrders: state.purchaseOrders.filter(po => po.id !== action.payload)
      }

    case 'CONVERT_ORDER_TO_PURCHASE': {
      const order = state.purchaseOrders.find(po => po.id === action.payload.orderId)
      if (!order) return state
      
      const purchaseNo = `PUR-${String(state.purchaseCounter).padStart(4, '0')}`
      const purchaseId = Date.now()
      const newPurchase = {
        ...order,
        id: purchaseId,
        purchaseNo,
        purchaseOrderId: order.id,
        status: action.payload.amountPaid >= order.total ? 'paid' : action.payload.amountPaid > 0 ? 'partial' : 'due',
        amountPaid: action.payload.amountPaid || 0,
        receivedAt: new Date().toISOString()
      }
      
      // Update product stock
      let updatedProducts = [...state.products]
      order.items.forEach(item => {
        updatedProducts = updatedProducts.map(p =>
          p.id === item.productId
            ? { ...p, currentStock: p.currentStock + item.quantity }
            : p
        )
      })
      
      // Build activities array for supplier
      const supplierActivities = []
      
      // Activity 1: Purchase Received
      supplierActivities.push({
        date: new Date().toISOString(),
        action: 'Purchase Received',
        by: 'Admin',
        note: `${purchaseNo} - ₨${order.total}`
      })
      
      // Activity 2: Payment Added (if amountPaid > 0)
      if (action.payload.amountPaid > 0) {
        supplierActivities.push({
          date: new Date().toISOString(),
          action: 'Payment Added',
          by: 'Admin',
          note: `₨${action.payload.amountPaid} paid via ${action.payload.paymentMethod || 'Cash'}`
        })
      }
      
      // Update supplier balance
      const updatedSuppliers = state.suppliers.map(s =>
        s.id === order.supplierId
          ? { 
              ...s, 
              balance: s.balance + (order.total - (action.payload.amountPaid || 0)),
              activities: [...(s.activities || []), ...supplierActivities]
            }
          : s
      )
      
      // Create payment record if amountPaid > 0
      let updatedPurchasePayments = [...state.purchasePayments]
      if (action.payload.amountPaid > 0) {
        const initialPayment = {
          id: Date.now() + 1,
          purchaseId: purchaseId,
          supplierId: order.supplierId,
          amount: action.payload.amountPaid,
          method: action.payload.paymentMethod || 'Cash',
          accountId: action.payload.accountId || '',
          date: new Date().toISOString(),
          note: `Initial payment for ${purchaseNo}`
        }
        updatedPurchasePayments = [...updatedPurchasePayments, initialPayment]
      }
      
      return {
        ...state,
        purchases: [...state.purchases, newPurchase],
        purchaseCounter: state.purchaseCounter + 1,
        purchaseOrders: state.purchaseOrders.map(po =>
          po.id === action.payload.orderId ? { ...po, status: 'received' } : po
        ),
        products: updatedProducts,
        suppliers: updatedSuppliers,
        purchasePayments: updatedPurchasePayments
      }
    }

    // ============== PURCHASES (FIXED) ==============
    case 'ADD_PURCHASE': {
      const purchaseNo = `PUR-${String(state.purchaseCounter).padStart(4, '0')}`
      const purchaseId = Date.now()
      const newPurchase = { 
        ...action.payload, 
        id: purchaseId,
        purchaseNo,
        status: action.payload.amountPaid >= action.payload.total ? 'paid' : 
                action.payload.amountPaid > 0 ? 'partial' : 'due',
        createdAt: new Date().toISOString(),
        createdBy: state.currentUser?.name || 'Admin'
      }
      
      // Update product stock
      let updatedProductsAfterPurchase = [...state.products]
      action.payload.items.forEach(item => {
        updatedProductsAfterPurchase = updatedProductsAfterPurchase.map(p => 
          p.id === item.productId 
            ? { ...p, currentStock: p.currentStock + item.quantity }
            : p
        )
      })
      
      // Build activities array for supplier
      const supplierActivities = []
      
      // Activity 1: Purchase Added
      supplierActivities.push({
        date: new Date().toISOString(),
        action: 'Purchase Added',
        by: state.currentUser?.name || 'Admin',
        note: `${purchaseNo} - ₨${action.payload.total}`
      })
      
      // Activity 2: Payment Added (if amountPaid > 0)
      if (action.payload.amountPaid > 0) {
        supplierActivities.push({
          date: new Date().toISOString(),
          action: 'Payment Added',
          by: state.currentUser?.name || 'Admin',
          note: `₨${action.payload.amountPaid} paid via ${action.payload.paymentMethod || 'Cash'}`
        })
      }
      
      // Update supplier balance
      const updatedSuppliersAfterPurchase = state.suppliers.map(s => {
        if (s.id === action.payload.supplierId) {
          const balanceToAdd = action.payload.total - (action.payload.amountPaid || 0)
          return { 
            ...s, 
            balance: s.balance + balanceToAdd,
            activities: [...(s.activities || []), ...supplierActivities]
          }
        }
        return s
      })
      
      // Create payment record if amountPaid > 0
      let updatedPurchasePayments = [...state.purchasePayments]
      if (action.payload.amountPaid > 0) {
        const initialPayment = {
          id: Date.now() + 1,
          purchaseId: purchaseId,
          supplierId: action.payload.supplierId,
          amount: action.payload.amountPaid,
          method: action.payload.paymentMethod || 'Cash',
          accountId: action.payload.accountId || '',
          date: new Date().toISOString(),
          note: `Initial payment for ${purchaseNo}`
        }
        updatedPurchasePayments = [...updatedPurchasePayments, initialPayment]
      }

      // Create activity log
      const supplier = state.suppliers.find(s => s.id === action.payload.supplierId)
      const supplierName = supplier?.businessName || supplier?.name || 'Unknown'
      const purchaseActivityLog = {
        id: Date.now() + 2,
        action: 'PURCHASE_CREATED',
        module: 'Purchases',
        description: `Created purchase ${purchaseNo} from ${supplierName} - ₨${action.payload.total}`,
        userId: state.currentUser?.id || 1,
        userName: state.currentUser?.name || 'Admin',
        userRole: state.currentUser?.role || 'Admin',
        timestamp: new Date().toISOString(),
        details: { purchaseId, purchaseNo, total: action.payload.total, supplierId: action.payload.supplierId }
      }
      
      return { 
        ...state, 
        purchases: [...state.purchases, newPurchase],
        purchaseCounter: state.purchaseCounter + 1,
        products: updatedProductsAfterPurchase,
        suppliers: updatedSuppliersAfterPurchase,
        purchasePayments: updatedPurchasePayments,
        activityLogs: [purchaseActivityLog, ...(state.activityLogs || [])].slice(0, 1000)
      }
    }

    case 'UPDATE_PURCHASE':
      return { 
        ...state, 
        purchases: state.purchases.map(p => 
          p.id === action.payload.id ? { ...p, ...action.payload } : p
        ) 
      }

    case 'DELETE_PURCHASE': {
      const purchaseId = action.payload
      const purchase = state.purchases.find(p => p.id === purchaseId)
      
      if (!purchase) return state
      
      // Get all payments made for this purchase
      const purchasePaymentsForThis = (state.purchasePayments || []).filter(p => p.purchaseId === purchaseId)
      const totalPaidForPurchase = purchasePaymentsForThis.reduce((sum, p) => sum + (p.amount || 0), 0)
      
      // Get all returns for this purchase
      const purchaseReturnsForThis = (state.purchaseReturns || []).filter(pr => pr.purchaseId === purchaseId)
      const totalReturnsForPurchase = purchaseReturnsForThis.reduce((sum, pr) => sum + (pr.total || 0), 0)
      
      // Calculate how much was still due on this purchase
      const purchaseDue = (purchase.total || 0) - totalPaidForPurchase - totalReturnsForPurchase
      
      // Update supplier balance (reduce by the amount that was due)
      const updatedSuppliers = state.suppliers.map(supplier => {
        if (supplier.id === purchase.supplierId) {
          return {
            ...supplier,
            balance: Math.max(0, (supplier.balance || 0) - purchaseDue),
            activities: [...(supplier.activities || []), {
              date: new Date().toISOString(),
              action: 'Purchase Deleted',
              by: 'Admin',
              note: `${purchase.purchaseNo} deleted - Balance adjusted by ₨${purchaseDue}`
            }]
          }
        }
        return supplier
      })
      
      // Restore product stock (reduce since purchase added stock)
      let updatedProducts = [...state.products]
      ;(purchase.items || []).forEach(item => {
        updatedProducts = updatedProducts.map(p =>
          p.id === item.productId
            ? { ...p, currentStock: Math.max(0, (p.currentStock || 0) - (item.quantity || 0)) }
            : p
        )
      })
      
      // Remove associated payments
      const updatedPurchasePayments = (state.purchasePayments || []).filter(p => p.purchaseId !== purchaseId)
      
      // Remove associated purchase returns and adjust stock
      const updatedPurchaseReturns = (state.purchaseReturns || []).filter(pr => pr.purchaseId !== purchaseId)
      
      // If there were returns, reverse the stock decrease from returns
      purchaseReturnsForThis.forEach(pr => {
        (pr.items || []).forEach(item => {
          updatedProducts = updatedProducts.map(p =>
            p.id === item.productId
              ? { ...p, currentStock: (p.currentStock || 0) + (item.quantity || 0) }
              : p
          )
        })
      })
      
      return {
        ...state,
        purchases: state.purchases.filter(p => p.id !== purchaseId),
        suppliers: updatedSuppliers,
        products: updatedProducts,
        purchasePayments: updatedPurchasePayments,
        purchaseReturns: updatedPurchaseReturns
      }
    }

    // ============== PURCHASE RETURNS ==============
    case 'ADD_PURCHASE_RETURN': {
      // Ensure purchaseReturnCounter exists
      const currentCounter = state.purchaseReturnCounter || 1
      const returnNo = `PR-${String(currentCounter).padStart(4, '0')}`
      
      const newReturn = {
        ...action.payload,
        id: Date.now(),
        returnNo,
        status: 'completed',
        createdAt: new Date().toISOString(),
        createdBy: 'Admin'
      }
      
      // Safely get existing arrays
      const existingReturns = state.purchaseReturns || []
      const existingProducts = state.products || []
      const existingSuppliers = state.suppliers || []
      
      // Reduce product stock for returned items
      let updatedProductsAfterReturn = [...existingProducts]
      if (action.payload.items && Array.isArray(action.payload.items)) {
        action.payload.items.forEach(item => {
          updatedProductsAfterReturn = updatedProductsAfterReturn.map(p =>
            p.id === item.productId
              ? { ...p, currentStock: (p.currentStock || 0) - (item.quantity || 0) }
              : p
          )
        })
      }
      
      // Update supplier balance (reduce what we owe)
      const updatedSuppliersAfterReturn = existingSuppliers.map(s =>
        s.id === action.payload.supplierId
          ? { 
              ...s, 
              balance: (s.balance || 0) - (action.payload.total || 0),
              activities: [...(s.activities || []), {
                date: new Date().toISOString(),
                action: 'Purchase Return',
                by: 'Admin',
                note: `${returnNo} - ₨${action.payload.total || 0}`
              }]
            }
          : s
      )
      
      return {
        ...state,
        purchaseReturns: [...existingReturns, newReturn],
        purchaseReturnCounter: currentCounter + 1,
        products: updatedProductsAfterReturn,
        suppliers: updatedSuppliersAfterReturn
      }
    }

    case 'DELETE_PURCHASE_RETURN':
      return {
        ...state,
        purchaseReturns: (state.purchaseReturns || []).filter(pr => pr.id !== action.payload)
      }

    // ============== SALES (FIXED) ==============
    case 'ADD_SALE': {
      const saleNo = `INV-${String(state.saleCounter).padStart(4, '0')}`
      const saleId = Date.now()
      const newSale = { 
        ...action.payload, 
        id: saleId,
        invoiceNo: saleNo,
        status: action.payload.amountPaid >= action.payload.total ? 'paid' : 
                action.payload.amountPaid > 0 ? 'partial' : 'due',
        createdAt: new Date().toISOString(),
        createdBy: state.currentUser?.name || 'Admin'
      }
      
      // Update product stock (reduce)
      let updatedProductsAfterSale = [...state.products]
      action.payload.items.forEach(item => {
        updatedProductsAfterSale = updatedProductsAfterSale.map(p => 
          p.id === item.productId 
            ? { ...p, currentStock: p.currentStock - item.quantity }
            : p
        )
      })
      
      // Build activities array for customer
      const customerActivities = []
      
      // Activity 1: Sale Added
      customerActivities.push({
        date: new Date().toISOString(),
        action: 'Sale Added',
        by: state.currentUser?.name || 'Admin',
        note: `${saleNo} - ₨${action.payload.total}`
      })
      
      // Activity 2: Payment Received (if amountPaid > 0)
      if (action.payload.amountPaid > 0) {
        customerActivities.push({
          date: new Date().toISOString(),
          action: 'Payment Received',
          by: state.currentUser?.name || 'Admin',
          note: `₨${action.payload.amountPaid} received via ${action.payload.paymentMethod || 'Cash'}`
        })
      }
      
      // Update customer balance
      const updatedCustomersAfterSale = state.customers.map(c => {
        if (c.id === action.payload.customerId) {
          const balanceToAdd = action.payload.total - (action.payload.amountPaid || 0)
          return { 
            ...c, 
            balance: c.balance + balanceToAdd,
            activities: [...(c.activities || []), ...customerActivities]
          }
        }
        return c
      })
      
      // Create payment record if amountPaid > 0
      let updatedSalesPayments = [...state.salesPayments]
      if (action.payload.amountPaid > 0) {
        const initialPayment = {
          id: Date.now() + 1,
          saleId: saleId,
          customerId: action.payload.customerId,
          amount: action.payload.amountPaid,
          method: action.payload.paymentMethod || 'Cash',
          accountId: action.payload.accountId || '',
          date: new Date().toISOString(),
          note: `Initial payment for ${saleNo}`
        }
        updatedSalesPayments = [...updatedSalesPayments, initialPayment]
      }

      // Create activity log
      const customerName = state.customers.find(c => c.id === action.payload.customerId)?.name || 'Walk-in'
      const saleActivityLog = {
        id: Date.now() + 2,
        action: 'SALE_CREATED',
        module: 'Sales',
        description: `Created sale ${saleNo} for ${customerName} - ₨${action.payload.total}`,
        userId: state.currentUser?.id || 1,
        userName: state.currentUser?.name || 'Admin',
        userRole: state.currentUser?.role || 'Admin',
        timestamp: new Date().toISOString(),
        details: { saleId, invoiceNo: saleNo, total: action.payload.total, customerId: action.payload.customerId }
      }
      
      return { 
        ...state, 
        sales: [...state.sales, newSale],
        saleCounter: state.saleCounter + 1,
        products: updatedProductsAfterSale,
        customers: updatedCustomersAfterSale,
        salesPayments: updatedSalesPayments,
        activityLogs: [saleActivityLog, ...(state.activityLogs || [])].slice(0, 1000)
      }
    }

    case 'UPDATE_SALE':
      return { 
        ...state, 
        sales: state.sales.map(s => 
          s.id === action.payload.id ? { ...s, ...action.payload } : s
        ) 
      }

    // ============== DELETE SALE (FIXED - COMPREHENSIVE) ==============
    case 'DELETE_SALE': {
      const saleId = action.payload
      const sale = state.sales.find(s => s.id === saleId)
      
      if (!sale) return state
      
      // Get all payments made for this sale
      const salePayments = (state.salesPayments || []).filter(p => p.saleId === saleId)
      const totalPaidForSale = salePayments.reduce((sum, p) => sum + (p.amount || 0), 0)
      
      // Get all returns for this sale
      const saleReturnsForSale = (state.saleReturns || []).filter(sr => sr.saleId === saleId)
      const totalReturnsForSale = saleReturnsForSale.reduce((sum, sr) => sum + (sr.total || 0), 0)
      
      // Calculate how much was still due on this sale (this is what affects customer balance)
      const saleDue = (sale.total || 0) - totalPaidForSale - totalReturnsForSale
      
      // Update customer balance (reduce by the amount that was due)
      const updatedCustomers = state.customers.map(customer => {
        if (customer.id === sale.customerId) {
          return {
            ...customer,
            balance: Math.max(0, (customer.balance || 0) - saleDue),
            activities: [...(customer.activities || []), {
              date: new Date().toISOString(),
              action: 'Sale Deleted',
              by: 'Admin',
              note: `${sale.invoiceNo} deleted - Balance adjusted by ₨${saleDue}`
            }]
          }
        }
        return customer
      })
      
      // Restore product stock
      let updatedProducts = [...state.products]
      ;(sale.items || []).forEach(item => {
        updatedProducts = updatedProducts.map(p =>
          p.id === item.productId
            ? { ...p, currentStock: (p.currentStock || 0) + (item.quantity || 0) }
            : p
        )
      })
      
      // Remove associated payments
      const updatedSalesPayments = (state.salesPayments || []).filter(p => p.saleId !== saleId)
      
      // Remove associated sale returns
      const updatedSaleReturns = (state.saleReturns || []).filter(sr => sr.saleId !== saleId)
      
      // If there were returns, reverse the stock increase from returns
      // (Returns increase stock, so we need to decrease it back)
      saleReturnsForSale.forEach(sr => {
        (sr.items || []).forEach(item => {
          updatedProducts = updatedProducts.map(p =>
            p.id === item.productId
              ? { ...p, currentStock: Math.max(0, (p.currentStock || 0) - (item.quantity || 0)) }
              : p
          )
        })
      })
      
      return {
        ...state,
        sales: state.sales.filter(s => s.id !== saleId),
        customers: updatedCustomers,
        products: updatedProducts,
        salesPayments: updatedSalesPayments,
        saleReturns: updatedSaleReturns
      }
    }

    case 'UPDATE_SALE_SHIPPING':
      return { 
        ...state, 
        sales: state.sales.map(s => 
          s.id === action.payload.id ? { ...s, shippingStatus: action.payload.shippingStatus } : s
        ) 
      }

    // ============== SALE RETURNS ==============
    case 'ADD_SALE_RETURN': {
      const returnNo = `SR-${String(state.saleReturnCounter).padStart(4, '0')}`
      const newReturn = {
        ...action.payload,
        id: Date.now(),
        returnNo,
        status: 'completed',
        createdAt: new Date().toISOString(),
        createdBy: 'Admin'
      }
      
      // Increase product stock for returned items
      let updatedProductsAfterSaleReturn = [...state.products]
      action.payload.items.forEach(item => {
        updatedProductsAfterSaleReturn = updatedProductsAfterSaleReturn.map(p =>
          p.id === item.productId
            ? { ...p, currentStock: p.currentStock + item.quantity }
            : p
        )
      })
      
      // Update customer balance (reduce what they owe)
      const updatedCustomersAfterReturn = state.customers.map(c =>
        c.id === action.payload.customerId
          ? { 
              ...c, 
              balance: c.balance - action.payload.total,
              activities: [...(c.activities || []), {
                date: new Date().toISOString(),
                action: 'Sale Return',
                by: 'Admin',
                note: `${returnNo} - ₨${action.payload.total}`
              }]
            }
          : c
      )
      
      return {
        ...state,
        saleReturns: [...state.saleReturns, newReturn],
        saleReturnCounter: state.saleReturnCounter + 1,
        products: updatedProductsAfterSaleReturn,
        customers: updatedCustomersAfterReturn
      }
    }

    case 'DELETE_SALE_RETURN':
      return {
        ...state,
        saleReturns: state.saleReturns.filter(sr => sr.id !== action.payload)
      }

    // ============== PAYMENTS ==============
    case 'ADD_PURCHASE_PAYMENT': {
      const purchasePayment = { ...action.payload, id: Date.now() }
      const updatedPurchases = state.purchases.map(p => {
        if (p.id === action.payload.purchaseId) {
          const newAmountPaid = (p.amountPaid || 0) + action.payload.amount
          return { 
            ...p, 
            amountPaid: newAmountPaid,
            status: newAmountPaid >= p.total ? 'paid' : 'partial'
          }
        }
        return p
      })
      const updatedSuppliersAfterPayment = state.suppliers.map(s =>
        s.id === action.payload.supplierId
          ? { 
              ...s, 
              balance: s.balance - action.payload.amount,
              activities: [...(s.activities || []), {
                date: new Date().toISOString(),
                action: 'Payment Added',
                by: 'Admin',
                note: `₨${action.payload.amount} paid via ${action.payload.method}`
              }]
            }
          : s
      )
      return {
        ...state,
        purchasePayments: [...state.purchasePayments, purchasePayment],
        purchases: updatedPurchases,
        suppliers: updatedSuppliersAfterPayment
      }
    }

    case 'ADD_SALES_PAYMENT': {
      const salesPayment = { ...action.payload, id: Date.now() }
      const updatedSales = state.sales.map(s => {
        if (s.id === action.payload.saleId) {
          const newAmountPaid = (s.amountPaid || 0) + action.payload.amount
          return { 
            ...s, 
            amountPaid: newAmountPaid,
            status: newAmountPaid >= s.total ? 'paid' : 'partial'
          }
        }
        return s
      })
      const updatedCustomersAfterPayment = state.customers.map(c =>
        c.id === action.payload.customerId
          ? { 
              ...c, 
              balance: c.balance - action.payload.amount,
              activities: [...(c.activities || []), {
                date: new Date().toISOString(),
                action: 'Payment Received',
                by: 'Admin',
                note: `₨${action.payload.amount} received via ${action.payload.method}`
              }]
            }
          : c
      )
      return {
        ...state,
        salesPayments: [...state.salesPayments, salesPayment],
        sales: updatedSales,
        customers: updatedCustomersAfterPayment
      }
    }

    // ============== EXPENSES ==============
    case 'ADD_EXPENSE':
      return { ...state, expenses: [...state.expenses, { ...action.payload, id: Date.now() }] }
    
    case 'ADD_EXPENSE_FULL': {
      const expenseCounter = state.expenseCounter || 1
      const referenceNo = `EXP-${String(expenseCounter).padStart(4, '0')}`
      
      const newExpense = {
        ...action.payload,
        id: Date.now(),
        referenceNo,
        createdAt: new Date().toISOString(),
        addedBy: state.currentUser?.name || 'Admin'
      }

      const expenseLog = {
        id: Date.now() + 1,
        action: 'EXPENSE_CREATED',
        module: 'Expenses',
        description: `Added expense ${referenceNo}: ${action.payload.expenseFor || 'General'} - ₨${action.payload.totalAmount}`,
        userId: state.currentUser?.id || 1,
        userName: state.currentUser?.name || 'Admin',
        userRole: state.currentUser?.role || 'Admin',
        timestamp: new Date().toISOString(),
        details: { expenseId: newExpense.id, referenceNo, amount: action.payload.totalAmount }
      }
      
      return {
        ...state,
        expenses: [...(state.expenses || []), newExpense],
        expenseCounter: expenseCounter + 1,
        activityLogs: [expenseLog, ...(state.activityLogs || [])].slice(0, 1000)
      }
    }
    
    case 'UPDATE_EXPENSE':
      return { ...state, expenses: state.expenses.map(e => e.id === action.payload.id ? action.payload : e) }
    
    case 'DELETE_EXPENSE':
      return { ...state, expenses: state.expenses.filter(e => e.id !== action.payload) }
    
    case 'ADD_EXPENSE_PAYMENT': {
      const { expenseId, amount } = action.payload
      
      return {
        ...state,
        expenses: state.expenses.map(exp => {
          if (exp.id === expenseId) {
            const newAmountPaid = (exp.amountPaid || 0) + amount
            let paymentStatus = 'due'
            if (newAmountPaid >= exp.totalAmount) {
              paymentStatus = 'paid'
            } else if (newAmountPaid > 0) {
              paymentStatus = 'partial'
            }
            return {
              ...exp,
              amountPaid: Math.min(newAmountPaid, exp.totalAmount),
              paymentStatus
            }
          }
          return exp
        })
      }
    }

    // ============== EXPENSE CATEGORIES ==============
    case 'ADD_EXPENSE_CATEGORY':
      return { 
        ...state, 
        expenseCategories: [...(state.expenseCategories || []), { ...action.payload, id: Date.now() }] 
      }
    
    case 'UPDATE_EXPENSE_CATEGORY':
      return { 
        ...state, 
        expenseCategories: (state.expenseCategories || []).map(c => c.id === action.payload.id ? action.payload : c) 
      }
    
    case 'DELETE_EXPENSE_CATEGORY':
      return { 
        ...state, 
        expenseCategories: (state.expenseCategories || []).filter(c => c.id !== action.payload) 
      }

    // ============== STOCK ADJUSTMENT ==============
    case 'ADD_STOCK_ADJUSTMENT': {
      const adjustment = { ...action.payload, id: Date.now(), createdAt: new Date().toISOString() }
      const updatedProductsAfterAdjustment = state.products.map(p =>
        p.id === action.payload.productId
          ? { ...p, currentStock: p.currentStock + action.payload.quantity }
          : p
      )
      return {
        ...state,
        stockAdjustments: [...state.stockAdjustments, adjustment],
        products: updatedProductsAfterAdjustment
      }
    }

    case 'ADD_STOCK_ADJUSTMENT_FULL': {
      const counter = state.stockAdjustmentCounter || 1
      const referenceNo = `SA-${String(counter).padStart(4, '0')}`
      
      const newAdjustment = {
        ...action.payload,
        id: Date.now(),
        referenceNo,
        createdAt: new Date().toISOString(),
        addedBy: state.currentUser?.name || 'Admin'
      }
      
      // Update stock for all items
      let updatedProducts = [...state.products]
      action.payload.items.forEach(item => {
        updatedProducts = updatedProducts.map(p =>
          p.id === item.productId
            ? { ...p, currentStock: (p.currentStock || 0) + item.quantity }
            : p
        )
      })

      const adjustmentLog = {
        id: Date.now() + 1,
        action: 'STOCK_ADJUSTMENT_CREATED',
        module: 'Stock Adjustment',
        description: `Created stock adjustment ${referenceNo} (${action.payload.adjustmentType}) - ₨${action.payload.totalAmount || 0}`,
        userId: state.currentUser?.id || 1,
        userName: state.currentUser?.name || 'Admin',
        userRole: state.currentUser?.role || 'Admin',
        timestamp: new Date().toISOString(),
        details: { adjustmentId: newAdjustment.id, referenceNo, type: action.payload.adjustmentType, itemCount: action.payload.items?.length }
      }
      
      return {
        ...state,
        stockAdjustments: [...(state.stockAdjustments || []), newAdjustment],
        stockAdjustmentCounter: counter + 1,
        products: updatedProducts,
        activityLogs: [adjustmentLog, ...(state.activityLogs || [])].slice(0, 1000)
      }
    }

    case 'DELETE_STOCK_ADJUSTMENT':
      return {
        ...state,
        stockAdjustments: (state.stockAdjustments || []).filter(sa => sa.id !== action.payload)
      }

    // ============== REGISTER SESSIONS (CASH REGISTER) ==============
    case 'OPEN_REGISTER_SESSION': {
      const counter = state.registerSessionCounter || 1
      const sessionId = action.payload.id || `REG-${String(counter).padStart(4, '0')}`
      
      const newSession = {
        ...action.payload,
        id: sessionId,
        status: 'open',
        cashMovements: [],
        openedBy: state.currentUser?.name || 'Admin',
        createdAt: new Date().toISOString()
      }

      const registerOpenLog = {
        id: Date.now() + 1,
        action: 'REGISTER_OPENED',
        module: 'Cash Register',
        description: `Opened register session ${sessionId} with ₨${action.payload.openingAmount}`,
        userId: state.currentUser?.id || 1,
        userName: state.currentUser?.name || 'Admin',
        userRole: state.currentUser?.role || 'Admin',
        timestamp: new Date().toISOString(),
        details: { sessionId, openingAmount: action.payload.openingAmount }
      }
      
      return {
        ...state,
        registerSessions: [...(state.registerSessions || []), newSession],
        registerSessionCounter: counter + 1,
        activityLogs: [registerOpenLog, ...(state.activityLogs || [])].slice(0, 1000)
      }
    }

    case 'CLOSE_REGISTER_SESSION': {
      const registerCloseLog = {
        id: Date.now(),
        action: 'REGISTER_CLOSED',
        module: 'Cash Register',
        description: `Closed register ${action.payload.id} - Expected: ₨${action.payload.expectedAmount}, Actual: ₨${action.payload.closingAmount}, Diff: ₨${action.payload.difference}`,
        userId: state.currentUser?.id || 1,
        userName: state.currentUser?.name || 'Admin',
        userRole: state.currentUser?.role || 'Admin',
        timestamp: new Date().toISOString(),
        details: { 
          sessionId: action.payload.id, 
          expectedAmount: action.payload.expectedAmount, 
          closingAmount: action.payload.closingAmount,
          difference: action.payload.difference
        }
      }

      return {
        ...state,
        registerSessions: (state.registerSessions || []).map(session =>
          session.id === action.payload.id
            ? { ...session, ...action.payload, status: 'closed', closedBy: state.currentUser?.name || 'Admin' }
            : session
        ),
        activityLogs: [registerCloseLog, ...(state.activityLogs || [])].slice(0, 1000)
      }
    }

    case 'ADD_CASH_MOVEMENT': {
      return {
        ...state,
        registerSessions: (state.registerSessions || []).map(session => {
          if (session.id === action.payload.sessionId) {
            return {
              ...session,
              cashMovements: [...(session.cashMovements || []), action.payload.movement]
            }
          }
          return session
        })
      }
    }

    case 'SET_REGISTER_SESSIONS':
      return { ...state, registerSessions: action.payload }

    case 'DELETE_REGISTER_SESSION':
      return {
        ...state,
        registerSessions: (state.registerSessions || []).filter(s => s.id !== action.payload)
      }

    // ============== ACCOUNTS ==============
    case 'ADD_ACCOUNT':
      return { ...state, accounts: [...state.accounts, { ...action.payload, id: Date.now() }] }
    case 'UPDATE_ACCOUNT':
      return { ...state, accounts: state.accounts.map(a => a.id === action.payload.id ? action.payload : a) }
    case 'DELETE_ACCOUNT':
      return { ...state, accounts: state.accounts.filter(a => a.id !== action.payload) }
    case 'UPDATE_ACCOUNT_BALANCE':
      return {
        ...state,
        accounts: state.accounts.map(a =>
          a.id === action.payload.id
            ? { ...a, balance: a.balance + action.payload.amount }
            : a
        )
      }

    // ============== PAYMENT ACCOUNTS (COMPREHENSIVE) ==============
    case 'ADD_PAYMENT_ACCOUNT':
      return { 
        ...state, 
        paymentAccounts: [...(state.paymentAccounts || []), { ...action.payload, id: Date.now() }] 
      }
    case 'UPDATE_PAYMENT_ACCOUNT':
      return { 
        ...state, 
        paymentAccounts: (state.paymentAccounts || []).map(a => 
          a.id === action.payload.id ? { ...a, ...action.payload } : a
        ) 
      }
    case 'DELETE_PAYMENT_ACCOUNT':
      return { 
        ...state, 
        paymentAccounts: (state.paymentAccounts || []).filter(a => a.id !== action.payload) 
      }

    // ============== ACCOUNT TYPES ==============
    case 'ADD_ACCOUNT_TYPE':
      return { 
        ...state, 
        accountTypes: [...(state.accountTypes || []), { ...action.payload, id: action.payload.id || Date.now().toString() }] 
      }
    case 'DELETE_ACCOUNT_TYPE':
      return { 
        ...state, 
        accountTypes: (state.accountTypes || []).filter(t => t.id !== action.payload) 
      }

    // ============== FUND TRANSFERS ==============
    case 'ADD_FUND_TRANSFER':
      return { 
        ...state, 
        fundTransfers: [...(state.fundTransfers || []), { ...action.payload, id: Date.now() }] 
      }
    case 'DELETE_FUND_TRANSFER':
      return { 
        ...state, 
        fundTransfers: (state.fundTransfers || []).filter(t => t.id !== action.payload) 
      }

    // ============== DEPOSITS ==============
    case 'ADD_DEPOSIT':
      return { 
        ...state, 
        deposits: [...(state.deposits || []), { ...action.payload, id: Date.now() }] 
      }
    case 'DELETE_DEPOSIT':
      return { 
        ...state, 
        deposits: (state.deposits || []).filter(d => d.id !== action.payload) 
      }

    // ============== RESET DATA ==============
    case 'RESET_DATA':
      localStorage.removeItem('swiftpos-data')
      return defaultState

    default:
      return state
  }
}

// Create Context
const AppContext = createContext()

// Provider Component
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem('swiftpos-data', JSON.stringify(state))
    } catch (error) {
      console.error('Error saving state to localStorage:', error)
    }
  }, [state])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

// Custom Hook
export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}