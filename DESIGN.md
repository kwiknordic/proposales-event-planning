# Design system

Goal: the app should look like it belongs to proposales.com. Values below are taken from the live site's stylesheet (Webflow "proposales-2026", fetched 2026-10-10), simplified to what this app needs.

**Read this before any UI work.** Slice 0 implements the tokens and classes in `app/globals.css`; later slices only use them.

## Character

- **Monochrome.** Black is the brand color. No blue links, no colored buttons. Color only for status (success green, failure red).
- **Calm and spacious.** Light gray page, white cards, thin translucent borders, generous spacing.
- **One typeface, one weight.** Switzer 400 everywhere; hierarchy comes from size, not boldness. Use 500 sparingly (labels, table headers).
- **Pill buttons** (fully rounded), square-ish inputs (4px radius).

## Rules for writing UI

1. **Prefer own classes in `app/globals.css`** for anything reusable (buttons, cards, fields, tables, banners). Pages compose these classes.
2. **Tailwind only for one-off layout** where we would otherwise write inline styles: `flex`, `grid`, `gap-*`, `mt-*`, `items-center`, `justify-between`, responsive tweaks. Not for colors, radii or fonts: those come from the variables.
3. **No inline `style={{...}}`** in components.
4. **Every color, radius, spacing, size and font goes through a CSS variable** from `:root`. No raw hex values in classes.
5. **Exception: email HTML** (`lib/email/renderHtml.ts`). Email clients ignore stylesheets and variables, so it keeps inline styles, using the same hex values as below.

## Tokens (`:root` in `globals.css`)

```css
:root {
  /* Neutrals (proposales core scale) */
  --color-white: #ffffff;
  --color-neutral-50: #f9f9f9;
  --color-neutral-100: #eeeeee;
  --color-neutral-200: #cccccc;
  --color-neutral-500: #c0c0c0;
  --color-neutral-550: #949494;
  --color-neutral-600: #747474;
  --color-neutral-800: #474747;
  --color-neutral-850: #353535;
  --color-neutral-900: #292929;
  --color-black: #000000;

  /* Semantic */
  --color-bg: var(--color-neutral-50);          /* page background (surface-1) */
  --color-surface: var(--color-white);          /* cards, inputs (surface-2) */
  --color-surface-muted: var(--color-neutral-100); /* table header, subtle fills (surface-3) */
  --color-text: var(--color-neutral-850);       /* body text */
  --color-text-muted: color-mix(in srgb, var(--color-neutral-850) 70%, transparent);
  --color-heading: var(--color-neutral-900);
  --color-border: #0000001f;                    /* 12% black */
  --color-border-strong: var(--color-neutral-900); /* focused input */
  --color-primary: var(--color-black);          /* primary button, links */
  --color-on-primary: var(--color-white);
  --color-primary-hover: var(--color-neutral-800);
  --color-badge-bg: #0000001a;                  /* 10% black */
  --color-success: #4cc02b;
  --color-failure: #ce1919;
  --color-failure-bg: #fdecec;                  /* our addition: error box fill */
  --color-highlight: #fff6d6;                   /* our addition: "changed" / demo banner fill, keep subtle */

  /* Typography */
  --font-sans: "Switzer", Arial, sans-serif;
  --text-small: 14px;
  --text-body: 16px;
  --text-lead: 19px;   /* body x 1.19 */
  --text-h3: 23px;
  --text-h2: 27px;
  --text-h1: 32px;
  --text-display: 45px; /* landing page hero only */
  --leading-body: 1.5;
  --leading-heading: 1.2;
  --tracking-heading: -0.01em;

  /* Spacing (proposales gap scale) */
  --space-1: 3px;
  --space-2: 6px;
  --space-3: 9px;
  --space-4: 12px;
  --space-5: 18px;
  --space-6: 24px;
  --space-7: 36px;
  --space-8: 48px;
  --space-9: 60px;
  --space-10: 72px;
  --space-11: 96px;

  /* Radii */
  --radius-small: 4px;   /* inputs, small boxes */
  --radius-medium: 12px; /* cards, banners */
  --radius-large: 18px;  /* hero images */
  --radius-pill: 200px;  /* buttons, badges */

  /* Controls */
  --control-height: 48px;
  --control-height-small: 36px;
  --control-padding-x: 24px;
  --control-padding-x-small: 18px;
  --input-padding: 12px;

  /* Layout */
  --content-width: 712px;  /* form pages, header island (proposales.com main column) */
  --wide-width: 1128px;    /* landing page (proposales.com main-container) */
}
```

The proposales scale factor is 1.19 on desktop (1.12 on mobile); the heading sizes above are rounded from it. On small screens, step headings down one size.

## Component classes (`app/globals.css`)

