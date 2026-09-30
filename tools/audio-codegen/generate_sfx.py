"""Synthesize small original mono WAV cues with a seeded noise/tone renderer."""
import json
import math
import random
import struct
import wave
import hashlib
from pathlib import Path

REPO=Path(__file__).resolve().parents[2]
CASE=REPO/'packages/game-content/cases/case-001'
OUT=REPO/'apps/game-web/public/audio/case-001/sfx'
RATE=24_000


def render(name: str, frequency: float, duration: float, seed: int) -> None:
    rng=random.Random(seed)
    frames=int(RATE*duration)
    data=bytearray()
    for i in range(frames):
        t=i/RATE
        envelope=min(1,t*90)*math.exp(-t*(3.7 if name.startswith('step') else 4.8))
        noise=rng.uniform(-1,1)
        tone=math.sin(2*math.pi*frequency*t)
        sample=(noise*(0.54 if name.startswith(('step','paper','door')) else 0.22)+tone*0.46)*envelope*0.28
        data.extend(struct.pack('<h',max(-32768,min(32767,int(sample*32767)))))
    OUT.mkdir(parents=True,exist_ok=True)
    with wave.open(str(OUT/f'{name}.wav'),'wb') as wav:
        wav.setnchannels(1);wav.setsampwidth(2);wav.setframerate(RATE);wav.writeframes(data)


def main() -> None:
    definitions={'step-1':(115,0.19,1),'step-2':(138,0.17,2),'paper':(210,0.34,3),'ui':(720,0.11,4),'evidence':(940,0.32,5),'door':(175,0.42,6),'dialogue':(460,0.09,7)}
    for name, params in definitions.items(): render(name,*params)
    case_path=CASE/'case.json'; case=json.loads(case_path.read_text(encoding='utf-8'))
    case['audio']={'sfx':{'footstep':['/audio/case-001/sfx/step-1.wav','/audio/case-001/sfx/step-2.wav'],'paper':['/audio/case-001/sfx/paper.wav'],'ui':['/audio/case-001/sfx/ui.wav'],'evidence':['/audio/case-001/sfx/evidence.wav'],'door':['/audio/case-001/sfx/door.wav'],'dialogue':['/audio/case-001/sfx/dialogue.wav']}}
    case_path.write_text(json.dumps(case,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    provenance_path=REPO/'apps/game-web/public/audio/case-001/provenance.json'
    provenance=json.loads(provenance_path.read_text(encoding='utf-8')) if provenance_path.exists() else {'clips':{}}
    provenance['sfx']={}
    for cue, names in {'footstep':['step-1','step-2'],'paper':['paper'],'ui':['ui'],'evidence':['evidence'],'door':['door'],'dialogue':['dialogue']}.items():
        for name in names:
            path=OUT/f'{name}.wav'; key=f'{cue}/{name}'
            provenance['sfx'][key]={'url':f'/audio/case-001/sfx/{name}.wav','wavSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'sampleRate':RATE,'channels':1,'bitsPerSample':16}
    provenance_path.parent.mkdir(parents=True,exist_ok=True)
    provenance_path.write_text(json.dumps(provenance,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('Generated two footstep variants and paper/UI/evidence/door/dialogue cues.')


if __name__ == '__main__': main()
