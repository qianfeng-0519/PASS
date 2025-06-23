/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // macOS 风格颜色
        'macos-blue': '#007AFF',
        'macos-gray': {
          50: '#F9F9F9',
          100: '#F0F0F0',
          200: '#E5E5E5',
          300: '#D1D1D1',
          400: '#A1A1A1',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
      },
      fontFamily: {
        'system': ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'macos': '8px',
      },
      boxShadow: {
        'macos': '0 4px 16px rgba(0, 0, 0, 0.1)',
        'macos-hover': '0 8px 32px rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}