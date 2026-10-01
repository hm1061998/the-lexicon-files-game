# Notebook People — verification

Trạng thái: complete. Source cuối đạt nhóm E2E29/29 và tất cả DoD; commit/push theo plan đã duyệt.

## Phạm vi và thay đổi

- Người dùng đã duyệt file plan thực tế ngày 2026-10-01 và yêu cầu triển khai Native inline trên dev.
- Shared-types/game-content: notebookStatements optional tham chiếu node; validator chấp nhận positive flags/all/any không rỗng với writer trong chính tree, loại completionFlag, kiểm tra node/speaker/duplicate và lỗi có path.
- Content Case001: metadata cho Anna/Leo/David; hai recording effects David riêng tại Continue, giữ q3_read và completion. Kiểm tra JSON normalized xác nhận text/audio/node.condition/completion không đổi.
- Game-web: selector thuần giữ node references và lịch sử conditional branch; People chỉ mount statement đã ghi nhận, tái dùng VocabularyText/context gốc và Settings mode. Không transcript/visitedNPC/save version/backend/dependency mới.
- UI: hồ sơ/tên/vai trò/status/lời khai từ content, tabs wrap, panel cuộn nội bộ. Focus trap scoped trong Notebook, bỏ disabled/hidden controls, initial Close, cleanup và restore về previous control/canvas container.

## File thay đổi

| Nhóm | Files |
| --- | --- |
| Contract | packages/shared-types/src/dialogue.ts, case.ts, index.ts |
| Metadata/schema | packages/game-content/src/schema/dialogue.ts, dialogue.test.ts, ui.ts, ui.test.ts |
| Validation | packages/game-content/src/validation/notebookStatements.ts, dialogueReferences.ts |
| Content | packages/game-content/cases/case-001/dialogues.json, ui/vi.json, src/index.test.ts |
| Selector/UI | apps/game-web/src/notebook/selectNotebookPeople.ts, selectNotebookPeople.test.ts, NotebookPeoplePanel.tsx, NotebookPeoplePanel.test.tsx, NotebookPanel.tsx, notebook.css |
| Browser | apps/game-web/e2e/notebook-people.spec.ts |
| Handoff | active spec/plan, docs/ai/MEMORY.md, report này, ảnh people-1280.png và people-760.png |

## Test thêm

- 19 content tests: metadata và source path, flags node/choice/foreign/completion/false/group/nested; authors/order/independent David flags; UI labels bắt buộc và không rỗng.
- 11 frontend tests: fresh/partial/complete/legacy/history/reference/immutability selector và render/status/translation/empty/parent integration.
- 5 browser tests: partial interview/reload/completion; realistic legacy save/replay/historical branches; encounterCount/contexts idempotence và click/Enter/Settings modes; full Tab/Shift+Tab/five tabs/Conclusion/inner scroll/restore tại1280×720 và760×600.

## TDD và lỗi đã xử lý

- Task1: RED12 failures vì schema strict không nhận metadata; GREEN179/179. Các invalid tests cần đúng path/index thay vì chỉ unrecognized key.
- Task2: RED2 assertions thiếu metadata/flags; GREEN181/181. Content diff chỉ metadata/hai setFlag mới.
- Task3: skeleton [] RED5 assertions; một fixture từng đoán condition là not, được sửa theo content flag=false rồi kiểm lại skeleton RED và selector GREEN505/505. Không thay product condition.
- Task4: RED source People empty/thiếu label; GREEN510 frontend/185content và typecheck.
- Browser baseline: tạm thay People renderer bằng empty state cũ, runner chạy real dialogue tới Anna_q1_read rồi thất bại ở heading Anna; source khôi phục bằng finally. Không coi import/server failure là RED.
- Group rộng đầu25/29 (7.7m): journey/partial/reload/vocabulary/Settings pass; learning-reset lỗi goto ERR_NO_BUFFER_SPACE; fixture legacy thiếu hai facts đã đủ điều kiện nên replay hợp lệ thêm facts; hai focus cases Tab escape.
- Chạy lại diagnostic: legacy sau realistic fixture pass; focus contains=false ở cả hai viewport. Nx mất quoted grep có space nên run thực tế3 tests, không gọi là một test.
- Rerun nhóm10 sau focus trap:8/10, hai fail cuối vì fallback/expectation dùng outer game-root không focusable. Chỉnh về container canvas tabindex=-1. Loop focus, Conclusion và inner-scroll trước bước restore đã đạt; không hạ assertion.

