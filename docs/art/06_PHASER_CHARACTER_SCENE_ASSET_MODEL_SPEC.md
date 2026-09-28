# THE LEXICON FILES
# CHARACTER & SCENE ASSET MODEL SPECIFICATION FOR PHASER

> Tài liệu thiết kế mô hình nhân vật và cảnh dùng trực tiếp cho pipeline **Phaser 3 + React + TypeScript**.  
> Mục tiêu: giữ phong cách đồ họa gần với ảnh concept ban đầu — isometric 2.5D, vẽ tay, giấy cũ, màu trầm, điểm nhấn đỏ.

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

Phaser vẫn sử dụng hệ:

```text
X → ngang màn hình
Y → dọc màn hình
```

Với scene isometric prerendered, không bắt buộc chuyển tile coordinate.

Player và props dùng world coordinate trực tiếp.

---

# 4. Camera Specification

Camera visual reference khi render asset:

```text
Projection: Orthographic
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

Dùng collider nhỏ ở chân:

```text
width: 24–36 px
height: 14–22 px
```

Ví dụ:

```ts
player.body.setSize(30, 18);
player.body.setOffset(113, 205);
```

Thông số cuối phụ thuộc frame size.

---

# 17. Depth Sorting Character

Runtime:

```ts
player.setDepth(player.y);
```

hoặc:

```ts
player.setDepth(player.y + depthOffset);
```

Depth dựa trên **feet Y**, không dựa trên sprite center.

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

Mỗi prop cần collider riêng.

Ví dụ bàn:

```text
visual:
large isometric rectangle

collision:
small polygon/rectangle near footprint
```

Metadata:

```json
{
  "collision": {
    "type": "rect",
    "x": -80,
    "y": -28,
    "width": 160,
    "height": 56
  }
}
```

---

# 31. Polygon Collision

Cho object irregular:

```json
{
  "collision": {
    "type": "polygon",
    "points": [
      [-60, -20],
      [0, -42],
      [60, -20],
      [0, 12]
    ]
  }
}
```

Nếu dùng Arcade Physics, có thể simplify thành rectangle.

Matter.js chỉ dùng nếu thật sự cần polygon precision.

---

# 32. Interaction Point

Interaction không nhất thiết nằm tại sprite center.

Ví dụ tài liệu trên bàn:

```json
{
  "interaction": {
    "x": 0,
    "y": 10,
    "radius": 80
  }
}
```

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

Ví dụ:

```json
{
  "id": "meeting_room",
  "size": {
    "width": 2400,
    "height": 1600
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

Pseudo:

```ts
function resolveDirection(vx: number, vy: number) {
  if (vx >= 0 && vy < 0) return 'NE';
  if (vx >= 0 && vy >= 0) return 'SE';
  if (vx < 0 && vy >= 0) return 'SW';
  return 'NW';
}
```

---

# 52. World Position Standard

Character world position = **feet position**.

Prop world position = **floor contact point**.

Đây là rule quan trọng nhất để depth sorting đúng.

---

# 53. Scene Bounds

Mỗi scene JSON có:

```json
{
  "worldBounds": {
    "x": 0,
    "y": 0,
    "width": 2400,
    "height": 1600
  }
}
```

Camera:

```ts
this.cameras.main.setBounds(0, 0, 2400, 1600);
```

---

# 54. Navigation

MVP:

```text
free movement
+
collision
```

Không cần pathfinding.

NPC static hoặc scripted.

Post-MVP:

```text
navigation graph
```

---

# 55. Door Transition Model

Door metadata:

```json
{
  "id": "door_to_archive",
  "type": "transition",
  "x": 2200,
  "y": 700,
  "radius": 80,
  "targetScene": "archive",
  "targetSpawn": "from_office"
}
```

---

# 56. Spawn Point Model

```json
{
  "spawnPoints": {
    "default": [1100, 1050],
    "from_archive": [2000, 720],
    "from_meeting_room": [420, 820]
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

React UI tự dùng background texture riêng.

---

# 65. Scene Manifest

Mỗi scene có manifest preload:

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

TypeScript:

```ts
export interface SceneAssetDefinition {
  id: string;
  type:
    | 'background'
    | 'prop'
    | 'interactable'
    | 'foreground'
    | 'transition';

  texture: string;

  x: number;
  y: number;

  origin?: [number, number];

  depth?: number;
  depthMode?: 'fixed' | 'y';

  depthBias?: number;

  collision?: CollisionDefinition;

  interaction?: InteractionDefinition;

  fadeWhenPlayerBehind?: boolean;
}
```

---

# 75. Character Data Contract

```ts
export interface CharacterDefinition {
  id: string;

  spriteSheet: string;

  frameWidth: number;
  frameHeight: number;

  origin: [number, number];

  collision: {
    width: number;
    height: number;
    offsetX?: number;
    offsetY?: number;
  };

  directions: Array<'NE' | 'SE' | 'SW' | 'NW'>;

  animations: Record<string, AnimationDefinition>;
}
```

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
