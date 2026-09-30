import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CHARACTER_FIGURE_HEIGHT,
  CHARACTER_FRAME_SIZE,
  LABEL_FONT_FAMILY,
  PLAYER_ORIGIN,
} from './constants';

type ArtEntry = { dest: string; frame: number | null; figureHeight?: number };

const config = JSON.parse(
  readFileSync(
    new URL('../../../../tools/art-codegen/assets_config.json', import.meta.url),
    'utf8',
  ),
) as ArtEntry[];
const characters = config.filter(({ dest }) => dest.startsWith('characters/'));

describe('character figure constants', () => {
  it('tracks the character frame size used by the art pipeline', () => {
    expect(characters.length).toBeGreaterThan(0);
    for (const entry of characters) expect(entry.frame, entry.dest).toBe(CHARACTER_FRAME_SIZE);
  });

  it('matches the figure height declared by the art pipeline config', () => {
    for (const entry of characters) {
      expect(entry.figureHeight, entry.dest).toBe(CHARACTER_FIGURE_HEIGHT);
    }
  });

  it('keeps the visible figure inside the frame above the feet line', () => {
    expect(CHARACTER_FIGURE_HEIGHT).toBeGreaterThan(0);
    expect(CHARACTER_FIGURE_HEIGHT).toBeLessThanOrEqual(CHARACTER_FRAME_SIZE * PLAYER_ORIGIN[1]);
  });
});

describe('room label font', () => {
  it('mirrors the --lexicon-font-body token of the UI theme', () => {
    const css = readFileSync(
      new URL('../../../../packages/ui/src/theme/palette.css', import.meta.url),
      'utf8',
    );
    const token = /--lexicon-font-body:\s*([^;]+);/.exec(css)?.[1]?.trim();
    expect(token).toBeDefined();
    expect(LABEL_FONT_FAMILY).toBe(token);
  });
});
