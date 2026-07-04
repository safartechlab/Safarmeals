import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Search, MapPin, ArrowRight, ShieldCheck, Clock, Award, Star, Compass, Plus, Minus, AlertCircle, ShoppingBag, Utensils, Sparkles, X, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { setCart as updateCartState } from '../../redux/cartSlice';

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Search & Autocomplete suggestions states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ restaurants: [], foods: [] });
  const [searchFocused, setSearchFocused] = useState(false);
  const [searching, setSearching] = useState(false);

  // Main lists states
  const [featuredRestaurants, setFeaturedRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featuredFoods, setFeaturedFoods] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Multi-vendor Cart conflict states
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [conflictItem, setConflictItem] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const { items } = useSelector((state) => state.cart);
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const defaultAddress = user?.addresses?.find(a => a.isDefault) || user?.addresses?.[0];
  const lat = defaultAddress?.latitude;
  const lng = defaultAddress?.longitude;

  // 1. Fetch initial data on mount
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (lat) queryParams.append('lat', lat);
        if (lng) queryParams.append('lng', lng);

        // Fetch all active restaurants within 5 km
        const restRes = await api.get(`/user/restaurants?${queryParams.toString()}`);
        if (restRes.data.success && restRes.data.data) {
          const sorted = [...restRes.data.data].sort((a, b) => b.ratings - a.ratings);
          setFeaturedRestaurants(sorted.slice(0, 3));
          
          // Extrapolate list of cuisines as categories
          const allCuisines = Array.from(new Set(restRes.data.data.flatMap(r => r.cuisines)));
          setCategories(allCuisines.slice(0, 6));
        }

        // Fetch all food items (global search with no query returning all)
        const foodsRes = await api.get('/user/foods/search');
        if (foodsRes.data.success && foodsRes.data.data) {
          // Sort foods by rating or name, get top 8
          const sortedFoods = [...foodsRes.data.data].sort((a, b) => (b.rating || 4.5) - (a.rating || 4.5));
          setFeaturedFoods(sortedFoods.slice(0, 8));
        }

        // Fetch active coupon advertisements
        const offersRes = await api.get('/user/offers');
        if (offersRes.data.success && offersRes.data.data) {
          setOffers(offersRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load home page lists:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, [lat, lng]);

  // 2. Debounced Autocomplete Suggestion listener
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length <= 1) {
        setSearchResults({ restaurants: [], foods: [] });
        return;
      }
      setSearching(true);
      try {
        // Fetch matching foods
        const foodRes = await api.get(`/user/foods/search?query=${encodeURIComponent(searchQuery)}`);
        
        // Fetch and filter matching restaurants
        const restRes = await api.get('/user/restaurants');
        let matchedRest = [];
        if (restRes.data.success && restRes.data.data) {
          matchedRest = restRes.data.data.filter(r => 
            r.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.cuisines.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
          );
        }

        setSearchResults({
          restaurants: matchedRest.slice(0, 3),
          foods: foodRes.data.success ? foodRes.data.data.slice(0, 4) : []
        });
      } catch (err) {
        console.error('Failed to retrieve search suggestions:', err);
      } finally {
        setSearching(false);
      }
    };

    const timer = setTimeout(() => {
      fetchSuggestions();
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 3. Cart handlers
  const handleAddToCart = async (foodItemId, forceClear = false) => {
    if (!isAuthenticated) {
      alert('Please sign in or create an account to start ordering delicious meals!');
      return;
    }

    try {
      if (forceClear) setModalLoading(true);

      const response = await api.post('/orders/cart', {
        foodItemId,
        quantity: 1,
        forceClear
      });

      // Handle multi-vendor cart conflict (409 Status)
      if (response.status === 409 && response.data.conflict) {
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
      console.error('Add to cart operation failed:', err);
      // Double check if error contains multi-vendor conflict detail
      if (err.response?.status === 409 && err.response?.data?.conflict) {
        setConflictItem(foodItemId);
        setConflictModalOpen(true);
      } else {
        alert(err.response?.data?.message || 'Failed to add item to cart');
      }
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
      console.error('Failed to update cart quantity:', err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/restaurants?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/restaurants');
    }
  };

  // Close suggestions overlay when clicking out
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.search-container-box')) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div className="relative overflow-hidden bg-slate-50/50 pb-20 font-inter">
      {/* 1. HERO SECTION WITH INTELLIGENT SEARCH */}
      <section className="relative z-30 h-[620px] flex items-center justify-center bg-slate-900">
        {/* Background Image with Warm Overlay */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=1500&q=80"
            alt="Delicious gourmet table layout background"
            className="w-full h-full object-cover opacity-25 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />
        </div>

        {/* Hero Content Area */}
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6 search-container-box">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 px-4.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/35 text-[11px] font-black text-brand-400 mb-6 uppercase tracking-wider"
          >
            <Sparkles size={11} className="animate-pulse" /> THE NEON STANDARD OF GOURMET COURIER
          </motion.span>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-poppins font-black text-4xl sm:text-6xl text-white tracking-tight leading-none mb-6"
          >
            Manhattan's Finest Dishes,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-orange-500 to-amber-400">Delivered in Real-Time.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xs sm:text-sm text-slate-350 font-semibold max-w-2xl mx-auto leading-relaxed mb-10"
          >
            Indulge in hand-selected Michelin ratings, zesty artisanal woodfired pizzerias, and local smashed burger landmarks brought straight to your door.
          </motion.p>

          {/* Autocomplete Search Engine Container */}
          <div className="relative max-w-2xl mx-auto z-40">
            <motion.form
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              onSubmit={handleSearchSubmit}
              className="flex flex-col sm:flex-row items-center gap-3 bg-white/10 backdrop-blur-xl p-2.5 rounded-3xl border border-white/20 shadow-2xl"
            >
              <div className="flex items-center gap-2.5 flex-grow w-full px-4 text-white">
                <Search className="text-brand-400 shrink-0" size={18} />
                <input
                  type="text"
                  placeholder="Search cuisines, gourmet restaurants, or specific foods..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setSearchFocused(true); }}
                  onFocus={() => setSearchFocused(true)}
                  className="bg-transparent border-none outline-none w-full text-xs font-bold placeholder:text-slate-400 focus:ring-0 focus:outline-none"
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')} className="p-1 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition">
                    <X size={14} />
                  </button>
                )}
              </div>
              <button type="submit" className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-bold text-xs rounded-2xl shadow-glow transition duration-200">
                Find Food <ArrowRight size={14} />
              </button>
            </motion.form>

            {/* Suggestions Dropdown Overlay */}
            <AnimatePresence>
              {searchFocused && searchQuery.trim().length > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 right-0 mt-3 w-full bg-white border border-slate-100 rounded-3xl shadow-2xl p-5 text-left max-h-[380px] overflow-y-auto space-y-4 z-50 font-inter"
                >
                  {/* Matching Restaurants */}
                  <div>
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Compass size={11} className="text-slate-500" /> Restaurants Found
                    </h5>
                    <div className="space-y-1.5">
                      {searchResults.restaurants.map((shop) => (
                        <div
                          key={shop._id}
                          onClick={() => { setSearchFocused(false); navigate(`/restaurants/${shop._id}`); }}
                          className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-2xl cursor-pointer transition group"
                        >
                          <div className="flex items-center gap-2.5">
                            <img src={shop.logo} alt={shop.shopName} className="w-8 h-8 rounded-xl object-cover border border-slate-100" />
                            <div>
                              <div className="text-xs font-bold text-slate-800 group-hover:text-brand-500 transition">{shop.shopName}</div>
                              <div className="text-[9px] text-slate-450 font-semibold">{shop.cuisines.join(' • ')}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] font-extrabold text-amber-500">
                            <Star size={10} className="fill-amber-400" /> {shop.ratings}
                          </div>
                        </div>
                      ))}
                      {searchResults.restaurants.length === 0 && (
                        <div className="text-[10px] text-slate-450 italic pl-2">No matching eateries found</div>
                      )}
                    </div>
                  </div>

                  {/* Matching Dishes */}
                  <div className="border-t border-slate-100 pt-3">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Utensils size={11} className="text-slate-500" /> Gourmet Recipes
                    </h5>
                    <div className="space-y-1.5">
                      {searchResults.foods.map((food) => {
                        const cartItem = items.find(i => (i.foodItemId?._id || i.foodItemId) === food._id);
                        const quantityInCart = cartItem ? cartItem.quantity : 0;

                        return (
                          <div
                            key={food._id}
                            className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-2xl transition group"
                          >
                            <div
                              onClick={() => { setSearchFocused(false); navigate(`/restaurants/${food.shopId?._id}`); }}
                              className="flex items-center gap-2.5 cursor-pointer flex-grow"
                            >
                              <img src={food.image} alt={food.name} className="w-8 h-8 rounded-xl object-cover border border-slate-100" />
                              <div className="truncate max-w-[220px]">
                                <div className="text-xs font-bold text-slate-800 group-hover:text-brand-500 transition truncate">{food.name}</div>
                                <div className="text-[9px] text-slate-450 font-semibold truncate">by {food.shopId?.shopName}</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <span className="text-xs font-black text-emerald-500">₹{food.price}</span>
                              {quantityInCart > 0 ? (
                                <div className="flex items-center gap-1.5 bg-brand-50 border border-brand-200 rounded-lg px-1.5 py-0.5">
                                  <button type="button" onClick={() => handleUpdateQuantity(food._id, quantityInCart, -1)} className="text-brand-600 p-0.5"><Minus size={10} /></button>
                                  <span className="text-[10px] font-black text-brand-600">{quantityInCart}</span>
                                  <button type="button" onClick={() => handleUpdateQuantity(food._id, quantityInCart, 1)} className="text-brand-600 p-0.5"><Plus size={10} /></button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleAddToCart(food._id)}
                                  className="px-2 py-0.5 bg-brand-50 hover:bg-brand-100 text-brand-600 text-[10px] font-black rounded-lg transition"
                                >
                                  ADD
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {searchResults.foods.length === 0 && (
                        <div className="text-[10px] text-slate-450 italic pl-2">No matching dishes cataloged</div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* 2. PROMOTIONAL CAROUSEL BANNER CARDS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div whileHover={{ y: -8 }} className="p-8 bg-white border border-slate-100 rounded-3xl shadow-premium relative overflow-hidden group">
            <span className="absolute -right-12 -bottom-12 w-32 h-32 bg-brand-500/5 rounded-full group-hover:scale-125 transition duration-500" />
            <span className="p-3 bg-brand-50 text-brand-500 rounded-2xl inline-block mb-6 shadow-sm">
              <Clock size={22} />
            </span>
            <h3 className="font-poppins font-bold text-lg text-gray-900 mb-2">Hyper-Fast Courier</h3>
            <p className="text-xs text-gray-405 font-semibold leading-relaxed">Smart order dispatch routing guarantees your food arrives steaming hot under 30 minutes.</p>
          </motion.div>

          <motion.div whileHover={{ y: -8 }} className="p-8 bg-white border border-slate-100 rounded-3xl shadow-premium relative overflow-hidden group">
            <span className="absolute -right-12 -bottom-12 w-32 h-32 bg-amber-500/5 rounded-full group-hover:scale-125 transition duration-500" />
            <span className="p-3 bg-amber-50 text-amber-500 rounded-2xl inline-block mb-6 shadow-sm">
              <Award size={22} />
            </span>
            <h3 className="font-poppins font-bold text-lg text-gray-900 mb-2">Approved Culinary Standards</h3>
            <p className="text-xs text-gray-405 font-semibold leading-relaxed">Only approved, highly-rated restaurants are featured on our platform to ensure supreme taste.</p>
          </motion.div>

          <motion.div whileHover={{ y: -8 }} className="p-8 bg-white border border-slate-100 rounded-3xl shadow-premium relative overflow-hidden group">
            <span className="absolute -right-12 -bottom-12 w-32 h-32 bg-emerald-500/5 rounded-full group-hover:scale-125 transition duration-500" />
            <span className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl inline-block mb-6 shadow-sm">
              <ShieldCheck size={22} />
            </span>
            <h3 className="font-poppins font-bold text-lg text-gray-900 mb-2">100% Real-Time Track</h3>
            <p className="text-xs text-gray-455 font-semibold leading-relaxed">Watch every step from kitchen prep to out-for-delivery via bidirectional socket streams.</p>
          </motion.div>
        </div>
      </section>

      {/* 3. CATEGORIES/CUISINES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="font-poppins font-extrabold text-2xl sm:text-3xl text-gray-900 tracking-tight">Explore Local Cuisines</h2>
            <p className="text-xs text-gray-405 font-semibold mt-1">Browse and filter top rated meals based on your cravings.</p>
          </div>
          <Link to="/restaurants" className="flex items-center gap-1.5 text-xs font-bold text-brand-500 hover:text-brand-600 transition">
            See All <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
          {categories.map((c, i) => (
            <Link
              key={i}
              to={`/restaurants?cuisine=${encodeURIComponent(c)}`}
              className="flex flex-col items-center justify-center p-6 bg-white border border-slate-100 hover:border-brand-200 rounded-3xl shadow-sm hover:shadow-glow transition text-center group"
            >
              <span className="w-14 h-14 bg-brand-50 rounded-full flex items-center justify-center text-brand-500 mb-4 group-hover:scale-110 transition duration-300">
                <Compass size={22} />
              </span>
              <span className="font-poppins font-bold text-sm text-gray-800 capitalize leading-tight group-hover:text-brand-500 transition">{c}</span>
            </Link>
          ))}

          {categories.length === 0 && !loading && (
            ['Burgers', 'Pizzas', 'Pasta', 'Desserts', 'Salads', 'Sweets'].map((name, i) => (
              <Link
                key={i}
                to={`/restaurants?cuisine=${encodeURIComponent(name)}`}
                className="flex flex-col items-center justify-center p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:border-brand-200 transition text-center group"
              >
                <span className="w-14 h-14 bg-brand-50 rounded-full flex items-center justify-center text-brand-500 mb-4 group-hover:scale-110 transition">
                  <Compass size={22} />
                </span>
                <span className="font-poppins font-bold text-sm text-gray-800 group-hover:text-brand-500 transition">{name}</span>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* 4. [NEW] DYNAMIC GOURMET DISHES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="font-poppins font-extrabold text-2xl sm:text-3xl text-gray-900 tracking-tight">Trending Gourmet Dishes</h2>
            <p className="text-xs text-gray-405 font-semibold mt-1">Explore and checkout single-item specialties directly from your homepage catalog.</p>
          </div>
          <span className="flex items-center gap-1 px-3 py-1.5 bg-brand-500/10 border border-brand-500/20 text-brand-500 rounded-xl text-[10px] font-black uppercase tracking-wider">
            <Sparkles size={11} /> Fresh Selection
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-80 rounded-3xl bg-white border border-slate-100 p-4 flex flex-col gap-3">
                <div className="w-full h-44 rounded-2xl shimmer" />
                <div className="h-4 w-2/3 rounded shimmer" />
                <div className="h-3 w-1/2 rounded shimmer" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredFoods.map((food) => {
              const cartItem = items.find(i => (i.foodItemId?._id || i.foodItemId) === food._id);
              const quantityInCart = cartItem ? cartItem.quantity : 0;

              return (
                <div key={food._id} className="bg-white border border-slate-100 rounded-[24px] overflow-hidden shadow-sm hover:shadow-premium transition-all duration-300 flex flex-col justify-between group">
                  {/* Photo details container */}
                  <div className="relative h-44 overflow-hidden bg-slate-100 shrink-0">
                    <img
                      src={food.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'}
                      alt={food.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Floating Rating Badge */}
                    <div className="absolute top-3.5 right-3.5 flex items-center gap-1 px-2.5 py-1 bg-white/95 rounded-full text-[10px] font-black text-gray-900 shadow-sm border border-slate-100">
                      <Star size={11} className="fill-amber-400 stroke-amber-400" />
                      <span>{food.rating || '4.8'}</span>
                    </div>

                    {/* Veg/Non-veg Flag badge */}
                    <span className={`absolute top-3.5 left-3.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider bg-white ${
                      food.isVeg
                        ? 'border-emerald-250 text-emerald-600'
                        : 'border-red-200 text-red-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${food.isVeg ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                      {food.isVeg ? 'Veg' : 'Non-veg'}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-grow flex flex-col justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-poppins font-black text-sm text-gray-800 line-clamp-1 truncate group-hover:text-brand-500 transition-colors leading-tight">{food.name}</h4>
                      </div>
                      <span className="inline-block px-2 py-0.5 bg-slate-50 border border-slate-100 text-[9px] font-black text-slate-450 rounded-md uppercase tracking-wider leading-none">
                        {food.categoryId?.name || 'Cuisine'}
                      </span>
                      <p className="text-[11px] text-slate-405 font-medium leading-relaxed line-clamp-2 pt-1">{food.description}</p>
                    </div>

                    {/* Bottom row items (restaurant name & quick cart) */}
                    <div className="pt-3 border-t border-slate-50 flex items-center justify-between gap-3 shrink-0">
                      {food.shopId && (
                        <Link
                          to={`/restaurants/${food.shopId._id}`}
                          className="flex items-center gap-1.5 truncate max-w-[120px] hover:text-brand-500 transition"
                          title={`Cooked by ${food.shopId.shopName}`}
                        >
                          <img src={food.shopId.logo} alt="" className="w-5 h-5 rounded-full object-cover border border-slate-100 shrink-0" />
                          <span className="text-[10px] font-black text-slate-550 truncate">{food.shopId.shopName}</span>
                        </Link>
                      )}

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="text-sm font-black text-emerald-500 tracking-tight">₹{food.price}</span>
                        
                        {quantityInCart > 0 ? (
                          <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-xl px-2 py-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(food._id, quantityInCart, -1)}
                              className="p-0.5 hover:bg-brand-100 rounded text-brand-650 transition"
                            >
                              <Minus size={11} strokeWidth={2.5} />
                            </button>
                            <span className="text-xs font-black text-brand-600 px-0.5">{quantityInCart}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(food._id, quantityInCart, 1)}
                              className="p-0.5 hover:bg-brand-100 rounded text-brand-650 transition"
                            >
                              <Plus size={11} strokeWidth={2.5} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddToCart(food._id)}
                            className="flex items-center gap-1 px-3.5 py-1.5 bg-brand-50 border border-brand-200 hover:bg-brand-100 text-brand-600 hover:text-brand-700 text-xs font-black rounded-xl transition shadow-sm active:scale-95 shrink-0"
                          >
                            <Plus size={11} strokeWidth={2.5} /> ADD
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {featuredFoods.length === 0 && (
              <div className="col-span-4 text-center py-10 bg-white border border-slate-100 rounded-3xl text-slate-400 text-xs font-medium">
                No active gourmet food items registered yet.
              </div>
            )}
          </div>
        )}
      </section>

      {/* 5. POPULAR RESTAURANTS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="font-poppins font-extrabold text-2xl sm:text-3xl text-gray-900 tracking-tight">Trending Establishments</h2>
            <p className="text-xs text-gray-405 font-semibold mt-1">High-quality dining places matching local popularity charts.</p>
          </div>
          <Link to="/restaurants" className="flex items-center gap-1.5 text-xs font-bold text-brand-500 hover:text-brand-600 transition">
            View Map <Compass size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-80 rounded-3xl bg-white border border-slate-100 overflow-hidden flex flex-col p-4 gap-3">
                <div className="w-full h-44 rounded-2xl shimmer" />
                <div className="h-4 w-2/3 rounded shimmer" />
                <div className="h-3 w-1/2 rounded shimmer" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredRestaurants.map((shop) => (
              <Link
                key={shop._id}
                to={`/restaurants/${shop._id}`}
                className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-premium transition flex flex-col group"
              >
                {/* Banner Photo */}
                <div className="relative h-48 overflow-hidden bg-gray-200">
                  <img
                    src={shop.banner || 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=500&q=80'}
                    alt={shop.shopName}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  
                  {/* Floating Rating Badge */}
                  <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1.5 bg-white/95 rounded-full text-xs font-bold shadow-sm border border-slate-100">
                    <Star size={13} className="fill-amber-400 stroke-amber-400" />
                    <span className="text-gray-900">{shop.ratings || 'New'}</span>
                  </div>

                  {/* Timing Flag */}
                  <div className="absolute bottom-4 left-4 text-[10px] font-semibold text-white px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-md uppercase tracking-wider">
                    {shop.openingTime} - {shop.closingTime}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-grow flex flex-col justify-between">
                  <div>
                    <h3 className="font-poppins font-bold text-lg text-gray-900 mb-1 group-hover:text-brand-500 transition truncate">{shop.shopName}</h3>
                    <p className="text-xs text-slate-405 font-semibold line-clamp-2 leading-relaxed mb-4">{shop.description}</p>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-gray-500">
                    <span className="font-bold bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full text-slate-600 capitalize">
                      {shop.cuisines[0] || 'Gourmet'}
                    </span>
                    <span className="font-medium flex items-center gap-1">
                      <MapPin size={12} className="text-brand-500" />
                      {shop.distance !== undefined && shop.distance !== null
                        ? `${shop.distance.toFixed(1)} km away`
                        : shop.address.city
                      }
                    </span>
                  </div>
                </div>
              </Link>
            ))}

            {featuredRestaurants.length === 0 && (
              <div className="col-span-3 text-center py-10 bg-white border border-slate-100 rounded-3xl text-slate-400">
                No active restaurants found. Please run the seed script!
              </div>
            )}
          </div>
        )}
      </section>

      {/* 6. OFFERS BANNER PROMOTION SECTION */}
      {offers.length > 0 ? (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
          <div className="mb-8 text-left">
            <h2 className="font-poppins font-extrabold text-2xl sm:text-3xl text-gray-900 tracking-tight">Special Partner Deals</h2>
            <p className="text-xs text-gray-400 font-semibold mt-1">Order from these select restaurants to redeem exclusive coupon discounts.</p>
          </div>
          
          <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-gray-250">
            {offers.map((off) => (
              <div
                key={off._id}
                className="flex-shrink-0 w-full md:w-[540px] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 rounded-[32px] p-8 md:p-10 relative overflow-hidden shadow-premium text-white flex flex-col sm:flex-row items-center justify-between gap-6 border border-slate-800 text-left"
              >
                {/* Background animations */}
                <span className="absolute -right-20 -bottom-20 w-80 h-80 bg-brand-500/5 rounded-full" />
                <span className="absolute -left-20 -top-20 w-80 h-80 bg-brand-500/5 rounded-full" />
                
                <div className="relative z-10 space-y-4 max-w-xs text-left">
                  {off.shopId ? (
                    <div className="flex items-center gap-2">
                      <img src={off.shopId.logo || 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=50&q=80'} alt="" className="w-6 h-6 rounded-full object-cover border border-white/20 shrink-0" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-brand-400">Exclusive Deal at {off.shopId.shopName}</span>
                    </div>
                  ) : (
                    <span className="inline-block px-2.5 py-0.5 bg-brand-500/20 text-brand-400 rounded-full text-[9px] font-bold uppercase tracking-wider border border-brand-500/20">Platform Coupon</span>
                  )}
                  
                  <h3 className="font-poppins font-black text-xl sm:text-2xl tracking-tight leading-none text-white">{off.title}</h3>
                  <p className="text-[11px] text-slate-350 leading-relaxed font-medium">
                    {off.description || `Get ${off.discountPercentage}% discount on orders above ₹${off.minOrderAmount}. Max discount ₹${off.maxDiscountAmount}.`}
                  </p>
                  
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] text-slate-400 font-bold">Code:</span>
                    <span className="bg-white/10 border border-white/10 font-mono font-black px-2.5 py-1 rounded text-white tracking-widest text-xs uppercase">
                      {off.code}
                    </span>
                  </div>
                  
                  {off.shopId && (
                    <Link
                      to={`/restaurants/${off.shopId._id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-400 hover:text-brand-300 transition"
                    >
                      Visit Restaurant Menu <ArrowRight size={12} />
                    </Link>
                  )}
                </div>

                <div className="relative z-10 w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-[20px] overflow-hidden border-2 border-white/10 shadow-premium">
                  <img
                    src={off.shopId?.banner || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=300&q=80'}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
          <div className="bg-gradient-to-br from-brand-600 to-brand-500 rounded-[32px] p-10 md:p-14 relative overflow-hidden shadow-glow text-white flex flex-col md:flex-row items-center justify-between gap-8">
            <span className="absolute -left-20 -bottom-20 w-80 h-80 bg-white/5 rounded-full" />
            <span className="absolute -right-20 -top-20 w-80 h-80 bg-white/5 rounded-full" />
            
            <div className="max-w-xl relative z-10 text-left">
              <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 border border-white/10">LIMITED FEAST PACKS</span>
              <h2 className="font-poppins font-black text-3xl sm:text-4xl tracking-tight leading-none mb-4">First Meal Half Off!</h2>
              <p className="text-sm text-brand-100 font-light leading-relaxed mb-6">
                Establish a new SAFARMEAL account today and enjoy a massive 50% discount on orders exceeding ₹150. Use checkout code <span className="bg-white/20 font-bold px-2 py-0.5 rounded text-white tracking-widest text-xs">WELCOME50</span>.
              </p>
              <Link to="/restaurants" className="inline-flex items-center gap-2 bg-white text-brand-600 hover:bg-brand-50 active:scale-95 px-6 py-3 rounded-2xl font-bold text-xs shadow-sm transition">
                Redeem Promotion <ArrowRight size={14} />
              </Link>
            </div>

            <div className="relative z-10 w-full max-w-[300px] shrink-0 transform hover:scale-105 transition duration-300">
              <img
                src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80"
                alt="Artisanal neapolitan pizza box representation"
                className="w-full rounded-[24px] shadow-premium border-4 border-white/20"
              />
            </div>
          </div>
        </section>
      )}

      {/* 7. MULTI-VENDOR CART POLICY WARNING DIALOG MODAL */}
      {conflictModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[32px] border border-slate-100 p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-6 animate-in fade-in-90 zoom-in-95 duration-200 z-50">
            <span className="p-4 bg-amber-50 text-amber-500 rounded-full inline-block">
              <AlertCircle size={36} />
            </span>
            
            <div className="space-y-2">
              <h3 className="font-poppins font-bold text-gray-900 text-lg leading-tight">Replace Cart Items?</h3>
              <p className="text-xs text-slate-450 leading-relaxed font-semibold">
                Your cart currently contains food items from another restaurant. SAFARMEAL limits bookings to a single restaurant per checkout order to ensure streamlined operations.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3.5 pt-2">
              <button
                type="button"
                onClick={() => { setConflictModalOpen(false); setConflictItem(null); }}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-2xl transition"
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

export default Home;
