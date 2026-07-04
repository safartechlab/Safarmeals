import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { openLoginModal } from './redux/authSlice';
import { useEffect } from 'react';

// State & Socket Providers
import store from './redux/store';
import { SocketProvider } from './context/SocketContext';

// Layout systems
import UserLayout from './layouts/UserLayout';
import ShopOwnerLayout from './layouts/ShopOwnerLayout';
import MasterAdminLayout from './layouts/MasterAdminLayout';

// Public/Auth screens
import Register from './pages/auth/Register';

// User website screens
import Home from './pages/user/Home';
import RestaurantListing from './pages/user/RestaurantListing';
import RestaurantDetails from './pages/user/RestaurantDetails';
import Cart from './pages/user/Cart';
import OrderTracking from './pages/user/OrderTracking';
import Profile from './pages/user/Profile';

// Shop owner manager screens
import ShopDashboard from './pages/shop/Dashboard';
import ShopOrders from './pages/shop/Orders';
import ShopMenu from './pages/shop/Menu';
import ShopCoupons from './pages/shop/Coupons';
import ShopAnalytics from './pages/shop/Analytics';
import ShopSettings from './pages/shop/Settings';

// Central Super Admin screens
import AdminDashboard from './pages/admin/Dashboard';
import AdminRestaurants from './pages/admin/Restaurants';
import AdminUsers from './pages/admin/Users';
import AdminOrders from './pages/admin/Orders';
import AdminCoupons from './pages/admin/Coupons';

// Role Guard Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!loading && (!isAuthenticated || !user)) {
      dispatch(openLoginModal());
    }
  }, [loading, isAuthenticated, user, dispatch]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-brand-500"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Captures direct address bar inputs for /login and handles it as a home-redirect with the modal open
const LoginRedirect = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(openLoginModal());
  }, [dispatch]);
  return <Navigate to="/" replace />;
};

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* 1. USER LAYOUT ROUTES */}
        <Route path="/" element={<UserLayout />}>
          <Route index element={<Home />} />
          <Route path="restaurants" element={<RestaurantListing />} />
          <Route path="restaurants/:id" element={<RestaurantDetails />} />
          <Route path="cart" element={<Cart />} />
          
          {/* Auth pages */}
          <Route path="login" element={<LoginRedirect />} />
          <Route path="register" element={<Register />} />
          
          {/* Protected User actions */}
          <Route
            path="profile"
            element={
              <ProtectedRoute allowedRoles={['user', 'shopowner', 'admin']}>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="orders/:id"
            element={
              <ProtectedRoute allowedRoles={['user', 'shopowner', 'admin']}>
                <OrderTracking />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* 2. SHOP OWNER PARTNER SUITE (Role: shopowner) */}
        <Route
          path="/shop"
          element={
            <ProtectedRoute allowedRoles={['shopowner']}>
              <ShopOwnerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/shop/dashboard" replace />} />
          <Route path="dashboard" element={<ShopDashboard />} />
          <Route path="orders" element={<ShopOrders />} />
          <Route path="menu" element={<ShopMenu />} />
          <Route path="coupons" element={<ShopCoupons />} />
          <Route path="analytics" element={<ShopAnalytics />} />
          <Route path="settings" element={<ShopSettings />} />
        </Route>

        {/* 3. MASTER OPERATIONS CENTER (Role: admin) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <MasterAdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="restaurants" element={<AdminRestaurants />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="coupons" element={<AdminCoupons />} />
        </Route>

        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <SocketProvider>
        <AppRoutes />
      </SocketProvider>
    </Provider>
  );
};

export default App;
