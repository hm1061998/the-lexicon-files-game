# Phase 8 — Timeline and Contradiction

**Status:** Draft for user review  
**Date:** 2026-09-29  
**Roadmap:** `docs/04_CODEX_IMPLEMENTATION_ROADMAP.md` §27  
**Product sources:** `docs/01_GAME_DESIGN_DOCUMENT.md` §§15–16, 20; `docs/03_CASE_001_VERTICAL_SLICE_SPEC.md` §§4–9  
**Approved direction:** data-driven timeline and contradiction flow, with a minimal Archive scene and a route from Main Office so the Security Access Log remains at its authored location.

## Goal

Let the player reconstruct the time-ordered events of Case #001 from discovered facts, then identify the contradiction between David's statement and the Security Access Log. The interface remains part of the investigator's notebook and case world; it does not score the player or reveal case truth before the evidence supports it.

## Scope

- Add validated, data-driven timeline and contradiction definitions to the case content contract.
- Add pure `game-core` transitions for placing a discovered event in a time slot and checking a selected pair of discovered facts.
- Add a Timeline tab and a contradiction interaction within the existing notebook/evidence flow.
- Add the Security Access Log as evidence in a minimal Archive scene, reached from the existing Main Office hallway door and with a return route.
- Preserve the authored Case #001 truth, timeline, dialogue, evidence total (`5`), local-first play, and all existing saves.
- Persist the active scene ID on navigation and restore the saved scene at its authored spawn point. Player coordinates and a full world-save redesign remain outside this phase.

## Not in scope

- Accusation, case closure, report summary, or wrong-suspect handling (Phase 9).
- An interactive evidence graph, free-form links, drag-and-drop timeline, or arbitrary time entry. The MVP uses click-to-select and authored time slots, as allowed by the product design.
- New scenes beyond the minimal Archive / Security Corner, a full environment art pass, or new NPCs/dialogue.
- Backend, cloud saves, AI, runtime-generated content, or changes to the learning system.
- The remaining Case #001 evidence that is not required for the Phase 8 timeline or its contradiction.

## Case #001 content contract

Keep the authored timeline in `docs/03_CASE_001_VERTICAL_SLICE_SPEC.md` §4. The Timeline tab lists only events available from the case briefing or facts the player has discovered. It supports these times, in order:

| Time | Event | Source / availability |
|---|---|---|
| 20:00 | The meeting begins | Existing `meeting_started`, from Meeting Minutes |
| 20:18 | Anna exits the meeting room | Security Access Log |
| 20:27 | Leo exits the meeting room | Security Access Log |
| 20:29 | Leo is outside the meeting room | Existing `leo_outside_at_2029`, after the listening task is solved |
| 20:32 | David enters the meeting room | Security Access Log |
| 20:36 | David exits the meeting room | Security Access Log |
| 20:40 | Leo enters the meeting room | Security Access Log |
| 20:45 | The meeting ends | Meeting Minutes |
| 21:05 | The report is reported missing | Case briefing; known at case start, no new collectible evidence |

The terminal evidence is `security_access_log` and contains the authored entries verbatim: Anna Reed EXIT at 20:18, Leo Tran EXIT at 20:27, David Cole ENTRY at 20:32, David Cole EXIT at 20:36, and Leo Tran ENTRY at 20:40. It is discoverable by interacting with the security terminal in Archive. `evidenceTotal` remains five.

Complete the authored objective “Check the security records” when the access log is discovered. Complete “Compare David's statement with the evidence” only after the correct contradiction is identified. Do not implement the subsequent “Submit your conclusion” objective; that belongs to Phase 9.

The existing fact `david_statement_no_entry_after_20_00` remains sourced from David's dialogue. Add the facts required to expose each security-log event and the 20:45 meeting end, with cross-references to their authored evidence. The 21:05 event is authored as a case-briefing timeline event, not fabricated as evidence or as a collectible fact. Reuse `leo_outside_at_2029` and `meeting_started` rather than duplicate their facts.

Define one contradiction, for the pair `david_statement_no_entry_after_20_00` and `david_entry_20_32`. Its authored explanation states that the security log records David entering at 20:32, despite his statement that he did not enter after 20:00. On success, set the existing `david_contradiction_found` flag so the already-authored conditional David dialogue unlocks. Do not change the confession or suspect truth.

## Timeline behavior

- Each authored event has a stable ID, display text, time-slot reference, location, people, source, confidence text, availability facts (or case-start availability), and a persistent placed flag.
- Time slots and valid event/slot matches are authored in case content. UI copy does not expose a target time before the player chooses a slot.
- Selecting an available event and a time slot calls a pure core transition. A correct placement persists its flag. An incorrect placement leaves game state unchanged, allows retry, and shows `Something in the timeline is inconsistent.` with a non-revealing evidence hint.
- Previously placed events remain placed after closing/reopening the notebook and after reload. Newly discovered events appear without resetting earlier placements.
- The 21:05 case-briefing event is available from case start. All evidence-backed events require their source fact to be discovered before they appear.