| Class | Use | Look |
|---|---|---|
| `.container`, `.container-wide` | Page width | `max-width: var(--content-width)` / `--wide-width`, centered, side padding `--space-6` |
| `.site-header` | White header bar on every page (like the proposales.com nav island) | `--color-surface`, `--radius-small`, `max-width: var(--content-width)`, min-height 60px, name left, small `.btn` right |
| `.section` | Vertical block on a page | `padding-block: var(--space-8)`; landing sections (`.section-landing`) use `--space-10` |
| `.card` | Grouped form sections, info boxes | `--color-surface` background, **no border** (white on the gray page, as on proposales.com), `--radius-medium`, padding `--space-6`. No shadow |
| `.card-dark` | The closing call to action on the landing page | `--color-black` background, white text, `.btn` inside turns white with dark text |
| `.btn` | Primary action (Submit, Try the demo) | Pill: height `--control-height`, padding-x `--control-padding-x`, `--color-primary` bg, `--color-on-primary` text, `--font-sans` 16px weight 400, no border, `transition: background-color .2s`; hover `--color-primary-hover`; disabled 40% opacity, `cursor: not-allowed` |
| `.btn-secondary` | Save, Add row, Back | Same shape, `--color-surface-muted` bg (light gray), `--color-heading` text, no border; hover `--color-neutral-200` |
| `.btn-sm` | Row actions (Remove, Add attendee) | height `--control-height-small`, padding-x `--control-padding-x-small`, `--text-small` |
| `.btn-link` | Inline text actions | No background, underline on hover, `--color-primary` |
| `.field` | Label + input wrapper | `display: grid; gap: var(--space-2)` |
| `.label` | Field label | `--text-small`, weight 500, `--color-text` |
| `.input`, `.select`, `.textarea` | Form controls | height `--control-height` (textarea auto), padding `--input-padding`, `--color-surface` bg, `1px solid --color-border`, `--radius-small`; focus: border `--color-border-strong`, no glow/outline ring beyond `outline: 2px solid transparent` + visible border |
| `.row` | One repeated row (agenda item, attendee) | grid with `gap: var(--space-3)`, inputs then a `.btn-sm` |
| `.table` | Read-only lists (summary, landing) | full width, `border-collapse: collapse`, header `--color-surface-muted` weight 500 `--text-small`, cells padding `--space-3 --space-4`, bottom border `--color-border` |
| `.badge` | Status ("Sent to hotel", "Hotel notified of changes") | pill, `--color-badge-bg`, `--text-small`, padding `--space-1 --space-4` |
| `.banner` | Demo banner, info strips | `--color-highlight` bg, `1px solid --color-border`, `--radius-medium`, padding `--space-4 --space-5`, flex row, space-between |
| `.alert-error` | Errors, 409 conflict | `--color-failure-bg` bg, `--color-failure` text and 1px border, `--radius-small`, padding `--space-4` |
| `.alert-success` | "Saved" | text `--color-success` (or a neutral card with a green dot); keep quiet |
| `.text-muted` | Hints, captions | `--color-text-muted`, `--text-small` |
| `.text-display` | Landing hero heading | `--text-display`, line-height 1.1, `--tracking-heading`; `--text-h1` below 768px |
| `.heading-muted` | Faded second line of a heading (proposales.com headline style) | `--color-heading` at 50% |
| `.lead` | Intro paragraphs | `--text-lead`, `--color-text-muted` |
| `.quote` | The review quote on the landing page | `--text-lead`, left border 2px `--color-primary`, padding-left `--space-6`, `--color-heading` |
| `.grid-cards` | Rows of cards (landing steps, demo page) | `display: grid; gap: var(--space-6)`; 1 column on mobile, `repeat(auto-fit, minmax(240px, 1fr))` from 768px |

Base elements: `body` uses `--color-bg`, `--color-text`, `--font-sans`, `--text-body`, `--leading-body`. Headings use `--color-heading`, weight 400, `--tracking-heading`, `--leading-heading`. Links: `--color-primary`, underlined.

## Font: Switzer

Switzer is free (Indian Type Foundry, Fontshare, ITF Free Font License, commercial use allowed). The site also loads Circular Pro, which is commercial: **do not use it.**

Preferred: self-host via `next/font/local` (download the variable woff2 from fontshare.com into `app/fonts/`) and expose it as `--font-sans`. Quick alternative: `@import url("https://api.fontshare.com/v2/css?f[]=switzer@400,500&display=swap");` at the top of `globals.css`. Check `node_modules/next/dist/docs/` for the Next 16 `next/font` API first.

## Setup (slice 0)

Tailwind v4 with PostCSS: `npm i -D tailwindcss @tailwindcss/postcss`, a `postcss.config.mjs` with `{ plugins: { "@tailwindcss/postcss": {} } }`, and `@import "tailwindcss";` at the top of `globals.css` (before our own rules). Check `node_modules/next/dist/docs/` for anything Next 16 changed. Map tokens into Tailwind via `@theme` only if a utility actually needs them (e.g. `gap-*` using our spacing); colors stay in classes.

## Accessibility

- Visible focus on every control (the dark border on inputs; a 2px `--color-primary` outline with offset on buttons and links).
- Every input has a `<label>`. Row inputs without a visible label get an `aria-label` (e.g. "Attendee name, row 3").
- Text contrast: body text `--color-text` on `--color-bg` passes WCAG AA; do not put `--color-text-muted` on `--color-surface-muted`.
- Buttons are `<button>`, navigation is `<a>`/`<Link>`.
