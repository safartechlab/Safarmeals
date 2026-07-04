import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ShoppingBag, Trash2, MapPin, Gift, AlertCircle, Plus, Minus, CreditCard, ChevronRight, QrCode, Globe, Wallet, Lock, X, Check, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { setCart, clearCart, applyCouponSuccess, removeCoupon } from '../../redux/cartSlice';
import { openLoginModal } from '../../redux/authSlice';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Cart = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { items, shopId, totalAmount, activeCoupon, discountAmount } = useSelector((state) => state.cart);
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  // Local Checkout UI States
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);

  // Sandbox Modal States
  const [showSandboxModal, setShowSandboxModal] = useState(false);
  const [sandboxOrderData, setSandboxOrderData] = useState(null);

  // Address fetch triggers
  const [addresses, setAddresses] = useState([]);

  // Inline Address Modal States
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addressLabel, setAddressLabel] = useState('Home');
  const [houseNo, setHouseNo] = useState('');
  const [society, setSociety] = useState('');
  const [streetName, setStreetName] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressState, setAddressState] = useState('');
  const [addressZip, setAddressZip] = useState('');
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [addingAddress, setAddingAddress] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchCartAndAddresses = async () => {
      try {
        const { data } = await api.get('/orders/cart');
        if (data.success && data.data) {
          dispatch(setCart(data.data));
        }

        // Fetch User's profile addresses
        const userRes = await api.get('/auth/me');
        if (userRes.data.success && userRes.data.user) {
          setAddresses(userRes.data.user.addresses || []);
          const defAddr = userRes.data.user.addresses.find(a => a.isDefault);
          if (defAddr) setSelectedAddressId(defAddr._id);
          else if (userRes.data.user.addresses.length > 0) {
            setSelectedAddressId(userRes.data.user.addresses[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to sync checkout modules:', err);
      }
    };

    fetchCartAndAddresses();
  }, [isAuthenticated]);

  const handleUpdateQuantity = async (foodItemId, currentQuantity, change) => {
    try {
      const response = await api.put('/orders/cart/item', {
        foodItemId,
        quantity: currentQuantity + change
      });
      if (response.data.success) {
        dispatch(setCart(response.data.data));
      }
    } catch (err) {
      console.error('Error updating item quantity:', err);
    }
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError('');
    if (!couponInput.trim()) return;

    try {
      // Fetch available coupon from user offers route
      const { data } = await api.get('/user/offers');
      const matched = data.data.find(o => o.code === couponInput.trim().toUpperCase() && o.isActive);

      if (!matched) {
        setCouponError('Invalid coupon code or expired coupon.');
        return;
      }

      // Verify that the coupon is valid for the current shop
      if (matched.shopId && shopId && matched.shopId._id.toString() !== shopId.toString()) {
        setCouponError(`This coupon is only valid for orders from ${matched.shopId.shopName}.`);
        return;
      }

      if (totalAmount < matched.minOrderAmount) {
        setCouponError(`Min order of ₹${matched.minOrderAmount} required.`);
        return;
      }

      const calculatedDiscount = Math.min((totalAmount * matched.discountPercentage) / 100, matched.maxDiscountAmount);
      dispatch(applyCouponSuccess({
        coupon: matched,
        discount: calculatedDiscount
      }));
      setCouponInput('');
    } catch (err) {
      setCouponError('Could not process coupon code.');
    }
  };

  const handleRemoveCoupon = () => {
    dispatch(removeCoupon());
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setAddingAddress(true);
    try {
      const combinedAddressLine = `${houseNo ? houseNo + ', ' : ''}${society ? society + ', ' : ''}${streetName}`;
      const payload = {
        label: addressLabel,
        houseNo,
        streetName,
        society,
        addressLine: combinedAddressLine,
        city: addressCity,
        state: addressState,
        zipCode: addressZip,
        latitude: Number(latitude) || 0,
        longitude: Number(longitude) || 0
      };

      const { data } = await api.post('/user/addresses', payload);
      if (data.success) {
        // Reload addresses
        const userRes = await api.get('/auth/me');
        if (userRes.data.success && userRes.data.user) {
          const newAddresses = userRes.data.user.addresses || [];
          setAddresses(newAddresses);
          if (newAddresses.length > 0) {
            setSelectedAddressId(newAddresses[newAddresses.length - 1]._id);
          }
        }
        setHouseNo('');
        setSociety('');
        setStreetName('');
        setAddressCity('');
        setAddressState('');
        setAddressZip('');
        setLatitude(0);
        setLongitude(0);
        setAddressModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save address. Make sure required fields are filled.');
    } finally {
      setAddingAddress(false);
    }
  };

  const handleCheckout = async () => {
    if (!selectedAddressId) {
      alert('Please select or add a delivery address to complete your checkout!');
      return;
    }

    setCheckoutLoading(true);
    try {
      if (paymentMethod === 'RAZORPAY') {
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          alert('Failed to load Razorpay SDK. Check your internet connection.');
          setCheckoutLoading(false);
          return;
        }

        const response = await api.post('/orders/razorpay/initiate', {
          addressId: selectedAddressId,
          couponCode: activeCoupon ? activeCoupon.code : undefined
        });

        if (response.data.success) {
          const { razorpayOrder } = response.data;
          const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder_key_id';
          const isMock = keyId.includes('placeholder') || razorpayOrder.id.startsWith('order_mock_');

          if (isMock) {
            setSandboxOrderData({ razorpayOrder, addressId: selectedAddressId, couponCode: activeCoupon?.code });
            setShowSandboxModal(true);
            setCheckoutLoading(false);
            return;
          }

          const options = {
            key: keyId,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            name: 'SafarMeals',
            description: 'Food Delivery Payment',
            image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=120&q=80',
            order_id: razorpayOrder.id,
            handler: async function (verifyRes) {
              try {
                setCheckoutLoading(true);
                const verification = await api.post('/orders/razorpay/verify', {
                  addressId: selectedAddressId,
                  couponCode: activeCoupon ? activeCoupon.code : undefined,
                  razorpayOrderId: verifyRes.razorpay_order_id,
                  razorpayPaymentId: verifyRes.razorpay_payment_id,
                  razorpaySignature: verifyRes.razorpay_signature
                });

                if (verification.data.success) {
                  dispatch(clearCart());
                  setSuccessOrder(verification.data.order);
                } else {
                  alert('Verification response failed.');
                }
              } catch (verifyErr) {
                console.error('Payment verification failed:', verifyErr);
                alert(verifyErr.response?.data?.message || 'Verification failed. Contact support.');
              } finally {
                setCheckoutLoading(false);
              }
            },
            prefill: {
              name: user?.name || '',
              email: user?.email || '',
              contact: user?.phone || ''
            },
            theme: {
              color: '#F25C05'
            },
            modal: {
              ondismiss: function () {
                setCheckoutLoading(false);
              }
            }
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
        }
      } else {
        // COD
        const response = await api.post('/orders', {
          addressId: selectedAddressId,
          paymentMethod: 'COD',
          couponCode: activeCoupon ? activeCoupon.code : undefined
        });

        if (response.data.success) {
          dispatch(clearCart());
          setSuccessOrder(response.data.order);
        }
      }
    } catch (err) {
      console.error('Checkout failed:', err);
      alert(err.response?.data?.message || err.message || 'Payment/Checkout failed. Please try again.');
      setCheckoutLoading(false);
    }
  };

  const handleSandboxSuccess = async (mockPaymentId) => {
    if (!sandboxOrderData) return;
    const { razorpayOrder, addressId, couponCode } = sandboxOrderData;
    setCheckoutLoading(true);
    setShowSandboxModal(false);
    try {
      const verification = await api.post('/orders/razorpay/verify', {
        addressId,
        couponCode,
        razorpayOrderId: razorpayOrder.id,
        razorpayPaymentId: mockPaymentId || `pay_mock_${Math.random().toString(36).substring(2, 11)}`,
        razorpaySignature: 'mock_signature'
      });

      if (verification.data.success) {
        dispatch(clearCart());
        setSuccessOrder(verification.data.order);
      } else {
        alert('Verification response failed.');
      }
    } catch (verifyErr) {
      console.error('Payment verification failed:', verifyErr);
      alert(verifyErr.response?.data?.message || 'Verification failed. Contact support.');
    } finally {
      setCheckoutLoading(false);
      setSandboxOrderData(null);
    }
  };

  const handleSandboxCancel = () => {
    setShowSandboxModal(false);
    setSandboxOrderData(null);
    setCheckoutLoading(false);
  };

  // Math variables
  const deliveryFee = totalAmount > 0 ? 40 : 0;
  const taxableBase = Math.max(totalAmount - discountAmount, 0);
  const taxes = totalAmount > 0 ? Math.round(taxableBase * 0.05) : 0;
  const grandTotal = totalAmount > 0 ? taxableBase + deliveryFee + taxes : 0;

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-24 px-6 text-center space-y-6">
        <span className="p-4 bg-brand-50 text-brand-500 rounded-full inline-block">
          <ShoppingBag size={36} />
        </span>
        <h2 className="font-poppins font-bold text-gray-800 text-xl">Sign in to check out</h2>
        <p className="text-xs text-gray-400 leading-relaxed">Login to your account to review items in your active shopping bag and proceed to order placement.</p>
        <button onClick={() => dispatch(openLoginModal())} className="inline-block w-full py-3 bg-brand-500 text-white font-bold rounded-2xl cursor-pointer">Login Account</button>
      </div>
    );
  }

  // If order placed successfully, show congratulations overlay!
  if (successOrder) {
    return (
      <div className="max-w-md mx-auto py-24 px-6 text-center space-y-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto border border-emerald-100 shadow-sm">
          <svg className="w-10 h-10 stroke-current animate-bounce" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <div className="space-y-2">
          <h2 className="font-poppins font-black text-gray-900 text-2xl">Order Confirmed!</h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            Congratulations Jane, your order has been dispatched to the restaurant kitchen. The chefs are prepping your food.
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-left text-xs space-y-2 font-medium">
          <div className="flex justify-between text-gray-400">
            <span>Order Code</span>
            <span className="text-gray-800 font-bold uppercase">{successOrder._id.slice(-8)}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Estimated Prep</span>
            <span className="text-gray-800 font-bold">25-30 Minutes</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Total Charged</span>
            <span className="text-brand-500 font-extrabold">₹{successOrder.totalAmount}</span>
          </div>
        </div>

        <div className="space-y-3 pt-4">
          <button
            onClick={() => navigate(`/orders/${successOrder._id}`)}
            className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-2xl shadow-glow transition active:scale-95"
          >
            Track Real-Time Progress
          </button>
          <Link to="/restaurants" className="block text-xs font-bold text-brand-500 hover:text-brand-600 transition">
            Continue Exploring Foods
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-inter">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-xs text-gray-400 font-semibold mb-6">
        <Link to="/" className="hover:text-brand-500">Home</Link>
        <ChevronRight size={12} />
        <span className="text-gray-600">Cart & Checkout</span>
      </div>

      <div className="mb-8">
        <h1 className="font-poppins font-extrabold text-2xl sm:text-4xl text-gray-900 tracking-tight">Shopping Bag</h1>
        <p className="text-xs text-gray-400 font-semibold mt-1">Review items, set locations, and submit your dinner orders.</p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-100 rounded-3xl text-center p-6">
          <span className="p-4 bg-gray-50 rounded-full text-gray-400 mb-4 inline-block">
            <ShoppingBag size={36} />
          </span>
          <h3 className="font-poppins font-bold text-gray-800 text-lg mb-1 font-semibold">Active Cart Empty</h3>
          <p className="text-xs text-gray-400 max-w-xs leading-relaxed">You do not have any items in your shopping bag. Explore Manhattan restaurants to begin ordering delicious meals.</p>
          <Link to="/restaurants" className="mt-6 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-glow transition">
            Browse Menu Lists
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Cart items and addresses */}
          <div className="lg:col-span-2 space-y-8">
            {/* Cart Items list */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-poppins font-bold text-sm text-gray-900 border-b border-gray-100 pb-3">Shopping List</h3>
              
              <div className="divide-y divide-gray-50">
                {items.map((item) => {
                  const food = item.foodItemId;
                  if (!food) return null;
                  return (
                    <div key={item._id} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <img
                          src={food.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=80&q=80'}
                          alt={food.name}
                          className="w-12 h-12 rounded-xl object-cover border border-gray-100"
                        />
                        <div>
                          <h4 className="font-poppins font-bold text-xs text-gray-800 leading-tight truncate max-w-[200px]">{food.name}</h4>
                          <span className="text-[10px] text-gray-400 font-semibold">₹{item.price} each</span>
                        </div>
                      </div>

                      {/* Increments / Decrements Console */}
                      <div className="flex items-center gap-5">
                        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 gap-2.5 font-bold text-[10px] text-gray-700">
                          <button onClick={() => handleUpdateQuantity(food._id || food, item.quantity, -1)} className="hover:text-brand-500">
                            <Minus size={10} />
                          </button>
                          <span>{item.quantity}</span>
                          <button onClick={() => handleUpdateQuantity(food._id || food, item.quantity, 1)} className="hover:text-brand-500">
                            <Plus size={10} />
                          </button>
                        </div>
                        
                        <span className="text-xs font-bold text-gray-900 w-16 text-right">₹{item.quantity * item.price}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Addresses selector block */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-poppins font-bold text-sm text-gray-900 border-b border-gray-100 pb-3 flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-brand-500" /> Delivery Address
                </div>
                <button
                  type="button"
                  onClick={() => setAddressModalOpen(true)}
                  className="text-xs font-bold text-brand-500 hover:text-brand-600 transition flex items-center gap-1 cursor-pointer"
                >
                  + Add New Address
                </button>
              </h3>
              {addresses.length === 0 ? (
                <div className="text-xs text-gray-400 py-3 bg-gray-50 rounded-2xl p-4 border border-dashed border-gray-200 flex items-center gap-2">
                  <AlertCircle size={16} className="text-brand-500 shrink-0" />
                  <span>No delivery addresses saved. Please add an address inside your user dashboard to complete checkout.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr._id}
                      onClick={() => setSelectedAddressId(addr._id)}
                      className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between gap-3 ${selectedAddressId === addr._id ? 'border-brand-500 bg-brand-50/40' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="text-[9px] font-extrabold uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                            {addr.label}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-gray-700">{addr.addressLine}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{addr.city}, {addr.state} - {addr.zipCode}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Checkout maths summary and promo coupon */}
          <div className="lg:col-span-1 space-y-8">
            {/* Promo Coupon Console */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-poppins font-bold text-sm text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
                <Gift size={16} className="text-brand-500" /> Promo Coupons
              </h3>

              {activeCoupon ? (
                <div className="bg-brand-50/50 border border-brand-100 rounded-2xl p-4 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-extrabold text-brand-600 bg-brand-100 px-2.5 py-0.5 rounded tracking-wider uppercase inline-block mb-1">{activeCoupon.code}</span>
                    <p className="text-[10px] text-gray-400 font-medium leading-none">Discount of ₹{discountAmount} applied.</p>
                  </div>
                  <button onClick={handleRemoveCoupon} className="text-[10px] font-bold text-red-500 hover:text-red-600">
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="ENTER CODE (WELCOME50)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="w-full text-xs font-bold px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 text-gray-700 uppercase tracking-widest"
                  />
                  <button type="submit" className="bg-brand-500 hover:bg-brand-600 text-white px-5 rounded-xl text-xs font-bold transition shrink-0">
                    Apply
                  </button>
                </form>
              )}
              {couponError && <p className="text-[10px] font-semibold text-red-500">{couponError}</p>}
            </div>

            {/* Order Invoice Summary */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-poppins font-bold text-sm text-gray-900 border-b border-gray-100 pb-3">Order Invoice</h3>
              
              <div className="space-y-3.5 text-xs font-medium border-b border-gray-50 pb-4">
                <div className="flex justify-between text-gray-400">
                  <span>Food Total</span>
                  <span className="text-gray-800">₹{totalAmount}</span>
                </div>
                
                {activeCoupon && (
                  <div className="flex justify-between text-emerald-500">
                    <span>Coupon Discount ({activeCoupon.discountPercentage}%)</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-400">
                  <span>Courier Delivery Fee</span>
                  <span className="text-gray-800">₹{deliveryFee}</span>
                </div>

                <div className="flex justify-between text-gray-400">
                  <span>5% GST Tax</span>
                  <span className="text-gray-800">₹{taxes}</span>
                </div>
              </div>

              {/* Total amount */}
              <div className="flex justify-between items-center text-sm font-bold text-gray-900 pt-2 pb-4">
                <span>Grand Total</span>
                <span className="text-brand-500 font-extrabold text-base">₹{grandTotal}</span>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2 pb-4">
                <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Select Payment Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaymentMethod('COD')}
                    className={`py-3 text-[10px] font-bold rounded-xl border flex items-center justify-center gap-1.5 transition ${paymentMethod === 'COD' ? 'border-brand-500 bg-brand-50 text-brand-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    COD (Cash)
                  </button>
                  <button
                    onClick={() => setPaymentMethod('RAZORPAY')}
                    className={`py-3 text-[10px] font-bold rounded-xl border flex items-center justify-center gap-1.5 transition ${paymentMethod === 'RAZORPAY' ? 'border-brand-500 bg-brand-50 text-brand-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    Online (UPI, Card, Wallet)
                  </button>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={checkoutLoading || items.length === 0}
                className="w-full py-4 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-150 disabled:shadow-none text-white text-xs font-bold rounded-2xl shadow-glow transition uppercase tracking-wider flex items-center justify-center"
              >
                {checkoutLoading ? 'Processing Checkout...' : `Submit Order (₹${grandTotal})`}
              </button>
            </div>
          </div>
        </div>
      )}

      <SandboxPaymentModal
        isOpen={showSandboxModal}
        onClose={handleSandboxCancel}
        amount={grandTotal}
        onSuccess={handleSandboxSuccess}
      />

      {/* Save Address Modal Popup */}
      {addressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-gray-200 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-xl relative text-gray-800">
            <button
              type="button"
              onClick={() => setAddressModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-xl"
            >
              <X size={16} />
            </button>

            <div>
              <h3 className="font-poppins font-black text-lg text-gray-900">Add New Delivery Address</h3>
              <p className="text-[10px] font-semibold text-gray-400 uppercase mt-0.5">Specify delivery details</p>
            </div>

            <form onSubmit={handleAddAddress} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-gray-450 uppercase block">Address Label</label>
                <select
                  value={addressLabel}
                  onChange={(e) => setAddressLabel(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-gray-200 rounded-xl bg-white"
                >
                  <option value="Home">Home</option>
                  <option value="Work">Work</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-gray-450 uppercase block">House / Flat / Block No *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flat 104, Block A"
                  value={houseNo}
                  onChange={(e) => setHouseNo(e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-2.5 border border-gray-200 text-gray-800 rounded-xl focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-gray-450 uppercase block">Society / Building / Landmark</label>
                <input
                  type="text"
                  placeholder="e.g. Silver Oak Society"
                  value={society}
                  onChange={(e) => setSociety(e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-2.5 border border-gray-200 text-gray-800 rounded-xl focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-gray-450 uppercase block">Street / Locality Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Road, Sector 7"
                  value={streetName}
                  onChange={(e) => setStreetName(e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-2.5 border border-gray-200 text-gray-800 rounded-xl focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-gray-450 uppercase block">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="New York"
                    value={addressCity}
                    onChange={(e) => setAddressCity(e.target.value)}
                    className="w-full text-xs font-semibold px-4 py-2.5 border border-gray-200 text-gray-800 rounded-xl focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-gray-450 uppercase block">State *</label>
                  <input
                    type="text"
                    required
                    placeholder="NY"
                    value={addressState}
                    onChange={(e) => setAddressState(e.target.value)}
                    className="w-full text-xs font-semibold px-4 py-2.5 border border-gray-200 text-gray-800 rounded-xl focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-gray-455 uppercase block">Zip Code *</label>
                <input
                  type="text"
                  required
                  placeholder="10001"
                  value={addressZip}
                  onChange={(e) => setAddressZip(e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-2.5 border border-gray-200 text-gray-800 rounded-xl focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-gray-455 uppercase block">GPS Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-semibold px-4 py-2.5 border border-gray-200 text-gray-800 rounded-xl focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-gray-455 uppercase block">GPS Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-semibold px-4 py-2.5 border border-gray-200 text-gray-800 rounded-xl focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAddressModalOpen(false)}
                  className="flex-1 py-3 border border-gray-200 hover:bg-gray-50 text-gray-650 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingAddress}
                  className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-glow transition"
                >
                  {addingAddress ? 'Saving Address...' : 'Save & Select'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Sandbox Simulator Modal Component rendered inside Cart
const SandboxPaymentModal = ({ isOpen, onClose, amount, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('card');
  const [processing, setProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState(0);

  // Form states
  const [cardNo, setCardNo] = useState('4111 1111 1111 1111');
  const [cardExpiry, setCardExpiry] = useState('12/29');
  const [cardCvv, setCardCvv] = useState('123');
  const [cardName, setCardName] = useState('John Doe');
  const [upiId, setUpiId] = useState('safarmeals@upi');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [selectedWallet, setSelectedWallet] = useState('Paytm');

  const steps = [
    'Securely contacting processing bank...',
    'Authorizing sandbox credit verification...',
    'Generating secure digital payment signature...',
    'Finalizing transaction verification...'
  ];

  useEffect(() => {
    let interval;
    if (processing) {
      interval = setInterval(() => {
        setProgressStep((prev) => {
          if (prev >= steps.length - 1) {
            clearInterval(interval);
            setTimeout(() => {
              const mockPaymentId = `pay_mock_${Math.random().toString(36).substring(2, 11)}`;
              onSuccess(mockPaymentId);
            }, 500);
            return prev;
          }
          return prev + 1;
        });
      }, 900);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [processing]);

  if (!isOpen) return null;

  const handlePay = (e) => {
    e.preventDefault();
    setProcessing(true);
    setProgressStep(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col md:flex-row h-[480px] relative max-sm:h-[520px] text-slate-800">
        
        {/* Close Button */}
        {!processing && (
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-full transition z-10"
          >
            <X size={18} />
          </button>
        )}

        {/* Left pane: Summary & Tabs */}
        <div className="w-full md:w-2/5 bg-slate-950 text-white p-6 flex flex-col justify-between border-r border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <span className="h-8 w-8 rounded-xl bg-brand-500 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-brand-500/20">S</span>
              <div>
                <h3 className="font-poppins font-black text-sm tracking-tight leading-none text-white">SAFARMEALS</h3>
                <span className="text-[9px] font-bold text-slate-400 tracking-wider">SECURE PAYMENTS</span>
              </div>
            </div>

            <div className="space-y-1 mb-8 text-left">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Amount Payable</span>
              <div className="text-3xl font-black text-white font-poppins">₹{amount}</div>
              <span className="text-[9px] font-semibold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20 inline-block mt-1">Sandbox Test Mode</span>
            </div>

            {/* Tabs List */}
            {!processing && (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('card')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition border ${activeTab === 'card' ? 'bg-slate-800 text-white border-slate-700' : 'text-slate-400 hover:text-white hover:bg-slate-900/50 border-transparent'}`}
                >
                  <CreditCard size={14} className={activeTab === 'card' ? 'text-brand-500' : 'text-slate-400'} />
                  <span>Card Payment</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('upi')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition border ${activeTab === 'upi' ? 'bg-slate-800 text-white border-slate-700' : 'text-slate-400 hover:text-white hover:bg-slate-900/50 border-transparent'}`}
                >
                  <QrCode size={14} className={activeTab === 'upi' ? 'text-brand-500' : 'text-slate-400'} />
                  <span>UPI / QR Code</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('netbanking')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition border ${activeTab === 'netbanking' ? 'bg-slate-800 text-white border-slate-700' : 'text-slate-400 hover:text-white hover:bg-slate-900/50 border-transparent'}`}
                >
                  <Globe size={14} className={activeTab === 'netbanking' ? 'text-brand-500' : 'text-slate-400'} />
                  <span>Netbanking</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('wallet')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition border ${activeTab === 'wallet' ? 'bg-slate-800 text-white border-slate-700' : 'text-slate-400 hover:text-white hover:bg-slate-900/50 border-transparent'}`}
                >
                  <Wallet size={14} className={activeTab === 'wallet' ? 'text-brand-500' : 'text-slate-400'} />
                  <span>Wallets</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-bold">
            <Lock size={10} />
            <span>256-BIT SANDBOX SECURITY</span>
          </div>
        </div>

        {/* Right pane: Content Area */}
        <div className="w-full md:w-3/5 p-6 flex flex-col justify-between bg-slate-50">
          
          {processing ? (
            /* Processing Payment Interface */
            <div className="flex-grow flex flex-col justify-center items-center text-center space-y-6 animate-in fade-in duration-300">
              <div className="relative flex items-center justify-center">
                <Loader2 size={48} className="text-brand-500 animate-spin" />
                <div className="absolute text-[10px] font-black text-brand-600 font-poppins">{progressStep + 1}</div>
              </div>
              <div className="space-y-1.5 max-w-xs">
                <h4 className="font-poppins font-black text-sm text-slate-800">Processing sandbox transaction</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider animate-pulse">
                  {steps[progressStep]}
                </p>
              </div>
            </div>
          ) : (
            /* Main Form Pane */
            <form onSubmit={handlePay} className="flex-grow flex flex-col justify-between h-full">
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    {activeTab === 'card' && 'Card credentials'}
                    {activeTab === 'upi' && 'Instant UPI transfer'}
                    {activeTab === 'netbanking' && 'Choose Bank'}
                    {activeTab === 'wallet' && 'Choose Digital Wallet'}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400">Mocking Razorpay API</span>
                </div>

                {/* Tab content 1: Card */}
                {activeTab === 'card' && (
                  <div className="space-y-3 animate-in fade-in duration-150 text-left">
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold text-slate-400 uppercase">Card Number</label>
                      <input
                        type="text"
                        required
                        value={cardNo}
                        onChange={(e) => setCardNo(e.target.value)}
                        placeholder="4111 1111 1111 1111"
                        className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 text-slate-800"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold text-slate-400 uppercase">Expiry Date</label>
                        <input
                          type="text"
                          required
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/YY"
                          className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold text-slate-400 uppercase">CVV / CVV2</label>
                        <input
                          type="password"
                          required
                          maxLength="3"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="123"
                          className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold text-slate-400 uppercase">Cardholder Name</label>
                      <input
                        type="text"
                        required
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 text-slate-800"
                      />
                    </div>
                  </div>
                )}

                {/* Tab content 2: UPI */}
                {activeTab === 'upi' && (
                  <div className="space-y-4 animate-in fade-in duration-150 text-left">
                    <div className="bg-slate-100 p-3 rounded-2xl flex items-center justify-between gap-3 border border-slate-200/50">
                      <div className="flex items-center gap-2">
                        <span className="p-2 bg-brand-50 text-brand-500 rounded-xl">
                          <QrCode size={18} />
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-800">Scan Mock QR</p>
                          <p className="text-[9px] text-slate-400 font-semibold">Simulate instant QR code scanner</p>
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-white border border-slate-200 rounded-lg flex items-center justify-center p-1">
                        {/* Custom Mini QR SVG */}
                        <svg viewBox="0 0 100 100" className="w-full h-full text-slate-850">
                          <rect width="25" height="25" fill="currentColor" />
                          <rect x="75" width="25" height="25" fill="currentColor" />
                          <rect y="75" width="25" height="25" fill="currentColor" />
                          <rect x="10" y="10" width="5" height="5" fill="white" />
                          <rect x="85" y="10" width="5" height="5" fill="white" />
                          <rect x="10" y="85" width="5" height="5" fill="white" />
                          <rect x="35" y="35" width="30" height="30" fill="currentColor" />
                        </svg>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold text-slate-400 uppercase">Or Enter VPA / UPI ID</label>
                      <input
                        type="text"
                        required
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="username@bank"
                        className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 text-slate-800"
                      />
                    </div>
                  </div>
                )}

                {/* Tab content 3: Netbanking */}
                {activeTab === 'netbanking' && (
                  <div className="space-y-3 animate-in fade-in duration-150 text-left">
                    <label className="text-[9px] font-extrabold text-slate-400 uppercase">Select Bank</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['HDFC Bank', 'ICICI Bank', 'SBI Bank', 'Axis Bank', 'Kotak Bank', 'PNB Bank'].map((bank) => (
                        <button
                          key={bank}
                          type="button"
                          onClick={() => setSelectedBank(bank)}
                          className={`py-2 px-3 border rounded-xl text-left text-xs font-semibold transition ${selectedBank === bank ? 'border-brand-500 bg-brand-50/50 text-brand-600 font-bold' : 'border-slate-200 text-slate-650 hover:bg-slate-100/50'}`}
                        >
                          {bank}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab content 4: Wallet */}
                {activeTab === 'wallet' && (
                  <div className="space-y-3 animate-in fade-in duration-150 text-left">
                    <label className="text-[9px] font-extrabold text-slate-400 uppercase">Select Wallet</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Paytm', 'PhonePe', 'Amazon Pay', 'Mobikwik'].map((wallet) => (
                        <button
                          key={wallet}
                          type="button"
                          onClick={() => setSelectedWallet(wallet)}
                          className={`py-2 px-3 border rounded-xl text-left text-xs font-semibold transition ${selectedWallet === wallet ? 'border-brand-500 bg-brand-50/50 text-brand-600 font-bold' : 'border-slate-200 text-slate-650 hover:bg-slate-100/50'}`}
                        >
                          {wallet}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action payment button */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-2xl shadow-glow transition tracking-wider uppercase flex items-center justify-center gap-1.5"
                >
                  <Lock size={12} />
                  <span>Simulate Payment (₹{amount})</span>
                </button>
                <p className="text-[8px] text-center text-slate-400 font-medium mt-2 leading-relaxed">
                  By clicking Pay, you agree to generate a simulated success response. This will verify backend signatures and complete your order.
                </p>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};

export default Cart;
