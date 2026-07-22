import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

import type { PostMeta } from '../src/data/posts.ts';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

const extraBold = readFileSync(resolve(SCRIPT_DIR, 'assets/Manrope-ExtraBold.ttf'));
const semiBold = readFileSync(resolve(SCRIPT_DIR, 'assets/Manrope-SemiBold.ttf'));

const WIDTH = 1200;
const HEIGHT = 630;

const INK = '#f1f4ef';
const MUTED = '#a0af99';
const LINE = '#28402a';
const PAPER_DARK = '#101510';
const LIME = '#d5fa52';

function titleFontSize(title: string): number {
  if (title.length > 55) return 50;
  if (title.length > 35) return 58;
  return 68;
}

export async function renderOgImage(post: PostMeta): Promise<Buffer> {
  const kicker = post.tags.join(' · ').toUpperCase();

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
        fontFamily: 'Manrope',
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
                    fontSize: `${titleFontSize(post.title)}px`,
                    fontWeight: 800,
                    color: INK,
                    lineHeight: 1.2,
                    maxWidth: '1020px',
                  },
                  children: post.title,
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
    ],
  });

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } });
  return Buffer.from(resvg.render().asPng());
}
