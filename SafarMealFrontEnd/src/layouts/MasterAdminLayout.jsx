import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { LayoutDashboard, Store, Users, ClipboardList, Gift, LogOut, Menu, X, Shield, Eye } from 'lucide-react';
import { logout } from '../redux/authSlice';

const MasterAdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const navItems = [
    { label: 'System Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Shop Affiliates', path: '/admin/restaurants', icon: Store },
    { label: 'Registered Users', path: '/admin/users', icon: Users },
    { label: 'Global Orders', path: '/admin/orders', icon: ClipboardList },
    { label: 'Promo Coupons', path: '/admin/coupons', icon: Gift }
  ];

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-inter">
      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-sm" />
      )}

      {/* Sidebar Drawer */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-slate-900 border-r border-slate-800 transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-20 px-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-2.5 bg-brand-500 rounded-2xl text-white">
              <Shield size={20} strokeWidth={2.5} />
            </span>
            <span className="font-poppins font-extrabold text-xl tracking-tight text-white">
              Bite<span className="text-brand-500">Flow</span> <span className="text-[10px] text-purple-400 bg-purple-950/50 px-2 py-0.5 rounded-full border border-purple-800/40">HQ</span>
            </span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-2 text-slate-400 hover:text-white rounded-xl md:hidden">
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Nav links */}
        <nav className="flex-grow p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition ${isActive ? 'bg-purple-600 text-white shadow-glow' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'}`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Actions */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link to="/" className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-800 bg-slate-800/30 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <Eye size={14} /> Back to Website
          </Link>
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/20 transition">
            <LogOut size={14} /> Close Admin Desk
          </button>
        </div>
      </aside>

      {/* Main Core Container */}
      <div className="flex-grow md:pl-72 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-20 border-b border-slate-800 bg-slate-900 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-400 hover:text-white rounded-xl md:hidden">
              <Menu size={24} />
            </button>
            <h2 className="font-poppins font-bold text-lg text-white">Central Operations Center</h2>
          </div>

          <div className="flex items-center gap-3 border-l border-slate-800 pl-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-white">{user?.name}</p>
              <p className="text-[10px] text-purple-400 font-semibold uppercase tracking-wider">Super Administrator</p>
            </div>
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
              alt={user?.name}
              className="w-9 h-9 rounded-full object-cover border border-purple-700 bg-slate-800"
            />
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-grow p-6 md:p-8 bg-slate-950 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MasterAdminLayout;
