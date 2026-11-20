# Style guide: bringing the prototype to Mygate's look

The prototype's flow, timing and camera work are final. Its look is a first pass made **without Mygate's brand guide**: the colours, character art and illustration style are placeholders that a designer should bring to Mygate's style. This guide explains what you can change freely, what you must keep, and how to check you didn't break anything.

## 1. Colours and fonts: edit one file

Every colour and font in the prototype is a named token in [`prototype/css/theme.css`](../prototype/css/theme.css). The art and the code never use a raw colour, so changing a value there restyles everything that uses it.

| Group in `theme.css` | What it controls |
| --- | --- |
| Fonts (`--font-ui`, `--font-display`, `--font-mono`) | Form card text; signs and nameplate; lift floor display |
| Form card and UI (`--accent`, `--ink`, `--muted`, `--ok`, `--err`, …) | Buttons, links, fields, OTP boxes, error and success states, speech bubbles |
| World — Shared | Lamplight, plants, terracotta pots, towers, trees, eyes |
| World — Sky | Sky, interior light, lift steel and lobby glass gradients |
| World — Gate / Cabin / Lift / Corridor | Everything specific to that scene, from the arch stone to the guard's uniform and the front door |

Start here:

1. Set `--accent` to Mygate's primary brand colour and check the button text still reads (white on accent needs at least 4.5:1 contrast).
2. Set `--font-ui` and `--font-display` to the brand typeface. If it isn't on Google Fonts, add its `@font-face` to `theme.css` and drop the Google Fonts `<link>` in `index.html`.
3. Adjust the world palette so it feels like Mygate: for example, the guard's uniform (`--c-uniform`, `--c-uniform-dark`, `--c-cap-peak`), the gate stone (`--c-stone`), the arch lettering (`--c-sign-ink`) and the lamplight (`--c-amber`).

Each token has a comment saying where it is used.

## 2. Redrawing art: what you can change and what you must keep

The art lives as inline SVG in [`prototype/index.html`](../prototype/index.html), in four scene groups (`set-gate`, `set-cabin`, `set-lift`, `set-corr`). Each scene is split into layers (`<g class="pl" data-f="…">`) that move at different speeds for the parallax effect.

**You can freely:**
- Redraw any shape: buildings, trees, the gate, the cabin, the lift, the corridor, the living room.
- Restyle or redraw the two characters (the guard and the resident) in Mygate's illustration style.
- Add detail inside any layer.
- Change copy in the form card (keep the meaning; see the spec for required wording).

**You must keep:**
- **The design space:** 390 × 844 px, with the important art in the top ~470 px (the form card covers the rest).
- **The four scene groups and their layer factors** (`data-f`). A new layer is fine; give it a factor between the ones around it (small = far away, large = close to the camera).
- **Every element id the code animates** (table below). If you redraw one of these parts, keep the id on the new group.
- **The pivot points**, or update the numbers in `js/flow.js` to match your art.

| Id | What the code does with it | Pivot / geometry the code assumes |
| --- | --- | --- |
| `gatePanel` | Slides the gate left 232 px; rattles on an invalid number | Gate sits between the pillars, x 84–306 |
| `strip` | Code draws 10 light segments into it on the left pillar | Segments at x 49, y 208–383 |
| `gHead` | Guard nods and tilts | Rotates around (200, 246), the base of the neck |
| `gEyes` | Eyes follow the OTP box being filled | Moves up to ±6 px |
| `gMouth` | Smile ↔ frown (code swaps its path `d`) | Mouth around (200, 235) |
| `gArm` | Writing loop; hidden on approval | — |
| `gCross` | Folded arms shown on lockout | — |
| `cabinDim` | Cabin light dims on lockout | Covers the cabin window |
| `boom` | Boom barrier lifts | Rotates around (386, 339) |
| `glassL`, `glassR` | Lobby glass doors slide apart 86 px each | — |
| `liftDoorL`, `liftDoorR` | Lift doors open/close 99 px each | Doors span x 96–294 |
| `liftDisp`, `liftArrow`, `liftDing` | Floor display text, up-arrow, ding ring | Display at (120–270, 50–94) |
| `liftBeyond`, `liftBeyondCorr` | Lobby seen through the open doors, swapped for the corridor during the ride | Inside x 96–294 |
| `lbRent`, `lbBuy` | Floor buttons light for the chosen intent | — |
| `liftStripes` | Light bands sliding down the doors during the ride | Clipped to the doors |
| `kDoor` | Front door swings (code squashes it horizontally from the hinge) | Hinge at x 120; door 150 px wide, y 104–390 |
| `kPlate`, `kPlateClip` | Nameplate text and its engrave reveal | Plate at (160–230, 150–178) |
| `kChain` | Code draws the chain each frame from the door edge to the plate at (276, 236) | Chain plate on the frame at x 272 |
| `kRes` | Resident moves: peeking (x 268) → doorway (x 214) → steps aside (x 262) | Drawn around x = 0; the code positions it |
| `kResEyes`, `kResMouth`, `kResArm` | Eyes follow the code boxes, squint, frown, wave | Arm rotates around (24, 288) in the resident's own space |
| `kFingers` | Fingers on the door edge while it's on the chain | Code moves it to the door edge |
| `kSpill`, `kInDark`, `kDoorShade` | Light spill, dark interior, door shading as the door opens | — |
| `kBell`, `kBellGlow`, `kRipple` | Doorbell lit, glow, ring ripple | Bell at (305, 250) |

The form card, speech bubble and side panel are HTML (`#card`, `#bubble`, `.side`), styled in [`prototype/css/app.css`](../prototype/css/app.css).

## 3. Timing: leave it unless the product owner agrees

All durations and easings are in [`prototype/js/motion.js`](../prototype/js/motion.js). The spec's acceptance criteria are written against these numbers, so changes there change the build target. Discuss before changing; if you do, update the storyboard table in [`docs/spec.md`](spec.md).

## 4. Check your work

1. Open `prototype/index.html` in Chrome, press **Autoplay**, and watch all three user types (switch in the side panel). Also try wrong codes (`000000`), a gmail address, and **Reduced motion**.
2. Run the smoke test. It plays every flow headless and fails if anything breaks:
   ```bash
   pip install -r tests/requirements.txt
   python -m playwright install chromium
   python tests/smoke_test.py --frames
   ```
3. `--frames` refreshes the reference screenshots in [`docs/frames/`](frames/). Commit them with your change so reviewers (and Claude Code) see the new look.

## 5. Mygate style checklist

- [ ] Brand colour on the primary button, links and focus states
- [ ] Brand typeface in the card and on signs
- [ ] "Mygate" written with a lowercase g everywhere, including the arch sign
- [ ] Characters match Mygate's illustration style and feel welcoming; the peeping resident reads as friendly, never suspicious
- [ ] The society looks like an Indian gated community a Mygate user would recognise (gate, guard cabin, tower, lift lobby)
- [ ] Text contrast at least 4.5:1 on the card; touch targets at least 44 × 44 px
- [ ] Smoke test passes; `docs/frames/` refreshed
