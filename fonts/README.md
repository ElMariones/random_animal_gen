# Fonts

These two fonts are **not** included in the repo (download them yourself, respect their
licenses) and are loaded by `@font-face` in `styles.css`. Until you add the files, the
site falls back to **DM Sans**, so nothing breaks.

## 1. Promised Freyna — branding / title

- Download: https://www.dafont.com/es/promised-freyna.font
- Unzip and put the font file here, renamed to one of:
  - `promised-freyna.woff2` (best — smallest/fastest), or
  - `promised-freyna.ttf` (works as-is from the dafont zip)

## 2. Cocogoose Classic — body text

- Download: https://www.dafont.com/es/cocogoose-classic.font
- Put the **Regular** weight here as:
  - `cocogoose-classic.woff2` or `cocogoose-classic.ttf`
- (Optional) put the **Bold** weight here as:
  - `cocogoose-classic-bold.woff2` or `cocogoose-classic-bold.ttf`
  - If you skip bold, the browser just synthesizes it — totally fine.

## Converting .ttf → .woff2 (optional, recommended)

woff2 is ~30–50% smaller. Easiest is the online converter at
https://cloudconvert.com/ttf-to-woff2 — or, with Python:

```bash
pip install fonttools brotli
python -c "from fontTools.ttLib import TTFont; f=TTFont('promised-freyna.ttf'); f.flavor='woff2'; f.save('promised-freyna.woff2')"
```

The filenames above must match exactly — that's what `styles.css` looks for.
