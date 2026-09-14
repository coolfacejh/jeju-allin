/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0A6E6D',
        'primary-dark': '#085352',
        'primary-light': '#E6F4F2',
        accent: '#F97316',
        'accent-light': '#FFEDD5',
        tertiary: '#0284C7',
        'tertiary-light': '#E0F2FE',
        ink: '#0F172A',
        sub: '#334155',
        muted: '#64748B',
        line: '#E2E8F0',
        surface: '#F8FAFC',
        card: '#FFFFFF',
        'surface-sub': '#F1F5F9',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Pretendard', '-apple-system', 'sans-serif'],
      },
      borderRadius: { xl: '0.75rem', '2xl': '1rem' },
      boxShadow: {
        card: '0 4px 16px -2px rgba(15,23,42,0.05), 0 2px 6px -1px rgba(15,23,42,0.03)',
        raised: '0 8px 24px -4px rgba(10,110,109,0.10), 0 4px 12px -2px rgba(30,41,59,0.05)',
      },
    },
  },
  plugins: [],
};
