"""Generate Case 001 NPC node speech with a pinned local Kokoro model."""
import hashlib
import json
import os
import platform
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
CASE = REPO / 'packages/game-content/cases/case-001'
OUTPUT = REPO / 'apps/game-web/public/audio/case-001'
VOICE_BY_SPEAKER = {'anna':'af_heart','leo':'am_michael','david':'am_fenrir'}
MODEL_REVISION = 'f3ff3571791e39611d31c381e3a41a3af07b4987'


def main() -> None:
    try:
        import soundfile as sf
        import torch
        from huggingface_hub import hf_hub_download
        from kokoro import KPipeline
        from kokoro.model import KModel
    except ImportError as error:
        raise SystemExit(f'Kokoro audio environment is incomplete: {error}; install tools/audio-codegen/requirements.txt')
    dialogues = json.loads((CASE/'dialogues.json').read_text(encoding='utf-8'))
    revision=os.environ.get('KOKORO_MODEL_REVISION',MODEL_REVISION)
    config=hf_hub_download('hexgrad/Kokoro-82M','config.json',revision=revision)
    model_path=hf_hub_download('hexgrad/Kokoro-82M','kokoro-v1_0.pth',revision=revision)
    model=KModel(repo_id='hexgrad/Kokoro-82M',config=config,model=model_path).to('cpu').eval()
    provenance_path=OUTPUT/'provenance.json'
    previous=json.loads(provenance_path.read_text(encoding='utf-8')) if provenance_path.exists() else {}
    provenance = {'generator':'Kokoro KPipeline', 'generatorVersion':'0.9.4', 'pythonVersion':platform.python_version(), 'torchVersion':torch.__version__, 'model':'hexgrad/Kokoro-82M', 'modelRevision':revision, 'modelSha256':hashlib.sha256(Path(model_path).read_bytes()).hexdigest(), 'language':'American English (a)', 'sampleRate':24000, 'channels':1, 'subtype':'PCM_16', 'voices':VOICE_BY_SPEAKER, 'voiceSha256':{}, 'clips':{}, 'sfx':previous.get('sfx',{})}
    pipeline = KPipeline(lang_code='a',repo_id='hexgrad/Kokoro-82M',model=model)
    for voice in set(VOICE_BY_SPEAKER.values()):
        voice_path=hf_hub_download('hexgrad/Kokoro-82M',f'voices/{voice}.pt',revision=revision)
        pipeline.voices[voice]=torch.load(voice_path,weights_only=True)
        provenance['voiceSha256'][voice]=hashlib.sha256(Path(voice_path).read_bytes()).hexdigest()
    count = 0
    for tree in dialogues['dialogues']:
        for node in tree['nodes']:
            speaker = node['speakerId']
            if speaker not in VOICE_BY_SPEAKER:
                continue
            text = node['text']
            text_hash = hashlib.sha256(text.encode('utf-8')).hexdigest()
            folder = OUTPUT / speaker
            folder.mkdir(parents=True, exist_ok=True)
            path = folder / f"{tree['id']}__{node['id']}.wav"
            chunks = [audio for _, _, audio in pipeline(text, voice=VOICE_BY_SPEAKER[speaker], speed=1.0)]
            if not chunks:
                raise RuntimeError(f"Kokoro produced no audio for {tree['id']}/{node['id']}")
            import numpy as np
            waveform = np.concatenate([chunk.detach().cpu().numpy() for chunk in chunks])
            peak = float(np.max(np.abs(waveform)))
            if peak > 0.98:
                waveform = waveform * (0.98 / peak)
            sf.write(str(path), waveform, 24000, subtype='PCM_16')
            relative = path.relative_to(REPO/'apps/game-web/public').as_posix()
            node['audio'] = {'url':f'/{relative}','textSha256':text_hash}
            key=f"{tree['id']}/{node['id']}"
            provenance['clips'][key] = {'speakerId':speaker,'voiceId':VOICE_BY_SPEAKER[speaker],'text':text,'textSha256':text_hash,'wavSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'sampleRate':24000,'channels':1,'bitsPerSample':16,'durationSeconds':round(len(waveform)/24000,3)}
            count += 1
    (CASE/'dialogues.json').write_text(json.dumps(dialogues,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    OUTPUT.mkdir(parents=True,exist_ok=True)
    provenance_path.write_text(json.dumps(provenance,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'Generated {count} NPC dialogue clips from content.')


if __name__ == '__main__':
    main()
