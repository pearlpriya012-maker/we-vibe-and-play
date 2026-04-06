/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0d0d0d',
          secondary: '#111111',
          card: 'rgba(255,255,255,0.03)',
        },
        green: {
          DEFAULT: '#00ff88',
          dim: '#00cc6a',
          glow: 'rgba(0,255,136,0.3)',
        },
        purple: {
          vibe: '#9b59b6',
        },
        cyan: {
          vibe: '#3498db',
        },
        pink: {
          vibe: '#e91e63',
        },
        border: {
          vibe: 'rgba(0,255,136,0.15)',
        },
      },
      fontFamily: {
        display: ['Oswald', 'sans-serif'],
        body: ['Work Sans', 'sans-serif'],
      },
      animation: {
        'float': 'floatShape 20s linear infinite',
        'pulse-glow': 'pulseGlow 2s ease infinite',
        'glitch': 'glitch1 4s infinite',
        'fade-up': 'fadeUp 0.6s ease both',
        'scan': 'scan 3s ease-in-out infinite',
      },
      keyframes: {
        floatShape: {
          '0%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-30px) rotate(180deg)' },
          '100%': { transform: 'translateY(0) rotate(360deg)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.4 },
        },
        fadeUp: {
          from: { opacity: 0, transform: 'translateY(24px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        scan: {
          '0%, 100%': { transform: 'translateY(-100%)' },
          '50%': { transform: 'translateY(100%)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'green-glow': '0 0 20px rgba(0,255,136,0.3)',
        'green-glow-lg': '0 0 40px rgba(0,255,136,0.4)',
        'card': '0 4px 32px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
}
