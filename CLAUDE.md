# L.A. Young Band Page — Artist Website

## Three-Site Ecosystem — Know Which Site You're Editing

This project is part of a three-site ecosystem. Before making changes, verify which site you're working on:

| Site | Root Directory | Entry Point | Served At | Git Repo |
|------|---------------|-------------|-----------|----------|
| **L.A. Young Band Page** (this site) | `C:\Projects\goldbottom-ent-site\LAYoungBandPage\` | `index.html` | GitHub Pages: `layoungbandpage.com` | `LAYoungBandPage` (public) |
| **GBE Public** | `C:\Projects\goldbottom-ent-site\GoldBottomEntLLC\` | `index.html` (CDN assets) | GitHub Pages: `djmochajava-lang.github.io/GoldBottomEntLLC/` | `GoldBottomEntLLC` (public) |
| **GBE Local/Private** | Same as GBE Public | `index-local.html` (bundled assets) | Home server: `http://LAN-IP:3000` | `GBE-HomeOffice` (private, D: drive) |

**This site (LAYoungBandPage) is completely independent from GBE.** It has its own CSS, JS, pages, routing, design system, and Git repo. Do NOT confuse files here with GBE's files — they share a similar SPA architecture but are separate codebases.

**Relationship to GBE:** L.A. Young is the featured artist managed by Gold Bottom Entertainment LLC. GBE's public site links here from its Featured Artist page and home page. This site links back to GBE via booking/management references.

**Trademark:** The phrase "I sing because I am human.™" is displayed on bio.html and support.html. This is part of the broader "I _____ because I am human" brand owned by Gold Bottom Ent LLC (company asset). Trademark management is handled from the GBE dashboard's IP & Rights page — do NOT manage trademark data from this site.

See `../GoldBottomEntLLC/claude.md` for the GBE site documentation.

---

## Project Overview

Official artist website for **L.A. Young** — a powerhouse soul, jazz, and blues vocalist with over two decades of captivating audiences worldwide. Built and managed by Gold Bottom Entertainment LLC.

