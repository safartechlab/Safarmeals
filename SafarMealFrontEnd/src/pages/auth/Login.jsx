import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Shield, Eye, EyeOff, Lock, Mail, ArrowRight, ShoppingBag, Phone, AlertCircle, Sparkles, X } from 'lucide-react';
import api from '../../services/api';
import { loginStart, loginSuccess, loginFailure, closeLoginModal } from '../../redux/authSlice';
import { auth } from '../../services/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { loading, error, isLoginModalOpen } = useSelector((state) => state.auth);

  // Auth Modes: 'phone' (for Customers) or 'email' (for Admins & Shop Partners)
  const [loginMode, setLoginMode] = useState('phone');

  // Phone Login State
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [simulatedOTP, setSimulatedOTP] = useState(null);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [firebaseActive, setFirebaseActive] = useState(!!auth);
  const [firebaseError, setFirebaseError] = useState(null);

  // Email Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [validationError, setValidationError] = useState('');

  // Request SMS OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setValidationError('');
    setSimulatedOTP(null);

    if (!phone || phone.trim().length < 10) {
      setValidationError('Please enter a valid 10-digit mobile number.');
      return;
    }

    dispatch(loginStart());

    if (firebaseActive) {
      try {
        // Reset verifier if already instantiated to avoid re-initialization errors
        if (window.recaptchaVerifier) {
          try {
            window.recaptchaVerifier.clear();
          } catch (err) {}
          window.recaptchaVerifier = null;
        }

        // Initialize invisible reCAPTCHA verifier
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: (response) => {
            // reCAPTCHA solved
          }
        });

        const appVerifier = window.recaptchaVerifier;
        const formattedPhone = `+91${phone}`; // Force country prefix for verification

        const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
        setConfirmationResult(confirmation);
        setOtpSent(true);
        setFirebaseError(null);
        dispatch(loginFailure(null)); // Clear loading state
      } catch (err) {
        console.error('Firebase SMS OTP request failed, falling back to mock login:', err);
        setFirebaseError(err.message || String(err));
        // Fallback to Mock login flow if Firebase keys are invalid or not configured
        setFirebaseActive(false);
        try {
          const response = await api.post('/auth/send-otp', { phone });
          if (response.data.success) {
            setOtpSent(true);
            setSimulatedOTP(response.data.otp);
          }
        } catch (fallbackErr) {
          setValidationError('OTP dispatch failed. Check network configuration.');
        } finally {
          dispatch(loginFailure(null));
        }
      }
    } else {
      // Mock Fallback SMS system
      try {
        const response = await api.post('/auth/send-otp', { phone });
        if (response.data.success) {
          setOtpSent(true);
          setSimulatedOTP(response.data.otp);
          dispatch(loginFailure(null)); // Clear loading failures
        }
      } catch (err) {
        console.error('Failed to request login OTP:', err);
        setValidationError(err.response?.data?.message || 'Failed to dispatch verification code.');
        dispatch(loginFailure(null));
      }
    }
  };

  // Verify SMS OTP and complete login
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!otp) {
      setValidationError('Please enter the verification code.');
      return;
    }

    dispatch(loginStart());

    if (firebaseActive && confirmationResult) {
      try {
        // Verify code on Firebase
        const result = await confirmationResult.confirm(otp);
        const fbUser = result.user;
        const idToken = await fbUser.getIdToken();

        // Dispatch verification payload to local Backend endpoint
        const response = await api.post('/auth/firebase-login', { idToken });
        if (response.data.success) {
          dispatch(loginSuccess(response.data));
        }
      } catch (err) {
        console.error('Firebase OTP verification failed:', err);
        setValidationError(err.response?.data?.message || err.message || 'Incorrect OTP code.');
        dispatch(loginFailure(null));
      }
    } else {
      // Mock verification system
      try {
        const response = await api.post('/auth/verify-otp', { phone, otp });
        if (response.data.success) {
          dispatch(loginSuccess(response.data));
        }
      } catch (err) {
        console.error('OTP verification rejected:', err);
        dispatch(loginFailure(err.response?.data?.message || 'Incorrect OTP code.'));
      }
    }
  };

  // Standard Email/Password login (Admins & Shop Owners)
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!email || !password) {
      setValidationError('Please fill in both email and password fields.');
      return;
    }

    dispatch(loginStart());

    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        dispatch(loginSuccess(response.data));
        
        // Redirect according to user role
        const role = response.data.user.role;
        if (role === 'admin') navigate('/admin/dashboard');
        else if (role === 'shopowner') navigate('/shop/dashboard');
      }
    } catch (err) {
      console.error('Login action rejected:', err);
      dispatch(loginFailure(err.response?.data?.message || 'Authentication credentials matching failed.'));
    }
  };

  if (!isLoginModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto font-inter">
      {/* Backdrop click outside to close */}
      <div className="absolute inset-0 cursor-default" onClick={() => dispatch(closeLoginModal())} />

      {/* Main Glass Panel Card */}
      <div className="max-w-md w-full bg-white border border-slate-100 p-8 rounded-[32px] shadow-2xl relative z-10 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={() => dispatch(closeLoginModal())}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-650 rounded-xl hover:bg-slate-100 transition cursor-pointer"
        >
          <X size={16} />
        </button>
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 mb-1 group">
            <span className="p-2.5 bg-gradient-to-tr from-brand-500 to-indigo-500 rounded-2xl text-white shadow-glow transition-transform duration-300 group-hover:scale-105">
              <ShoppingBag size={20} strokeWidth={2.5} className="animate-pulse" />
            </span>
            <span className="font-poppins font-black text-xl tracking-tight text-gray-900">
              SAFAR<span className="text-brand-500">MEAL</span>
            </span>
          </Link>
          <h2 className="font-poppins font-black text-gray-900 text-xl tracking-tight">Welcome Back!</h2>
          <p className="text-xs text-slate-400 font-semibold leading-none">Login to your account to order delicious meals.</p>
        </div>

        {/* Dynamic Mode Switcher Tab bar */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl shrink-0">
          <button
            type="button"
            onClick={() => { setLoginMode('phone'); setValidationError(''); }}
            className={`flex-1 py-2.5 text-center text-xs font-black rounded-xl transition-all duration-200 ${
              loginMode === 'phone'
                ? 'bg-white text-slate-900 shadow-md shadow-slate-200/50'
                : 'text-slate-450 hover:text-slate-700'
            }`}
          >
            Customer Mobile Login
          </button>
          <button
            type="button"
            onClick={() => { setLoginMode('email'); setValidationError(''); }}
            className={`flex-1 py-2.5 text-center text-xs font-black rounded-xl transition-all duration-200 ${
              loginMode === 'email'
                ? 'bg-white text-slate-900 shadow-md shadow-slate-200/50'
                : 'text-slate-450 hover:text-slate-700'
            }`}
          >
            Partner Control Suite
          </button>
        </div>

        {/* 1. CUSTOMER MOBILE LOGIN SCREEN */}
        {loginMode === 'phone' ? (
          <div className="space-y-4">
            
            {/* Toggle between Firebase and Mock OTP */}
            <div className="flex justify-between items-center text-[10px] bg-slate-50 border border-slate-100 p-2.5 rounded-2xl text-slate-500 font-semibold px-3.5">
              <span>OTP Mode: <strong className={firebaseActive ? 'text-brand-500' : 'text-amber-600'}>{firebaseActive ? 'Firebase (SMS)' : 'Local Simulator'}</strong></span>
              <button
                type="button"
                onClick={() => {
                  setFirebaseActive(!firebaseActive);
                  setOtpSent(false);
                  setSimulatedOTP(null);
                  setValidationError('');
                  setFirebaseError(null);
                }}
                className="text-brand-500 hover:text-brand-600 font-bold underline cursor-pointer"
              >
                Switch to {firebaseActive ? 'Mock Simulator' : 'Firebase SMS'}
              </button>
            </div>

            {/* Firebase Error warning banner */}
            {firebaseError && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-[10px] font-bold flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0 text-red-500" />
                  <span>Firebase Auth Failed: {firebaseError}</span>
                </div>
                <p className="text-[9px] text-slate-500 font-semibold leading-relaxed pl-5">
                  Fell back to Local Simulator. Use the simulated OTP code below to sign in.
                </p>
              </div>
            )}

            {/* SMS OTP Alert banner mock */}
            {simulatedOTP && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/35 text-amber-500 rounded-2xl text-[10px] font-bold flex items-center gap-2.5 animate-pulse">
                <AlertCircle size={15} className="shrink-0" />
                <span className="leading-relaxed">Simulated SMS Code: <strong className="text-xs bg-amber-500/25 px-2 py-0.5 rounded text-white tracking-widest ml-1 shadow-sm">{simulatedOTP}</strong></span>
              </div>
            )}

            {!otpSent ? (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mobile Number</label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus-within:border-brand-500 focus-within:bg-white transition duration-200">
                    <Phone size={15} className="text-slate-400" />
                    <span className="text-xs font-black text-slate-400 border-r border-slate-200 pr-2.5">+91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="Enter 10-digit mobile number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="bg-transparent border-none outline-none w-full text-xs font-bold placeholder:text-slate-400 text-slate-800 focus:ring-0 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {validationError && <p className="text-[10px] font-bold text-red-500">{validationError}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 hover:to-amber-600 disabled:bg-slate-200 text-white font-black text-xs rounded-2xl shadow-glow transition duration-200 flex items-center justify-center gap-2 uppercase tracking-widest active:scale-95 cursor-pointer"
                >
                  {loading ? 'Sending Code...' : 'Get One-Time Password'} <ArrowRight size={14} />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-4 animate-in slide-in-from-right duration-250">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Enter {firebaseActive ? '6-Digit' : '4-Digit'} OTP
                  </label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus-within:border-brand-500 focus-within:bg-white transition duration-200">
                    <Shield size={15} className="text-slate-400 animate-pulse" />
                    <input
                      type="text"
                      maxLength={firebaseActive ? 6 : 4}
                      placeholder={firebaseActive ? "••••••" : "••••"}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="bg-transparent border-none outline-none w-full text-xs font-black placeholder:text-slate-400 text-slate-850 tracking-[6px] text-center focus:ring-0 focus:outline-none"
                      required
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-450 font-semibold pt-1 px-1">
                    <span>Sent to +91 {phone}</span>
                    <button type="button" onClick={() => { setOtpSent(false); setOtp(''); setSimulatedOTP(null); }} className="text-brand-500 hover:text-brand-600 font-bold">Change Number</button>
                  </div>
                </div>

                {validationError && <p className="text-[10px] font-bold text-red-500">{validationError}</p>}
                {error && <p className="text-[10px] font-bold text-red-500">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-brand-500 to-indigo-500 text-white font-black text-xs rounded-2xl shadow-glow transition duration-200 flex items-center justify-center gap-2 uppercase tracking-widest active:scale-95 cursor-pointer"
                >
                  {loading ? 'Verifying OTP...' : 'Verify & Log In'} <Shield size={14} />
                </button>
              </form>
            )}

          </div>
        ) : (
          /* 2. ADMIN & SHOP OWNER EMAIL/PASSWORD LOGIN SCREEN */
          <form onSubmit={handleEmailSubmit} className="space-y-4 animate-in slide-in-from-left duration-250">
            
            {/* Email input */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus-within:border-brand-500 focus-within:bg-white transition duration-200">
                <Mail size={15} className="text-slate-400" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-xs font-bold placeholder:text-slate-400 text-slate-800 focus:ring-0 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Password input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center leading-none">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                <span className="text-[9px] font-bold text-brand-500 hover:text-brand-600 cursor-pointer">Forgot?</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus-within:border-brand-500 focus-within:bg-white transition duration-200">
                <Lock size={15} className="text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-xs font-bold placeholder:text-slate-400 text-slate-800 focus:ring-0 focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-650 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Errors warnings */}
            {validationError && <p className="text-[10px] font-bold text-red-500">{validationError}</p>}
            {error && <p className="text-[10px] font-bold text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 disabled:bg-slate-200 text-white font-black text-xs rounded-2xl shadow-glow transition duration-200 flex items-center justify-center gap-2 uppercase tracking-widest active:scale-95 cursor-pointer"
            >
              {loading ? 'Authenticating...' : 'Sign In as Partner'} <ArrowRight size={14} />
            </button>
          </form>
        )}

        {/* Footer info signup link */}
        <div className="text-center pt-4 border-t border-slate-100 text-xs text-slate-400 font-semibold">
          New to the platform?{' '}
          <Link
            to="/register"
            onClick={() => dispatch(closeLoginModal())}
            className="text-brand-500 font-bold hover:text-brand-600 transition"
          >
            Register
          </Link>
        </div>
        
        {/* Firebase reCAPTCHA anchor */}
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
};

export default Login;
