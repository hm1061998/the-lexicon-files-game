import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { App } from './App';

// Phaser requires a browser `window`; the real canvas is covered by e2e/boot.spec.ts.
vi.mock('./game/createGame', () => ({ createGame: vi.fn() }));

describe('App', () => {
  it('renders the game container without throwing', () => {
    expect(renderToString(<App />)).toContain('<div');
  });
});
