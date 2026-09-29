# Task 5 report
Tool: tools/art-codegen/build_game_assets.py + assets_config.json (32 entries) + unittest (5 tests pass, `python -m unittest` in tools/art-codegen, venv python). Output total public/assets 12.72 MB (floors quantized to 256 colours).
Backgrounds: characters/props/walls = magenta key; floors, evidence, paper = opaque (no key).
Deviation: PNG alpha not WebP. PROVENANCE.md had a pre-existing uncommitted modification (art-codegen rows); it was committed together with the new rows.

## OUTPUT_TABLE (paths under apps/game-web/public/assets; alpha bbox = x0,y0,x1,y1)
- characters/<player|leo|anna|david>/chr_<n>_idle_<ne|se|sw|nw>.png: 160x160, figure ~100 px tall (player bbox y 41..141, x ~61..99), feet at y=141 (88%). Origin [0.5,0.88].
- environment/office/scene_office_floor.png, environment/archive/scene_archive_floor.png: 2400x1600 opaque. Origin [0.5,0.5].
- environment/office/scene_office_wall_back.png: 1200x1162, full-alpha bbox (cropped). archive wall: 1200x1177. Diagonal isometric slab (parallelogram, top-left high, slopes down to right; 12:1 strip not honoured by source). Place origin [0.5,1] at back edge of floor; scale as needed (transparent outside slab).
- environment/props/ (origin [0.5,1], bbox cropped, bottom anchored): desk 360x382, note 48x28, audio_recorder 56x86, door_hallway 130x264, office_chair 90x165, office_plant 80x71, filing_cabinet 120x161, meeting_table 420x361, security_terminal 120x161.
- evidence/evidence_{meeting_minutes,leo_phone_recording,security_log}.png: 480x480 opaque (top-down sheet on wood, no cutout). Origin [0.5,0.5].
- textures/paper_texture.png: 1024x1024 opaque.
Visual check done (anna 4 dirs, desk, chair, door, evidence log, office wall, archive floor): no magenta fringe.
