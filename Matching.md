# matching.md — Font Selector recommendation engine

How recommendations are chosen. This is the intelligence layer: `fonts.json` is the knowledge, this doc is the logic, `motion.md` is how changes are presented.

## Inputs

- Five slider values, each 0–100: warmth, personality, structure, presence, width.
- One serifness toggle: Sans / Serif / Any.
- Recent axis history: which sliders the user adjusted most recently (used for weighting).

## Serif filtering

- If the toggle is Sans or Serif, the candidate pool is only fonts with that `serifness` value.
- If Any, the pool is all fonts. Serifness plays no part in distance — it is a filter, never a scored axis.

## Distance calculation

For each candidate font, distance from the user's slider values is a **weighted** sum of squared differences across the five axes:

```
distance = w_warmth   × (u.warmth - f.warmth)²
         + w_personality × (u.personality - f.personality)²
         + w_structure × (u.structure - f.structure)²
         + w_presence  × (u.presence - f.presence)²
         + w_width     × (u.width - f.width)²
```

The recommended font is the candidate with the smallest distance (nearest neighbour).

### Axis weighting (recent-gesture bias)

Equal weighting across five axes makes a single slider feel inert: moving one axis is outvoted by the four that did not move, so the current font stays anchored until the moved axis reaches an extreme.

To make the user's gesture decisive, axes are weighted by recency:

| Position in recent history | Weight |
|---|---|
| Most recently moved axis | 3× |
| Previously moved axis | 1.5× |
| All other axes | 1× |

- Recent history is an ordered list of axis keys, most recent first. Adjusting an axis moves it to the front; adjusting it again refreshes its position.
- Only the two most recent axes receive boosted weights; older axes decay back to 1×.
- Programmatic changes (Surprise me, Pairs-with click, serifness toggle) clear recent history so all axes return to equal 1× weight until the user drags a slider again.
- While dragging, each value change updates recent history immediately so the axis under the pointer is always weighted 3×.

Constants: `RECENT_AXIS_WEIGHT = 3`, `PREVIOUS_AXIS_WEIGHT = 1.5`, `DEFAULT_AXIS_WEIGHT = 1` (in `matchFont.ts`).

### Dev diagnostics

In development, releasing a slider pointer logs the top 3 nearest fonts with distances and the active axis weights to the console (`logMatchDiagnostics`).

## Ties

If two or more fonts have exactly equal distance, pick the one closest on Warmth alone. If still tied, pick the one that appears first in `fonts.json`. (Ties are rare with this dataset; the rule just needs to be deterministic.)

## Surprise me

- Picks a random font from the full dataset (ignoring the current serif filter — surprise means surprise).
- Excludes the currently shown font, so it always visibly changes.
- Works backwards: the chosen font's five axis values are written to the sliders, and the toggle is set to that font's serifness category. The controls always reflect the shown font.
- Clears recent axis history.

## Pairs with

- Each font has exactly one `pairsWith` value in fonts.json — a font name.
- Clicking it switches the preview to that font and, like Surprise me, sets the sliders and toggle to the new font's values.
- If a `pairsWith` name ever fails to resolve to a font in the dataset (data error), fall back to doing nothing and log a warning — never crash the preview.

## Update flow

Any input change (slider drag, toggle change, Surprise me, Pairs-with click) re-runs: filter → weighted distance → pick. The result feeds the orchestration timeline in motion.md. Matching itself is synchronous and instant; all perceived timing comes from the motion layer.

## Known data gaps

- **Width**: no fonts exist between 14 (Oswald) and 40 (Caveat). Mid-range width sweeps will surface fewer distinct fonts until 1–2 condensed faces are added to the dataset.

## Future extension

The engine is a pure function: (slider values, toggle, recent axes) → font. Any future recommendation source (e.g. an AI suggesting axis values from a text description) plugs in by producing the same inputs; nothing downstream changes.
