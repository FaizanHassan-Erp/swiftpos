import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import OfflineIndicator from './OfflineIndicator'

export default function Layout({ children }) {
  const { state, dispatch } = useApp()
  const { currentUser, userData, logout, userName, userRole } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { sidebarCollapsed, business } = state
  
  // Get current page from URL
  const currentPage = location.pathname.replace('/', '') || 'dashboard'
  
  const [expandedMenus, setExpandedMenus] = useState(['user-management', 'products', 'purchases', 'settings'])

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: 'home' },
    { 
      id: 'user-management', 
      name: 'User Management', 
      icon: 'user-cog',
      children: [
        { id: 'users', name: 'Users' },
        { id: 'roles', name: 'Roles' },
        { id: 'sales-agents', name: 'Sales Commission Agents' }
      ]
    },
    { 
      id: 'contacts', 
      name: 'Contacts', 
      icon: 'users',
      children: [
        { id: 'suppliers', name: 'Suppliers' },
        { id: 'customers', name: 'Customers' }
      ]
    },
    { 
      id: 'products', 
      name: 'Products', 
      icon: 'package',
      children: [
        { id: 'products', name: 'List Products' },
        { id: 'add-product', name: 'Add Product' },
        { id: 'units', name: 'Units' },
        { id: 'categories', name: 'Categories' },
        { id: 'brands', name: 'Brands' },
        { id: 'warranties', name: 'Warranties' }
      ]
    },
    { 
      id: 'purchases', 
      name: 'Purchases', 
      icon: 'shopping-cart',
      children: [
        { id: 'purchases', name: 'List Purchases' },
        { id: 'add-purchase', name: 'Add Purchase' },
        { id: 'purchase-returns', name: 'Purchase Returns' }
      ]
    },
    { 
      id: 'sales', 
      name: 'Sell', 
      icon: 'receipt',
      children: [
        { id: 'sales', name: 'All Sales' },
        { id: 'add-sale', name: 'Add Sale' },
        { id: 'pos', name: 'POS' },
        { id: 'sale-returns', name: 'Sale Returns' }
      ]
    },
    { id: 'stock-adjustment', name: 'Stock Adjustment', icon: 'clipboard' },
    { id: 'cash-register', name: 'Cash Register', icon: 'cash' },
    { 
      id: 'expenses', 
      name: 'Expenses', 
      icon: 'wallet',
      children: [
        { id: 'expenses', name: 'List Expenses' },
        { id: 'add-expense', name: 'Add Expense' }
      ]
    },
    { 
      id: 'payment-accounts', 
      name: 'Payment Accounts', 
      icon: 'bank',
      children: [
        { id: 'list-accounts', name: 'List Accounts' },
        { id: 'balance-sheet', name: 'Balance Sheet' },
        { id: 'trial-balance', name: 'Trial Balance' },
        { id: 'cash-flow', name: 'Cash Flow' },
        { id: 'payment-account-report', name: 'Payment Account Report' }
      ]
    },
    { 
      id: 'reports', 
      name: 'Reports', 
      icon: 'chart',
      children: [
        { id: 'trending-products-report', name: 'Trending Products' },
        { id: 'stock-report', name: 'Stock Report' },
        { id: 'stock-expiry-report', name: 'Stock Expiry Report' },
        { id: 'stock-adjustment-report', name: 'Stock Adjustment Report' },
        { id: 'register-report', name: 'Register Report' },
        { id: 'activity-log-report', name: 'Activity Log Report' },
        { id: 'tax-report', name: 'Tax Report' },
        { id: 'product-sell-report', name: 'Product Sell Report' },
        { id: 'product-purchase-report', name: 'Product Purchase Report' },
        { id: 'supplier-customer-report', name: 'Supplier & Customer' },
        { id: 'profit-loss-report', name: 'Profit/Loss Report' },
        { id: 'expense-report', name: 'Expense Report' },
        { id: 'sell-payment-report', name: 'Sell Payment Report' },
        { id: 'purchase-payment-report', name: 'Purchase Payment Report' }
      ]
    },
    { 
      id: 'settings', 
      name: 'Settings', 
      icon: 'settings',
      children: [
        { id: 'settings', name: 'Business Settings' },
        { id: 'tax-rates', name: 'Tax Rates' },
        { id: 'invoice-settings', name: 'Invoice Settings' },
        { id: 'business-locations', name: 'Business Locations' },
        { id: 'barcode-settings', name: 'Barcode Settings' },
        { id: 'receipt-printers', name: 'Receipt Printers' }
      ]
    }
  ]

  const icons = {
    home: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    'user-cog': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    users: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    package: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
    'shopping-cart': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
    receipt: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
    clipboard: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
    cash: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
    wallet: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
    bank: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>,
    chart: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    settings: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  }

  function toggleMenu(menuId) {
    setExpandedMenus(prev => prev.includes(menuId) ? prev.filter(id => id !== menuId) : [...prev, menuId])
  }

  // Auto-expand parent menu
  useEffect(() => {
    menuItems.forEach(item => {
      if (item.children) {
        const isChildActive = item.children.some(c => c.id === currentPage)
        if (isChildActive && !expandedMenus.includes(item.id)) {
          setExpandedMenus(prev => [...prev, item.id])
        }
      }
    })
  }, [currentPage])

  const navigateTo = (pageId) => navigate(`/${pageId}`)

  const handleLogout = async () => {
    // Log activity using user info
    if (userData || currentUser) {
      dispatch({
        type: 'ADD_ACTIVITY_LOG',
        payload: {
          action: 'LOGOUT',
          module: 'Authentication',
          description: `${userName} logged out`,
          userId: currentUser?.uid,
          userName: userName,
          userRole: userRole
        }
      })
    }
    
    await logout()
    navigate('/login')
  }

  const MenuItem = ({ item }) => {
    const isChildActive = item.children?.some(c => c.id === currentPage)
    const isExpanded = expandedMenus.includes(item.id)
    const hasChildren = item.children && item.children.length > 0
    const isActive = currentPage === item.id || isChildActive

    return (
      <div>
        <button
          onClick={() => hasChildren ? toggleMenu(item.id) : navigateTo(item.id)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive ? 'bg-emerald-500/10 text-emerald-500' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
          {icons[item.icon]}
          {!sidebarCollapsed && (
            <>
              <span className="flex-1 text-left text-sm font-medium">{item.name}</span>
              {hasChildren && (
                <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </>
          )}
        </button>
        {hasChildren && isExpanded && !sidebarCollapsed && (
          <div className="ml-8 mt-1 space-y-1">
            {item.children.map((child, index) => (
              <button
                key={`${child.id}-${index}`}
                onClick={() => navigateTo(child.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${currentPage === child.id ? 'bg-emerald-500/10 text-emerald-500' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                {child.name}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  const todaySales = (state.sales || []).filter(s => new Date(s.date).toDateString() === new Date().toDateString()).reduce((sum, s) => sum + (s.total || 0), 0)
  const lowStockCount = (state.products || []).filter(p => p.currentStock <= p.alertQuantity).length

  return (
    <>
      <div className="min-h-screen bg-slate-900 flex">
        {/* Sidebar */}
        <aside className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-slate-950 border-r border-slate-800 flex flex-col transition-all duration-300`}>
          <div className="h-16 flex items-center justify-center border-b border-slate-800 px-4">
            {sidebarCollapsed ? (
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold">S</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-white font-bold">SwiftPOS</div>
                  <div className="text-emerald-400 text-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                    Online
                  </div>
                </div>
              </div>
            )}
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {menuItems.map((item, index) => (
              <MenuItem key={`${item.id}-${index}`} item={item} />
            ))}
          </nav>

          <button onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })} className="h-12 border-t border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <svg className={`w-5 h-5 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <header className="h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              {/* Home Button */}
              <button onClick={() => navigate('/')} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" title="Home">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>
              {/* Back Button */}
              <button onClick={() => navigate('/')} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" title="Back to Home">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-white font-semibold capitalize">{currentPage.replace(/-/g, ' ')}</h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-6 mr-4">
                <div className="text-right">
                  <div className="text-slate-400 text-xs">Today's Sales</div>
                  <div className="text-emerald-400 font-semibold">{business?.currencySymbol || 'Rs'} {todaySales.toLocaleString()}</div>
                </div>
                {lowStockCount > 0 && (
                  <div className="text-right">
                    <div className="text-slate-400 text-xs">Low Stock Alert</div>
                    <div className="text-red-400 font-semibold">{lowStockCount} items</div>
                  </div>
                )}
              </div>

              <button onClick={() => navigateTo('pos')} className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-cyan-600 transition-all flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                POS
              </button>

              <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <div className="relative group">
                <div className="flex items-center gap-3 pl-4 border-l border-slate-800 cursor-pointer">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                    userData?.isOwner 
                      ? 'bg-gradient-to-br from-amber-400 to-orange-500' 
                      : 'bg-gradient-to-br from-emerald-400 to-cyan-500'
                  }`}>
                    <span className="text-white font-semibold text-sm">
                      {(business?.name || 'S').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden md:block">
                    <div className="text-white text-sm font-medium">{business?.name || 'SwiftPOS'}</div>
                    <div className="text-slate-400 text-xs">{userName} • {userRole}</div>
                  </div>
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                
                <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <div className="p-2">
                    <button onClick={() => navigateTo('settings')} className="w-full flex items-center gap-3 px-3 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Settings
                    </button>
                    <hr className="my-2 border-slate-700" />
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-slate-700 rounded-lg transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6 overflow-auto bg-slate-900">
            {children}
          </main>
        </div>
      </div>
      
      {/* Offline Indicator */}
      <OfflineIndicator />
    </>
  )
}