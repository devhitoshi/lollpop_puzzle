"""Split raw/face_<key>.png (2x2: normal, happy / pop, fever) into <out>/<key>{,_happy,_pop,_fever}.png.

usage: python scripts/split_member_face.py <key> <out dir>   (run from the lollpop_puzzle repo root)
"""
import subprocess, sys, shutil, tempfile
from pathlib import Path

key, out = sys.argv[1], Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)
tmp = Path(tempfile.mkdtemp())
subprocess.run([sys.executable, 'scripts/prepare_piece.py', f'raw/face_{key}.png', '--grid', '2x2',
                '--members', 'c1,c2', '--rows', 'r1,r2', '--out', str(tmp)], check=True)
names = {'c1_r1': key, 'c2_r1': f'{key}_happy', 'c1_r2': f'{key}_pop', 'c2_r2': f'{key}_fever'}
for src, dst in names.items():
    shutil.move(tmp / f'{src}.png', out / f'{dst}.png')
print(key, '→', out)