## Contradiction behavior

- The notebook offers only facts present in `discoveredFactIds`; UI cannot submit a hidden fact. Core validates task IDs and fact IDs independently of the UI.
- Selecting the authored conflicting pair records the contradiction once, sets `david_contradiction_found=true`, and completes the Case #001 objective “Compare David's statement with the evidence.”
- A non-matching pair leaves case state unchanged, shows `This interpretation doesn't match the evidence.`, and offers a clue that points back to the relevant sources without naming the answer.
- Repeating a successful submission is idempotent. It does not duplicate events, facts, or objective progress. Wrong attempts never reset progress or incur a cost.
- Contradiction visibility and David's conditional dialogue continue to depend on the existing flag and on the player having discovered both facts.

## Archive scene and navigation

- Keep `main_office` as the fresh-case start. Add one `archive` scene with clearly labeled placeholder floor/wall assets, a security terminal interactable, and a doorway back to Main Office.
- Convert the existing Main Office hallway door into the route to Archive. The terminal adds `security_access_log`; the return route restores the player at a safe Main Office spawn.
- Scene transition destinations and named entry spawn points are validated against registered case scenes. Invalid scene or spawn references fail content validation/build with a readable path.
- Navigation is driven through typed app/world contracts. Zustand owns the active scene ID used by the UI and save record; Phaser renders that scene and retains live player coordinates. React does not call Phaser internals.
- Upgrade the local save record to persist the active scene ID. Migrate schema V1/V2 saves to the new schema without losing case state; legacy saves start in `main_office`. A save restored in Archive starts at Archive's authored entry spawn. Keep the IndexedDB database version unchanged unless the existing repository's migration contract requires otherwise.
- Scene changes autosave. Existing recovery behavior remains: preserve invalid records as backups and never silently replace them.

## Architecture and UI

- `shared-types` defines timeline and contradiction content/result types; `game-content` Zod schema, loader, cross-reference validation, and build validation enforce unique IDs, known facts/evidence/objectives/scenes/spawns, valid time-slot references, and a two-fact contradiction pair.
- `game-core` owns pure, deterministic timeline placement and contradiction validation. It has no React, Phaser, Zustand, DOM, or persistence imports.
- `gameStore` wraps core results. It updates case state only after successful transitions. Typed events report scene transition requests/changes across the Phaser–React boundary.
- Notebook UI adds a Timeline tab. Use a paper dossier layout with a clear chronological spine, authored event cards, source/confidence labels, and keyboard-operable time-slot selection. The contradiction interaction presents discovered facts as selectable cards. Focus remains visible; controls have labels and do not rely on color alone.
- Use existing typography and muted sepia palette. Investigation red (`#A4412D` / `#743026`) is reserved for clues, selected timeline entries, and confirmed contradictions. The Archive remains visually sparse and uses named placeholders; no temporary unlabelled production art.
- Localized interface text remains in `packages/game-content/ui/vi.json` and its schema. Case evidence/fact copy remains in case content, not React/Phaser source.

## Verification and acceptance

- Unit tests cover correct/incorrect/unknown/repeated timeline placements; event availability; correct/incorrect/unknown/repeated contradiction submissions; and the exact David contradiction flag and objective result.
- Content tests reject duplicate IDs, unknown fact/evidence/objective/scene/spawn references, malformed time slots, invalid contradiction pairs, and missing required content. Registered Case #001 loads with `evidenceTotal: 5`.
- Persistence tests migrate existing save versions, round-trip active scene and case flags, preserve backups on invalid data, and restore the correct authored spawn for a saved scene.
- UI tests cover discovered-only events/facts, retry feedback, completed states, keyboard operation, focus, and non-color-only status.
- E2E covers: Main Office → Archive → collect Security Access Log → return; evidence and fact persistence; place timeline events (including retry after a wrong slot); discover David's statement and the access-log fact; identify the contradiction; observe the existing David challenge become available; reload and retain scene/case progress; one Phaser canvas and no console errors.
- Run `npm run lint`, `npm run test`, `npm run build`, `npm run typecheck`, `npm run format:check`, `npm run test:e2e`, `npm run memory:check`, and `git diff --check`. No .NET gates because the API is unchanged.

## Out-of-scope follow-up

Phase 9 owns accusation and case closure. A later persistence phase may add exact player coordinates; Phase 8 only restores the saved scene at its named entry spawn.
