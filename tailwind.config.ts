import type { Config } from 'tailwindcss'

export default {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './layouts/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand colors (Teal)
        teal: {
          50: '#ebf4f3',
          100: '#c5e0dc',
          200: '#a3cec9',
          300: '#83bcb4',
          400: '#72b3a9',
          500: '#61aaa0',
          600: '#4c8d84',
          700: '#3d726b',
          800: '#2e5652',
          900: '#1f3a38',
        },
        // Secondary/Accent colors (Coral/Salmon)
        coral: {
          50: '#fef5f3',
          100: '#fce4df',
          200: '#fad2c9',
          300: '#f8c0b3',
          400: '#f4a796',
          500: '#e08e79',
          600: '#c54d2e',
          700: '#b44528',
          800: '#8b3420',
          900: '#5f2318',
        },
        accent: '#ff856f',
        // Neutral grays
        gray: {
          50: '#f7fbfa',
          100: '#f6f6f6',
          200: '#ebebeb',
          300: '#d7d7d6',
          400: '#c6c6c6',
          500: '#aaaaa9',
          600: '#9d9d9c',
          700: '#7b7b7b',
          800: '#5e6063',
          900: '#555555',
        },
        // Semantic colors
        error: {
          DEFAULT: '#cc5e5e',
          dark: '#8b0000',
        },
        success: '#4c8d84',
        info: '#61aaa0',
        // Background colors
        'bg-warm': '#faf0e3',
      },
      fontFamily: {
        sans: ['Raleway', 'sans-serif'],
        secondary: ['Futura Book', 'sans-serif'],
      },
      fontWeight: {
        extralight: '200',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
    },
  },
  plugins: [],
} satisfies Config
