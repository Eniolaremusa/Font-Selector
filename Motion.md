# motion.md — Font Selector

## When to use this doc

Do NOT build any of this until the functional version works (PRD build phases 1–4): matching logic correct, sliders/toggle working, Surprise-me and Pairs-with setting controls correctly, all with plain unstyled controls. Motion is the final polish phase only. If the underlying interaction changes during the build, update this doc rather than forcing the animation.

All springs use Framer Motion (`motion/react`). Prefer spring physics over fixed durations for anything that moves; use durations only for simple fades.

## Global feel

The tool should feel calm and considered. Motion is quiet and supportive, never flashy. The font preview is the star — animations serve it, they don't compete with it. When in doubt, less motion.

## 1. Font swap (the main transition)

When the previewed font changes (via slider, Surprise me, or Pairs-with), the sample text does not hard-cut. It swaps with an arc motion:

- The outgoing font exits toward the left along a shallow arc (a semicircle-ish path), fading and scaling down slightly as it goes.
- The incoming font enters from the right along the mirrored arc, fading and scaling up into place at center.
- The two overlap briefly mid-transition.
- Once the incoming font lands centered, it settles and the arc motion resolves.

Keep this 2D — a shallow arc path plus fade and slight scale reads as "circular" without real 3D. Do not use actual 3D/WebGL here.

Spring: gentle, slightly settled (low bounce). Roughly visualDuration 0.5, bounce 0.1. Tune in the polish pass.

## 2. Font-name tab (dial roll)

The font name (in its tab near the preview) changes with a vertical dial/odometer roll, separate from the sample text's horizontal arc:

- Old name rolls upward and out.
- New name rolls up into place from below.
- Bottom-to-top direction (reads as "advancing," like an odometer).

This runs in sync with the font swap but on its own axis (vertical), so the two transitions feel related but distinct.

## 3. Sliders

- Fluid, smooth dragging (eased), not steppy during the drag itself.
- Eight snap points representing 20/30/40/50/60/70/80/90 (or the chosen scale). A gentle snap when the thumb reaches each point — subtle tactile confirmation the user has hit a real value, nothing heavy.
- The drag handle (thumb) is only visible on hover or during drag. When the pointer leaves, the thumb fades out, leaving a clean track.

## 4. Serifness toggle

- Segmented Sans / Serif / Any control, sized to match a slider cell.
- The active-segment indicator slides smoothly between segments on selection (a spring-driven pill moving under the active label), rather than hard-cutting the highlight.

## 5. Save / bookmark

On click, the bookmark icon does a bouncing "pop":

- Shrinks slightly, then enlarges past normal size, then settles back to normal — a ball-bounce feel (spring with visible bounce).
- On the settle, the icon color changes to the accent red `#D36359` to indicate saved state.
- Clicking again to unsave reverses: quick shrink and return to the default (unsaved) color.

## 6. Surprise me

When triggered, the sliders animate to the chosen font's values rather than jumping. All five sliders spring toward their new positions together (staggered very slightly is optional), and the serifness toggle's indicator slides to the new category. This makes Surprise-me feel like the tool is "showing" you the font's makeup, not just swapping a result.

## 7. Pairs-with

Same as Surprise me: clicking the paired font name animates the sliders and toggle to the new font's values, alongside the font-swap arc and name-roll. The controls visibly reconfigure to reflect the newly shown font.

## 8. Font-change orchestration

When the previewed font changes (slider release, Surprise me, Pairs-with, or serifness toggle), the motion layers run as one choreographed moment — not five independent animations on the same frame.

**Lead:** the preview sentence tick (odometer roll) starts first after a brief hold (`FONT_CHANGE_PREVIEW_HOLD_MS`).

**Trail (40–60% overlap):** the font-name resolve, pairs chip, and programmatic slider/toggle movement start partway through the preview roll (`FONT_CHANGE_TRAIL_OVERLAP_RATIO`), staggered slightly from each other:

- Name tab → `FONT_CHANGE_NAME_START_MS`
- Pairs chip → `FONT_CHANGE_PAIRS_START_MS` (36ms after name)
- Controls (Surprise me / Pairs-with) → `FONT_CHANGE_CONTROLS_START_MS` with duration sized to fit the budget

**Budget:** everything resolves within `FONT_CHANGE_BUDGET_MS` (~700ms). Manual slider snaps on release stay immediate — the user's hand defines t=0 for that axis.

All offsets live in `src/lib/motionConstants.ts` as named constants. Tune overlap ratio or start offsets there during the feel pass.

## Notes on tuning

- Expose spring values (stiffness/damping or visualDuration/bounce) as named constants so they can be adjusted by hand during the feel pass.
- Consider a hidden dev tuning panel (like the DialKit-style panel used before) to dial these live, then bake in the final values and hide the panel behind a flag.
- The `leva` library gives a ready-made GUI panel of sliders/toggles and is a fast way to build this live tuning panel instead of hand-rolling one. Use it only as a dev/tuning tool during the feel pass — read off the values you like, bake them in as constants, and remove or hide the panel before shipping. Not part of the shipped UI.
- Do the feel pass properly: build it, then adjust one value at a time and re-watch. The craft is in the tuning, not the first version.

