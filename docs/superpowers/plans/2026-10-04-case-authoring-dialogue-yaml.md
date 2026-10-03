# Công cụ soạn hội thoại bằng YAML (PR-04) — Kế hoạch triển khai

> **Dành cho agent thực thi:** BẮT BUỘC dùng `superpowers:executing-plans` (Native) hoặc `superpowers:subagent-driven-development`. Các bước dùng checkbox (`- [ ]`).

**Mục tiêu:** Soạn cây hội thoại bằng YAML ngắn, một lệnh sinh `dialogues.json`, lỗi tham chiếu báo kèm dòng/cột; Case #001 và #002 chuyển sang YAML mà dữ liệu runtime không đổi.

**Kiến trúc:** Dự án Nx mới `tools/case-authoring` (ESM `.mjs`, kiểm thử `node --test`, mẫu `tools/ai-memory`): phân tích YAML có vị trí → kiểm tra → biên dịch ra JSON (và biên dịch ngược cho `case:import`). Runtime không đổi: game vẫn đọc `dialogues.json`.

**Công nghệ:** Node 22, `yaml` (devDependency gốc, lý do: parse YAML có vị trí dòng/cột, chỉ dùng lúc soạn), `prettier` (đã có) để định dạng JSON sinh ra, Vitest cho một test tương thích Zod ở `game-content`.

**Spec:** `docs/superpowers/specs/2026-10-04-case-authoring-dialogue-yaml-design.md` (đã duyệt 04/10/2026).

## Ràng buộc chung

- Không đổi `game-core`, `learning-engine`, schema Zod, loader, loại Condition/Effect, UI, scene, vocabulary. Không hardcode id Case #001 trong công cụ; công cụ đọc case theo tham số.
- Chỉ npm. Thêm dependency bằng `npm install -D yaml` ở gốc (không sửa tay `package.json`); `package-lock.json` cùng commit.
- Làm rõ spec §1.1 "giống hệt": so **bằng nhau sâu (deep-equal) của JSON đã parse**, không phụ thuộc thứ tự khóa. File sinh ra có thể đổi thứ tự khóa so với bản viết tay; khi đó commit bản sinh ra và `--check` giữ nó ổn định.
- Thứ tự khóa đầu ra cố định theo schema: cây `id, npcId, entryNodeId, nodes, completionFlag, completionCondition, notebookStatements`; node `id, speakerId, text, audio, translationVi, vocabularySpans, terminal, choices, condition, effects`; lựa chọn `id, text, translationVi, nextNodeId, condition, effects`. Khóa tùy chọn vắng thì không ghi.
- Ghi file luôn `\n`; so sánh chuẩn hóa `\r\n`→`\n`. Ghi nguyên tử (ghi file tạm rồi đổi tên): biên dịch lỗi thì `dialogues.json` giữ nguyên.
- Thông báo lỗi: `đường/dẫn.yaml:dòng:cột  mã  mô tả` và dòng gợi ý thụt vào; lỗi → thoát mã 1; cảnh báo chỉ in.
- Mỗi task một commit, `git add` đường dẫn cụ thể, không push. Báo cáo: `docs/ai/2026-10-04-case-authoring-verification.md`. Heredoc có dấu nháy trong Bash tool hay lỗi: ghi file bằng công cụ Write.

## Review Focus

1. Cả hai `dialogues.json` tái tạo từ YAML bằng nhau sâu với bản trước phần này (so với `git show 57d5ba2:packages/game-content/cases/<case>/dialogues.json`).
2. `vocabularySpans`: offset UTF-16 với dấu câu, từ lặp trong một câu, `\[` thoát, từ khớp lemma và `surfaceForms`, từ mơ hồ.
3. Windows: file YAML/JSON có `\r\n` (autocrlf) vẫn parse và `--check` không báo lệch giả.
4. Vị trí dòng/cột đúng với flow map `{ id: x, ... }`, chuỗi nhiều dòng, khóa lạ; cảnh báo không bao giờ làm build thất bại.
5. `build` lỗi không đụng `dialogues.json`; `import` từ chối ghi đè YAML sẵn có khi thiếu `--force`.

---

### Task 0: Dự án `case-authoring`, dependency, đường cơ sở

