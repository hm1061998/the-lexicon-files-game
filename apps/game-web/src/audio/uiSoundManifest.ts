import type { UiSoundId } from './uiSound';

/**
 * UI sound files (Kenney, CC0; sources and hashes in `public/audio/ui/provenance.json`, imported by
 * `tools/audio-codegen/import_ui_sounds.py`). A missing id simply plays nothing; `tape-loop` has no
 * file yet, so the recorder runs without a tape sound.
 */
export const UI_SOUND_FILES: Partial<Record<UiSoundId, string>> = {
  press: '/audio/ui/press.ogg',
  'paper-open': '/audio/ui/paper-open.ogg',
  'paper-close': '/audio/ui/paper-close.ogg',
  pen: '/audio/ui/pen.ogg',
  stamp: '/audio/ui/stamp.ogg',
  tab: '/audio/ui/tab.ogg',
  'device-click': '/audio/ui/device-click.ogg',
};
