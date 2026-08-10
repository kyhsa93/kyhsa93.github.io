import { useLocation, useNavigate } from 'react-router-dom';
import { useLocale } from '../lib/locale';

export function LanguageToggle() {
  const { locale } = useLocale();
  const location = useLocation();
  const navigate = useNavigate();

  function toggleLocale() {
    const enPath = locale === 'ko' ? location.pathname.replace(/^\/ko/, '') || '/' : location.pathname;
    const nextPath = locale === 'ko' ? enPath : enPath === '/' ? '/ko' : `/ko${enPath}`;
    navigate(`${nextPath}${location.search}${location.hash}`);
  }

  return (
    <button
      className="lang-toggle"
      type="button"
      aria-label="Switch language"
      onClick={toggleLocale}
    >
      <span aria-hidden="true">🌐</span>
    </button>
  );
}
