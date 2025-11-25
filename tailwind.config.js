/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Blue - Brand Color #0035D7
        brand: {
          50: '#e6ecff',
          100: '#ccd9ff',
          200: '#99b3ff',
          300: '#668eff',
          400: '#3368ff',
          500: '#0035D7', // Primary Blue
          600: '#002ab3',
          700: '#00208f',
          800: '#00156b',
          900: '#000b47',
          950: '#000523',
        },
        // Orange - Primary Accent #F38124
        orange: {
          50: '#fff4ed',
          100: '#ffe8d5',
          200: '#feccaa',
          300: '#fdab74',
          400: '#F38124', // Primary Orange
          500: '#f76d1c',
          600: '#e85412',
          700: '#c13f11',
          800: '#983316',
          900: '#7a2e15',
          950: '#421509',
        },
        // Yellow - Highlight #F0D509
        yellow: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#F0D509', // Primary Yellow
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
          950: '#422006',
        },
        // Cyan - Info/Secondary #1DCEFF
        cyan: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#1DCEFF', // Primary Cyan
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344',
        },
        // Navy - Dark Background #03234E
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#03234E', // Primary Navy
          950: '#020f1f',
        },
        // Black - Deep backgrounds and text
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#000000', // Pure Black
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',

        // Brand Gradients
        'gradient-brand': 'linear-gradient(135deg, #0035D7 0%, #1DCEFF 100%)',
        'gradient-brand-reverse': 'linear-gradient(135deg, #1DCEFF 0%, #0035D7 100%)',
        'gradient-ocean': 'linear-gradient(135deg, #0035D7 0%, #1DCEFF 50%, #03234E 100%)',

        // Accent Gradients
        'gradient-sunset': 'linear-gradient(135deg, #F38124 0%, #F0D509 100%)',
        'gradient-fire': 'linear-gradient(135deg, #F38124 0%, #e85412 100%)',

        // Info Gradients
        'gradient-glow': 'linear-gradient(135deg, #1DCEFF 0%, #0035D7 100%)',
        'gradient-cyan': 'linear-gradient(135deg, #1DCEFF 0%, #0891b2 100%)',

        // Dark Gradients
        'gradient-dark': 'linear-gradient(135deg, #03234E 0%, #000000 100%)',
        'gradient-navy': 'linear-gradient(135deg, #03234E 0%, #0035D7 100%)',

        // Hero Gradient
        'gradient-hero': 'linear-gradient(135deg, #03234E 0%, #0035D7 50%, #1DCEFF 100%)',
        'gradient-hero-reverse': 'linear-gradient(135deg, #1DCEFF 0%, #0035D7 50%, #03234E 100%)',
      },
      boxShadow: {
        'elegant': '0 4px 20px rgba(0, 0, 0, 0.08)',
        'elegant-lg': '0 10px 40px rgba(0, 0, 0, 0.12)',
        'elegant-dark': '0 4px 20px rgba(0, 0, 0, 0.3)',
        'elegant-dark-lg': '0 10px 40px rgba(0, 0, 0, 0.4)',

        // Colored Glows
        'glow-brand': '0 0 20px rgba(0, 53, 215, 0.4), 0 0 40px rgba(0, 53, 215, 0.2)',
        'glow-brand-lg': '0 0 30px rgba(0, 53, 215, 0.5), 0 0 60px rgba(0, 53, 215, 0.3)',
        'glow-orange': '0 0 20px rgba(243, 129, 36, 0.4), 0 0 40px rgba(243, 129, 36, 0.2)',
        'glow-orange-lg': '0 0 30px rgba(243, 129, 36, 0.5), 0 0 60px rgba(243, 129, 36, 0.3)',
        'glow-yellow': '0 0 20px rgba(240, 213, 9, 0.4), 0 0 40px rgba(240, 213, 9, 0.2)',
        'glow-yellow-lg': '0 0 30px rgba(240, 213, 9, 0.5), 0 0 60px rgba(240, 213, 9, 0.3)',
        'glow-cyan': '0 0 20px rgba(29, 206, 255, 0.4), 0 0 40px rgba(29, 206, 255, 0.2)',
        'glow-cyan-lg': '0 0 30px rgba(29, 206, 255, 0.5), 0 0 60px rgba(29, 206, 255, 0.3)',

        // 3D Card Shadows
        'card-3d': '0 10px 30px -5px rgba(0, 0, 0, 0.1), 0 20px 40px -10px rgba(0, 0, 0, 0.15)',
        'card-3d-hover': '0 20px 40px -5px rgba(0, 0, 0, 0.15), 0 30px 60px -10px rgba(0, 0, 0, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'pulse-glow-orange': 'pulseGlowOrange 2s ease-in-out infinite',
        'pulse-glow-cyan': 'pulseGlowCyan 2s ease-in-out infinite',
        'gradient-shift': 'gradientShift 3s ease infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 53, 215, 0.4), 0 0 40px rgba(0, 53, 215, 0.2)' },
          '50%': { boxShadow: '0 0 30px rgba(0, 53, 215, 0.6), 0 0 60px rgba(0, 53, 215, 0.3)' },
        },
        pulseGlowOrange: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(243, 129, 36, 0.4), 0 0 40px rgba(243, 129, 36, 0.2)' },
          '50%': { boxShadow: '0 0 30px rgba(243, 129, 36, 0.6), 0 0 60px rgba(243, 129, 36, 0.3)' },
        },
        pulseGlowCyan: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(29, 206, 255, 0.4), 0 0 40px rgba(29, 206, 255, 0.2)' },
          '50%': { boxShadow: '0 0 30px rgba(29, 206, 255, 0.6), 0 0 60px rgba(29, 206, 255, 0.3)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
