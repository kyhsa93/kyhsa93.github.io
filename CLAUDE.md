# CLAUDE.md

Guidance for AI agents (and future me) editing this repo.

## AdSense content guidelines

This site runs Google AdSense. It was once flagged **"approved, but attention needed due to low-value content."** The investigation that followed found two root causes — neither was thin content in the word-count sense. Read this before adding or editing content.

### What actually caused the flag

1. **The site read as a narrow, self-referential archive.** Nearly all posts linked back to one personal side project (`backend-service-playbook`), and the homepage's only featured-work section was a single hero card for that same repo. A site that's "about" one person's one side project, in a loop, reads as low-value even when individual posts are well-written.
2. **Several posts read as internal changelog entries wearing a blog-post format** — citing specific PR numbers (`PR #307`), exact internal counts (`Nineteen Dependabot PRs`), raw commit hashes in a table, or repeated "this repo" framing that only makes sense to someone already following the project. A reader with zero context on the project got nothing out of them.

### Rules going forward

- **New posts must stand alone.** A reader who has never heard of `backend-service-playbook`, `k8s-playbook`, or any other project mentioned here should still get a complete, useful idea out of the post. If a post's value depends on already knowing the project's internal history, it needs a different framing — pull out the generalizable technical lesson, not the project recap.
- **No PR/issue numbers, commit hashes, or internal round/session counts in post body text.** These are exactly the "internal changelog" markers that triggered the original flag. Cite files/docs by path or link instead, not by commit.
- **Keep the "what I maintain" surface genuinely plural.** The homepage's side-projects list (`src/data/sideProjects.ts`) should keep showing multiple, genuinely different projects at comparable weight — don't let it collapse back into one dominant project with the others as an afterthought. When adding a new project's posts, prefer registering it there too rather than only cross-linking existing projects.
- **Don't fabricate or backdate the `date` field on a post to fake a spread-out publish history.** AdSense's crawler doesn't read git history, and its own re-crawl interval is almost certainly longer than any day-level spacing you could stage anyway — so precise publish-cadence engineering (cron-scheduled staggered commits, etc.) has no verified benefit and isn't worth building. Use the real date. If you're about to publish many posts in one sitting, that's fine — just don't lie about when they went up.
- **Ad placement stays minimal.** One `AdUnit` per post, after the body, never above the fold. Don't add more units or move them earlier without a specific reason.
- **Quoting external sources** (books, docs, other people's writing): short, attributed excerpts only, with a proper bibliographic citation — never link to an unauthorized/pirated copy of copyrighted material, even one used for research.

### A structural trap to watch for

`react-router.config.ts`'s `prerender` array and `scripts/postbuild.ts`'s `staticEntries` list in `generateSitemap()` are both **hand-maintained** lists of static routes (`/`, `/posts`, `/side-projects`, `/privacy-policy`, etc.). Individual blog posts are generated dynamically from `src/data/posts.ts` in both places, so those are safe. But a new **static page** (a new top-level route that isn't a post) needs a manual entry in *both* files, or it silently 404s when deployed / silently never gets into the sitemap. This has already been missed twice in one session — always grep both files when adding a new route.

## Verifying a change before committing

- `npx tsc --noEmit -p tsconfig.app.json` — typecheck
- `npm run build` — full build; confirms prerendering succeeds for every route and catches missing-route mistakes above
- `npx oxlint --config oxlint.json .` (or scoped to changed files) — lint
- `rm -rf .react-router build dist` — clean build artifacts before committing; they're gitignored but a stray local build shouldn't linger
