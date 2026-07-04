import React, { useState, useEffect } from 'react';
import { Search, ClipboardList, Clock, CheckCircle, Truck, RefreshCw, XCircle, ChevronRight, Phone, MessageSquare, AlertCircle, ShoppingBag, User, DollarSign, Activity, Hash, MapPin, CreditCard, X, ChevronLeft, ArrowRight, ShieldCheck, Map, ArrowLeft, Utensils } from 'lucide-react';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';

const Orders = () => {
  const socket = useSocket();
  const [orders, setOrders] = useState([]);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [activeNotification, setActiveNotification] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [deliveryOTP, setDeliveryOTP] = useState('');
  const [otpVerificationError, setOtpVerificationError] = useState('');

  const fetchOrdersAndProfile = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    
    try {
      // 1. Fetch shop profile to know the ID
      const profileRes = await api.get('/shop/profile');
      if (profileRes.data.success) {
        const shopDetails = profileRes.data.data;
        setShop(shopDetails);

        // 2. Fetch orders
        const ordersRes = await api.get('/shop/orders');
        if (ordersRes.data.success) {
          setOrders(ordersRes.data.data);
        }
      }
    } catch (err) {
      console.error('Error fetching live order registry:', err);
      setError('Could not fetch active checkout records. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrdersAndProfile();
  }, []);

  // Socket Connection and Real-Time Receivers
  useEffect(() => {
    if (socket && shop?._id) {
      const room = `shop_${shop._id}`;
      socket.emit('join_room', room);
      console.log(`Joined Shop Room: ${room}`);

      // Handle new order socket broadcast
      const handleNewOrder = (data) => {
        console.log('Real-Time Order Received via Socket:', data);
        
        // Append order to list immediately
        setOrders(prevOrders => [data.order, ...prevOrders]);
        
        // Trigger a visual alert notification
        setActiveNotification({
          orderId: data.orderId,
          message: data.message || 'A customer has placed a new order!',
          order: data.order
        });

        // Hide alert after 8 seconds
        setTimeout(() => {
          setActiveNotification(null);
        }, 8000);
      };

      // Handle generic dashboard updates
      const handleRefresh = () => {
        fetchOrdersAndProfile(true);
      };

      socket.on('new_order', handleNewOrder);
      socket.on('shop_dashboard_refresh', handleRefresh);

      return () => {
        socket.off('new_order', handleNewOrder);
        socket.off('shop_dashboard_refresh', handleRefresh);
      };
    }
  }, [socket, shop?._id]);

  // Sync selectedOrder on updates
  useEffect(() => {
    if (selectedOrder && orders.length > 0) {
      const updated = orders.find(o => o._id === selectedOrder._id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedOrder)) {
        setSelectedOrder(updated);
      }
    }
  }, [orders, selectedOrder]);

  const getFilteredOrders = () => {
    switch (activeTab) {
      case 'pending':
        return orders.filter(o => o.orderStatus === 'Pending');
      case 'preparing':
        return orders.filter(o => ['Accepted', 'Preparing', 'Ready for Pickup'].includes(o.orderStatus));
      case 'transit':
        return orders.filter(o => ['Picked Up', 'Out for Delivery'].includes(o.orderStatus));
      case 'completed':
        return orders.filter(o => ['Delivered', 'Rejected', 'Cancelled'].includes(o.orderStatus));
      case 'active':
        return orders.filter(o => ['Pending', 'Accepted', 'Preparing', 'Ready for Pickup', 'Picked Up', 'Out for Delivery'].includes(o.orderStatus));
      case 'all':
      default:
        return orders;
    }
  };

  // Base list filtered by search term
  const baseFiltered = getFilteredOrders();
  const filteredList = baseFiltered.filter(o => 
    o._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.userId?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Auto-select first order of the filtered stack
  useEffect(() => {
    if (filteredList.length > 0) {
      if (!selectedOrder || !filteredList.some(o => o._id === selectedOrder._id)) {
        setSelectedOrder(filteredList[0]);
      }
    } else {
      setSelectedOrder(null);
    }
  }, [activeTab, searchTerm, orders.length]);

  // Update order status
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const { data } = await api.put(`/shop/orders/${orderId}/status`, {
        status: newStatus
      });
      if (data.success) {
        // Update local state
        setOrders(prev => prev.map(ord => ord._id === orderId ? { ...ord, orderStatus: newStatus } : ord));
      }
    } catch (err) {
      console.error('Failed to change order flow state:', err);
      alert('Could not update order status. Please check api.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-10 w-48 bg-slate-900 rounded-xl shimmer-dark" />
          <div className="h-10 w-24 bg-slate-900 rounded-xl shimmer-dark" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-96 bg-slate-900 rounded-3xl shimmer-dark" />
          ))}
        </div>
      </div>
    );
  }

  // Filter columns and compute counts
  const pendingCount = orders.filter(o => o.orderStatus === 'Pending').length;
  const preparingCount = orders.filter(o => ['Accepted', 'Preparing', 'Ready for Pickup'].includes(o.orderStatus)).length;
  const transitCount = orders.filter(o => ['Picked Up', 'Out for Delivery'].includes(o.orderStatus)).length;
  const completedCount = orders.filter(o => ['Delivered', 'Rejected', 'Cancelled'].includes(o.orderStatus)).length;
  const activeCount = orders.filter(o => ['Pending', 'Accepted', 'Preparing', 'Ready for Pickup', 'Picked Up', 'Out for Delivery'].includes(o.orderStatus)).length;
  const allCount = orders.length;

  return (
    <div className="space-y-6 font-inter text-slate-100 relative max-h-screen">
      {/* Dynamic Background Ambiance Blurs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Embed local styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-thin::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.05);
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.2);
          border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.4);
        }
        .shimmer-dark {
          background: linear-gradient(90deg, #0f172a 25%, #1e293b 50%, #0f172a 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}} />

      {/* Real-time Toast banner overlay */}
      {activeNotification && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900/95 backdrop-blur-xl border border-brand-500/60 p-5 rounded-3xl shadow-glow shadow-brand-500/20 animate-bounce flex gap-4">
          <span className="p-3 bg-brand-950 text-brand-500 rounded-2xl h-fit border border-brand-900/40 animate-pulse shrink-0">
            <ShoppingBag size={18} />
          </span>
          <div className="flex-grow space-y-1">
            <h4 className="font-poppins font-black text-sm text-white">New Order Alert!</h4>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed">{activeNotification.message}</p>
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => {
                  handleUpdateStatus(activeNotification.orderId, 'Accepted');
                  setActiveNotification(null);
                }}
                className="px-3.5 py-1.5 bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 hover:to-amber-600 text-[10px] font-black text-white rounded-lg shadow-md transition"
              >
                Accept Instantly
              </button>
              <button
                onClick={() => setActiveNotification(null)}
                className="px-3.5 py-1.5 border border-slate-850 hover:bg-slate-800 text-[10px] font-bold rounded-lg text-slate-400 transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-poppins font-black text-2xl sm:text-3xl text-white tracking-tight">Live Orders Board</h1>
            <span className="px-2.5 py-0.5 bg-emerald-950/60 border border-emerald-900/50 rounded-full text-[9px] font-bold text-emerald-400 flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span> Live
            </span>
          </div>
          <p className="text-xs text-slate-450 font-semibold mt-1">Spacious split-pane master-detail live tracking cockpit. Click on left cards to manage order operations.</p>
        </div>

        <button
          onClick={() => fetchOrdersAndProfile(true)}
          className="flex items-center gap-2 px-4.5 py-2 bg-slate-900/80 hover:bg-slate-850/80 border border-slate-800 rounded-xl text-xs font-bold text-slate-350 backdrop-blur-md transition transform active:scale-95 shadow-md"
        >
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Sync Board'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-900/50 rounded-2xl text-xs text-red-400 font-medium relative z-10">
          {error}
        </div>
      )}

      {/* Tab Filter Pills Bar */}
      <div className="flex flex-wrap gap-2 pb-1.5 border-b border-slate-900/60 relative z-10">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center gap-2 border ${
            activeTab === 'active'
              ? 'bg-brand-500/10 border-brand-500/40 text-brand-400 shadow-glow-sm shadow-brand-500/5'
              : 'bg-slate-900/40 border-slate-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-800'
          }`}
        >
          Active Queue
          <span className={`ml-1 px-2 py-0.5 text-[9px] font-black rounded-md ${activeTab === 'active' ? 'bg-brand-500 text-white shadow-sm' : 'bg-slate-850 text-slate-500'}`}>
            {activeCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center gap-2 border ${
            activeTab === 'pending'
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-glow-sm'
              : 'bg-slate-900/40 border-slate-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-800'
          }`}
        >
          Pending
          {pendingCount > 0 ? (
            <span className="ml-1 px-2 py-0.5 text-[9px] font-black rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 animate-pulse">
              {pendingCount}
            </span>
          ) : (
            <span className="ml-1 px-2 py-0.5 text-[9px] font-black rounded-md bg-slate-850 text-slate-500">
              0
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('preparing')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center gap-2 border ${
            activeTab === 'preparing'
              ? 'bg-blue-500/10 border-blue-500/40 text-blue-400'
              : 'bg-slate-900/40 border-slate-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-800'
          }`}
        >
          In Kitchen
          <span className={`ml-1 px-2 py-0.5 text-[9px] font-black rounded-md ${activeTab === 'preparing' ? 'bg-blue-500 text-white' : 'bg-slate-850 text-slate-500'}`}>
            {preparingCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('transit')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center gap-2 border ${
            activeTab === 'transit'
              ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400'
              : 'bg-slate-900/40 border-slate-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-800'
          }`}
        >
          In Transit
          <span className={`ml-1 px-2 py-0.5 text-[9px] font-black rounded-md ${activeTab === 'transit' ? 'bg-indigo-500 text-white' : 'bg-slate-850 text-slate-500'}`}>
            {transitCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center gap-2 border ${
            activeTab === 'completed'
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
              : 'bg-slate-900/40 border-slate-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-800'
          }`}
        >
          Completed Logs
          <span className={`ml-1 px-2 py-0.5 text-[9px] font-black rounded-md ${activeTab === 'completed' ? 'bg-emerald-500 text-white' : 'bg-slate-850 text-slate-500'}`}>
            {completedCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center gap-2 border ${
            activeTab === 'all'
              ? 'bg-slate-200/10 border-slate-800 text-slate-250'
              : 'bg-slate-900/40 border-slate-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-800'
          }`}
        >
          All
          <span className={`ml-1 px-2 py-0.5 text-[9px] font-black rounded-md ${activeTab === 'all' ? 'bg-slate-200 text-slate-900' : 'bg-slate-800 text-slate-500'}`}>
            {allCount}
          </span>
        </button>
      </div>

      {/* SPLIT PANE MASTER-DETAIL WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative z-10">
        
        {/* LEFT COLUMN (Master Card Stack Panel - 4/12 or 33% width) */}
        <div className={`lg:col-span-5 xl:col-span-4 flex flex-col space-y-4 max-h-[700px] ${mobileDetailOpen ? 'hidden' : 'block'} lg:block`}>
          <div className="bg-slate-900/35 backdrop-blur-xl border border-slate-900/60 p-4.5 rounded-3xl flex flex-col gap-4">
            
            {/* Search Input Filter bar */}
            <div className="relative flex items-center bg-slate-950/45 border border-slate-900/70 p-2.5 rounded-2xl shrink-0">
              <Search size={15} className="text-slate-400 shrink-0 ml-1" />
              <input
                type="text"
                placeholder="Search by ID or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-xs font-bold placeholder:text-slate-500 pl-2 focus:ring-0 focus:outline-none text-slate-200"
              />
              {searchTerm && (
                <button type="button" onClick={() => setSearchTerm('')} className="p-1 hover:bg-slate-900 rounded-full text-slate-500">
                  <X size={12} />
                </button>
              )}
            </div>

            {/* List scroll wrapper */}
            <div className="flex-grow overflow-y-auto space-y-3 pr-1 scrollbar-thin max-h-[500px]">
              {filteredList.map((order) => {
                const isSelected = selectedOrder?._id === order._id;
                
                // Color mapping variables
                let highlightBorder = '';
                let dotTag = '';
                let statusLabel = order.orderStatus;

                switch (order.orderStatus) {
                  case 'Pending':
                    highlightBorder = isSelected ? 'border-l-amber-500 bg-amber-500/[0.03] border-slate-800' : 'hover:border-l-amber-500/40 border-slate-900/60';
                    dotTag = 'bg-amber-400 animate-pulse';
                    statusLabel = 'Pending';
                    break;
                  case 'Accepted':
                    highlightBorder = isSelected ? 'border-l-sky-500 bg-sky-500/[0.03] border-slate-800' : 'hover:border-l-sky-500/40 border-slate-900/60';
                    dotTag = 'bg-sky-400';
                    statusLabel = 'Accepted';
                    break;
                  case 'Preparing':
                    highlightBorder = isSelected ? 'border-l-blue-500 bg-blue-500/[0.03] border-slate-800' : 'hover:border-l-blue-500/40 border-slate-900/60';
                    dotTag = 'bg-blue-450 animate-ping';
                    statusLabel = 'Kitchen';
                    break;
                  case 'Ready for Pickup':
                    highlightBorder = isSelected ? 'border-l-teal-500 bg-teal-500/[0.03] border-slate-800' : 'hover:border-l-teal-500/40 border-slate-900/60';
                    dotTag = 'bg-teal-400';
                    statusLabel = 'Ready';
                    break;
                  case 'Picked Up':
                    highlightBorder = isSelected ? 'border-l-purple-500 bg-purple-500/[0.03] border-slate-800' : 'hover:border-l-purple-500/40 border-slate-900/60';
                    dotTag = 'bg-purple-400 animate-pulse';
                    statusLabel = 'Picked Up';
                    break;
                  case 'Out for Delivery':
                    highlightBorder = isSelected ? 'border-l-indigo-500 bg-indigo-500/[0.03] border-slate-800' : 'hover:border-l-indigo-500/40 border-slate-900/60';
                    dotTag = 'bg-indigo-400';
                    statusLabel = 'Transit';
                    break;
                  case 'Delivered':
                    highlightBorder = isSelected ? 'border-l-emerald-500 bg-emerald-500/[0.03] border-slate-800' : 'hover:border-l-emerald-500/40 border-slate-900/60';
                    dotTag = 'bg-emerald-450';
                    statusLabel = 'Completed';
                    break;
                  case 'Rejected':
                    highlightBorder = isSelected ? 'border-l-red-500 bg-red-500/[0.03] border-slate-800' : 'hover:border-l-red-500/40 border-slate-900/60';
                    dotTag = 'bg-red-400';
                    break;
                  case 'Cancelled':
                    highlightBorder = isSelected ? 'border-l-slate-500 bg-slate-500/[0.03] border-slate-800' : 'hover:border-l-slate-500/40 border-slate-900/60';
                    dotTag = 'bg-slate-450';
                    break;
                }

                return (
                  <div
                    key={order._id}
                    onClick={() => { setSelectedOrder(order); setMobileDetailOpen(true); }}
                    className={`p-3.5 border-l-4 rounded-2xl cursor-pointer transition-all duration-300 transform active:scale-98 flex flex-col gap-2 relative ${highlightBorder} bg-slate-900/20 border-r border-y ${isSelected ? 'border-slate-800/80 shadow-md shadow-slate-950/20' : 'hover:bg-slate-950/30'}`}
                  >
                    {/* ID & Timestamp */}
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs font-black text-slate-200 group-hover:text-brand-400">
                        #{order._id.slice(-8).toUpperCase()}
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 flex items-center gap-1">
                        <Clock size={9} />
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Customer & Price */}
                    <div className="flex justify-between items-center gap-2">
                      <div className="truncate">
                        <div className="text-[11px] font-extrabold text-slate-350 truncate">{order.userId?.name || 'Walk-in Customer'}</div>
                        <div className="text-[9px] text-slate-500 font-semibold truncate leading-none mt-0.5">{order.items.length} items • {order.items[0]?.name || 'Dish'}</div>
                      </div>
                      <div className="text-xs font-black text-emerald-400 shrink-0">₹{order.totalAmount}</div>
                    </div>

                    {/* Status Pill Indicator */}
                    <div className="flex justify-between items-center pt-1 border-t border-slate-900/30">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{order.paymentMethod}</span>
                      <span className="inline-flex items-center gap-1 text-[9px] font-black text-slate-400">
                        <span className={`w-1.5 h-1.5 rounded-full ${dotTag}`} />
                        {statusLabel}
                      </span>
                    </div>
                  </div>
                );
              })}

              {filteredList.length === 0 && (
                <div className="text-center py-12 text-slate-550 text-xs font-bold space-y-2">
                  <ShoppingBag size={24} className="mx-auto text-slate-700 animate-bounce" />
                  <div>No orders listed under this filter</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (Detailed Operations Console - 8/12 or 67% width) */}
        <div className={`lg:col-span-7 xl:col-span-8 flex flex-col ${mobileDetailOpen ? 'block' : 'hidden'} lg:block`}>
          
          {selectedOrder ? (
            <div className="bg-slate-900/35 backdrop-blur-xl border border-slate-900/60 rounded-[28px] overflow-hidden flex flex-col shadow-2xl shadow-slate-950/40 min-h-[600px]">
              
              {/* Console Header */}
              <div className="p-5 border-b border-slate-900/65 flex items-center justify-between bg-slate-950/20">
                <div className="flex items-center gap-3">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setMobileDetailOpen(false)}
                    className="p-2 text-slate-450 hover:text-white rounded-xl hover:bg-slate-900 lg:hidden transition"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-mono font-black text-base text-brand-400 tracking-wider">#{selectedOrder._id.slice(-8).toUpperCase()}</h3>
                      <span className="px-2 py-0.5 bg-slate-950 border border-slate-900 text-[9px] font-black rounded-lg text-slate-450 uppercase tracking-wider">{selectedOrder.paymentMethod}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Placed on {new Date(selectedOrder.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(selectedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>

                {/* Main Status Tag */}
                {(() => {
                  let bg = ''; let border = ''; let text = ''; let dot = ''; let label = selectedOrder.orderStatus;
                  switch (selectedOrder.orderStatus) {
                    case 'Pending':
                      bg = 'bg-amber-500/10'; border = 'border-amber-500/25'; text = 'text-amber-400'; dot = 'bg-amber-400 animate-pulse'; label = 'Pending';
                      break;
                    case 'Accepted':
                      bg = 'bg-sky-500/10'; border = 'border-sky-500/25'; text = 'text-sky-400'; dot = 'bg-sky-400';
                      break;
                    case 'Preparing':
                      bg = 'bg-blue-500/10'; border = 'border-blue-500/25'; text = 'text-blue-400'; dot = 'bg-blue-400 animate-ping'; label = 'In Kitchen';
                      break;
                    case 'Ready for Pickup':
                      bg = 'bg-teal-500/10'; border = 'border-teal-500/25'; text = 'text-teal-400'; dot = 'bg-teal-400'; label = 'Ready for Pickup';
                      break;
                    case 'Picked Up':
                      bg = 'bg-purple-500/10'; border = 'border-purple-500/25'; text = 'text-purple-400'; dot = 'bg-purple-400 animate-pulse'; label = 'Picked Up';
                      break;
                    case 'Out for Delivery':
                      bg = 'bg-indigo-500/10'; border = 'border-indigo-500/25'; text = 'text-indigo-400'; dot = 'bg-indigo-400'; label = 'Out for Delivery';
                      break;
                    case 'Delivered':
                      bg = 'bg-emerald-500/10'; border = 'border-emerald-500/25'; text = 'text-emerald-400'; dot = 'bg-emerald-400'; label = 'Completed';
                      break;
                    case 'Rejected':
                      bg = 'bg-red-500/10'; border = 'border-red-500/25'; text = 'text-red-400'; dot = 'bg-red-400';
                      break;
                    case 'Cancelled':
                      bg = 'bg-slate-500/10'; border = 'border-slate-800'; text = 'text-slate-400'; dot = 'bg-slate-400';
                      break;
                  }
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider ${bg} ${border} ${text} shadow-sm`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${dot}`}></span>
                      {label}
                    </span>
                  );
                })()}
              </div>

              {/* Console Workspace Grid */}
              <div className="p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 overflow-y-auto scrollbar-thin max-h-[500px]">
                
                {/* Left Side: customer info & tracking timeline (col-span-7) */}
                <div className="xl:col-span-7 space-y-6">
                  
                  {/* Tracking Timeline */}
                  <div className="bg-slate-950/20 border border-slate-900/60 p-4.5 rounded-2xl space-y-4 shadow-sm">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Activity size={12} className="text-brand-500" /> Live Tracking Timeline
                    </h4>

                    <div className="relative pl-6.5 space-y-5 border-l border-slate-900/80">
                      {[
                        { label: 'Order Registered', desc: 'Awaiting restaurant approval', active: true, color: 'bg-brand-500' },
                        { label: 'Accepted', desc: 'Preparation queued', active: ['Accepted', 'Preparing', 'Ready for Pickup', 'Picked Up', 'Out for Delivery', 'Delivered'].includes(selectedOrder.orderStatus), color: 'bg-sky-500' },
                        { label: 'Kitchen Prep', desc: 'Chef assembling and packing', active: ['Preparing', 'Ready for Pickup', 'Picked Up', 'Out for Delivery', 'Delivered'].includes(selectedOrder.orderStatus), color: 'bg-blue-500', ping: selectedOrder.orderStatus === 'Preparing' },
                        { label: 'Ready for Pickup', desc: 'Rider assignment and handover ready', active: ['Ready for Pickup', 'Picked Up', 'Out for Delivery', 'Delivered'].includes(selectedOrder.orderStatus), color: 'bg-teal-500', ping: selectedOrder.orderStatus === 'Ready for Pickup' },
                        { label: 'Picked Up by Rider', desc: 'Rider picked up and loaded delivery box', active: ['Picked Up', 'Out for Delivery', 'Delivered'].includes(selectedOrder.orderStatus), color: 'bg-purple-500', ping: selectedOrder.orderStatus === 'Picked Up' },
                        { label: 'Out for Delivery', desc: 'Agent transit path simulation active', active: ['Out for Delivery', 'Delivered'].includes(selectedOrder.orderStatus), color: 'bg-indigo-500', ping: selectedOrder.orderStatus === 'Out for Delivery' },
                        { label: 'Completed', desc: 'Order handoff successfully confirmed', active: selectedOrder.orderStatus === 'Delivered', color: 'bg-emerald-500' }
                      ].map((step, idx) => (
                        <div key={idx} className="relative">
                          {/* Circle dot tag */}
                          <span className={`absolute -left-[32px] top-1 w-2.5 h-2.5 rounded-full border-2 border-slate-900 transition-all ${step.active ? `${step.color} shadow-sm shadow-slate-900` : 'bg-slate-800'}`} />
                          {step.ping && (
                            <span className="absolute -left-[36px] -top-[3px] w-[18px] h-[18px] rounded-full border border-slate-450 animate-ping opacity-60" />
                          )}
                          <div className="space-y-0.5">
                            <div className={`text-[11px] font-bold ${step.active ? 'text-slate-205' : 'text-slate-550'}`}>{step.label}</div>
                            <div className="text-[10px] text-slate-500 leading-normal">{step.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customer coordinates */}
                  <div className="bg-slate-950/20 border border-slate-900/60 p-4.5 rounded-2xl space-y-4 shadow-sm">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <User size={12} className="text-indigo-405" /> Customer Coordinates
                    </h4>

                    <div className="flex items-center justify-between border-b border-slate-900/40 pb-3.5 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-650 flex items-center justify-center font-poppins font-black text-white text-xs shadow-md">
                          {(selectedOrder.userId?.name || 'W').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{selectedOrder.userId?.name || 'Walk-in Customer'}</div>
                          <div className="text-[10px] text-slate-450 font-medium">Phone: {selectedOrder.userId?.phone || 'N/A'}</div>
                        </div>
                      </div>

                      {selectedOrder.deliveryOTP && (
                        <div className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl text-center shrink-0">
                          <span className="text-[8px] text-slate-400 font-extrabold block uppercase tracking-wider">Delivery OTP</span>
                          <span className="text-xs font-black text-brand-500 tracking-[1.5px]">{selectedOrder.deliveryOTP}</span>
                        </div>
                      )}

                      {selectedOrder.userId?.phone && (
                        <a
                          href={`tel:${selectedOrder.userId.phone}`}
                          className="p-2.5 bg-slate-900/50 border border-slate-850 hover:border-slate-700 text-brand-400 rounded-xl transition flex items-center justify-center"
                        >
                          <Phone size={13} />
                        </a>
                      )}
                    </div>

                    <div className="space-y-3.5">
                      <div className="flex items-start gap-2.5 text-xs">
                        <MapPin size={15} className="text-brand-500 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-slate-350 text-[11px]">Delivery Location</div>
                          <p className="text-[11px] text-slate-450 leading-relaxed mt-0.5">
                            {selectedOrder.deliveryAddress
                              ? `${selectedOrder.deliveryAddress.addressLine}, ${selectedOrder.deliveryAddress.city}, ${selectedOrder.deliveryAddress.zipCode || ''}`
                              : 'Walk-in Takeaway Order'}
                          </p>
                        </div>
                      </div>

                      {selectedOrder.deliveryAddress && (
                        <div className="relative h-20 bg-slate-950/60 rounded-xl overflow-hidden border border-slate-900/60 flex items-center justify-center">
                          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:14px_14px] opacity-35" />
                          <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                          <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-brand-500 rounded-full shadow-md shadow-brand-500/20" />
                          <span className="relative z-10 text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                            <Map size={11} /> Simulated GPS Route Active
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side: recipe item checkoff & billing (col-span-5) */}
                <div className="xl:col-span-5 space-y-6">
                  
                  {/* Recipes list */}
                  <div className="bg-slate-950/20 border border-slate-900/60 p-4.5 rounded-2xl space-y-3 shadow-sm">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Utensils size={12} className="text-sky-400" /> Recipes Itemized
                    </h4>

                    <div className="space-y-2 max-h-[180px] overflow-y-auto scrollbar-thin">
                      {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-950/45 border border-slate-900/50 p-2.5 rounded-xl gap-3">
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-1.5 h-1.5 bg-brand-500 rounded-full shrink-0" />
                            <span className="text-xs font-bold text-slate-200 truncate leading-snug">{item.name}</span>
                          </div>
                          <span className="px-2 py-0.5 bg-slate-900 border border-slate-850 text-brand-400 text-[10px] font-black rounded-lg shrink-0">
                            x{item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Billing */}
                  <div className="bg-slate-950/20 border border-slate-900/60 p-4.5 rounded-2xl space-y-3 shadow-sm">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <DollarSign size={12} className="text-emerald-450" /> Receipt Breakdown
                    </h4>

                    <div className="space-y-2 text-xs font-semibold text-slate-400 pt-1">
                      <div className="flex justify-between">
                        <span>Subtotal Items</span>
                        <span className="text-slate-350">₹{selectedOrder.totalAmount - 45}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GST Kitchen Tax (5%)</span>
                        <span className="text-slate-355">₹15</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Packaging & Box charge</span>
                        <span className="text-slate-355">₹10</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery Reward cut</span>
                        <span className="text-slate-355">₹20</span>
                      </div>
                      
                      <div className="border-t border-slate-900/70 pt-3 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">Grand Total</span>
                        <span className="text-base font-black text-emerald-400 tracking-tight">₹{selectedOrder.totalAmount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Console Sticky Sticky Operations Footer */}
              <div className="p-5 border-t border-slate-900/65 bg-slate-950/30 flex gap-3.5 justify-end shrink-0">
                {selectedOrder.orderStatus === 'Pending' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(selectedOrder._id, 'Rejected')}
                      className="px-5 py-3 bg-slate-900 border border-slate-800 hover:border-red-500/20 hover:text-red-400 hover:bg-red-950/10 text-slate-400 text-xs font-black rounded-2xl transition-all cursor-pointer text-center"
                    >
                      Reject Order
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedOrder._id, 'Accepted')}
                      className="px-6 py-3 bg-gradient-to-r from-brand-500 to-amber-500 text-white text-xs font-black rounded-2xl shadow-lg shadow-brand-500/20 hover:scale-[1.02] active:scale-95 transition-all duration-200 cursor-pointer text-center"
                    >
                      Accept Order
                    </button>
                  </>
                )}

                {selectedOrder.orderStatus === 'Accepted' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'Preparing')}
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-black rounded-2xl shadow-lg transition-transform hover:scale-[1.01] active:scale-98 cursor-pointer text-center"
                  >
                    Start Kitchen Preparation
                  </button>
                )}

                {selectedOrder.orderStatus === 'Preparing' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'Ready for Pickup')}
                    className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-xs font-black rounded-2xl shadow-lg transition-transform hover:scale-[1.01] active:scale-98 cursor-pointer text-center"
                  >
                    Mark Ready for Pickup
                  </button>
                )}

                {selectedOrder.orderStatus === 'Ready for Pickup' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'Picked Up')}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-black rounded-2xl shadow-lg transition-transform hover:scale-[1.01] active:scale-98 cursor-pointer text-center"
                  >
                    Mark Picked Up by Rider
                  </button>
                )}

                {selectedOrder.orderStatus === 'Picked Up' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'Out for Delivery')}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black rounded-2xl shadow-lg transition-transform hover:scale-[1.01] active:scale-98 cursor-pointer text-center"
                  >
                    Dispatch for Delivery
                  </button>
                )}

                {selectedOrder.orderStatus === 'Out for Delivery' && (
                  <div className="w-full flex flex-col gap-3">
                    <div className="flex items-center gap-3 bg-slate-950/40 border border-slate-900 p-3 rounded-2xl">
                      <ShieldCheck size={16} className="text-brand-500 shrink-0" />
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="Enter 4-Digit Customer OTP"
                        value={deliveryOTP}
                        onChange={(e) => {
                          setDeliveryOTP(e.target.value.replace(/\D/g, ''));
                          setOtpVerificationError('');
                        }}
                        className="bg-transparent border-none outline-none w-full text-xs font-black placeholder:text-slate-500 text-center tracking-[4px] focus:ring-0 focus:outline-none text-slate-150"
                      />
                    </div>
                    {otpVerificationError && (
                      <p className="text-[10px] font-bold text-red-500 text-center">{otpVerificationError}</p>
                    )}
                    <button
                      onClick={async () => {
                        if (!deliveryOTP || deliveryOTP.length < 4) {
                          setOtpVerificationError("Please enter the customer's 4-digit Delivery OTP.");
                          return;
                        }
                        try {
                          const { data } = await api.put(`/shop/orders/${selectedOrder._id}/status`, {
                            status: 'Delivered',
                            otp: deliveryOTP
                          });
                          if (data.success) {
                            setOrders(prev => prev.map(ord => ord._id === selectedOrder._id ? { ...ord, orderStatus: 'Delivered', paymentStatus: 'Completed' } : ord));
                            setDeliveryOTP('');
                            setOtpVerificationError('');
                          }
                        } catch (err) {
                          console.error('Delivery verification failed:', err);
                          setOtpVerificationError(err.response?.data?.message || 'Incorrect Delivery OTP. Verify with customer!');
                        }
                      }}
                      className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-black rounded-2xl shadow-lg transition-transform active:scale-95 cursor-pointer text-center"
                    >
                      Verify OTP & Complete Delivery
                    </button>
                  </div>
                )}

                {['Delivered', 'Rejected', 'Cancelled'].includes(selectedOrder.orderStatus) && (
                  <div className="w-full py-3 bg-slate-900 border border-slate-850 text-center rounded-2xl text-xs font-bold text-slate-500 italic tracking-wide">
                    Order flow closed and archived
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/35 backdrop-blur-xl border border-slate-900/60 rounded-[28px] p-12 text-center flex flex-col items-center justify-center shadow-xl min-h-[600px] gap-3">
              <ShoppingBag size={32} className="text-slate-650 animate-bounce" />
              <div className="text-slate-400 text-sm font-bold">No Active Order Selected</div>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">Choose an active checkout card from the left panel column stack to begin kitchen operations and dispatch deliveries.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;
