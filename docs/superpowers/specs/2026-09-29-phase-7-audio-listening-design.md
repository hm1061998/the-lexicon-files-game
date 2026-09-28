# Phase 7 Audio / Listening — Design

## Goal

Deliver the first playable listening investigation in Case #001: the player finds and listens to the phone recording associated with Leo, answers the authored question about his location, and the correct interpretation updates case state. Playback is replayable and supports the listening assistance levels already defined by the learning design. The feature preserves investigation-first pacing and does not grade minor English mistakes.

The user chose inline execution and approved generating the recording with Kokoro. Phase 7 is an architectural change because it introduces authored audio content, playback lifecycle, listening-task state and a new path into case facts.

## Source of truth and constraints

- Roadmap §26: Howler playback, play/pause/replay, subtitle mode, phone-recording evidence; acceptance requires replay, task answer and case-state update.
- Learning-system design §§16–17, 31–32: listening levels are audio+subtitles, audio+keyword hints, and audio only; replay is unlimited; track replay/subtitle/transcript/answer behavior locally; never capture microphone in MVP.
- Case #001 §15 Evidence 5: Archive/audio device; exact recording text “Hi, I'm outside the meeting room. I'll call you back in a few minutes.”; timestamp 20:29; supports `Leo was outside at 20:29`; question “Where was Leo?” with correct answer “Outside the meeting room”.
- Existing case total remains five evidence items; the phone recording is the authored audio evidence for the existing case contract, not a sixth case item. Do not alter any other case truth or fabricate additional audio clues.
- Use Howler already declared by `apps/game-web`; do not add dependencies or call the API/backend from gameplay. Core learning/game logic remains framework-independent. React and Phaser communicate through the typed event bus/store boundary; scenes clean up listeners.
- Preserve local-first saves and existing schema unless implementation proves a migration is unavoidable. Do not persist transient playback position or audio buffers.
- Product guardrails: no forced quiz/reward flow, no lives/timer/streak punishment, no “WRONG!” presentation, unlimited replay, hints clarify language rather than reveal the answer, and no microphone access.

## Approaches considered

1. **Generate a static authored clip locally with Kokoro (recommended).** No runtime service, network request, or per-play charge; deterministic asset is shipped with the game. Keep the model outside the shipped application. Before shipping the selected preset voice, record its exact model/voice and source/license evidence in asset metadata; the Apache-2.0 model license does not by itself settle every voice preset's provenance.
2. **Generate through a hosted TTS API.** Convenient and may have free quota, but requires account/billing configuration and adds external service terms and a supply dependency for producing content.
3. **Use a human recording or download an existing recording.** Potentially more natural, but requires performer/recording rights or a verified asset license and may require attribution. Avoid a downloaded dialogue clip with unclear consent or rights.

Approved direction: approach 1. Free online recordings are not required for Leo's authored line. Optional ambient/SFX downloads are outside this phase; if added later, each must be chosen under a compatible license and have a source/attribution record.

## Runtime design

### Audio asset and provenance

Create one static recording of the exact Case #001 line in a clear, natural English voice. Store the encoded asset under the game's existing public-asset convention and reference it from validated case content rather than hardcoding a case-specific URL in React or Phaser. The final format/sample rate/bitrate will follow the existing build and browser support; prefer compressed audio suitable for web delivery while retaining a lossless source for regeneration if practical.

Commit a small provenance record beside the authored asset containing source text, model and pinned revision, voice preset, generation date, output format, model/code license links, voice/data license review and any required attribution. Do not commit model weights, secrets, user recordings or generated files outside this case asset. If the chosen preset cannot be cleared for redistribution from its published licensing/provenance information, use another verified preset or record that the clip is prototype-only; do not silently treat Apache model weights as blanket voice clearance.

### Playback lifecycle

Wrap Howler in `apps/game-web/src/audio/` behind a small typed controller/hook usable by the React evidence surface. Required states: idle, loading, playing, paused, ended, and recoverable load/playback error. Controls: play, pause, replay from start; replay remains available without limits. Stop and unload on evidence close/unmount, and guard async completion callbacks against stale/closed views. Respect browser user-gesture audio policy. Provide a readable error and retry path if the asset fails; do not leave a blank modal. Playback telemetry is local to the session/profile policy and must not store audio bytes or listening transcript in a separate duplicate state.

### Evidence and listening task

Expose the phone recording through the existing case evidence interaction. The evidence view shows its authored name, timestamp, recording controls, and an accessible task after the player has had an opportunity to listen. Audio controls are real user-operated controls; do not autoplay on evidence discovery. Subtitle assistance modes:

