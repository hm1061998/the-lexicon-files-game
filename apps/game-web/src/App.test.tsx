import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renders without throwing', () => {
    expect(renderToString(<App />)).toContain('<');
  });
});
