export const PLAYER_SPEED = 220;

export const PLAYER_ORIGIN: [number, number] = [0.5, 0.88];

export const PLAYER_BODY = { width: 30, height: 18 };

/** Character frame edge in px; must match `frame` for characters/* in tools/art-codegen/assets_config.json. */
export const CHARACTER_FRAME_SIZE = 160;

/**
 * Visible figure height (feet to top of head) inside a character frame, measured from the
 * art. Frames carry transparent headroom, so texture bounds cannot be used to place things
 * above a character's head. Bounded by the frame above the feet line (see constants.test.ts).
 */
export const CHARACTER_FIGURE_HEIGHT = 100;

export const PALETTE = {
  inkBlack: '#2A2521',
  paperCream: '#D8C5A4',
  lightBeige: '#CDBA97',
  warmGray: '#A89B87',
  darkBrown: '#3E342B',
  mutedGreen: '#737660',
} as const;

export const INTERACTION_RED = '#A4412D';

export const SCENE_FADE_MS = 250;

/** Font stack of room labels; mirrors the `--lexicon-font-body` token of `@lexicon/ui`. */
export const LABEL_FONT_FAMILY = '"IBM Plex Mono", ui-monospace, monospace';
