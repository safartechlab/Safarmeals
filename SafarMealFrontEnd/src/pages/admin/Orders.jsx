import React, { useState, useEffect } from 'react';
import { ClipboardList, Search, Filter, DollarSign, Clock, ShieldCheck, MapPin, Store, User } from 'lucide-react';
import api from '../../services/api';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [cityFilter, setCityFilter] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    const fetchGlobalOrders = async () => {
      try {
        const { data } = await api.get('/admin/orders');
        if (data.success) {
          setOrders(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch system checkouts:', err);
        setError('Failed to retrieve system-wide checkout tickets.');
      } finally {
        setLoading(false);
      }
    };
    fetchGlobalOrders();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-10 w-48 bg-slate-900 rounded-xl shimmer-dark" />
          <div className="h-10 w-64 bg-slate-900 rounded-xl shimmer-dark" />
        </div>
        <div className="h-96 bg-slate-900 border border-slate-800 rounded-3xl shimmer-dark" />
      </div>
    );
  }

  // Filter orders by search, status, and city
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      order.userId?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      order.shopId?.shopName.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'ALL' || order.orderStatus === statusFilter;
    
    const matchesCity = !cityFilter || (order.deliveryAddress?.city && order.deliveryAddress.city.toLowerCase().includes(cityFilter.toLowerCase()));
    
    return matchesSearch && matchesStatus && matchesCity;
  });

  return (
    <div className="space-y-8 font-inter text-slate-100">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-poppins font-black text-2xl sm:text-3xl text-white">Global Checkouts</h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">Audit active delivery routes, transaction currencies, and merchant fulfillment schedules.</p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Status Dropdown */}
          <div className="relative w-full sm:w-44">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs font-bold px-3 py-2.5 bg-slate-900 border border-slate-850 text-slate-300 rounded-xl focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Accepted">Accepted</option>
              <option value="Preparing">Preparing</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Rejected">Rejected</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* City Filter */}
          <div className="relative w-full sm:w-40">
            <input
              type="text"
              placeholder="Filter by City..."
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full text-xs font-semibold px-3.5 py-2.5 bg-slate-900 border border-slate-850 text-white rounded-xl focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search ID, Customer, Shop..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs font-semibold pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-850 text-white rounded-xl focus:outline-none focus:border-purple-500"
            />
            <Search size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-900/50 rounded-2xl text-xs text-red-400 font-medium">
          {error}
        </div>
      )}

      {/* ORDERS DATA BOARD */}
      <div className="bg-slate-900 border border-slate-850 rounded-3xl shadow-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-850 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-900/40">
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Restaurant</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Invoice Amount</th>
                <th className="px-6 py-4">Platform Cut (10%)</th>
                <th className="px-6 py-4">Payment Status</th>
                <th className="px-6 py-4">Delivery Status</th>
                <th className="px-6 py-4">Ticket Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/50 text-xs font-semibold">
              {filteredOrders.map((order) => (
                <React.Fragment key={order._id}>
                  <tr
                    onClick={() => setExpandedOrderId(expandedOrderId === order._id ? null : order._id)}
                    className={`hover:bg-slate-855/30 transition cursor-pointer ${expandedOrderId === order._id ? 'bg-slate-850/20' : ''}`}
                  >
                    <td className="px-6 py-4 text-purple-405 font-extrabold text-[10.5px]">
                      #...{order._id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <img
                          src={order.shopId?.logo || 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=40&q=80'}
                          alt={order.shopId?.shopName}
                          className="w-7 h-7 rounded-lg object-cover border border-slate-800"
                        />
                        <span className="text-white font-bold">{order.shopId?.shopName || 'Deactivated Shop'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <h5 className="text-slate-300 font-bold">{order.userId?.name || 'Walk-in'}</h5>
                        <p className="text-[9px] text-slate-500 font-semibold">{order.userId?.phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-emerald-400 font-black text-sm">₹{order.totalAmount}</td>
                    <td className="px-6 py-4 text-slate-300 font-extrabold text-xs">₹{order.commissionPaid || Math.round(order.subtotal * 0.1)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${order.paymentStatus === 'Completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/40' : order.paymentStatus === 'Failed' ? 'bg-rose-950 text-rose-400 border border-rose-900/40' : 'bg-amber-950 text-amber-400 border border-amber-900/40'}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${['Delivered'].includes(order.orderStatus) ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/40' : ['Rejected', 'Cancelled'].includes(order.orderStatus) ? 'bg-rose-950 text-rose-400 border border-rose-900/40' : ['Preparing', 'Out for Delivery'].includes(order.orderStatus) ? 'bg-blue-950 text-blue-400 border border-blue-900/40' : 'bg-amber-950 text-amber-400 border border-amber-900/40'}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-semibold text-[10px]">
                      {new Date(order.createdAt).toLocaleString()}
                    </td>
                  </tr>

                  {expandedOrderId === order._id && (
                    <tr className="bg-slate-950/40">
                      <td colSpan="8" className="px-6 py-5 border-t border-b border-slate-850/60">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300 font-medium">
                          {/* Delivery Address Details */}
                          <div className="space-y-1.5 bg-slate-900 p-4.5 rounded-2xl border border-slate-800">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                              <MapPin size={12} className="text-purple-400" /> Delivery Address
                            </span>
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[9px] font-extrabold uppercase tracking-wider bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                                {order.deliveryAddress?.label || 'Home'}
                              </span>
                            </div>
                            <p className="font-bold text-slate-200">
                              {order.deliveryAddress?.houseNo ? `${order.deliveryAddress.houseNo}, ` : ''}
                              {order.deliveryAddress?.society ? `${order.deliveryAddress.society}, ` : ''}
                              {order.deliveryAddress?.streetName || order.deliveryAddress?.addressLine}
                            </p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                              {order.deliveryAddress?.city}, {order.deliveryAddress?.state} - {order.deliveryAddress?.zipCode}
                            </p>
                          </div>

                          {/* OTP Secure verification details */}
                          <div className="space-y-1.5 bg-slate-900 p-4.5 rounded-2xl border border-slate-800 flex flex-col justify-between">
                            <div>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                                <ShieldCheck size={12} className="text-purple-400" /> Secure Handoff verification
                              </span>
                              <p className="text-[11px] text-slate-450 leading-relaxed">
                                Security verification code shared between the customer and delivery boy:
                              </p>
                            </div>
                            <div className="pt-2">
                              {order.deliveryOTP ? (
                                <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-4 py-2 rounded-xl font-mono text-sm font-black text-purple-400 tracking-[3px] shadow-sm">
                                  {order.deliveryOTP}
                                </div>
                              ) : (
                                <span className="text-slate-550 italic text-xs font-semibold">No OTP Generated</span>
                              )}
                            </div>
                          </div>

                          {/* Itemized recipes */}
                          <div className="space-y-1.5 bg-slate-900 p-4.5 rounded-2xl border border-slate-800">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                              <ClipboardList size={12} className="text-purple-400" /> Itemized Recipes
                            </span>
                            <div className="space-y-2 max-h-28 overflow-y-auto pr-1 scrollbar-thin">
                              {order.items?.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-[11px] border-b border-slate-850/40 pb-1.5 last:border-0 last:pb-0">
                                  <span className="text-slate-200 font-semibold truncate max-w-[150px]">{item.name}</span>
                                  <span className="px-2 py-0.5 bg-slate-850 border border-slate-800 text-purple-400 text-[10px] font-black rounded-lg">
                                    x{item.quantity}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-500 text-xs font-semibold">No global checkout tickets found matching queries.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Orders;
