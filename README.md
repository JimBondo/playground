# playground

Sandbox for random personal projects, built exclusively with [Claude Code](https://claude.com/claude-code).

The landing page is a neon-drenched vaporwave launchpad that lists available modules. The first module is the **Layout Designer**; more are on the way.

## Running locally

No build step — just open `index.html` in a browser, or serve the directory:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Project layout

| Path             | Purpose                                                                  |
| ---------------- | ------------------------------------------------------------------------ |
| `index.html`     | Landing page                                                             |
| `styles.css`     | Scanlines, perspective grid, reduced-motion overrides                    |
| `STYLE_GUIDE.md` | Canonical design system for the base website home page                   |
| `CLAUDE.md`      | Agent instructions for Claude Code — read this before making changes     |

Future apps (e.g. `layout-designer/`) live in their own subdirectories and are free to use their own stacks. The vaporwave style guide applies to the base website only.
