import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { authAPI } from '../services/api';

export const SignInPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || '/';

  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await authAPI.login(email, password);

      if (!response.user || !response.token) {
        throw new Error(response.message || 'Invalid email or password');
      }

      const rawRole = (response.user.role || '').toUpperCase();
      let userRole = 'ROLE_CUSTOMER';

      if (rawRole === 'ADMIN' || rawRole === 'ROLE_ADMIN') {
        userRole = 'ROLE_ADMIN';
      } else if (rawRole === 'RESTAURANT' || rawRole === 'ROLE_RESTAURANT' || response.user.restaurantId) {
        userRole = 'ROLE_RESTAURANT';
      } else if (rawRole === 'CUSTOMER' || rawRole === 'ROLE_CUSTOMER') {
        userRole = 'ROLE_CUSTOMER';
      }

      login(response.user, userRole, response.token);

      switch (userRole) {
        case 'ROLE_ADMIN': navigate('/admin'); break;
        case 'ROLE_RESTAURANT': navigate('/restaurant-panel'); break;
        default: navigate(from, { replace: true });
      }
    } catch (err) {
      console.error('Sign in failed:', err);
      setError(err.message || 'Invalid email or password. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#FAFAFA] flex flex-col justify-center py-6 sm:py-10 px-3.5 sm:px-6 lg:px-8 font-poppins text-[#111827]">
      <div className="w-full max-w-[460px] mx-auto my-auto bg-[#FFFFFF] rounded-2xl p-5 sm:p-8 md:p-10 shadow-xl shadow-black/[0.04] sm:shadow-2xl border border-gray-100 flex flex-col justify-center">

        <div className="flex justify-center mb-6 sm:mb-8">
          <Link to="/" className="flex items-center space-x-2.5 cursor-pointer group">
            <img src="/FoodTrip.png" alt="FoodTrip Logo" className="w-9 h-9 sm:w-10 sm:h-10 object-contain transition-transform group-hover:scale-105" />
            <span className="text-[24px] sm:text-[28px] font-[800] text-[#111827] tracking-tight">
              Food<span className="text-[#FF4B2B]">Trip.</span>
            </span>
          </Link>
        </div>

        <div className="mb-6 text-center">
          <h1 className="text-[19px] sm:text-[22px] font-[700] text-[#111827] tracking-tight">
            Welcome back
          </h1>
          <p className="text-[12px] sm:text-[13px] font-[500] text-[#6B7280] mt-1">
            Please enter your details to sign in.
          </p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-3.5 sm:space-y-4">
          <div className="relative flex items-center">
            <Mail className="absolute left-3.5 sm:left-4 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              required
              className="w-full pl-10 sm:pl-11 pr-4 py-3 sm:py-3.5 bg-white border border-gray-200 rounded-[10px] sm:rounded-xl text-[16px] sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4B2B]/15 focus:border-[#FF4B2B] text-[#111827] transition-all placeholder:text-[#6B7280]"
            />
          </div>

          <div className="relative flex items-center">
            <Lock className="absolute left-3.5 sm:left-4 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full pl-10 sm:pl-11 pr-11 py-3 sm:py-3.5 bg-white border border-gray-200 rounded-[10px] sm:rounded-xl text-[16px] sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4B2B]/15 focus:border-[#FF4B2B] text-[#111827] transition-all placeholder:text-[#6B7280]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2.5 sm:right-3 text-gray-400 hover:text-gray-600 transition-colors p-1.5 cursor-pointer touch-manipulation"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 text-[12px] sm:text-xs pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer text-gray-600 font-medium select-none">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-[#FF4B2B] focus:ring-[#FF4B2B]"
              />
              <span>Remember me</span>
            </label>
            <a href="#forgot" className="text-[#FF4B2B] font-semibold hover:underline">
              Forgot password?
            </a>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200/90 text-red-600 text-xs sm:text-sm font-medium animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span className="flex-1 leading-snug">{error}</span>
            </div>
          )}

          <div className="pt-1.5 sm:pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#FF4B2B] hover:bg-[#e03a00] active:scale-[0.99] text-white font-bold py-3 sm:py-3.5 rounded-[10px] sm:rounded-xl text-sm transition-all duration-200 shadow-md shadow-[#FF4B2B]/20 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed touch-manipulation"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>

        <div className="relative my-5 sm:my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200/80"></div>
          </div>
          <span className="relative bg-white px-3 text-xs text-gray-400 font-medium">or</span>
        </div>

        <div className="grid grid-cols-1 gap-3.5">
          <button
            type="button"
            className="flex items-center justify-center gap-2.5 px-3 py-2.5 sm:py-3 border border-gray-200 rounded-[10px] sm:rounded-xl hover:bg-[#FFF1ED] active:scale-[0.99] transition-all cursor-pointer touch-manipulation"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span className="text-[13px] sm:text-sm font-[600] text-[#111827]">Sign in with Google</span>
          </button>
        </div>

        <div className="mt-5 sm:mt-6 text-center text-[12px] sm:text-xs text-[#6B7280]">
          Don't have an account?{' '}
          <Link to="/signup" state={{ from: location.state?.from }} className="text-[#FF4B2B] font-semibold hover:underline">
            Sign up
          </Link>
        </div>

      </div>
    </div>
  );
};

