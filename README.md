# Coach B Under the Tree — Flag Football

An interactive HTML5 learning site for 5th grade girls to master flag football **positions**, **formations**, **routes**, and **plays** — with lots of quizzing!

## Features

- **Learn mode** — Study cards with field diagrams for every topic
- **Quiz mode** — 70+ auto-generated questions across 4 categories + mixed
- **Question types** — Multiple choice, true/false, tap-the-player on field, play call identification
- **Visual learning** — SVG football field with formations, routes, and play diagrams
- **Audio mode** — Web Speech API reads questions and Coach B's play calls (toggle 🔊 in header)
- **Play Call Practice** — Hear a play call, identify the play (great verbal learning!)
- **Progress tracking** — Scores, streaks, category accuracy, and unlockable badges

## Getting Started

You'll need [Node.js](https://nodejs.org/) installed.

```bash
cd ~/Projects/coach-b-under-the-tree-flag-football
npm install
npm run dev
```

Open the URL shown in your terminal (usually `http://localhost:5173`).

## Build for Production

```bash
npm run build
npm run preview
```

The static site lands in `dist/` and can be hosted anywhere (Netlify, GitHub Pages, etc.).

## Roadmap

- [ ] Record real Coach B audio for play calls (replace text-to-speech)
- [ ] Animated route running on the field
- [ ] Team-specific custom plays
- [ ] Coach dashboard to add/edit questions

## Project Structure

```
src/
├── data/          # Positions, formations, routes, plays, quiz questions
├── quiz/          # Quiz engine, progress tracking
├── visual/        # SVG field renderer
├── audio/         # Web Speech API wrapper
├── app.js         # Main UI and navigation
└── style.css      # Mobile-first styling
```

Made with 🌳🏈 for learning under the tree.
