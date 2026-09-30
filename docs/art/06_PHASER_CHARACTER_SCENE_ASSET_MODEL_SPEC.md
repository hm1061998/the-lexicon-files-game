# THE LEXICON FILES
# CHARACTER & SCENE ASSET MODEL SPECIFICATION FOR PHASER

> Tài liệu thiết kế mô hình nhân vật và cảnh dùng trực tiếp cho pipeline **Phaser 3 + React + TypeScript**.  
> Mục tiêu: giữ phong cách đồ họa gần với ảnh concept ban đầu — game 2D chiếu dimetric 2:1, vẽ tay, giấy cũ, màu trầm, điểm nhấn đỏ. Đây không phải world 3D.

---

# 1. Mục tiêu

Tài liệu này định nghĩa:

- Quy chuẩn nhân vật.
- Quy chuẩn sprite sheet.
- Hướng nhìn và animation.
- Quy chuẩn scene isometric.
- Layer scene.
- Props và foreground.
- Collision.
- Interaction point.
- Depth sorting.
- Asset naming.
- Export từ Blender/2D sang Phaser.
- Metadata JSON.
- Cấu trúc thư mục.
- Quy tắc để Codex hoặc artist không phá style.

---

# 2. Kiến trúc render

Không dùng Phaser để “vẽ” artwork.

Pipeline:

```text
Blender / 2D Artist / AI Concept
        ↓
Orthographic Isometric Render
        ↓
Stylization / Outline / Paper Look
        ↓
Transparent WebP / PNG
        ↓
Phaser Sprite / Image
```

Phaser chịu trách nhiệm:

```text
position
depth
animation
collision
camera
interaction
scene composition
```

React chịu trách nhiệm:

```text
dialogue
notebook
evidence
timeline
vocabulary
menus
```

---

# 3. Coordinate System

## 3.1. World Coordinate

Case #001 lưu mặt sàn trong logical plane `(u,v)`. Phép chiếu dimetric 2:1 tham chiếu ô 128×64 px:

```text
screenX = originX + (u - v) × 64
screenY = originY + (u + v) × 32 - elevationPx
```

`u+` đi SE, `v+` đi SW. Mapping bàn phím: W=`−u`/NW, D=`−v`/NE, S=`+u`/SE, A=`+v`/SW. Vận tốc tổ hợp được chuẩn hóa theo screen-space. Legacy scenes có thể tiếp tục dùng screen pixel qua adapter migration; mọi scene Case #001 hiện tại dùng logical position/bounds/collision.

Elevation chỉ dịch visual anchor lên màn hình; floor anchor, depth, collision và interaction range không đổi. Minimap dùng cùng logical source rồi chiếu sang diamond.

---

# 4. Camera Specification

Camera visual reference khi render asset:

```text
Projection: Orthographic dimetric 2:1
Horizontal rotation: 45°
Vertical viewing angle: 30°–38°
Recommended: 35°
```

Tất cả environment asset phải dùng **cùng camera reference**.

Không được render mỗi asset với một góc khác.

---

# 5. Visual Style Lock

Mọi character và scene asset phải tuân theo:

```text
STYLE_ID = "lexicon_isometric_v1"
```

## Palette

```text
Paper Cream       #D8C5A4
Light Beige       #CDBA97
Warm Gray         #A89B87
Dark Brown        #3E342B
Ink Black         #2A2521
Muted Green       #737660
Dusty Olive       #8A8469
Investigation Red #A4412D
Dark Red          #743026
```

## Style

```text
hand-drawn
ink outline
soft pencil shading
paper grain
low saturation
warm sepia
no glossy PBR
no neon
no strong bloom
```

---

# 6. Character Model Specification

## 6.1. Character Scale

Base reference:

```text
Adult height in world:
~150–170 px visible sprite height
at 1920×1080 reference resolution
```

Recommended export frame:

```text
256 × 256 px
```

hoặc:

```text
384 × 384 px
```

nếu cần chi tiết hơn.

