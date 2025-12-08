/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'base': '#121212',
        'panel': '#1E1E1E',
        'panel-secondary': '#252526',
        'elevated': '#2D2D2D',
        'hover': '#3C3C3C',
        'active': '#094771',
        'border-subtle': '#333333',
        'border-default': '#454545',
        'border-focus': '#007ACC',
        'text-primary': '#E0E0E0',
        'text-secondary': '#A0A0A0',
        'text-muted': '#6E6E6E',
        'accent': '#007ACC',
        'accent-hover': '#1A8AD4',
        'accent-error': '#EF5350',
        'gizmo-x': '#E53935',
        'gizmo-y': '#43A047',
        'gizmo-z': '#1E88E5',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

