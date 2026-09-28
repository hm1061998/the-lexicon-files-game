# Kế hoạch triển khai Phase 0A — Durable AI Memory

> **Dành cho AI thực thi:** BẮT BUỘC dùng sub-skill `subagent-driven-development` (khuyến nghị) hoặc `executing-plans` để triển khai lần lượt từng task. Các bước dùng checkbox (`- [ ]`) để theo dõi.

**Mục tiêu:** Tạo cơ chế project memory gọn, lưu bằng Git và có validator nhanh, xác định được để một AI mới tiếp tục Phase 0A mà không cần lịch sử chat.

**Kiến trúc:** `docs/ai/MEMORY.md` là memory runtime duy nhất có thể thay đổi; Git history lưu các snapshot cũ. Validator thuần, không dependency sẽ parse và kiểm tra memory. Một CLI mỏng cung cấp adapter filesystem/Git và các target check/test ngắn gọn chạy qua Nx.

**Tech Stack:** Node.js 22 built-ins (`node:test`, `fs`, `path`, `child_process`), ECMAScript modules, Nx 21, npm workspaces, Markdown.

**Spec:** `docs/superpowers/specs/2026-09-28-durable-ai-memory-design.md`

## Ràng buộc toàn cục

- Chỉ triển khai Phase 0A; không làm gameplay, UI, content engine, persistence hoặc backend behavior.
- Chỉ dùng npm workspaces và Nx; không thêm pnpm, yarn, bun hoặc dependency mới.
- Giữ `docs/ai/MEMORY.md` không quá 12 KB và khoảng 2.500 token.
- Giữ `docs/ai/README.md` không quá 80 dòng.
- Validation và test phải deterministic, offline; không gọi AI, browser, application build hoặc network.
- `Next Actions` có tối đa 5 mục; `Active Decisions` có tối đa 10 mục.
- Artifact phân tích/lập kế hoạch chỉ được push sau khi người dùng xác nhận rõ ràng.
- Dùng TDD cho validator: phải quan sát test fail đúng lý do trước khi triển khai từng nhóm hành vi.
- Chạy `npm run lint`, `npm run test` và `npm run build` trước khi báo Phase 0A hoàn thành.

## Cấu trúc file

```text
docs/ai/
  README.md                         Quy trình bắt đầu/cập nhật cho agent
  MEMORY.md                         Snapshot trạng thái hiện hành
tools/ai-memory/
  project.json                      Nx targets cho check/test/lint
  src/memory-schema.mjs             Parser và validator thuần
  src/cli.mjs                       Repository adapters và CLI output
  test/memory-schema.test.mjs       Test validation thuần
  test/cli.test.mjs                 Test orchestration/output của CLI
AGENTS.md                           Workflow memory bắt buộc
README.md                           Link memory cho người đọc
docs/README.md                      Mục memory trong documentation index
package.json                        Scripts memory:check và memory:test
```

## Trọng tâm review

- Input có UTF-8 BOM và CRLF phải parse giống input LF; Task 1 khóa hành vi bằng fixture BOM/CRLF hợp lệ.
- Heading Markdown nằm trong fenced code block không được tính là section bắt buộc; Task 1 có case từ chối fenced heading.
- Metadata chứa thêm dấu hai chấm, như ISO timestamp, phải giữ nguyên toàn bộ value; Task 1 assert chính xác chuỗi `updated_at`.
- Literal `none` phải bỏ qua path existence check, trong khi linked file bị thiếu phải fail kèm tên field; Task 1 bao phủ cả hai nhánh.
- Git executable hoặc adapter bị lỗi phải trở thành validation error có thể xử lý, không được tạo uncaught exception; Task 2 test failure path của CLI.

---

### Task 1: Parser và Validator thuần cho Memory

**Files:**

- Create: `tools/ai-memory/src/memory-schema.mjs`
- Create: `tools/ai-memory/test/memory-schema.test.mjs`

**Interfaces:**

