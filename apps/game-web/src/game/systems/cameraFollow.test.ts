import { describe, expect, it } from 'vitest';
import { cameraFollowConfig } from './cameraFollow';

describe('camera follow config', () => {
  it('zooms closer on desktop and leaves a small player-centered dead zone', () => {
    expect(
      cameraFollowConfig(
        { width: 1280, height: 720 },
        { width: 1920, height: 1080 },
        {
          width: 1920,
          height: 1080,
        },
      ),
    ).toEqual({
      zoom: 1.8,
      lerpX: 0.08,
      lerpY: 0.08,
      deadZoneWidth: 128,
      deadZoneHeight: 72,
    });
  });

  it('reduces zoom slightly for compact viewports', () => {
    expect(
      cameraFollowConfig(
        { width: 760, height: 600 },
        { width: 1920, height: 1080 },
        {
          width: 1920,
          height: 1080,
        },
      ),
    ).toEqual({
      zoom: 1.6,
      lerpX: 0.08,
      lerpY: 0.08,
      deadZoneWidth: 76,
      deadZoneHeight: 60,
    });
  });

  it('raises the preferred zoom enough to fit a short projected world', () => {
    const config = cameraFollowConfig(
      { width: 1280, height: 720 },
      { width: 1920, height: 1080 },
      { width: 896, height: 448 },
    );

    expect(config.zoom).toBeCloseTo(1080 / 448 + 0.005);
  });
});

it.each([
  { width: 959, height: 720 },
  { width: 1280, height: 639 },
  { width: 960, height: 640 },
])('uses compact breakpoints %o', (viewport) => {
  expect(
    cameraFollowConfig(viewport, { width: 1920, height: 1080 }, { width: 1920, height: 1080 }).zoom,
  ).toBe(viewport.width < 960 || viewport.height < 640 ? 1.6 : 1.8);
});
