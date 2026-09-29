"""Build the title logo (T2) as inline SVG and write it into index.html and scripts/og.html.

usage: python scripts/make_logo.py   (repo root). Then re-shoot og.png (see scripts/og.html).
The seven "!" are lollipops in the member colors of all seven members, graduates included,
in the order of the official photos (lollpop_docs/design.md mc-*). Don't swap in candy colors.
"""
import re, sys
INK = '#3b1f35'
COLORS = [('#cc0000', '#ff6b6b'), ('#f172a3', '#ffd0e2'), ('#f5c400', '#fff08a'), ('#2a6fd6', '#a9ccff'),
          ('#7fd4e8', '#e0f8ff'), ('#2e9e5b', '#8fe6b2'), ('#ffffff', '#f6c4da')]
def swirl(r):
    # an Archimedean-looking spiral from half-circle arcs, clipped by the candy
    d = 'M0 0'; s = 1; step = r / 4.2; k = 1
    rad = step / 2
    x = 0
    for i in range(7):
        nx = x + (2 * rad) * s
        d += f' A{rad:.1f} {rad:.1f} 0 0 1 {nx:.1f} 0'
        x = nx; s = -s; rad += step / 2
    return d
parts = []
parts.append('<svg class="logo" viewBox="0 0 360 206" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">')
parts.append('<defs><clipPath id="logo-candy"><circle r="18"/></clipPath></defs>')
parts.append('<g class="logo-bangs" transform="translate(0 4) skewX(-8)">')
for i, (c, s) in enumerate(COLORS):
    x = 44 + i * 47
    parts.append(f'<g class="logo-pop" style="--i:{i}" transform="translate({x} 0)">')
    # stick (the bar of "!")
    parts.append(f'<rect x="-4.5" y="44" width="9" height="62" rx="4.5" fill="#fff" stroke="{INK}" stroke-width="3"/>')
    # candy head
    parts.append(f'<circle cx="0" cy="30" r="21" fill="{c}" stroke="{INK}" stroke-width="3.2"/>')
    parts.append(f'<path d="{swirl(21)}" transform="translate(0 30) rotate({i * 40})" fill="none" stroke="{s}" stroke-width="3.6" stroke-linecap="round" clip-path="url(#logo-candy)"/>')
    parts.append(f'<ellipse cx="-8" cy="21" rx="5" ry="3.2" fill="#fff" opacity=".85" transform="rotate(-30 -8 21)"/>')
    # dot of "!"
    parts.append(f'<circle cx="-2" cy="124" r="10" fill="{c}" stroke="{INK}" stroke-width="3"/>')
    parts.append(f'<circle cx="-5.5" cy="120.5" r="2.6" fill="#fff" opacity=".85"/>')
    parts.append('</g>')
parts.append('</g>')
T = 'font-family="Dela Gothic One, M PLUS Rounded 1c, sans-serif" font-size="45" text-anchor="middle"'
parts.append(f'<g transform="translate(180 190) skewX(-8)">')
parts.append(f'<text x="5" y="5" {T} fill="#ff4f9a" stroke="#ff4f9a" stroke-width="9" stroke-linejoin="round">落ちものパズル</text>')
parts.append(f'<text {T} fill="#fff" stroke="{INK}" stroke-width="9" stroke-linejoin="round" paint-order="stroke fill">落ちものパズル</text>')
parts.append('</g></svg>')
svg = ''.join(parts)
for p, attr in [('index.html', ''), ('scripts/og.html', ' width="480"')]:
    h = open(p, encoding='utf-8').read()
    h, n = re.subn(r'<svg class="logo".*?</svg>', lambda m: svg.replace('class="logo"', 'class="logo"' + attr), h, flags=re.S)
    assert n == 1, f'{p}: logo not found'
    open(p, 'w', encoding='utf-8', newline='\n').write(h)
    print(p, 'updated')
