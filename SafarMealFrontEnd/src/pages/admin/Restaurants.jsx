import React, { useState, useEffect } from 'react';
import { Plus, Store, UserCheck, ShieldAlert, CheckCircle2, AlertTriangle, X, ShieldCheck } from 'lucide-react';
import api from '../../services/api';

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);

  // Form State
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [shopDesc, setShopDesc] = useState('');
  const [shopCuisines, setShopCuisines] = useState('');
  const [shopHouseNo, setShopHouseNo] = useState('');
  const [shopStreetName, setShopStreetName] = useState('');
  const [shopSociety, setShopSociety] = useState('');
  const [shopAddressLine, setShopAddressLine] = useState('');
  const [shopCity, setShopCity] = useState('');
  const [shopState, setShopState] = useState('');
  const [shopZip, setShopZip] = useState('');
  const [shopLat, setShopLat] = useState('26.2044');
  const [shopLng, setShopLng] = useState('78.1784');
  const [shopOpenTime, setShopOpenTime] = useState('09:00');
  const [shopCloseTime, setShopCloseTime] = useState('22:00');

  const fetchRestaurants = async () => {
    try {
      const { data } = await api.get('/admin/restaurants');
      if (data.success) {
        setRestaurants(data.data);
      }
    } catch (err) {
      console.error('Failed to load shop listings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const handleToggleStatus = async (id, currentApproved, currentSuspended, action) => {
    try {
      const payload = {};
      if (action === 'approve') payload.isApproved = !currentApproved;
      if (action === 'suspend') payload.isSuspended = !currentSuspended;

      const { data } = await api.put(`/admin/restaurants/${id}/status`, payload);
      if (data.success) {
        // Sync state
        setRestaurants(prev => prev.map(shop => shop._id === id ? data.data : shop));
        fetchRestaurants(); // Sync population
      }
    } catch (err) {
      console.error('Failed to alter restaurant status:', err);
    }
  };

  const handleCreateOwner = async (e) => {
    e.preventDefault();
    setBtnLoading(true);

    try {
      const combinedAddressLine = `${shopHouseNo ? shopHouseNo + ', ' : ''}${shopSociety ? shopSociety + ', ' : ''}${shopStreetName}`;
      const response = await api.post('/admin/shopowner', {
        name: ownerName,
        email: ownerEmail,
        phone: ownerPhone,
        password: ownerPassword,
        shopName,
        description: shopDesc,
        cuisines: shopCuisines.split(',').map(c => c.trim()),
        address: {
          houseNo: shopHouseNo,
          streetName: shopStreetName,
          society: shopSociety,
          addressLine: combinedAddressLine || shopAddressLine,
          city: shopCity,
          state: shopState,
          zipCode: shopZip,
          latitude: Number(shopLat),
          longitude: Number(shopLng)
        },
        openingTime: shopOpenTime,
        closingTime: shopCloseTime
      });

      if (response.data.success) {
        alert('Shop owner credentials generated! Restaurant auto-approved and added.');
        setModalOpen(false);
        // Reset form
        setOwnerName('');
        setOwnerEmail('');
        setOwnerPhone('');
        setOwnerPassword('');
        setShopName('');
        setShopDesc('');
        setShopCuisines('');
        setShopHouseNo('');
        setShopStreetName('');
        setShopSociety('');
        setShopAddressLine('');
        setShopCity('');
        setShopState('');
        setShopZip('');
        setShopLat('26.2044');
        setShopLng('78.1784');
        fetchRestaurants();
      }
    } catch (err) {
      alert(err.message || 'Failed to create partner account.');
    } finally {
      setBtnLoading(false);
    }
  };

  return (
    <div className="space-y-8 font-inter text-slate-100">
      {/* Title */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-poppins font-black text-2xl sm:text-3xl text-white">Shop Affiliate Accounts</h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">Approve, block or register multi-vendor restaurant profiles.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-glow transition"
        >
          <Plus size={16} /> Register Shop Owner
        </button>
      </div>

      {/* 1. RESTAURANTS DATA TABLE */}
      {loading ? (
        <div className="h-60 bg-slate-900 border border-slate-850 rounded-3xl shimmer-dark" />
      ) : (
        <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden shadow-premium">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-4">Shop details</th>
                  <th className="px-6 py-4">Owner Info</th>
                  <th className="px-6 py-4">Timings</th>
                  <th className="px-6 py-4">Approval status</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-xs text-slate-300 font-semibold">
                {restaurants.map((shop) => (
                  <tr key={shop._id} className="hover:bg-slate-850/30 transition">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <img
                        src={shop.logo || 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=60&q=80'}
                        alt={shop.shopName}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-800 bg-slate-850"
                      />
                      <div>
                        <h5 className="font-bold text-white text-sm leading-tight">{shop.shopName}</h5>
                        <p className="text-[10px] text-slate-500 max-w-[150px] truncate">{shop.description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white leading-tight">{shop.ownerId?.name || 'Partner Account'}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{shop.ownerId?.email || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span>{shop.openingTime} - {shop.closingTime}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-extrabold tracking-wide uppercase ${shop.isApproved ? (shop.isSuspended ? 'bg-red-950/40 text-red-400 border border-red-800/40' : 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40') : 'bg-amber-950/40 text-amber-400 border border-amber-800/40'}`}>
                        {shop.isApproved ? (shop.isSuspended ? 'Suspended' : 'Approved') : 'Pending Approval'}
                      </span>
                    </td>
                    <td className="px-6 py-4 space-x-2">
                      {/* Approve/Block */}
                      <button
                        onClick={() => handleToggleStatus(shop._id, shop.isApproved, shop.isSuspended, 'approve')}
                        className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition ${shop.isApproved ? 'border-amber-800 bg-amber-950/30 text-amber-400 hover:bg-amber-900/20' : 'border-emerald-800 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-900/20'}`}
                      >
                        {shop.isApproved ? 'Block' : 'Approve'}
                      </button>
                      
                      {/* Suspend Toggle */}
                      {shop.isApproved && (
                        <button
                          onClick={() => handleToggleStatus(shop._id, shop.isApproved, shop.isSuspended, 'suspend')}
                          className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition ${shop.isSuspended ? 'border-emerald-800 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-900/20' : 'border-red-800 bg-red-950/30 text-red-400 hover:bg-red-900/20'}`}
                        >
                          {shop.isSuspended ? 'Activate' : 'Suspend'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}

                {restaurants.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-10 text-slate-500">No restaurants registered. Please create one below!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. REGISTRATION OWNER ACCOUNT OVERLAY MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-premium text-left space-y-6 relative my-8 animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto">
            <button onClick={() => setModalOpen(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-850">
              <X size={16} />
            </button>

            <div className="space-y-1.5">
              <span className="flex items-center gap-1.5 text-xs font-bold text-purple-400 uppercase tracking-widest">
                <Store size={14} /> NEW SHOP REGISTRATION
              </span>
              <h3 className="font-poppins font-black text-white text-lg">Generate Credentials</h3>
            </div>

            <form onSubmit={handleCreateOwner} className="space-y-6">
              
              {/* Owner details */}
              <div className="space-y-3.5">
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1">1. Owner profile credentials</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text" placeholder="Full name (e.g. Monica)" required
                    value={ownerName} onChange={e => setOwnerName(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold px-4 py-3 rounded-xl focus:outline-none focus:border-purple-500 placeholder:text-slate-600"
                  />
                  <input
                    type="email" placeholder="Login Email" required
                    value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold px-4 py-3 rounded-xl focus:outline-none focus:border-purple-500 placeholder:text-slate-600"
                  />
                  <input
                    type="tel" placeholder="Phone Number" required
                    value={ownerPhone} onChange={e => setOwnerPhone(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold px-4 py-3 rounded-xl focus:outline-none focus:border-purple-500 placeholder:text-slate-600"
                  />
                  <input
                    type="password" placeholder="Generate Password" required
                    value={ownerPassword} onChange={e => setOwnerPassword(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold px-4 py-3 rounded-xl focus:outline-none focus:border-purple-500 placeholder:text-slate-600"
                  />
                </div>
              </div>

              {/* Restaurant details */}
              <div className="space-y-3.5">
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1">2. Restaurant Profile details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text" placeholder="Restaurant Name (e.g. Pasta Express)" required
                    value={shopName} onChange={e => setShopName(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold px-4 py-3 rounded-xl focus:outline-none focus:border-purple-500 placeholder:text-slate-600"
                  />
                  <input
                    type="text" placeholder="Cuisines split by commas (Burgers, Fast Food)" required
                    value={shopCuisines} onChange={e => setShopCuisines(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold px-4 py-3 rounded-xl focus:outline-none focus:border-purple-500 placeholder:text-slate-600"
                  />
                  <input
                    type="text" placeholder="Description of restaurant" required
                    value={shopDesc} onChange={e => setShopDesc(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold px-4 py-3 rounded-xl focus:outline-none focus:border-purple-500 placeholder:text-slate-600 sm:col-span-2"
                  />
                  <input
                    type="text" placeholder="House / Shop / Office No *" required
                    value={shopHouseNo} onChange={e => setShopHouseNo(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold px-4 py-3 rounded-xl focus:outline-none focus:border-purple-500 placeholder:text-slate-600"
                  />
                  <input
                    type="text" placeholder="Society / Building / Landmark"
                    value={shopSociety} onChange={e => setShopSociety(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold px-4 py-3 rounded-xl focus:outline-none focus:border-purple-500 placeholder:text-slate-600"
                  />
                  <input
                    type="text" placeholder="Street / Locality Name *" required
                    value={shopStreetName} onChange={e => setShopStreetName(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold px-4 py-3 rounded-xl focus:outline-none focus:border-purple-500 placeholder:text-slate-600 sm:col-span-2"
                  />
                  <input
                    type="text" placeholder="City" required
                    value={shopCity} onChange={e => setShopCity(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold px-4 py-3 rounded-xl focus:outline-none focus:border-purple-500 placeholder:text-slate-600"
                  />
                  <input
                    type="text" placeholder="State" required
                    value={shopState} onChange={e => setShopState(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold px-4 py-3 rounded-xl focus:outline-none focus:border-purple-500 placeholder:text-slate-600"
                  />
                  <input
                    type="text" placeholder="ZIP Code" required
                    value={shopZip} onChange={e => setShopZip(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold px-4 py-3 rounded-xl focus:outline-none focus:border-purple-500 placeholder:text-slate-600"
                  />
                  <div className="grid grid-cols-2 gap-2 sm:col-span-2">
                    <input
                      type="number" step="any" placeholder="Latitude (e.g. 26.2044) *" required
                      value={shopLat} onChange={e => setShopLat(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold px-4 py-3 rounded-xl focus:outline-none focus:border-purple-500 placeholder:text-slate-600 text-center"
                    />
                    <input
                      type="number" step="any" placeholder="Longitude (e.g. 78.1784) *" required
                      value={shopLng} onChange={e => setShopLng(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold px-4 py-3 rounded-xl focus:outline-none focus:border-purple-500 placeholder:text-slate-600 text-center"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text" placeholder="Open (e.g. 09:00)" required
                      value={shopOpenTime} onChange={e => setShopOpenTime(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold px-3 py-3 rounded-xl focus:outline-none focus:border-purple-500 placeholder:text-slate-600 text-center"
                    />
                    <input
                      type="text" placeholder="Close (e.g. 22:00)" required
                      value={shopCloseTime} onChange={e => setShopCloseTime(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold px-3 py-3 rounded-xl focus:outline-none focus:border-purple-500 placeholder:text-slate-600 text-center"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={btnLoading}
                className="w-full py-4 bg-purple-600 hover:bg-purple-700 active:scale-95 disabled:bg-slate-800 text-white font-bold text-xs rounded-2xl shadow-glow transition uppercase tracking-wider"
              >
                {btnLoading ? 'Saving Shop Owner Profile...' : 'Save & Register Shop'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Restaurants;
