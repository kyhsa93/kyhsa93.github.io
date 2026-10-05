# kyhsa93.github.io

Notes from a backend engineer, in English and Korean (`/ko/`). The site also hosts the side-project list (`src/data/sideProjects.ts`).

Site: https://kyhsa93.github.io/

## Stack

React Router 7 with prerendering, built by Vite. Posts live in `src/data/posts.ts`.

## Build and deploy

```bash
npm ci
npm run build   # tsc -b --noEmit && react-router build && tsx scripts/postbuild.ts (sitemap, OG images)
```

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages.

## Adding a static route

Add it to **both** `react-router.config.ts` (`prerender`) and `scripts/postbuild.ts` (`staticEntries`). With only one, the page silently 404s or drops out of the sitemap.
