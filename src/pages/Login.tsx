import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { auth, setupRecaptcha, sendOTP, verifyOTP } from '../config/firebase';
import { useTheme } from '../contexts/ThemeContext';
import { Phone, MessageSquare } from 'lucide-react';
import logo from '../logo/claimly logo png.png';

export default function Login() {
  const [step, setStep] = useState<'phone' | 'otp' | 'signup'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<any>(null);
  const [idToken, setIdToken] = useState<string>('');
  const navigate = useNavigate();
  const { setTheme } = useTheme();

  useEffect(() => {
    // Setup reCAPTCHA
    const verifier = setupRecaptcha('recaptcha-container');
    setRecaptchaVerifier(verifier);

    return () => {
      if (verifier) {
        verifier.clear();
      }
    };
  }, []);

  // Force light mode on login page
  useEffect(() => {
    setTheme('light');
    // Force light mode on document root as well
    const root = window.document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
  }, [setTheme]);

  const handlePhoneSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      const vid = await sendOTP(formattedPhone, recaptchaVerifier);
      setVerificationId(vid);
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const firebaseIdToken = await verifyOTP(verificationId, otp);
      setIdToken(firebaseIdToken);
      // Try to login with existing user
      try {
        const response = await authService.verifyOTP(firebaseIdToken, phoneNumber);
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        navigate('/');
      } catch (loginError: any) {
        // Only show signup form if error indicates user doesn't exist (name/email required for new users)
        const errorMessage = loginError.response?.data?.error || loginError.message || '';
        const isNewUserError = errorMessage.includes('Name and email are required') || 
                              errorMessage.includes('required for new users') ||
                              (loginError.response?.status === 400 && errorMessage.includes('new user'));
        
        // If mobile number already registered, user exists - don't show signup form, show error
        if (errorMessage.includes('Mobile number already registered')) {
          setError('This mobile number is already registered. Please contact support if you need assistance.');
          return;
        }
        
        if (isNewUserError) {
          setStep('signup');
        } else {
          throw loginError;
        }
      }
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let firebaseIdToken = idToken;

      if (!firebaseIdToken) {
        if (auth.currentUser) {
          firebaseIdToken = await auth.currentUser.getIdToken(true);
          setIdToken(firebaseIdToken);
        } else {
          firebaseIdToken = await verifyOTP(verificationId, otp);
          setIdToken(firebaseIdToken);
        }
      }

      const response = await authService.verifyOTP(firebaseIdToken, phoneNumber, name, email);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero px-4 py-8 relative overflow-hidden">
      <div id="recaptcha-container"></div>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-glow opacity-20 rounded-full blur-3xl animate-pulse-glow"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-sunset opacity-20 rounded-full blur-3xl animate-pulse-glow-orange"></div>
      </div>

      <div className="max-w-md w-full relative z-10 animate-scale-in">
        {/* Glassmorphic Login Card */}
        <div className="glass backdrop-blur-xl rounded-2xl p-8 sm:p-10 border-2 border-orange-400/30 shadow-card-3d-hover">

          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="relative p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl">
                  <img src={logo} alt="Claimly" className="h-14 sm:h-16 w-auto" />
                </div>
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 animate-slide-in">
              {step === 'phone' && 'Welcome Back'}
              {step === 'otp' && 'Verify OTP'}
              {step === 'signup' && 'Complete Profile'}
            </h1>
            <p className="text-base sm:text-lg text-gray-700 font-medium animate-slide-in">
              {step === 'phone' && 'Sign in to your account'}
              {step === 'otp' && 'Enter the OTP sent to your phone'}
              {step === 'signup' && 'Complete your profile to continue'}
            </p>
          </div>

          {error && (
            <div className="bg-orange-500/20 border-2 border-orange-400 backdrop-blur-sm text-orange-900 px-4 py-3 rounded-lg text-sm mb-6 animate-slide-in shadow-glow-orange">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                <p className="font-medium">{error}</p>
              </div>
            </div>
          )}

          {step === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-6 animate-slide-up">
              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-800 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-black w-5 h-5 z-10" />
                  <input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-white/90 border-2 border-cyan-400/30 rounded-xl text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-all duration-300 backdrop-blur-sm hover:border-cyan-400/50"
                    placeholder="9876543210"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !recaptchaVerifier}
                className="group relative w-full overflow-hidden bg-gradient-sunset text-white px-6 py-4 rounded-xl font-bold text-lg shadow-glow-orange-lg hover:shadow-glow-orange transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <div className="absolute inset-0 bg-gradient-fire opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center space-x-2">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <Phone className="w-5 h-5" />
                      <span>Send OTP</span>
                    </>
                  )}
                </div>
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleOTPSubmit} className="space-y-6 animate-slide-up">
              <div className="space-y-2">
                <label htmlFor="otp" className="block text-sm font-semibold text-gray-800 mb-2">
                  Enter OTP
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-4 top-1/2 transform -translate-y-1/2 text-black w-5 h-5 z-10" />
                  <input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    maxLength={6}
                    className="w-full pl-12 pr-4 py-3.5 bg-white/90 border-2 border-cyan-400/30 rounded-xl text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-all duration-300 backdrop-blur-sm hover:border-cyan-400/50 text-center text-2xl tracking-widest font-bold"
                    placeholder="000000"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">OTP sent to {phoneNumber}</p>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="group relative w-full overflow-hidden bg-gradient-sunset text-white px-6 py-4 rounded-xl font-bold text-lg shadow-glow-orange-lg hover:shadow-glow-orange transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <div className="absolute inset-0 bg-gradient-fire opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center space-x-2">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-5 h-5" />
                      <span>Verify OTP</span>
                    </>
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setOtp('');
                }}
                className="w-full text-cyan-600 py-2 text-sm font-semibold hover:text-cyan-700 transition-colors"
              >
                Change Phone Number
              </button>
            </form>
          )}

          {step === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-6 animate-slide-up">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-semibold text-gray-800 mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 bg-white/90 border-2 border-cyan-400/30 rounded-xl text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-all duration-300 backdrop-blur-sm hover:border-cyan-400/50"
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 bg-white/90 border-2 border-cyan-400/30 rounded-xl text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-all duration-300 backdrop-blur-sm hover:border-cyan-400/50"
                  placeholder="john.doe@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !name || !email}
                className="group relative w-full overflow-hidden bg-gradient-sunset text-white px-6 py-4 rounded-xl font-bold text-lg shadow-glow-orange-lg hover:shadow-glow-orange transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <div className="absolute inset-0 bg-gradient-fire opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center space-x-2">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <span>Complete Sign Up</span>
                  )}
                </div>
              </button>
            </form>
          )}

          {/* Decorative Bottom Border */}
          <div className="mt-8 pt-6 border-t border-cyan-400/20">
            <p className="text-center text-sm text-gray-700">
              Powered by <span className="text-gradient-sunset font-bold">Claimly</span>
            </p>
          </div>
        </div>

        {/* Floating glow effect */}
        <div className="absolute -inset-4 bg-gradient-brand opacity-20 blur-3xl -z-10 animate-pulse-glow"></div>
      </div>
    </div>
  );
}

