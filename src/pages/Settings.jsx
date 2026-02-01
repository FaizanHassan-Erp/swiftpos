import { useState, useEffect } from 'react'
import { useApp } from '../Context/AppContext'

export default function Settings() {
  const { state, dispatch } = useApp()
  const { business = {} } = state

  const [activeTab, setActiveTab] = useState('business')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Form state - initialize from business settings
  const [formData, setFormData] = useState({
    // Business Tab
    name: '',
    startDate: '',
    defaultProfitPercent: 10,
    currency: 'PKR',
    currencySymbol: 'Rs',
    currencyPlacement: 'before',
    timezone: 'Asia/Karachi',
    logo: '',
    financialYearStart: 'January',
    stockAccountingMethod: 'FIFO',
    transactionEditDays: 30,
    dateFormat: 'dd/mm/yyyy',
    timeFormat: '24',
    currencyPrecision: 2,
    quantityPrecision: 2,

    // Tax Tab
    taxNumber1Label: 'Tax 1',
    taxNumber1: '',
    taxNumber2Label: 'Tax 2',
    taxNumber2: '',
    enableInlineTax: true,
    enablePriceTax: false,

    // Product Tab
    skuPrefix: '',
    enableBrands: true,
    enableCategories: true,
    enableSubCategories: true,
    enableUnits: true,
    enableWarranty: true,
    enableExpiryDate: true,
    enableRacks: false,
    defaultUnit: '',
    defaultSellingPriceTax: 'exclusive',
    
    // Contact Tab
    customerPrefix: 'CUS',
    supplierPrefix: 'SUP',
    defaultCreditLimit: 0,
    defaultPaymentTerm: '',

    // Sale Tab
    defaultSaleDiscount: 0,
    sellPriceTax: 'exclusive',
    enableSalesOrder: true,
    enableDraftSales: true,
    enableQuotation: true,
    salesItemAddMethod: 'dropdown',
    allowOverselling: false,

    // POS Tab
    posLayout: 'default',
    showProductImage: true,
    enableSuspendSale: true,
    enableCashDenominations: false,
    defaultWalkInCustomer: '',
    posShortcuts: true,
    printReceiptOnSale: true,
    enableWeightScale: false,

    // Purchases Tab
    purchasePriceTax: 'exclusive',
    enablePurchaseOrder: true,
    defaultPurchaseStatus: 'received',

    // Payment Tab
    paymentMethods: [
      { id: 1, name: 'Cash', enabled: true, isDefault: true },
      { id: 2, name: 'Card', enabled: true, isDefault: false },
      { id: 3, name: 'Cheque', enabled: true, isDefault: false },
      { id: 4, name: 'Bank Transfer', enabled: true, isDefault: false },
      { id: 5, name: 'Other', enabled: false, isDefault: false }
    ],

    // Dashboard Tab
    showSalesChart: true,
    showStockAlert: true,
    showRecentSales: true,
    showTopProducts: true,
    stockAlertQuantity: 10,

    // System Tab
    language: 'English',
    sessionTimeout: 30,
    autoLogout: false,

    // Prefixes Tab
    purchasePrefix: 'PUR-',
    purchaseReturnPrefix: 'PR-',
    salePrefix: 'INV-',
    saleReturnPrefix: 'SR-',
    expensePrefix: 'EXP-',
    stockAdjustmentPrefix: 'SA-',
    quotationPrefix: 'QUO-',
    salesOrderPrefix: 'SO-',
    purchaseOrderPrefix: 'PO-',

    // Email Tab
    emailHost: '',
    emailPort: '',
    emailUsername: '',
    emailPassword: '',
    emailEncryption: 'tls',
    emailFromAddress: '',
    emailFromName: '',

    // SMS Tab
    smsGateway: '',
    smsApiKey: '',
    smsSenderId: '',

    // Reward Points Tab
    enableRewardPoints: false,
    rewardPointsPerAmount: 1,
    amountForPoints: 100,
    minimumRedeemPoints: 100,
    rewardPointValue: 1,

    // Modules Tab
    enablePurchases: true,
    enableSales: true,
    enableExpenses: true,
    enableReports: true,
    enableStockAdjustment: true,
    enableCashRegister: true,
    enableAccounting: false,
    enableHRM: false,
    enableManufacturing: false,
  })

  // Load saved settings on mount
  useEffect(() => {
    if (business && Object.keys(business).length > 0) {
      setFormData(prev => ({
        ...prev,
        ...business
      }))
    }
  }, [business])

  const tabs = [
    { id: 'business', name: 'Business', icon: 'building' },
    { id: 'tax', name: 'Tax', icon: 'receipt' },
    { id: 'product', name: 'Product', icon: 'cube' },
    { id: 'contact', name: 'Contact', icon: 'users' },
    { id: 'sale', name: 'Sale', icon: 'cart' },
    { id: 'pos', name: 'POS', icon: 'desktop' },
    { id: 'purchases', name: 'Purchases', icon: 'truck' },
    { id: 'payment', name: 'Payment', icon: 'credit-card' },
    { id: 'dashboard', name: 'Dashboard', icon: 'chart' },
    { id: 'system', name: 'System', icon: 'cog' },
    { id: 'prefixes', name: 'Prefixes', icon: 'hash' },
    { id: 'email', name: 'Email Settings', icon: 'mail' },
    { id: 'sms', name: 'SMS Settings', icon: 'phone' },
    { id: 'rewards', name: 'Reward Points', icon: 'gift' },
    { id: 'modules', name: 'Modules', icon: 'grid' },
  ]

  const currencies = [
    { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
    { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal' },
  ]

  const timezones = [
    'Asia/Karachi',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Singapore',
    'Europe/London',
    'America/New_York',
    'America/Los_Angeles',
  ]

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dateFormats = [
    { value: 'dd/mm/yyyy', label: 'DD/MM/YYYY (31/01/2026)' },
    { value: 'mm/dd/yyyy', label: 'MM/DD/YYYY (01/31/2026)' },
    { value: 'yyyy-mm-dd', label: 'YYYY-MM-DD (2026-01-31)' },
    { value: 'dd-mm-yyyy', label: 'DD-MM-YYYY (31-01-2026)' },
  ]

  function handleChange(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  function handleCurrencyChange(code) {
    const currency = currencies.find(c => c.code === code)
    if (currency) {
      setFormData(prev => ({
        ...prev,
        currency: code,
        currencySymbol: currency.symbol
      }))
    }
  }

  function handlePaymentMethodToggle(id, field) {
    setFormData(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods.map(pm =>
        pm.id === id ? { ...pm, [field]: !pm[field] } : pm
      )
    }))
  }

  function showMessage(type, text) {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  function handleSave() {
    setSaving(true)
    
    // Save to AppContext
    dispatch({
      type: 'UPDATE_BUSINESS_SETTINGS',
      payload: formData
    })

    // Log activity
    dispatch({
      type: 'ADD_ACTIVITY_LOG',
      payload: {
        action: 'SETTINGS_UPDATED',
        module: 'Settings',
        description: `Updated ${activeTab} settings`,
        userName: state.currentUser?.name || 'Admin',
        userRole: state.currentUser?.role || 'Admin'
      }
    })

    setTimeout(() => {
      setSaving(false)
      showMessage('success', 'Settings saved successfully!')
    }, 500)
  }

  // Tab icon component
  const TabIcon = ({ icon }) => {
    const icons = {
      building: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
      receipt: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />,
      cube: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />,
      users: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />,
      cart: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />,
      desktop: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
      truck: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />,
      'credit-card': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />,
      chart: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
      cog: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />,
      hash: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />,
      mail: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
      phone: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />,
      gift: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />,
      grid: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />,
    }
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {icons[icon]}
      </svg>
    )
  }

  // Toggle component
  const Toggle = ({ enabled, onChange, label }) => (
    <label className="flex items-center gap-3 cursor-pointer">
      <div className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-emerald-500' : 'bg-slate-600'}`}>
        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${enabled ? 'translate-x-5' : ''}`} />
      </div>
      <span className="text-slate-300">{label}</span>
      <input type="checkbox" className="sr-only" checked={enabled} onChange={onChange} />
    </label>
  )

  // Input field component
  const InputField = ({ label, value, onChange, type = 'text', placeholder, hint, required }) => (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
      />
      {hint && <p className="text-slate-500 text-xs mt-1">{hint}</p>}
    </div>
  )

  // Select field component
  const SelectField = ({ label, value, onChange, options, hint }) => (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
      >
        {options.map(opt => (
          <option key={opt.value || opt} value={opt.value || opt}>
            {opt.label || opt}
          </option>
        ))}
      </select>
      {hint && <p className="text-slate-500 text-xs mt-1">{hint}</p>}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Business Settings</h1>
          <p className="text-slate-400 text-sm">Configure your business preferences</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-cyan-600 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save Settings
            </>
          )}
        </button>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border border-emerald-500/30' 
            : 'bg-red-500/10 border border-red-500/30'
        }`}>
          <svg className={`w-5 h-5 ${message.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={message.type === 'success' ? "M5 13l4 4L19 7" : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
          </svg>
          <p className={message.type === 'success' ? 'text-emerald-400' : 'text-red-400'}>{message.text}</p>
        </div>
      )}

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <div className="w-56 flex-shrink-0">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-2 sticky top-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-emerald-500 text-white'
                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <TabIcon icon={tab.icon} />
                <span className="text-sm font-medium">{tab.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          
          {/* Business Tab */}
          {activeTab === 'business' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white border-b border-slate-700 pb-3">Business Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InputField
                  label="Business Name"
                  value={formData.name}
                  onChange={(v) => handleChange('name', v)}
                  placeholder="My Business"
                  required
                />
                <InputField
                  label="Start Date"
                  type="date"
                  value={formData.startDate}
                  onChange={(v) => handleChange('startDate', v)}
                />
                <InputField
                  label="Default Profit Percent"
                  type="number"
                  value={formData.defaultProfitPercent}
                  onChange={(v) => handleChange('defaultProfitPercent', parseFloat(v) || 0)}
                  hint="Applied when adding new products"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => handleCurrencyChange(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  >
                    {currencies.map(c => (
                      <option key={c.code} value={c.code}>{c.symbol} - {c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>
                <SelectField
                  label="Currency Symbol Placement"
                  value={formData.currencyPlacement}
                  onChange={(v) => handleChange('currencyPlacement', v)}
                  options={[
                    { value: 'before', label: 'Before amount (Rs 100)' },
                    { value: 'after', label: 'After amount (100 Rs)' }
                  ]}
                />
                <SelectField
                  label="Timezone"
                  value={formData.timezone}
                  onChange={(v) => handleChange('timezone', v)}
                  options={timezones}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Upload Logo</label>
                <div className="flex items-center gap-4">
                  {formData.logo && (
                    <img src={formData.logo} alt="Logo" className="w-16 h-16 object-contain bg-white rounded-lg" />
                  )}
                  <label className="px-4 py-2 bg-emerald-500 text-white rounded-lg cursor-pointer hover:bg-emerald-600 transition-colors">
                    Browse...
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      const file = e.target.files[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onloadend = () => handleChange('logo', reader.result)
                        reader.readAsDataURL(file)
                      }
                    }} />
                  </label>
                  <span className="text-slate-500 text-sm">Previous logo (if exists) will be replaced</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SelectField
                  label="Financial Year Start Month"
                  value={formData.financialYearStart}
                  onChange={(v) => handleChange('financialYearStart', v)}
                  options={months}
                />
                <SelectField
                  label="Stock Accounting Method"
                  value={formData.stockAccountingMethod}
                  onChange={(v) => handleChange('stockAccountingMethod', v)}
                  options={[
                    { value: 'FIFO', label: 'FIFO (First In First Out)' },
                    { value: 'LIFO', label: 'LIFO (Last In First Out)' }
                  ]}
                />
                <InputField
                  label="Transaction Edit Days"
                  type="number"
                  value={formData.transactionEditDays}
                  onChange={(v) => handleChange('transactionEditDays', parseInt(v) || 0)}
                  hint="Days allowed to edit transactions"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SelectField
                  label="Date Format"
                  value={formData.dateFormat}
                  onChange={(v) => handleChange('dateFormat', v)}
                  options={dateFormats}
                />
                <SelectField
                  label="Time Format"
                  value={formData.timeFormat}
                  onChange={(v) => handleChange('timeFormat', v)}
                  options={[
                    { value: '12', label: '12 Hour' },
                    { value: '24', label: '24 Hour' }
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SelectField
                  label="Currency Precision"
                  value={formData.currencyPrecision}
                  onChange={(v) => handleChange('currencyPrecision', parseInt(v))}
                  options={[
                    { value: 0, label: '0 - No decimals (100)' },
                    { value: 1, label: '1 - One decimal (100.0)' },
                    { value: 2, label: '2 - Two decimals (100.00)' },
                    { value: 3, label: '3 - Three decimals (100.000)' }
                  ]}
                />
                <SelectField
                  label="Quantity Precision"
                  value={formData.quantityPrecision}
                  onChange={(v) => handleChange('quantityPrecision', parseInt(v))}
                  options={[
                    { value: 0, label: '0 - No decimals' },
                    { value: 1, label: '1 - One decimal' },
                    { value: 2, label: '2 - Two decimals' },
                    { value: 3, label: '3 - Three decimals' }
                  ]}
                />
              </div>
            </div>
          )}

          {/* Tax Tab */}
          {activeTab === 'tax' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white border-b border-slate-700 pb-3">Tax Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  label="Tax Number 1 Label"
                  value={formData.taxNumber1Label}
                  onChange={(v) => handleChange('taxNumber1Label', v)}
                  placeholder="e.g., GST, VAT, NTN"
                />
                <InputField
                  label="Tax Number 1"
                  value={formData.taxNumber1}
                  onChange={(v) => handleChange('taxNumber1', v)}
                  placeholder="Enter tax number"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  label="Tax Number 2 Label"
                  value={formData.taxNumber2Label}
                  onChange={(v) => handleChange('taxNumber2Label', v)}
                  placeholder="e.g., STRN"
                />
                <InputField
                  label="Tax Number 2"
                  value={formData.taxNumber2}
                  onChange={(v) => handleChange('taxNumber2', v)}
                  placeholder="Enter tax number"
                />
              </div>

              <div className="space-y-4 pt-4">
                <Toggle
                  enabled={formData.enableInlineTax}
                  onChange={() => handleChange('enableInlineTax', !formData.enableInlineTax)}
                  label="Enable inline tax in purchase and sell"
                />
                <Toggle
                  enabled={formData.enablePriceTax}
                  onChange={() => handleChange('enablePriceTax', !formData.enablePriceTax)}
                  label="Enable price with tax"
                />
              </div>
            </div>
          )}

          {/* Product Tab */}
          {activeTab === 'product' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white border-b border-slate-700 pb-3">Product Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  label="SKU Prefix"
                  value={formData.skuPrefix}
                  onChange={(v) => handleChange('skuPrefix', v)}
                  placeholder="e.g., SKU-"
                  hint="Prefix for auto-generated SKUs"
                />
                <SelectField
                  label="Default Selling Price Tax"
                  value={formData.defaultSellingPriceTax}
                  onChange={(v) => handleChange('defaultSellingPriceTax', v)}
                  options={[
                    { value: 'exclusive', label: 'Exclusive of tax' },
                    { value: 'inclusive', label: 'Inclusive of tax' }
                  ]}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
                <Toggle
                  enabled={formData.enableBrands}
                  onChange={() => handleChange('enableBrands', !formData.enableBrands)}
                  label="Enable Brands"
                />
                <Toggle
                  enabled={formData.enableCategories}
                  onChange={() => handleChange('enableCategories', !formData.enableCategories)}
                  label="Enable Categories"
                />
                <Toggle
                  enabled={formData.enableSubCategories}
                  onChange={() => handleChange('enableSubCategories', !formData.enableSubCategories)}
                  label="Enable Sub-Categories"
                />
                <Toggle
                  enabled={formData.enableUnits}
                  onChange={() => handleChange('enableUnits', !formData.enableUnits)}
                  label="Enable Units"
                />
                <Toggle
                  enabled={formData.enableWarranty}
                  onChange={() => handleChange('enableWarranty', !formData.enableWarranty)}
                  label="Enable Warranty"
                />
                <Toggle
                  enabled={formData.enableExpiryDate}
                  onChange={() => handleChange('enableExpiryDate', !formData.enableExpiryDate)}
                  label="Enable Expiry Date"
                />
                <Toggle
                  enabled={formData.enableRacks}
                  onChange={() => handleChange('enableRacks', !formData.enableRacks)}
                  label="Enable Rack/Shelf"
                />
              </div>
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white border-b border-slate-700 pb-3">Contact Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  label="Customer ID Prefix"
                  value={formData.customerPrefix}
                  onChange={(v) => handleChange('customerPrefix', v)}
                  placeholder="CUS"
                />
                <InputField
                  label="Supplier ID Prefix"
                  value={formData.supplierPrefix}
                  onChange={(v) => handleChange('supplierPrefix', v)}
                  placeholder="SUP"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  label="Default Credit Limit"
                  type="number"
                  value={formData.defaultCreditLimit}
                  onChange={(v) => handleChange('defaultCreditLimit', parseFloat(v) || 0)}
                  hint="Default credit limit for new customers"
                />
                <InputField
                  label="Default Payment Term (Days)"
                  type="number"
                  value={formData.defaultPaymentTerm}
                  onChange={(v) => handleChange('defaultPaymentTerm', v)}
                  placeholder="e.g., 30"
                />
              </div>
            </div>
          )}

          {/* Sale Tab */}
          {activeTab === 'sale' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white border-b border-slate-700 pb-3">Sale Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  label="Default Sale Discount (%)"
                  type="number"
                  value={formData.defaultSaleDiscount}
                  onChange={(v) => handleChange('defaultSaleDiscount', parseFloat(v) || 0)}
                />
                <SelectField
                  label="Sell Price Tax"
                  value={formData.sellPriceTax}
                  onChange={(v) => handleChange('sellPriceTax', v)}
                  options={[
                    { value: 'exclusive', label: 'Exclusive of tax' },
                    { value: 'inclusive', label: 'Inclusive of tax' }
                  ]}
                />
              </div>

              <SelectField
                label="Sales Item Add Method"
                value={formData.salesItemAddMethod}
                onChange={(v) => handleChange('salesItemAddMethod', v)}
                options={[
                  { value: 'dropdown', label: 'Dropdown' },
                  { value: 'modal', label: 'Pop-up Modal' }
                ]}
              />

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
                <Toggle
                  enabled={formData.enableSalesOrder}
                  onChange={() => handleChange('enableSalesOrder', !formData.enableSalesOrder)}
                  label="Enable Sales Order"
                />
                <Toggle
                  enabled={formData.enableDraftSales}
                  onChange={() => handleChange('enableDraftSales', !formData.enableDraftSales)}
                  label="Enable Draft Sales"
                />
                <Toggle
                  enabled={formData.enableQuotation}
                  onChange={() => handleChange('enableQuotation', !formData.enableQuotation)}
                  label="Enable Quotations"
                />
                <Toggle
                  enabled={formData.allowOverselling}
                  onChange={() => handleChange('allowOverselling', !formData.allowOverselling)}
                  label="Allow Overselling"
                />
              </div>
            </div>
          )}

          {/* POS Tab */}
          {activeTab === 'pos' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white border-b border-slate-700 pb-3">POS Settings</h2>
              
              <SelectField
                label="POS Layout"
                value={formData.posLayout}
                onChange={(v) => handleChange('posLayout', v)}
                options={[
                  { value: 'default', label: 'Default' },
                  { value: 'compact', label: 'Compact' },
                  { value: 'restaurant', label: 'Restaurant' }
                ]}
              />

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
                <Toggle
                  enabled={formData.showProductImage}
                  onChange={() => handleChange('showProductImage', !formData.showProductImage)}
                  label="Show Product Images"
                />
                <Toggle
                  enabled={formData.enableSuspendSale}
                  onChange={() => handleChange('enableSuspendSale', !formData.enableSuspendSale)}
                  label="Enable Suspend Sale"
                />
                <Toggle
                  enabled={formData.enableCashDenominations}
                  onChange={() => handleChange('enableCashDenominations', !formData.enableCashDenominations)}
                  label="Cash Denominations"
                />
                <Toggle
                  enabled={formData.posShortcuts}
                  onChange={() => handleChange('posShortcuts', !formData.posShortcuts)}
                  label="Keyboard Shortcuts"
                />
                <Toggle
                  enabled={formData.printReceiptOnSale}
                  onChange={() => handleChange('printReceiptOnSale', !formData.printReceiptOnSale)}
                  label="Print Receipt on Sale"
                />
                <Toggle
                  enabled={formData.enableWeightScale}
                  onChange={() => handleChange('enableWeightScale', !formData.enableWeightScale)}
                  label="Enable Weight Scale"
                />
              </div>
            </div>
          )}

          {/* Purchases Tab */}
          {activeTab === 'purchases' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white border-b border-slate-700 pb-3">Purchase Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SelectField
                  label="Purchase Price Tax"
                  value={formData.purchasePriceTax}
                  onChange={(v) => handleChange('purchasePriceTax', v)}
                  options={[
                    { value: 'exclusive', label: 'Exclusive of tax' },
                    { value: 'inclusive', label: 'Inclusive of tax' }
                  ]}
                />
                <SelectField
                  label="Default Purchase Status"
                  value={formData.defaultPurchaseStatus}
                  onChange={(v) => handleChange('defaultPurchaseStatus', v)}
                  options={[
                    { value: 'received', label: 'Received' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'ordered', label: 'Ordered' }
                  ]}
                />
              </div>

              <div className="pt-4">
                <Toggle
                  enabled={formData.enablePurchaseOrder}
                  onChange={() => handleChange('enablePurchaseOrder', !formData.enablePurchaseOrder)}
                  label="Enable Purchase Orders"
                />
              </div>
            </div>
          )}

          {/* Payment Tab */}
          {activeTab === 'payment' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white border-b border-slate-700 pb-3">Payment Methods</h2>
              
              <div className="space-y-3">
                {formData.paymentMethods.map(method => (
                  <div key={method.id} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <Toggle
                        enabled={method.enabled}
                        onChange={() => handlePaymentMethodToggle(method.id, 'enabled')}
                        label=""
                      />
                      <span className="text-white font-medium">{method.name}</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="defaultPayment"
                        checked={method.isDefault}
                        onChange={() => {
                          setFormData(prev => ({
                            ...prev,
                            paymentMethods: prev.paymentMethods.map(pm => ({
                              ...pm,
                              isDefault: pm.id === method.id
                            }))
                          }))
                        }}
                        className="text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="text-slate-400 text-sm">Default</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white border-b border-slate-700 pb-3">Dashboard Settings</h2>
              
              <InputField
                label="Stock Alert Quantity"
                type="number"
                value={formData.stockAlertQuantity}
                onChange={(v) => handleChange('stockAlertQuantity', parseInt(v) || 0)}
                hint="Show alert when stock falls below this quantity"
              />

              <div className="grid grid-cols-2 gap-4 pt-4">
                <Toggle
                  enabled={formData.showSalesChart}
                  onChange={() => handleChange('showSalesChart', !formData.showSalesChart)}
                  label="Show Sales Chart"
                />
                <Toggle
                  enabled={formData.showStockAlert}
                  onChange={() => handleChange('showStockAlert', !formData.showStockAlert)}
                  label="Show Stock Alerts"
                />
                <Toggle
                  enabled={formData.showRecentSales}
                  onChange={() => handleChange('showRecentSales', !formData.showRecentSales)}
                  label="Show Recent Sales"
                />
                <Toggle
                  enabled={formData.showTopProducts}
                  onChange={() => handleChange('showTopProducts', !formData.showTopProducts)}
                  label="Show Top Products"
                />
              </div>
            </div>
          )}

          {/* System Tab */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white border-b border-slate-700 pb-3">System Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SelectField
                  label="Language"
                  value={formData.language}
                  onChange={(v) => handleChange('language', v)}
                  options={['English', 'Urdu', 'Arabic', 'Hindi']}
                />
                <InputField
                  label="Session Timeout (minutes)"
                  type="number"
                  value={formData.sessionTimeout}
                  onChange={(v) => handleChange('sessionTimeout', parseInt(v) || 30)}
                />
              </div>

              <div className="pt-4">
                <Toggle
                  enabled={formData.autoLogout}
                  onChange={() => handleChange('autoLogout', !formData.autoLogout)}
                  label="Auto logout on inactivity"
                />
              </div>
            </div>
          )}

          {/* Prefixes Tab */}
          {activeTab === 'prefixes' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white border-b border-slate-700 pb-3">Transaction Prefixes</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InputField
                  label="Sale Invoice Prefix"
                  value={formData.salePrefix}
                  onChange={(v) => handleChange('salePrefix', v)}
                  placeholder="INV-"
                />
                <InputField
                  label="Sale Return Prefix"
                  value={formData.saleReturnPrefix}
                  onChange={(v) => handleChange('saleReturnPrefix', v)}
                  placeholder="SR-"
                />
                <InputField
                  label="Purchase Prefix"
                  value={formData.purchasePrefix}
                  onChange={(v) => handleChange('purchasePrefix', v)}
                  placeholder="PUR-"
                />
                <InputField
                  label="Purchase Return Prefix"
                  value={formData.purchaseReturnPrefix}
                  onChange={(v) => handleChange('purchaseReturnPrefix', v)}
                  placeholder="PR-"
                />
                <InputField
                  label="Expense Prefix"
                  value={formData.expensePrefix}
                  onChange={(v) => handleChange('expensePrefix', v)}
                  placeholder="EXP-"
                />
                <InputField
                  label="Stock Adjustment Prefix"
                  value={formData.stockAdjustmentPrefix}
                  onChange={(v) => handleChange('stockAdjustmentPrefix', v)}
                  placeholder="SA-"
                />
                <InputField
                  label="Quotation Prefix"
                  value={formData.quotationPrefix}
                  onChange={(v) => handleChange('quotationPrefix', v)}
                  placeholder="QUO-"
                />
                <InputField
                  label="Sales Order Prefix"
                  value={formData.salesOrderPrefix}
                  onChange={(v) => handleChange('salesOrderPrefix', v)}
                  placeholder="SO-"
                />
                <InputField
                  label="Purchase Order Prefix"
                  value={formData.purchaseOrderPrefix}
                  onChange={(v) => handleChange('purchaseOrderPrefix', v)}
                  placeholder="PO-"
                />
              </div>
            </div>
          )}

          {/* Email Tab */}
          {activeTab === 'email' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white border-b border-slate-700 pb-3">Email Settings (SMTP)</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  label="SMTP Host"
                  value={formData.emailHost}
                  onChange={(v) => handleChange('emailHost', v)}
                  placeholder="smtp.gmail.com"
                />
                <InputField
                  label="SMTP Port"
                  value={formData.emailPort}
                  onChange={(v) => handleChange('emailPort', v)}
                  placeholder="587"
                />
                <InputField
                  label="SMTP Username"
                  value={formData.emailUsername}
                  onChange={(v) => handleChange('emailUsername', v)}
                  placeholder="your@email.com"
                />
                <InputField
                  label="SMTP Password"
                  type="password"
                  value={formData.emailPassword}
                  onChange={(v) => handleChange('emailPassword', v)}
                  placeholder="••••••••"
                />
                <SelectField
                  label="Encryption"
                  value={formData.emailEncryption}
                  onChange={(v) => handleChange('emailEncryption', v)}
                  options={[
                    { value: 'tls', label: 'TLS' },
                    { value: 'ssl', label: 'SSL' },
                    { value: 'none', label: 'None' }
                  ]}
                />
                <InputField
                  label="From Email Address"
                  value={formData.emailFromAddress}
                  onChange={(v) => handleChange('emailFromAddress', v)}
                  placeholder="noreply@yourbusiness.com"
                />
                <InputField
                  label="From Name"
                  value={formData.emailFromName}
                  onChange={(v) => handleChange('emailFromName', v)}
                  placeholder="Your Business Name"
                />
              </div>
            </div>
          )}

          {/* SMS Tab */}
          {activeTab === 'sms' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white border-b border-slate-700 pb-3">SMS Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SelectField
                  label="SMS Gateway"
                  value={formData.smsGateway}
                  onChange={(v) => handleChange('smsGateway', v)}
                  options={[
                    { value: '', label: 'Select Gateway' },
                    { value: 'twilio', label: 'Twilio' },
                    { value: 'nexmo', label: 'Nexmo / Vonage' },
                    { value: 'custom', label: 'Custom API' }
                  ]}
                />
                <InputField
                  label="API Key"
                  value={formData.smsApiKey}
                  onChange={(v) => handleChange('smsApiKey', v)}
                  placeholder="Enter API key"
                />
                <InputField
                  label="Sender ID"
                  value={formData.smsSenderId}
                  onChange={(v) => handleChange('smsSenderId', v)}
                  placeholder="Your Business"
                />
              </div>
            </div>
          )}

          {/* Rewards Tab */}
          {activeTab === 'rewards' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white border-b border-slate-700 pb-3">Reward Points Settings</h2>
              
              <Toggle
                enabled={formData.enableRewardPoints}
                onChange={() => handleChange('enableRewardPoints', !formData.enableRewardPoints)}
                label="Enable Reward Points System"
              />

              {formData.enableRewardPoints && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <InputField
                    label="Points earned per amount"
                    type="number"
                    value={formData.rewardPointsPerAmount}
                    onChange={(v) => handleChange('rewardPointsPerAmount', parseInt(v) || 1)}
                    hint="Number of points earned"
                  />
                  <InputField
                    label="Amount for points"
                    type="number"
                    value={formData.amountForPoints}
                    onChange={(v) => handleChange('amountForPoints', parseInt(v) || 100)}
                    hint="Spend this amount to earn points"
                  />
                  <InputField
                    label="Minimum points to redeem"
                    type="number"
                    value={formData.minimumRedeemPoints}
                    onChange={(v) => handleChange('minimumRedeemPoints', parseInt(v) || 100)}
                  />
                  <InputField
                    label="Point value (in currency)"
                    type="number"
                    value={formData.rewardPointValue}
                    onChange={(v) => handleChange('rewardPointValue', parseFloat(v) || 1)}
                    hint="1 point = this much currency"
                  />
                </div>
              )}
            </div>
          )}

          {/* Modules Tab */}
          {activeTab === 'modules' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white border-b border-slate-700 pb-3">Enable/Disable Modules</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Toggle
                  enabled={formData.enablePurchases}
                  onChange={() => handleChange('enablePurchases', !formData.enablePurchases)}
                  label="Purchases"
                />
                <Toggle
                  enabled={formData.enableSales}
                  onChange={() => handleChange('enableSales', !formData.enableSales)}
                  label="Sales"
                />
                <Toggle
                  enabled={formData.enableExpenses}
                  onChange={() => handleChange('enableExpenses', !formData.enableExpenses)}
                  label="Expenses"
                />
                <Toggle
                  enabled={formData.enableReports}
                  onChange={() => handleChange('enableReports', !formData.enableReports)}
                  label="Reports"
                />
                <Toggle
                  enabled={formData.enableStockAdjustment}
                  onChange={() => handleChange('enableStockAdjustment', !formData.enableStockAdjustment)}
                  label="Stock Adjustment"
                />
                <Toggle
                  enabled={formData.enableCashRegister}
                  onChange={() => handleChange('enableCashRegister', !formData.enableCashRegister)}
                  label="Cash Register"
                />
                <Toggle
                  enabled={formData.enableAccounting}
                  onChange={() => handleChange('enableAccounting', !formData.enableAccounting)}
                  label="Accounting"
                />
                <Toggle
                  enabled={formData.enableHRM}
                  onChange={() => handleChange('enableHRM', !formData.enableHRM)}
                  label="HRM"
                />
                <Toggle
                  enabled={formData.enableManufacturing}
                  onChange={() => handleChange('enableManufacturing', !formData.enableManufacturing)}
                  label="Manufacturing"
                />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}