# Phase 11E feedback polish — review notes

Review date: 2026-10-01. The independent reviewer returned findings, then stopped before a final summary because its usage limit was reached. This file records those findings and the verification after fixes; it does not claim an independent clean verdict.

## Findings resolved

1. **Voice replay could overlap or remain unretryable after load failure.** Replay now stops/unloads the previous voice Howl and creates a fresh instance. `presentationAudio.test.ts` covers active replay and a retry after load error.
2. **Door presentation cue read the scene after the engine had already changed it; transition did not stop voice.** The presentation bridge now listens to `scene:transitionRequested`; `connectPresentationAudio.test.ts` connects the engine first and checks Archive door cue and voice stop.
3. **Interaction prompt could overlap the target/player and remain stale while input was locked.** Anchor events include world target/player avoid rectangles; React combines them with HUD rectangles. Scene clears an unavailable active target even when normal nearby polling is blocked by modal input lock. Eligibility unit tests and E2E cover collection and overlapping available targets.
4. **Archive retained its former west-side opening after its paired exit moved east.** The obsolete opening was removed and geometry tests assert west-wall closure and the single east-side return opening.
5. **Desktop map launcher overlapped case progress.** The desktop launcher is placed below case progress; `hud.spec.ts` asserts their rectangles do not overlap.
6. **Compact HUD controls were below the touch target and text size.** Collapse controls now have a 44px minimum and compact objective/prompt text is 14px.
7. **Compact layouts still used the desktop interaction-prompt zone.** Bubble anchoring now requires at least 960×640; compact layouts use the fixed bottom safe zone. Viewport E2E covers 760×600 and desktop sizes.
8. **Long load/recovery error messages could be clipped by page overflow rules.** Error and recovery screens now own an internal scroll region. Viewport checks pass.

## Verification after findings

- Full Playwright: 108/108 passed.
- Feedback + HUD + scene-layout browser set: 58/58 passed; follow-up evidence + HUD set: 28/28 passed.
- Root lint/test/build/typecheck/format, Python art/audio tests, and WAV validator passed. Details and command outputs are in `docs/ai/2026-10-01-phase-11e-feedback-polish-verification.md`.

No unresolved code finding from the returned partial review is known. Human visual/audio audition remains open; the later camera/music/nameplate/dialogue-notebook redesign feedback is out of this approved plan and is specified separately.
