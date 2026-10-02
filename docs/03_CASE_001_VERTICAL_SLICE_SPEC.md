# The Lexicon Files — Case #001 Vertical Slice Specification

# CASE 001 — THE MISSING REPORT

## 1. Purpose

Case này là vertical slice đầu tiên.

Mục tiêu không phải tạo nhiều content mà chứng minh toàn bộ core loop hoạt động:

```text
Move
→ Interact
→ Read
→ Learn
→ Collect Evidence
→ Talk
→ Build Timeline
→ Detect Contradiction
→ Solve Case
```

Target playtime:

```text
20–30 minutes
```

Language:

```text
A2–B1
```

---

# 2. Premise

Một báo cáo nội bộ quan trọng biến mất khỏi phòng họp sau cuộc họp tối hôm trước.

Có ba người có khả năng tiếp cận:

- Leo Tran — Operations Analyst
- Anna Reed — Project Coordinator
- David Cole — Office Manager

Người chơi phải xác định ai đã lấy bản report.

---

# 3. Truth

> **David took the report.**

Không hiển thị truth cho user.

Truth chỉ tồn tại trong case data.

---

# 4. Core Timeline

```text
20:00 Meeting begins
20:18 Anna leaves meeting room
20:27 Leo steps out to take a phone call
20:32 David enters meeting room
20:36 David leaves meeting room
20:40 Leo returns
20:45 Meeting ends
21:05 Report is reported missing
```

---

# 5. Scenes

## Scene A — Main Office

Purpose:

- spawn;
- tutorial movement;
- first objective;
- meet Anna.

Objects:

- player desk;
- objective note;
- Anna;
- hallway door.

## Scene B — Meeting Room

Purpose:

- primary evidence;
- visual anchor;
- report location.

Objects:

- meeting table;
- chairs;
- whiteboard;
- coffee mug;
- meeting minutes;
- empty report folder.

## Scene C — Archive / Security Corner

Purpose:

- security log;
- audio device;
- final contradiction support.

Objects:

- cabinet;
- security terminal;
- phone recording;
- archive files.

---

# 6. Player Start

Spawn:

```text
Main Office
```

Initial Objective:

```text
MỤC TIÊU HIỆN TẠI
○ Tìm hiểu điều gì đã xảy ra với bản báo cáo
```

Chief message (briefing, shown as a memo when a new case starts; authored in `case.json` → `briefing`):

> Welcome to the International Investigation Bureau, Junior Investigator.  
> A confidential report disappeared after last night's meeting.  
> Start with the meeting room and speak to everyone who had access.  
> Read carefully. Every word is a clue.

---

# 7. NPC

## 7.1. Anna Reed

Role:

```text
Project Coordinator
```

Truthful.

Statement:

> I left the meeting early. I had a call with a client at around eight twenty.

Key facts:

```text
Anna left around 20:18.
Anna did not return.
```

Target vocabulary:

```text
client
meeting
early
leave
return
```

---

## 7.2. Leo Tran

Role:

```text
Operations Analyst
```

Mostly truthful.

Statement:

> I stepped outside to take a phone call, but I came back before the meeting ended.

Key facts:

```text
Leo left temporarily.
Leo returned around 20:40.
```

Vocabulary:

```text
step outside
phone call
return
before
ended
```

---

## 7.3. David Cole

Role:

```text
Office Manager
```

Suspect.

Initial statement:

> I didn't enter the meeting room after eight.

This is false.

Key contradiction:

```text
David statement:
didn't enter after 20:00

Security log:
David entered 20:32
```

---

# 8. Evidence

## Evidence 1 — Meeting Minutes

Location:

```text
Meeting Room / table
```

Text:

> The meeting began at 8:00 PM.  
> Anna left early for a client call.  
> Leo stepped outside for several minutes.  
> The meeting ended at 8:45 PM.

Facts:

```text
meeting_start_20_00
anna_left_early
leo_temporarily_left
meeting_end_20_45
```

