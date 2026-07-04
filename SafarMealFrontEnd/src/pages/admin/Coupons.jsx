import React, { useState, useEffect } from 'react';
import { Gift, Trash2, Plus, Calendar, AlertCircle, ShoppingBag, ShieldCheck, Tag } from 'lucide-react';
import api from '../../services/api';

const Coupons = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form Fields
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const fetchOffers = async () => {
    try {
      const { data } = await api.get('/admin/offers');
      if (data.success) {
        setOffers(data.data);
      }
    } catch (err) {
      console.error('Failed to load coupons:', err);
      setError('Could not retrieve coupon listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!code || !discountPercentage || !maxDiscountAmount) {
      setError('Please fill out all required parameters.');
      return;
    }

    try {
      const payload = {
        title: title || `Save ${discountPercentage}% on your order`,
        code: code.toUpperCase().trim(),
        discountPercentage: Number(discountPercentage),
        maxDiscountAmount: Number(maxDiscountAmount),
        minOrderAmount: Number(minOrderAmount || 0),
        expiryDate: expiryDate || null
      };

      const { data } = await api.post('/admin/offers', payload);
      if (data.success) {
        setSuccess(`Coupon "${payload.code}" published successfully!`);
        setOffers([data.data, ...offers]);
        
        // Reset form
        setTitle('');
        setCode('');
        setDiscountPercentage('');
        setMaxDiscountAmount('');
        setMinOrderAmount('');
        setExpiryDate('');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create promo code. It might already exist.');
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('Delete this coupon? Customers will no longer be able to apply it at checkout.')) {
      return;
    }

    try {
      const { data } = await api.delete(`/admin/offers/${id}`);
      if (data.success) {
        setOffers(prev => prev.filter(off => off._id !== id));
        setSuccess('Coupon code wiped successfully.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete coupon code.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-900 rounded-xl shimmer-dark" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(n => <div key={n} className="h-52 bg-slate-900 border border-slate-800 rounded-3xl shimmer-dark" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-inter text-slate-100">
      {/* Title */}
      <div>
        <h1 className="font-poppins font-black text-2xl sm:text-3xl text-white">Promo Codes & Coupons</h1>
        <p className="text-xs text-slate-400 font-semibold mt-1">Publish and audit active platform-wide discount codes to boost checkouts.</p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-900/50 rounded-2xl text-xs text-emerald-400 font-bold">
          {success}
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-950/40 border border-rose-900/50 rounded-2xl text-xs text-rose-400 font-bold">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Active Coupons List (Left 2 columns) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-poppins font-bold text-sm text-white flex items-center gap-2 mb-2">
            <Gift size={16} className="text-purple-400" /> Active Promo Campaign ({offers.length})
          </h3>

          {offers.length === 0 ? (
            <div className="p-12 bg-slate-900 border border-slate-850 rounded-3xl text-center">
              <Gift size={48} className="mx-auto text-slate-600 mb-3" />
              <h4 className="font-poppins font-bold text-sm text-white">No active coupons</h4>
              <p className="text-xs text-slate-400 mt-1">Create one using the form on the right.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {offers.map((off) => {
                const isExpired = off.expiryDate && new Date(off.expiryDate) < new Date();
                return (
                  <div
                    key={off._id}
                    className={`bg-slate-900 border ${isExpired ? 'border-slate-850 opacity-60' : 'border-slate-850'} p-5 rounded-3xl shadow-premium relative overflow-hidden flex flex-col justify-between space-y-4 hover:border-slate-700 transition`}
                  >
                    {/* Background badge icon */}
                    <span className="absolute -right-6 -bottom-6 text-slate-800/10 pointer-events-none">
                      <Gift size={80} />
                    </span>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="px-3 py-1 bg-purple-950 text-purple-400 border border-purple-900/40 rounded-xl text-xs font-black tracking-wider flex items-center gap-1.5">
                          <Tag size={12} /> {off.code}
                        </span>
                        
                        <button
                          onClick={() => handleDeleteCoupon(off._id)}
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-950/20 rounded-xl transition"
                          title="Delete Coupon"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <div>
                        <h4 className="font-poppins font-bold text-sm text-white pt-1">{off.title}</h4>
                        <p className="text-[10px] text-slate-400 font-semibold leading-relaxed pt-1">
                          {off.description || `Get ${off.discountPercentage}% discount on food orders above ₹${off.minOrderAmount}.`}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-slate-850/60 pt-3 flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-semibold text-slate-400">
                      <div>
                        <span>Max Cap: </span>
                        <span className="text-emerald-400 font-extrabold">₹{off.maxDiscountAmount}</span>
                      </div>
                      <div>
                        <span>Min Ticket: </span>
                        <span className="text-slate-200">₹{off.minOrderAmount}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={10} />
                        <span className={isExpired ? 'text-red-400 font-bold' : 'text-slate-400'}>
                          {off.expiryDate ? new Date(off.expiryDate).toLocaleDateString() : 'Never expires'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create Coupon Card (Right 1 column) */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-850 p-6 sm:p-8 rounded-3xl shadow-premium h-fit">
          <h3 className="font-poppins font-bold text-sm text-white flex items-center gap-2 mb-4">
            <Gift size={16} className="text-purple-400" /> Create Promo Coupon
          </h3>

          <form onSubmit={handleCreateCoupon} className="space-y-4">
            {/* Promo Code */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 tracking-wider">COUPON CODE *</label>
              <input
                type="text"
                required
                placeholder="e.g. WELCOME50, BITEFEST"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full text-xs font-semibold px-4 py-3 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-purple-500 uppercase"
              />
            </div>

            {/* Campaign Title */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 tracking-wider">CAMPAIGN TITLE</label>
              <input
                type="text"
                placeholder="e.g. Flat 50% Off Welcome Discount"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs font-semibold px-4 py-3 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Discount Percentage & Max Discount Amount */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 tracking-wider">DISCOUNT % *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="100"
                  placeholder="50"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-3 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 tracking-wider">MAX CAP (₹) *</label>
                <input
                  type="number"
                  required
                  placeholder="150"
                  value={maxDiscountAmount}
                  onChange={(e) => setMaxDiscountAmount(e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-3 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Min order value & Expiry date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 tracking-wider">MIN ORDER (₹)</label>
                <input
                  type="number"
                  placeholder="299"
                  value={minOrderAmount}
                  onChange={(e) => setMinOrderAmount(e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-3 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 tracking-wider">EXPIRY DATE</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-3 bg-slate-950 border border-slate-800 text-slate-300 rounded-xl focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-glow transition mt-2 flex items-center justify-center gap-1.5"
            >
              <Plus size={14} /> Publish Coupon Campaign
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Coupons;
