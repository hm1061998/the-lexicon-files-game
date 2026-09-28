import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ContentValidationError, loadSceneDefinition } from '@lexicon/game-content';
import { App } from './App';

// Phaser requires a browser `window`; the real canvas is covered by e2e tests.
vi.mock('./game/createGame', () => ({ createGame: vi.fn() }));

// Real loader by default; individual tests may override one call.
vi.mock('@lexicon/game-content', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@lexicon/game-content')>();
  return { ...actual, loadSceneDefinition: vi.fn(actual.loadSceneDefinition) };
});

describe('App', () => {
  it('renders the game container without throwing', () => {
    const html = renderToString(<App />);
    expect(html).toContain('<div');
    expect(html).not.toContain('role="alert"');
  });

  it('GameCanvas renders a readable error for invalid content', () => {
    vi.mocked(loadSceneDefinition).mockImplementationOnce(() => {
      throw new ContentValidationError('bad.json', ['spawn: Required']);
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const html = renderToString(<App />);
    errorSpy.mockRestore();
    expect(html).toContain('role="alert"');
    expect(html).toContain('spawn: Required');
  });
});
