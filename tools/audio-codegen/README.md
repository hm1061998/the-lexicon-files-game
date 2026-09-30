# Case 001 audio generation

This development-only tool writes pre-recorded English WAV clips for the NPC dialogue nodes authored in `packages/game-content/cases/case-001/dialogues.json`. It also creates short original UI and movement cues. It does not run TTS or call a service at game runtime.

Create `.venv-audio-codegen` at the repository root, install this folder's `requirements.txt`, and run `generate_sfx.py` followed by `generate_dialogue.py`. The Kokoro model cache stays in the local Hugging Face cache and is never committed. Pin `KOKORO_MODEL_REVISION` to the resolved upstream revision before release. Voice IDs map Anna to `af_heart`, Leo to `am_michael`, and David to `am_fenrir`.

Run `python tools/audio-codegen/validate_assets.py` after generation. WAVs are mono PCM16 at 24 kHz; provenance binds each output hash to its exact authored text and speaker.
