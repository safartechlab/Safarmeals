import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Award, ShoppingBag, Percent, Star, ArrowUpRight, BarChart2, Calendar } from 'lucide-react';
import api from '../../services/api';

const Analytics = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const [anRes, ordRes] = await Promise.all([
          api.get('/shop/analytics'),
          api.get('/shop/orders')
        ]);
        if (anRes.data.success) {
          setMetrics(anRes.data.data);
        }
        if (ordRes.data.success) {
          setOrders(ordRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load shop owner analytics page:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(n => <div key={n} className="h-28 bg-slate-900 border border-slate-800 rounded-3xl shimmer-dark" />)}
        </div>
        <div className="h-80 bg-slate-900 border border-slate-800 rounded-3xl shimmer-dark" />
      </div>
    );
  }

  const { summary = { totalOrders: 0, pendingOrders: 0, totalEarnings: 0, rating: 5, reviewCount: 0 }, topFoods = [] } = metrics || {};

  // Compute stats
  const completedOrders = orders.filter(o => o.orderStatus === 'Delivered');
  const rejectedOrders = orders.filter(o => o.orderStatus === 'Rejected');
  const avgOrderValue = completedOrders.length > 0 ? Math.round(summary.totalEarnings / completedOrders.length) : 0;
  
  // Calculate commission paid (approx 10% from orders)
  const approxCommission = completedOrders.reduce((sum, o) => sum + (o.commissionPaid || 0), 0);
  const netEarnings = summary.totalEarnings - approxCommission;

  return (
    <div className="space-y-8 font-inter text-slate-100">
      {/* Title */}
      <div>
        <h1 className="font-poppins font-black text-2xl sm:text-3xl text-white">Earnings & Analytics</h1>
        <p className="text-xs text-slate-400 font-semibold mt-1">Detailed breakdowns of your restaurant checkouts, platform commissions, and dish statistics.</p>
      </div>

      {/* METRIC PANELS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Gross Sales */}
        <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl shadow-premium relative overflow-hidden group">
          <span className="absolute -right-6 -bottom-6 w-20 h-20 bg-emerald-500/5 rounded-full group-hover:scale-125 transition duration-500" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block">GROSS CHECKOUTS</span>
              <h3 className="font-poppins font-black text-2xl text-emerald-400">₹{summary.totalEarnings}</h3>
              <p className="text-[9px] text-slate-400 font-semibold">Total checkout value</p>
            </div>
            <span className="p-3 bg-emerald-950 text-emerald-400 border border-emerald-900/50 rounded-2xl">
              <DollarSign size={18} />
            </span>
          </div>
        </div>

        {/* Platform Commission */}
        <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl shadow-premium relative overflow-hidden group">
          <span className="absolute -right-6 -bottom-6 w-20 h-20 bg-rose-500/5 rounded-full group-hover:scale-125 transition duration-500" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block">ADMIN COMMISSIONS</span>
              <h3 className="font-poppins font-black text-2xl text-rose-400">₹{approxCommission}</h3>
              <p className="text-[9px] text-slate-400 font-semibold">10% standard admin fee</p>
            </div>
            <span className="p-3 bg-rose-950/40 text-rose-400 border border-rose-900/30 rounded-2xl">
              <Percent size={18} />
            </span>
          </div>
        </div>

        {/* Net Revenue */}
        <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl shadow-premium relative overflow-hidden group">
          <span className="absolute -right-6 -bottom-6 w-20 h-20 bg-brand-500/5 rounded-full group-hover:scale-125 transition duration-500" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block">NET EARNINGS</span>
              <h3 className="font-poppins font-black text-2xl text-white">₹{netEarnings}</h3>
              <p className="text-[9px] text-slate-400 font-semibold">Credited to your bank account</p>
            </div>
            <span className="p-3 bg-brand-950 text-brand-500 border border-brand-900/40 rounded-2xl">
              <TrendingUp size={18} />
            </span>
          </div>
        </div>

        {/* Avg Checkout size */}
        <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl shadow-premium relative overflow-hidden group">
          <span className="absolute -right-6 -bottom-6 w-20 h-20 bg-blue-500/5 rounded-full group-hover:scale-125 transition duration-500" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block">AVG ORDER SIZE</span>
              <h3 className="font-poppins font-black text-2xl text-blue-400">₹{avgOrderValue}</h3>
              <p className="text-[9px] text-slate-400 font-semibold">Per completed ticket</p>
            </div>
            <span className="p-3 bg-blue-950 text-blue-400 border border-blue-900/50 rounded-2xl">
              <ShoppingBag size={18} />
            </span>
          </div>
        </div>

      </div>

      {/* DETAILED STATS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Best Selling Dishes Column */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-850 p-6 sm:p-8 rounded-3xl shadow-premium space-y-6">
          <h3 className="font-poppins font-bold text-sm text-white flex items-center gap-2">
            <Award size={16} className="text-amber-400" /> Cuisines & Dish Sales Leaderboard
          </h3>

          <div className="space-y-4 pt-2">
            {topFoods.map((food, idx) => {
              const percentages = summary.totalEarnings > 0 ? Math.round((food.earnings / summary.totalEarnings) * 100) : 0;
              return (
                <div key={food._id} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-200">{food.name} <span className="text-[10px] text-slate-400">({food.soldQuantity} portions)</span></span>
                    <span className="text-slate-300 font-bold">₹{food.earnings} <span className="text-[10px] text-emerald-400 font-bold ml-1">({percentages}%)</span></span>
                  </div>
                  {/* Visual Progress Bar */}
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                    <div
                      className="bg-gradient-to-r from-brand-500 to-amber-400 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${percentages}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {topFoods.length === 0 && (
              <div className="text-center py-10 text-slate-500 text-xs">No food item sales data available yet.</div>
            )}
          </div>
        </div>

        {/* Order Logs Summary Card */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-850 p-6 rounded-3xl shadow-premium flex flex-col justify-between space-y-6">
          <div>
            <h3 className="font-poppins font-bold text-sm text-white flex items-center gap-2 mb-4">
              <BarChart2 size={16} className="text-blue-400" /> Order Fulfillment Stats
            </h3>

            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-400">Total Checkouts Assigned</span>
                <span className="text-white font-bold">{summary.totalOrders}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-emerald-400">Completed & Delivered</span>
                <span className="text-emerald-400 font-bold">{completedOrders.length}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-amber-400">Under Kitchen Prep</span>
                <span className="text-amber-400 font-bold">{summary.pendingOrders}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-red-400">Rejected Tickets</span>
                <span className="text-red-400 font-bold">{rejectedOrders.length}</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-850 flex items-center gap-3">
            <span className="p-3 bg-slate-950 border border-slate-850 text-slate-400 rounded-2xl">
              <Calendar size={18} />
            </span>
            <div>
              <h5 className="text-xs font-bold text-white">Consolidated Analytics</h5>
              <p className="text-[9px] text-slate-400 font-semibold leading-relaxed">Updated in real-time as tickets progress to Delivered.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Analytics;
