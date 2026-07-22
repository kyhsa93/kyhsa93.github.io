import { Link } from 'react-router-dom';
import { useAdConsent } from '../lib/adConsent';

export function ConsentBanner() {
  const { consent, grant, deny } = useAdConsent();

  if (consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie and ad consent"
      className="consent-banner"
    >
      <div className="consent-banner-card">
        <p>
          This site uses cookies to show relevant ads. See the{' '}
          <Link to="/privacy-policy">privacy policy</Link> for details.
        </p>
        <div className="consent-banner-actions">
          <button type="button" onClick={deny} className="consent-deny">
            Decline
          </button>
          <button type="button" onClick={grant} className="consent-grant">
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
