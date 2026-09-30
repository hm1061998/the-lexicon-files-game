# Concept Art Usage

Các file WebP trong thư mục này là **visual target** cho bố cục, không khí, palette, silhouette và phong cách minh họa.

Chúng không phải numeric runtime contract. Khi annotation trong concept khác `docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md`, dùng giá trị trong tài liệu `art/06`. Contract hiện tại cho character là:

```text
runtime frame: 160 × 160 px (walk sheet)
origin: (0.5, 0.88)
walk sheet: 8 × 4 frame, 1280 × 640 px, 10 fps; chân neo ở 88% chiều cao
collider: footprint nhỏ trong logical plane `(u,v)`, không lấy từ bounds của sprite
```

Trong `ingame_main_office_hud.webp`, key hint `Space — Né` là concept cũ và **không thuộc MVP**. Control contract của MVP nằm trong `docs/01_GAME_DESIGN_DOCUMENT.md` và `docs/03_CASE_001_VERTICAL_SLICE_SPEC.md`; MVP không có dodge mechanic.

Trong scene Meeting Room, tài liệu người chơi đọc là **Meeting Minutes**. **Quarterly Risk Report** là vật bị mất và không được dùng làm tên cho evidence/texture của meeting minutes.