- **Beginner / Level 1:** audio plus the authored English transcript (and Vietnamese translation only when the existing Beginner mode permits it).
- **Learning / Level 2:** audio plus authored keyword hints, with transcript hidden until explicitly requested; opening a transcript is tracked and counts as assistance.
- **Immersion / Level 3:** audio only; do not reveal transcript or translation through the listening surface.

Mode must reuse the existing persisted translation-mode preference rather than introduce a competing global difficulty setting. Mode changes during playback must not reset or corrupt case progress. All content, question text, options, hints, expected answer and state effects are data-driven and validated under `packages/game-content`; UI strings belong in the existing localized UI content.

For “Where was Leo?”, the options are the exact alternatives specified in the Case #001 contract: inside the meeting room, outside the meeting room, or at home. A correct answer applies authored case effects to discover the phone-recording evidence/fact and marks the corresponding listening task complete. The task must not disclose the right option as a hint. An incorrect choice receives the established gentle feedback (“This interpretation doesn't match the evidence.”) and a useful listening/keyword cue; it does not fail the case, erase progress, or set a punitive flag. Replay is always available before and after answering. Whether answer options remain changeable after a correct answer is deferred to implementation detail, but repeated submissions must be idempotent and must never duplicate evidence/facts.

### State boundaries

- Authored prompt/options/hints/effects/audio reference live in `packages/game-content` and are checked by Zod plus cross-reference validation.
- Correct task completion changes authoritative case state using the existing discriminated `Condition`/`Effect` and game-core transition APIs; no `eval`, React-owned copy of case facts, or new singleton.
- Playback position/state stays ephemeral in the audio controller. The case store holds only the stable answer/effect outcome needed for persistence.
- Any telemetry required by current learning profile is counters only (replay/subtitle/transcript/use/answer); do not add microphone capture or raw audio retention.
- Howler callbacks, event-bus listeners and task subscriptions are cleaned up when the modal closes or owning component is destroyed.

## User experience and accessibility

The recording remains evidence in an investigation surface, not a standalone quiz screen. Keep the user in control of when to play, pause, replay, reveal transcript (where mode permits), and submit an interpretation. Buttons have clear accessible names and visible focus; task choices work with keyboard; errors/status are announced without stealing focus. Avoid red except on investigation accents allowed by the visual rules. Do not depend on sound alone to communicate player-control state or errors.

## Scope boundaries

Included: Howler-backed playback wrapper, the Case #001 phone-recording asset and provenance, validated recording/listening content, subtitle/keyword support for the three existing modes, answer feedback/effects, focused unit/content/UI tests and an E2E listening path.

Excluded: general-purpose soundscape/music pipeline, downloaded ambience/SFX, microphone/speech recognition, cloud TTS at runtime, voice cloning, dynamic TTS, broad audio settings/mixer, backend sync, new learning assessment/scoring, timeline/contradiction work from Phase 8, unrelated case-content expansion, or changing Case #001 truth.

## Failure behavior

- Invalid/missing audio metadata/content fails content validation or shows a developer-readable case-content error through the existing loading/error boundary.
- Network-free bundled asset load/play failure displays a recoverable message and retry; the rest of the evidence and case stay usable.
- A stale audio callback after close/reopen has no effect on the next evidence session.
- Invalid or duplicate answer/effect is rejected or idempotent by game-core; it cannot corrupt persisted state.
- Playback is blocked until an explicit user gesture where required by the browser.

## Verification and acceptance

- Content schema rejects missing audio source/text/options/effects, unknown evidence/fact/objective references, invalid answer IDs and malformed hints; registered content validation/build catches cross-references.
- Audio wrapper tests cover play/pause/replay, load/play errors, callbacks after dispose, and cleanup without depending on real sound output.
- Core tests prove correct answer unlocks only the authored fact/evidence/objective effects; wrong answer does not mutate case truth/progress; repeated correct submission is idempotent.
- UI tests prove each existing mode's transcript/hint visibility, explicit transcript reveal rules, accessible playback/task controls, gentle feedback, and replay after answer.
- E2E proves discovery → manual play/replay → answer → case fact/state survives reload with no console errors and no second canvas.
- Required repo gates: `npm run lint`, `npm run test`, `npm run build`, plus existing typecheck, format, E2E, memory and diff checks. Backend checks are unnecessary unless `apps/api` changes.
- Audio QA: listen to the final generated asset and verify exact wording, pronunciation, intelligibility, duration/size and the 20:29 timestamp shown in the evidence surface.

## Open implementation choices

- Select and pin one Kokoro English voice preset only after checking its published voice/data provenance. Prefer a clear American English delivery consistent with Case #001; the exact preset is an asset-production decision, not a runtime preference.
- Choose compressed output encoding and final playback component details after measuring bundle/asset size and matching current project conventions. Keep these choices within the above contracts.
