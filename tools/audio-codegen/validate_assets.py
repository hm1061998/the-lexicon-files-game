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
                issues.append(f'{identity}: missing audio file {url}')
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

    music_url = case['audio'].get('music')
    if music_url:
        music_path = public / str(music_url).lstrip('/')
        music_entry = provenance.get('music')
        if not str(music_url).startswith('/audio/case-001/') or '..' in str(music_url):
            issues.append(f'audio.music: unsafe URL {music_url!r}')
        elif not music_path.is_file():
            issues.append(f'audio.music: missing audio file {music_url}')
        else:
            if not isinstance(music_entry, dict):
                issues.append('audio.music: missing provenance entry')
            elif music_entry.get('url') != music_url:
                issues.append('audio.music: provenance URL does not match case content')
            _validate_audio_file(music_path, 'audio.music', music_entry, issues)

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
                issues.append(f'audio.sfx.{cue}[{index}]: missing audio file {url}')
            else:
                entry=next((item for item in sfx_provenance.values() if item.get('url')==url),None)
                if not entry:
                    issues.append(f'audio.sfx.{cue}[{index}]: missing provenance entry')
                elif entry.get('url') != url:
                    issues.append(f'audio.sfx.{cue}[{index}]: provenance URL does not match case content')
                _validate_audio_file(path, f'audio.sfx.{cue}[{index}]', entry, issues)
                sound_hashes[f'{cue}/{index}']=hashlib.sha256(path.read_bytes()).hexdigest()
    if len(sfx.get('footstep',[]))>=2 and sound_hashes.get('footstep/0')==sound_hashes.get('footstep/1'):
        issues.append('audio.sfx.footstep: variants must be distinct')
    return issues


def _validate_audio_file(path: Path, identity: str, provenance: dict | None, issues: list[str]) -> None:
    if path.suffix.lower() == '.wav':
        _validate_wav(path, identity, provenance, issues)
        return
    if path.suffix.lower() != '.ogg':
        issues.append(f'{identity}: unsupported audio format {path.suffix}')
        return
    data = path.read_bytes()
    if not _validate_ogg(data):
        issues.append(f'{identity}: invalid or truncated Ogg page/stream')
        return
    if not provenance:
        return
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    if provenance.get('sha256') != digest:
        issues.append(f'{identity}: provenance hash mismatch')
    if provenance.get('license') != 'CC0 1.0':
        issues.append(f'{identity}: license must be recorded as CC0 1.0')
    if not isinstance(provenance.get('author'), str) or not provenance['author'].strip():
        issues.append(f'{identity}: missing or invalid provenance author')
    for field in ('sourcePage', 'downloadUrl'):
        if not isinstance(provenance.get(field), str) or not provenance[field].startswith('https://'):
            issues.append(f'{identity}: missing or invalid provenance {field}')


def _ogg_crc(page: bytes) -> int:
    crc = 0
    for value in page:
        crc ^= value << 24
        for _ in range(8):
            if crc & 0x80000000:
                crc = ((crc << 1) ^ 0x04C11DB7) & 0xFFFFFFFF
            else:
                crc = (crc << 1) & 0xFFFFFFFF
    return crc


def _validate_ogg(data: bytes) -> bool:
    """Check Ogg page framing, checksums, single-stream sequence, and end marker."""
    offset = 0
    page_index = 0
    serial: int | None = None
    final_flags = 0
    while offset < len(data):
        if len(data) - offset < 27 or data[offset : offset + 4] != b'OggS':
            return False
        if data[offset + 4] != 0:
            return False
        segment_count = data[offset + 26]
        table_end = offset + 27 + segment_count
        if table_end > len(data):
            return False
        page_end = table_end + sum(data[offset + 27 : table_end])
        if page_end > len(data):
            return False
        page = bytearray(data[offset:page_end])
        checksum = int.from_bytes(page[22:26], 'little')
        page[22:26] = b'\x00\x00\x00\x00'
        if _ogg_crc(page) != checksum:
            return False
        page_serial = int.from_bytes(data[offset + 14 : offset + 18], 'little')
        sequence = int.from_bytes(data[offset + 18 : offset + 22], 'little')
        if serial is None:
            serial = page_serial
            if not data[offset + 5] & 0x02 or sequence != 0:
                return False
        elif page_serial != serial or sequence != page_index:
            return False
        final_flags = data[offset + 5]
        offset = page_end
        page_index += 1
    return page_index > 0 and bool(final_flags & 0x04)


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
