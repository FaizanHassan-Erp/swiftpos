// firestoreService.js
// Handles all Firestore database operations for SwiftPOS
// Each function includes businessId to ensure data isolation

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from './config'

// ============================================
// HELPER: Get collection reference for a business
// ============================================
const getBusinessCollection = (businessId, collectionName) => {
  return collection(db, 'businesses', businessId, collectionName)
}

const getBusinessDoc = (businessId) => {
  return doc(db, 'businesses', businessId)
}

// ============================================
// BUSINESS SETTINGS
// ============================================
export async function saveBusinessSettings(businessId, settings) {
  try {
    const businessRef = getBusinessDoc(businessId)
    await setDoc(businessRef, {
      settings: {
        ...settings,
        updatedAt: serverTimestamp()
      }
    }, { merge: true })
    return { success: true }
  } catch (error) {
    console.error('Error saving business settings:', error)
    return { success: false, error }
  }
}

export async function getBusinessSettings(businessId) {
  try {
    const businessRef = getBusinessDoc(businessId)
    const docSnap = await getDoc(businessRef)
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data().settings || {} }
    }
    return { success: true, data: {} }
  } catch (error) {
    console.error('Error getting business settings:', error)
    return { success: false, error, data: {} }
  }
}

// ============================================
// GENERIC CRUD OPERATIONS
// ============================================

// CREATE
export async function addDocument(businessId, collectionName, data) {
  try {
    const colRef = getBusinessCollection(businessId, collectionName)
    // Strip local-only fields before saving to Firestore
    const { id, _tempId, ...cleanData } = data
    const docRef = await addDoc(colRef, {
      ...cleanData,
      businessId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return { success: true, id: docRef.id }
  } catch (error) {
    console.error(`Error adding ${collectionName}:`, error)
    return { success: false, error }
  }
}

// CREATE with specific ID
export async function setDocument(businessId, collectionName, docId, data) {
  try {
    const docRef = doc(db, 'businesses', businessId, collectionName, docId)
    await setDoc(docRef, {
      ...data,
      businessId,
      updatedAt: serverTimestamp()
    }, { merge: true })
    return { success: true, id: docId }
  } catch (error) {
    console.error(`Error setting ${collectionName}:`, error)
    return { success: false, error }
  }
}

// READ ALL
export async function getDocuments(businessId, collectionName) {
  try {
    const colRef = getBusinessCollection(businessId, collectionName)
    const querySnapshot = await getDocs(colRef)
    const documents = []
    querySnapshot.forEach((doc) => {
      documents.push({ ...doc.data(), id: doc.id })
    })
    return { success: true, data: documents }
  } catch (error) {
    console.error(`Error getting ${collectionName}:`, error)
    return { success: false, error, data: [] }
  }
}

// READ ONE
export async function getDocument(businessId, collectionName, docId) {
  try {
    const docRef = doc(db, 'businesses', businessId, collectionName, docId)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } }
    }
    return { success: false, error: 'Document not found' }
  } catch (error) {
    console.error(`Error getting ${collectionName} document:`, error)
    return { success: false, error }
  }
}

// UPDATE
export async function updateDocument(businessId, collectionName, docId, data) {
  try {
    const docRef = doc(db, 'businesses', businessId, collectionName, docId)
    // Strip local-only fields before saving to Firestore
    const { id, _tempId, ...cleanData } = data
    await updateDoc(docRef, {
      ...cleanData,
      updatedAt: serverTimestamp()
    })
    return { success: true }
  } catch (error) {
    console.error(`Error updating ${collectionName}:`, error)
    return { success: false, error }
  }
}

// DELETE
export async function deleteDocument(businessId, collectionName, docId) {
  try {
    const docRef = doc(db, 'businesses', businessId, collectionName, docId)
    await deleteDoc(docRef)
    return { success: true }
  } catch (error) {
    console.error(`Error deleting ${collectionName}:`, error)
    return { success: false, error }
  }
}

