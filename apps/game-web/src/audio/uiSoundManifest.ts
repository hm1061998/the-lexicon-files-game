import type { UiSoundId } from './uiSound';

/**
 * UI sound files. Empty until the CC0 set is imported (tools/audio-codegen/import_ui_sounds.py);
 * a missing id simply plays nothing.
 */
export const UI_SOUND_FILES: Partial<Record<UiSoundId, string>> = {};
