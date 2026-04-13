import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        zwijsen: {
          // Primary magenta/purple - Zwijsen brand color
          blue: '#A81D7B',
          'blue-light': '#F3D6EB',
          // Accent colors from the Zwijsen logo blocks
          pink: '#A81D7B',
          'pink-light': '#F3D6EB',
          green: '#5BAD6F',
          'green-dark': '#3D7A4E',
          orange: '#F07D00',
          yellow: '#F5C400',
          red: '#E63329',
        },
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
    },
  },
  plugins: [],
}

export default config