**Files:**
- Create: `tools/case-authoring/project.json`, `tools/case-authoring/src/cli.mjs` (khung), `tools/case-authoring/test/smoke.test.mjs`, `docs/ai/2026-10-04-case-authoring-verification.md`
- Modify: `package.json` (scripts `case:build`, `case:import`), `package-lock.json`

**Interfaces:**
- Produces: `node tools/case-authoring/src/cli.mjs <build|import> <case-id> [--check] [--force]`; `export async function run(argv: string[], env?: { cwd?: string; out?: (s: string) => void; err?: (s: string) => void }): Promise<number>` (mã thoát). Nx project `case-authoring` có target `test` (`node --test tools/case-authoring/test`), `lint` (`eslint "tools/case-authoring/**/*.mjs"`), `check` (build `--check` cho `case-001` và `case-002`).

- [ ] **Step 1:** `npm install -D yaml`; xác nhận `package.json` và `package-lock.json` đổi, không có file lock khác.
- [ ] **Step 2:** Viết `smoke.test.mjs` đỏ: `run(['build'])` trả `1` và in cách dùng; `run(['--help'])` trả `0`.
- [ ] **Step 3:** `node --test tools/case-authoring/test` — FAIL (chưa có `cli.mjs`).
- [ ] **Step 4:** Khung `cli.mjs` (`run` phân tích lệnh, chưa làm gì thật), `project.json`, hai script gốc `"case:build": "node tools/case-authoring/src/cli.mjs build"`, `"case:import": "node tools/case-authoring/src/cli.mjs import"`. `npx nx run case-authoring:test` — PASS.
- [ ] **Step 5:** Lưu baseline vào báo cáo: kích thước và SHA-256 của `dialogues.json` hai case ở commit `57d5ba2`; danh sách E2E đỏ có sẵn (17, xem `2026-10-04-ui-investigation-desk-verification.md`); pytest đỏ có sẵn.
- [ ] **Step 6:** Commit `chore(authoring): case-authoring project skeleton and yaml dependency`.

### Task 1: Cú pháp rút gọn và biên dịch

**Files:**
- Create: `tools/case-authoring/src/forms.mjs`, `vocab.mjs`, `parseDialogueYaml.mjs`, `compileDialogue.mjs`; `test/forms.test.mjs`, `vocab.test.mjs`, `compile.test.mjs`

**Interfaces:**
- Produces:
  - `parseDo(items: string[]): Effect[]` và `formatDo(effects: Effect[]): string[]`. Động từ: `set k`→`{type:'setFlag',key:k,value:true}`, `clear k`→`value:false`, `give e`→`addEvidence`, `unlock f`→`unlockFact`, `activate o`→`activateObjective`, `complete o`→`completeObjective`. Thứ tự giữ nguyên. Sai dạng ném `FormError` (`{ message, index }`).
  - `parseNeeds(spec: unknown): Condition` và `formatNeeds(c: Condition): unknown`. Mục: `evidence x`→`hasEvidence`, `fact x`→`hasFact`, `objective x`→`objectiveCompleted`, `flag k`→`{flag, value:true}`, `no-flag k`→`value:false`. Danh sách một phần tử → điều kiện đơn; nhiều phần tử → `{type:'all',conditions}`; `{all:[…]}` / `{any:[…]}` tường minh (kể cả `all` một phần tử); phần tử danh sách có thể là chuỗi hoặc nhóm lồng. `formatNeeds` là nghịch đảo chính xác.
  - `extractSpans(markup: string, vocabulary: VocabularyEntry[]): { text: string; spans: {start:number;end:number;vocabularyId:string}[]; issues: {code:'unknown-word'|'ambiguous-word'|'bad-markup'; at:number; message:string; hint?:string}[] }`: `[từ]` tra `lemma` và `surfaceForms` (không phân biệt hoa thường); `[chữ|id]` chọn tường minh; `\[` là ký tự `[`; offset UTF-16 trên văn bản đã bỏ ngoặc. `injectMarkup(text, spans, vocabulary): string` nghịch đảo (thêm `|id` chỉ khi chữ không tra ra duy nhất đúng id đó; thoát `[`).
  - `parseDialogueYaml(source: string, file: string): { doc: unknown; at(path: (string|number)[], part?: 'key'|'value'): { line: number; col: number }; issues: Issue[] }` (dùng `yaml` `parseDocument` + `LineCounter`; `Issue = { file; line; col; code; level:'error'|'warn'; message; hint? }`).
  - `compileTree(source: string, ctx: { file: string; vocabulary: VocabularyEntry[] }): { tree: DialogueTree | null; issues: Issue[] }`. Quy tắc khóa như spec §4.2: `tree`→`id`, `npc`→`npcId`, `done`→`completionFlag`, `finish`→`completionCondition` (danh sách cờ → `all` các `flag true`; hoặc dạng `needs`), `notes`→`notebookStatements[{nodeId,recordedCondition}]` (chuỗi cờ → `flag true`; hoặc dạng `needs`), `entry`→`entryNodeId` (mặc định node đầu tiên); node `say`→`text`, `vi`→`translationVi`, `speaker`→`speakerId` (mặc định `npc`), `needs`→`condition`, `do`→`effects`, `ask`→`choices` (`id`, `say`, `vi`, `to`→`nextNodeId`, `needs`, `do`), `audio` đi qua nguyên dạng; `terminal` = không có `ask`.

