import { useEffect, useRef } from 'react';
import { useAdConsent } from '../lib/adConsent';

type AdFormat = 'auto' | 'horizontal' | 'rectangle';

interface AdUnitProps {
  slot: string;
  format?: AdFormat;
}

const RESERVED_HEIGHT: Record<AdFormat, number> = {
  auto: 100,
  horizontal: 90,
  rectangle: 250,
};

const CLIENT_ID = 'ca-pub-1195159445218373';

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

function isStandaloneMode(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(display-mode: standalone)').matches
  );
}

export function AdUnit({ slot, format = 'auto' }: AdUnitProps) {
  const { consent } = useAdConsent();
  const pushed = useRef(false);

  useEffect(() => {
    if (consent !== 'granted' || isStandaloneMode() || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // adsbygoogle script not loaded yet — ignore
    }
  }, [consent]);

  if (consent !== 'granted' || isStandaloneMode()) return null;

  if (import.meta.env.DEV) {
    return (
      <div
        className="ad-unit ad-placeholder"
        style={{ minHeight: RESERVED_HEIGHT[format] }}
        aria-hidden="true"
      >
        Ad slot ({format}, {slot})
      </div>
    );
  }

  return (
    <div className="ad-unit" style={{ minHeight: RESERVED_HEIGHT[format] }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format={format === 'auto' ? 'auto' : undefined}
        data-full-width-responsive={format === 'auto' ? 'true' : undefined}
      />
    </div>
  );
}
