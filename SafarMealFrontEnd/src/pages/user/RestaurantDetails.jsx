import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Star, MapPin, Clock, ShoppingBag, Plus, Minus, AlertCircle, MessageSquare, Gift } from 'lucide-react';
import api from '../../services/api';
import { setCart as updateCartState } from '../../redux/cartSlice';

const RestaurantDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Multi-Vendor Cart Conflict State
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [conflictItem, setConflictItem] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const { items } = useSelector((state) => state.cart);
  const { isAuthenticated } = useSelector((state) => state.auth);

  const fetchDetails = async () => {
    try {
      const response = await api.get(`/user/restaurants/${id}`);
      if (response.data.success) {
        setData(response.data.data);
        if (response.data.data.categories.length > 0) {
          setSelectedCategory(response.data.data.categories[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch restaurant menus details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleAddToCart = async (foodItemId, forceClear = false) => {
    if (!isAuthenticated) {
      alert('Please login to start ordering your delicious food!');
      return;
    }

    try {
      if (forceClear) setModalLoading(true);
      
      const response = await api.post('/orders/cart', {
        foodItemId,
        quantity: 1,
        forceClear
      });

      if (response.status === 409 && response.data.conflict) {
        // Multi-Vendor Cart conflict triggered!
        setConflictItem(foodItemId);
        setConflictModalOpen(true);
        return;
      }

      if (response.data.success) {
        dispatch(updateCartState(response.data.data));
        if (conflictModalOpen) {
          setConflictModalOpen(false);
          setConflictItem(null);
        }
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      alert(err.message || 'Failed to add item to cart');
    } finally {
      if (forceClear) setModalLoading(false);
    }
  };

  const handleUpdateQuantity = async (foodItemId, currentQuantity, change) => {
    try {
      const newQuantity = currentQuantity + change;
      const response = await api.put('/orders/cart/item', {
        foodItemId,
        quantity: newQuantity
      });
      if (response.data.success) {
        dispatch(updateCartState(response.data.data));
      }
    } catch (err) {
      console.error('Error updating item quantity:', err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="h-60 rounded-3xl bg-gray-200 shimmer" />
        <div className="h-10 w-1/3 mx-auto rounded bg-gray-200 shimmer" />
        <div className="h-6 w-1/2 mx-auto rounded bg-gray-200 shimmer" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-800">Restaurant details not found</h2>
        <p className="text-gray-400 mt-2">The restaurant might be blocked, suspended or offline.</p>
        <Link to="/restaurants" className="mt-6 inline-block px-6 py-2 bg-brand-500 text-white rounded-xl">Browse Restaurants</Link>
      </div>
    );
  }

  const { restaurant, categories, menuItems, reviews, offers = [] } = data;

  // Filter food items based on selected category
  const filteredFoods = selectedCategory
    ? menuItems.filter(item => item.categoryId.toString() === selectedCategory)
    : menuItems;

  return (
    <div className="bg-gray-50 pb-20 font-inter">
      {/* 1. RESTAURANT HERO PROFILE */}
      <section className="relative h-[320px] bg-gray-900 text-white overflow-hidden">
        <img
          src={restaurant.banner || 'https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&w=1500&q=80'}
          alt={restaurant.shopName}
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/60 to-transparent" />
        
        <div className="absolute bottom-8 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-start md:items-end justify-between gap-6 z-10">
          <div className="flex items-center gap-5">
            <img
              src={restaurant.logo || 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=150&q=80'}
              alt={restaurant.shopName}
              className="w-24 h-24 rounded-2xl object-cover border-4 border-slate-800 bg-slate-800 shadow-premium"
            />
            <div>
              <h1 className="font-poppins font-black text-2xl sm:text-4xl tracking-tight leading-none mb-2">{restaurant.shopName}</h1>
              <p className="text-xs text-slate-300 font-light leading-relaxed max-w-xl">{restaurant.description}</p>
              <div className="flex flex-wrap gap-2.5 mt-3 text-xs text-slate-400 font-medium">
                {restaurant.cuisines.map((c, idx) => (
                  <span key={idx} className="bg-slate-800 px-2.5 py-1 rounded text-slate-300 capitalize">{c}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Core Metrics Cards */}
          <div className="flex gap-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 px-4 py-3 rounded-2xl text-center">
              <div className="flex items-center justify-center gap-1 text-amber-400 font-extrabold text-sm mb-0.5">
                <Star size={14} className="fill-amber-400" /> {restaurant.ratings}
              </div>
              <div className="text-[9px] text-slate-300 font-bold uppercase tracking-wider">{restaurant.reviewCount} Reviews</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/10 px-4 py-3 rounded-2xl text-center">
              <div className="flex items-center justify-center gap-1 text-slate-200 font-bold text-sm mb-0.5">
                <Clock size={14} /> {restaurant.openingTime} - {restaurant.closingTime}
              </div>
              <div className="text-[9px] text-slate-300 font-bold uppercase tracking-wider">Timings</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SPLIT MENU NAVIGATION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left column: Categories List selector */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="font-poppins font-bold text-sm text-gray-900 border-b border-gray-100 pb-3">Menu Sections</h3>
          <div className="space-y-1">
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => setSelectedCategory(cat._id)}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold transition ${selectedCategory === cat._id ? 'bg-brand-50 text-brand-600 border-l-4 border-brand-500' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {cat.name}
              </button>
            ))}

            {categories.length === 0 && (
              <div className="text-xs text-gray-400 py-4">No menu categories available.</div>
            )}
          </div>

          {/* Active Restaurant Coupons */}
          {offers.length > 0 && (
            <div className="pt-6 space-y-3 border-t border-gray-200 mt-6 text-left">
              <h3 className="font-poppins font-bold text-sm text-gray-900 flex items-center gap-1.5 pb-2">
                <Gift size={16} className="text-brand-500" /> Active Promo Offers
              </h3>
              <div className="space-y-3">
                {offers.map((off) => (
                  <div key={off._id} className="p-4 bg-brand-50/50 border border-brand-100 rounded-2xl space-y-2 relative overflow-hidden group hover:border-brand-200 transition">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-brand-100 text-brand-600 font-mono text-[10px] font-black rounded uppercase tracking-wider">
                        {off.code}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(off.code);
                          alert(`Coupon code "${off.code}" copied to clipboard!`);
                        }}
                        className="text-[9px] font-extrabold text-brand-500 hover:text-brand-600 uppercase"
                      >
                        Copy
                      </button>
                    </div>
                    <div>
                      <h4 className="font-poppins font-bold text-[11px] text-gray-800 leading-tight">{off.title}</h4>
                      <p className="text-[9px] text-gray-400 leading-relaxed pt-0.5">
                        {off.description || `Get ${off.discountPercentage}% discount up to ₹${off.maxDiscountAmount}. Min order ₹${off.minOrderAmount}.`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Menu Items catalog */}
        <div className="lg:col-span-3 space-y-6">
          <h2 className="font-poppins font-extrabold text-xl text-gray-900 mb-6">Dishes Feed</h2>

          <div className="space-y-4">
            {filteredFoods.map((food) => {
              // Check if item exists in active cart
              const cartItem = items.find(i => (i.foodItemId?._id || i.foodItemId) === food._id);
              const qtyInCart = cartItem ? cartItem.quantity : 0;

              return (
                <div key={food._id} className="bg-white border border-gray-100 p-5 rounded-3xl shadow-sm flex items-center justify-between gap-6 group hover:shadow-premium transition">
                  {/* Text meta */}
                  <div className="flex-grow space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-4 h-4 flex items-center justify-center border text-[9px] font-bold rounded-sm ${food.isVeg ? 'border-emerald-500 text-emerald-500' : 'border-red-500 text-red-500'}`}>
                        {food.isVeg ? 'V' : 'N'}
                      </span>
                      <h4 className="font-poppins font-bold text-base text-gray-800 group-hover:text-brand-500 transition leading-tight">{food.name}</h4>
                    </div>
                    <p className="text-xs text-gray-400 font-medium leading-relaxed max-w-xl">{food.description}</p>
                    <div className="flex items-center gap-4 pt-1">
                      <span className="text-sm font-bold text-gray-900">₹{food.discountPrice > 0 ? food.discountPrice : food.price}</span>
                      {food.discountPrice > 0 && (
                        <span className="text-xs text-gray-400 line-through">₹{food.price}</span>
                      )}
                    </div>
                  </div>

                  {/* Visual card + Add to cart console */}
                  <div className="flex flex-col items-center shrink-0 relative">
                    <img
                      src={food.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=120&q=80'}
                      alt={food.name}
                      className="w-24 h-24 rounded-2xl object-cover border border-gray-100 shadow-sm"
                    />

                    {/* Green ADD button */}
                    <div className="absolute -bottom-3.5 shadow-sm">
                      {qtyInCart > 0 ? (
                        <div className="flex items-center bg-white border border-emerald-500 text-emerald-600 rounded-xl px-2.5 py-1.5 gap-3.5 font-bold text-xs">
                          <button onClick={() => handleUpdateQuantity(food._id, qtyInCart, -1)} className="hover:opacity-70">
                            <Minus size={13} />
                          </button>
                          <span>{qtyInCart}</span>
                          <button onClick={() => handleUpdateQuantity(food._id, qtyInCart, 1)} className="hover:opacity-70">
                            <Plus size={13} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(food._id)}
                          className="bg-white border border-emerald-500 text-emerald-600 hover:bg-emerald-50 px-6 py-1.5 rounded-xl font-extrabold text-xs tracking-wider transition uppercase"
                        >
                          ADD
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredFoods.length === 0 && (
              <div className="text-center py-10 bg-white border border-gray-100 rounded-3xl text-gray-400">
                No food items available in this section.
              </div>
            )}
          </div>

          {/* 3. REVIEWS FEED SUB-SECTION */}
          <div className="pt-10 border-t border-gray-200 mt-16">
            <h3 className="font-poppins font-bold text-lg text-gray-800 mb-6 flex items-center gap-2">
              <MessageSquare size={18} className="text-brand-500" /> Customer Reviews ({reviews.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((rev) => (
                <div key={rev._id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={rev.userId?.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=60&q=80'}
                        alt={rev.userId?.name}
                        className="w-8 h-8 rounded-full object-cover border border-gray-200"
                      />
                      <span className="text-xs font-semibold text-gray-800">{rev.userId?.name || 'Anonymous'}</span>
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-400 text-xs font-bold">
                      <Star size={11} className="fill-amber-400" /> {rev.rating}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 font-medium leading-relaxed italic">"{rev.comment}"</p>
                </div>
              ))}

              {reviews.length === 0 && (
                <div className="col-span-2 py-8 bg-white border border-gray-100 rounded-2xl text-center text-gray-400 text-xs">
                  No customer reviews submitted yet. Be the first to order and review!
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. MULTI-VENDOR CART POLICY WARNING DIALOG MODAL */}
      {conflictModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 max-w-md w-full shadow-premium text-center space-y-6 animate-in fade-in zoom-in-95 duration-250">
            <span className="p-4 bg-amber-50 text-amber-500 rounded-full inline-block">
              <AlertCircle size={36} />
            </span>
            
            <div className="space-y-2">
              <h3 className="font-poppins font-bold text-gray-900 text-lg leading-tight">Replace Cart Items?</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Your cart currently contains food items from another restaurant. Standard food-delivery limits restrict you to a single vendor per order.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3.5 pt-2">
              <button
                type="button"
                onClick={() => { setConflictModalOpen(false); setConflictItem(null); }}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold rounded-2xl transition"
                disabled={modalLoading}
              >
                No, Keep Old
              </button>
              <button
                type="button"
                onClick={() => handleAddToCart(conflictItem, true)}
                className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-2xl shadow-glow transition flex items-center justify-center"
                disabled={modalLoading}
              >
                {modalLoading ? 'Clearing...' : 'Yes, Replace'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantDetails;