Tất cả character frame phải dùng cùng canvas size.

> **Runtime contract:** Các annotation kích thước, anchor và collider trong ảnh concept chỉ dùng để minh họa visual target. Các giá trị trong tài liệu này là authoritative cho implementation và asset export.

---

# 7. Character Body Proportion

Phong cách:

```text
semi-realistic
slightly stylized
not chibi
not anime
not cartoon exaggerated
```

Tỉ lệ:

```text
Head : Body ≈ 1 : 6.5–7
```

Silhouette phải rõ khi thu nhỏ.

---

# 8. Main Player Design

## Investigator

Đặc điểm:

```text
brown trench coat
dark trousers
leather shoes
neutral shirt
small notebook
subtle shoulder bag optional
```

Không dùng màu quá nổi.

Player phải dễ nhận biết bằng:

```text
silhouette
coat length
slightly stronger outline
```

Không dùng red accent trên quần áo chính để tránh nhầm với clue.

---

# 9. NPC Design Rules

Mỗi NPC cần khác nhau ở:

```text
silhouette
hair
clothing shape
height impression
pose
portrait
```

Không chỉ đổi màu áo.

Ví dụ:

## Leo

```text
office shirt
rolled sleeves
dark trousers
slightly nervous posture
```

## Anna

```text
smart office wear
clean silhouette
lighter upper clothing
```

## David

```text
office manager
vest/jacket
more formal shape
```

---

# 10. Character Direction Set

MVP:

```text
NE
SE
SW
NW
```

Không cần 8 hướng ban đầu.

Mapping:

```text
NE = up-right
SE = down-right
SW = down-left
NW = up-left
```

---

# 11. Character Animation Set

Bắt buộc:

```text
idle_NE
idle_SE
idle_SW
idle_NW

walk_NE
walk_SE
walk_SW
walk_NW
```

Optional:

```text
interact
inspect
talk
read
sit
open_door
use_terminal
```

---

# 12. Animation Frame Count

## Idle

```text
4–6 frames
6 FPS
```

## Walk

```text
8–12 frames
10 FPS
```

## Interaction

```text
4–8 frames
8 FPS
```

Phong cách không cần quá mượt.

---

# 13. Character Sprite Sheet Layout

Khuyến nghị:

```text
player_walk.webp
```

Layout:

```text
row 0 → NE
row 1 → SE
row 2 → SW
row 3 → NW
```

Ví dụ:

```text
[NE1][NE2][NE3][NE4][NE5][NE6][NE7][NE8]
[SE1][SE2][SE3][SE4][SE5][SE6][SE7][SE8]
[SW1][SW2][SW3][SW4][SW5][SW6][SW7][SW8]
[NW1][NW2][NW3][NW4][NW5][NW6][NW7][NW8]
```

Frame:

```text
256 × 256
```

Sheet:

```text
2048 × 1024
```

với 8 frames × 4 rows.

---

# 14. Sprite Origin

Character origin:

```ts
sprite.setOrigin(0.5, 0.88);
```

Không dùng:

```ts
0.5, 0.5
```

vì feet position mới là world position thực.

---

# 15. Character Foot Anchor

Mọi frame phải có cùng vị trí chân.

Reference:

```text
canvas bottom
   ↓
~88% height = foot anchor
```

Không để animation “nhảy” do chân lệch.

---

# 16. Character Collision

Không dùng toàn bộ sprite làm collider.

Dùng footprint nhỏ ở chân, tách khỏi toàn bộ hình sprite. Với scene dimetric, collider player chạy trên logical plane `(u,v)` (hiện tại khoảng `0.36 × 0.36` ô); scene resolver cũng lưu obstacle footprint theo `u/v/width/height`. Phaser không dùng screen-space AABB của artwork làm collision shape.

Với legacy screen-space scene, Arcade body phải nhỏ và đặt sát chân. Ví dụ legacy:

```ts
player.body.setSize(30, 18);
player.body.setOffset(113, 205);
```

Thông số cuối phụ thuộc frame size.

