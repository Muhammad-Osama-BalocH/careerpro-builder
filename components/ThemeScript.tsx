import { STORAGE_KEY } from '@/lib/theme';

/**
 * Inline <script> injected into <head> to prevent FOUC.
 * Runs before React hydrates, so the correct CSS variables are applied immediately.
 * For "dim" and "dark" themes, the `dark` class is added to <html> so Tailwind's
 * dark: prefix works. For "dim", a `dim` class is also added for dim-specific overrides.
 */
export function ThemeScript() {
  const script = `
(function(){
  try {
    var stored = localStorage.getItem('${STORAGE_KEY}');
    var theme = stored || 'system';
    var isDark = false;
    var isDim = false;

    if (theme === 'dark') {
      isDark = true;
    } else if (theme === 'dim') {
      isDark = true;
      isDim = true;
    } else if (theme === 'system') {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    if (isDark) document.documentElement.classList.add('dark');
    if (isDim) document.documentElement.classList.add('dim');
  } catch(e) {}
})();
`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
