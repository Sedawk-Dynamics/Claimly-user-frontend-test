import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/user.service';
import { bannerService } from '../services/banner.service';
import { CreditCard, FileText, Users, User, Image as ImageIcon } from 'lucide-react';
import type { SubscriptionStatus } from '../types';
import type { Banner } from '../services/banner.service';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Homepage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<Banner | null>(null);

  useEffect(() => {
    checkSubscription();
    loadBanner();
  }, []);

  const checkSubscription = async () => {
    try {
      const status = await userService.getSubscription() as SubscriptionStatus;
      
      // If no active subscription, redirect to subscription offering
      if (status.status !== 'ACTIVE') {
        navigate('/subscription-offering');
        return;
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBanner = async () => {
    try {
      const activeBanner = await bannerService.getActiveBanner();
      setBanner(activeBanner);
    } catch (error) {
      console.error('Error loading banner:', error);
    }
  };

  const getImageUrl = (imageUrl: string) => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${API_BASE_URL}${imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-200 dark:border-cyan-900 border-t-brand-500 dark:border-t-cyan-400"></div>
          <div className="absolute inset-0 rounded-full bg-gradient-brand opacity-20 blur-xl animate-pulse-glow"></div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 font-medium animate-pulse">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gradient-brand mb-2">Welcome to Claimly</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your insurance policies and nominees</p>
      </div>

      {/* Banners Section */}
      {banner && (
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <div className="w-1 h-6 bg-gradient-brand rounded-full mr-3"></div>
            <ImageIcon className="w-5 h-5 mr-2" />
            Banners
          </h2>
          <div className="card p-0 overflow-hidden relative group">
            <div className="relative w-full h-64 sm:h-80 bg-gradient-to-br from-brand-500 to-cyan-400">
              <img
                src={getImageUrl(banner.imageUrl)}
                alt={banner.title || 'Banner'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to gradient if image fails to load
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              {banner.title && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end">
                  <div className="p-6 sm:p-8 w-full">
                    <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">{banner.title}</h3>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <div className="w-1 h-6 bg-gradient-sunset rounded-full mr-3"></div>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div
            onClick={() => navigate('/profile')}
            className="card card-hover p-5 sm:p-6 group relative overflow-hidden border border-transparent hover:border-cyan-400/30 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-cyan-400 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            <div className="relative flex items-start space-x-4">
              <div className="relative p-3 bg-gradient-to-br from-brand-500 to-cyan-400 rounded-xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 flex-shrink-0">
                <User className="w-6 h-6 text-white" />
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-xl transition-opacity duration-300"></div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-gradient-brand transition-all">
                  My Profile
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">View and update your profile information</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => navigate('/nominees')}
            className="card card-hover p-5 sm:p-6 group relative overflow-hidden border border-transparent hover:border-cyan-400/30 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-brand-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            <div className="relative flex items-start space-x-4">
              <div className="relative p-3 bg-gradient-to-br from-cyan-400 to-brand-500 rounded-xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 flex-shrink-0">
                <Users className="w-6 h-6 text-white" />
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-xl transition-opacity duration-300"></div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-gradient-brand transition-all">
                  Nominees List
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Manage your nominees and their documents</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => navigate('/subscription')}
            className="card card-hover p-5 sm:p-6 group relative overflow-hidden border border-transparent hover:border-orange-400/30 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-yellow-400 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            <div className="relative flex items-start space-x-4">
              <div className="relative p-3 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 flex-shrink-0">
                <CreditCard className="w-6 h-6 text-white" />
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-xl transition-opacity duration-300"></div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-gradient-brand transition-all">
                  My Subscription
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">View your subscription status and history</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => navigate('/policies')}
            className="card card-hover p-5 sm:p-6 group relative overflow-hidden border border-transparent hover:border-cyan-400/30 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-brand-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            <div className="relative flex items-start space-x-4">
              <div className="relative p-3 bg-gradient-to-br from-cyan-400 to-brand-600 rounded-xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 flex-shrink-0">
                <FileText className="w-6 h-6 text-white" />
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-xl transition-opacity duration-300"></div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-gradient-brand transition-all">
                  My Policies
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">View and manage your insurance policies</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

