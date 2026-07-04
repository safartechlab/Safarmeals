import React, { useState, useEffect } from 'react';
import { DollarSign, ClipboardCheck, Star, Award, TrendingUp } from 'lucide-react';
import api from '../../services/api';

const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data } = await api.get('/shop/analytics');
        if (data.success) {
          setMetrics(data.data);
        }
      } catch (err) {
        console.error('Failed to load shop owner analytics:', err);
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
          {[1, 2, 3].map(n => <div key={n} className="h-28 bg-slate-900 border border-slate-800 rounded-3xl shimmer-dark" />)}
        </div>
        <div className="h-80 bg-slate-900 border border-slate-800 rounded-3xl shimmer-dark" />
      </div>
    );
  }

  const { summary = { totalOrders: 0, pendingOrders: 0, totalEarnings: 0, rating: 5, reviewCount: 0 }, topFoods = [] } = metrics || {};

  return (
    <div className="space-y-8 font-inter text-slate-100">
      {/* Title */}
      <div>
        <h1 className="font-poppins font-black text-2xl sm:text-3xl text-white">Performance Overview</h1>
        <p className="text-xs text-slate-400 font-semibold mt-1">Review your restaurant checkouts, earnings, and ratings.</p>
      </div>

      {/* 1. METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Earnings */}
        <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl shadow-premium flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">TOTAL EARNINGS</span>
            <h3 className="font-poppins font-black text-2xl text-emerald-400">₹{summary.totalEarnings}</h3>
          </div>
          <span className="p-3 bg-emerald-950 text-emerald-400 border border-emerald-900/50 rounded-2xl">
            <DollarSign size={20} />
          </span>
        </div>

        {/* Orders Completed */}
        <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl shadow-premium flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">ORDERS ASSIGNED</span>
            <h3 className="font-poppins font-black text-2xl text-white">{summary.totalOrders}</h3>
          </div>
          <span className="p-3 bg-blue-950 text-blue-400 border border-blue-900/50 rounded-2xl">
            <ClipboardCheck size={20} />
          </span>
        </div>

        {/* Pending Orders */}
        <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl shadow-premium flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">PENDING TASKS</span>
            <h3 className="font-poppins font-black text-2xl text-amber-400">{summary.pendingOrders}</h3>
          </div>
          <span className="p-3 bg-amber-950 text-amber-400 border border-amber-900/50 rounded-2xl">
            <TrendingUp size={20} />
          </span>
        </div>

        {/* Ratings stars */}
        <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl shadow-premium flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">AVERAGE RATING</span>
            <h3 className="font-poppins font-black text-2xl text-white">{summary.rating}★</h3>
          </div>
          <span className="p-3 bg-purple-950 text-purple-400 border border-purple-900/50 rounded-2xl">
            <Star size={20} className="fill-purple-400" />
          </span>
        </div>
      </div>

      {/* 2. SPLIT LAYOUT: TOP DISHES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Welcome instructions */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-850 p-8 rounded-3xl shadow-premium flex flex-col justify-between relative overflow-hidden min-h-[300px]">
          <span className="absolute -right-20 -bottom-20 w-60 h-60 bg-brand-500/5 rounded-full" />
          <div className="max-w-xl space-y-4">
            <h3 className="font-poppins font-black text-white text-xl leading-tight">Welcome to the SAFARMEAL Partner Network</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
              Manage your food items, toggle kitchen availabilities, and keep an eye on your Live Orders console to accept incoming deliveries in real-time. Use the menu panel to update ingredients, prices, and categories.
            </p>
          </div>
          <div className="pt-8 flex gap-3 z-10">
            <a href="/shop/orders" className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl transition">Live Orders Console</a>
            <a href="/shop/menu" className="px-5 py-2.5 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl transition">Manage Dishes</a>
          </div>
        </div>

        {/* Right Column: Top Dishes Sold */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-850 p-6 rounded-3xl shadow-premium space-y-4">
          <h3 className="font-poppins font-bold text-sm text-white flex items-center gap-2 mb-1">
            <Award size={16} className="text-amber-400" /> Best Selling Food Items
          </h3>

          <div className="space-y-4 pt-2">
            {topFoods.map((food, idx) => (
              <div key={food._id} className="flex items-center justify-between gap-3 border-b border-slate-850 pb-3 last:border-none last:pb-0">
                <div>
                  <h5 className="text-xs font-bold text-white truncate max-w-[150px]">{food.name}</h5>
                  <p className="text-[9px] text-slate-400 font-semibold">{food.soldQuantity} portions sold</p>
                </div>
                <span className="text-xs font-bold text-emerald-400">₹{food.earnings}</span>
              </div>
            ))}

            {topFoods.length === 0 && (
              <div className="text-center py-6 text-slate-500 text-xs">No food checkout records registered yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
