# Calculator

A retro LCD-style calculator in plain HTML, CSS and JavaScript, with no build step and no dependencies.

## Running it

Open `src/index.html` in a browser, or serve the folder:

```bash
npm start
```

That runs `python3 -m http.server 8000 --directory src`, so the calculator is at http://localhost:8000.

## Using it

Press ⏻ to switch on. The display shows the whole sum as you type (`12*34`), up to 12 characters.

- **Chaining:** `5 + 3 + 2 =` gives 10. Each operator works out the sum so far.
- **Changing an operator:** press a different one straight after, e.g. `5 + ×` becomes `5 ×`.
- **Negative numbers:** press `-` before a number, or `+/-` to flip the sign of the number you're typing.
- **Repeat:** press `=` again to repeat the last operation (`5 + 3 = =` gives 11).
- **Big and small results** are shown to as many digits as fit, switching to `1.23E45` form when needed.
- If the display is full, it shakes instead of taking the key.

**Keyboard:** digits, `+ - * /` (or `x` to multiply), `.`, Enter or `=`, Backspace, and Escape or `C` to clear.

The light/dark switch is remembered. Until you choose, it follows your system setting.

## Files

| File | What it does |
|---|---|
| `src/index.html` | Page layout and keypad |
| `src/index.css` | Styling, including the LCD effect and light mode |
| `src/index.js` | Calculator logic, power on/off, keyboard and theme |
| `src/digital7.ttf`, `src/Orbitron-ExtraBold.ttf` | Display and button fonts |
