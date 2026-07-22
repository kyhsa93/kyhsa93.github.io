import { createContext, useContext, useState, type ReactNode } from 'react';

type ConsentState = 'granted' | 'denied' | null;

const CONSENT_KEY = 'blog_ad_consent';

interface AdConsentCtx {
  consent: ConsentState;
  grant: () => void;
  deny: () => void;
}

const AdConsentContext = createContext<AdConsentCtx>({
  consent: null,
  grant: () => {},
  deny: () => {},
});

export function useAdConsent(): AdConsentCtx {
  return useContext(AdConsentContext);
}

export function AdConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentState>(() => {
    if (typeof window === 'undefined') return null;
    return (window.localStorage.getItem(CONSENT_KEY) as ConsentState) ?? null;
  });

  const grant = () => {
    window.localStorage.setItem(CONSENT_KEY, 'granted');
    setConsent('granted');
  };

  const deny = () => {
    window.localStorage.setItem(CONSENT_KEY, 'denied');
    setConsent('denied');
  };

  return (
    <AdConsentContext.Provider value={{ consent, grant, deny }}>
      {children}
    </AdConsentContext.Provider>
  );
}
