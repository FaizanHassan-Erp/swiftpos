import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './Context/AuthContext'
import { AppProvider } from './Context/AppContext'
import Layout from './Components/Layout'
import { useState } from 'react'

// Page Imports
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Roles from './pages/Roles'
import SalesAgents from './pages/SalesAgents'
import Suppliers from './pages/Suppliers'
import Customers from './pages/Customers'
import Products from './pages/Products'
import Units from './pages/Units'
import Categories from './pages/Categories'
import Brands from './pages/Brands'
import Warranties from './pages/Warranties'
import Purchases from './pages/Purchases'
import PurchaseReturns from './pages/PurchaseReturns'
import Sales from './pages/Sales'
import POS from './pages/POS'
import Salesorder from './pages/Salesorder'
import Addsale from './pages/Addsale'
import Salereturns from './pages/Salereturns'
import Stockadjustment from './pages/Stockadjustment'
import CashRegister from './pages/Cashregister'
import Expenses from './pages/Expenses'
import Paymentaccounts from './pages/Paymentaccounts'
import ProfitLossReport from './pages/Profitlossreport'
import ExpenseReport from './pages/Expensereport'
import SellPaymentReport from './pages/Sellpaymentreport'
import PurchasePaymentReport from './pages/Purchasepaymentreport'
import Stockreport from './pages/Stockreport'
import Stockexpiryreport from './pages/Stockexpiryreport'
import Trendingproductsreport from './pages/Trendingproductsreport'
import Taxreport from './pages/Taxreport'
import Productsellreport from './pages/Productsellreport'
import Productpurchasereport from './pages/Productpurchasereport'
import Suppliercustomerreport from './pages/Suppliercustomerreport'
import Stockadjustmentreport from './pages/Stockadjustmentreport'
import Registerreport from './pages/Registerreport'
import Activitylogreport from './pages/Activitylogreport'
import Settings from './pages/Settings'
import TaxRates from './pages/TaxRates'
import InvoiceSettings from './pages/InvoiceSettings'
import BusinessLocations from './pages/BusinessLocations'
import BarcodeSettings from './pages/BarcodeSettings'
import ReceiptPrinters from './pages/ReceiptPrinters'

// ============== PLACEHOLDER PAGE ==============
function PlaceholderPage({ title }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-slate-400">This module will be built next!</p>
      </div>
    </div>
  )
}

// ============== LOADING SPINNER ==============
function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400">Loading...</p>
      </div>
    </div>
  )
}

// ============== PROTECTED ROUTE ==============
function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth()

  if (loading) return <LoadingSpinner />
  if (!currentUser) return <Navigate to="/login" replace />

  return (
    <AppProvider>
      <Layout>{children}</Layout>
    </AppProvider>
  )
}

// ============== PUBLIC ROUTE ==============
function PublicRoute({ children }) {
  const { currentUser, loading } = useAuth()

  if (loading) return <LoadingSpinner />
  if (currentUser) return <Navigate to="/dashboard" replace />

  return children
}

