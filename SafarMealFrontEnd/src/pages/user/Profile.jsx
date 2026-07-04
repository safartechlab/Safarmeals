import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { User, MapPin, ClipboardList, Phone, Mail, Edit, Star, Save, Trash2, ShieldAlert, Award, Compass, Eye, CheckCircle, Plus } from 'lucide-react';
import api from '../../services/api';
import { updateProfileSuccess } from '../../redux/authSlice';

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTabState] = useState('orders');

  useEffect(() => {
    const tabQuery = searchParams.get('tab');
    if (tabQuery && ['orders', 'addresses', 'details'].includes(tabQuery)) {
      setActiveTabState(tabQuery);
    } else if (!tabQuery) {
      setActiveTabState('orders');
    }
  }, [searchParams]);

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    setSearchParams({ tab });
  };
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Edit Profile Form state
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileFile, setProfileFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState(user?.profileImage || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Saved Addresses state
  const [addressLabel, setAddressLabel] = useState('Home');
  const [houseNo, setHouseNo] = useState('');
  const [streetName, setStreetName] = useState('');
  const [society, setSociety] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressState, setAddressState] = useState('');
  const [addressZip, setAddressZip] = useState('');
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [addingAddress, setAddingAddress] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);

  const handleAddAddressClick = () => {
    setEditingAddressId(null);
    setAddressLabel('Home');
    setHouseNo('');
    setStreetName('');
    setSociety('');
    setAddressLine('');
    setAddressCity('');
    setAddressState('');
    setAddressZip('');
    setLatitude(0);
    setLongitude(0);
    setAddressModalOpen(true);
  };

  const handleEditAddressClick = (addr) => {
    setEditingAddressId(addr._id);
    setAddressLabel(addr.label);
    setHouseNo(addr.houseNo || '');
    setStreetName(addr.streetName || '');
    setSociety(addr.society || '');
    setAddressLine(addr.addressLine);
    setAddressCity(addr.city);
    setAddressState(addr.state);
    setAddressZip(addr.zipCode);
    setLatitude(addr.latitude || 0);
    setLongitude(addr.longitude || 0);
    setAddressModalOpen(true);
  };

  // Review Dialog state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewShopId, setReviewShopId] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Success/Error alerts
  const [successAlert, setSuccessAlert] = useState('');
  const [errorAlert, setErrorAlert] = useState('');

  // Synchronize authenticated user profile details on load
  const syncProfile = async () => {
    try {
      const { data } = await api.get('/auth/me');
      if (data.success) {
        dispatch(updateProfileSuccess(data.user));
      }
    } catch (err) {
      console.error('Failed to sync auth user profile:', err);
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const { data } = await api.get('/orders');
      if (data.success) {
        setOrders(data.data);
      }
    } catch (err) {
      console.error('Failed to load user orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    syncProfile();
    fetchOrders();
  }, []);

  // Update profile
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setSuccessAlert('');
    setErrorAlert('');

    try {
      const formData = new FormData();
      formData.append('name', profileName);
      formData.append('phone', profilePhone);
      if (profileFile) {
        formData.append('profileImage', profileFile);
      }

      const { data } = await api.put('/auth/profile', formData);
      if (data.success) {
        dispatch(updateProfileSuccess(data.user));
        setSuccessAlert('Your personal profile details were updated.');
        // Refresh preview with actual saved URL
        setProfilePreview(data.user.profileImage || profilePreview);
      }
    } catch (err) {
      console.error(err);
      setErrorAlert('Could not save details.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleProfileFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileFile(file);
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  // Add or Edit Address
  const handleAddAddress = async (e) => {
    e.preventDefault();
    setAddingAddress(true);
    try {
      const combinedAddressLine = `${houseNo ? houseNo + ', ' : ''}${society ? society + ', ' : ''}${streetName}`;
      const payload = {
        label: addressLabel,
        houseNo,
        streetName,
        society,
        addressLine: combinedAddressLine || addressLine,
        city: addressCity,
        state: addressState,
        zipCode: addressZip,
        latitude: Number(latitude),
        longitude: Number(longitude)
      };

      let success = false;
      if (editingAddressId) {
        const { data } = await api.put(`/user/addresses/${editingAddressId}`, payload);
        success = data.success;
      } else {
        const { data } = await api.post('/user/addresses', payload);
        success = data.success;
      }

      if (success) {
        // Reload profile to fetch updated address list
        await syncProfile();
        
        // Reset form
        setHouseNo('');
        setStreetName('');
        setSociety('');
        setAddressLine('');
        setAddressCity('');
        setAddressState('');
        setAddressZip('');
        setLatitude(0);
        setLongitude(0);
        setEditingAddressId(null);
        setAddressModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      alert(editingAddressId ? 'Failed to update address.' : 'Failed to save address.');
    } finally {
      setAddingAddress(false);
    }
  };

  // Delete Address
  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Delete this delivery address coordinates?')) return;
    try {
      const { data } = await api.delete(`/user/addresses/${addressId}`);
      if (data.success) {
        await syncProfile();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to remove address.');
    }
  };

  // Open Review Dialog
  const openReviewDialog = (shopId) => {
    setReviewShopId(shopId);
    setReviewRating(5);
    setReviewComment('');
    setReviewModalOpen(true);
  };

  // Submit Review
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewSubmitting(true);
    try {
      const { data } = await api.post(`/user/restaurants/${reviewShopId}/reviews`, {
        rating: reviewRating,
        comment: reviewComment
      });
      if (data.success) {
        alert('Thank you for sharing your dining experience review!');
        setReviewModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to post review. Ensure you have not already reviewed this restaurant.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-inter text-gray-800">
      
      {/* 1. HERO PROFILE CARD */}
      <div className="glass-panel border border-gray-200/50 p-6 sm:p-8 rounded-3xl mb-8 flex flex-col sm:flex-row items-center gap-6 shadow-sm">
        <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-md bg-brand-100 flex-shrink-0">
          <img
            src={user?.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
            alt={user?.name}
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="text-center sm:text-left space-y-1 flex-grow">
          <h2 className="font-poppins font-black text-2xl text-gray-900 leading-tight">{user?.name}</h2>
          <p className="text-xs font-semibold text-gray-400 capitalize">{user?.role} Account</p>
          
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-2 pt-3 text-xs text-gray-500 font-semibold">
            <span className="flex items-center gap-1"><Mail size={14} className="text-brand-500" /> {user?.email}</span>
            {user?.phone && <span className="flex items-center gap-1"><Phone size={14} className="text-brand-500" /> {user?.phone}</span>}
          </div>
        </div>

        {user?.role === 'shopowner' && (
          <Link
            to="/shop/dashboard"
            className="px-5 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow-glow transition"
          >
            Enter Partner Console
          </Link>
        )}
        {user?.role === 'admin' && (
          <Link
            to="/admin/dashboard"
            className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-glow transition"
          >
            Open Admin Dashboard
          </Link>
        )}
      </div>

      {successAlert && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-700 font-bold mb-6">
          {successAlert}
        </div>
      )}

      {/* 2. TABBED LAYOUT CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column: Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-1">
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition ${activeTab === 'orders' ? 'bg-brand-500 text-white shadow-glow' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <ClipboardList size={16} /> Order History
          </button>
          
          <button
            onClick={() => setActiveTab('addresses')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition ${activeTab === 'addresses' ? 'bg-brand-500 text-white shadow-glow' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <MapPin size={16} /> Saved Locations
          </button>

          <button
            onClick={() => setActiveTab('details')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition ${activeTab === 'details' ? 'bg-brand-500 text-white shadow-glow' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <User size={16} /> Profile Details
          </button>
        </div>

        {/* Right Column: Tab View Outlet */}
        <div className="lg:col-span-3">
          
          {/* TAB 1: ORDER HISTORY HISTORY */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h3 className="font-poppins font-black text-lg text-gray-900 border-b border-gray-100 pb-3">My Orders History</h3>
              
              {ordersLoading ? (
                <div className="space-y-4">
                  {[1, 2].map(n => <div key={n} className="h-32 bg-gray-250 rounded-2xl shimmer" />)}
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-16 bg-white border border-gray-200/60 rounded-3xl">
                  <Compass size={48} className="mx-auto text-gray-300 mb-3" />
                  <h4 className="font-poppins font-bold text-sm text-gray-800">No orders placed yet</h4>
                  <p className="text-xs text-gray-400 mt-1 mb-6">Explore the finest culinary establishments and place your first order!</p>
                  <Link to="/restaurants" className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl transition">Explore Restaurants</Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => {
                    const formattedDate = new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
                    const isFulfillableForReview = ['Delivered'].includes(order.orderStatus);
                    const isActiveOrder = ['Pending', 'Accepted', 'Preparing', 'Out for Delivery'].includes(order.orderStatus);

                    return (
                      <div key={order._id} className="bg-white border border-gray-200/50 p-5 rounded-3xl shadow-sm flex flex-col justify-between space-y-4 hover:border-gray-300 transition">
                        {/* Upper row: Shop name, date, invoice */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={order.shopId?.logo || 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=40&q=80'}
                              alt={order.shopId?.shopName}
                              className="w-10 h-10 rounded-xl object-cover border border-gray-150"
                            />
                            <div>
                              <h4 className="font-poppins font-black text-sm text-gray-900 leading-tight">
                                {order.shopId?.shopName || 'Deactivated Merchant'}
                              </h4>
                              <p className="text-[10px] text-gray-400 font-semibold pt-0.5">{formattedDate} • Ticket ID #...{order._id.slice(-6).toUpperCase()}</p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-sm font-black text-gray-950 block">₹{order.totalAmount}</span>
                            <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded mt-1.5 ${['Delivered'].includes(order.orderStatus) ? 'bg-emerald-50 text-emerald-600' : ['Rejected', 'Cancelled'].includes(order.orderStatus) ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500 animate-pulse'}`}>
                              {order.orderStatus}
                            </span>
                          </div>
                        </div>

                        {/* Middle row: List items */}
                        <div className="bg-gray-50/60 p-3 rounded-2xl border border-gray-100 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-gray-500">
                          {order.items.map((item, idx) => (
                            <span key={idx}>
                              {item.name} <span className="text-brand-500 text-[10px]">x{item.quantity}</span>
                            </span>
                          ))}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <div className="flex flex-col text-left">
                            <span className="text-[10px] text-gray-400 font-semibold">Payment: {order.paymentMethod} ({order.paymentStatus})</span>
                            {order.deliveryOTP && (order.orderStatus !== 'Delivered' && order.orderStatus !== 'Cancelled' && order.orderStatus !== 'Rejected') && (
                              <span className="text-[10.5px] text-brand-600 font-extrabold mt-1.5 uppercase tracking-wide">Delivery OTP: {order.deliveryOTP}</span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {isActiveOrder && (
                              <Link
                                to={`/orders/${order._id}`}
                                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-glow transition"
                              >
                                Live Track Order
                              </Link>
                            )}

                            {!isActiveOrder && (
                              <Link
                                to={`/orders/${order._id}`}
                                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-bold rounded-xl transition"
                              >
                                View Receipt
                              </Link>
                            )}

                            {isFulfillableForReview && (
                              <button
                                onClick={() => openReviewDialog(order.shopId?._id)}
                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-glow transition"
                              >
                                Leave a Review
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SAVED LOCATIONS */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="font-poppins font-black text-lg text-gray-900">Saved Coordinates</h3>
                <button
                  onClick={handleAddAddressClick}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow-glow transition flex items-center gap-1"
                >
                  <Plus size={14} /> Add Address
                </button>
              </div>

              {user?.addresses?.length === 0 ? (
                <div className="text-center py-12 bg-white border border-gray-250/60 rounded-3xl">
                  <MapPin size={40} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-xs text-gray-400 font-semibold">No delivery coordinates saved. Add one to checkout faster!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {user?.addresses?.map((addr) => (
                    <div key={addr._id} className="bg-white border border-gray-200/50 p-5 rounded-3xl shadow-sm flex flex-col justify-between hover:border-gray-300 transition">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="px-2.5 py-0.5 bg-gray-100 rounded-lg text-[9px] font-black uppercase text-gray-500">{addr.label}</span>
                          {addr.isDefault && <span className="text-[9px] text-emerald-600 font-black flex items-center gap-0.5"><CheckCircle size={10} /> Default</span>}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-800 leading-relaxed">{addr.addressLine}</p>
                          <p className="text-[11px] text-gray-400 font-semibold">{addr.city}, {addr.state} - {addr.zipCode}</p>
                          {addr.latitude !== undefined && addr.longitude !== undefined && (
                            <p className="text-[9px] text-slate-400 font-bold bg-slate-50 border border-slate-200/50 px-2 py-0.5 rounded inline-block mt-1">
                              GPS Coordinate: {addr.latitude.toFixed(4)}, {addr.longitude.toFixed(4)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-end pt-4 mt-2 border-t border-gray-100">
                        <button
                          onClick={() => handleEditAddressClick(addr)}
                          className="p-2 text-gray-400 hover:text-brand-500 hover:bg-brand-55 rounded-xl transition mr-2"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(addr._id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ACCOUNT DETAILS */}
          {activeTab === 'details' && (
            <div className="bg-white border border-gray-250/60 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
              <h3 className="font-poppins font-black text-lg text-gray-900 border-b border-gray-100 pb-3">Update Profile</h3>
              
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Upload Preview avatar */}
                  <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-brand-100 shadow bg-brand-50">
                    <img src={profilePreview || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'} alt="Avatar Preview" className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="space-y-1 flex-grow">
                    <label className="text-[10px] font-extrabold text-gray-400 block uppercase">PROFILE AVATAR</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileFileChange}
                      className="text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-gray-400 block uppercase">FULL NAME</label>
                    <input
                      type="text"
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full text-xs font-semibold px-4 py-3 border border-gray-200 text-gray-800 bg-gray-50/50 rounded-xl focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-gray-400 block uppercase">PHONE NUMBER</label>
                    <input
                      type="text"
                      required
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="w-full text-xs font-semibold px-4 py-3 border border-gray-200 text-gray-800 bg-gray-50/50 rounded-xl focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="px-6 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-glow flex items-center gap-1.5 transition ml-auto"
                >
                  <Save size={14} />
                  {updatingProfile ? 'Saving Details...' : 'Save Profile Changes'}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>

      {/* Saved Addresses Modal popup */}
      {addressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-gray-200 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-xl relative animate-fade-in text-gray-800">
            <button
              onClick={() => setAddressModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-xl"
            >
              <Trash2 size={16} />
            </button>

            <div>
              <h3 className="font-poppins font-black text-lg text-gray-900">{editingAddressId ? 'Edit Delivery Address' : 'Add New Delivery Address'}</h3>
              <p className="text-[10px] font-semibold text-gray-400 uppercase mt-0.5">{editingAddressId ? 'Modify delivery markers' : 'Specify delivery markers'}</p>
            </div>

            <form onSubmit={handleAddAddress} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-gray-400">Address Label</label>
                <select
                  value={addressLabel}
                  onChange={(e) => setAddressLabel(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-gray-200 rounded-xl bg-white"
                >
                  <option value="Home">Home</option>
                  <option value="Work">Work</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-gray-400">House / Flat / Block No *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flat 104, Block A"
                  value={houseNo}
                  onChange={(e) => setHouseNo(e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-2.5 border border-gray-200 text-gray-800 rounded-xl focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-gray-400">Society / Building / Landmark</label>
                <input
                  type="text"
                  placeholder="e.g. Silver Oak Society"
                  value={society}
                  onChange={(e) => setSociety(e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-2.5 border border-gray-200 text-gray-800 rounded-xl focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-gray-400">Street / Locality Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Road, Sector 7"
                  value={streetName}
                  onChange={(e) => setStreetName(e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-2.5 border border-gray-200 text-gray-800 rounded-xl focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-gray-400">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="New York"
                    value={addressCity}
                    onChange={(e) => setAddressCity(e.target.value)}
                    className="w-full text-xs font-semibold px-4 py-2.5 border border-gray-200 text-gray-800 rounded-xl focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-gray-400">State *</label>
                  <input
                    type="text"
                    required
                    placeholder="NY"
                    value={addressState}
                    onChange={(e) => setAddressState(e.target.value)}
                    className="w-full text-xs font-semibold px-4 py-2.5 border border-gray-200 text-gray-800 rounded-xl focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-gray-400">Zip Code *</label>
                <input
                  type="text"
                  required
                  placeholder="10001"
                  value={addressZip}
                  onChange={(e) => setAddressZip(e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-2.5 border border-gray-200 text-gray-800 rounded-xl focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-gray-400">GPS Latitude *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={latitude}
                    onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-semibold px-4 py-2.5 border border-gray-200 text-gray-800 rounded-xl focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-gray-400">GPS Longitude *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={longitude}
                    onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-semibold px-4 py-2.5 border border-gray-200 text-gray-800 rounded-xl focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAddressModalOpen(false)}
                  className="flex-1 py-3 border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingAddress}
                  className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-glow transition"
                >
                  {addingAddress ? 'Saving...' : editingAddressId ? 'Save Changes' : 'Add Coordinates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Write a Review Modal Popup */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-gray-200 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-xl relative animate-fade-in text-gray-800">
            <button
              onClick={() => setReviewModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-xl"
            >
              <Trash2 size={16} />
            </button>

            <div>
              <h3 className="font-poppins font-black text-lg text-gray-900">Review Dining Experience</h3>
              <p className="text-[10px] font-semibold text-gray-400 uppercase mt-0.5">Rate your recent food delivery</p>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              {/* Star selection */}
              <div className="space-y-1.5 text-center">
                <label className="text-[10px] font-extrabold text-gray-400 block uppercase">YOUR RATING</label>
                <div className="flex justify-center gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="transition transform hover:scale-125"
                    >
                      <Star
                        size={26}
                        className={star <= reviewRating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment text */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-gray-400">Comments / Feedback *</label>
                <textarea
                  required
                  rows="4"
                  placeholder="Describe your review of the taste, freshness, speed..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-2.5 border border-gray-200 text-gray-800 rounded-xl focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="flex-1 py-3 border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-glow transition"
                >
                  {reviewSubmitting ? 'Posting...' : 'Post Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;
