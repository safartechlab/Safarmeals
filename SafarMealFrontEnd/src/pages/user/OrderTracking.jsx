import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { Compass, Clock, MapPin, Phone, CheckCircle2, ChevronRight, Star, ShieldCheck, MessageSquare, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { db } from '../../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const OrderTracking = () => {
  const { id: orderId } = useParams();
  const socket = useSocket();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Live tracking & notification states
  const [riderLocation, setRiderLocation] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Review states (triggers if status is Delivered)
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Map refs
  const leafletMap = useRef(null);
  const riderMarker = useRef(null);
  const routeLine = useRef(null);

  const fetchOrderDetails = async () => {
    try {
      const { data } = await api.get(`/orders/${orderId}`);
      if (data.success) {
        setOrder(data.data);
      }
    } catch (err) {
      console.error('Failed to load order tracker stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  // Real-Time Socket status binding listeners
  useEffect(() => {
    if (socket) {
      const handleStatusUpdate = (data) => {
        if (data.orderId === orderId) {
          console.log('Real-Time Socket Status Received:', data.status);
          setOrder(prev => prev ? { ...prev, orderStatus: data.status, paymentStatus: data.paymentStatus || prev.paymentStatus } : null);
        }
      };

      const handleNotification = (data) => {
        if (data.orderId === orderId) {
          console.log('Received Delivery Notification:', data);
          setToastMessage(data.message);
          fetchOrderDetails(); // refresh details to update timeline checkboxes

          // Auto-clear notification toast after 6 seconds
          setTimeout(() => {
            setToastMessage(null);
          }, 6000);
        }
      };

      socket.on('order_status_update', handleStatusUpdate);
      socket.on('delivery_notification', handleNotification);

      return () => {
        socket.off('order_status_update', handleStatusUpdate);
        socket.off('delivery_notification', handleNotification);
      };
    }
  }, [socket, orderId]);

  // 1. Initialize Map when order is loaded and L exists
  useEffect(() => {
    if (window.L && !leafletMap.current && order) {
      const restLat = order.shopId?.address?.latitude && order.shopId?.address?.latitude !== 0 ? order.shopId.address.latitude : 40.7580;
      const restLng = order.shopId?.address?.longitude && order.shopId?.address?.longitude !== 0 ? order.shopId.address.longitude : -73.9855;
      const custLat = order.deliveryAddress?.latitude && order.deliveryAddress?.latitude !== 0 ? order.deliveryAddress.latitude : 40.7527;
      const custLng = order.deliveryAddress?.longitude && order.deliveryAddress?.longitude !== 0 ? order.deliveryAddress.longitude : -73.9772;

      try {
        const map = window.L.map('map-tracking-canvas', { zoomControl: false }).setView([restLat, restLng], 14);
        leafletMap.current = map;

        // Leaflet CartoDB Voyager skin layer
        window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '© OpenStreetMap contributors © CARTO'
        }).addTo(map);

        window.L.control.zoom({ position: 'bottomright' }).addTo(map);

        // Custom div-icon markers
        const restaurantIcon = window.L.divIcon({
          html: `<div class="flex items-center justify-center w-8 h-8 bg-rose-500 rounded-full border-2 border-white shadow-md text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>`,
          className: 'custom-div-icon',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const customerIcon = window.L.divIcon({
          html: `<div class="flex items-center justify-center w-8 h-8 bg-indigo-600 rounded-full border-2 border-white shadow-md text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>`,
          className: 'custom-div-icon',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        // Add Markers
        window.L.marker([restLat, restLng], { icon: restaurantIcon }).addTo(map).bindPopup(`<b>${order.shopId?.shopName} (Shop)</b>`);
        window.L.marker([custLat, custLng], { icon: customerIcon }).addTo(map).bindPopup("<b>Delivery Address</b>");

        // Dotted polyline connector path
        const route = window.L.polyline([[restLat, restLng], [custLat, custLng]], {
          color: '#6366f1',
          weight: 3,
          dashArray: '6, 6',
          opacity: 0.8
        }).addTo(map);
        routeLine.current = route;

        // Auto pan bounds
        map.fitBounds([[restLat, restLng], [custLat, custLng]], { padding: [40, 40] });
      } catch (err) {
        console.error('Failed to initialize map canvas:', err);
      }
    }
  }, [order]);

  // 2. Rider marker updater helper
  const updateRiderMarker = (lat, lng) => {
    if (!leafletMap.current || !window.L) return;

    try {
      const riderIcon = window.L.divIcon({
        html: `<div class="flex items-center justify-center w-10 h-10 bg-brand-500 rounded-full border-2 border-white shadow-xl text-white relative animate-pulse">
          <div class="absolute -inset-1 rounded-full bg-brand-500/25 animate-ping"></div>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="5" y="13" width="14" height="8" rx="2"/>
            <path d="M12 5V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v2"/>
            <path d="M12 8a3 3 0 0 1 3 3v2H9v-2a3 3 0 0 1 3-3z"/>
            <circle cx="9" cy="17" r="1"/>
            <circle cx="15" cy="17" r="1"/>
          </svg>
        </div>`,
        className: 'custom-div-icon',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      if (riderMarker.current) {
        riderMarker.current.setLatLng([lat, lng]);
      } else {
        riderMarker.current = window.L.marker([lat, lng], { icon: riderIcon }).addTo(leafletMap.current);
      }

      // Smooth pan rider center focus
      leafletMap.current.panTo([lat, lng]);
    } catch (err) {
      console.error('Error drawing rider moving pin:', err);
    }
  };

  // 3. Bind Firestore subscription for coordinates, with Socket fallback
  useEffect(() => {
    let unsubscribe = null;

    if (db && orderId) {
      try {
        const docRef = doc(db, 'order_tracking', orderId);
        unsubscribe = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            console.log('Firestore Real-Time location:', data);
            setRiderLocation(data);
            if (data.latitude && data.longitude) {
              updateRiderMarker(data.latitude, data.longitude);
            }
          }
        }, (err) => {
          console.warn('Firestore subscription failed, relying on Socket fallback:', err.message);
        });
      } catch (err) {
        console.warn('Failed to bind Firestore. Using socket fallback:', err.message);
      }
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [orderId]);

  // 4. Socket coordinate stream receiver (acts as secondary backup)
  useEffect(() => {
    if (socket) {
      const handleLocationUpdate = (data) => {
        if (data.orderId === orderId) {
          console.log('Socket Real-Time rider location:', data);
          setRiderLocation(prev => ({
            ...prev,
            latitude: data.latitude,
            longitude: data.longitude,
            eta: data.eta || prev?.eta || 15,
            progress: data.progress,
            status: data.status
          }));
          updateRiderMarker(data.latitude, data.longitude);
        }
      };

      socket.on('rider_location_update', handleLocationUpdate);

      return () => {
        socket.off('rider_location_update', handleLocationUpdate);
      };
    }
  }, [socket, orderId]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');
    if (!reviewComment.trim()) return;

    try {
      const response = await api.post(`/user/restaurants/${order.shopId._id}/reviews`, {
        rating: reviewRating,
        comment: reviewComment
      });

      if (response.data.success) {
        setReviewSubmitted(true);
      }
    } catch (err) {
      setReviewError(err.message || 'You have already submitted a review for this restaurant.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-4 text-center space-y-4">
        <div className="h-44 rounded-3xl bg-gray-200 shimmer" />
        <div className="h-6 w-1/3 mx-auto rounded bg-gray-200 shimmer" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto py-24 px-6 text-center space-y-6">
        <h2 className="font-poppins font-bold text-gray-800 text-xl">Order details not found</h2>
        <p className="text-xs text-gray-400">Please check your order tracking ID or verify order placement history.</p>
        <Link to="/profile" className="inline-block w-full py-3 bg-brand-500 text-white font-bold rounded-2xl">My Account Panel</Link>
      </div>
    );
  }

  // Order timeline mappings (7 stages flow)
  const statuses = ['Pending', 'Accepted', 'Preparing', 'Ready for Pickup', 'Picked Up', 'Out for Delivery', 'Delivered'];
  const currentStepIdx = statuses.indexOf(order.orderStatus);

  const getStatusLabel = (s) => {
    switch (s) {
      case 'Pending': return 'Waiting Approval';
      case 'Accepted': return 'Accepted';
      case 'Preparing': return 'Chef Cooking';
      case 'Ready for Pickup': return 'Rider Assigned';
      case 'Picked Up': return 'Food Picked Up';
      case 'Out for Delivery': return 'Rider is Coming';
      case 'Delivered': return 'Arrived! Enjoy';
      default: return s;
    }
  };

  const isFailed = order.orderStatus === 'Rejected' || order.orderStatus === 'Cancelled';
  const isTrackingActive = !isFailed && ['Picked Up', 'Out for Delivery'].includes(order.orderStatus);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 font-inter relative">
      
      {/* 0. FLOATING NOTIFICATION TOAST NOTICE */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900 border-2 border-brand-500 p-4.5 rounded-2xl shadow-2xl animate-bounce flex items-start gap-3.5 text-white animate-in slide-in-from-bottom-5">
          <div className="p-2.5 bg-brand-950 text-brand-500 border border-brand-900 rounded-xl shrink-0">
            <Compass className="animate-spin text-brand-500" size={16} />
          </div>
          <div>
            <h5 className="text-[10px] font-black uppercase tracking-widest text-brand-400">Real-Time Delivery Milestone</h5>
            <p className="text-xs font-bold leading-normal text-slate-100 mt-0.5">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-xs text-gray-400 font-semibold mb-6">
        <Link to="/" className="hover:text-brand-500">Home</Link>
        <ChevronRight size={12} />
        <Link to="/profile" className="hover:text-brand-500">Orders</Link>
        <ChevronRight size={12} />
        <span className="text-gray-600">Track Order</span>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-8">
        {/* 1. RESTAURANT META CARD */}
        <div className="flex items-center justify-between gap-4 border-b border-gray-50 pb-6">
          <div className="flex items-center gap-3.5">
            <img
              src={order.shopId?.logo || 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=120&q=80'}
              alt={order.shopId?.shopName}
              className="w-14 h-14 rounded-2xl object-cover border border-gray-100"
            />
            <div>
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-brand-500">
                {order.orderStatus === 'Delivered' ? 'DELIVERED FRESH' : 'PREPARING FRESH'}
              </span>
              <h2 className="font-poppins font-black text-gray-900 text-lg leading-tight">{order.shopId?.shopName}</h2>
              <p className="text-[10px] text-gray-400 font-medium leading-none mt-1">Order Ref: #{order._id.slice(-8).toUpperCase()}</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-extrabold text-brand-500 bg-brand-50 px-3 py-1.5 rounded-full inline-block">
              {order.paymentStatus === 'Completed' ? '💵 Paid (Digital)' : '💵 COD Pending'}
            </span>
          </div>
        </div>

        {/* 2. REAL-TIME TRACKING TIMELINE */}
        {isFailed ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-center gap-3.5 text-red-600">
            <span className="p-2.5 bg-red-100 rounded-full inline-block shrink-0">
              <AlertCircle size={20} />
            </span>
            <div>
              <h4 className="font-bold text-sm">Order {order.orderStatus}</h4>
              <p className="text-xs text-red-500/80 leading-relaxed mt-0.5">We apologize! The restaurant manager has rejected or cancelled this order. Any digital payments will be refunded.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <h3 className="font-poppins font-bold text-sm text-gray-900">Courier Tracking Line</h3>

            {/* Steps Timeline Grid */}
            <div className="relative flex flex-col md:flex-row justify-between gap-6 md:gap-0 pt-4 pb-8 px-2 overflow-x-auto scrollbar-thin">
              {/* Connecting line */}
              <div className="hidden md:block absolute top-[28px] left-[5%] right-[5%] h-0.5 bg-gray-100 -z-0">
                <div
                  className="h-full bg-brand-500 transition-all duration-500 rounded-full"
                  style={{ width: `${(Math.max(currentStepIdx, 0) / (statuses.length - 1)) * 100}%` }}
                />
              </div>

              {statuses.map((status, idx) => {
                const isCompleted = idx <= currentStepIdx;
                const isActive = idx === currentStepIdx;
                return (
                  <div key={status} className="flex md:flex-col items-center gap-4 md:gap-2.5 text-center relative z-10 min-w-[90px]">
                    {/* Circle badge indicator */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center border font-bold text-xs shadow-sm transition-all duration-300 ${isCompleted ? 'bg-brand-500 border-brand-500 text-white' : 'bg-white border-gray-200 text-gray-400'} ${isActive ? 'ring-4 ring-brand-100' : ''}`}
                    >
                      {isCompleted ? <CheckCircle2 size={16} /> : idx + 1}
                    </div>

                    {/* Meta tags */}
                    <div className="text-left md:text-center">
                      <p className={`text-xs font-bold ${isCompleted ? 'text-gray-900' : 'text-gray-400'} ${isActive ? 'text-brand-500' : ''}`}>{status}</p>
                      <p className="text-[9px] text-gray-400 font-medium mt-0.5 leading-none">{getStatusLabel(status)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. LIVE TRACKING MAP OR ROUTE PLACEHOLDER */}
        {isTrackingActive ? (
          <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-4 bg-gradient-to-br from-brand-500/5 to-indigo-500/5 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="font-poppins font-black text-xs text-gray-900 flex items-center gap-1.5">
                  <Compass size={14} className="text-brand-500 animate-spin" style={{ animationDuration: '4s' }} />
                  Live Order Location Map
                </h3>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Rider: Rahul Sharma • Real-Time Stream</p>
              </div>
              <span className="text-xs font-black text-brand-600 bg-brand-50/80 px-3 py-1.5 rounded-xl block shadow-glow-sm shadow-brand-500/10">
                ⏱️ ETA: {riderLocation?.eta || 15} mins
              </span>
            </div>
            
            {/* Actual Leaflet Container */}
            <div id="map-tracking-canvas" className="w-full h-80 bg-gray-50 border-b border-gray-100" style={{ zIndex: 1 }} />
            
            {/* Rider profile card */}
            <div className="p-4 bg-gray-50/50 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                  alt="Rider"
                  className="w-10 h-10 rounded-full border border-gray-200 object-cover"
                />
                <div>
                  <h5 className="text-xs font-black text-gray-800">{riderLocation?.riderName || 'Rahul Sharma'}</h5>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">SAFARMEAL Delivery Partner</p>
                </div>
              </div>
              <a
                href="tel:+919876543210"
                className="px-4 py-2 border border-gray-200 hover:bg-gray-100 text-gray-700 text-[10px] font-bold rounded-xl transition"
              >
                📞 Contact Rider
              </a>
            </div>
          </div>
        ) : (
          !isFailed && order.orderStatus !== 'Delivered' && (
            <div className="relative h-28 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 flex flex-col items-center justify-center p-4 text-center">
              <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:14px_14px] opacity-35" />
              <Compass size={24} className="text-slate-300 animate-spin mb-1.5" style={{ animationDuration: '8s' }} />
              <span className="relative z-10 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                GPS Tracking Map Queued
              </span>
              <p className="text-[10px] text-slate-400 mt-1 max-w-xs font-medium">Tracking will start in real-time as soon as the rider picks up your package from the kitchen.</p>
            </div>
          )
        )}

        {/* Secure Delivery OTP Verification Handoff */}
        {order.deliveryOTP && (
          <div className={`border p-5 rounded-3xl space-y-3 ${order.orderStatus === 'Out for Delivery' ? 'bg-gradient-to-br from-brand-500/10 to-indigo-500/10 border-brand-500/25' : 'bg-gray-50 border-gray-150'}`}>
            <h4 className="text-xs font-black text-brand-600 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={16} className="text-brand-500" /> Secure Handover Code
            </h4>
            <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
              {order.orderStatus === 'Out for Delivery' 
                ? "Your rider is out for delivery! Share this secure 4-digit verification code with the delivery partner to receive your food:" 
                : "A secure delivery OTP is generated for this order. Share this code with the delivery partner upon handover:"}
            </p>
            <div className="flex items-center gap-3">
              <span className="text-xl font-black text-white bg-gradient-to-r from-brand-500 to-indigo-500 px-5 py-2 rounded-2xl tracking-[4px] shadow-md shadow-brand-500/15">
                {order.deliveryOTP}
              </span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">DO NOT SHARE WITH ANYONE ELSE</span>
            </div>
          </div>
        )}

        {/* Delivery Address Card */}
        <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
          <h4 className="font-poppins font-bold text-xs text-gray-900 border-b border-gray-200/60 pb-2 flex items-center gap-2">
            <MapPin size={14} className="text-brand-500" /> Delivery Address
          </h4>
          <div className="text-xs font-medium text-gray-650 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-extrabold uppercase tracking-wider bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                {order.deliveryAddress?.label || 'Home'}
              </span>
            </div>
            <p className="font-semibold text-gray-800">
              {order.deliveryAddress?.houseNo ? `${order.deliveryAddress.houseNo}, ` : ''}
              {order.deliveryAddress?.society ? `${order.deliveryAddress.society}, ` : ''}
              {order.deliveryAddress?.streetName || order.deliveryAddress?.addressLine}
            </p>
            <p className="text-[10px] text-gray-400 font-semibold uppercase">
              {order.deliveryAddress?.city}, {order.deliveryAddress?.state} - {order.deliveryAddress?.zipCode}
            </p>
          </div>
        </div>

        {/* 3. ORDER INVOICE LISTS */}
        <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
          <h4 className="font-poppins font-bold text-xs text-gray-900 border-b border-gray-200/60 pb-2">Order summary Items</h4>
          
          <div className="space-y-3 font-semibold text-xs text-gray-600">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span>{item.name} <span className="text-brand-500 font-bold">x{item.quantity}</span></span>
                <span className="text-gray-900">₹{item.quantity * item.price}</span>
              </div>
            ))}

            <div className="border-t border-gray-200/60 pt-3 flex justify-between items-center text-gray-900 font-bold">
              <span>Charged Invoice</span>
              <span className="text-brand-500 font-extrabold text-sm">₹{order.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* 4. DRIVER DETAILS & SUPPORT MAP */}
        {!isFailed && order.orderStatus !== 'Delivered' && (
          <div className="border border-gray-100 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-500">
                <Phone size={18} />
              </span>
              <div>
                <h5 className="text-xs font-bold text-gray-800">Support Desk</h5>
                <p className="text-[10px] text-gray-400 font-medium">SAFARMEAL Courier Support Team</p>
              </div>
            </div>
            <a href="tel:18005550199" className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-[10px] font-bold rounded-xl transition">
              Call Support
            </a>
          </div>
        )}

        {/* 5. REVIEW SYSTEM (IF DELIVERED) */}
        {order.orderStatus === 'Delivered' && (
          <div className="border-t border-gray-100 pt-8 mt-4 space-y-5 animate-in fade-in duration-300">
            <div className="text-center space-y-1.5">
              <span className="p-2.5 bg-amber-50 text-amber-500 rounded-full inline-block">
                <Star size={24} className="fill-amber-400" />
              </span>
              <h3 className="font-poppins font-black text-gray-900 text-lg">Did You Enjoy the Taste?</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">Leave your honest feedback to rate {order.shopId?.shopName} and help our gourmet food ecosystem thrive.</p>
            </div>

            {reviewSubmitted ? (
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 text-center text-emerald-600 text-xs font-bold">
                Thank you Monica! Your taste review has been cataloged. Recalculating shop ratings now...
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="max-w-md mx-auto space-y-4 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                {/* Rating selection stars */}
                <div className="space-y-1 text-center">
                  <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Taste Rating</label>
                  <div className="flex items-center justify-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="p-1 focus:outline-none transition-transform hover:scale-110 active:scale-95"
                      >
                        <Star
                          size={24}
                          className={star <= reviewRating ? 'fill-amber-400 stroke-amber-400' : 'text-gray-300'}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rating description */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Comment Review</label>
                  <textarea
                    rows="3"
                    placeholder="Briefly describe flavor profile, temperature, and ingredients..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full text-xs font-semibold p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 text-gray-700"
                    required
                  />
                </div>

                {reviewError && <p className="text-[10px] font-semibold text-red-500 text-center">{reviewError}</p>}

                <button
                  type="submit"
                  className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-glow transition uppercase tracking-wider"
                >
                  Submit Flavor Review
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTracking;