---

# 17. Depth Sorting Character

Depth dùng projected floor-contact Y, có thể cộng `depthBias`:

```ts
player.setDepth(projectIso(logicalFeet, projection).y + depthBias);
```

`elevationPx` không tham gia depth sorting; chỉ thay đổi nơi sprite được vẽ. Player có tie-breaker nhỏ `0.01` để không nhấp nháy khi trùng depth prop.


---

# 18. Character Shadow

Shadow asset riêng:

```text
shadow_soft.webp
```

Size:

```text
50–70 px width
15–25 px height
```

Opacity:

```text
0.18–0.28
```

Shadow depth:

```text
player.y - 1
```

---

# 19. Character Metadata

Ví dụ:

```json
{
  "id": "player_detective",
  "spriteSheet": "characters/player/player_walk.webp",
  "frameWidth": 256,
  "frameHeight": 256,
  "origin": {
    "x": 0.5,
    "y": 0.88
  },
  "collision": {
    "width": 30,
    "height": 18
  },
  "animations": {
    "walk_NE": { "row": 0, "frames": 8, "fps": 10 },
    "walk_SE": { "row": 1, "frames": 8, "fps": 10 },
    "walk_SW": { "row": 2, "frames": 8, "fps": 10 },
    "walk_NW": { "row": 3, "frames": 8, "fps": 10 }
  }
}
```

---

# 20. Portrait Specification

Dialogue portrait:

```text
512 × 512
```

Crop:

```text
head + shoulders
```

States:

```text
neutral
nervous
angry
sad
surprised
```

Naming:

```text
leo_neutral.webp
leo_nervous.webp
leo_angry.webp
```

---

# 21. Scene Model Philosophy

Scene không render thành một ảnh duy nhất.

Dùng layer compositing.

Ví dụ:

```text
floor
walls
background props
interactive props
characters
foreground props
overlay
```

---

# 22. Scene Layer Standard

Mọi scene nên có:

```text
00_floor
10_back_wall
20_background
30_static_props
40_interactables
50_characters
60_foreground
70_fx
```

Phaser depth không nhất thiết đúng số trên, nhưng concept layer phải giữ.

---

# 23. Scene Asset Types

## A. Static Background

```text
floor
wall
window
door_frame
ceiling trim
```

## B. Static Props

```text
desk
chair
cabinet
plant
lamp
bookshelf
```

## C. Interactive Props

```text
document
terminal
drawer
phone
evidence
door
```

## D. Foreground Props

```text
front wall
large plant
column
partition
```

---

# 24. Scene Base Resolution

Reference:

```text
1920 × 1080
```

Scene có thể lớn hơn viewport:

```text
2560 × 1440
3840 × 2160
```

nhưng camera viewport vẫn 16:9.

---

# 25. Environment Export Strategy

Không export toàn bộ room thành một bitmap nếu object cần occlusion.

Tách:

```text
office_floor.webp
office_back_wall.webp
office_left_wall.webp
office_desk_01.webp
office_desk_02.webp
office_cabinet_01.webp
office_plant_01.webp
office_foreground_wall.webp
```

---

# 26. Scene Composition Example

```text
MeetingRoomScene
│
├── floor
├── backWall
├── leftWall
├── whiteboard
├── cabinet
├── meetingTable
├── chair01
├── chair02
├── chair03
├── reportDocument
├── player
├── npcLeo
└── foregroundWall
```

---

# 27. Prop Origin

Mỗi prop cần foot/base origin.

Ví dụ:

```ts
desk.setOrigin(0.5, 0.85);
chair.setOrigin(0.5, 0.90);
plant.setOrigin(0.5, 0.95);
```

World Y phải đại diện cho điểm prop chạm sàn.

---

# 28. Prop Depth

```ts
prop.setDepth(prop.y);
```

Nếu asset cao:

```ts
prop.setDepth(prop.y + depthBias);
```

Metadata:

```json
{
  "depthBias": 0
}
```

---

# 29. Occlusion

