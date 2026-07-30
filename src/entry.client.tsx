import { startTransition, StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { HydratedRouter } from 'react-router/dom';
import { registerSW } from 'virtual:pwa-register';

// vite-plugin-pwa normally injects this registration + the manifest <link> by transforming a
// static index.html — framework mode generates HTML from root.tsx instead, so there's no file
// for that transform to hook into. Registering manually here is the documented workaround.
registerSW({ immediate: true });

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>,
  );
});
