# PRD — Font Selector

## Overview

A tool for finding fonts by *feeling* rather than by name. Instead of browsing an alphabetical list or already knowing what you want, the user shapes a set of qualities (warm, expressive, wide, etc.) and the tool surfaces the real font that best matches. The core idea: *search by feel, not by name.*

This is a portfolio / craft piece. The emphasis is on the interaction and motion quality, not on shipping a production font library.

## Goal

Let a user dial in the qualities they want and immediately see a matching real font, previewed live, with the option to grab it (via an external link). The experience should feel like the tool *understands the direction they're shaping*, not just filtering a list.

## Core concept

- Five continuous sliders describe how a font *feels*.
- One toggle filters by structure (sans vs serif).
- As the user adjusts controls, the tool finds the closest-matching font from a fixed, hand-curated dataset and previews it.
- The font preview is the star of the screen. Everything else is quiet around it.

## The six controls

Five sliders (0–100):

| Control | 0 | 100 |
|---|---|---|
| Warmth | Cold | Warm |
| Personality | Plain | Vivid |
| Structure | Rigid | Soft |
| Presence | Quiet | Loud |
| Width | Slim | Wide |

One toggle:

- Serifness: Sans / Serif / Any

Serifness is a toggle, not a slider, because a font is essentially either sans or serif — there is no meaningful continuous middle. "Any" lets the user leave structure open when they don't have a preference.

## The data

The font dataset lives in `src/data/fonts.json`. It contains 24 Google Fonts, each scored 0–100 on the five slider axes, labelled Sans or Serif, and given one recommended pairing font. The file is the engine of the whole tool — every recommendation comes from it.

Each font entry:
```
{
  "id": "inter",
  "name": "Inter",
  "warmth": 25,
  "personality": 18,
  "structure": 8,
  "presence": 30,
  "width": 48,
  "serifness": "Sans",
  "pairsWith": "Instrument Serif"
}
```

Do not load real font files for matching logic. Fonts are rendered for preview via Google Fonts (`next/font/google`), and a "get this font" link points out to Google Fonts. No font-file bundling or hosting beyond what `next/font` handles.

## The matching logic

When the user sets the controls:

1. If Serifness is Sans or Serif, filter the dataset to only fonts of that category. If Any, use all fonts.
2. From the filtered set, find the font whose five axis scores are *closest* to the five slider values. Closeness = smallest total distance across the five axes (sum of squared differences, i.e. nearest-neighbour).
3. That closest font becomes the previewed font.

This is a simple nearest-neighbour match. No AI, no external API.

## Core interactions

### 1. Sliders drive the font
Adjusting any slider re-runs the match and updates the previewed font. The font name updates to match.

### 2. Surprise me
A "Surprise me" button picks a random font from the dataset. Crucially, this works *backwards*: the chosen font's own axis scores are read, and all five sliders animate to those values, and the serifness toggle sets to that font's category. So the controls always reflect the currently shown font. Build the controls to support being *set* programmatically, not only dragged.

### 3. Pairs with
The preview shows "Pairs best with [font name]". Clicking that font name switches the preview to that font — and, like Surprise me, animates the sliders and toggle to reflect the newly shown font.

### 4. Save
A bookmark/save control lets the user shortlist fonts they like.

### 5. Get this font
A link out to the font on Google Fonts.

## Layout

- Top: large live preview of sample text in the current font. This is the visual hero.
- The current font's name sits in a tab above or near the preview.
- "Surprise me" and the save control sit top-right.
- "Pairs best with [name]" sits near the preview.
- Below: a "find your font" control panel — the five sliders in a two-column grid, with the serifness toggle occupying the sixth cell, sized to match the slider cells so the grid reads as one consistent set.

## Out of scope (v1)

- No real font-file hosting or custom font uploads.
- No use-case / "best for" scoring (may come in v2).
- No tags.
- No accounts or persistence beyond in-session saves.
- No taste-meter sentence (deliberately cut — the fonts are the focus).

## Build order

1. Scaffold the Next.js + TypeScript + Tailwind project.
2. Load `fonts.json` and build the nearest-neighbour matching logic. Confirm matches feel right with plain, unstyled controls first — the data must feel correct before any polish.
3. Build the control panel (five sliders + serifness toggle) and the live preview.
4. Wire up Surprise me and Pairs-with (both set controls programmatically).
5. Only then: motion and polish (see motion.md).

Functional correctness first, feel second.