Nếu player đi sau prop lớn:

```text
player partially hidden
```

Optional improvement:

```text
foreground prop fades to 45%
```

khi player nằm sau.

Không fade mọi vật.

Chỉ áp dụng cho:

```text
large plants
columns
foreground walls
tall cabinets
```

---

# 30. Collision Shapes

Không dùng sprite rectangle mặc định.

Mỗi prop có footprint riêng trên cùng hệ tọa độ với scene. Scene dimetric khai báo collider rectangle bằng `u/v` và kích thước logical; chuyển động/collision được giải trước khi projector vẽ vị trí ra screen. Hình sprite có thể lớn hơn footprint.

Ví dụ bàn:

```text
visual:
diamond artwork projected from the logical plane

collision:
small polygon/rectangle near footprint
```

Metadata:

```json
{
  "position": { "u": 6, "v": 4 },
  "collision": { "type": "rect", "u": -0.7, "v": -0.25, "width": 1.4, "height": 0.5 }
}
```

---

# 31. Complex Collision Footprints

Runtime hiện dùng rectangle footprint trên logical plane. Object không đều có thể khai báo nhiều rectangle nhỏ; không lấy polygon screen-space từ silhouette sprite.

```json
{
  "collision": { "type": "rect", "u": -0.3, "v": -0.2, "width": 0.6, "height": 0.4 }
}
```

Không thêm physics engine khác cho case hiện tại; `game-web` giải collision logic trong `(u,v)`.

---

# 32. Interaction Point

Interaction không nhất thiết nằm tại sprite center. Với logical asset, offset `x/y` của metadata được hiểu là offset `u/v` trên floor plane; `radius` đo theo pixel màn hình. Anchor được project đúng một lần. Elevation của evidence tabletop ảnh hưởng visual anchor, không kéo theo floor/collision anchor.

Ví dụ tài liệu trên bàn:

Evidence đặt trên mặt bàn khai báo `restsOn` + `surfaceOffset` gồm `(u,v,elevationPx)`; interaction marker bám visual anchor trong khi depth/collision giữ floor anchor.

---

# 33. Interaction Marker

Marker asset:

```text
ui/world/interaction_diamond.webp
```

Size:

```text
24–36 px
```

Color:

```text
Investigation Red
```

Animation:

```text
float 4 px
duration 800–1200 ms
```

Không glow.

---

# 34. Scene JSON Definition

