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
          blue: '#4BA3C7',
          'blue-light': '#A8D8EA',
          pink: '#E91E8C',
          'pink-light': '#F8BBD9',
          green: '#7CBF5E',
          'green-dark': '#4A7C3F',
        },
      },
    },
  },
  plugins: [],
}

export default config
