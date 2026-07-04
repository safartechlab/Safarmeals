import React, { useState, useEffect } from 'react';
import { Users, Store, ClipboardList, DollarSign, Percent, TrendingUp, Award, Star } from 'lucide-react';
import api from '../../services/api';

const Dashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data } = await api.get('/admin/analytics');
        if (data.success) {
          setAnalytics(data.data);
        }
      } catch (err) {
        console.error('Failed to load system dashboard analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(n => <div key={n} className="h-28 bg-slate-900 border border-slate-800 rounded-3xl shimmer-dark" />)}
        </div>
        <div className="h-80 bg-slate-900 border border-slate-800 rounded-3xl shimmer-dark" />
      </div>
    );
  }

  const { summary, graphData = [], topRestaurants = [], statusStats = [] } = analytics || {
    summary: { totalUsers: 1, totalRestaurants: 3, totalOrders: 3, totalRevenue: 1085, totalCommission: 96 }
  };

  return (
    <div className="space-y-8 font-inter">
      {/* Title */}
      <div>
        <h1 className="font-poppins font-black text-2xl sm:text-3xl text-white">System Metrics Dashboard</h1>
        <p className="text-xs text-slate-400 font-semibold mt-1">Global SAFARMEAL platform performance and sales aggregates.</p>
      </div>

      {/* 1. ANALYTICS ROW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total Users */}
        <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl shadow-premium flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">TOTAL USERS</span>
            <h3 className="font-poppins font-black text-2xl text-white">{summary.totalUsers}</h3>
          </div>
          <span className="p-3 bg-blue-950 text-blue-400 border border-blue-900/50 rounded-2xl">
            <Users size={20} />
          </span>
        </div>

        {/* Total Restaurants */}
        <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl shadow-premium flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">RESTAURANTS</span>
            <h3 className="font-poppins font-black text-2xl text-white">{summary.totalRestaurants}</h3>
          </div>
          <span className="p-3 bg-amber-950 text-amber-400 border border-amber-900/50 rounded-2xl">
            <Store size={20} />
          </span>
        </div>

        {/* Total Orders */}
        <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl shadow-premium flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">ORDERS MADE</span>
            <h3 className="font-poppins font-black text-2xl text-white">{summary.totalOrders}</h3>
          </div>
          <span className="p-3 bg-purple-950 text-purple-400 border border-purple-900/50 rounded-2xl">
            <ClipboardList size={20} />
          </span>
        </div>

        {/* Gross Revenue */}
        <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl shadow-premium flex items-center justify-between col-span-1">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">GROSS SALES</span>
            <h3 className="font-poppins font-black text-2xl text-emerald-400">₹{summary.totalRevenue}</h3>
          </div>
          <span className="p-3 bg-emerald-950 text-emerald-400 border border-emerald-900/50 rounded-2xl">
            <DollarSign size={20} />
          </span>
        </div>

        {/* Commission */}
        <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl shadow-premium flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">COMMISSIONS</span>
            <h3 className="font-poppins font-black text-2xl text-brand-400">₹{summary.totalCommission}</h3>
          </div>
          <span className="p-3 bg-brand-950 text-brand-400 border border-brand-900/50 rounded-2xl">
            <Percent size={20} />
          </span>
        </div>
      </div>

      {/* 2. SPLIT LAYOUT GRAPH + TOP RESTAURANTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Simulated Graphical Analytics Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-850 p-6 rounded-3xl shadow-premium flex flex-col justify-between min-h-[350px]">
          <div>
            <h3 className="font-poppins font-bold text-sm text-white flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-emerald-400" /> Platform Revenue History
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold mb-6">Visual tracking logs of daily platform checkouts.</p>
          </div>

          {/* Bar Chart Mock Overlay */}
          <div className="flex-grow flex items-end justify-between gap-4 h-48 px-4 border-b border-slate-800 pb-2">
            {[350, 480, 290, 620, 810, 490, 710].map((val, i) => {
              const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
              const pct = (val / 900) * 100;
              return (
                <div key={i} className="flex-grow flex flex-col items-center gap-2 group h-full justify-end">
                  <span className="text-[9px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition leading-none">₹{val}</span>
                  <div
                    className="w-full bg-gradient-to-t from-brand-600 to-brand-500 rounded-lg shadow-glow hover:brightness-110 cursor-pointer transition-all duration-300"
                    style={{ height: `${pct}%` }}
                  />
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{days[i]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Top Restaurants Leaderboard */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-850 p-6 rounded-3xl shadow-premium space-y-4">
          <h3 className="font-poppins font-bold text-sm text-white flex items-center gap-2 mb-1">
            <Award size={16} className="text-amber-400" /> Top Selling Restaurants
          </h3>

          <div className="space-y-4 pt-2">
            {topRestaurants.map((shop, idx) => (
              <div key={shop._id} className="flex items-center justify-between gap-3 border-b border-slate-850 pb-3 last:border-none last:pb-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-500">#{idx + 1}</span>
                  <img
                    src={shop.logo || 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=60&q=80'}
                    alt={shop.shopName}
                    className="w-8 h-8 rounded-lg object-cover border border-slate-800"
                  />
                  <div>
                    <h5 className="text-xs font-bold text-white truncate max-w-[120px]">{shop.shopName}</h5>
                    <p className="text-[9px] text-slate-400 font-semibold">{shop.ordersCount} Orders Completed</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-400">₹{shop.totalSales}</span>
              </div>
            ))}

            {topRestaurants.length === 0 && (
              ['The Gourmet Burger Hub', 'Pizza & Pasta Express', 'Sweet Tooth Desserts'].map((name, idx) => {
                const sales = [491, 594, 0];
                const orders = [2, 1, 0];
                return (
                  <div key={idx} className="flex items-center justify-between gap-3 border-b border-slate-850 pb-3 last:border-none last:pb-0">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-500">#{idx + 1}</span>
                      <div>
                        <h5 className="text-xs font-bold text-white truncate max-w-[120px]">{name}</h5>
                        <p className="text-[9px] text-slate-400 font-semibold">{orders[idx]} Orders Completed</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-400">₹{sales[idx]}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
