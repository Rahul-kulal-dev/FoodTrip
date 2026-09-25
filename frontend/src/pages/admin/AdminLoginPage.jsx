import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';

export const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authAPI.login(email, password);

      if (!response.user || !response.token) {
        throw new Error(response.message || 'Invalid email or password');
      }

      const rawRole = (response.user.role || '').toUpperCase();
      if (rawRole !== 'ADMIN' && rawRole !== 'ROLE_ADMIN') {
        throw new Error('Access denied: You do not have administrator privileges.');
      }

      login(response.user, 'ROLE_ADMIN', response.token);
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Invalid admin credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setSuccessMsg('Password reset instructions have been sent to your email.');
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-poppins text-[#111827]">
      <div className="w-full max-w-[420px] bg-[#FFFFFF] rounded-[14px] p-7 sm:p-9 shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-[#F1F1F1]">

        <div className="flex flex-col items-center text-center mb-7">
          <div className="mb-2">
            <img src="/FoodTrip.png" alt="FoodTrip Logo" className="w-12 h-12 object-contain" />
          </div>

          <span className="text-[28px] font-[700] text-[#111827] tracking-tight">
            Food<span className="text-[#FF4B2B]">Trip.</span>
          </span>

          <h1 className="text-[20px] font-[600] text-[#111827] mt-4 tracking-tight">
            Admin Login
          </h1>
          <p className="text-[14px] font-[500] text-[#6B7280] mt-1">
            Sign in to access the admin panel
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl text-center font-medium">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs rounded-xl text-center font-medium">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-[500] text-[#6B7280] mb-1.5">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 w-4 h-4 text-[#6B7280] pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full pl-10 pr-4 py-3 bg-[#FFFFFF] border border-[#F1F1F1] rounded-[10px] text-[14px] text-[#111827] placeholder:text-[#6B7280] focus:outline-none focus:ring-1 focus:ring-[#FF4B2B] focus:border-[#FF4B2B] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-[500] text-[#6B7280] mb-1.5">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 w-4 h-4 text-[#6B7280] pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full pl-10 pr-10 py-3 bg-[#FFFFFF] border border-[#F1F1F1] rounded-[10px] text-[14px] text-[#111827] placeholder:text-[#6B7280] focus:outline-none focus:ring-1 focus:ring-[#FF4B2B] focus:border-[#FF4B2B] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-[#6B7280] hover:text-[#111827] transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-[12px] font-[500] text-[#6B7280] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-[#F1F1F1] text-[#FF4B2B] focus:ring-[#FF4B2B] accent-[#FF4B2B] cursor-pointer"
              />
              Remember me
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-[12px] font-[600] text-[#FF4B2B] hover:underline cursor-pointer"
            >
              Forgot password?
            </button>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#FF4B2B] hover:bg-[#E04518] text-[#FFFFFF] font-[500] py-3.5 rounded-[10px] text-[16px] transition-all duration-200 shadow-[0_4px_16px_rgba(0,0,0,0.06)] cursor-pointer flex items-center justify-center"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Logging in...</span>
                </div>
              ) : (
                'Login'
              )}
            </button>
          </div>
        </form>

        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#F1F1F1]"></div>
          </div>
          <span className="relative bg-[#FFFFFF] px-3 text-[12px] text-[#6B7280] font-[500]">
            or
          </span>
        </div>

        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[#FF4B2B] font-[600] text-[14px] hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
