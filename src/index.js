const powerToggle = document.getElementById('power-button');
const display = document.getElementById('lcd-real');
const displayArea = document.querySelector('.display-area');
const calcBody = document.querySelector('section');
const keypad = document.getElementById('all-keys');
const themeCheckbox = document.getElementById('theme-checkbox');
const allKeys = keypad.querySelectorAll('button[data-key]:not(#power-button)');

const MAX_DIGITS = 12; // characters the LCD can show
const OPERATORS = ['+', '-', '*', '/'];
const welcomeStr = 'WELCOME';
const goodbyeStr = 'GOODBYE';

let powerOn = false;
let busy = false; // true while WELCOME / GOODBYE is animating

// The calculation is kept as separate parts; the display is drawn from them
const calc = {
    first: null, // the number before the operator, as a string
    op: null,
    current: '', // the number being typed, as a string
    justEvaluated: false, // the display shows a result
    error: null,
    lastOp: null, // for pressing = again to repeat the last operation
    lastOperand: null,
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function resetCalc() {
    Object.assign(calc, {
        first: null,
        op: null,
        current: '',
        justEvaluated: false,
        error: null,
        lastOp: null,
        lastOperand: null,
    });
}

function expressionText() {
    return (calc.first ?? '') + (calc.op ?? '') + calc.current;
}

function render() {
    display.textContent = calc.error ?? (expressionText() || '_');
}

// Briefly shake the display when a key can't be accepted, so it isn't ignored silently
function reject() {
    displayArea.classList.remove('reject');
    void displayArea.offsetWidth;
    displayArea.classList.add('reject');
}

function flashResult() {
    display.classList.remove('flash');
    void display.offsetWidth;
    display.classList.add('flash');
}

// Fit a number into the LCD: up to 12 significant digits, dropping precision
// (or switching to 1.23E45 form) only when it wouldn't otherwise fit
function formatNumber(value) {
    for (let precision = 12; precision >= 1; precision--) {
        const plain = String(Number(value.toPrecision(precision)));
        if (plain.length <= MAX_DIGITS && !plain.includes('e')) return plain;
    }
    for (let digits = 10; digits >= 0; digits--) {
        const [mantissa, exponent] = value.toExponential(digits).split('e');
        const scientific = mantissa.replace(/\.?0+$/, '') + 'E' + exponent.replace('+', '');
        if (scientific.length <= MAX_DIGITS) return scientific;
    }
    return null;
}

function compute(a, op, b) {
    const x = parseFloat(a);
    const y = parseFloat(b);
    if (op === '+') return x + y;
    if (op === '-') return x - y;
    if (op === '*') return x * y;
    return x / y;
}

// Works out first op current; returns the formatted result, or null after showing an error
function evaluate(first, op, operand) {
    if (op === '/' && parseFloat(operand) === 0) {
        showError('ERR: DIV 0');
        return null;
    }
    const result = compute(first, op, operand);
    const text = Number.isFinite(result) ? formatNumber(result) : null;
    if (text === null) {
        showError('ERR: TOO BIG');
        return null;
    }
    return text;
}

function showError(message) {
    resetCalc();
    calc.error = message;
    calc.justEvaluated = true;
}

function isCompleteNumber(text) {
    return text !== '' && text !== '-' && text !== '.';
}

function inputDigit(digit) {
    if (calc.error || calc.justEvaluated) {
        resetCalc();
    }
    if (calc.current === '0' || calc.current === '-0') {
        calc.current = calc.current.slice(0, -1) + digit; // no leading zeros
    } else if (expressionText().length < MAX_DIGITS) {
        calc.current += digit;
    } else {
        reject();
    }
}

function inputDecimal() {
    if (calc.error || calc.justEvaluated) {
        resetCalc();
    }
    if (calc.current.includes('.')) return;
    const addition = calc.current === '' || calc.current === '-' ? '0.' : '.';
    if (expressionText().length + addition.length <= MAX_DIGITS) {
        calc.current += addition;
    } else {
        reject();
    }
}

function inputOperator(op) {
    if (calc.error) return;

    // Start a result on to the next calculation
    if (calc.justEvaluated) {
        calc.first = calc.current;
        calc.current = '';
        calc.op = op;
        calc.justEvaluated = false;
        return;
    }

    // A minus with nothing typed yet starts a negative number
    if (op === '-' && calc.current === '' && (calc.op === null || calc.op === '*' || calc.op === '/')) {
        if (calc.first === null || expressionText().length < MAX_DIGITS) {
            calc.current = '-';
        }
        return;
    }

    if (!isCompleteNumber(calc.current)) {
        // Changing your mind: the new operator replaces the last one
        if (calc.op !== null) {
            calc.current = '';
            calc.op = op;
        }
        return;
    }

    if (calc.op === null) {
        calc.first = calc.current;
    } else {
        // Chaining (5 + 3 + ...): work out what's there first
        const result = evaluate(calc.first, calc.op, calc.current);
        if (result === null) return;
        calc.first = result;
        flashResult();
    }
    calc.op = op;
    calc.current = '';
}

function inputEquals() {
    if (calc.error) return;

    if (calc.justEvaluated) {
        // Pressing = again repeats the last operation
        if (calc.lastOp === null) return;
        const result = evaluate(calc.current, calc.lastOp, calc.lastOperand);
        if (result === null) return;
        calc.current = result;
        flashResult();
        return;
    }

    if (!isCompleteNumber(calc.current)) return;
    if (calc.op === null) {
        // = on a lone number just finishes it, so the next digit starts afresh
        calc.justEvaluated = true;
        return;
    }

    const { op, current: operand } = calc;
    const result = evaluate(calc.first, op, operand);
    if (result === null) return;
    Object.assign(calc, { first: null, op: null, current: result, justEvaluated: true, lastOp: op, lastOperand: operand });
    flashResult();
}

function inputBackspace() {
    if (calc.error || calc.justEvaluated) return;
    if (calc.current !== '') {
        calc.current = calc.current.slice(0, -1);
    } else if (calc.op !== null) {
        calc.current = calc.first;
        calc.first = null;
        calc.op = null;
    }
}

function inputSignToggle() {
    if (calc.error || !isCompleteNumber(calc.current) || parseFloat(calc.current) === 0) return;
    if (calc.current.startsWith('-')) {
        calc.current = calc.current.slice(1);
    } else if (expressionText().length < MAX_DIGITS) {
        calc.current = '-' + calc.current;
    } else {
        reject();
        return;
    }
    if (calc.justEvaluated) {
        // A negated result becomes a fresh number rather than repeating the last operation
        calc.lastOp = null;
        calc.lastOperand = null;
    }
}

function handleKey(key) {
    if (!powerOn || busy) return;
    if (/^[0-9]$/.test(key)) inputDigit(key);
    else if (OPERATORS.includes(key)) inputOperator(key);
    else if (key === '.') inputDecimal();
    else if (key === '=') inputEquals();
    else if (key === 'backspace') inputBackspace();
    else if (key === 'sign') inputSignToggle();
    else if (key === 'clear') resetCalc();
    render();
}

function setKeysEnabled(enabled) {
    allKeys.forEach((key) => {
        key.disabled = !enabled;
        key.classList.toggle('disabled-keys', !enabled);
        key.classList.toggle('active-keys', enabled);
    });
}

async function typeOut(text) {
    for (let i = 0; i <= text.length; i++) {
        display.textContent = text.slice(0, i);
        await sleep(300);
    }
    await sleep(1000);
}

async function power() {
    if (busy) return; // ignore presses while WELCOME / GOODBYE is running
    busy = true;
    if (powerOn) {
        powerOn = false;
        setKeysEnabled(false);
        await typeOut(goodbyeStr);
        calcBody.classList.add('powered-off');
        powerToggle.classList.replace('green-key', 'red-key');
        powerToggle.setAttribute('aria-pressed', 'false');
        display.textContent = '';
    } else {
        powerOn = true;
        resetCalc();
        await typeOut(welcomeStr);
        calcBody.classList.remove('powered-off');
        powerToggle.classList.replace('red-key', 'green-key');
        powerToggle.setAttribute('aria-pressed', 'true');
        setKeysEnabled(true);
        render();
    }
    busy = false;
}

keypad.addEventListener('click', (e) => {
    const button = e.target.closest('button[data-key]');
    if (!button) return;
    if (button.dataset.key === 'power') power();
    else handleKey(button.dataset.key);
});

const KEYBOARD_KEYS = {
    Enter: '=',
    '=': '=',
    x: '*',
    X: '*',
    Backspace: 'backspace',
    Escape: 'clear',
    Delete: 'clear',
    c: 'clear',
    C: 'clear',
};

document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const key = KEYBOARD_KEYS[e.key] ?? e.key;
    if (!/^[0-9]$/.test(key) && !OPERATORS.includes(key) && !['.', '=', 'backspace', 'clear'].includes(key)) return;
    // Stop / from opening Firefox's quick find, and Enter from also clicking a focused button
    e.preventDefault();
    handleKey(key);
});

// Theme: remember the choice, and follow the system setting until one is made
function applyTheme(light) {
    document.body.classList.toggle('light-mode', light);
    themeCheckbox.checked = light;
}

let savedTheme = null;
try {
    savedTheme = localStorage.getItem('calculator-theme');
} catch {
    // Storage unavailable; fall back to the system setting
}
applyTheme(savedTheme ? savedTheme === 'light' : window.matchMedia('(prefers-color-scheme: light)').matches);

themeCheckbox.addEventListener('change', () => {
    applyTheme(themeCheckbox.checked);
    try {
        localStorage.setItem('calculator-theme', themeCheckbox.checked ? 'light' : 'dark');
    } catch {
        // Not saved; the toggle still works for this visit
    }
});

setKeysEnabled(false);
calcBody.classList.add('powered-off');
display.textContent = '';