## Review độc lập

Một reviewer cuối, read-only (không reviewer/implementer mỗi task). Không Critical hoặc Minor; hai Important: Notebook thiếu focus trap; fixture legacy chặn phần branch assertions. Hai Important đã sửa scoped: legacy/history browser GREEN; keyboard vòng đầy đủ và restore desktop/compact RED→GREEN trong nhóm cuối29/29. Không còn Critical/Important chưa xử lý. Declined to judge: []. Không dispatch re-review; tests RED→GREEN là bằng chứng sửa.

## Quyết định khi thực thi

- Skill Bash helpers không chạy do thiếu basename/dirname trong Git Bash runtime. Dùng Python để extract briefs/PowerShell chạy tests, log và ledger theo cùng BASE. Chi phí nếu sai: bookkeeping; không đổi scope/product.
- Spec là nguồn authority; contract giữa5tasks khớp, không sửa interface ngoài spec hoặc mở gói khác.

## Môi trường

Node22.23.3/npm10.9.9 riêng trong .superpowers/runtime, NX_DAEMON=false. ZIP official nodejs.org kiểmSHA256 2b0ff57b049cda1bbcea2240eec20467018713c1efe1f7360c2681859b90ed71. HostNode24/no npmPATH không dùng cho productchecks. Remote dev lúc bắt đầu xác nhận ecb7b21, memory cũ ghi docs chưa push bị stale.

## Verification cuối

Tất cả lệnh dưới đây exit0 trên Node22.23.3/npm10.9.9, NX_DAEMON=false. Browser chạy xong trước lượt DoD cuối; source giữ nguyên khi browser đang chạy. Lint/test7projects (6cache; frontend chạy mới510/510,78files); content185/185 là kết quả cache từ lượt không-cache task4. Typecheck/build mới. Không cộng lượt25/29 hoặc8/10 thành green suite: lượt cuối độc lập29/29 (8.3m).

Output dưới đây được trích trực tiếp từ logs; bỏ các dòng tiến độ/NO_COLOR lặp lại để dễ đọc. Full logs tạm trong workspace ignored, report là handoff lâu dài.

### `npm run lint` — exit0

```text
 NX   Successfully ran target lint for 7 projects
Nx read the output from the cache instead of running the command for 6 out of 7 tasks.
```

### `npm run test` — exit0

```text
 Test Files  1 passed (1)
      Tests  1 passed (1)
 Test Files  8 passed (8)
      Tests  57 passed (57)
 Test Files  3 passed (3)
      Tests  18 passed (18)
 Test Files  16 passed (16)
      Tests  185 passed (185)
 Test Files  2 passed (2)
      Tests  17 passed (17)
 Test Files  78 passed (78)
      Tests  510 passed (510)
 NX   Successfully ran target test for 7 projects
Nx read the output from the cache instead of running the command for 6 out of 7 tasks.
```

### `npm run build` — exit0

```text
dist/index.html                     0.40 kB │ gzip:   0.27 kB
(!) Some chunks are larger than 500 kB after minification. Consider:
dist/assets/index-C-ANEWsu.css     25.79 kB │ gzip:   5.48 kB
dist/assets/index-DEt6zCde.js   1,951.56 kB │ gzip: 475.71 kB
✓ built in 9.03s
 NX   Successfully ran target build for project @lexicon/game-web
```

### `npm run typecheck` — exit0

```text
> the-lexicon-files@0.0.0 typecheck
> tsc -b
```

### `npm run format` — exit0

```text
tools/audio-codegen/README.md 3ms (unchanged)
tsconfig.base.json 1ms (unchanged)
tsconfig.json 1ms (unchanged)
vitest.workspace.ts 1ms (unchanged)
```

### `npm run memory:check` — exit0

Lượt này validate checkpoint in_progress trước result commit; nội dung Next Action là snapshot tại lúc chạy. Memory final được cập nhật/validate riêng sau result commit theo protocol.

```text
memory:check PASS phase=phase-11e active_plan=docs/superpowers/plans/2026-10-01-notebook-people.md next_action=Chờ runner e2e-fix session25692 hoàn tất; sửa fallback focus thật (game-root child tabindex=-1), không dùng outer root. Rerun nhóm6file29 cuối theo plan, một worker, không concurrent build để giảm resource contention.
 NX   Successfully ran target check for project ai-memory
```

### Browser cuối — exit0

