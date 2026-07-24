import { useLocale } from '../lib/locale';

export function LanguageToggle() {
  const { locale, setLocale } = useLocale();
  const nextLocale = locale === 'en' ? 'ko' : 'en';

  return (
    <button
      className="lang-toggle"
      type="button"
      aria-label="Switch language"
      onClick={() => setLocale(nextLocale)}
    >
      <span aria-hidden="true">🌐</span>
      {nextLocale === 'ko' ? '한국어' : 'EN'}
    </button>
  );
}
