import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ShoppingBag, Eye, EyeOff, Lock, Mail, User as UserIcon, Phone, ArrowRight, Store } from 'lucide-react';
import api from '../../services/api';
import { loginSuccess, openLoginModal } from '../../redux/authSlice';

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); // user or shopowner
  const [city, setCity] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        name,
        email,
        phone,
        password,
        role
      };
      if (role === 'shopowner') {
        payload.city = city;
      }

      const response = await api.post('/auth/register', payload);

      if (response.data.success) {
        dispatch(loginSuccess(response.data));
        
        // Redirect according to role
        if (role === 'shopowner') {
          // Instruct them their shop is pending admin approval unless created directly by admin
          alert('Gourmet Owner Account created successfully! Please configure your Restaurant profile.');
          navigate('/shop/dashboard');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      console.error('Registration failed:', err);
      setError(err.message || 'Registration failed. Email might already be taken.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6 py-12 relative overflow-hidden font-inter">
      {/* Visual background gradients */}
      <span className="absolute -left-20 -bottom-20 w-80 h-80 bg-brand-500/5 rounded-full" />
      <span className="absolute -right-20 -top-20 w-80 h-80 bg-brand-500/5 rounded-full" />

      {/* Main Glass Panel Card */}
      <div className="max-w-md w-full bg-white border border-gray-150 p-8 rounded-3xl shadow-premium relative z-10 space-y-8 animate-in fade-in duration-200">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <span className="p-2.5 bg-brand-500 rounded-2xl text-white shadow-glow">
              <ShoppingBag size={20} strokeWidth={2.5} />
            </span>
            <span className="font-poppins font-extrabold text-xl tracking-tight text-gray-900">
              Bite<span className="text-brand-500">Flow</span>
            </span>
          </Link>
          <h2 className="font-poppins font-black text-gray-900 text-2xl tracking-tight">Create Account</h2>
          <p className="text-xs text-gray-400 font-medium leading-none">Register today to discover fine Manhattan menus.</p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Name input */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Full Name</label>
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus-within:border-brand-500 focus-within:bg-white transition duration-200">
              <UserIcon size={16} className="text-gray-400" />
              <input
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-xs font-semibold placeholder:text-gray-400 text-gray-800 focus:ring-0 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Email input */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Email Address</label>
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus-within:border-brand-500 focus-within:bg-white transition duration-200">
              <Mail size={16} className="text-gray-400" />
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-xs font-semibold placeholder:text-gray-400 text-gray-800 focus:ring-0 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Phone input */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Phone Number</label>
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus-within:border-brand-500 focus-within:bg-white transition duration-200">
              <Phone size={16} className="text-gray-400" />
              <input
                type="tel"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-xs font-semibold placeholder:text-gray-400 text-gray-800 focus:ring-0 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Password</label>
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus-within:border-brand-500 focus-within:bg-white transition duration-200">
              <Lock size={16} className="text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-xs font-semibold placeholder:text-gray-400 text-gray-800 focus:ring-0 focus:outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Conditional City input for shopowners */}
          {role === 'shopowner' && (
            <div className="space-y-1.5 animate-in slide-in-from-top duration-200">
              <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">City / Restaurant Location</label>
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus-within:border-brand-500 focus-within:bg-white transition duration-200">
                <Store size={16} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="e.g. Manhattan, Brooklyn"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-xs font-semibold placeholder:text-gray-400 text-gray-800 focus:ring-0 focus:outline-none"
                  required={role === 'shopowner'}
                />
              </div>
            </div>
          )}

          {/* Role selector */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Account Objective</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('user')}
                className={`py-3 text-[10px] font-bold rounded-2xl border transition uppercase tracking-wider ${role === 'user' ? 'border-brand-500 bg-brand-50 text-brand-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                Order Food
              </button>
              <button
                type="button"
                onClick={() => setRole('shopowner')}
                className={`py-3 text-[10px] font-bold rounded-2xl border transition uppercase tracking-wider ${role === 'shopowner' ? 'border-brand-500 bg-brand-50 text-brand-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                Sell Food
              </button>
            </div>
          </div>

          {error && <p className="text-[10px] font-semibold text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-150 text-white font-bold text-xs rounded-2xl shadow-glow transition duration-200 flex items-center justify-center gap-2 uppercase tracking-wider active:scale-95"
          >
            {loading ? 'Registering...' : 'Sign Up'} <ArrowRight size={14} />
          </button>
        </form>

        {/* Footer info login link */}
        <div className="text-center pt-4 border-t border-gray-100 text-xs text-gray-400 font-medium">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => dispatch(openLoginModal())}
            className="text-brand-500 font-bold hover:text-brand-600 transition cursor-pointer bg-transparent border-none p-0 outline-none inline ml-1"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
