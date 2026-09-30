"""Offline structural, WAV, identity, and text-hash validation for Case 001 audio."""
import hashlib
import json
import wave
from pathlib import Path
import sys

CUES = ('footstep', 'paper', 'ui', 'evidence', 'door', 'dialogue')


def validate_assets(repo_root: Path) -> list[str]:
    case_dir = repo_root / 'packages/game-content/cases/case-001'
    public = repo_root / 'apps/game-web/public'
    audio_root = public / 'audio/case-001'
    issues: list[str] = []
    try:
        dialogues = json.loads((case_dir/'dialogues.json').read_text(encoding='utf-8'))['dialogues']
        case = json.loads((case_dir/'case.json').read_text(encoding='utf-8'))
    except (OSError, KeyError, json.JSONDecodeError) as error:
        return [f'audio content could not be read: {error}']
    try:
        provenance = json.loads((audio_root/'provenance.json').read_text(encoding='utf-8'))
    except (OSError, json.JSONDecodeError) as error:
        issues.append(f'provenance file is unreadable: {error}')
        provenance = {'clips': {}}
    if not case.get('audio'):
        return []
    clips = provenance.get('clips')
    if not isinstance(clips, dict):
        return ['provenance.clips must be an object']
    expected_dialogues = 0
    for tree in dialogues:
        for node in tree.get('nodes', []):
            expected_dialogues += 1
            identity = f"{tree['id']}/{node['id']}"
            audio = node.get('audio')
            if not audio:
                issues.append(f'{identity}: missing dialogue audio reference')
                continue
            text_hash = hashlib.sha256(node['text'].encode('utf-8')).hexdigest()
            if audio.get('textSha256') != text_hash:
                issues.append(f'{identity}: dialogue text hash does not match content')
            url = audio.get('url', '')
            if not url.startswith('/audio/case-001/') or '..' in url:
                issues.append(f'{identity}: unsafe dialogue audio URL {url!r}')
                continue
            path = public / url.lstrip('/')
            entry = clips.get(identity)
            if not path.is_file():
                issues.append(f'{identity}: missing WAV {url}')
                continue
            if not isinstance(entry, dict):
                issues.append(f'{identity}: missing provenance entry')
                continue
            if entry.get('speakerId') != node.get('speakerId'):
                issues.append(f'{identity}: provenance speaker does not match dialogue node')
            if entry.get('textSha256') != text_hash:
                issues.append(f'{identity}: provenance text hash does not match dialogue node')
            _validate_wav(path, identity, entry, issues)
    if len(clips) != expected_dialogues:
        issues.append(f'provenance dialogue coverage mismatch: {len(clips)}/{expected_dialogues}')

    sfx = case['audio'].get('sfx', {})
    sfx_provenance = provenance.get('sfx', {})
    sound_hashes: dict[str, str] = {}
    for cue in CUES:
        urls = sfx.get(cue, [])
        if len(urls) < (2 if cue == 'footstep' else 1):
            issues.append(f'audio.sfx.{cue}: missing required clip coverage')
        if len(set(urls)) != len(urls):
            issues.append(f'audio.sfx.{cue}: clip URLs must be distinct')
        for index, url in enumerate(urls):
            path = public / str(url).lstrip('/')
            if not str(url).startswith('/audio/case-001/') or '..' in str(url):
                issues.append(f'audio.sfx.{cue}[{index}]: unsafe URL {url!r}')
            elif not path.is_file():
                issues.append(f'audio.sfx.{cue}[{index}]: missing WAV {url}')
            else:
                entry=next((item for item in sfx_provenance.values() if item.get('url')==url),None)
                if not entry:
                    issues.append(f'audio.sfx.{cue}[{index}]: missing provenance entry')
                _validate_wav(path, f'audio.sfx.{cue}[{index}]', entry, issues)
                sound_hashes[f'{cue}/{index}']=hashlib.sha256(path.read_bytes()).hexdigest()
    if len(sfx.get('footstep',[]))>=2 and sound_hashes.get('footstep/0')==sound_hashes.get('footstep/1'):
        issues.append('audio.sfx.footstep: variants must be distinct')
    return issues


def _validate_wav(path: Path, identity: str, provenance: dict | None, issues: list[str]) -> None:
    try:
        with wave.open(str(path), 'rb') as audio:
            channels, width, rate, frames = audio.getnchannels(), audio.getsampwidth(), audio.getframerate(), audio.getnframes()
            if channels != 1 or width != 2 or rate != 24_000 or frames <= 0:
                issues.append(f'{identity}: WAV must be nonempty mono PCM16 at 24000 Hz')
    except (wave.Error, EOFError, OSError):
        issues.append(f'{identity}: invalid or truncated WAV')
        return
    if provenance:
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        if provenance.get('wavSha256') != digest:
            issues.append(f'{identity}: provenance WAV hash mismatch')


if __name__ == '__main__':
    failures = validate_assets(Path(__file__).resolve().parents[2])
    if failures:
        print('\n'.join(failures), file=sys.stderr)
        raise SystemExit(1)
    print('Audio assets validated.')