- **Live URL**: [layoungbandpage.com](https://layoungbandpage.com)
- **Genre**: Soul, Jazz, R&B, Blues
- **Key Achievements**: Maryland Artist of the Year (2018), 100+ live performances, recordings with Pieces of A Dream, new material produced with Norman Connors / Gold Bottom Productions. (UK-chart claims removed 2026-07-16 per credential-accuracy rule — never use as credentials.)

## Tech Stack

- **Frontend:** Pure HTML5, CSS3, Vanilla JavaScript (no frameworks)
- **Hosting:** GitHub Pages (static deployment from `main` branch)
- **Backend:** Node.js/Python API on DigitalOcean (email, contact forms)
- **Email:** Listmonk (self-hosted on DigitalOcean)
- **E-commerce:** Shopify (merch store)
- **No package manager, no bundler, no build tools**

## Project Structure

```
LAYoungBandPage/
├── index.html              # Entry point (loads SPA shell)
├── contact.html            # Standalone contact page
├── mobile-menu.html        # Mobile navigation overlay
├── CLAUDE.md               # This file — project knowledge
├── CNAME                   # GitHub Pages custom domain (layoungbandpage.com)
├── css/                    # Modular CSS (12 files)
│   ├── base.css            # CSS variables, resets, design tokens
│   ├── style.css           # Master stylesheet (imports all others)
│   ├── components.css      # Reusable UI components
│   ├── layout.css          # Grid/flexbox layouts
│   ├── sections.css        # Section-specific styles
│   ├── pages.css           # Page-specific styles
│   ├── animations.css      # Transitions, keyframes
│   └── ...                 # mobile-menu, backgrounds, scroll, slideshow
├── js/                     # Modular JS (20 files)
│   ├── config.js           # Global site configuration flags
│   ├── main.js             # App controller (v2.1.0) - initializes all modules
│   ├── router.js           # Client-side hash/history routing
│   ├── page-loader.js      # Dynamic page loading from pages/
│   ├── api.js              # Backend API communication
│   ├── gallery.js          # Photo gallery & lightbox
│   ├── slideshow.js        # Backstage slideshow (124 images)
│   ├── media-player.js     # Audio/video playback
│   ├── forms.js            # Email signup & contact form handling
│   ├── navigation.js       # Desktop nav
│   ├── mobile-menu.js      # Mobile hamburger menu
│   └── ...                 # utils, analytics, scroll-effects, swipe, sound-effects
├── pages/                  # HTML page templates (loaded dynamically)
│   ├── home.html           # Home — hero video, featured content
│   ├── bio.html            # Artist biography
│   ├── music.html          # Music player with album art, lyrics scroller
│   ├── videos.html         # Video content
│   ├── gallery.html        # Photo gallery with lightbox
│   ├── performances.html   # Live show history
│   ├── merch.html          # Merchandise (Shopify integration)
│   ├── contact.html        # Contact/booking form
│   └── boonbox.html        # Special feature page
├── Media/                  # Featured track audio files (MP3)
├── images/                 # Media assets
│   ├── artist/             # Artist photos, hero video (MP4)
│   ├── band/               # Band cartoon PNGs (game assets)
│   ├── cartoon/            # Cartoon art (game assets)
│   ├── backgrounds/        # Section backgrounds (25)
│   ├── gallery/            # Event/performance photos (124)
│   └── icons/              # UI icons
├── music/                  # Background music tracks (MP3)
├── sounds/                 # UI sound effects (WAV)
├── EPK/                    # Electronic Press Kit
│   ├── layoungepk.html     # EPK page with retro manila folder UI
│   └── css/retro.css       # Retro EPK styles, gold watermark, luxury bg
├── GroovyBandRush/         # Phaser 3 mini-game (see below)
├── game.html               # Canvas game entry point (separate from Phaser)
└── .github/workflows/
    └── static.yml          # Deploys from main → GitHub Pages
```

## Architecture Patterns

- **SPA with client-side routing** — `router.js` handles navigation, `page-loader.js` fetches HTML from `pages/`
- **Inline script execution** — `page-loader.js` has `executeInlineScripts()` to re-create `<script>` tags after `innerHTML` injection (browsers skip scripts inserted via innerHTML)
- **IIFE module pattern** — Each JS file wraps logic in an IIFE with `'use strict'`
- **Global namespace** — Modules expose themselves on `window` (e.g., `window.App`, `window.Utils`)
- **CSS design tokens** — All colors, spacing, typography defined as CSS variables in `base.css`
- **No build step** — Edit files directly, refresh browser to test
- **PageLoader caching** — Pages are cached after first fetch; call `PageLoader.clearCache()` in browser console after editing page HTML to force reload

## Key Design Tokens (from `css/base.css`)

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#ffd700` | Gold - primary brand color |
| `--color-accent` | `#e63946` | Red - CTAs, highlights |
| `--color-bg-dark` | `#0a0a0a` | Deep black background |
| `--color-bg-navy` | `#1a1a2e` | Navy sections |
| `--color-bg-blue` | `#16213e` | Blue sections |
| `--font-primary` | `'Playfair Display', 'Didot', serif` | Headings |
| `--font-secondary` | `'Georgia', 'Times New Roman', serif` | Body text |

## Key Features

### Music Page (`pages/music.html`)
- **Album cover with vinyl** — Animated sleeve + vinyl disc that slides out on hover, with Gold Bottom Ent. label
- **Custom audio player** — HTML5 `<audio>` with play/pause, progress bar (gold gradient), seek, time display
- **Volume controls** — Mute toggle button (speaker emoji states) + range slider with gold thumb styling
- **Lyrics auto-scroller** — Proportional scroll synced to `currentTime/duration`, collapsible panel with fade masks
- **Background music integration** — Stops background music on play, resumes on pause/end via `BackgroundMusic` module
- All player logic is inline `<script>` in music.html (executed via `page-loader.js` `executeInlineScripts()`)

### Home Page (`pages/home.html`)
- **Hero video background** — Autoplaying muted looping MP4 video behind hero content with poster fallback

### EPK (`EPK/layoungepk.html`)
- **Retro manila folder design** — Interactive open/close folder with vintage paper textures
- **Gold watermark layer** — Animated drifting SVG watermark with metallic gradients
- **Luxury dark background** — Animated gradient backdrop with slow gold shimmer overlay
- **Back-to-site button** — Fixed position vintage label style link back to main site

### Gallery (`pages/gallery.html`)
- **124 images** from `images/gallery/` displayed in a responsive grid
- **Lightbox** with keyboard navigation and swipe support
- **Slideshow mode** with auto-advance

## Session Rules (applies to all ecosystem sessions)

- **Sound alerts**: Play notify sound (5x) BEFORE showing AskUserQuestion or ExitPlanMode — the sound alerts the user that a button/question is waiting. Do NOT play sound after the user clicks approve. Sequence: (1) play sound → (2) show question/approval.
- **Global approvals**: NEVER ask for approval on: commits, pushes, sync, file edits, installs, browser opens, builds, tests. Just do it. Only ask questions for genuinely ambiguous requirements or decisions.
- See memory files for full approvals list and sound command.

## Development Workflow

1. Edit HTML/CSS/JS files directly (no compilation needed)
2. Open `index.html` in a browser or use a local server
3. Refresh to see changes (clear PageLoader cache if editing page HTML)
4. Push to `main` branch to deploy via GitHub Pages

## Git Conventions

- **Main branch:** `main` (auto-deploys to GitHub Pages via `.github/workflows/static.yml`)
- **Feature branches:** `claude/<name>` for Claude-assisted work
- **Remote:** `origin` → `github.com/djmochajava-lang/LAYoungBandPage`
- Keep commits descriptive but concise

## Code Style

- Vanilla JS only — no jQuery, no frameworks
- Use CSS variables from `base.css` for all colors/spacing/typography
- IIFE pattern with `'use strict'` for JS modules
- JSDoc comments for module-level documentation
- Console logging with emoji prefixes for debugging
- Responsive design with mobile-first considerations

## Important Notes

- `config.js` has feature flags (e.g., `showPerformancesMenu`) — check before toggling features
- The slideshow uses 124 images from `images/gallery/` — be mindful of load performance
- Sound effects and background music are optional UX features with user controls
- `.bak` files in `pages/` are manual backups — don't delete them
- Mobile experience is critical — test mobile layouts for any UI changes
- The site uses scroll-based animations and parallax effects
- Forms integrate with an external Listmonk API for email subscriptions
- **SPA script execution** — When adding inline `<script>` to page HTML files, they will only run because `page-loader.js` re-creates them as DOM nodes after innerHTML injection
- **Large media files** — `Media/`, `.mov`, `.mp4` files should be in `.gitignore` if too large for GitHub

---

## GroovyBandRush — Phaser 3 Mini-Game

### Overview
- Phaser 3.80.1 mini-game (12 scenes, portrait 450-900x800)
- Located at `GroovyBandRush/` subdirectory
- Linked from main site; game links back via `../index.html`
- Separate canvas game at `game.html` (NOT Phaser)

### Scene Flow
```
MainMenuScene → StoryScene (prologue) → Act1RunnerScene → StoryScene →
Act2RhythmScene → StoryScene → Act3MatchScene → StoryScene →
Act4SimonScene → StoryScene → Act5PianoScene (piano game →
SingerOutfitScene → genre choice → finale) → VictoryScene
```

### Band Members
| Index | Name | Instrument | Texture Key | Color |
|-------|------|-----------|-------------|-------|
| 0 | Eugene Chapman | Saxophone | `member_0` | #3498db (blue) |
| 1 | Kevin Walker | Bass | `member_1` | #9b59b6 (purple) |
| 2 | Kevin Robinson | Guitar | `member_2` | #e74c3c (red) |
| 3 | Jimmy Carney | Drums | `member_3` | #2ecc71 (green) |
| 4 | L.A. Young | Vocals | `member_4` | #e8751a (orange) |

### Sprite Sizing — CRITICAL
**Always use `setDisplaySize(w, h)` not `setScale()`** for band member sprites. The PNG sources vary wildly in dimensions (427x640 to 3024x4032), so setScale produces unpredictable results.

### Game Config
- Width: 450-900px (responsive, clamped), Height: 800px
- Renderer: Phaser.AUTO, Physics: Arcade (gravity: 0)
- Scale: FIT + CENTER_BOTH
- Game Fonts: Bangers (display), Righteous (fun), Playfair Display (body)

### Key Gotchas
- **`scene.scene.start()` from `create()` silently fails** — use `this.game.scene.stop/start` (global SceneManager)
- **`camerafadeoutcomplete` event is unreliable** — use `setTimeout(fn, duration + 50)` with `game.scene.stop/start`
- **`scene.time.delayedCall` gets throttled** in background tabs — use native `setTimeout` for critical timing
- Always save `scene.game` reference before async callbacks (scene may be destroyed by callback time)

### Testing Tips
- Skip to Act5 finale: `window.game.scene.stop('MainMenuScene'); window.game.scene.start('Act5PianoScene', { resumeAtGenre: true });`
- Skip to VictoryScene: `window.game.scene.stop('MainMenuScene'); window.game.scene.start('VictoryScene');`