// ============================================
// REAL-TIME LISTENERS
// ============================================
export function subscribeToCollection(businessId, collectionName, callback) {
  const colRef = getBusinessCollection(businessId, collectionName)
  
  return onSnapshot(colRef, (snapshot) => {
    const documents = []
    snapshot.forEach((doc) => {
      documents.push({ ...doc.data(), id: doc.id })
    })
    callback(documents)
  }, (error) => {
    console.error(`Error in ${collectionName} subscription:`, error)
  })
}

// ============================================
// BATCH OPERATIONS (for complex transactions)
// ============================================
export async function batchWrite(operations) {
  try {
    const batch = writeBatch(db)
    
    operations.forEach(op => {
      const docRef = doc(db, 'businesses', op.businessId, op.collection, op.docId)
      
      if (op.type === 'set') {
        batch.set(docRef, { ...op.data, updatedAt: serverTimestamp() }, { merge: true })
      } else if (op.type === 'update') {
        batch.update(docRef, { ...op.data, updatedAt: serverTimestamp() })
      } else if (op.type === 'delete') {
        batch.delete(docRef)
      }
    })
    
    await batch.commit()
    return { success: true }
  } catch (error) {
    console.error('Error in batch write:', error)
    return { success: false, error }
  }
}

// ============================================
// COUNTERS (for invoice numbers, etc.)
// ============================================
export async function getNextCounter(businessId, counterName) {
  try {
    const counterRef = doc(db, 'businesses', businessId, 'counters', counterName)
    const counterSnap = await getDoc(counterRef)
    
    let currentValue = 1
    if (counterSnap.exists()) {
      currentValue = (counterSnap.data().value || 0) + 1
    }
    
    await setDoc(counterRef, { value: currentValue, updatedAt: serverTimestamp() })
    return { success: true, value: currentValue }
  } catch (error) {
    console.error('Error getting counter:', error)
    return { success: false, error, value: 1 }
  }
}