- [ ] **Step 1: Test đỏ `forms.test.mjs`:** từng động từ `parseDo` ra đúng Effect; thứ tự giữ; `parseDo(['hop x'])` ném `FormError` với `index 0`; `parseNeeds(['flag a'])` là điều kiện đơn; `['flag a','evidence e']` là `all` hai phần tử; `{all:['flag a']}` là `all` một phần tử; `{any:['fact f','no-flag b']}`; `formatNeeds(parseNeeds(x))` bằng `x` cho từng dạng; nhóm lồng.
- [ ] **Step 2: Test đỏ `vocab.test.mjs`:** `"I checked the [address] when I [signed] the [package]"` ra đúng ba span với offset `14–21`, `29–35`, `40–47` trên chuỗi `"I checked the address when I signed the package into the mail room."`; từ có dấu câu liền sau (`[package].`); từ lặp hai lần cho hai span riêng; `[sign|sign]` chọn tường minh; từ không có → `unknown-word` kèm `at`; từ khớp hai mục → `ambiguous-word` liệt kê id; `\[` giữ `[` trong `text`; `injectMarkup(extractSpans(m).text, spans)` bằng `m`.
- [ ] **Step 3: Test đỏ `compile.test.mjs`:** YAML nhỏ (một cây hai node) biên dịch ra đúng đối tượng mong đợi gồm `terminal` suy ra, `speakerId` mặc định, thứ tự khóa theo ràng buộc chung, `entryNodeId` mặc định, `audio` đi qua, `finish`/`notes` hai dạng; YAML sai cú pháp trả `issues` mã `yaml-syntax` có `line`/`col`.
- [ ] **Step 4:** `node --test tools/case-authoring/test` — FAIL.
- [ ] **Step 5:** Cài đặt bốn module theo chữ ký trên. `extractSpans` đọc từng ký tự để xử lý `\[` và `[…]`; `compileTree` gọi `extractSpans` cho mọi `say` có `[`.
- [ ] **Step 6:** Test PASS; `npx nx run case-authoring:lint`.
- [ ] **Step 7:** Commit `feat(authoring): dialogue YAML forms, vocabulary markup and compiler`.

### Task 2: Biên dịch ngược và vòng tròn trên dữ liệu thật

**Files:**
- Create: `tools/case-authoring/src/decompileDialogue.mjs`, `io.mjs`; `test/decompile.test.mjs`, `test/roundtrip.test.mjs`