Vocabulary:

```text
began
client
several
ended
```

---

## Evidence 2 — Empty Report Folder

Location:

```text
Meeting Room / table
```

Description:

> The folder is empty. A label reads: “Quarterly Risk Report — Confidential.”

Fact:

```text
report_was_on_table
```

Vocabulary:

```text
folder
confidential
quarterly
report
```

---

## Evidence 3 — Security Access Log

Location:

```text
Archive / security terminal
```

Content:

```text
20:18  Anna Reed    EXIT
20:27  Leo Tran     EXIT
20:32  David Cole   ENTRY
20:36  David Cole   EXIT
20:40  Leo Tran     ENTRY
```

Facts:

```text
anna_exit_20_18
leo_exit_20_27
david_entry_20_32
david_exit_20_36
leo_entry_20_40
```

Vocabulary:

```text
entry
exit
access
security
log
```

---

## Evidence 4 — Coffee Receipt

Location:

```text
Main Office / David's desk
```

Text:

```text
CAFÉ NORTH
20:48
Americano
```

Purpose:

David dùng receipt để tạo impression rằng anh ta không ở meeting room trước đó.

Không phải contradiction chính.

Vocabulary:

```text
receipt
purchase
time
```

---

## Evidence 5 — Phone Recording

Location:

```text
Archive / audio device
```

Audio text:

> Leo: “Hi, I'm outside the meeting room. I'll call you back in a few minutes.”

Timestamp:

```text
20:29
```

Supports:

```text
Leo was outside at 20:29
```

Listening task:

Người chơi chọn:

```text
Where was Leo?
A. Inside the meeting room
B. Outside the meeting room
C. At home
```

Correct:

```text
B
```

---

# 9. Objectives

## Objective 1

```text
Inspect the meeting room
```

Complete when:

```text
meeting_minutes discovered
AND
empty_report_folder discovered
```

## Objective 2

```text
Talk to Anna, Leo, and David
```

Complete when all initial dialogue branches completed.

## Objective 3

```text
Check the security records
```

Complete when access log discovered.

## Objective 4

```text
Compare David's statement with the evidence
```

Complete when contradiction selected.

## Objective 5

```text
Submit your conclusion
```

Activate when challenge dialogue completes and `david_took_report` is unlocked.

Complete on correct accusation.

---

# 10. Dialogue Flow

## Anna

Initial:

> I left the meeting early. I had a call with a client.

Choices:

```text
1. What time did you leave?
2. Did you return later?
3. Who was still in the room?
```

Responses:

### 1

> A little after eight fifteen.

### 2

> No. I went directly to my desk.

### 3

> Leo and the team were still there.

---

## Leo

Initial:

> I stepped outside to take a phone call.

Choices:

```text
1. When did you leave?
2. When did you return?
3. Did you see David?
```

Responses:

### 1

> Around eight twenty-five.

### 2

> Around eight forty.

### 3

> I saw him in the hallway before I went outside.

---

## David

Initial:

> I didn't enter the meeting room after eight.

Choices:

```text
1. Where were you?
2. Did you see the report?
3. Are you sure you didn't enter the room?
```

### 1

> I was working at my desk.

### 2

> I saw it during the meeting, but not afterward.

### 3

Before contradiction unlocked:

> Yes. I'm certain.

After contradiction unlocked:

> ...I may have gone in for a moment.

---

# 11. Contradiction

Required facts:

```text
david_statement_no_entry_after_20_00
david_entry_20_32
```

UI:

```text
CONTRADICTION FOUND

David:
"I didn't enter the meeting room after eight."

Security Log:
20:32 — David Cole — ENTRY
```

Effect:

```text
unlock dialogue node:
challenge_david
```

---

# 12. Challenge Dialogue

Player option:

> But the security log shows that you entered at 8:32.

David:

> I only went in to collect a folder.

Player option:

> Which folder?

David:

> The Quarterly Risk Report. I found an error I had missed and panicked. I took it to correct it before anyone noticed.

New facts:

```text
david_collected_folder
david_took_report
```

---

# 13. Final Deduction

Available when:

```text
david_took_report unlocked
```

Screen:

```text
WHO TOOK THE REPORT?

Anna Reed
Leo Tran
David Cole
```

Nếu chọn David:

```text
CASE CLOSED
```

Nếu chọn sai:

```text
The evidence doesn't fully support this conclusion.
Review the timeline.
```

Không game over.

---

# 14. Case Summary

```text
CASE CLOSED

The Missing Report
────────────────────

Evidence Found          5/5
Key Contradiction       Found
People Interviewed      3/3
Vocabulary Encountered  20
Listening Task          Completed
Hints Used              X
```

---

# 15. Vocabulary Target List

```text
meeting
client
early
leave
return
before
end
report
confidential
folder
access
security
entry
exit
log
receipt
purchase
outside
several
certain
```

---

# 16. Grammar Targets

## Past Simple

```text
left
entered
returned
ended
began
```

## Time Expressions

```text
at 8:00
around 8:20
before
after
a few minutes
```

## Statement contradiction

```text
I didn't enter...
The log shows...
```

---

# 17. Tutorial Constraints

Không hiện modal tutorial dài.

Tutorial dạng contextual.

Ví dụ khi đến object đầu:

```text
[E] Interact
```

Lần đầu mở notebook:

```text
[J] Notebook
```

Lần đầu có vocabulary inspect:

```text
Click an underlined word to inspect it.
```

Sau đó không hiện lại.

---

# 18. UI Requirements

Top left:

```text
Current Objective
```

Top right:

```text
Case Progress
```

Bottom:

```text
E Interact
J Notebook
M Map
Esc Pause
```

Notebook:

```text
Case
People
Evidence
Vocabulary
Timeline
```

---

# 19. Scene Asset List

## Main Office

```text
floor
wall
desk x4
chair x4
cabinet x2
plant x2
coat rack
papers
lamp
computer
```

## Meeting Room

```text
meeting table
chairs x8
whiteboard
cabinet
plant
coffee mug
documents
report folder
```

## Archive

```text
archive shelf x4
boxes
security terminal
audio recorder
desk
lamp
```

---

# 20. Functional Acceptance Criteria

Vertical slice hoàn thành khi:

- player di chuyển WASD;
- collision hoạt động;
- camera follow hoạt động;
- 3 scene chuyển được;
- interaction prompt hoạt động;
- 5 evidence thu thập được;
- notebook cập nhật realtime;
- 3 NPC dialogue hoạt động;
- vocabulary tooltip hoạt động;
- audio có replay;
- security log unlock fact;
- contradiction detection hoạt động;
- objective progression hoạt động;
- final accusation hoạt động;
- save/load local hoạt động;
- refresh browser không mất progress;
- case summary hiển thị.

---

# 21. Non-Functional Criteria

Desktop:

```text
60 FPS target
30 FPS minimum
```

Initial load:

```text
Prefer < 5 MB for vertical slice core assets
```

Case assets:

lazy-load per scene.

No runtime console errors.

Keyboard controls phải disable khi đang nhập text field.

---

# 22. Out of Scope

Không làm trong Case #001:

```text
AI dialogue
voice recognition
multiplayer
procedural evidence
random suspect
dynamic ending
inventory crafting
combat
complex stealth
```

---

# 23. Completion Definition

Vertical slice được coi là đạt nếu một người chưa biết thiết kế có thể:

1. mở game;
2. hiểu objective;
3. tự di chuyển;
4. tìm evidence;
5. hiểu cơ bản document;
6. nói chuyện NPC;
7. mở notebook;
8. phát hiện contradiction;
9. chọn đúng nghi phạm;
10. hoàn thành case trong 20–30 phút.