```text
npx nx run @lexicon/game-web:test:e2e -- --workers=1 notebook-people.spec.ts viewport-focus.spec.ts dialogue.spec.ts learning.spec.ts settings.spec.ts journey.spec.ts
Running 29 tests using 1 worker
  ok  1 e2e\dialogue.spec.ts:116:1 › three interviews complete the objective and survive reload with one canvas (27.8s)
  ok  2 e2e\dialogue.spec.ts:155:3 › David conditional branch with contradiction flag undefined (7.1s)
  ok  3 e2e\dialogue.spec.ts:155:3 › David conditional branch with contradiction flag false (7.1s)
  ok  4 e2e\dialogue.spec.ts:155:3 › David conditional branch with contradiction flag true (9.5s)
  ok  5 e2e\dialogue.spec.ts:202:1 › legacy Phase 4 save migrates without losing evidence or objective progress (5.0s)
  ok  6 e2e\dialogue.spec.ts:229:1 › dialogue traps focus, blocks gameplay, restores focus and fits desktop viewports (8.5s)
  ok  7 e2e\dialogue.spec.ts:275:1 › closing an unread branch and reloading does not complete an interview (6.4s)
  ok  8 e2e\dialogue.spec.ts:287:1 › physical double clicks cannot skip responses or select the next question (13.1s)
  ok  9 e2e\journey.spec.ts:24:3 › Case #001 journey › start case (1.6s)
  ok 10 e2e\journey.spec.ts:30:3 › Case #001 journey › collect evidence (1.6s)
  ok 11 e2e\journey.spec.ts:45:3 › Case #001 journey › find security log (4.5s)
  ok 12 e2e\journey.spec.ts:75:3 › Case #001 journey › talk to NPC (2.9s)
  ok 13 e2e\journey.spec.ts:86:3 › Case #001 journey › find contradiction (15.2s)
  ok 14 e2e\journey.spec.ts:128:3 › Case #001 journey › accuse David (12.6s)
  ok 15 e2e\journey.spec.ts:162:3 › Case #001 journey › complete case (2.6s)
  ok 16 e2e\journey.spec.ts:173:3 › Case #001 journey › reload preserves the save (2.1s)
  ok 17 e2e\learning.spec.ts:75:1 › visible dialogue records only annotated contexts and persists mode/progress (24.9s)
  ok 18 e2e\learning.spec.ts:134:1 › confirmed learning reset preserves case evidence and keeps one canvas (7.8s)
  ok 19 e2e\notebook-people.spec.ts:133:1 › records partial interview and survives reload (23.0s)
  ok 20 e2e\notebook-people.spec.ts:171:1 › keeps branch history and legacy progress (17.6s)
  ok 21 e2e\notebook-people.spec.ts:238:1 › reuses vocabulary context without encounter inflation (31.6s)
  ok 22 e2e\notebook-people.spec.ts:338:3 › keeps focus and five tabs visible 1280 (50.8s)
  ok 23 e2e\notebook-people.spec.ts:338:3 › keeps focus and five tabs visible 760 (49.1s)
  ok 24 e2e\settings.spec.ts:85:1 › settings and progress survive reload (18.2s)
  ok 25 e2e\settings.spec.ts:171:1 › legacy learning V1 translation mode is preserved (3.1s)
  ok 26 e2e\settings.spec.ts:213:1 › corrupt settings recover to defaults (3.8s)
  ok 27 e2e\viewport-focus.spec.ts:41:3 › keyboard vocabulary then notebook keeps viewport stable 760 (33.4s)
  ok 28 e2e\viewport-focus.spec.ts:41:3 › keyboard vocabulary then notebook keeps viewport stable 1280 (33.2s)
  ok 29 e2e\viewport-focus.spec.ts:85:1 › compact evidence scrolls internally and returns to a visible close control (1.1m)
  29 passed (8.3m)
 NX   Successfully ran target test:e2e for project @lexicon/game-web
```

## Giới hạn

- Save trước hai flag David không cho biết đã đọc answer3 nhánh nào; không backfill/đoán transcript. Người chơi có thể hỏi lại nhánh còn reachable; progress cũ giữ nguyên.
- Browser Chromium Windows, một worker; không full E2E mọi file toàn repo, chỉ nhóm6file liên quan theo plan.
- Bundle advisory>500kB giữ theo scope; không backend nên không dotnet.
- Ảnh1280/760 ở docs/ai/playtests/2026-10-01-notebook-people/, đã nhìn kiểmtra giấy/sepia, text/control/5tabs không tràn ngang; danh sách dài cuộn nội bộ.
