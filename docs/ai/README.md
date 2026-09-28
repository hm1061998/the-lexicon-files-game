# AI Project Memory

Memory này giúp một phiên AI mới tiếp tục công việc mà không cần lịch sử chat.

## Bắt đầu phiên

Khi công việc có thể ảnh hưởng code, plan, tiến độ, quyết định hoặc blocker:

1. Đọc `AGENTS.md` và rule theo khu vực.
2. Đọc `docs/ai/MEMORY.md`.
3. Đọc active spec/plan được liên kết trong memory.
4. Kiểm tra Git status, branch và recent commits.
5. Đối chiếu Git với memory; Git là bằng chứng thực tế khi hai bên lệch nhau.

Không tiếp tục từ chat assumption khi memory thiếu hoặc sai. Reconcile từ Git, spec và plan trước.

## Khi nào cập nhật

Cập nhật `MEMORY.md` khi phase, plan, status, scope đã duyệt, active decision, blocker, verification, result commit hoặc next action thay đổi. Phiên không ảnh hưởng các mục này không cần cập nhật.

## Content budget

- File tối đa 12 KB, khoảng 2.500 token.
- `Next Actions` tối đa 5 mục.
- `Active Decisions` tối đa 10 mục.
- Chỉ giữ verification gần nhất và milestone của phase hiện tại.
- Chuyển quyết định ổn định vào tài liệu authoritative; memory chỉ giữ pointer ngắn.
- Không lưu transcript, reasoning dài, diff hoặc raw command output.

## Handoff và Git

1. Commit code/spec/plan cùng verification trước.
2. Cập nhật memory trong commit kế tiếp, dùng commit trước làm `result_commit`.
3. Implementation đã duyệt có thể push theo workflow được giao.
4. Phân tích, brainstorming, spec hoặc plan phải được người dùng xác nhận trước khi push.
5. Phiên bị ngắt dùng `in_progress` hoặc `blocked`; không ghi `complete`.

## Kiểm tra

Chạy thường xuyên:

```bash
npm run memory:check
```

Khi sửa validator hoặc test fixture:

```bash
npm run memory:test
```

Không lưu secret, token, credential, personal data hoặc model-private reasoning trong memory.