**Interfaces:**
- Consumes: `formatDo`, `formatNeeds`, `injectMarkup`, `compileTree`, `parseDialogueYaml` từ Task 1.
- Produces:
  - `decompileTree(tree: DialogueTree, vocabulary: VocabularyEntry[]): { yaml: string; issues: Issue[] }`: ngược lại đúng quy tắc §4.2 (`speaker` chỉ ghi khi khác `npc`; `entry` chỉ ghi khi khác node đầu; `do`/`needs` danh sách một dòng dạng flow; `ask` mỗi lựa chọn một khối). Dữ liệu không biểu diễn được (span chồng nhau, span không khớp chữ nào của từ điển) → `issues` mức `error` kèm tên cây/node, và không sinh YAML.
  - `io.mjs`: `loadCase(root: string, caseId: string): { dir: string; npcs: {id:string;dialogueTreeId:string}[]; vocabulary: VocabularyEntry[]; refs: { evidence: Set<string>; fact: Set<string>; objective: Set<string> } | null }`; `formatJson(value: unknown): Promise<string>` (prettier, parser `json`, kết thúc `\n`); `normalizeEol(s: string): string`; `writeAtomic(path: string, content: string): Promise<void>` (ghi `path + '.tmp'` rồi `rename`).

- [ ] **Step 1: Test đỏ `decompile.test.mjs`:** cây hai node có `audio`, `condition` dạng đơn và dạng `all`, effects trộn kiểu → YAML đúng nội dung chính (parse lại bằng `yaml` rồi so các khóa); span chồng nhau → `issues` lỗi và không có YAML.
- [ ] **Step 2: Test đỏ `roundtrip.test.mjs`:** với từng case `case-001`, `case-002`: `loadCase`, đọc `dialogues.json`; mỗi cây qua `decompileTree` rồi `compileTree` phải `deepEqual` cây gốc; và `compileTree(decompile(compileTree(y)))` ổn định. Test chạy trên file thật (đường dẫn gốc từ `import.meta.url`).
- [ ] **Step 3:** Chạy — FAIL.
- [ ] **Step 4:** Cài đặt `decompileDialogue.mjs` và `io.mjs`. Nếu vòng tròn lộ dữ liệu thật không biểu diễn được, **ghi vào ledger một Ruling** nêu rõ cây/node, rồi mở rộng cú pháp theo cách nhỏ nhất (ví dụ `[chữ|id]` hoặc trường pass-through) và cập nhật spec §4.2 trong cùng commit.
- [ ] **Step 5:** Test PASS cho cả hai case.
- [ ] **Step 6:** Commit `feat(authoring): decompile dialogue JSON and round-trip both cases`.

### Task 3: Kiểm tra và báo lỗi có vị trí

**Files:**
- Create: `tools/case-authoring/src/checkDialogue.mjs`, `test/check.test.mjs`
- Modify: `tools/case-authoring/src/compileDialogue.mjs` (gọi `checkTree`, gộp `issues`)

**Interfaces:**
- Consumes: `parseDialogueYaml` (`at`, `doc`), `loadCase` (`refs`, `vocabulary`).
- Produces: `checkTree(parsed: ReturnType<typeof parseDialogueYaml>, ctx: { file: string; refs: Refs | null }): Issue[]` với các mã và mức đúng bảng spec §4.3: `unknown-key` (kèm hint khóa gần nhất theo khoảng cách chỉnh sửa ≤ 2), `bad-form`, `unknown-node` (kèm hint node gần nhất), `duplicate-id` (node và lựa chọn), `unknown-ref` (evidence/fact/objective, chỉ khi `refs` khác `null`, kèm hint), `orphan-node` (cảnh báo), `flag-never-set` / `flag-never-read` (cảnh báo; cờ `done` và cờ trong `finish`/`notes` tính là "được đọc"). `unknown-word`, `ambiguous-word`, `yaml-syntax` đến từ Task 1 nhưng cũng mang `line`/`col` đúng vị trí giá trị `say`.

- [ ] **Step 1: Test đỏ `check.test.mjs`:** mỗi mã một test với YAML có lỗi đúng một chỗ và khẳng định `code`, `level`, `line`, `col` (đếm từ 1) và `hint` khi áp dụng. Các trường hợp vị trí khó: `to` trong flow map `{ id: a, to: b }` (cột của giá trị `b`), `say` nhiều dòng (dòng bắt đầu của giá trị), khóa lạ ở node (cột của khóa), `unknown-word` (vị trí của giá trị `say`). Test riêng: cảnh báo không làm `compileTree` trả `tree: null`; một lỗi làm `tree: null`.
- [ ] **Step 2:** Chạy — FAIL.
- [ ] **Step 3:** Cài đặt `checkDialogue.mjs`; `compileTree` gọi nó (cần `ctx.refs`); lỗi → `tree: null`.
- [ ] **Step 4:** Test PASS; thêm test regression: YAML sạch hoàn toàn không sinh issue nào.
- [ ] **Step 5:** Commit `feat(authoring): dialogue checks with line and column positions`.

