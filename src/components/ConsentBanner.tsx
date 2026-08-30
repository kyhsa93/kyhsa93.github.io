import { Link } from 'react-router-dom';
import { useAdConsent } from '../lib/adConsent';
import { useLocale, localizedPath } from '../lib/locale';
import { uiCopy } from '../lib/copy';

export function ConsentBanner() {
  const { consent, grant, deny } = useAdConsent();
  const { locale } = useLocale();
  const t = uiCopy[locale].consent;

  if (consent !== null) return null;

  return (
    <div role="dialog" aria-label={t.ariaLabel} className="consent-banner">
      <div className="consent-banner-card">
        <p>
          {t.bodyBefore}
          <Link to={localizedPath('/privacy-policy', locale)}>{t.privacyLink}</Link>
          {t.bodyAfter}
        </p>
        <div className="consent-banner-actions">
          <button type="button" onClick={deny} className="consent-deny">
            {t.decline}
          </button>
          <button type="button" onClick={grant} className="consent-grant">
            {t.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