// ============================================
// INITIALIZE NEW BUSINESS
// ============================================
export async function initializeNewBusiness(businessId, businessName, ownerName) {
  try {
    const businessRef = getBusinessDoc(businessId)
    
    const defaultSettings = {
      name: businessName || 'My Business',
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
    }
    
    const defaultCustomer = {
      contactId: 'CU0001',
      contactType: 'customer',
      businessType: 'individual',
      name: 'Walk-in Customer',
      phone: '',
      email: '',
      balance: 0,
      status: 'active',
      createdAt: new Date().toISOString()
    }
    
    const defaultUnits = [
      { name: 'Piece', shortName: 'Pc', allowDecimal: false },
      { name: 'Kilogram', shortName: 'Kg', allowDecimal: true },
      { name: 'Liter', shortName: 'L', allowDecimal: true },
      { name: 'Box', shortName: 'Box', allowDecimal: false }
    ]
    
    const defaultCategories = [
      { name: 'General', code: 'GEN', description: '' }
    ]

    const defaultRoles = [
      { name: 'Owner', description: 'Full access to everything', permissions: ['all'], isDefault: true },
      { name: 'Admin', description: 'Full access except owner settings', permissions: ['all'], isDefault: true },
      { name: 'Cashier', description: 'POS and basic sales access', permissions: ['pos', 'sales', 'customers'], isDefault: true }
    ]
    
    // Save business settings
    await setDoc(businessRef, {
      settings: defaultSettings,
      ownerId: businessId,
      ownerName: ownerName,
      createdAt: serverTimestamp()
    })
    
    // Initialize counters
    const countersRef = collection(db, 'businesses', businessId, 'counters')
    await setDoc(doc(countersRef, 'sales'), { value: 0 })
    await setDoc(doc(countersRef, 'purchases'), { value: 0 })
    await setDoc(doc(countersRef, 'expenses'), { value: 0 })
    await setDoc(doc(countersRef, 'customers'), { value: 1 })
    await setDoc(doc(countersRef, 'suppliers'), { value: 0 })
    
    // Add default customer
    await addDocument(businessId, 'customers', defaultCustomer)
    
    // Add default units
    for (const unit of defaultUnits) {
      await addDocument(businessId, 'units', unit)
    }
    
    // Add default categories
    for (const category of defaultCategories) {
      await addDocument(businessId, 'categories', category)
    }

    // Add default roles
    for (const role of defaultRoles) {
      await addDocument(businessId, 'roles', role)
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error initializing business:', error)
    return { success: false, error }
  }
}

// ============================================
// LOAD ALL BUSINESS DATA
// ============================================
export async function loadAllBusinessData(businessId) {
  try {
    const [
      settingsResult,
      productsResult,
      customersResult,
      suppliersResult,
      salesResult,
      purchasesResult,
      expensesResult,
      categoriesResult,
      brandsResult,
      unitsResult,
      countersResult,
      // ===== NEWLY ADDED COLLECTIONS =====
      salesAgentsResult,
      paymentAccountsResult,
      salesPaymentsResult,
      purchasePaymentsResult,
      stockAdjustmentsResult,
      saleReturnsResult,
      purchaseReturnsResult,
      taxRatesResult,
      rolesResult,
      activityLogsResult,
      warrantiesResult,
      expenseCategoriesResult,
      accountTypesResult,
      fundTransfersResult,
      depositsResult,
      registerSessionsResult
    ] = await Promise.all([
      getBusinessSettings(businessId),
      getDocuments(businessId, 'products'),
      getDocuments(businessId, 'customers'),
      getDocuments(businessId, 'suppliers'),
      getDocuments(businessId, 'sales'),
      getDocuments(businessId, 'purchases'),
      getDocuments(businessId, 'expenses'),
      getDocuments(businessId, 'categories'),
      getDocuments(businessId, 'brands'),
      getDocuments(businessId, 'units'),
      getDocuments(businessId, 'counters'),
      // ===== NEWLY ADDED COLLECTIONS =====
      getDocuments(businessId, 'salesAgents'),
      getDocuments(businessId, 'paymentAccounts'),
      getDocuments(businessId, 'salesPayments'),
      getDocuments(businessId, 'purchasePayments'),
      getDocuments(businessId, 'stockAdjustments'),
      getDocuments(businessId, 'saleReturns'),
      getDocuments(businessId, 'purchaseReturns'),
      getDocuments(businessId, 'taxRates'),
      getDocuments(businessId, 'roles'),
      getDocuments(businessId, 'activityLogs'),
      getDocuments(businessId, 'warranties'),
      getDocuments(businessId, 'expenseCategories'),
      getDocuments(businessId, 'accountTypes'),
      getDocuments(businessId, 'fundTransfers'),
      getDocuments(businessId, 'deposits'),
      getDocuments(businessId, 'registerSessions')
    ])
    
    // Convert counters array to object
    const counters = {}
    countersResult.data.forEach(c => {
      counters[c.id] = c.value || 0
    })
    
    return {
      success: true,
      data: {
        business: settingsResult.data || {},
        products: productsResult.data || [],
        customers: customersResult.data || [],
        suppliers: suppliersResult.data || [],
        sales: salesResult.data || [],
        purchases: purchasesResult.data || [],
        expenses: expensesResult.data || [],
        categories: categoriesResult.data || [],
        brands: brandsResult.data || [],
        units: unitsResult.data || [],
        // ===== NEWLY ADDED =====
        salesAgents: salesAgentsResult.data || [],
        paymentAccounts: paymentAccountsResult.data || [],
        salesPayments: salesPaymentsResult.data || [],
        purchasePayments: purchasePaymentsResult.data || [],
        stockAdjustments: stockAdjustmentsResult.data || [],
        saleReturns: saleReturnsResult.data || [],
        purchaseReturns: purchaseReturnsResult.data || [],
        taxRates: taxRatesResult.data || [],
        roles: rolesResult.data || [],
        activityLogs: activityLogsResult.data || [],
        warranties: warrantiesResult.data || [],
        expenseCategories: expenseCategoriesResult.data || [],
        accountTypes: accountTypesResult.data || [],
        fundTransfers: fundTransfersResult.data || [],
        deposits: depositsResult.data || [],
        registerSessions: registerSessionsResult.data || [],
        // Counters
        saleCounter: counters.sales || 0,
        purchaseCounter: counters.purchases || 0,
        expenseCounter: counters.expenses || 0,
        customerCounter: counters.customers || 0,
        supplierCounter: counters.suppliers || 0
      }
    }
  } catch (error) {
    console.error('Error loading business data:', error)
    return { success: false, error, data: null }
  }
}