### Task 4: CLI, nối Nx và test drift

**Files:**
- Modify: `tools/case-authoring/src/cli.mjs`, `project.json`
- Create: `tools/case-authoring/test/cli.test.mjs`, `test/drift.test.mjs`, `test/fixtures/mini-case/` (case giả: `npcs.json`, `vocabulary.json`, `evidences.json`, `facts.json`, `objectives.json`, `dialogues/*.yaml`)

**Interfaces:**
- Consumes: `compileTree`, `decompileTree`, `loadCase`, `formatJson`, `writeAtomic`, `normalizeEol`.
- Produces:
  - `build <case>`: đọc `dialogues/*.yaml` theo thứ tự `npcs.json` (mỗi NPC một file `<dialogueTreeId>.yaml`; thiếu file → lỗi `missing-tree`), gộp issues, in theo mockup spec §5, ghi `dialogues.json` bằng `writeAtomic` chỉ khi không có lỗi; in "Tiếp theo: npm run test -w @lexicon/game-content".
  - `build <case> --check`: không ghi; thoát 1 và in cây/node/trường đầu tiên lệch khi JSON sinh ra khác `dialogues.json` (so sâu sau `normalizeEol`).
  - `import <case> [--force]`: với từng cây trong `dialogues.json` ghi `dialogues/<treeId>.yaml`; thoát 1 nếu file đã có và không `--force`; sau khi ghi tự chạy `build --check` và in kết quả `verify`.
  - Test drift: với `case-001` và `case-002`, `run(['build', id, '--check'])` thoát 0.

- [ ] **Step 1: Test đỏ `cli.test.mjs`** (dùng `fixtures/mini-case` qua tham số gốc `env.cwd`): `build` sạch ghi JSON và thoát 0 (so với JSON mong đợi); `build` có lỗi thoát 1, in `dòng:cột mã` và **không** tạo/đổi `dialogues.json` (khẳng định bằng nội dung trước/sau); `--check` thoát 0 khi khớp, 1 khi sửa tay một ký tự trong JSON và thông báo nêu cây/node/trường; `import` từ chối ghi đè khi không `--force`; EOL: YAML nạp với `\r\n` biên dịch giống `\n`; cảnh báo không đổi mã thoát.
- [ ] **Step 2: Test đỏ `drift.test.mjs`** như trên cho hai case thật (chưa có YAML nên FAIL ở bước này; xanh sau Task 5).
- [ ] **Step 3:** Chạy `cli.test.mjs` — FAIL.
- [ ] **Step 4:** Cài đặt `cli.mjs`; `project.json` target `check` chạy `--check` cho cả hai case.
- [ ] **Step 5:** `cli.test.mjs` PASS (drift sẽ chỉ xanh sau Task 5; ghi vào ledger).
- [ ] **Step 6:** Commit `feat(authoring): case:build, --check and case:import commands`.

### Task 5: Chuyển Case #001 và #002 sang YAML

**Files:**
- Create: `packages/game-content/cases/case-001/dialogues/*.yaml`, `case-002/dialogues/*.yaml`
- Modify: `packages/game-content/cases/case-001/dialogues.json`, `case-002/dialogues.json` (chỉ nếu thứ tự khóa đổi), `packages/game-content/src/authoring.compat.test.ts` (tạo mới)

**Interfaces:**
- Consumes: CLI Task 4; `dialogueTreeSchema` (`src/schema/dialogue.ts`).

