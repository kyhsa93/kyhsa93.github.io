import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

import type { PostMeta } from '../src/data/posts.ts';

// scripts/ is type-checked under tsconfig.node.json (no jsx, strict Node ESM
// resolution) — can't import src/lib/locale.tsx (a .tsx file) from here, so
// this trivial alias is duplicated rather than shared.
type Locale = 'en' | 'ko';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

const extraBold = readFileSync(resolve(SCRIPT_DIR, 'assets/Manrope-ExtraBold.ttf'));
const semiBold = readFileSync(resolve(SCRIPT_DIR, 'assets/Manrope-SemiBold.ttf'));
// Manrope has no Hangul glyphs, so Korean titles need a font that does.
// Registered alongside Manrope in the same weights (700/800) below — satori
// walks the fontFamily list per character and falls back to whichever font
// actually covers that glyph, so English and Korean can mix in one string.
const pretendardBold = readFileSync(resolve(SCRIPT_DIR, 'assets/Pretendard-Bold.otf'));
const pretendardExtraBold = readFileSync(resolve(SCRIPT_DIR, 'assets/Pretendard-ExtraBold.otf'));

const WIDTH = 1200;
const HEIGHT = 630;

const INK = '#f1f4ef';
const MUTED = '#a0af99';
const LINE = '#28402a';
const PAPER_DARK = '#101510';
const LIME = '#d5fa52';

// Hangul syllable blocks render much wider per character than Latin letters
// at the same font-size, so a Korean title needs a smaller size at roughly
// half the character count to fit the same 1020px/~3-line budget.
function titleFontSize(title: string, locale: Locale): number {
  const length = title.length;
  if (locale === 'ko') {
    if (length > 28) return 50;
    if (length > 18) return 58;
    return 68;
  }
  if (length > 55) return 50;
  if (length > 35) return 58;
  return 68;
}

export async function renderOgImage(post: PostMeta, locale: Locale): Promise<Buffer> {
  const kicker = post.tags.join(' · ').toUpperCase();
  const title = post.title[locale];

  const markup = {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px',
        backgroundColor: PAPER_DARK,
        fontFamily: 'Manrope, Pretendard',
      },
      children: [
        {
          type: 'div',
          props: {
            style: { display: 'flex', alignItems: 'center', gap: '14px' },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: LIME,
                    color: PAPER_DARK,
                    fontSize: '26px',
                    fontWeight: 800,
                  },
                  children: 'Y',
                },
              },
              {
                type: 'div',
                props: {
                  style: { fontSize: '30px', fontWeight: 700, color: INK },
                  children: 'younghoon',
                },
              },
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column', gap: '20px' },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: '22px',
                    fontWeight: 700,
                    color: LIME,
                    letterSpacing: '0.08em',
                  },
                  children: kicker,
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: `${titleFontSize(title, locale)}px`,
                    fontWeight: 800,
                    color: INK,
                    lineHeight: 1.2,
                    maxWidth: '1020px',
                  },
                  children: title,
                },
              },
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '32px',
              borderTop: `1px solid ${LINE}`,
              fontSize: '22px',
              color: MUTED,
            },
            children: [
              { type: 'div', props: { children: 'kyhsa93.github.io' } },
              { type: 'div', props: { children: 'Backend Service Playbook' } },
            ],
          },
        },
      ],
    },
  };

  const svg = await satori(markup as Parameters<typeof satori>[0], {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      { name: 'Manrope', data: extraBold, weight: 800, style: 'normal' },
      { name: 'Manrope', data: semiBold, weight: 700, style: 'normal' },
      { name: 'Pretendard', data: pretendardExtraBold, weight: 800, style: 'normal' },
      { name: 'Pretendard', data: pretendardBold, weight: 700, style: 'normal' },
    ],
  });

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } });
  return Buffer.from(resvg.render().asPng());
}