Ví dụ lịch sử theo screen pixel của scene Cartesian trước Phase 11D (chỉ tham khảo khi đọc legacy content; scene Case #001 hiện tại dùng `position: {u,v}` như hợp đồng §74):

Ví dụ:

```json
{
  "id": "meeting_room",
  "size": {
    "width": 16,
    "height": 12
  },
  "spawn": {
    "x": 1050,
    "y": 1100
  },
  "assets": [
    {
      "id": "floor",
      "type": "background",
      "texture": "meeting_floor",
      "x": 1200,
      "y": 800,
      "depth": -1000
    },
    {
      "id": "meeting_table",
      "type": "prop",
      "texture": "meeting_table_01",
      "x": 1420,
      "y": 820,
      "origin": [0.5, 0.86],
      "depthMode": "y",
      "collision": {
        "type": "rect",
        "width": 280,
        "height": 90
      }
    },
    {
      "id": "meeting_minutes",
      "type": "interactable",
      "texture": "evidence_meeting_minutes",
      "x": 1410,
      "y": 760,
      "origin": [0.5, 0.8],
      "interaction": {
        "radius": 90,
        "action": "readEvidence",
        "evidenceId": "meeting_minutes_01"
      }
    }
  ]
}
```

---

# 35. Scene Loader Architecture

Phaser scene không hardcode toàn bộ props.

Pseudo:

```ts
const sceneData = await loadSceneDefinition('meeting_room');

sceneData.assets.forEach(asset => {
  createSceneAsset(asset);
});
```

---

# 36. Asset Registry

Ví dụ:

```json
{
  "meeting_table_01": {
    "type": "image",
    "url": "/assets/environment/meeting/table_01.webp"
  },
  "meeting_minutes_01": {
    "type": "image",
    "url": "/assets/evidence/meeting_minutes.webp"
  }
}
```

---

# 37. Naming Convention

## Character

```text
chr_player_walk.webp
chr_leo_walk.webp
chr_anna_walk.webp
chr_david_walk.webp
```

## Portrait

```text
portrait_leo_neutral.webp
portrait_leo_nervous.webp
```

## Props

```text
prop_office_desk_01.webp
prop_office_chair_01.webp
prop_office_plant_01.webp
```

## Scene

```text
scene_office_floor.webp
scene_office_wall_back.webp
scene_office_wall_left.webp
```

## Evidence

```text
evidence_meeting_minutes.webp
evidence_security_log.webp
```

---

# 38. Folder Structure

```text
assets/
├── characters/
│   ├── player/
│   ├── leo/
│   ├── anna/
│   └── david/
│
├── portraits/
│
├── environment/
│   ├── shared/
│   ├── office/
│   ├── meeting-room/
│   └── archive/
│
├── evidence/
├── effects/
├── ui/
├── textures/
└── scene-data/
```

---

# 39. Blender Scene Setup

Mỗi Blender asset library dùng:

```text
Camera_ISO_MASTER
Light_Key
Light_Fill
Light_Ambient
Ground_Reference
Scale_Reference
```

Không chỉnh camera riêng cho từng prop.

---

# 40. Blender Unit Scale

Khuyến nghị:

```text
1 Blender unit = 1 meter
```

Character:

```text
~1.75 unit
```

Desk:

```text
~0.75 high
```

Door:

```text
~2.1 high
```

---

# 41. Blender Material Style

Không dùng realistic material.

Material:

```text
roughness high
metallic near zero
low contrast
muted colors
```

Render sau đó stylize.

---

# 42. Lighting Master

Suggested:

```text
Key light:
upper-left

Fill:
soft

Shadow:
soft
```

Mọi asset phải giữ cùng shadow direction.

---

# 43. Outline

Hai hướng:

## Option A — Blender Freestyle / Line Art

Render outline từ Blender.

## Option B — Post-process

Render base rồi thêm outline trong Krita/Photoshop.

Khuyến nghị:

```text
Option B
```

để kiểm soát style giống concept hơn.

---

# 44. Paper Texture

Không bake paper grain quá mạnh vào từng asset.

Asset:

```text
clean styled render
```

Toàn scene Phaser overlay:

```text
paper_texture.webp
```

Opacity:

```text
0.10–0.18
```

Như vậy texture đồng nhất.

---

# 45. Texture Atlas

Props nhỏ nên pack atlas.

Ví dụ:

```text
office_props.webp
office_props.json
```

Không atlas character animation chung với environment.

Character sheet để riêng.

---

# 46. Transparent Edge Rule

Export asset với:

```text
transparent background
premultiplied alpha safe
2–4 px padding
```

Không có white halo.

---

# 47. Web Asset Format

Ưu tiên:

```text
WebP
```

Nếu alpha edge lỗi:

```text
PNG
```

Audio:

```text
WebM/Ogg
MP3 fallback
```

---

# 48. File Size Targets

## Prop

```text
< 150 KB typical
```

## Character sheet

```text
< 1–2 MB
```

## Scene background

```text
< 1.5 MB each
```

MVP scene total:

```text
prefer < 5 MB core
```

---

# 49. Character Phaser Loader

```ts
this.load.spritesheet('player_walk', '/assets/characters/player/chr_player_walk.webp', {
  frameWidth: 256,
  frameHeight: 256
});
```

---

# 50. Character Animation Example

```ts
this.anims.create({
  key: 'player_walk_se',
  frames: this.anims.generateFrameNumbers('player_walk', {
    start: 8,
    end: 15
  }),
  frameRate: 10,
  repeat: -1
});
```

---

# 51. Direction Resolver

Resolver animation nhận vector screen-space sinh từ bước logic `(du,dv)`:

```ts
screenX = du - dv;
screenY = du + dv;
function resolveDirection(vx: number, vy: number) {
  if (vx >= 0 && vy < 0) return 'NE';
  if (vx >= 0 && vy >= 0) return 'SE';
  if (vx < 0 && vy >= 0) return 'SW';
  return 'NW';
}
```

Trục đơn theo projector: `−u → NW`, `−v → NE`, `+u → SE`, `+v → SW`. Quy tắc tie hiện tại giữ `SE` khi vector bằng 0.

---

# 52. World Position Standard

Character world position = **logical feet position `(u,v)`**.

Prop world position = **logical floor contact point `(u,v)`**; evidence trên mặt bàn có thêm visual elevation.

Project floor point bằng công thức §3 để tính render anchor và depth. Elevation chỉ dịch visual Y; không thay floor contact, collision, depth hoặc logical minimap position.

---

# 53. Scene Bounds

Mỗi scene JSON có:

```json
{
  "worldBounds": {
    "u": 0,
    "v": 0,
    "width": 16,
    "height": 12
  }
}
```

Bounds hiện tại là số ô logical; camera bounds lấy từ bốn góc đã chiếu:

```ts
const screenBounds = projectWorldBounds(worldBounds, projection);
this.cameras.main.setBounds(screenBounds.x, screenBounds.y, screenBounds.width, screenBounds.height);
```

---

# 54. Navigation

MVP:

```text
free movement over logical (u,v)
+
logical footprint collision and screen-space interaction radius
```

Không cần pathfinding.

NPC static hoặc scripted.

Post-MVP:

```text
navigation graph
```

---

# 55. Door Transition Model

Door metadata uses a logical position, logical footprint and logical destination spawn IDs:

```json
{
  "id": "door_to_archive",
  "type": "interactable",
  "position": { "u": 15, "v": 6 },
  "interaction": { "x": 0, "y": 0, "radius": 100,
    "transition": { "targetSceneId": "archive", "targetSpawnId": "from_office" } }
}
```

---

# 56. Spawn Point Model

Scene dimetric lưu spawn theo tọa độ logic; cặp pixel chỉ dành cho legacy scene.

```json
{
  "spawnPoints": {
    "default": { "u": 8, "v": 10 },
    "from_archive": { "u": 14, "v": 7 },
    "from_meeting_room": { "u": 4, "v": 8 }
  }
}
```

---

# 57. Foreground Fade

Metadata:

```json
{
  "fadeWhenPlayerBehind": true,
  "fadeAlpha": 0.45
}
```

Phaser:

```ts
foreground.setAlpha(playerBehind ? 0.45 : 1);
```

Transition:

```text
150–250 ms
```

---

# 58. Scene Visual Composition Rules

Mỗi scene cần:

```text
1 primary visual landmark
2–4 interactables
3–8 supporting props
clear walking routes
clear foreground/background separation
```

Không clutter.

---

# 59. Office Scene Model

Suggested:

```text
Main Office
│
├── floor
├── left investigation room
├── desks
├── archive entrance
├── meeting room glass wall
├── water dispenser
├── plants
└── foreground partition
```

Visual anchor:

```text
Meeting Room
```

---

# 60. Meeting Room Model

Suggested:

```text
Meeting Room
│
├── large table
├── 8 chairs
├── whiteboard
├── cabinet
├── plant
├── coffee mug
└── meeting minutes
```

Primary evidence:

```text
meeting minutes
```

---

# 61. Archive Scene Model

Suggested:

```text
Archive
│
├── shelves
├── boxes
├── ladder
├── security terminal
├── audio recorder
└── filing cabinets
```

Visual density cao hơn office.

---

# 62. Interaction Outline

Không generate dynamic neon outline.

Có thể dùng:

```text
duplicate sprite
tint dark-red
slightly scale
```

hoặc:

```text
pre-rendered highlight asset
```

Nếu outline shader gây khác style, dùng diamond marker thay thế.

---

# 63. Phaser Post FX

Chỉ subtle:

```text
paper grain
light vignette
slight sepia
```

Không dùng:

```text
bloom
chromatic aberration mạnh
heavy blur
```

---

# 64. Paper Overlay

```ts
const paper = this.add.image(
  this.scale.width / 2,
  this.scale.height / 2,
  'paper_overlay'
);

paper
  .setScrollFactor(0)
  .setDepth(999999)
  .setAlpha(0.12);
```

Nếu UI React nằm trên canvas, paper overlay cho world chỉ nằm trong Phaser.

> Cập nhật Phase 11B: overlay hạt giấy của world hiện là lớp CSS `.game-paper-overlay` (sau canvas, trước HUD), không còn là ảnh Phaser, vì lớp Phaser làm giảm ~34% fps trên GL phần mềm (xem `docs/ai/2026-09-30-phase-11b-verification.md`).

React UI tự dùng background texture riêng.

---

# 65. Scene Manifest

Mỗi scene có manifest preload; trong code, danh sách này là trường `textures` của scene JSON trong `packages/game-content` (sheet nhân vật `characterSheets` và `sharedTextures` nằm ở `case.json`/`CaseDefinition`), tải bằng `loadSceneTextures` khi vào scene:

```json
{
  "sceneId": "meeting_room",
  "textures": [
    "meeting_floor",
    "meeting_wall_back",
    "meeting_table_01",
    "meeting_chair_01",
    "meeting_minutes"
  ],
  "characters": [
    "player_detective"
  ]
}
```

---

# 66. Loading Rule

Chỉ load asset của case/scene hiện tại.

Không load toàn bộ game.

Flow:

```text
Case load
↓
Scene manifest
↓
Preload
↓
Create
↓
Play
```

---

# 67. Character State Machine

```text
IDLE
MOVE
INTERACT
DIALOGUE
LOCKED
```

Không cho movement khi:

```text
critical React modal open
dialogue active
scene transition
```

---

# 68. Character Animation State

Ví dụ:

```ts
type CharacterVisualState = {
  direction: 'NE' | 'SE' | 'SW' | 'NW';
  action: 'idle' | 'walk' | 'interact';
};
```

Animation key:

```ts
`${actor}_${action}_${direction}`
```

---

# 69. NPC Placement

NPC world position cũng dùng foot anchor.

Metadata:

```json
{
  "npcId": "leo",
  "x": 1350,
  "y": 680,
  "direction": "SW"
}
```

---

# 70. Character Interaction Radius

NPC:

```text
80–110 px
```

Small evidence:

```text
60–90 px
```

Door:

```text
90–120 px
```

Không yêu cầu player đứng pixel-perfect.

---

# 71. Visual QA Checklist

Trước khi asset được đưa vào game:

## Character

- đúng camera angle?
- chân cùng anchor?
- sprite không nhảy?
- 4 hướng đồng nhất?
- silhouette rõ?
- palette đúng?
- outline đúng?
- không quá bão hòa?

## Prop

- đúng camera?
- scale đúng?
- shadow cùng hướng?
- transparent sạch?
- origin xác định?
- collider metadata có?
- depth đúng?

## Scene

- player không bị mất?
- đường đi rõ?
- interaction nổi vừa đủ?
- foreground hoạt động?
- không clutter?
- màu đỏ chỉ dùng cho clue?

---

# 72. Asset Acceptance Gate

Asset chỉ được merge khi có:

```text
image file
metadata
preview screenshot
scale check
depth check
collision check
```

---

# 73. Codex Implementation Rule

Codex không được tự tạo “temporary rectangle art” trong production scene sau phase prototype.

Khi production asset chưa có:

```text
use clearly labeled placeholder
```

Ví dụ:

```text
PLACEHOLDER_DESK
```

Không được xem placeholder là final.

---

# 74. Scene Data Contract

Hợp đồng dưới đây mô tả scene dimetric hiện hành. `position` và `worldBounds` dùng logical plane; không trộn tọa độ pixel màn hình vào scene Case #001.

TypeScript:

```ts
export interface SceneAssetDefinition {
  id: string;
  type:
    | 'background'
    | 'wall'
    | 'prop'
    | 'interactable'
    | 'npc';

  texture: string;

  /** Legacy pixel position; không dùng trong scene dimetric Case #001. */
  x?: number;
  y?: number;
  position?: { u: number; v: number };
  restsOn?: string;
  surfaceOffset?: { u: number; v: number; elevationPx: number };

  origin?: [number, number];

  depth?: number;
  depthBias?: number;

  collision?:
    | { type: 'rect'; x: number; y: number; width: number; height: number }
    | { type: 'rect'; u: number; v: number; width: number; height: number };
  interaction?: { x: number; y: number; radius: number };
}

export interface DimetricSceneDefinition {
  id: string;
  projection: { type: 'dimetric-2:1'; originX: number; originY: number; tileWidth: 128; tileHeight: 64 };
  worldBounds: { u: number; v: number; width: number; height: number };
  spawnPoints: Record<string, { u: number; v: number }>;
  assets: SceneAssetDefinition[];
}
```

---

# 75. Character Texture Manifest Contract

`characterSheets` là registry texture của `case.json`; cấu trúc runtime hiện tại như sau:

```ts
export type CharacterSheets = Record<
  string,
  {
    idle: Record<'NE' | 'SE' | 'SW' | 'NW', string>;
    walk: string | null;
  }
>;

// The manifest texture entry uses frameWidth/frameHeight for walk sheets.
// Runtime walk animation: 8 columns × 4 rows, 160×160 per cell, 10 fps.
type WalkTextureEntry = { key: string; url: string; frameWidth: 160; frameHeight: 160 };
```

Các sheet đi bộ có thứ tự hàng NE, SE, SW, NW; mỗi sheet là lưới 8×4 ô 160×160 px. Walk animation chỉ chạy khi được điều khiển, không tự làm NPC di chuyển.

---

# 76. Asset Pipeline Summary

```text
Concept
↓
3D blockout / illustration
↓
Master isometric camera
↓
Render
↓
Outline / stylization
↓
Color correction
↓
Transparent export
↓
Metadata
↓
Phaser preload
↓
Scene composition
↓
Depth/collision QA
```

---

# 77. MVP Asset Checklist

## Player

```text
1 detective
4 idle directions
4 walk directions
```

## NPC

```text
Leo
Anna
David
```

Mỗi NPC:

```text
idle 4 directions
portrait neutral
portrait alternate expression
```

## Office

```text
4 desks
4 chairs
2 cabinets
2 plants
1 coat rack
2 lamps
1 water dispenser
```

## Meeting Room

```text
1 large table
8 chairs
1 whiteboard
1 cabinet
1 plant
1 coffee mug
1 report
```

## Archive

```text
4 shelves
boxes
1 ladder
2 cabinets
1 terminal
1 audio recorder
```

---

# 78. Final Visual Target

Kết quả runtime phải tạo cảm giác:

```text
Illustrated detective dossier
+
isometric office exploration
+
hand-drawn architecture
+
paper texture
+
muted sepia
+
dark-red clues
```

Nếu scene trông giống:

```text
generic Phaser game
pixel art
flat vector web UI
modern glossy 3D
```

thì chưa đạt yêu cầu.

---

# 79. Golden Rules

1. Mọi asset cùng camera.
2. Feet/base point là world position.
3. Depth dựa vào world Y.
4. Collision dùng footprint, không dùng full sprite.
5. Scene phải layer hóa.
6. Không render room thành một ảnh duy nhất nếu cần occlusion.
7. Paper texture dùng chủ yếu ở scene level.
8. Red chỉ cho investigation accent.
9. Placeholder không được trở thành production asset.
10. Artist, Blender và Phaser đều phải dùng cùng asset specification.
