import { useState } from 'react'
import { useApp } from '../Context/AppContext'

export default function Salereturns() {
  const { state, dispatch } = useApp()
  const { saleReturns, sales, customers, products, business } = state
  
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSale, setSelectedSale] = useState(null)
  const [returnItems, setReturnItems] = useState([])
  const [returnNote, setReturnNote] = useState('')

  const filteredReturns = (saleReturns || []).filter(sr => {
    const sale = sales.find(s => s.id === sr.saleId)
    const customer = customers.find(c => c.id === sr.customerId)
    return sr.returnNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           sale?.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const totalReturns = filteredReturns.length
  const totalReturnAmount = filteredReturns.reduce((sum, sr) => sum + (sr.total || 0), 0)

  function getCustomerName(customerId) {
    return customers.find(c => c.id === customerId)?.name || 'Walk-in Customer'
  }

  function getSaleInvoice(saleId) {
    return sales.find(s => s.id === saleId)?.invoiceNo || '-'
  }

  function getProductName(productId) {
    return products.find(p => p.id === productId)?.name || 'Unknown Product'
  }

  function openAddModal() {
    setSelectedSale(null)
    setReturnItems([])
    setReturnNote('')
    setShowModal(true)
  }

  function handleSaleSelect(saleId) {
    const sale = sales.find(s => s.id === parseInt(saleId))
    if (sale) {
      setSelectedSale(sale)
      const existingReturns = (saleReturns || []).filter(sr => sr.saleId === sale.id)
      const returnedQty = {}
      existingReturns.forEach(sr => {
        (sr.items || []).forEach(item => {
          returnedQty[item.productId] = (returnedQty[item.productId] || 0) + item.quantity
        })
      })
      
      setReturnItems(sale.items.map(item => ({
        ...item,
        returnQuantity: 0,
        maxQuantity: item.quantity - (returnedQty[item.productId] || 0),
        originalQuantity: item.quantity,
        alreadyReturned: returnedQty[item.productId] || 0
      })).filter(item => item.maxQuantity > 0))
    }
  }

  function updateReturnQuantity(productId, quantity) {
    setReturnItems(returnItems.map(item => {
      if (item.productId === productId) {
        const returnQty = Math.min(Math.max(0, quantity), item.maxQuantity)
        return {
          ...item,
          returnQuantity: returnQty,
          returnSubtotal: returnQty * item.unitPrice
        }
      }
      return item
    }))
  }

  function calculateReturnTotal() {
    return returnItems.reduce((sum, item) => sum + (item.returnSubtotal || 0), 0)
  }

  function handleSubmit(e) {
    e.preventDefault()
    
    const itemsToReturn = returnItems.filter(item => item.returnQuantity > 0)
    if (itemsToReturn.length === 0) {
      alert('Please select items to return')
      return
    }

    const returnData = {
      saleId: selectedSale.id,
      customerId: selectedSale.customerId,
      items: itemsToReturn.map(item => ({
        productId: item.productId,
        name: item.name,
        quantity: item.returnQuantity,
        unitPrice: item.unitPrice,
        subtotal: item.returnSubtotal
      })),
      total: calculateReturnTotal(),
      note: returnNote,
      date: new Date().toISOString()
    }

    dispatch({ type: 'ADD_SALE_RETURN', payload: returnData })
    setShowModal(false)
  }

  function handleDelete(returnId) {
    if (confirm('Are you sure you want to delete this return?')) {
      dispatch({ type: 'DELETE_SALE_RETURN', payload: returnId })
    }
  }

  const salesWithItems = sales.filter(sale => {
    const existingReturns = (saleReturns || []).filter(sr => sr.saleId === sale.id)
    const returnedQty = {}
    existingReturns.forEach(sr => {
      (sr.items || []).forEach(item => {
        returnedQty[item.productId] = (returnedQty[item.productId] || 0) + item.quantity
      })
    })
    
    return (sale.items || []).some(item => {
      const returned = returnedQty[item.productId] || 0
      return item.quantity > returned
    })
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Sales Returns</h1>
          <p className="text-slate-400 text-sm">Manage customer returns</p>
        </div>
        <button onClick={openAddModal} className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-cyan-600 transition-all flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Return
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" /></svg>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Returns</p>
              <p className="text-2xl font-bold text-white">{totalReturns}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Return Amount</p>
              <p className="text-2xl font-bold text-orange-400">{business.currency} {totalReturnAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl">
        <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
          <span className="text-slate-400 text-sm">{filteredReturns.length} returns</span>
          <input
            id="srSearch"
            name="srSearch"
            autoComplete="off"
            aria-label="Search sale returns"
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm w-64 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-900/50">
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Date</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Return No</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Invoice</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Customer</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Items</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Total</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Status</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReturns.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-8 text-slate-500">No sales returns found</td></tr>
              ) : (
                filteredReturns.map(sr => (
                  <tr key={sr.id} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                    <td className="px-4 py-3 text-white">{new Date(sr.createdAt || sr.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-orange-400 font-medium">{sr.returnNo}</td>
                    <td className="px-4 py-3 text-cyan-400">{getSaleInvoice(sr.saleId)}</td>
                    <td className="px-4 py-3 text-white">{getCustomerName(sr.customerId)}</td>
                    <td className="px-4 py-3 text-slate-300">{(sr.items || []).length} items</td>
                    <td className="px-4 py-3 text-orange-400">{business.currency} {(sr.total || 0).toFixed(2)}</td>
                    <td className="px-4 py-3"><span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs">{sr.status || 'Completed'}</span></td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(sr.id)} className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30" title="Delete">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Return Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Add Sales Return</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Select Sale */}
              <div>
                <label htmlFor="srSaleId" className="block text-sm font-medium text-slate-300 mb-2">Select Sale Invoice *</label>
                <select id="srSaleId" name="srSaleId" value={selectedSale?.id || ''} onChange={(e) => handleSaleSelect(e.target.value)} className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" required>
                  <option value="">Select a sale...</option>
                  {salesWithItems.map(sale => (
                    <option key={sale.id} value={sale.id}>{sale.invoiceNo} - {getCustomerName(sale.customerId)} - {business.currency} {sale.total?.toFixed(2)}</option>
                  ))}
                </select>
              </div>

              {/* Sale Details */}
              {selectedSale && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-900/50 p-4 rounded-lg">
                      <p className="text-slate-400 text-sm">Invoice</p>
                      <p className="text-cyan-400 font-medium">{selectedSale.invoiceNo}</p>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-lg">
                      <p className="text-slate-400 text-sm">Customer</p>
                      <p className="text-white font-medium">{getCustomerName(selectedSale.customerId)}</p>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-lg">
                      <p className="text-slate-400 text-sm">Original Total</p>
                      <p className="text-emerald-400 font-medium">{business.currency} {selectedSale.total?.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Return Items */}
                  <div>
                    <h3 className="text-white font-medium mb-3">Select Items to Return</h3>
                    {returnItems.length === 0 ? (
                      <p className="text-slate-400 text-center py-4">All items from this sale have already been returned</p>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="bg-slate-900/50">
                            <th className="text-left px-4 py-2 text-slate-400 text-sm">Product</th>
                            <th className="text-center px-4 py-2 text-slate-400 text-sm">Original Qty</th>
                            <th className="text-center px-4 py-2 text-slate-400 text-sm">Already Returned</th>
                            <th className="text-center px-4 py-2 text-slate-400 text-sm">Return Qty</th>
                            <th className="text-right px-4 py-2 text-slate-400 text-sm">Unit Price</th>
                            <th className="text-right px-4 py-2 text-slate-400 text-sm">Return Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {returnItems.map(item => (
                            <tr key={item.productId} className="border-t border-slate-700/50">
                              <td className="px-4 py-3 text-white">{item.name || getProductName(item.productId)}</td>
                              <td className="px-4 py-3 text-center text-slate-300">{item.originalQuantity}</td>
                              <td className="px-4 py-3 text-center text-orange-400">{item.alreadyReturned}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-center gap-2">
                                  <button type="button" onClick={() => updateReturnQuantity(item.productId, item.returnQuantity - 1)} className="w-8 h-8 bg-slate-700 rounded text-white hover:bg-slate-600">-</button>
                                  <input
                                    aria-label={`Return quantity for ${item.name || getProductName(item.productId)}`}
                                    type="number"
                                    value={item.returnQuantity}
                                    onChange={(e) => updateReturnQuantity(item.productId, parseInt(e.target.value) || 0)}
                                    className="w-16 text-center bg-slate-900 border border-slate-700 rounded text-white py-1"
                                    min="0"
                                    max={item.maxQuantity}
                                  />
                                  <button type="button" onClick={() => updateReturnQuantity(item.productId, item.returnQuantity + 1)} className="w-8 h-8 bg-slate-700 rounded text-white hover:bg-slate-600">+</button>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right text-slate-300">{business.currency} {item.unitPrice?.toFixed(2)}</td>
                              <td className="px-4 py-3 text-right text-orange-400 font-medium">{business.currency} {(item.returnSubtotal || 0).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Note */}
                  <div>
                    <label htmlFor="srReturnNote" className="block text-sm font-medium text-slate-300 mb-2">Return Reason/Note</label>
                    <textarea id="srReturnNote" name="srReturnNote" value={returnNote} onChange={(e) => setReturnNote(e.target.value)} className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" rows="2" placeholder="Reason for return..." />
                  </div>

                  {/* Total */}
                  <div className="bg-slate-900/50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300 font-medium">Total Return Amount:</span>
                      <span className="text-2xl font-bold text-orange-400">{business.currency} {calculateReturnTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">Cancel</button>
                <button type="submit" disabled={!selectedSale || calculateReturnTotal() === 0} className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg hover:from-emerald-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed">Process Return</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}