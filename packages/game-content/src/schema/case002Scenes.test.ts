import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import officeRaw from '../../cases/case-002/scenes/main_office.json';
import mailRoomRaw from '../../cases/case-002/scenes/mail_room.json';
import receptionRaw from '../../cases/case-002/scenes/reception.json';
import { parseSceneDefinition } from './scene';
import { validateSceneGeometry } from '../geometry/sceneGeometry';

const rawScenes = [officeRaw, mailRoomRaw, receptionRaw];
const scenes = () => rawScenes.map((raw) => parseSceneDefinition(raw, `case-002/${raw.id}`));

describe('Case #002 scenes', () => {
  it('parses all three scenes', () => {
    expect(scenes().map(({ id }) => id)).toEqual(['main_office', 'mail_room', 'reception']);
  });

  it('has no geometry errors', () => {
    for (const scene of scenes()) expect(validateSceneGeometry(scene), scene.id).toEqual([]);
  });

  it('exposes exactly the interaction ids of the shared identifier table per scene', () => {
    const expected: Record<string, string[]> = {
      main_office: [
        'delivery_note',
        'chat_messages',
        'anna',
        'leo',
        'door_to_mail_room',
        'door_to_reception',
      ],
      mail_room: ['mailroom_access_log', 'label_printer_log', 'door_to_office'],
      reception: [
        'courier_receipt',
        'client_complaint_email',
        'david',
        'door_to_office_from_reception',
      ],
    };
    for (const scene of scenes()) {
      expect(
        scene.assets
          .filter((asset) => asset.interaction)
          .map(({ id }) => id)
          .sort(),
        scene.id,
      ).toEqual([...expected[scene.id]!].sort());
    }
  });

  it('wires doors to existing target scenes and spawn ids', () => {
    const parsed = scenes();
    const routes: Record<string, { targetSceneId: string; targetSpawnId: string }> = {
      door_to_mail_room: { targetSceneId: 'mail_room', targetSpawnId: 'from_office' },
      door_to_reception: { targetSceneId: 'reception', targetSpawnId: 'from_office' },
      door_to_office: { targetSceneId: 'main_office', targetSpawnId: 'from_mail_room' },
      door_to_office_from_reception: {
        targetSceneId: 'main_office',
        targetSpawnId: 'from_reception',
      },
    };
    const doors = parsed.flatMap((scene) =>
      scene.assets.filter((asset) => asset.interaction?.transition),
    );
    expect(doors).toHaveLength(4);
    for (const door of doors) {
      const transition = door.interaction!.transition!;
      expect(transition, door.id).toEqual(routes[door.id]);
      const target = parsed.find((scene) => scene.id === transition.targetSceneId);
      expect(target?.spawnPoints).toHaveProperty(transition.targetSpawnId);
    }
  });

  it('uses only textures that exist under apps/game-web/public/assets', () => {
    for (const scene of scenes()) {
      for (const texture of scene.textures) {
        expect(texture.url).toMatch(/^\/assets\//);
        const path = fileURLToPath(
          new URL(`../../../../apps/game-web/public${texture.url}`, import.meta.url),
        );
        expect(existsSync(path), `${scene.id}: ${texture.url}`).toBe(true);
      }
    }
  });

  it('has a default spawn in every scene', () => {
    for (const scene of scenes()) expect(scene.spawnPoints).toHaveProperty('default');
  });

  it('connects each evidence point and NPC to its content identifier', () => {
    const evidenceIds = [
      'delivery_note',
      'chat_messages',
      'mailroom_access_log',
      'label_printer_log',
      'courier_receipt',
      'client_complaint_email',
    ];
    const assets = scenes().flatMap((scene) => scene.assets);
    for (const id of evidenceIds) {
      const asset = assets.find((candidate) => candidate.id === id);
      expect(asset?.interaction?.effects, id).toEqual([{ type: 'addEvidence', evidenceId: id }]);
      expect(asset?.cue, id).toEqual({ kind: 'evidence', evidenceId: id });
    }
    for (const id of ['anna', 'leo', 'david']) {
      expect(assets.find((asset) => asset.id === id)?.interaction?.npcId, id).toBe(id);
    }
  });
});
