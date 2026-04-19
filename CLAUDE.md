# Playground — Agent Instructions

This repository is **built exclusively using Claude Code**. Optimize all decisions for agent-authored maintenance.

## Layout

```
playground/
├── index.html          # Base website landing page
├── styles.css          # Page-scoped CSS (scanlines, perspective grid)
├── STYLE_GUIDE.md      # Canonical home-page design system — MUST READ before editing index.html
├── CLAUDE.md           # This file
└── README.md
```

Future individual apps should live in their own subdirectories with their own stacks and styles. The first is [`floor-plan-designer/`](./floor-plan-designer/) — a Next.js 16 + react-konva + Zustand app for retail floor planning. See its own `CLAUDE.md` / `AGENTS.md`.

The root `build.sh` + `vercel.json` combine the landing page and the static Next.js export into a single `dist/` for Vercel. Do not commit `dist/` or `floor-plan-designer/out/`.

## Stack

- **No build toolchain.** Plain HTML + Tailwind via the Play CDN + a tiny `styles.css`.
- Fonts: Orbitron (headings) + Share Tech Mono (body/UI) via Google Fonts.
- All Tailwind color tokens (`magenta`, `cyan`, `sunset`, `void`, `chrome`, `panel`, `edge`) are defined inline in the `<script>tailwind.config</script>` block in `index.html`. Use those names instead of repeating hex values.

## Working rules

1. **Home page changes**: always open `STYLE_GUIDE.md` first. Match the vaporwave/outrun aesthetic — neon, scanlines, sharp corners, skewed buttons, terminal chrome. Do not flatten or "modernize" it.
2. **Scope discipline**: `STYLE_GUIDE.md` applies to the *base website* only. Do not apply it to sub-apps unless the user asks.
3. **Keep it lightweight**: do not introduce a bundler, framework, or package manager without the user explicitly asking. If a sub-app needs one, put it in the sub-app directory, not the root.
4. **Preserve accessibility**: scanline/aberration overlays are `aria-hidden` and suppressed under `prefers-reduced-motion`. Preserve both.
5. **Preview locally** with any static server, e.g. `python3 -m http.server 8000`.

## Git

- Remote uses SSH on the `JimBondo` GitHub account.
- Default branch: `main`.
- Create commits only when the user asks.
