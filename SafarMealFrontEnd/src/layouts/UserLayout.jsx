import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ShoppingBag, User as UserIcon, LogOut, MapPin, Heart, Search, Menu, X, ArrowRight, ShieldCheck, Store, CheckCircle, Navigation } from 'lucide-react';
import { logout, updateProfileSuccess, openLoginModal } from '../redux/authSlice';
import api from '../services/api';
import Login from '../pages/auth/Login';

const UserLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { items, totalAmount } = useSelector((state) => state.cart);

  const handleSelectAddress = async (addressId) => {
    try {
      const { data } = await api.put(`/user/addresses/${addressId}`, { isDefault: true });
      if (data.success) {
        // Fetch updated profile
        const profileRes = await api.get('/auth/me');
        if (profileRes.data.success) {
          dispatch(updateProfileSuccess(profileRes.data.user));
        }
        setAddressModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to set default address:', err);
      alert('Failed to set active delivery location.');
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // OpenStreetMap Nominatim free reverse geocoding API
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          
          let houseNo = "";
          let streetName = "";
          let society = "";
          let city = "Manhattan";
          let state = "NY";
          let zipCode = "10001";
          
          if (data && data.address) {
            const addr = data.address;
            houseNo = addr.house_number || addr.building || "";
            streetName = addr.road || addr.suburb || addr.neighbourhood || `Coordinate (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
            society = addr.neighbourhood || addr.suburb || addr.suburb_district || "";
            city = addr.city || addr.town || addr.village || city;
            state = addr.state || state;
            zipCode = addr.postcode || zipCode;
          } else {
            streetName = `Coordinate (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
          }
          
          const combinedAddressLine = `${houseNo ? houseNo + ', ' : ''}${society ? society + ', ' : ''}${streetName}`;
          
          const payload = {
            label: 'Current Location',
            houseNo,
            streetName,
            society,
            addressLine: combinedAddressLine,
            city,
            state,
            zipCode,
            latitude,
            longitude,
            isDefault: true
          };
          
          const res = await api.post('/user/addresses', payload);
          if (res.data.success) {
            const profileRes = await api.get('/auth/me');
            if (profileRes.data.success) {
              dispatch(updateProfileSuccess(profileRes.data.user));
            }
            setAddressModalOpen(false);
          }
        } catch (err) {
          console.error("Geocoding failed, fallback to mock details", err);
          // Resilient fallback saving geolocated coordinates
          const payload = {
            label: 'Current Location',
            houseNo: 'GPS Mark',
            streetName: `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`,
            society: 'Local Area',
            addressLine: `Geolocated Coordinate (Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)})`,
            city: 'Local City',
            state: 'State',
            zipCode: '000000',
            latitude,
            longitude,
            isDefault: true
          };
          const res = await api.post('/user/addresses', payload);
          if (res.data.success) {
            const profileRes = await api.get('/auth/me');
            if (profileRes.data.success) {
              dispatch(updateProfileSuccess(profileRes.data.user));
            }
            setAddressModalOpen(false);
          }
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        setDetectingLocation(false);
        alert("Unable to retrieve location: " + error.message);
      }
    );
  };

  const totalCartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAf9] text-gray-800 font-inter">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 glass-panel shadow-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2">
                <span className="p-2.5 bg-brand-500 rounded-2xl shadow-glow text-white">
                  <ShoppingBag size={24} strokeWidth={2.5} />
                </span>
                <span className="font-poppins font-extrabold text-2xl tracking-tight text-gray-900">
                  SAFAR<span className="text-brand-500">MEAL</span>
                </span>
              </Link>

              {/* Saved Address Indicator */}
              {isAuthenticated && user?.addresses && (
                <div
                  onClick={() => setAddressModalOpen(true)}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200/80 rounded-full text-xs text-gray-600 transition cursor-pointer"
                >
                  <MapPin size={14} className="text-brand-500" />
                  <span className="font-medium max-w-[150px] truncate">
                    {user.addresses.find(a => a.isDefault)?.addressLine || user.addresses[0]?.addressLine || 'Set Delivery Address'}
                  </span>
                </div>
              )}
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/restaurants" className={`text-sm font-medium hover:text-brand-500 transition py-2 ${location.pathname === '/restaurants' ? 'text-brand-500 border-b-2 border-brand-500' : 'text-gray-600'}`}>
                Explore Restaurants
              </Link>
              
              {/* Conditional dashboards for roles */}
              {isAuthenticated && user?.role === 'admin' && (
                <Link to="/admin/dashboard" className="flex items-center gap-1.5 text-sm font-medium text-purple-600 hover:text-purple-700 py-1.5 px-3 bg-purple-50 rounded-full transition">
                  <ShieldCheck size={15} /> Admin Hub
                </Link>
              )}
              {isAuthenticated && user?.role === 'shopowner' && (
                <Link to="/shop/dashboard" className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 py-1.5 px-3 bg-blue-50 rounded-full transition">
                  <Store size={15} /> Manager Panel
                </Link>
              )}

              {/* Search Shortcut */}
              <Link to="/restaurants" className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition">
                <Search size={20} />
              </Link>

              {/* Cart Widget */}
              <Link to="/cart" className="relative p-2.5 text-gray-700 hover:text-brand-500 rounded-full hover:bg-brand-50 transition">
                <ShoppingBag size={20} />
                {totalCartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                    {totalCartCount}
                  </span>
                )}
              </Link>

              {/* Authentication Actions */}
              {isAuthenticated ? (
                <div className="flex items-center gap-4 border-l border-gray-200 pl-6">
                  <Link to="/profile" className="flex items-center gap-2 hover:opacity-85 transition">
                    <img
                      src={user.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}
                      alt={user.name}
                      className="w-9 h-9 rounded-full object-cover border-2 border-brand-100 shadow-sm"
                    />
                    <div className="hidden lg:block text-left">
                      <p className="text-xs font-semibold text-gray-800 leading-tight max-w-[80px] truncate">{user.name}</p>
                      <p className="text-[10px] text-gray-400 font-medium capitalize">{user.role}</p>
                    </div>
                  </Link>
                  <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition" title="Logout">
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 border-l border-gray-200 pl-6">
                  <button onClick={() => dispatch(openLoginModal())} className="text-sm font-semibold text-gray-600 hover:text-brand-500 transition px-3 py-2 cursor-pointer bg-transparent border-none outline-none">
                    Login
                  </button>
                  <Link to="/register" className="text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 px-4 py-2 rounded-xl transition shadow-sm hover:shadow-glow">
                    Sign Up
                  </Link>
                </div>
              )}
            </nav>

            {/* Mobile Menu Icon */}
            <div className="flex items-center gap-4 md:hidden">
              <Link to="/cart" className="relative p-2 text-gray-700">
                <ShoppingBag size={20} />
                {totalCartCount > 0 && (
                  <span className="absolute top-0 right-0 bg-brand-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                    {totalCartCount}
                  </span>
                )}
              </Link>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl">
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3">
            <Link to="/restaurants" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-xl text-gray-700 font-medium hover:bg-brand-50 hover:text-brand-500 transition">
              Explore Restaurants
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-xl text-gray-700 font-medium hover:bg-brand-50 hover:text-brand-500 transition">
                  My Profile & Orders
                </Link>
                {user?.role === 'admin' && (
                  <Link to="/admin/dashboard" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-xl text-purple-600 font-medium hover:bg-purple-50 transition">
                    Admin Dashboard
                  </Link>
                )}
                {user?.role === 'shopowner' && (
                  <Link to="/shop/dashboard" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-xl text-blue-600 font-medium hover:bg-blue-50 transition">
                    Restaurant Panel
                  </Link>
                )}
                <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-red-600 font-medium hover:bg-red-50 transition">
                  <LogOut size={16} /> Logout
                </button>
              </>
            ) : (
              <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-3">
                <button onClick={() => { dispatch(openLoginModal()); setMobileMenuOpen(false); }} className="w-full text-center py-2 border border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 text-sm cursor-pointer bg-transparent">
                  Login
                </button>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-2 bg-brand-500 rounded-xl font-semibold text-white hover:bg-brand-600 text-sm">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Outlet */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Premium Footer */}
      <footer className="bg-gray-950 text-gray-400 border-t border-gray-800 font-inter pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="p-2 bg-brand-500 rounded-2xl text-white">
                <ShoppingBag size={20} strokeWidth={2.5} />
              </span>
              <span className="font-poppins font-extrabold text-xl tracking-tight text-white">
                SAFAR<span className="text-brand-500">MEAL</span>
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
              Premium multi-vendor food delivery experience connecting you with the finest culinary establishments in Manhattan.
            </p>
          </div>

          <div>
            <h4 className="font-poppins font-bold text-white text-sm uppercase tracking-wider mb-4">Discover</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/restaurants" className="hover:text-white transition">Top Restaurants</Link></li>
              <li><Link to="/restaurants?cuisine=pizza" className="hover:text-white transition">Authentic Pizzas</Link></li>
              <li><Link to="/restaurants?cuisine=burger" className="hover:text-white transition">Gourmet Burgers</Link></li>
              <li><Link to="/restaurants?cuisine=desserts" className="hover:text-white transition">Fine Bakery & Cakes</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-poppins font-bold text-white text-sm uppercase tracking-wider mb-4">For Partners</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/register?role=shopowner" className="hover:text-white transition">Become a Shop Partner</Link></li>
              <li><button onClick={() => dispatch(openLoginModal())} className="hover:text-white transition text-left cursor-pointer bg-transparent border-none p-0 outline-none">Partner Dashboard Login</button></li>
              <li><Link to="/admin/dashboard" className="hover:text-white transition">Corporate Administrative Panel</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-poppins font-bold text-white text-sm uppercase tracking-wider mb-4">Craving Updates?</h4>
            <p className="text-sm text-gray-500 mb-4">Subscribe to our newsletter for exclusive weekly menus, recipe highlights, and discounts.</p>
            <div className="flex">
              <input type="email" placeholder="Your email address" className="w-full text-xs font-semibold px-4 py-2.5 rounded-l-xl bg-gray-900 border border-gray-800 text-white focus:outline-none focus:border-brand-500" />
              <button className="bg-brand-500 hover:bg-brand-600 text-white p-2.5 rounded-r-xl transition">
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-gray-900 flex flex-col md:flex-row items-center justify-between text-xs text-gray-600 gap-4">
          <p>© 2026 SAFARMEAL Technologies Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover:text-gray-400 transition cursor-pointer">Privacy Policy</span>
            <span className="hover:text-gray-400 transition cursor-pointer">Terms of Service</span>
            <span className="hover:text-gray-400 transition cursor-pointer">Cookie Settings</span>
          </div>
        </div>
      </footer>

      {/* Set Delivery Address Selection Modal */}
      {addressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-gray-200 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-xl relative animate-fade-in text-gray-800">
            <button
              onClick={() => setAddressModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-xl"
            >
              <X size={16} />
            </button>

            <div>
              <h3 className="font-poppins font-black text-lg text-gray-900">Select Delivery Location</h3>
              <p className="text-[10px] font-semibold text-gray-400 uppercase mt-0.5">Choose a saved address or detect current location</p>
            </div>

            {/* Geolocation Trigger */}
            <button
              onClick={handleDetectLocation}
              disabled={detectingLocation}
              className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-glow transition flex items-center justify-center gap-2"
            >
              <Navigation size={14} className={detectingLocation ? 'animate-spin' : ''} />
              {detectingLocation ? 'Detecting GPS Location...' : 'Detect Current Location (Lat/Lon)'}
            </button>

            {/* List of Saved Locations */}
            <div className="space-y-3">
              <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Saved Locations</label>
              
              {(!user?.addresses || user.addresses.length === 0) ? (
                <div className="text-center py-6 bg-gray-50 border border-dashed border-gray-250 rounded-2xl p-4">
                  <MapPin size={24} className="mx-auto text-gray-300 mb-1" />
                  <p className="text-[11px] text-gray-400 font-semibold">No saved addresses found. Please use Geolocation above or add an address in your Profile.</p>
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {user.addresses.map((addr) => (
                    <div
                      key={addr._id}
                      onClick={() => handleSelectAddress(addr._id)}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer flex justify-between items-center ${addr.isDefault ? 'border-brand-500 bg-brand-50/40' : 'border-gray-150 bg-white hover:border-gray-200'}`}
                    >
                      <div className="space-y-1 pr-4">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-gray-100 rounded text-[9px] font-black uppercase text-gray-500">{addr.label}</span>
                          {addr.latitude && addr.longitude && (
                            <span className="text-[9px] text-gray-400 font-semibold bg-gray-50 border border-gray-200/50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              GPS: {addr.latitude.toFixed(2)}, {addr.longitude.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-gray-800 truncate max-w-[280px]">{addr.addressLine}</p>
                        <p className="text-[10px] text-gray-400 font-semibold">{addr.city}, {addr.state} - {addr.zipCode}</p>
                      </div>
                      
                      {addr.isDefault && (
                        <span className="text-emerald-500 shrink-0">
                          <CheckCircle size={18} fill="currentColor" className="text-white fill-emerald-500" />
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <Link
                to="/profile?tab=addresses"
                onClick={() => setAddressModalOpen(false)}
                className="text-xs font-bold text-brand-500 hover:text-brand-600 transition"
              >
                Manage Saved Addresses in Profile →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Global Login Modal */}
      <Login />
    </div>
  );
};

export default UserLayout;
