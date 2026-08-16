# New Balance Homepage — Hero Intro

Mobile homepage built from Figma (`72:382`) with a stacked content-preview intro animation.

## Run

```bash
npm install
npm run dev
```

Open the local URL (e.g. `http://127.0.0.1:5173`).

- Normal load: stacked preview → hero expands (~1s), then normal scrolling
- `?hold=1`: freeze the intro stack (debug)
- `prefers-reduced-motion: reduce`: skip straight to the final hero

## Stack

- Vite + React + TypeScript
- GSAP timeline (`power2.out`) for the intro
- Assets exported from Figma MCP into `public/assets/`
