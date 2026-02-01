import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function Dashboard() {
  const { state } = useApp()
  const { business, products, sales, purchases, expenses, customers } = state
  const navigate = useNavigate()

  // Get business name from settings
  const businessName = business?.name || 'Your Business'

  // Calculate Stats - with null safety and correct field names
  const totalSales = (sales || []).reduce((sum, s) => sum + (parseFloat(s.total) || parseFloat(s.totalAmount) || parseFloat(s.grandTotal) || 0), 0)
  const totalPurchases = (purchases || []).reduce((sum, p) => sum + (parseFloat(p.total) || parseFloat(p.totalAmount) || parseFloat(p.grandTotal) || 0), 0)
  
  // FIX: expenses use 'totalAmount' not 'amount'
  const totalExpenses = (expenses || []).reduce((sum, e) => sum + (parseFloat(e.totalAmount) || parseFloat(e.amount) || 0), 0)
  
  const netProfit = totalSales - totalPurchases - totalExpenses

  const salesDue = (sales || []).reduce((sum, s) => {
    const total = parseFloat(s.total) || parseFloat(s.totalAmount) || parseFloat(s.grandTotal) || 0
    const paid = parseFloat(s.amountPaid) || 0
    return sum + (total - paid)
  }, 0)
  
  const purchaseDue = (purchases || []).reduce((sum, p) => {
    const total = parseFloat(p.total) || parseFloat(p.totalAmount) || parseFloat(p.grandTotal) || 0
    const paid = parseFloat(p.amountPaid) || 0
    return sum + (total - paid)
  }, 0)

  const lowStockProducts = (products || []).filter(p => {
    const currentStock = parseFloat(p.currentStock) || parseFloat(p.quantity) || 0
    const alertQty = parseFloat(p.alertQuantity) || parseFloat(p.lowStockAlert) || 5
    return currentStock <= alertQty
  })
  
  const totalStockValue = (products || []).reduce((sum, p) => {
    const stock = parseFloat(p.currentStock) || parseFloat(p.quantity) || 0
    const cost = parseFloat(p.costPrice) || parseFloat(p.purchasePrice) || 0
    return sum + (stock * cost)
  }, 0)

  const StatCard = ({ title, value, icon, color, subtext }) => (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          {subtext && <p className="text-slate-500 text-xs mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color.replace('text-', 'bg-').replace('-400', '-500')}/10`}>
          {icon}
        </div>
      </div>
    </div>
  )

  // Quick action buttons configuration with correct routes
  const quickActions = [
    { name: 'New Sale', path: '/pos', color: 'emerald' },
    { name: 'Add Purchase', path: '/add-purchase', color: 'blue' },
    { name: 'Add Product', path: '/add-product', color: 'purple' },
    { name: 'Add Expense', path: '/add-expense', color: 'red' },
    { name: 'Suppliers', path: '/suppliers', color: 'cyan' },
    { name: 'Reports', path: '/profit-loss', color: 'amber' }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Banner with Business Name */}
      <div className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white">Welcome to {businessName}! 👋</h2>
        <p className="text-slate-300 mt-1">Here's what's happening with your business today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Sales"
          value={`${business?.currencySymbol || 'Rs'} ${totalSales.toLocaleString()}`}
          color="text-emerald-400"
          icon={<svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          subtext={`${(sales || []).length} transactions`}
        />
        <StatCard
          title="Net Profit"
          value={`${business?.currencySymbol || 'Rs'} ${netProfit.toLocaleString()}`}
          color={netProfit >= 0 ? "text-emerald-400" : "text-red-400"}
          icon={<svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
          subtext="Sales - Purchases - Expenses"
        />
        <StatCard
          title="Invoice Due"
          value={`${business?.currencySymbol || 'Rs'} ${salesDue.toLocaleString()}`}
          color="text-amber-400"
          icon={<svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
          subtext="From customers"
        />
        <StatCard
          title="Total Expenses"
          value={`${business?.currencySymbol || 'Rs'} ${totalExpenses.toLocaleString()}`}
          color="text-red-400"
          icon={<svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
          subtext={`${(expenses || []).length} expenses`}
        />
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Purchases"
          value={`${business?.currencySymbol || 'Rs'} ${totalPurchases.toLocaleString()}`}
          color="text-blue-400"
          icon={<svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          subtext={`${(purchases || []).length} orders`}
        />
        <StatCard
          title="Purchase Due"
          value={`${business?.currencySymbol || 'Rs'} ${purchaseDue.toLocaleString()}`}
          color="text-orange-400"
          icon={<svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          subtext="To suppliers"
        />
        <StatCard
          title="Stock Value"
          value={`${business?.currencySymbol || 'Rs'} ${totalStockValue.toLocaleString()}`}
          color="text-purple-400"
          icon={<svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
          subtext={`${(products || []).length} products`}
        />
        <StatCard
          title="Low Stock Alert"
          value={lowStockProducts.length}
          color={lowStockProducts.length > 0 ? "text-red-400" : "text-emerald-400"}
          icon={<svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
          subtext="Products need restock"
        />
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
            <h3 className="text-white font-semibold">Recent Sales</h3>
            <span className="text-slate-400 text-sm">{(sales || []).length} total</span>
          </div>
          <div className="p-4">
            {(sales || []).length === 0 ? (
              <p className="text-slate-500 text-center py-8">No sales yet</p>
            ) : (
              <div className="space-y-3">
                {(sales || []).slice(-5).reverse().map(sale => {
                  const customer = (customers || []).find(c => c.id === sale.customerId)
                  const saleTotal = parseFloat(sale.total) || parseFloat(sale.totalAmount) || parseFloat(sale.grandTotal) || 0
                  const salePaid = parseFloat(sale.amountPaid) || 0
                  const status = salePaid >= saleTotal ? 'paid' : salePaid > 0 ? 'partial' : 'due'
                  
                  return (
                    <div key={sale.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{customer?.name || 'Walk-in Customer'}</p>
                        <p className="text-slate-400 text-sm">{new Date(sale.date || sale.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-400 font-semibold">{business?.currencySymbol || 'Rs'} {saleTotal.toLocaleString()}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' :
                          status === 'partial' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {status}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Products */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
            <h3 className="text-white font-semibold">Stock Alert</h3>
            <span className="text-red-400 text-sm">{lowStockProducts.length} items</span>
          </div>
          <div className="p-4">
            {lowStockProducts.length === 0 ? (
              <p className="text-emerald-400 text-center py-8">✓ All products are well stocked!</p>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 5).map(product => {
                  const currentStock = parseFloat(product.currentStock) || parseFloat(product.quantity) || 0
                  const alertQty = parseFloat(product.alertQuantity) || parseFloat(product.lowStockAlert) || 5
                  
                  return (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{product.name}</p>
                        <p className="text-slate-400 text-sm">SKU: {product.sku || '-'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-red-400 font-semibold">{currentStock} left</p>
                        <p className="text-slate-500 text-xs">Min: {alertQty}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
        <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map(action => (
            <QuickActionButton 
              key={action.path} 
              name={action.name}
              path={action.path}
              color={action.color}
              navigate={navigate}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function QuickActionButton({ name, path, color, navigate }) {
  const colorClasses = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
  }

  return (
    <button
      onClick={() => navigate(path)}
      className={`p-4 rounded-xl border transition-all text-center ${colorClasses[color]}`}
    >
      <span className="font-medium text-sm">{name}</span>
    </button>
  )
}