- Consumes: Markdown source cùng repository adapter được inject; không truy cập trực tiếp filesystem, Git, network hoặc process.
- Produces:
  - `parseMemory(source: string): { metadata: Record<string, string>, sections: Map<string, string> }`
  - `validateMemory(source: string, options: ValidationOptions): ValidationResult`
  - `ValidationOptions = { byteLength: number, pathExists(relativePath: string): boolean, commitExists(commit: string): boolean }`
  - `ValidationResult = { valid: boolean, errors: string[], phase: string, activePlan: string, nextAction: string }`

- [ ] **Bước 1: Viết parser test đang fail**

Thêm các test:

- `parses valid LF memory and exposes summary fields`
- `parses UTF-8 BOM and CRLF without changing metadata`
- `preserves metadata values containing colons`
- `ignores headings inside fenced code blocks`

Fixture hợp lệ phải assert:

```js
assert.equal(result.metadata.updated_at, '2026-09-28T10:30:00+07:00');
assert.equal(result.sections.size, 12);
```

- [ ] **Bước 2: Chạy parser test và xác nhận fail đúng dự kiến**

Run: `node --test tools/ai-memory/test/memory-schema.test.mjs`

Expected: FAIL vì `tools/ai-memory/src/memory-schema.mjs` hoặc `parseMemory` chưa tồn tại.

- [ ] **Bước 3: Implement `parseMemory(source)`**

Loại bỏ một UTF-8 BOM, normalize CRLF thành LF, parse YAML front matter đầu file bằng cách tách mỗi metadata line tại dấu hai chấm đầu tiên, và thu thập chính xác level-two heading nằm ngoài fenced code block. Không thêm dependency YAML hoặc Markdown.

- [ ] **Bước 4: Chạy lại parser test**

Run: `node --test tools/ai-memory/test/memory-schema.test.mjs`

Expected: toàn bộ parser test PASS.

- [ ] **Bước 5: Bổ sung validation contract test đang fail**

Bao phủ chính xác các kết quả sau:

- memory hợp lệ trả `valid === true`, không có error, đồng thời trả phase, active plan và next action đầu tiên;
- byte length `12289` vi phạm giới hạn 12 KB;
- thiếu metadata field phải fail kèm tên field;
- status không hợp lệ phải fail và liệt kê allowed status;
- thiếu, trùng hoặc sai thứ tự required section phải fail;
- `active_spec: none` và `active_plan: none` không gọi `pathExists`;
- linked spec/plan bị thiếu phải fail kèm metadata field và path;
- result commit không resolve phải fail với `result_commit` trong error;
- placeholder `TBD`, `TODO`, `FIXME` hoặc angle-bracket placeholder phải fail;
- 6 next actions phải fail; 11 active decisions phải fail;
- required heading chỉ xuất hiện trong fence vẫn bị coi là thiếu.

- [ ] **Bước 6: Chạy validation test và xác nhận fail đúng dự kiến**

Run: `node --test tools/ai-memory/test/memory-schema.test.mjs`

Expected: FAIL vì `validateMemory` chưa được implement.

- [ ] **Bước 7: Implement `validateMemory(source, options)`**

Dùng constant cho 7 status, 12 ordered section, giới hạn 12 KB, 5 next actions và 10 active decisions. Bắt exception từ adapter được inject và thêm actionable error thay vì throw.

- [ ] **Bước 8: Chạy focused test**

Run: `node --test tools/ai-memory/test/memory-schema.test.mjs`

Expected: toàn bộ test Task 1 PASS trong dưới 2 giây và không gọi network.

- [ ] **Bước 9: Commit validator thuần**

```bash
git add tools/ai-memory/src/memory-schema.mjs tools/ai-memory/test/memory-schema.test.mjs
git commit -m "feat: add AI memory validator"
```

---

### Task 2: Repository CLI, Nx Targets và Initial Memory

**Files:**

- Create: `tools/ai-memory/src/cli.mjs`
- Create: `tools/ai-memory/test/cli.test.mjs`
- Create: `tools/ai-memory/project.json`
- Create: `docs/ai/README.md`
- Create: `docs/ai/MEMORY.md`
- Modify: `package.json`
- Modify: `AGENTS.md`
- Modify: `README.md`
- Modify: `docs/README.md`

