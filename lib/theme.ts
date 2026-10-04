export type Theme = 'light' | 'dark' | 'dim' | 'system';

export const THEMES: { value: Theme; label: string; icon: string }[] = [
  { value: 'light', label: 'Light', icon: '☀️' },
  { value: 'dark', label: 'Dark', icon: '🌙' },
  { value: 'dim', label: 'Dim', icon: '🌗' },
  { value: 'system', label: 'System', icon: '💻' },
];

export const STORAGE_KEY = 'careerproof-theme';