- [ ] **Step 1:** `npm run case:import -- case-001` rồi `case-002`; đọc từng YAML bằng mắt (đúng ý, dễ đọc, từ vựng đã đánh dấu).
- [ ] **Step 2:** `npm run case:build -- case-001` và `case-002`; xác nhận bằng một lệnh node so `deepEqual` `dialogues.json` mới với bản ở `57d5ba2` (`git show`) — Review Focus 1; nếu byte khác chỉ do thứ tự khóa thì commit bản sinh ra.
- [ ] **Step 3: Test đỏ `src/authoring.compat.test.ts`** (Vitest): import `compileTree` và `loadCase` từ `../../../tools/case-authoring/src/...mjs`; (a) mọi cây của hai case biên dịch từ YAML qua `dialogueTreeSchema.parse`; (b) cây mới trong `tools/case-authoring/test/fixtures/mini-case` (YAML) biên dịch ra cây qua `dialogueTreeSchema.parse`. Nếu import `.mjs` từ Vitest gặp cấu hình chặn, ghi Ruling và đổi sang chạy cùng kiểm tra bằng `node --test` với `zod` từ `packages/game-content/node_modules`.
- [ ] **Step 4:** Chạy `npm run test -w @lexicon/game-content`, `npm run case:build -- case-001 --check`, `case-002 --check`, và `node .claude/skills/authoring-case-content/scripts/check-case-flow.mjs case-001`, `case-002` — tất cả như trước. Test drift Task 4 nay xanh.
- [ ] **Step 5:** Chạy E2E `journey.spec.ts`, `case-002.spec.ts`, `notebook-people.spec.ts`, `dialogue.spec.ts`, `dialogue-band.spec.ts`: chỉ đỏ trong danh sách có sẵn.
- [ ] **Step 6:** Commit `feat(content): author case-001 and case-002 dialogues in YAML`.

### Task 6: Tài liệu, skill và memory

**Files:**
- Create: `.claude/skills/authoring-case-content/references/dialogue-yaml.md`, `.agents/skills/authoring-case-content/references/dialogue-yaml.md`
- Modify: hai `SKILL.md` của `authoring-case-content` (`.claude` và `.agents`), `AGENTS.md`, `docs/ai/MEMORY.md`

- [ ] **Step 1:** `dialogue-yaml.md`: cú pháp (bảng khóa node/lựa chọn/cây, `needs`, `do`, `[từ]`), bảng mã lỗi và cách sửa, quy trình "viết YAML → `case:build` → `npm run test -w @lexicon/game-content` → `check-case-flow` → đọc lại theo guardrail", mẫu YAML một cây mới. Viết tiếng Việt.
- [ ] **Step 2:** Sửa cả hai `SKILL.md`: quy trình bước 3 trỏ tới `case:build` thay vì sửa `dialogues.json` tay, thêm dòng cấm sửa tay `dialogues.json` ("`--check` sẽ báo"); `AGENTS.md` gốc thêm một dòng ở mục workflow/soạn case. Hai bản skill giữ nội dung giống nhau (dùng `writing-skills`).
- [ ] **Step 3:** `docs/ai/MEMORY.md`: phase `pr-04-case-authoring`, lệnh mới, Next Actions ≤ 5; `npm run memory:check`; bảng backlog PR-04 trong `docs/product/2026-10-02-product-review-and-direction.md` cập nhật trạng thái.
- [ ] **Step 4:** Commit `docs(authoring): dialogue YAML guide, skill update and memory`.

### Task 7: Xác minh và review

- [ ] **Step 1:** DoD, dán kết quả: `npm run lint`, `npm run test`, `npm run build`, `npm run typecheck`, `npx prettier --check .`, `npm run memory:check`, pytest (đỏ có sẵn), `node --test tools/audio-codegen/build_peaks.test.mjs`.
- [ ] **Step 2:** E2E đầy đủ (một mình, không sửa file trong lúc chạy, ~55 phút): chỉ đỏ trong 17 có sẵn.
- [ ] **Step 3:** Một review độc lập toàn nhánh (opus, `requesting-code-review`) theo Review Focus; sửa Critical/Important bằng RED→GREEN, Minor ghi ledger.
- [ ] **Step 4:** Điền báo cáo `docs/ai/2026-10-04-case-authoring-verification.md` (tóm tắt, file đổi, test thêm, lệnh đã chạy, hạn chế, Rulings). Cập nhật `MEMORY.md` (`result_commit`). Commit `docs(authoring): PR-04 verification and memory`. Không push; chờ người dùng.
