export type ViewportSize = { width: number; height: number };

export type CameraFollowConfig = {
  zoom: number;
  lerpX: number;
  lerpY: number;
  deadZoneWidth: number;
  deadZoneHeight: number;
};

const COMPACT_WIDTH = 960;
const COMPACT_HEIGHT = 640;

/** Resolve view-only camera settings from the rendered canvas size. */
export function cameraFollowConfig(
  viewport: ViewportSize,
  cameraSize: ViewportSize,
  sceneBounds: ViewportSize,
): CameraFollowConfig {
  const compact = viewport.width < COMPACT_WIDTH || viewport.height < COMPACT_HEIGHT;
  const preferredZoom = compact ? 1.6 : 1.8;
  const minimumFitZoom = Math.max(
    cameraSize.width / sceneBounds.width,
    cameraSize.height / sceneBounds.height,
  );
  return {
    // Phaser centers a world smaller than its zoomed view, exposing a thin edge. Keep a
    // small margin above the fit threshold to absorb Phaser's integer worldView rounding.
    zoom: Math.max(preferredZoom, minimumFitZoom + 0.005),
    lerpX: 0.08,
    lerpY: 0.08,
    deadZoneWidth: Math.round(viewport.width * 0.1),
    deadZoneHeight: Math.round(viewport.height * 0.1),
  };
}

