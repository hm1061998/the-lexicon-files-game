# Phase 7 Audio / Listening — Verification

Date: 2026-09-29 (Asia/Saigon)
Status: complete; implementation, automated gates, and user audio audition verified.

## Delivered

- Added Leo's 20:29 phone recording as audio evidence and a content-defined listening task in Case #001; the evidence count remains five and the new hotspot is in Main Office.
- Added pure game-core answer resolution. Incorrect answers leave case state unchanged; the authored correct effect sets the completion flag and unlocks `leo_outside_at_2029`.
- Added a user-initiated Howler controller and React hook with loading, play, pause, replay, recoverable errors, and cleanup on close. The E2E flow confirmed playback events in the browser.
- Added Beginner transcript/translation, Learning keyword and opt-in transcript, and Immersion audio-only support. Added local assistance/listening counters and aggregate time-to-fact, with schema V1 profile normalization.
- Added E2E coverage for error/retry/close cleanup, wrong and correct answers, all three modes, IndexedDB persistence after reload, and one canvas.

## Recording provenance

- File: `apps/game-web/public/audio/case-001/leo-phone-recording.wav`
- Dialogue: `Hi, I'm outside the meeting room. I'll call you back in a few minutes.`
- WAV PCM signed 16-bit little-endian; mono, 24,000 Hz; 100,800 frames; 4.2 seconds; 201,644 bytes.
- SHA-256: `f0105db5ffe99dee0deceb24b1aaa25fe543e47b7a078eb8ceadd615719bbd98`
- Kokoro model revision `f3ff3571791e39611d31c381e3a41a3af07b4987`; pinned model weight SHA-256 `496dba118d1a58f5f3db2efc88dbdc216e0483fc89fe6e47ee1f2c53f18ad1e4`.
- Voice `af_heart.pt`, pinned revision `8542409da2986c0ab5d41b3cf0411f7a58caab38`; SHA-256 `0ab5709b8ffab19bfd849cd11d98f75b60af7733253ad0d67b12382a102cb4ff`.
- Upstream repository license metadata: Apache-2.0. The upstream voice documentation does not provide separate voice-specific recording/performer terms or a dataset-to-voice mapping. This limitation is recorded in the adjacent `.provenance.json`; no separate upstream output license is asserted.
- No model weights, Python packages, generation scripts, or TTS runtime were added to the app. Production build contains only the 201,644-byte WAV asset.

## Verification results

| Command | Result |
| --- | --- |
| `npm run lint` | PASS — all 7 Nx projects |
| `npm run test -- --skip-nx-cache` | PASS — all 7 Nx project targets; `@lexicon/game-web` 27 files / 148 tests and `@lexicon/game-content` 10 files / 72 tests passed. |
| `npm run build` | PASS — 141 modules; Vite warns that the JS chunk is above 500 kB (1,809.14 kB, 437.53 kB gzip). |
| `npm run typecheck` | PASS |
| `npm run format:check` | PASS |
| `npm run test:e2e` | PASS — 35 browser tests, 1 worker |
| `npm run memory:check` | PASS — phase-7 active plan recognized; rerun on the final memory handoff commit. |
| `git diff --check` | PASS |

No backend checks were run because `apps/api` was not changed. No dependency was added.

## Human audio audition

Automated browser playback reached the `ended` state and retry worked after a controlled load failure. On 2026-09-29, the user confirmed they listened to the recording and that it tested OK. No pronunciation, clarity, or unwanted-audio issue was reported.

## Integration status

Task 1–4 implementation commits are on local `dev`: `7125f05`, `7a40426`, `7586275`, `06e8b60`. Task 5 verification and plan update are committed locally; `MEMORY.md` is the next handoff commit. The phase is complete after the user audition; implementation remains local and has not been pushed.
