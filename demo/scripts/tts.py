"""Kokoro (PyTorch) narration: one WAV per scene plus word timings, from src/scenes.json.
Run with the venv outside the repo:  <venv>/Scripts/python.exe -I scripts/tts.py [voice]
Word timings come from the tokens' start_ts / end_ts (English only), no transcription pass."""
import json, sys, pathlib
import numpy as np
import soundfile as sf
from kokoro import KPipeline

root = pathlib.Path(__file__).resolve().parent.parent
voice = sys.argv[1] if len(sys.argv) > 1 else 'af_heart'
scenes = json.loads((root / 'src' / 'scenes.json').read_text(encoding='utf-8'))['scenes']
out = root / 'audio'
out.mkdir(exist_ok=True)
pipe = KPipeline(lang_code='a', repo_id='hexgrad/Kokoro-82M')
SR = 24000
report = {}
for s in scenes:
    chunks, words, offset = [], [], 0.0
    for r in pipe(s['narration'], voice=voice, speed=(1.0 if s['id'] == 'S3' else 1.05), split_pattern=r'(?<=[.:;])\s+'):
        audio = r.audio.numpy() if hasattr(r.audio, 'numpy') else np.asarray(r.audio)
        for t in (r.tokens or []):
            if t.start_ts is None or t.end_ts is None or not t.text.strip():
                continue
            words.append({'text': t.text, 'start': round(offset + t.start_ts, 3), 'end': round(offset + t.end_ts, 3), 'ph': t.phonemes})
        chunks.append(audio)
        offset += len(audio) / SR
        chunks.append(np.zeros(int(0.12 * SR), dtype=np.float32)); offset += 0.12
    wav = np.concatenate(chunks)
    sf.write(out / f"{s['id']}.wav", wav, SR)
    (out / f"{s['id']}.words.json").write_text(json.dumps(words, indent=1), encoding='utf-8')
    report[s['id']] = {'seconds': round(len(wav) / SR, 2), 'words': len(words)}
    print(s['id'], report[s['id']], flush=True)
(out / 'report.json').write_text(json.dumps({'voice': voice, 'scenes': report}, indent=1), encoding='utf-8')
print('total narration seconds', round(sum(v['seconds'] for v in report.values()), 1))
