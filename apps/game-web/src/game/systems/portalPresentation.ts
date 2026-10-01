import type Phaser from 'phaser';
import type { ScreenPoint } from './isometricProjection';
/** Low-opacity gold rings and sparse rising motes; static when motion is reduced. */
export function createPortalPresentation(
  scene: Phaser.Scene,
  position: ScreenPoint,
  reducedMotion: boolean,
): { setReducedMotion(value: boolean): void; destroy(): void } {
  const graphics = scene.add.graphics();
  graphics.setDepth(position.y + 0.001);
  const phase = { value: 0 };
  let tween: Phaser.Tweens.Tween | null = null;
  const draw = () => {
    graphics
      .clear()
      .lineStyle(1, 0xdac594, 0.45)
      .strokeEllipse(position.x, position.y - 3, 76, 38);
    if (reducedMotion) return;
    const angle = phase.value * Math.PI * 2;
    graphics.lineStyle(1, 0xdac594, 0.25).strokeEllipse(position.x, position.y - 14, 52, 26);
    graphics
      .fillStyle(0xdac594, 0.32)
      .fillCircle(position.x + Math.cos(angle) * 30, position.y - 3 + Math.sin(angle) * 15, 2);
    for (let i = 0; i < 3; i++) {
      const height = ((phase.value + i / 3) % 1) * 48;
      graphics
        .fillStyle(0xdac594, 0.18 * (1 - height / 48))
        .fillCircle(position.x + Math.sin(i * 2.1 + angle) * 8, position.y - 10 - height, 1.5);
    }
  };
  const sync = () => {
    tween?.stop();
    tween?.remove();
    tween = null;
    draw();
    if (!reducedMotion)
      tween = scene.tweens.add({
        targets: phase,
        value: 1,
        duration: 8000,
        repeat: -1,
        onUpdate: draw,
      });
  };
  sync();
  return {
    setReducedMotion(value) {
      if (value !== reducedMotion) {
        reducedMotion = value;
        sync();
      }
    },
    destroy() {
      tween?.stop();
      tween?.remove();
      tween = null;
      graphics.destroy();
    },
  };
}
