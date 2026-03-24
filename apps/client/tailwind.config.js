/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./app/components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: '#F4FBF9',
        cards: '#FFFFFF',
        primary: '#257D71',
        primaryHover: '#1F6A60',
        secondary: '#4FAFA1',
        accent: '#8FD5C8',
        tPrimary: '#0F172A',
        tSecondary: '#64748B',
        border: '#E2E8F0',
      }
    },
  },
  plugins: [],
}

