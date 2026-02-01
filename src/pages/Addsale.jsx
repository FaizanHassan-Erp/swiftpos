import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function Addsale() {
  const navigate = useNavigate()
  const { state, dispatch } = useApp()
  const { products, customers, salesAgents, paymentAccounts = [], business } = state
  
  const [formData, setFormData] = useState({
    customerId: customers[0]?.id || '',
    date: new Date().toISOString().slice(0, 16),
    salesAgentId: '',
    saleNote: '',
    shippingDetails: '',
    shippingAddress: '',
    shippingCharges: 0,
    shippingStatus: '',
    deliveredTo: '',
    deliveryPerson: '',
    paymentMethod: 'Cash',
    amountPaid: 0,
    paymentAccountId: ''
  })

  const [items, setItems] = useState([])
  const [discount, setDiscount] = useState(0)
  const [discountType, setDiscountType] = useState('fixed')
  const [orderTax, setOrderTax] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [showProductDropdown, setShowProductDropdown] = useState(false)

  // Filter products for search
  const filteredProducts = products.filter(p => 
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     p.sku?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    p.currentStock > 0
  )

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
  const discountAmount = discountType === 'percent' ? (subtotal * discount / 100) : discount
  const taxAmount = (subtotal - discountAmount) * orderTax / 100
  const total = subtotal - discountAmount + taxAmount + (parseFloat(formData.shippingCharges) || 0)

  function addProduct(product) {
    const existingIndex = items.findIndex(item => item.productId === product.id)
    if (existingIndex >= 0) {
      const newItems = [...items]
      if (newItems[existingIndex].quantity >= product.currentStock) {
        alert('Not enough stock!')
        return
      }
      newItems[existingIndex].quantity += 1
      newItems[existingIndex].subtotal = newItems[existingIndex].quantity * newItems[existingIndex].unitPrice * (1 - newItems[existingIndex].discount / 100)
      setItems(newItems)
    } else {
      setItems([...items, {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        quantity: 1,
        unitPrice: product.sellingPrice,
        discount: 0,
        tax: 0,
        subtotal: product.sellingPrice,
        maxStock: product.currentStock
      }])
    }
    setSearchTerm('')
    setShowProductDropdown(false)
  }

  function updateItem(index, field, value) {
    const newItems = [...items]
    newItems[index][field] = value
    
    if (field === 'quantity' && value > newItems[index].maxStock) {
      alert('Not enough stock!')
      return
    }
    
    // Recalculate subtotal
    const item = newItems[index]
    const priceAfterDiscount = item.unitPrice * (1 - item.discount / 100)
    const priceWithTax = priceAfterDiscount * (1 + item.tax / 100)
    newItems[index].subtotal = item.quantity * priceWithTax
    
    setItems(newItems)
  }

  function removeItem(index) {
    setItems(items.filter((_, i) => i !== index))
  }

  function handleSubmit(e) {
    e.preventDefault()
    
    if (items.length === 0) {
      alert('Please add at least one product')
      return
    }

    if (!formData.customerId) {
      alert('Please select a customer')
      return
    }

    const saleData = {
      customerId: parseInt(formData.customerId),
      items: items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        tax: item.tax,
        subtotal: item.subtotal
      })),
      subtotal: subtotal,
      discount: discountAmount,
      discountType: discountType,
      tax: taxAmount,
      taxPercent: orderTax,
      shippingCharges: parseFloat(formData.shippingCharges) || 0,
      shippingDetails: formData.shippingDetails,
      shippingAddress: formData.shippingAddress,
      shippingStatus: formData.shippingStatus,
      deliveredTo: formData.deliveredTo,
      deliveryPerson: formData.deliveryPerson,
      total: total,
      amountPaid: parseFloat(formData.amountPaid) || 0,
      paymentMethod: formData.paymentMethod,
      paymentAccountId: formData.paymentAccountId ? parseInt(formData.paymentAccountId) : null,
      salesAgentId: formData.salesAgentId || null,
      note: formData.saleNote,
      date: new Date(formData.date).toISOString(),
      saleType: 'order'
    }

    dispatch({ type: 'ADD_SALE', payload: saleData })
    navigate('/sales')
  }

  const selectedCustomer = customers.find(c => c.id === parseInt(formData.customerId))

  // Filter active payment accounts only
  const activeAccounts = paymentAccounts.filter(acc => acc.status !== 'closed')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Add Sale</h1>
          <p className="text-slate-400 text-sm">Create a new sales order</p>
        </div>
        <button
          onClick={() => navigate('/sales')}
          className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
        >
          ← Back to Sales
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer & Date */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Customer *</label>
              <select
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                required
              >
                <option value="">Select Customer</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {selectedCustomer && selectedCustomer.balance > 0 && (
                <p className="text-yellow-400 text-xs mt-1">Previous Balance: {business.currency} {selectedCustomer.balance.toFixed(2)}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Date *</label>
              <input
                type="datetime-local"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Sales Agent</label>
              <select
                value={formData.salesAgentId}
                onChange={(e) => setFormData({ ...formData, salesAgentId: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">Select Agent</option>
                {salesAgents.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
              <input
                type="text"
                value={business.name}
                disabled
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-white font-medium mb-4">Products</h3>
          
          {/* Product Search */}
          <div className="relative mb-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Enter Product name / SKU / Scan bar code"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setShowProductDropdown(e.target.value.length > 0)
                  }}
                  onFocus={() => setShowProductDropdown(searchTerm.length > 0)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
                
                {/* Dropdown */}
                {showProductDropdown && filteredProducts.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-10 max-h-60 overflow-y-auto">
                    {filteredProducts.map(product => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => addProduct(product)}
                        className="w-full px-4 py-2 text-left hover:bg-slate-800 flex justify-between items-center"
                      >
                        <div>
                          <p className="text-white">{product.name}</p>
                          <p className="text-slate-400 text-sm">{product.sku} - Stock: {product.currentStock}</p>
                        </div>
                        <span className="text-emerald-400">{business.currency} {product.sellingPrice}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowProductDropdown(!showProductDropdown)}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
              >
                +
              </button>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-900/50">
                  <th className="text-left px-4 py-2 text-slate-400 text-sm">#</th>
                  <th className="text-left px-4 py-2 text-slate-400 text-sm">Product</th>
                  <th className="text-center px-4 py-2 text-slate-400 text-sm">Quantity</th>
                  <th className="text-right px-4 py-2 text-slate-400 text-sm">Unit Price</th>
                  <th className="text-center px-4 py-2 text-slate-400 text-sm">Discount %</th>
                  <th className="text-center px-4 py-2 text-slate-400 text-sm">Tax %</th>
                  <th className="text-right px-4 py-2 text-slate-400 text-sm">Subtotal</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-slate-500">No products added</td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={index} className="border-t border-slate-700/50">
                      <td className="px-4 py-2 text-slate-400">{index + 1}</td>
                      <td className="px-4 py-2">
                        <p className="text-white">{item.name}</p>
                        <p className="text-slate-500 text-xs">{item.sku}</p>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateItem(index, 'quantity', Math.max(1, item.quantity - 1))}
                            className="w-7 h-7 bg-slate-700 rounded text-white hover:bg-slate-600"
                          >-</button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-16 text-center bg-slate-900 border border-slate-700 rounded text-white py-1"
                            min="1"
                          />
                          <button
                            type="button"
                            onClick={() => updateItem(index, 'quantity', item.quantity + 1)}
                            className="w-7 h-7 bg-slate-700 rounded text-white hover:bg-slate-600"
                          >+</button>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-24 text-right bg-slate-900 border border-slate-700 rounded text-white py-1 px-2"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={item.discount}
                          onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                          className="w-16 text-center bg-slate-900 border border-slate-700 rounded text-white py-1"
                          min="0"
                          max="100"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={item.tax}
                          onChange={(e) => updateItem(index, 'tax', parseFloat(e.target.value) || 0)}
                          className="w-16 text-center bg-slate-900 border border-slate-700 rounded text-white py-1"
                          min="0"
                        />
                      </td>
                      <td className="px-4 py-2 text-right text-white font-medium">
                        {business.currency} {item.subtotal.toFixed(2)}
                      </td>
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-4 flex justify-end">
            <div className="w-80 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Items:</span>
                <span className="text-white">{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Total:</span>
                <span className="text-white">{business.currency} {subtotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sale Note */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">Sale Note</label>
          <textarea
            value={formData.saleNote}
            onChange={(e) => setFormData({ ...formData, saleNote: e.target.value })}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            rows="3"
            placeholder="Add note..."
          />
        </div>

        {/* Shipping Details */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-white font-medium mb-4">Shipping Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Shipping Details</label>
              <textarea
                value={formData.shippingDetails}
                onChange={(e) => setFormData({ ...formData, shippingDetails: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                rows="3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Shipping Address</label>
              <textarea
                value={formData.shippingAddress}
                onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                rows="3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Shipping Charges</label>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">{business.currency}</span>
                <input
                  type="number"
                  value={formData.shippingCharges}
                  onChange={(e) => setFormData({ ...formData, shippingCharges: e.target.value })}
                  className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  step="0.01"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Shipping Status</label>
              <select
                value={formData.shippingStatus}
                onChange={(e) => setFormData({ ...formData, shippingStatus: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">Select Status</option>
                <option value="ordered">Ordered</option>
                <option value="packed">Packed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Delivered To</label>
              <input
                type="text"
                value={formData.deliveredTo}
                onChange={(e) => setFormData({ ...formData, deliveredTo: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Delivery Person</label>
              <input
                type="text"
                value={formData.deliveryPerson}
                onChange={(e) => setFormData({ ...formData, deliveryPerson: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Discount, Tax & Payment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Discounts & Taxes */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-white font-medium mb-4">Discount & Tax</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Discount</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    min="0"
                  />
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="fixed">{business.currency}</option>
                    <option value="percent">%</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Order Tax (%)</label>
                <input
                  type="number"
                  value={orderTax}
                  onChange={(e) => setOrderTax(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-white font-medium mb-4">Payment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Credit">Credit (Pay Later)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Amount Paid</label>
                <input
                  type="number"
                  value={formData.amountPaid}
                  onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  step="0.01"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Payment Account *</label>
                <select
                  value={formData.paymentAccountId}
                  onChange={(e) => setFormData({ ...formData, paymentAccountId: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  <option value="">Select Account</option>
                  {activeAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({acc.accountType || 'Default'})</option>
                  ))}
                </select>
                {!formData.paymentAccountId && parseFloat(formData.amountPaid) > 0 && (
                  <p className="text-yellow-400 text-xs mt-1">⚠️ Select an account to track this payment</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Final Summary */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <div className="flex justify-between items-start">
            <div className="space-y-2 text-sm">
              <div className="flex gap-8">
                <span className="text-slate-400">Subtotal:</span>
                <span className="text-white">{business.currency} {subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex gap-8">
                  <span className="text-slate-400">Discount:</span>
                  <span className="text-orange-400">- {business.currency} {discountAmount.toFixed(2)}</span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex gap-8">
                  <span className="text-slate-400">Tax ({orderTax}%):</span>
                  <span className="text-white">{business.currency} {taxAmount.toFixed(2)}</span>
                </div>
              )}
              {parseFloat(formData.shippingCharges) > 0 && (
                <div className="flex gap-8">
                  <span className="text-slate-400">Shipping:</span>
                  <span className="text-white">{business.currency} {parseFloat(formData.shippingCharges).toFixed(2)}</span>
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-sm mb-1">Total</p>
              <p className="text-3xl font-bold text-emerald-400">{business.currency} {total.toFixed(2)}</p>
              {parseFloat(formData.amountPaid) > 0 && (
                <p className="text-slate-400 text-sm mt-2">
                  Due: <span className={`font-medium ${(total - parseFloat(formData.amountPaid)) > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {business.currency} {(total - parseFloat(formData.amountPaid)).toFixed(2)}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/sales')}
            className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-cyan-600"
          >
            Save Sale
          </button>
        </div>
      </form>
    </div>
  )
}