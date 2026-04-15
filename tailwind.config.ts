import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Calibri', 'Segoe UI', 'system-ui', 'ui-sans-serif', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      fontSize: {
        xs: ['12px', { lineHeight: '1.5' }],
        sm: ['14px', { lineHeight: '1.5' }],
        base: ['16px', { lineHeight: '1.6' }],
        lg: ['18px', { lineHeight: '1.6' }],
        xl: ['20px', { lineHeight: '1.4' }],
        '2xl': ['24px', { lineHeight: '1.35' }],
        '3xl': ['28px', { lineHeight: '1.35' }],
        '4xl': ['36px', { lineHeight: '1.2' }],
        '5xl': ['48px', { lineHeight: '1.2' }],
      },
      colors: {
        zwijsen: {
          // Primary magenta/purple - Zwijsen brand color (extended palette)
          primary: {
            50: '#F8D5EC',
            100: '#F3D6EB',
            200: '#E8AED7',
            300: '#D785C3',
            400: '#C75CB5',
            500: '#A81D7B',
            600: '#8B1864',
            700: '#6E1150',
            800: '#52093C',
            900: '#3A0629',
          },
          // Accent green (extended palette)
          accent: {
            50: '#F0F7F4',
            100: '#E1EFE9',
            200: '#C3DED3',
            300: '#A5CDBD',
            400: '#86BCA7',
            500: '#5BAD6F',
            600: '#4A9B5D',
            700: '#39894B',
            800: '#287739',
            900: '#1A5227',
          },
          // Warning orange (extended palette)
          warning: {
            50: '#FFF8F0',
            100: '#FFE8D1',
            200: '#FFD0A3',
            300: '#FFB875',
            400: '#FFA047',
            500: '#F07D00',
            600: '#D66800',
            700: '#BC5300',
            800: '#A24100',
            900: '#882D00',
          },
          // Semantic colors
          success: '#5BAD6F',
          error: '#EF4444',
          info: '#3B82F6',
          neutral: '#6B7280',
        },
      },
      borderRadius: {
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        full: '9999px',
      },
      spacing: {
        '1': '0.5rem',
        '2': '1rem',
        '3': '1.5rem',
        '4': '2rem',
        '5': '2.5rem',
        '6': '3rem',
        '8': '4rem',
        '12': '6rem',
        '16': '8rem',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        none: 'none',
      },
      transitionDuration: {
        150: '150ms',
        200: '200ms',
        300: '300ms',
      },
      animation: {
        'shimmer': 'shimmer 2s infinite',
        'pulse-soft': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [],
}

export default config
