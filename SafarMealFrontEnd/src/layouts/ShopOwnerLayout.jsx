import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { LayoutDashboard, Utensils, ClipboardList, TrendingUp, UserCog, LogOut, ArrowLeft, Menu, X, ShoppingBag, Eye, ShieldCheck, Gift } from 'lucide-react';
import { logout } from '../redux/authSlice';
import api from '../services/api';

const ShopOwnerLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [restaurantName, setRestaurantName] = useState('My Restaurant');
  const [logo, setLogo] = useState('');
  const [isApproved, setIsApproved] = useState(true);
  const [isSuspended, setIsSuspended] = useState(false);

  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    // Fetch basic profile details for sidebar logo/name
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/shop/profile');
        if (data.success && data.data) {
          setRestaurantName(data.data.shopName);
          setLogo(data.data.logo);
          setIsApproved(data.data.isApproved);
          setIsSuspended(data.data.isSuspended);
        }
      } catch (err) {
        console.error('Failed to load shop details for layout:', err);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const navItems = [
    { label: 'Overview', path: '/shop/dashboard', icon: LayoutDashboard },
    { label: 'Live Orders', path: '/shop/orders', icon: ClipboardList },
    { label: 'Menu Catalog', path: '/shop/menu', icon: Utensils },
    { label: 'Promo Coupons', path: '/shop/coupons', icon: Gift },
    { label: 'Earnings & Analytics', path: '/shop/analytics', icon: TrendingUp },
    { label: 'Restaurant Settings', path: '/shop/settings', icon: UserCog }
  ];

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-inter relative overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-sm" />
      )}

      {/* Sidebar Component */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-slate-950/70 border-r border-slate-900/60 backdrop-blur-2xl transition-transform duration-300 md:translate-x-0 shadow-2xl shadow-black/80 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Brand Logo header */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-slate-900/50 bg-slate-950/20">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="p-2 bg-gradient-to-tr from-brand-500 to-indigo-500 rounded-2xl text-white shadow-lg shadow-brand-500/20 transition-transform duration-300 group-hover:scale-105">
              <ShoppingBag size={20} strokeWidth={2.5} className="animate-pulse" />
            </span>
            <span className="font-poppins font-black text-xl tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
              SAFAR<span className="text-brand-500">MEAL</span>
            </span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="p-2 text-slate-400 hover:text-white rounded-xl md:hidden hover:bg-slate-900/50 transition">
            <X size={20} />
          </button>
        </div>

        {/* Restaurant Badge Info */}
        <div className="p-6 border-b border-slate-900/50 bg-slate-950/10">
          <div className="flex items-center gap-3">
            <img
              src={logo || 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=80&q=80'}
              alt={restaurantName}
              className="w-12 h-12 rounded-2xl object-cover border border-slate-800/80 bg-slate-900 shadow-md"
            />
            <div className="truncate">
              <h4 className="font-bold text-sm text-white truncate leading-tight">{restaurantName}</h4>
              <p className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping"></span>
                Active Partner
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`group relative flex items-center gap-3.5 px-4.5 py-3 rounded-xl text-xs font-bold transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/25 border border-brand-450/20'
                    : 'text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-brand-400 rounded-r-full shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
                )}
                <Icon size={16} className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Return / Logout Action Footer */}
        <div className="p-4 border-t border-slate-900/50 space-y-2 bg-slate-950/10">
          <Link to="/restaurants" className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-900/60 bg-slate-900/20 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900 transition-all">
            <Eye size={13} /> Customer View
          </Link>
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-950/10 transition-all">
            <LogOut size={13} /> Exit Partner Suite
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-grow md:pl-72 flex flex-col min-h-screen relative z-10">
        {/* Top Header */}
        <header className="h-20 border-b border-slate-900/50 bg-slate-950/40 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-400 hover:text-white rounded-xl md:hidden hover:bg-slate-900/50 transition">
              <Menu size={22} />
            </button>
            <h2 className="font-poppins font-black text-base tracking-wide text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">PARTNER CONTROL CENTRE</h2>
          </div>

          <div className="flex items-center gap-3 border-l border-slate-900 pl-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-white">{user?.name}</p>
              <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Owner Account</p>
            </div>
            <img
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"
              alt={user?.name}
              className="w-9 h-9 rounded-full object-cover border border-slate-800 bg-slate-900 shadow-inner"
            />
          </div>
        </header>

        {/* Page Content Outlet */}
        <main className="flex-grow p-6 md:p-8 bg-slate-950 overflow-x-hidden relative">
          {/* Dynamic Workspace Radial Glows */}
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-brand-500/[0.02] rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute bottom-20 -left-40 w-[600px] h-[600px] bg-indigo-500/[0.02] rounded-full blur-[140px] pointer-events-none" />
          
          <div className="relative z-10 h-full flex items-center justify-center">
            {(!isApproved || isSuspended) ? (
              <div className="max-w-md mx-auto text-center space-y-6 bg-slate-900/60 border border-slate-850 p-8 rounded-3xl backdrop-blur-md shadow-2xl animate-fade-in my-12">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto border shadow-inner ${isSuspended ? 'bg-red-950/30 border-red-800/40 text-red-400' : 'bg-amber-950/30 border-amber-800/40 text-amber-400'}`}>
                  <ShieldCheck size={28} className={isSuspended ? '' : 'animate-pulse'} />
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-poppins font-black text-lg text-white">
                    {isSuspended ? 'Affiliate Suspended' : 'Restaurant Pending Approval'}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                    {isSuspended
                      ? 'Your partner account has been suspended by the operational managers. Please contact SAFARMEAL Super Admin support to appeal.'
                      : 'Your gourmet restaurant account is under active operational review. Our master administrative officers will verify your menu catalog and activate your merchant console shortly.'}
                  </p>
                </div>
                
                <div className="pt-4 flex flex-col gap-2">
                  <button
                    onClick={handleLogout}
                    className="w-full py-3 bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs rounded-xl transition"
                  >
                    Logout Account
                  </button>
                </div>
              </div>
            ) : (
              <Outlet />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ShopOwnerLayout;
