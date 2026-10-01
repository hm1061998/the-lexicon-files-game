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
      zoom: 1.2,
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
      zoom: 1.1,
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
      { width: 1792, height: 896 },
    );

    expect(config.zoom).toBeCloseTo(1080 / 896 + 0.005);
  });
});
