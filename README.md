# playground

Sandbox for random personal projects, built exclusively with [Claude Code](https://claude.com/claude-code).

The landing page is a neon-drenched vaporwave launchpad that lists available modules. The first module is the **Layout Designer**; more are on the way.

## Running locally

**Landing page only** — just open `index.html` in a browser, or serve the directory:

```bash
python3 -m http.server 8000    # http://localhost:8000
```

**Floor Plan Designer** sub-app (Next.js):

```bash
cd floor-plan-designer
npm install
npm run dev   # http://localhost:3000/floor-plan-designer/
```

**Combined production build** (what Vercel runs):

```bash
bash build.sh                  # emits dist/
python3 -m http.server 8100 --directory dist
# http://localhost:8100/  → landing
# http://localhost:8100/floor-plan-designer/  → sub-app
```

## Project layout

| Path                       | Purpose                                                              |
| -------------------------- | -------------------------------------------------------------------- |
| `index.html` + `styles.css`| Landing page                                                         |
| `STYLE_GUIDE.md`           | Canonical design system — base website home page only                |
| `CLAUDE.md`                | Agent instructions — read before making changes                      |
| `floor-plan-designer/`     | Next.js 16 sub-app for retail floor-plan design (Konva + Zustand)    |
| `build.sh` + `vercel.json` | Orchestrate a combined static deploy to Vercel                       |

## Deployment

`vercel.json` points Vercel at `build.sh`, which produces a `dist/` containing both the landing page and the static Next.js export mounted under `/floor-plan-designer/`. Single Vercel project, single origin. If you want them as separate Vercel projects, remove `basePath` from `floor-plan-designer/next.config.ts` and update the card `href` in `index.html`.

The vaporwave style guide applies to the base website only — individual sub-apps are free to use their own stacks and design languages.
