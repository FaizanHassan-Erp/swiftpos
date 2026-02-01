import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../Context/AppContext'

export default function POS() {
  const navigate = useNavigate()
  const { state, dispatch } = useApp()
  const { products, categories, brands, customers, business, paymentAccounts = [], salesAgents } = state
  
  const [cart, setCart] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(customers.find(c => c.name === 'Walk-in Customer') || customers[0])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedBrand, setSelectedBrand] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [discount, setDiscount] = useState(0)
  const [discountType, setDiscountType] = useState('fixed')
  const [orderTax, setOrderTax] = useState(0)
  const [shippingCharges, setShippingCharges] = useState(0)
  const [saleNote, setSaleNote] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [paymentAccountId, setPaymentAccountId] = useState('')
  const [amountReceived, setAmountReceived] = useState(0)
  const [lastSale, setLastSale] = useState(null)
  const [salesAgent, setSalesAgent] = useState('')
  const searchRef = useRef(null)

  // Filter active payment accounts
  const activeAccounts = paymentAccounts.filter(acc => acc.status !== 'closed')

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || p.categoryId === selectedCategory
    const matchesBrand = !selectedBrand || p.brandId === selectedBrand
    return matchesSearch && matchesCategory && matchesBrand && p.currentStock > 0
  })

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0)
  const discountAmount = discountType === 'percent' ? (subtotal * discount / 100) : discount
  const taxAmount = (subtotal - discountAmount) * (orderTax / 100)
  const grandTotal = subtotal - discountAmount + taxAmount + shippingCharges
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const changeAmount = amountReceived - grandTotal

  function addToCart(product) {
    const existingItem = cart.find(item => item.productId === product.id)
    if (existingItem) {
      if (existingItem.quantity < product.currentStock) {
        setCart(cart.map(item =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        ))
      } else {
        alert('Not enough stock!')
      }
    } else {
      if (product.currentStock > 0) {
        setCart([...cart, {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          sellingPrice: product.sellingPrice,
          costPrice: product.costPrice,
          quantity: 1,
          discount: 0,
          maxStock: product.currentStock
        }])
      } else {
        alert('Product out of stock!')
      }
    }
  }

  function updateQuantity(productId, newQuantity) {
    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }
    const item = cart.find(i => i.productId === productId)
    if (newQuantity > item.maxStock) {
      alert('Not enough stock!')
      return
    }
    setCart(cart.map(item =>
      item.productId === productId ? { ...item, quantity: newQuantity } : item
    ))
  }

  function updatePrice(productId, newPrice) {
    setCart(cart.map(item =>
      item.productId === productId ? { ...item, sellingPrice: parseFloat(newPrice) || 0 } : item
    ))
  }

  function updateItemDiscount(productId, discountValue) {
    setCart(cart.map(item =>
      item.productId === productId ? { ...item, discount: parseFloat(discountValue) || 0 } : item
    ))
  }

  function removeFromCart(productId) {
    setCart(cart.filter(item => item.productId !== productId))
  }

  function clearCart() {
    if (cart.length > 0 && confirm('Clear all items from cart?')) {
      setCart([])
      setDiscount(0)
      setOrderTax(0)
      setShippingCharges(0)
      setSaleNote('')
      setPaymentAccountId('')
    }
  }

  function processSale(paymentType = 'Cash') {
    if (cart.length === 0) {
      alert('Cart is empty!')
      return
    }

    const saleItems = cart.map(item => ({
      productId: item.productId,
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.sellingPrice,
      costPrice: item.costPrice,
      discount: item.discount,
      subtotal: (item.sellingPrice * item.quantity) - item.discount
    }))

    // Find or use selected payment account
    const selectedAccountId = paymentAccountId 
      ? parseInt(paymentAccountId) 
      : activeAccounts.find(a => a.accountType === 'Cash')?.id || activeAccounts[0]?.id || null

    const saleData = {
      customerId: selectedCustomer?.id || null,
      customerName: selectedCustomer?.name || 'Walk-in Customer',
      items: saleItems,
      subtotal: subtotal,
      discount: discountAmount,
      discountType: discountType,
      tax: taxAmount,
      taxPercent: orderTax,
      shippingCharges: shippingCharges,
      total: grandTotal,
      amountPaid: paymentType === 'Credit Sale' ? 0 : amountReceived || grandTotal,
      paymentMethod: paymentType,
      paymentAccountId: paymentType === 'Credit Sale' ? null : selectedAccountId,
      salesAgentId: salesAgent || null,
      note: saleNote,
      date: new Date().toISOString(),
      saleType: paymentType === 'Credit Sale' ? 'credit' : 'cash'
    }

    dispatch({ type: 'ADD_SALE', payload: saleData })
    
    const saleNo = `INV-${String((state.saleCounter || 1)).padStart(4, '0')}`
    setLastSale({
      ...saleData,
      invoiceNo: saleNo,
      createdAt: new Date().toISOString()
    })
    
    setCart([])
    setDiscount(0)
    setOrderTax(0)
    setShippingCharges(0)
    setSaleNote('')
    setAmountReceived(0)
    setPaymentAccountId('')
    setShowPaymentModal(false)
    setShowReceiptModal(true)
  }

  function openPaymentModal() {
    if (cart.length === 0) {
      alert('Cart is empty!')
      return
    }
    setAmountReceived(grandTotal)
    // Set default payment account (first Cash account or first available)
    const defaultAccount = activeAccounts.find(a => a.accountType === 'Cash') || activeAccounts[0]
    setPaymentAccountId(defaultAccount?.id?.toString() || '')
    setShowPaymentModal(true)
  }

  function printReceipt() {
    window.print()
  }

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'F2') { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === 'F4') { e.preventDefault(); openPaymentModal(); }
      if (e.key === 'Escape') { setShowPaymentModal(false); setShowReceiptModal(false); }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cart])

  return (
    <div className="h-[calc(100vh-120px)] flex gap-4">
      {/* Left Side - Cart */}
      <div className="flex-1 flex flex-col bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-700/50 bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <select
                  value={selectedCustomer?.id || ''}
                  onChange={(e) => setSelectedCustomer(customers.find(c => c.id === parseInt(e.target.value)))}
                  className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.balance > 0 ? `(Due: ${business.currency}${c.balance})` : ''}</option>
                  ))}
                </select>
                <button onClick={() => setShowCustomerModal(true)} className="p-2 bg-emerald-500 rounded-lg text-white hover:bg-emerald-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </button>
              </div>
            </div>
            <div className="px-4 py-2 bg-purple-500 rounded-lg text-white text-sm font-medium">
              {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <select value={salesAgent} onChange={(e) => setSalesAgent(e.target.value)} className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500">
              <option value="">Commission Agent</option>
              {(salesAgents || []).map(agent => (<option key={agent.id} value={agent.id}>{agent.name}</option>))}
            </select>
            <select 
              value={paymentAccountId} 
              onChange={(e) => setPaymentAccountId(e.target.value)} 
              className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="">Select Payment Account</option>
              {activeAccounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name} ({acc.accountType || 'Default'})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-auto p-4">
          {cart.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-lg">Cart is empty</p>
                <p className="text-sm">Click on products to add them</p>
              </div>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-slate-400 text-sm">
                  <th className="text-left pb-3 font-medium">Product</th>
                  <th className="text-center pb-3 font-medium w-32">Quantity</th>
                  <th className="text-center pb-3 font-medium w-28">Price</th>
                  <th className="text-center pb-3 font-medium w-24">Discount</th>
                  <th className="text-right pb-3 font-medium w-28">Subtotal</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {cart.map(item => {
                  const itemSubtotal = (item.sellingPrice * item.quantity) - item.discount
                  return (
                    <tr key={item.productId} className="border-t border-slate-700/50">
                      <td className="py-3">
                        <p className="text-white font-medium">{item.name}</p>
                        <p className="text-slate-500 text-xs">{item.sku}</p>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="w-8 h-8 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 flex items-center justify-center">−</button>
                          <input type="number" value={item.quantity} onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 0)} className="w-16 text-center bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-white" />
                          <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="w-8 h-8 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 flex items-center justify-center">+</button>
                        </div>
                      </td>
                      <td className="py-3">
                        <input type="number" value={item.sellingPrice} onChange={(e) => updatePrice(item.productId, e.target.value)} className="w-full text-center bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-white" />
                      </td>
                      <td className="py-3">
                        <input type="number" value={item.discount} onChange={(e) => updateItemDiscount(item.productId, e.target.value)} className="w-full text-center bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-emerald-400" placeholder="0" />
                      </td>
                      <td className="py-3 text-right text-white font-medium">{business.currency} {itemSubtotal.toFixed(2)}</td>
                      <td className="py-3">
                        <button onClick={() => removeFromCart(item.productId)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Cart Summary */}
        <div className="p-4 border-t border-slate-700/50 bg-slate-900/50">
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div><p className="text-slate-400 text-sm">Items: <span className="text-white font-bold">{totalItems}</span></p></div>
            <div><p className="text-slate-400 text-sm">Total: <span className="text-white font-bold">{subtotal.toFixed(2)}</span></p></div>
            <div className="flex items-center gap-2">
              <p className="text-slate-400 text-sm">Discount (-):</p>
              <button onClick={() => { const val = prompt('Enter discount:', discount); if (val !== null) setDiscount(parseFloat(val) || 0) }} className="text-emerald-400 hover:underline text-sm">{business.currency} {discountAmount.toFixed(2)}</button>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-slate-400 text-sm">Tax (+):</p>
              <button onClick={() => { const val = prompt('Enter tax %:', orderTax); if (val !== null) setOrderTax(parseFloat(val) || 0) }} className="text-cyan-400 hover:underline text-sm">{orderTax}%</button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button onClick={clearCart} className="px-4 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 text-sm">🗑️ Clear</button>
            <button onClick={() => processSale('Credit Sale')} className="px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm">✓ Credit Sale</button>
            <button onClick={openPaymentModal} className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm">💳 Multiple Pay</button>
            <button onClick={() => { setAmountReceived(grandTotal); processSale('Cash') }} className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-medium">💵 Cash</button>
            <button onClick={clearCart} className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm">✕ Cancel</button>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-xl text-slate-400">Total Payable:</span>
            <span className="text-3xl font-bold text-white">{business.currency} {grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Right Side - Products */}
      <div className="w-[450px] flex flex-col bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input ref={searchRef} type="text" placeholder="Search products... (F2)" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500" />
          </div>
        </div>

        <div className="flex gap-2 p-4 border-b border-slate-700/50">
          <button onClick={() => { setSelectedCategory(null); setSelectedBrand(null) }} className={`flex-1 py-2 rounded-lg font-medium ${!selectedCategory && !selectedBrand ? 'bg-purple-500 text-white' : 'bg-slate-700 text-slate-300'}`}>All</button>
          <button onClick={() => setSelectedBrand(null)} className={`flex-1 py-2 rounded-lg font-medium ${selectedCategory ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'}`}>🏷️ Category</button>
          <button onClick={() => setSelectedCategory(null)} className={`flex-1 py-2 rounded-lg font-medium ${selectedBrand ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-300'}`}>🏭 Brands</button>
        </div>

        <div className="p-2 border-b border-slate-700/50 flex flex-wrap gap-2 max-h-20 overflow-auto">
          <button onClick={() => { setSelectedCategory(null); setSelectedBrand(null) }} className={`px-3 py-1 rounded-full text-xs ${!selectedCategory && !selectedBrand ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'}`}>All</button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => { setSelectedCategory(cat.id); setSelectedBrand(null) }} className={`px-3 py-1 rounded-full text-xs ${selectedCategory === cat.id ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'}`}>{cat.name}</button>
          ))}
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-3 gap-3">
            {filteredProducts.map(product => (
              <button key={product.id} onClick={() => addToCart(product)} className="p-3 bg-slate-700/50 border border-slate-600 rounded-xl hover:border-emerald-500 hover:bg-slate-700 transition-all text-left">
                <div className="w-full aspect-square bg-slate-800 rounded-lg mb-2 flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                </div>
                <p className="text-white text-xs font-medium truncate">{product.name}</p>
                <p className="text-slate-500 text-xs">{product.sku}</p>
                <p className="text-emerald-400 text-sm font-bold mt-1">{business.currency} {product.sellingPrice}</p>
                <p className="text-slate-500 text-xs">{product.currentStock} in stock</p>
              </button>
            ))}
          </div>
          {filteredProducts.length === 0 && (<div className="text-center py-8 text-slate-500">No products found</div>)}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Payment</h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center mb-6">
                <p className="text-slate-400">Total Amount</p>
                <p className="text-4xl font-bold text-white">{business.currency} {grandTotal.toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Payment Method</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white">
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Payment Account *</label>
                <select 
                  value={paymentAccountId} 
                  onChange={(e) => setPaymentAccountId(e.target.value)} 
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  <option value="">Select Account</option>
                  {activeAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({acc.accountType || 'Default'})</option>
                  ))}
                </select>
                {!paymentAccountId && (
                  <p className="text-yellow-400 text-xs mt-1">⚠️ Select account to track payment</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Amount Received</label>
                <input type="number" value={amountReceived} onChange={(e) => setAmountReceived(parseFloat(e.target.value) || 0)} className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-xl font-bold" />
              </div>
              {changeAmount >= 0 && (<div className="p-4 bg-emerald-500/20 rounded-lg"><p className="text-emerald-400 text-sm">Change</p><p className="text-2xl font-bold text-emerald-400">{business.currency} {changeAmount.toFixed(2)}</p></div>)}
              {changeAmount < 0 && (<div className="p-4 bg-red-500/20 rounded-lg"><p className="text-red-400 text-sm">Due Amount</p><p className="text-2xl font-bold text-red-400">{business.currency} {Math.abs(changeAmount).toFixed(2)}</p></div>)}
              <div className="grid grid-cols-4 gap-2">{[100, 500, 1000, 5000].map(amount => (<button key={amount} onClick={() => setAmountReceived(amount)} className="py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">{amount}</button>))}</div>
              <button onClick={() => processSale(paymentMethod)} disabled={amountReceived < grandTotal} className="w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed">Complete Sale</button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && lastSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-auto">
            <div className="p-6" id="receipt">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">{business.name || 'My Business'}</h1>
                {business.address && <p className="text-gray-600 text-sm">{business.address}</p>}
                {business.phone && <p className="text-gray-600 text-sm">Mobile: {business.phone}</p>}
              </div>
              <div className="flex justify-between text-sm mb-4 pb-4 border-b border-gray-300">
                <div><p className="text-gray-600">Invoice No. <span className="font-bold text-gray-800">{lastSale.invoiceNo}</span></p><p className="text-gray-600">Customer: {lastSale.customerName}</p></div>
                <div className="text-right"><p className="text-gray-600">Date: {new Date(lastSale.createdAt).toLocaleDateString()}</p><p className="text-gray-600">Time: {new Date(lastSale.createdAt).toLocaleTimeString()}</p></div>
              </div>
              <table className="w-full text-sm mb-4">
                <thead><tr className="border-b border-gray-300"><th className="text-left py-2 text-gray-600">Product</th><th className="text-center py-2 text-gray-600">Qty</th><th className="text-right py-2 text-gray-600">Price</th><th className="text-right py-2 text-gray-600">Total</th></tr></thead>
                <tbody>
                  {lastSale.items.map((item, idx) => (<tr key={idx} className="border-b border-gray-200"><td className="py-2 text-gray-800">{item.name}</td><td className="py-2 text-center text-gray-800">{item.quantity}</td><td className="py-2 text-right text-gray-800">{item.unitPrice.toFixed(2)}</td><td className="py-2 text-right text-gray-800">{item.subtotal.toFixed(2)}</td></tr>))}
                </tbody>
              </table>
              <div className="space-y-1 text-sm border-t border-gray-300 pt-4">
                <div className="flex justify-between"><span className="text-gray-600">Subtotal:</span><span className="text-gray-800">{business.currency} {lastSale.subtotal.toFixed(2)}</span></div>
                {lastSale.discount > 0 && (<div className="flex justify-between text-green-600"><span>Discount:</span><span>- {business.currency} {lastSale.discount.toFixed(2)}</span></div>)}
                {lastSale.tax > 0 && (<div className="flex justify-between"><span className="text-gray-600">Tax:</span><span className="text-gray-800">{business.currency} {lastSale.tax.toFixed(2)}</span></div>)}
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-300"><span>Total:</span><span>{business.currency} {lastSale.total.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">{lastSale.paymentMethod}:</span><span className="text-gray-800">{business.currency} {lastSale.amountPaid.toFixed(2)}</span></div>
                {lastSale.amountPaid > lastSale.total && (<div className="flex justify-between"><span className="text-gray-600">Change:</span><span className="text-gray-800">{business.currency} {(lastSale.amountPaid - lastSale.total).toFixed(2)}</span></div>)}
              </div>
              <div className="text-center mt-6 pt-4 border-t border-gray-300"><p className="text-gray-600 text-sm">Thank you for your purchase!</p></div>
            </div>
            <div className="p-4 border-t border-gray-200 flex gap-3">
              <button onClick={() => setShowReceiptModal(false)} className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Close</button>
              <button onClick={printReceipt} className="flex-1 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">🖨️ Print</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Quick Add Customer</h2>
              <button onClick={() => setShowCustomerModal(false)} className="text-slate-400 hover:text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.target); dispatch({ type: 'ADD_CUSTOMER', payload: { name: fd.get('name'), phone: fd.get('phone'), email: fd.get('email') || '', address: '', businessType: 'individual', status: 'active' } }); setShowCustomerModal(false) }} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-slate-300 mb-2">Name *</label><input type="text" name="name" required className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" /></div>
              <div><label className="block text-sm font-medium text-slate-300 mb-2">Mobile *</label><input type="text" name="phone" required className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" /></div>
              <div><label className="block text-sm font-medium text-slate-300 mb-2">Email</label><input type="email" name="email" className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" /></div>
              <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setShowCustomerModal(false)} className="px-4 py-2 bg-slate-700 text-white rounded-lg">Cancel</button><button type="submit" className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg">Add</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}