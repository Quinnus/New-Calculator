# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the app

This is a no-build vanilla JS project. Open `src/index.html` directly in a browser, or serve with any static file server:

```bash
npx serve src
# or
python3 -m http.server --directory src
```

There is no build step, bundler, or test suite.

## Architecture

Single-page calculator with three files in `src/`:

- **[index.html](src/index.html)** — static markup. Buttons are `<div class="digit|operator|...">` wrappers around `<button>` elements. The display has two overlapping `<div>`s: `.lcd-burn` (always shows `888888888888` in a faint color for the LCD segment burn effect) and `.lcd-real` (the active display, positioned on top via `z-index`).

- **[index.js](src/index.js)** — all state and logic. State is held in module-level `let` variables (`powerOn`, `operatorFound`, `decimalFirst`, `decimalSecond`, `calcDone`). The display itself doubles as the expression buffer — `display.textContent` holds the raw expression string (e.g. `"12.5+3"`) which is then parsed character-by-character in `performCalc()`. There is no separate model or expression tree.

- **[index.css](src/index.css)** — neumorphic design. Uses CSS Grid (`4 cols × 6 rows`) for button layout with explicit `grid-area` placement per button. Two custom fonts: `Digital7` (display) and `Orbitron` (buttons).

## Key logic details

- `handleDigitClick()` guards input by checking the `display.textContent` string directly — leading `_` means the display is empty/reset.
- `performCalc()` manually iterates characters to split the expression into two operands and an operator; it does not use `eval()`. Results are rounded to 2 decimal places via `toFixed(2)`.
- The `÷` button face maps to `/` internally at the top of `handleDigitClick`.
- Power on/off animates WELCOME/GOODBYE via `async/await` + `sleep()` helper; all keys get `.disabled-keys` / `.active-keys` CSS classes toggled accordingly.
