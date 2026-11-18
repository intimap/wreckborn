# Wreckborn — project rules for Claude Code

Wreckborn is a top-down, hi-bit pixel-art pirate survival RPG: a colony sim at home against a perilous open sea.
The full design lives in the manifesto doc: https://claude.ai/artifact/3RKAy8VZ6QRsNvFfYG5hnh

## Who does what
- The owner does not write code. Claude writes, tests and commits all code.
- The owner directs, play-tests and balances. Explain changes in plain language, never assume they read the diff.
- Design decisions belong to the owner. If a ticket is ambiguous about how the game should *feel or play*, ask before building.

## Stack
- Browser game: plain JavaScript (ES modules) + Phaser 3, vendored in `vendor/` (no build step, no other libraries unless agreed).
- Target: desktop browsers (Chrome, Firefox, Safari, Edge). Base resolution 640x360, 16x16 tiles, integer scaling, pixel-art (nearest-neighbour) rendering.
- Run locally: `npm start`, then open http://localhost:8080. Each build is also published as a playable artifact link.
- Art: placeholder shapes/colours until told otherwise. Never block on art.

## Architecture rules
- Data-driven: items, recipes, crops, buildings, ships and prices are JSON files under `data/`,
  editable in any text editor without touching code. Systems read data; they never hard-code balance numbers.
- One system per folder under `src/systems/` (e.g. `src/systems/survival/`, `src/systems/inventory/`).
- Global state goes through a small number of shared modules (e.g. `GameClock`, `SaveManager`, `EventBus`). Keep them few.
- Saving: only when the player sleeps (for now). Save files are versioned so old saves can be migrated.
- Every system that matters for balance must be inspectable/controllable from the debug menu.

## Debug menu
- Toggle with F1, only when `data/game_config.json` has `"debug": true`. Must support at minimum: skip time (hours/days/season), spawn any item,
  set survival meters, teleport. Add a control for every new system as it is built.

## Testing
- Use Node's built-in test runner. Tests live in `tests/`, mirroring `src/systems/`. Keep game logic in pure
  functions (no Phaser) so it can be tested.
- Every ticket that adds logic adds tests for it. Run the full suite before committing: `npm test`
- Also load the game in headless Chromium (Playwright) and check for console errors before committing.
- Never commit with failing tests.

## Session routine
1. Read this file and the GitHub Issue being worked on.
2. Build only what the ticket asks. Note anything else as a suggested new ticket.
3. Run the tests. Fix until green.
4. Commit with a clear message referencing the issue (e.g. "Add hunger and thirst meters (#12)").
5. Finish with a **play-test checklist**: 3–6 plain steps the owner can do in under 5 minutes to confirm it works
   and feels right, e.g. "Walk to the beach, eat a coconut, check the hunger bar rises".
6. When the owner reports back, fix the issues or close the ticket.

## Roadmap
1. Session zero: project skeleton, this file, tests, debug menu stub, a coloured square walking an empty island.
2. Milestone 1 "Castaway, Day One": movement, gathering, hunger/thirst, day/night, basic crafting, sleep, save/load.
3. Milestone 2 "Sailing prototype": boat, wind, open water.

## Font
- Two original pixel fonts in `assets/fonts/`: **Wreckborn Serif** for all normal text, and **Wreckborn Small**
  (chunky sans) for small print: counts, key labels, controls help, debug labels, recipe ingredients.
- Letters are drawn by hand in `tools/font/glyphs.txt` and `tools/font/glyphs_small.txt`; rebuild both with
  `python3 tools/font/build_font.py` (needs `pip install fonttools brotli`). Preview: `tools/font/specimen.html`.
- Serif only at multiples of 12px, Small only at multiples of 8px (in CSS: `1rem` and `0.666667rem`).
  Never bold or italic: both blur the pixels.
