# Snake — Nokia Edition

Classic Nokia Snake, rebuilt for the browser. Hand-written, no frameworks.

Live: [ravirajhere-snake.vercel.app](https://ravirajhere-snake.vercel.app)

---

## About

A tribute to the Nokia 3310 Snake game — the one most of us grew up playing. Rebuilt from scratch with vanilla JavaScript and HTML5 Canvas.

Every line of HTML, CSS, and JavaScript written by hand. No frameworks. No build step.

**Built by [Ravi Raj](https://ravirajhere.vercel.app)** — frontend developer from Patna, India.

---

## Features

- **Nokia retro style** — LCD green palette, pixel-art snake, scanlines
- **Grid-based gameplay** — 20×20 cells, classic feel
- **Keyboard controls** — Arrow keys + WASD
- **Touch controls** — Swipe gestures + on-screen D-pad (mobile)
- **High score** — saved in localStorage
- **Progressive speed** — speeds up every 5 points
- **Level system** — Level increases as you get faster
- **Pause / Resume** — Space or Esc
- **Restart** — R key
- **Difficulty levels** — Easy / Normal / Hard
- **Sound effects** — Web Audio API (eat, level-up, game over)
- **Auto-pause** — pauses when you switch tabs
- **Reduced motion** — respects user preference

---

## Tech

- **HTML5** — semantic, single file
- **CSS3** — custom properties, no frameworks
- **JavaScript** — vanilla, no dependencies
- **Canvas 2D** — for pixel-perfect rendering
- **Web Audio API** — for beeps
- **localStorage** — for high score persistence

No frameworks. No build step. Every line written by hand.

---

## Folder Structure

    /
    ├── index.html
    ├── css/
    │   └── snake.css
    ├── js/
    │   └── snake.js
    ├── vercel.json
    └── README.md

---

## How to Play

### Desktop

| Key | Action |
|-----|--------|
| `↑` `↓` `←` `→` | Move |
| `W` `A` `S` `D` | Move |
| `Space` / `Esc` | Pause / Resume |
| `R` | Restart |
| `Enter` | Start |

### Mobile

- **Swipe** on the canvas to change direction
- **D-pad** buttons below the phone frame
- **Tap START** to begin

### Rules

- Eat the food (dark dot) to grow
- Don't hit the walls
- Don't hit yourself
- Speed increases every 5 points
- Score = number of foods eaten

---

## Local Development

No build step. Just open `index.html` in a browser.

For best results, run a local server:

    python -m http.server 8000

Then open: http://localhost:8000

---

## Deploy

Hosted on **Vercel**. Push to `main` branch — site updates automatically.

    git add .
    git commit -m "Update"
    git push origin main

---

## Design Notes

**Why Nokia retro?**

The original Snake on Nokia 3310 was the first video game many of us played. It was simple, monochrome, and addictive. Rebuilding it forced me to think about:

- **Game loops** — `requestAnimationFrame` with fixed timestep accumulator
- **Collision detection** — grid-based, fast
- **State management** — no framework, pure JS object
- **Rendering** — canvas, pixel-perfect at 20×20 cells
- **Input handling** — keyboard + touch (swipe + D-pad)
- **Progressive difficulty** — speed increases without frustrating the player

The constraint (monochrome, 20×20 grid, no sprites) made it a good exercise in fundamental game design.

---

## Related Projects

- **[Portfolio](https://ravirajhere.vercel.app)** — full-stack developer portfolio
- **[Author Website](https://ravirajhere-author.vercel.app)** — author site + book reader for "A Boy Who Never Thought"

---

## Contact

- **Email:** raviraj2k09@gmail.com
- **GitHub:** [@ravirajhere](https://github.com/ravirajhere)
- **LinkedIn:** [Ravirajhere](https://linkedin.com/in/Ravirajhere)

---

## License

Code © 2026 Ravi Raj. Open for reference and learning.

---

**Made With ❤️ & Curiosity**
