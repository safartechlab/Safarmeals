import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Save, X, PlusCircle, Check, HelpCircle, Eye, EyeOff, Sparkles, FolderOpen, Utensils } from 'lucide-react';
import api from '../../services/api';

const Menu = () => {
  const [activeTab, setActiveTab] = useState('dishes'); // dishes or categories
  const [categories, setCategories] = useState([]);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals toggles
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [foodModalOpen, setFoodModalOpen] = useState(false);

  // Category Form State
  const [categoryName, setCategoryName] = useState('');
  const [categoryImage, setCategoryImage] = useState(null);

  // Food Item Form State
  const [editingFood, setEditingFood] = useState(null); // null when adding, holds object when editing
  const [foodForm, setFoodForm] = useState({
    name: '',
    description: '',
    price: '',
    discountPrice: '',
    categoryId: '',
    isVeg: true,
    isAvailable: true,
    preparationTime: 30,
    ingredients: ''
  });
  const [foodImage, setFoodImage] = useState(null);

  // Load Categories & Foods
  const loadMenuData = async () => {
    setLoading(true);
    setError('');
    try {
      const [catsRes, foodsRes] = await Promise.all([
        api.get('/shop/categories'),
        api.get('/shop/foods')
      ]);
      if (catsRes.data.success) setCategories(catsRes.data.data);
      if (foodsRes.data.success) setFoods(foodsRes.data.data);
    } catch (err) {
      console.error('Failed to load menu info:', err);
      const errMsg = err.response?.data?.message || 'Could not retrieve categories or dishes catalog. Please try again.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenuData();
  }, []);

  // Category Submit
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    try {
      const formData = new FormData();
      formData.append('name', categoryName.trim());
      if (categoryImage) {
        formData.append('image', categoryImage);
      }

      const { data } = await api.post('/shop/categories', formData);
      if (data.success) {
        setCategories([...categories, data.data]);
        setCategoryName('');
        setCategoryImage(null);
        setCategoryModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to create category. Ensure image is under 5MB.');
    }
  };

  // Category Delete
  const handleCategoryDelete = async (id) => {
    if (!window.confirm('Deleting this category will automatically delete all food items associated with it. Do you want to proceed?')) {
      return;
    }
    try {
      const { data } = await api.delete(`/shop/categories/${id}`);
      if (data.success) {
        // Reload everything since foods associated with it are wiped on backend
        loadMenuData();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete category.');
    }
  };

  // Food Form Inputs Handlers
  const handleFoodInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFoodForm({
      ...foodForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Open Add Food Modal
  const openAddFoodModal = () => {
    setEditingFood(null);
    setFoodForm({
      name: '',
      description: '',
      price: '',
      discountPrice: '',
      categoryId: categories[0]?._id || '',
      isVeg: true,
      isAvailable: true,
      preparationTime: 30,
      ingredients: ''
    });
    setFoodImage(null);
    setFoodModalOpen(true);
  };

  // Open Edit Food Modal
  const openEditFoodModal = (food) => {
    setEditingFood(food);
    setFoodForm({
      name: food.name,
      description: food.description,
      price: food.price,
      discountPrice: food.discountPrice || '',
      categoryId: food.categoryId?._id || food.categoryId || '',
      isVeg: food.isVeg,
      isAvailable: food.isAvailable,
      preparationTime: food.preparationTime || 30,
      ingredients: food.ingredients ? food.ingredients.join(', ') : ''
    });
    setFoodImage(null);
    setFoodModalOpen(true);
  };

  // Food Submit (Create or Update)
  const handleFoodSubmit = async (e) => {
    e.preventDefault();
    if (!foodForm.name || !foodForm.price || !foodForm.categoryId) {
      alert('Please fill out all required fields (Name, Price, Category)');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', foodForm.name);
      formData.append('description', foodForm.description);
      formData.append('price', foodForm.price);
      formData.append('discountPrice', foodForm.discountPrice || 0);
      formData.append('categoryId', foodForm.categoryId);
      formData.append('isVeg', foodForm.isVeg);
      formData.append('isAvailable', foodForm.isAvailable);
      formData.append('preparationTime', foodForm.preparationTime);
      formData.append('ingredients', foodForm.ingredients);
      if (foodImage) {
        formData.append('image', foodImage);
      }

      if (editingFood) {
        // PUT Edit
        const { data } = await api.put(`/shop/foods/${editingFood._id}`, formData);
        if (data.success) {
          setFoods(foods.map(f => f._id === editingFood._id ? data.data : f));
          setFoodModalOpen(false);
          loadMenuData(); // Reload to populate category name nicely
        }
      } else {
        // POST Add
        const { data } = await api.post('/shop/foods', formData);
        if (data.success) {
          setFoods([...foods, data.data]);
          setFoodModalOpen(false);
          loadMenuData(); // Reload to populate category name nicely
        }
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save food item details.');
    }
  };

  // Toggle Food Availability Quick Action
  const toggleAvailability = async (food) => {
    try {
      const { data } = await api.put(`/shop/foods/${food._id}`, {
        isAvailable: !food.isAvailable
      });
      if (data.success) {
        setFoods(foods.map(f => f._id === food._id ? { ...f, isAvailable: data.data.isAvailable } : f));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to toggle food availability.');
    }
  };

  // Food Delete
  const handleFoodDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this food item permanently?')) {
      return;
    }
    try {
      const { data } = await api.delete(`/shop/foods/${id}`);
      if (data.success) {
        setFoods(foods.filter(f => f._id !== id));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to remove food item.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-10 w-48 bg-slate-900 rounded-xl shimmer-dark" />
          <div className="h-10 w-32 bg-slate-900 rounded-xl shimmer-dark" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="h-64 bg-slate-900 rounded-3xl shimmer-dark" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-inter text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-poppins font-black text-2xl sm:text-3xl text-white">Menu & Dishes Catalog</h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">Manage categories, menu items, pricing, and active kitchen availabilities.</p>
        </div>

        {/* Tab Toggles & Add buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('dishes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'dishes' ? 'bg-brand-500 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
          >
            Dishes ({foods.length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'categories' ? 'bg-brand-500 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
          >
            Categories ({categories.length})
          </button>

          {activeTab === 'dishes' ? (
            <button
              onClick={openAddFoodModal}
              disabled={categories.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition"
            >
              <Plus size={14} /> Add Dish
            </button>
          ) : (
            <button
              onClick={() => setCategoryModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition"
            >
              <Plus size={14} /> Add Category
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-900/50 rounded-2xl text-xs text-red-400 font-medium">
          {error}
        </div>
      )}

      {/* DISHES CATALOG VIEW */}
      {activeTab === 'dishes' && (
        <>
          {categories.length === 0 && (
            <div className="p-8 bg-slate-900 border border-slate-850 rounded-3xl text-center max-w-lg mx-auto">
              <FolderOpen size={48} className="mx-auto text-slate-600 mb-3" />
              <h3 className="font-poppins font-bold text-sm text-white">Create a category first</h3>
              <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed">
                Before adding foods, you need to create at least one category (e.g. "Starters", "Pizzas") to group your items properly.
              </p>
              <button
                onClick={() => setActiveTab('categories')}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl transition"
              >
                Create Categories
              </button>
            </div>
          )}

          {categories.length > 0 && foods.length === 0 && (
            <div className="p-8 bg-slate-900 border border-slate-850 rounded-3xl text-center max-w-lg mx-auto">
              <Utensils size={48} className="mx-auto text-slate-600 mb-3" />
              <h3 className="font-poppins font-bold text-sm text-white">No dishes registered</h3>
              <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed">
                Start adding dishes to your menu catalog. Your customers will see these items immediately when they browse your restaurant.
              </p>
              <button
                onClick={openAddFoodModal}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition"
              >
                Add Your First Dish
              </button>
            </div>
          )}

          {foods.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {foods.map((food) => (
                <div
                  key={food._id}
                  className={`bg-slate-900 border ${food.isAvailable ? 'border-slate-850' : 'border-slate-850 opacity-70'} p-5 rounded-3xl shadow-premium flex flex-col justify-between space-y-4 transition hover:border-slate-700`}
                >
                  <div className="space-y-3">
                    {/* Dish Image */}
                    <div className="relative h-40 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800">
                      <img
                        src={food.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80'}
                        alt={food.name}
                        className="w-full h-full object-cover"
                      />
                      <span className={`absolute top-3 left-3 px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase ${food.isVeg ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/60' : 'bg-rose-950 text-rose-400 border border-rose-900/60'}`}>
                        {food.isVeg ? 'Veg' : 'Non-Veg'}
                      </span>
                      {food.discountPrice > 0 && (
                        <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-md text-[9px] font-extrabold bg-amber-950 text-amber-400 border border-amber-900/60">
                          OFFER ACTIVE
                        </span>
                      )}
                    </div>

                    {/* Dish Info */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-poppins font-black text-sm text-white truncate max-w-[170px]">{food.name}</h4>
                        <span className="px-2 py-0.5 bg-slate-850 rounded-full text-[9px] font-bold text-slate-400">
                          {food.categoryId?.name || 'Dish Category'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 h-8 leading-relaxed">{food.description}</p>
                    </div>

                    {/* Prices */}
                    <div className="flex items-center gap-2 pt-1">
                      {food.discountPrice > 0 ? (
                        <>
                          <span className="text-sm font-black text-emerald-400">₹{food.discountPrice}</span>
                          <span className="text-xs font-semibold text-slate-500 line-through">₹{food.price}</span>
                        </>
                      ) : (
                        <span className="text-sm font-black text-white">₹{food.price}</span>
                      )}
                      <span className="text-[10px] text-slate-400 font-semibold ml-auto">{food.preparationTime} mins prep</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between border-t border-slate-850 pt-4 mt-2">
                    {/* Toggle Availability */}
                    <button
                      onClick={() => toggleAvailability(food)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition ${food.isAvailable ? 'bg-slate-850 text-slate-300 border-slate-800 hover:bg-slate-800' : 'bg-amber-950/20 text-amber-400 border-amber-900/40 hover:bg-amber-950/40'}`}
                    >
                      {food.isAvailable ? <Eye size={12} /> : <EyeOff size={12} />}
                      {food.isAvailable ? 'Available' : 'Unavailable'}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditFoodModal(food)}
                        className="p-2 bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl transition"
                        title="Edit Dish"
                      >
                        <Edit size={12} />
                      </button>
                      <button
                        onClick={() => handleFoodDelete(food._id)}
                        className="p-2 bg-red-950/30 border border-red-900/30 text-red-400 hover:bg-red-950/60 rounded-xl transition"
                        title="Delete Dish"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* CATEGORIES MANAGEMENT VIEW */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Categories Grid (Left 2 columns) */}
          <div className="lg:col-span-2 space-y-4">
            {categories.length === 0 ? (
              <div className="p-8 bg-slate-900 border border-slate-850 rounded-3xl text-center py-16">
                <FolderOpen size={48} className="mx-auto text-slate-600 mb-3" />
                <h3 className="font-poppins font-bold text-sm text-white">No categories found</h3>
                <p className="text-xs text-slate-400 mt-1">Add categories like "Fast Food", "Chinese", or "Desserts" using the panel on the right.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categories.map((cat) => (
                  <div key={cat._id} className="bg-slate-900 border border-slate-850 p-4 rounded-2xl flex items-center justify-between hover:border-slate-800 transition">
                    <div className="flex items-center gap-3">
                      <img
                        src={cat.image || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=80&q=80'}
                        alt={cat.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-800"
                      />
                      <div>
                        <h4 className="font-poppins font-bold text-sm text-white">{cat.name}</h4>
                        <p className="text-[9px] font-semibold text-slate-400 uppercase">Category Tag</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCategoryDelete(cat._id)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/20 rounded-xl transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Add Category Card (Right 1 column) */}
          <div className="lg:col-span-1 bg-slate-900 border border-slate-850 p-6 rounded-3xl shadow-premium h-fit">
            <h3 className="font-poppins font-bold text-sm text-white flex items-center gap-2 mb-4">
              <FolderOpen size={16} className="text-brand-500" /> Create Custom Category
            </h3>

            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 tracking-wider">CATEGORY NAME</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Starters, Main Course, Drinks"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-3 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 tracking-wider">IMAGE (OPTIONAL)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCategoryImage(e.target.files[0])}
                  className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-white hover:file:bg-slate-700 cursor-pointer"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow-glow transition mt-2"
              >
                Create Category
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY MODAL FOR MOBILE / ACTION SLIDES */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-premium relative animate-fade-in">
            <button
              onClick={() => setCategoryModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl"
            >
              <X size={18} />
            </button>

            <div>
              <h3 className="font-poppins font-black text-lg text-white">Create New Category</h3>
              <p className="text-[10px] font-semibold text-slate-400 uppercase mt-0.5">Organize your restaurant menu</p>
            </div>

            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pizzas, Desserts"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-3 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400">Category Cover Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCategoryImage(e.target.files[0])}
                  className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-white hover:file:bg-slate-700 cursor-pointer"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="flex-1 py-3 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow-glow transition"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOOD ITEM MODAL (ADD & EDIT) */}
      {foodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-premium relative my-8">
            <button
              onClick={() => setFoodModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white rounded-xl"
            >
              <X size={18} />
            </button>

            <div>
              <h3 className="font-poppins font-black text-xl text-white">
                {editingFood ? `Edit "${editingFood.name}"` : 'Add New Dish to Menu'}
              </h3>
              <p className="text-[10px] font-semibold text-slate-400 uppercase mt-0.5">
                {editingFood ? 'Modify details, price and availability' : 'Insert pricing, descriptions and tags'}
              </p>
            </div>

            <form onSubmit={handleFoodSubmit} className="space-y-5">
              {/* Grid 1: Name and Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400">Dish Name *</label>
                  <input
                    type="text"
                    required
                    name="name"
                    value={foodForm.name}
                    onChange={handleFoodInputChange}
                    placeholder="e.g. Classic Margherita Pizza"
                    className="w-full text-xs font-semibold px-4 py-3 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400">Category *</label>
                  <select
                    name="categoryId"
                    value={foodForm.categoryId}
                    onChange={handleFoodInputChange}
                    className="w-full text-xs font-semibold px-4 py-3 bg-slate-950 border border-slate-800 text-slate-300 rounded-xl focus:outline-none focus:border-brand-500"
                  >
                    {categories.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Grid 2: Prices & Prep time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400">Base Price (₹) *</label>
                  <input
                    type="number"
                    required
                    name="price"
                    value={foodForm.price}
                    onChange={handleFoodInputChange}
                    placeholder="250"
                    className="w-full text-xs font-semibold px-4 py-3 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400">Discounted Price (₹)</label>
                  <input
                    type="number"
                    name="discountPrice"
                    value={foodForm.discountPrice}
                    onChange={handleFoodInputChange}
                    placeholder="Leave empty if no discount"
                    className="w-full text-xs font-semibold px-4 py-3 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400">Prep Time (minutes)</label>
                  <input
                    type="number"
                    name="preparationTime"
                    value={foodForm.preparationTime}
                    onChange={handleFoodInputChange}
                    placeholder="30"
                    className="w-full text-xs font-semibold px-4 py-3 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400">Short Description</label>
                <textarea
                  name="description"
                  rows="3"
                  value={foodForm.description}
                  onChange={handleFoodInputChange}
                  placeholder="Describe your delicious recipe, flavors, allergens..."
                  className="w-full text-xs font-semibold px-4 py-3 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Ingredients */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400">Ingredients (comma separated)</label>
                <input
                  type="text"
                  name="ingredients"
                  value={foodForm.ingredients}
                  onChange={handleFoodInputChange}
                  placeholder="Mozzarella, Fresh Basil, Tomatoes, Extra Virgin Olive Oil"
                  className="w-full text-xs font-semibold px-4 py-3 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Grid 3: File Image & Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400">Dish Display Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFoodImage(e.target.files[0])}
                    className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-white hover:file:bg-slate-700 cursor-pointer"
                  />
                </div>

                {/* Checklist toggles */}
                <div className="flex items-center gap-6 pb-2.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isVeg"
                      checked={foodForm.isVeg}
                      onChange={handleFoodInputChange}
                      className="w-4.5 h-4.5 bg-slate-950 border-slate-800 text-brand-500 rounded focus:ring-0"
                    />
                    <span className="text-xs font-bold text-emerald-400">Veg Only</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isAvailable"
                      checked={foodForm.isAvailable}
                      onChange={handleFoodInputChange}
                      className="w-4.5 h-4.5 bg-slate-950 border-slate-800 text-brand-500 rounded focus:ring-0"
                    />
                    <span className="text-xs font-bold text-white">Active in Kitchen</span>
                  </label>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-4 pt-4 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setFoodModalOpen(false)}
                  className="flex-1 py-3 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow-glow transition animate-pulse-light"
                >
                  {editingFood ? 'Save Modifications' : 'Publish Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;
