import json
import hashlib
import tempfile
import unittest
import wave
from pathlib import Path

from validate_assets import validate_assets


def wav(path: Path, *, frames: int = 12_000, rate: int = 24_000) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), 'wb') as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(rate)
        audio.writeframes(b'\x01\x00' * frames)


def fixture(root: Path):
    case_dir = root / 'packages/game-content/cases/case-001'
    case_dir.mkdir(parents=True)
    text = 'I left early.'
    text_hash = hashlib.sha256(text.encode()).hexdigest()
    relative = 'anna/anna_initial__entry.wav'
    audio = root / 'apps/game-web/public/audio/case-001' / relative
    wav(audio)
    (case_dir/'dialogues.json').write_text(json.dumps({'dialogues':[{'id':'anna_initial','npcId':'anna','nodes':[{'id':'entry','speakerId':'anna','text':text,'audio':{'url':f'/audio/case-001/{relative}','textSha256':text_hash}}]}]}),encoding='utf-8')
    urls={cue:[f'/audio/case-001/sfx/{cue}.wav'] for cue in ('paper','ui','evidence','door','dialogue')}
    urls['footstep']=['/audio/case-001/sfx/step-1.wav','/audio/case-001/sfx/step-2.wav']
    (case_dir/'case.json').write_text(json.dumps({'audio':{'sfx':urls}}),encoding='utf-8')
    for url in sum(urls.values(),[]): wav(root/'apps/game-web/public'/url.lstrip('/'),frames=12001 if 'step-2' in url else 12000)
    digest=hashlib.sha256(audio.read_bytes()).hexdigest()
    sfx_provenance={f'{cue}/{Path(url).stem}':{'url':url,'wavSha256':hashlib.sha256((root/'apps/game-web/public'/url.lstrip('/')).read_bytes()).hexdigest()} for cue,items in urls.items() for url in items}
    provenance={'clips':{'anna_initial/entry':{'speakerId':'anna','textSha256':text_hash,'wavSha256':digest}},'sfx':sfx_provenance}
    (root/'apps/game-web/public/audio/case-001/provenance.json').write_text(json.dumps(provenance),encoding='utf-8')


class AudioAssetValidationTests(unittest.TestCase):
    def test_valid_fixture_passes(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory); fixture(root)
            self.assertEqual(validate_assets(root),[])

    def test_missing_clip_fails_with_dialogue_identity(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory); fixture(root)
            (root/'apps/game-web/public/audio/case-001/anna/anna_initial__entry.wav').unlink()
            self.assertTrue(any('anna_initial/entry' in issue and 'missing' in issue for issue in validate_assets(root)))

    def test_text_hash_and_speaker_mismatch_fail(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory); fixture(root)
            path=root/'apps/game-web/public/audio/case-001/provenance.json'
            data=json.loads(path.read_text()); data['clips']['anna_initial/entry']['speakerId']='leo'; data['clips']['anna_initial/entry']['textSha256']='0'*64
            path.write_text(json.dumps(data))
            problems=validate_assets(root)
            self.assertTrue(any('speaker' in item for item in problems))
            self.assertTrue(any('text hash' in item for item in problems))

    def test_invalid_wav_and_truncated_provenance_fail(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory); fixture(root)
            path=root/'apps/game-web/public/audio/case-001/sfx/step-1.wav'; path.write_bytes(b'RIFFbroken')
            provenance=root/'apps/game-web/public/audio/case-001/provenance.json'; provenance.write_text('{')
            problems=validate_assets(root)
            self.assertTrue(any('WAV' in item for item in problems))
            self.assertTrue(any('provenance' in item for item in problems))

    def test_footstep_variants_must_be_distinct(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory); fixture(root)
            case=root/'packages/game-content/cases/case-001/case.json'
            data=json.loads(case.read_text()); data['audio']['sfx']['footstep'][1]=data['audio']['sfx']['footstep'][0]
            case.write_text(json.dumps(data))
            self.assertTrue(any('distinct' in item for item in validate_assets(root)))


if __name__ == '__main__':
    unittest.main()
