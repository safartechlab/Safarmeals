import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, MapPin, Star, Filter, ArrowUpDown, ChevronRight, Store } from 'lucide-react';
import { useSelector } from 'react-redux';
import api from '../../services/api';

const RestaurantListing = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user } = useSelector((state) => state.auth || {});
  const defaultAddress = user?.addresses?.find(a => a.isDefault) || user?.addresses?.[0];
  const lat = defaultAddress?.latitude;
  const lng = defaultAddress?.longitude;

  // Filters State
  const [searchVal, setSearchVal] = useState(searchParams.get('search') || '');
  const [selectedCuisine, setSelectedCuisine] = useState(searchParams.get('cuisine') || '');
  const [minRating, setMinRating] = useState(searchParams.get('rating') || '');
  const [sortOption, setSortOption] = useState(searchParams.get('sort') || 'rating');

  useEffect(() => {
    // Sync UI with query param changes
    setSearchVal(searchParams.get('search') || '');
    setSelectedCuisine(searchParams.get('cuisine') || '');
    setMinRating(searchParams.get('rating') || '');
    setSortOption(searchParams.get('sort') || 'rating');

    const fetchRestaurants = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        const search = searchParams.get('search');
        const cuisine = searchParams.get('cuisine');
        const rating = searchParams.get('rating');
        const sort = searchParams.get('sort');

        if (search) queryParams.append('search', search);
        if (cuisine) queryParams.append('cuisine', cuisine);
        if (rating) queryParams.append('rating', rating);
        if (sort) queryParams.append('sort', sort);
        if (lat) queryParams.append('lat', lat);
        if (lng) queryParams.append('lng', lng);

        const { data } = await api.get(`/user/restaurants?${queryParams.toString()}`);
        if (data.success) {
          setRestaurants(data.data);
        }
      } catch (err) {
        console.error('Failed to query shops database:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [searchParams, lat, lng]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    const newParams = {};
    if (searchVal.trim()) newParams.search = searchVal;
    if (selectedCuisine) newParams.cuisine = selectedCuisine;
    if (minRating) newParams.rating = minRating;
    if (sortOption) newParams.sort = sortOption;
    setSearchParams(newParams);
  };

  const handleResetFilters = () => {
    setSearchVal('');
    setSelectedCuisine('');
    setMinRating('');
    setSortOption('rating');
    setSearchParams({});
  };

  // Cuisines lists extrapolation
  const availableCuisines = ['Burgers', 'Pizzas', 'Pasta', 'Desserts', 'Italian', 'American', 'Fast Food', 'Bakery'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-inter">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-xs text-gray-400 font-semibold mb-6">
        <Link to="/" className="hover:text-brand-500">Home</Link>
        <ChevronRight size={12} />
        <span className="text-gray-600">Explore Restaurants</span>
      </div>

      {/* Title */}
      <div className="mb-8">
        <h1 className="font-poppins font-extrabold text-2xl sm:text-4xl text-gray-900 tracking-tight">Manhattan Restaurants</h1>
        <p className="text-xs text-gray-400 font-semibold mt-1">Browse our network of {restaurants.length} gourmet affiliates.</p>
      </div>

      {/* Main Grid: Filters Sidebar + Restaurant Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Panel */}
        <div className="lg:col-span-1">
          <form onSubmit={handleFilterSubmit} className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <span className="flex items-center gap-2 font-poppins font-bold text-sm text-gray-900">
                <Filter size={16} className="text-brand-500" /> Filters
              </span>
              <button type="button" onClick={handleResetFilters} className="text-[10px] font-bold text-brand-500 hover:text-brand-600">
                Reset All
              </button>
            </div>

            {/* Keyword Search */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Search Keywords</label>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl">
                <Search size={14} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Restaurant, cuisine..."
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-xs font-semibold placeholder:text-gray-400 focus:ring-0 focus:outline-none"
                />
              </div>
            </div>

            {/* Cuisine Category */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cuisine Category</label>
              <select
                value={selectedCuisine}
                onChange={(e) => setSelectedCuisine(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 text-gray-600"
              >
                <option value="">All Cuisines</option>
                {availableCuisines.map((c) => (
                  <option key={c} value={c.toLowerCase()}>{c}</option>
                ))}
              </select>
            </div>

            {/* Star Rating Minimum */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Star Rating Minimum</label>
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 4.5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setMinRating(star.toString())}
                    className={`py-1.5 text-[10px] font-bold rounded-lg border transition ${minRating === star.toString() ? 'border-brand-500 bg-brand-50 text-brand-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    {star}★
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Strategy */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sort Strategy</label>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 text-gray-600"
              >
                <option value="rating">Top Rated ⭐</option>
                <option value="newest">Newly Approved 🆕</option>
              </select>
            </div>

            <button type="submit" className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-glow transition">
              Apply Filters
            </button>
          </form>
        </div>

        {/* Restaurant Cards Listings Grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[1, 2, 4].map((n) => (
                <div key={n} className="h-80 rounded-3xl bg-white border border-gray-100 p-4 gap-3 flex flex-col overflow-hidden">
                  <div className="w-full h-44 rounded-2xl shimmer" />
                  <div className="h-4 w-2/3 rounded shimmer" />
                  <div className="h-3 w-1/2 rounded shimmer" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {restaurants.map((shop) => (
                  <Link
                    key={shop._id}
                    to={`/restaurants/${shop._id}`}
                    className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-premium transition flex flex-col group"
                  >
                    {/* Cover photo */}
                    <div className="relative h-44 overflow-hidden bg-gray-200">
                      <img
                        src={shop.banner || 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=400&q=80'}
                        alt={shop.shopName}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                      
                      {/* Floating Rating Badge */}
                      <div className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 bg-white/95 rounded-full text-[10px] font-extrabold shadow-sm text-gray-900">
                        <Star size={11} className="fill-amber-400 stroke-amber-400" />
                        <span>{shop.ratings || 'New'}</span>
                      </div>
                    </div>

                    {/* Meta description */}
                    <div className="p-5 flex-grow flex flex-col justify-between">
                      <div>
                        <h3 className="font-poppins font-bold text-base text-gray-900 mb-1 group-hover:text-brand-500 transition truncate">{shop.shopName}</h3>
                        <p className="text-[11px] text-gray-400 font-medium line-clamp-2 leading-relaxed mb-4">{shop.description}</p>
                      </div>

                      <div className="pt-3 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-500 font-medium">
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md capitalize">
                          {shop.cuisines[0] || 'Fast Food'}
                        </span>
                        <span className="flex items-center gap-0.5 text-gray-400">
                          <MapPin size={11} className="text-brand-500" />
                          {shop.distance !== undefined && shop.distance !== null
                            ? `${shop.distance.toFixed(1)} km away`
                            : shop.address.city
                          }
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {restaurants.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-100 rounded-3xl text-center p-6">
                  <span className="p-4 bg-gray-50 rounded-full text-gray-400 mb-4 inline-block">
                    <Store size={36} />
                  </span>
                  <h3 className="font-poppins font-bold text-gray-800 text-lg mb-1">No Restaurants Found</h3>
                  <p className="text-xs text-gray-400 max-w-xs leading-relaxed">No approved restaurants match your active filter attributes. Try resetting your filters.</p>
                  <button onClick={handleResetFilters} className="mt-4 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-glow transition">
                    Clear Filters
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantListing;
