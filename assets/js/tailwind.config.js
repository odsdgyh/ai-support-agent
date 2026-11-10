/* Конфигурация Tailwind Play CDN — Brutalism Website Style (Light / Dark). */
tailwind.config = {
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'ui-sans-serif', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        modeling: '#6366f1',
        sculpt: '#06b6d4',
        gamedev: '#10b981',
        brutal: {
          orange: '#FF3B00',
          yellow: '#FFDE59',
          acid: '#E5FF00',
          paper: '#F4F0EA',
          ink: '#0D0D0D',
        },
      },
    },
  },
};