**Interfaces:**

- Consumes: `validateMemory` từ Task 1, repository root, memory path, local Git object database và local filesystem.
- Produces:
  - `runValidation(options: RunOptions): number`, trả process exit code nhưng không gọi trực tiếp `process.exit`.
  - CLI success line: `memory:check PASS phase={phase} active_plan={path-or-none} next_action={text}`.
  - Root scripts `memory:check` và `memory:test`, đều delegate đến Nx project `ai-memory`.

- [ ] **Bước 1: Viết CLI orchestration test đang fail**

Dùng các hàm được inject: `readFile`, `pathExists`, `commitExists`, `writeOut`, `writeErr`. Thêm test assert:

- memory hợp lệ trả `0` và ghi đúng một PASS line ngắn;
- memory không hợp lệ trả `1`, không ghi PASS line và emit một dòng cho mỗi actionable error;
- read failure trả `1` kèm memory path;
- Git adapter throw trả `1` kèm `result_commit` và adapter message.

- [ ] **Bước 2: Chạy CLI test và xác nhận fail đúng dự kiến**

Run: `node --test tools/ai-memory/test/cli.test.mjs`

Expected: FAIL vì `tools/ai-memory/src/cli.mjs` hoặc `runValidation` chưa tồn tại.

- [ ] **Bước 3: Implement `runValidation(options)` và executable CLI boundary**

Default boundary phải:

- resolve repository root từ `import.meta.url`, không phụ thuộc working directory của caller;
- đọc `docs/ai/MEMORY.md` bằng UTF-8;
- kiểm tra link bằng `existsSync(resolve(repoRoot, relativePath))`;
- kiểm tra commit bằng `git cat-file -e resultCommit^{commit}` với argument array, không shell interpolation;
- ghi output ngắn và đặt `process.exitCode` từ kết quả `runValidation`.

- [ ] **Bước 4: Chạy focused CLI và validator test**

Run: `node --test tools/ai-memory/test/memory-schema.test.mjs tools/ai-memory/test/cli.test.mjs`

Expected: toàn bộ focused test PASS, không gọi network hoặc AI.

- [ ] **Bước 5: Thêm Nx project và root scripts**

Tạo `tools/ai-memory/project.json` với project name `ai-memory` và các target `nx:run-commands`:

- `check`: `node tools/ai-memory/src/cli.mjs`
- `test`: `node --test tools/ai-memory/test/memory-schema.test.mjs tools/ai-memory/test/cli.test.mjs`
- `lint`: `eslint "tools/ai-memory/**/*.mjs"`

Thêm vào root `package.json`:

```json
"memory:check": "nx run ai-memory:check",
"memory:test": "nx run ai-memory:test"
```

- [ ] **Bước 6: Tạo operating guide gọn**

Tạo `docs/ai/README.md` tối đa 80 dòng, bao gồm startup order, reconciliation, update triggers, content budget, two-commit handoff pattern, push approval rule, validation commands và prohibited content.

- [ ] **Bước 7: Tạo `MEMORY.md` ban đầu từ repository evidence**

Dùng đủ 12 required section và YAML metadata. Thiết lập:

- `schema_version: 1`
- `phase: phase-0a`
- `status: in_progress`
- `active_spec: docs/superpowers/specs/2026-09-28-durable-ai-memory-design.md`
- `active_plan: docs/superpowers/plans/2026-09-28-phase-0a-durable-ai-memory.md`
- `result_commit` bằng chính xác output của `git rev-parse HEAD` trước khi sửa Task 2
- next action là hoàn thành verification Phase 0A và reconcile memory cuối

Giữ file không quá 12 KB và chỉ ghi dữ kiện kiểm chứng được từ repository.

- [ ] **Bước 8: Gắn agent startup contract vào tài liệu**

Cập nhật root `AGENTS.md`: mọi công việc ảnh hưởng code, plan, tiến độ, quyết định hoặc blocker phải bắt đầu bằng việc đọc `docs/ai/README.md` và `MEMORY.md`, reconcile với Git và cập nhật memory khi kết thúc. Thêm link từ root `README.md` và `docs/README.md`. Không lặp lại toàn bộ protocol bên ngoài `docs/ai/README.md`.

