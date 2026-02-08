import { useState } from 'react'
import { useApp } from '../Context/AppContext'

export default function BusinessLocations() {
  const { state, dispatch } = useApp()
  const { businessLocations = [] } = state

  const [showModal, setShowModal] = useState(false)
  const [editingLocation, setEditingLocation] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })

  const [formData, setFormData] = useState({
    name: '',
    locationId: '',
    landmark: '',
    city: '',
    state: '',
    country: 'Pakistan',
    zipCode: '',
    mobile: '',
    alternateNumber: '',
    email: '',
    website: '',
    invoiceScheme: '',
    invoiceLayout: '',
    defaultPaymentAccounts: [],
    defaultSellingPriceTax: 'none',
    featuredProducts: [],
    customField1: '',
    customField2: '',
    customField3: '',
    customField4: '',
    isActive: true,
    isPrimary: false
  })

  const countries = ['Pakistan', 'United Arab Emirates', 'Saudi Arabia', 'India', 'United States', 'United Kingdom']
  
  const pakistanStates = [
    'Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan', 
    'Islamabad Capital Territory', 'Gilgit-Baltistan', 'Azad Kashmir'
  ]

  // Filter locations
  const filteredLocations = businessLocations.filter(loc =>
    loc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.city?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  function showMessage(type, text) {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  function openAddModal() {
    setEditingLocation(null)
    setFormData({
      name: '',
      locationId: '',
      landmark: '',
      city: '',
      state: '',
      country: 'Pakistan',
      zipCode: '',
      mobile: '',
      alternateNumber: '',
      email: '',
      website: '',
      invoiceScheme: '',
      invoiceLayout: '',
      defaultPaymentAccounts: [],
      defaultSellingPriceTax: 'none',
      featuredProducts: [],
      customField1: '',
      customField2: '',
      customField3: '',
      customField4: '',
      isActive: true,
      isPrimary: businessLocations.length === 0 // First location is primary
    })
    setShowModal(true)
  }

  function openEditModal(location) {
    setEditingLocation(location)
    setFormData({
      name: location.name || '',
      locationId: location.locationId || '',
      landmark: location.landmark || '',
      city: location.city || '',
      state: location.state || '',
      country: location.country || 'Pakistan',
      zipCode: location.zipCode || '',
      mobile: location.mobile || '',
      alternateNumber: location.alternateNumber || '',
      email: location.email || '',
      website: location.website || '',
      invoiceScheme: location.invoiceScheme || '',
      invoiceLayout: location.invoiceLayout || '',
      defaultPaymentAccounts: location.defaultPaymentAccounts || [],
      defaultSellingPriceTax: location.defaultSellingPriceTax || 'none',
      featuredProducts: location.featuredProducts || [],
      customField1: location.customField1 || '',
      customField2: location.customField2 || '',
      customField3: location.customField3 || '',
      customField4: location.customField4 || '',
      isActive: location.isActive !== false,
      isPrimary: location.isPrimary || false
    })
    setShowModal(true)
  }

  function handleSave(e) {
    e.preventDefault()
    
    if (!formData.name) {
      showMessage('error', 'Please enter location name')
      return
    }

    if (editingLocation) {
      dispatch({
        type: 'UPDATE_BUSINESS_LOCATION',
        payload: { ...formData, id: editingLocation.id }
      })
      showMessage('success', 'Location updated successfully')
    } else {
      dispatch({
        type: 'ADD_BUSINESS_LOCATION',
        payload: formData
      })
      showMessage('success', 'Location added successfully')
    }

    setShowModal(false)
  }

  function handleDelete(id) {
    const location = businessLocations.find(l => l.id === id)
    
    if (location?.isPrimary) {
      showMessage('error', 'Cannot delete primary location')
      return
    }

    if (!confirm('Are you sure you want to delete this location?')) return

    dispatch({
      type: 'DELETE_BUSINESS_LOCATION',
      payload: id
    })
    showMessage('success', 'Location deleted successfully')
  }

  function handleSetPrimary(id) {
    dispatch({
      type: 'SET_PRIMARY_BUSINESS_LOCATION',
      payload: id
    })
    showMessage('success', 'Primary location updated')
  }

  function handleToggleStatus(id) {
    const location = businessLocations.find(l => l.id === id)
    
    if (location?.isPrimary && location?.isActive) {
      showMessage('error', 'Cannot deactivate primary location')
      return
    }

    dispatch({
      type: 'TOGGLE_BUSINESS_LOCATION_STATUS',
      payload: id
    })
    showMessage('success', 'Location status updated')
  }

  function handleChange(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Business Locations</h1>
          <p className="text-slate-400 text-sm">Manage your business branches and locations</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-cyan-600 transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Location
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{businessLocations.length}</p>
              <p className="text-slate-400 text-sm">Total Locations</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{businessLocations.filter(l => l.isActive !== false).length}</p>
              <p className="text-slate-400 text-sm">Active</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{businessLocations.filter(l => l.isActive === false).length}</p>
              <p className="text-slate-400 text-sm">Inactive</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{businessLocations.find(l => l.isPrimary)?.name || 'None'}</p>
              <p className="text-slate-400 text-sm">Primary Location</p>
            </div>
          </div>
        </div>
      </div>

      {/* Locations Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">All Locations</h2>
          <div className="relative">
            <input
              id="blSearch"
              name="blSearch"
              aria-label="Search locations"
              autoComplete="off"
              type="text"
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 pl-10"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-900/50">
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Name</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Location ID</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">City</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Mobile</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Email</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Status</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredLocations.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-500">
                    <svg className="w-12 h-12 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-lg font-medium">No locations found</p>
                    <p className="text-sm">Click "Add Location" to create your first branch</p>
                  </td>
                </tr>
              ) : (
                filteredLocations.map(location => (
                  <tr key={location.id} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{location.name}</span>
                        {location.isPrimary && (
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                            Primary
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{location.locationId || '-'}</td>
                    <td className="px-4 py-3 text-slate-300">{location.city || '-'}</td>
                    <td className="px-4 py-3 text-slate-300">{location.mobile || '-'}</td>
                    <td className="px-4 py-3 text-slate-300">{location.email || '-'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleStatus(location.id)}
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          location.isActive !== false
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {location.isActive !== false ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(location)}
                          className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
                        >
                          Edit
                        </button>
                        {!location.isPrimary && (
                          <>
                            <button
                              onClick={() => handleSetPrimary(location.id)}
                              className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-sm hover:bg-amber-500/30 transition-colors"
                            >
                              Set Primary
                            </button>
                            <button
                              onClick={() => handleDelete(location.id)}
                              className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredLocations.length > 0 && (
          <div className="p-4 border-t border-slate-700/50 text-slate-400 text-sm">
            Showing {filteredLocations.length} of {businessLocations.length} locations
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800 z-10">
              <h2 className="text-xl font-bold text-white">
                {editingLocation ? 'Edit Location' : 'Add New Location'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="blName" className="block text-sm font-medium text-slate-300 mb-2">
                      Location Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="blName"
                      name="blName"
                      autoComplete="off"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      placeholder="e.g., Main Branch, Downtown Store"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="blLocationId" className="block text-sm font-medium text-slate-300 mb-2">
                      Location ID
                      <span className="ml-1 text-emerald-400 cursor-help" title="Unique identifier for this location">ⓘ</span>
                    </label>
                    <input
                      id="blLocationId"
                      name="blLocationId"
                      autoComplete="off"
                      type="text"
                      value={formData.locationId}
                      onChange={(e) => handleChange('locationId', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      placeholder="e.g., LOC-001"
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Address Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label htmlFor="blLandmark" className="block text-sm font-medium text-slate-300 mb-2">Landmark / Address</label>
                    <input
                      id="blLandmark"
                      name="blLandmark"
                      autoComplete="off"
                      type="text"
                      value={formData.landmark}
                      onChange={(e) => handleChange('landmark', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      placeholder="Street address or landmark"
                    />
                  </div>
                  <div>
                    <label htmlFor="blCity" className="block text-sm font-medium text-slate-300 mb-2">City</label>
                    <input
                      id="blCity"
                      name="blCity"
                      autoComplete="off"
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      placeholder="e.g., Lahore"
                    />
                  </div>
                  <div>
                    <label htmlFor="blState" className="block text-sm font-medium text-slate-300 mb-2">State / Province</label>
                    <select
                      id="blState"
                      name="blState"
                      value={formData.state}
                      onChange={(e) => handleChange('state', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">Select State</option>
                      {pakistanStates.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="blCountry" className="block text-sm font-medium text-slate-300 mb-2">Country</label>
                    <select
                      id="blCountry"
                      name="blCountry"
                      value={formData.country}
                      onChange={(e) => handleChange('country', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    >
                      {countries.map(country => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="blZipCode" className="block text-sm font-medium text-slate-300 mb-2">Zip / Postal Code</label>
                    <input
                      id="blZipCode"
                      name="blZipCode"
                      autoComplete="off"
                      type="text"
                      value={formData.zipCode}
                      onChange={(e) => handleChange('zipCode', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      placeholder="e.g., 54000"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="blMobile" className="block text-sm font-medium text-slate-300 mb-2">Mobile Number</label>
                    <input
                      id="blMobile"
                      name="blMobile"
                      autoComplete="off"
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) => handleChange('mobile', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      placeholder="e.g., 0300-1234567"
                    />
                  </div>
                  <div>
                    <label htmlFor="blAlternateNumber" className="block text-sm font-medium text-slate-300 mb-2">Alternate Number</label>
                    <input
                      id="blAlternateNumber"
                      name="blAlternateNumber"
                      autoComplete="off"
                      type="tel"
                      value={formData.alternateNumber}
                      onChange={(e) => handleChange('alternateNumber', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      placeholder="e.g., 042-1234567"
                    />
                  </div>
                  <div>
                    <label htmlFor="blEmail" className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                    <input
                      id="blEmail"
                      name="blEmail"
                      autoComplete="off"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      placeholder="location@example.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="blWebsite" className="block text-sm font-medium text-slate-300 mb-2">Website</label>
                    <input
                      id="blWebsite"
                      name="blWebsite"
                      autoComplete="off"
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleChange('website', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
              </div>

              {/* Custom Fields */}
              <div>
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  Custom Fields
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="blCustomField1" className="block text-sm font-medium text-slate-300 mb-2">Custom Field 1</label>
                    <input
                      id="blCustomField1"
                      name="blCustomField1"
                      autoComplete="off"
                      type="text"
                      value={formData.customField1}
                      onChange={(e) => handleChange('customField1', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="blCustomField2" className="block text-sm font-medium text-slate-300 mb-2">Custom Field 2</label>
                    <input
                      id="blCustomField2"
                      name="blCustomField2"
                      autoComplete="off"
                      type="text"
                      value={formData.customField2}
                      onChange={(e) => handleChange('customField2', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="blCustomField3" className="block text-sm font-medium text-slate-300 mb-2">Custom Field 3</label>
                    <input
                      id="blCustomField3"
                      name="blCustomField3"
                      autoComplete="off"
                      type="text"
                      value={formData.customField3}
                      onChange={(e) => handleChange('customField3', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="blCustomField4" className="block text-sm font-medium text-slate-300 mb-2">Custom Field 4</label>
                    <input
                      id="blCustomField4"
                      name="blCustomField4"
                      autoComplete="off"
                      type="text"
                      value={formData.customField4}
                      onChange={(e) => handleChange('customField4', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all"
                >
                  {editingLocation ? 'Update Location' : 'Add Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}