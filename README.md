# 🐾 Critter Forge — Random Animal Generator

A cozy little web app that forges a brand-new creature by rolling each body part
from hundreds of real animals. Filter by animal type, then spin.

## Features

- **11 body-part slots** — Base, Head, Ears, Eyes, Nose, Legs, Feet, Tail, Coat, Colour and an **Extra** feature.
- **Type filter** — include any mix of Mammals, Birds, Fish, Reptiles, Amphibians, Insects, Bugs, Sea life, Dinosaurs and Mythical. A *Select all* toggle is on by default and flips off as soon as you deselect a type.
- **Spin everything** or click a single card to re-roll just that part — slot-machine style, with a calm reduced-motion fallback.
- **Visualize instantly** — every result links straight to **Google Images** (🔍) and has a one-tap **Copy** (📋); *Copy recipe* grabs the whole creature. No images are stored or hosted by the site.

## Tech

Plain HTML/CSS/JS (ES modules) — no build step, no dependencies. The palette and
motion come from the Ko-fi design language in the (git-ignored) `design/` folder.
`data.js` is generated from `animals.txt` and ships every animal pre-categorised.

## Run locally

It's a static site, so serve the folder over HTTP (ES modules need a server, not `file://`):

```bash
python3 -m http.server 5173
# then open http://localhost:5173
```

## Deploy (Vercel)

No framework, no build command — Vercel serves it as a static site. Either:

```bash
vercel
```

or import the repo at [vercel.com/new](https://vercel.com/new) and deploy with the
default (static) settings. `vercel.json` only adds a couple of security headers.