- [ ] **Bước 9: Chạy focused checks**

Run:

```bash
npm run memory:test
npm run memory:check
npm run lint
```

Expected:

- validator test PASS;
- `memory:check` in một PASS line chứa `phase-0a`, plan path chính xác và next action;
- Nx lint thành công cho `ai-memory`;
- không target nào gọi network hoặc AI.

- [ ] **Bước 10: Đo thời gian lightweight checks**

Chạy riêng từng phép đo bằng PowerShell:

```powershell
Measure-Command { npm run memory:check | Out-Host }
Measure-Command { npm run memory:test | Out-Host }
```

Expected: mỗi command hoàn thành trong dưới 2 giây trên máy phát triển. Nếu vượt giới hạn, profile thời gian khởi động Nx/CLI và giảm startup work mà không thêm dependency hoặc làm yếu validation.

- [ ] **Bước 11: Commit repository integration**

```bash
git add tools/ai-memory/project.json tools/ai-memory/src/cli.mjs tools/ai-memory/test/cli.test.mjs docs/ai/README.md docs/ai/MEMORY.md AGENTS.md README.md docs/README.md package.json
git commit -m "feat: add durable AI project memory"
```

---

### Task 3: Full Verification và Final Handoff

**Files:**

- Modify: `docs/ai/MEMORY.md`

**Interfaces:**

- Consumes: Nx targets từ Task 2 và repository commit history.
- Produces: snapshot memory Phase 0A đã verify, tham chiếu Task 2 result commit.

- [ ] **Bước 1: Lấy Task 2 result commit**

Run: `git rev-parse HEAD`

Expected: commit được tạo bởi Task 2. Dùng chính xác SHA này làm `result_commit`; không dùng placeholder hoặc đoán commit tương lai.

- [ ] **Bước 2: Cập nhật bản nháp handoff trước verification**

Giữ `status: in_progress`, cập nhật `updated_at`, gom phần Phase 0A đã implement thành milestone ngắn, chỉ giữ active decision, ghi blocker hiện tại nếu có, và đặt next action là hoàn thành verification. Ghi các verification command dự kiến ở trạng thái pending, không tuyên bố kết quả.

- [ ] **Bước 3: Chạy toàn bộ repository verification**

Chạy riêng từng command:

```bash
npm run memory:check
npm run memory:test
npm run lint
npm run test
npm run build
git diff --check
```

Expected: mọi command exit `0`; `memory:check` emit một PASS line; memory checks vẫn nằm trong budget dưới 2 giây; không runtime task nào gọi network hoặc AI.

- [ ] **Bước 4: Ghi kết quả verification thực tế**

Thay các verification entry pending trong `MEMORY.md` bằng kết quả command thực tế. Nếu mọi command pass, đặt status thành `complete`, xóa in-progress item đã hoàn thành và đặt next action là xin phép lập kế hoạch Phase 0B. Nếu command nào fail, đặt status thành `blocked` hoặc `in_progress`, ghi blocker chính xác và không tuyên bố Phase 0A hoàn thành.

- [ ] **Bước 5: Chạy lại final memory gate**

Run:

```bash
npm run memory:check
git diff --check
```

Expected: cả hai exit `0` và `MEMORY.md` vẫn không quá 12 KB.

- [ ] **Bước 6: Commit final memory handoff**

```bash
git add docs/ai/MEMORY.md
git commit -m "docs: record Phase 0A AI memory handoff"
```

- [ ] **Bước 7: Kiểm tra repository state sau commit**

Run:

```bash
git status --short --branch
git log -3 --oneline --decorate
```

Expected: working tree sạch; commit mới nhất là memory handoff; commit ngay trước là kết quả triển khai Phase 0A được memory tham chiếu.

Không push cho đến khi người dùng review kết quả triển khai và xác nhận push rõ ràng nếu công việc vẫn thuộc workflow phân tích/lập kế hoạch.
