import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  initialize: () => void;
}

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark'; // Premium default
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: (localStorage.getItem('taskflow-theme') as Theme) || 'system',
  setTheme: (theme: Theme) => {
    localStorage.setItem('taskflow-theme', theme);
    set({ theme });
    
    // Apply changes
    const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    
    if (resolvedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },
  initialize: () => {
    const activeTheme = get().theme;
    get().setTheme(activeTheme);

    // Listen to system settings changes
    if (activeTheme === 'system') {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (get().theme === 'system') {
          const resolved = e.matches ? 'dark' : 'light';
          document.documentElement.setAttribute('data-theme', resolved);
          if (resolved === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      });
    }
  },
}));