// ============== MAIN APP ==============
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />

          {/* Dashboard */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

          {/* User Management */}
          <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
          <Route path="/roles" element={<ProtectedRoute><Roles /></ProtectedRoute>} />
          <Route path="/sales-agents" element={<ProtectedRoute><SalesAgents /></ProtectedRoute>} />

          {/* Contacts */}
          <Route path="/suppliers" element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />

          {/* Products */}
          <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
          <Route path="/add-product" element={<ProtectedRoute><Products /></ProtectedRoute>} />
          <Route path="/units" element={<ProtectedRoute><Units /></ProtectedRoute>} />
          <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
          <Route path="/brands" element={<ProtectedRoute><Brands /></ProtectedRoute>} />
          <Route path="/warranties" element={<ProtectedRoute><Warranties /></ProtectedRoute>} />

          {/* Purchases */}
          <Route path="/purchases" element={<ProtectedRoute><Purchases /></ProtectedRoute>} />
          <Route path="/add-purchase" element={<ProtectedRoute><Purchases /></ProtectedRoute>} />
          <Route path="/purchase-returns" element={<ProtectedRoute><PurchaseReturns /></ProtectedRoute>} />

          {/* Sales */}
          <Route path="/sales" element={<ProtectedRoute><Sales /></ProtectedRoute>} />
          <Route path="/add-sale" element={<ProtectedRoute><Addsale /></ProtectedRoute>} />
          <Route path="/pos" element={<ProtectedRoute><POS /></ProtectedRoute>} />
          <Route path="/sales-order" element={<ProtectedRoute><Salesorder /></ProtectedRoute>} />
          <Route path="/sale-returns" element={<ProtectedRoute><Salereturns /></ProtectedRoute>} />

          {/* Stock Adjustment */}
          <Route path="/stock-adjustment" element={<ProtectedRoute><Stockadjustment /></ProtectedRoute>} />

          {/* Cash Register */}
          <Route path="/cash-register" element={<ProtectedRoute><CashRegister /></ProtectedRoute>} />

          {/* Expenses */}
          <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
          <Route path="/add-expense" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />

          {/* Payment Accounts */}
          <Route path="/list-accounts" element={<ProtectedRoute><Paymentaccounts initialTab="accounts" /></ProtectedRoute>} />
          <Route path="/balance-sheet" element={<ProtectedRoute><Paymentaccounts initialTab="balance-sheet" /></ProtectedRoute>} />
          <Route path="/trial-balance" element={<ProtectedRoute><Paymentaccounts initialTab="trial-balance" /></ProtectedRoute>} />
          <Route path="/cash-flow" element={<ProtectedRoute><Paymentaccounts initialTab="cash-flow" /></ProtectedRoute>} />
          <Route path="/payment-account-report" element={<ProtectedRoute><Paymentaccounts initialTab="payment-report" /></ProtectedRoute>} />

          {/* Reports */}
          <Route path="/trending-products-report" element={<ProtectedRoute><Trendingproductsreport /></ProtectedRoute>} />
          <Route path="/stock-report" element={<ProtectedRoute><Stockreport /></ProtectedRoute>} />
          <Route path="/stock-expiry-report" element={<ProtectedRoute><Stockexpiryreport /></ProtectedRoute>} />
          <Route path="/stock-adjustment-report" element={<ProtectedRoute><Stockadjustmentreport /></ProtectedRoute>} />
          <Route path="/register-report" element={<ProtectedRoute><Registerreport /></ProtectedRoute>} />
          <Route path="/activity-log-report" element={<ProtectedRoute><Activitylogreport /></ProtectedRoute>} />
          <Route path="/tax-report" element={<ProtectedRoute><Taxreport /></ProtectedRoute>} />
          <Route path="/product-sell-report" element={<ProtectedRoute><Productsellreport /></ProtectedRoute>} />
          <Route path="/product-purchase-report" element={<ProtectedRoute><Productpurchasereport /></ProtectedRoute>} />
          <Route path="/supplier-customer-report" element={<ProtectedRoute><Suppliercustomerreport /></ProtectedRoute>} />
          <Route path="/profit-loss-report" element={<ProtectedRoute><ProfitLossReport /></ProtectedRoute>} />
          <Route path="/expense-report" element={<ProtectedRoute><ExpenseReport /></ProtectedRoute>} />
          <Route path="/sell-payment-report" element={<ProtectedRoute><SellPaymentReport /></ProtectedRoute>} />
          <Route path="/purchase-payment-report" element={<ProtectedRoute><PurchasePaymentReport /></ProtectedRoute>} />

          {/* Other */}
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/tax-rates" element={<ProtectedRoute><TaxRates /></ProtectedRoute>} />
          <Route path="/invoice-settings" element={<ProtectedRoute><InvoiceSettings /></ProtectedRoute>} />
          <Route path="/business-locations" element={<ProtectedRoute><BusinessLocations /></ProtectedRoute>} />
          <Route path="/barcode-settings" element={<ProtectedRoute><BarcodeSettings /></ProtectedRoute>} />
          <Route path="/receipt-printers" element={<ProtectedRoute><ReceiptPrinters /></ProtectedRoute>} />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

// ============== LANDING PAGE ==============
function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white">SwiftPOS</span>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-300 hover:text-white transition-colors">Features</a>
              <a href="#modules" className="text-slate-300 hover:text-white transition-colors">Modules</a>
              <a href="#pricing" className="text-slate-300 hover:text-white transition-colors">Pricing</a>
              <a href="#contact" className="text-slate-300 hover:text-white transition-colors">Contact</a>
            </nav>

            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/login')} className="px-4 py-2 text-slate-300 hover:text-white transition-colors">
                Sign In
              </button>
              <button onClick={() => navigate('/register')} className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-lg shadow-emerald-500/25">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm mb-6">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                #1 POS Solution in Pakistan
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                Manage Your Business
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                  Smarter & Faster
                </span>
              </h1>
              <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                A powerful, all-in-one Point of Sale system designed to streamline your operations. 
                Manage inventory, sales, purchases, customers, and employees - all from one platform.
              </p>
              <div className="flex flex-wrap gap-4">
                <button onClick={() => navigate('/register')} className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-xl shadow-emerald-500/25 flex items-center gap-2">
                  Start Free Trial
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
                <button className="px-8 py-4 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-700 transition-all border border-slate-700 flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  Watch Demo
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-slate-700/50">
                <div>
                  <div className="text-3xl font-bold text-white">500+</div>
                  <div className="text-slate-400 text-sm">Active Businesses</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">50K+</div>
                  <div className="text-slate-400 text-sm">Daily Transactions</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">99.9%</div>
                  <div className="text-slate-400 text-sm">Uptime</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-3xl blur-3xl"></div>
              <div className="relative bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-4 shadow-2xl">
                <div className="bg-slate-900 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="text-slate-500 text-sm">Dashboard Preview</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                      <div className="text-emerald-400 text-sm mb-1">Today's Sales</div>
                      <div className="text-2xl font-bold text-white">₨ 125,430</div>
                      <div className="text-emerald-400 text-xs mt-1">↑ 12% from yesterday</div>
                    </div>
                    <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border border-cyan-500/20 rounded-xl p-4">
                      <div className="text-cyan-400 text-sm mb-1">Total Orders</div>
                      <div className="text-2xl font-bold text-white">48</div>
                      <div className="text-cyan-400 text-xs mt-1">↑ 8 new orders</div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-800/50 rounded-xl p-4">
                    <div className="text-slate-400 text-sm mb-3">Recent Sales</div>
                    <div className="space-y-3">
                      {[1,2,3].map(i => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-700 rounded-lg"></div>
                            <div className="h-3 w-24 bg-slate-700 rounded"></div>
                          </div>
                          <div className="h-3 w-16 bg-emerald-500/30 rounded"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Everything You Need to Run Your Business</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Powerful features designed to help you manage every aspect of your business efficiently.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: "📦", title: "Inventory Management", desc: "Real-time stock tracking, low stock alerts, and automatic updates on every transaction." },
              { icon: "🛒", title: "Point of Sale", desc: "Fast, intuitive billing interface with barcode scanning and multiple payment methods." },
              { icon: "📊", title: "Sales Analytics", desc: "Detailed reports on sales, profits, trends, and business performance." },
              { icon: "👥", title: "Customer Management", desc: "Track customer purchases, manage credit, and build loyalty programs." },
              { icon: "🏪", title: "Multi-Branch", desc: "Manage multiple store locations from a single dashboard." },
              { icon: "📱", title: "Cloud-Based", desc: "Access your business data from anywhere, anytime on any device." },
            ].map((feature, i) => (
              <div key={i} className="group bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800 hover:border-emerald-500/30 transition-all">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section id="modules" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Complete Business Modules</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">All the tools you need, integrated seamlessly.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {["Products", "Purchases", "Sales", "POS", "Inventory", "Suppliers", "Customers", "Expenses", "Reports", "Accounts", "HRM", "Settings"].map((module, i) => (
              <div key={i} className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 text-center hover:bg-slate-800/50 hover:border-emerald-500/30 transition-all cursor-pointer">
                <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center">
                  <span className="text-emerald-400 text-lg font-bold">{module[0]}</span>
                </div>
                <div className="text-white font-medium">{module}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-3xl p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Transform Your Business?</h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">Join hundreds of businesses already using SwiftPOS to streamline their operations.</p>
            <button onClick={() => navigate('/register')} className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-xl shadow-emerald-500/25">
              Start Your Free 14-Day Trial
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-white font-semibold">SwiftPOS</span>
            </div>
            <div className="text-slate-500 text-sm">© 2026 SwiftPOS. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ============== LOGIN PAGE ==============
function LoginPage() {
  const navigate = useNavigate()
  const { login, resendVerificationEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [needsVerification, setNeedsVerification] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) { setError('Email is required'); return }
    if (!password) { setError('Password is required'); return }

    setLoading(true)
    setError('')
    setMessage('')

    const result = await login(email, password)
    if (!result.success) {
      setError(result.message)
      if (result.needsVerification) setNeedsVerification(true)
    }
    setLoading(false)
  }

  async function handleResendVerification() {
    setLoading(true)
    setError('')
    const result = await resendVerificationEmail(email, password)
    if (result.success) setMessage(result.message)
    else setError(result.message)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-slate-400 mt-2">Sign in to your account</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8">
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                {error}
                {needsVerification && (
                  <button onClick={handleResendVerification} className="block mt-2 text-emerald-400 hover:underline">Resend verification email</button>
                )}
              </div>
            </div>
          )}

          {message && (
            <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors pr-12"
                  placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-slate-400 text-sm">
                <input type="checkbox" className="rounded bg-slate-700 border-slate-600 text-emerald-500 focus:ring-emerald-500" />
                Remember me
              </label>
              <button type="button" onClick={() => navigate('/forgot-password')} className="text-emerald-400 text-sm hover:underline">Forgot password?</button>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading ? (<><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Signing in...</>) : ('Sign In')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-slate-400">Don't have an account? </span>
            <button onClick={() => navigate('/register')} className="text-emerald-400 hover:underline">Sign up</button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button onClick={() => navigate('/')} className="text-slate-500 hover:text-slate-300 text-sm">← Back to Home</button>
        </div>
      </div>
    </div>
  )
}

// ============== REGISTER PAGE ==============
function RegisterPage() {
  const navigate = useNavigate()
  const { signup } = useAuth()
  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  function getPasswordStrength(pass) {
    let strength = 0
    if (pass.length >= 6) strength++
    if (pass.length >= 8) strength++
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) strength++
    if (/\d/.test(pass)) strength++
    if (/[^a-zA-Z0-9]/.test(pass)) strength++
    return strength
  }

  const passwordStrength = getPasswordStrength(password)
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-emerald-500']
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    
    if (!businessName || businessName.trim() === '') { setError('Business name is required'); return }
    if (!email || email.trim() === '') { setError('Email is required'); return }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) { setError('Please enter a valid email address'); return }
    if (!password) { setError('Password is required'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (!confirmPassword) { setError('Please confirm your password'); return }
    if (password !== confirmPassword) { setError('Passwords do not match'); return }

    setLoading(true)
    try {
      const result = await signup(email.trim(), password, businessName.trim())
      if (result.success) {
        setMessage(result.message)
        setBusinessName(''); setEmail(''); setPassword(''); setConfirmPassword('')
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-slate-400 mt-2">Start your 14-day free trial</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8">
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm">
              <div className="flex items-center gap-3 mb-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{message}</span>
              </div>
              <p className="text-emerald-300 text-xs mt-2">Check your email inbox and spam folder!</p>
              <button onClick={() => navigate('/login')} className="mt-3 text-emerald-300 hover:underline text-sm font-medium">→ Go to Sign In</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Business Name <span className="text-red-400">*</span></label>
              <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="Your Business Name" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email Address <span className="text-red-400">*</span></label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="you@example.com" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password <span className="text-red-400">*</span></label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors pr-12"
                  placeholder="Min 6 characters" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[0, 1, 2, 3, 4].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-slate-700'}`} />
                    ))}
                  </div>
                  <p className={`text-xs ${passwordStrength > 2 ? 'text-emerald-400' : 'text-slate-400'}`}>
                    Password strength: {strengthLabels[passwordStrength - 1] || 'Too weak'}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password <span className="text-red-400">*</span></label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-3 bg-slate-900/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none transition-colors ${
                  confirmPassword && confirmPassword !== password ? 'border-red-500' : confirmPassword && confirmPassword === password ? 'border-emerald-500' : 'border-slate-700 focus:border-emerald-500'
                }`}
                placeholder="Re-enter password" />
              {confirmPassword && confirmPassword !== password && <p className="text-red-400 text-xs mt-1">Passwords do not match</p>}
              {confirmPassword && confirmPassword === password && <p className="text-emerald-400 text-xs mt-1">✓ Passwords match</p>}
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading ? (<><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Creating Account...</>) : ('Create Account')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-slate-400">Already have an account? </span>
            <button onClick={() => navigate('/login')} className="text-emerald-400 hover:underline">Sign in</button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button onClick={() => navigate('/')} className="text-slate-500 hover:text-slate-300 text-sm">← Back to Home</button>
        </div>
      </div>
    </div>
  )
}

// ============== FORGOT PASSWORD PAGE ==============
function ForgotPasswordPage() {
  const navigate = useNavigate()
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) { setError('Email is required'); return }

    setLoading(true)
    setError('')
    setMessage('')

    const result = await resetPassword(email)
    if (result.success) setMessage(result.message)
    else setError(result.message)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Reset Password</h1>
          <p className="text-slate-400 mt-2">Enter your email to receive a reset link</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8">
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm">
              <div className="flex items-center gap-3 mb-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {message}
              </div>
              <button onClick={() => navigate('/login')} className="text-emerald-300 hover:underline text-sm">→ Back to Sign In</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="you@example.com" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading ? (<><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Sending...</>) : ('Send Reset Link')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={() => navigate('/login')} className="text-emerald-400 hover:underline">← Back to Sign In</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App