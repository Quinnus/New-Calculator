const powerToggle = document.getElementById('power-button');
const display = document.getElementById('lcd-real');
const calcBody = document.querySelector('section');
const themeCheckbox = document.getElementById('theme-checkbox');
const allKeys = document.querySelectorAll(
    '.digit button, .operator button, .clear-screen button, .decimal-point button, .equals-button button, .backspace button, .sign-toggle button',
);
const powerB = document.getElementById('power-button');
const allKeysAndPower = [...allKeys, powerB];

let powerOn = false;
let decimalFirst = false;
let decimalSecond = false;
let operatorFound = false;
let calcDone = false;
let lastOp = '';
let lastOperand = '';
let operators = ['+', '-', '*', '/'];
const welcomeStr = 'WELCOME';
const goodbyeStr = 'GOODBYE';
const MAX_DIGITS = 12;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

allKeys.forEach((key) => key.classList.add('disabled-keys'));
powerToggle.classList.add('red-key');
calcBody.classList.add('powered-off');
display.textContent = '';

function toggleAllKeys() {
    allKeys.forEach((key) => {
        key.classList.toggle('disabled-keys', !powerOn);
        key.classList.toggle('active-keys', powerOn);
    });
}

async function initializeCalculator() {
    powerOn = true;
    operatorFound = false;
    decimalFirst = false;
    decimalSecond = false;
    calcDone = false;
    lastOp = '';
    lastOperand = '';
    await showWelcome();
    calcBody.classList.remove('powered-off');
    powerToggle.classList.remove('red-key');
    powerToggle.classList.add('green-key');
    toggleAllKeys();
    display.textContent = '_';
}

async function showWelcome() {
    for (let i = 0; i <= welcomeStr.length; i++) {
        display.textContent = welcomeStr.slice(0, i);
        await sleep(300);
    }
    await sleep(1000);
}

async function showGoodbye() {
    for (let i = 0; i <= goodbyeStr.length; i++) {
        display.textContent = '';
        display.textContent = goodbyeStr.slice(0, i);
        await sleep(300);
    }
    await sleep(1000);
}

async function power() {
    if (powerOn) {
        powerOn = false;
        await showGoodbye();
        calcBody.classList.add('powered-off');
        powerToggle.classList.remove('green-key');
        powerToggle.classList.add('red-key');
        toggleAllKeys();
        display.textContent = '';
    } else await initializeCalculator();
}

allKeysAndPower.forEach((b) => {
    b.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON') return;

        const targetButton = e.target.innerText;

        if (targetButton === '⏻') power();
        else if (targetButton === 'C') handleClear();
        else if (targetButton === '⌫') handleBackspace();
        else if (targetButton === '+/-') handleSignToggle();
        else handleDigitClick(targetButton);
    });
});

function handleSignToggle() {
    const current = display.textContent;
    if (current === '_' || current === '0' || current.startsWith('ERR')) return;

    if (!operatorFound || calcDone) {
        const negated = current.startsWith('-') ? current.slice(1) : '-' + current;
        display.textContent = negated;
        decimalFirst = negated.includes('.');
        if (calcDone) {
            calcDone = false;
            operatorFound = false;
            lastOp = '';
            lastOperand = '';
        }
        return;
    }

    // Find main operator (skip index 0 to allow negative first number)
    let opIndex = -1;
    for (let i = 1; i < current.length; i++) {
        if (operators.includes(current[i])) { opIndex = i; break; }
    }
    if (opIndex === -1) return;

    const beforeOp = current.slice(0, opIndex + 1);
    const afterOp = current.slice(opIndex + 1);
    if (afterOp === '' || afterOp === '0') return;

    display.textContent = afterOp.startsWith('-')
        ? beforeOp + afterOp.slice(1)
        : beforeOp + '-' + afterOp;
    decimalSecond = display.textContent.slice(opIndex + 1).includes('.');
}

function handleBackspace() {
    if (calcDone) return;
    const current = display.textContent;
    if (current === '_') return;

    const remaining = current.slice(0, -1);
    const removed = current.slice(-1);

    if (remaining === '' || remaining === '-') {
        display.textContent = '_';
        operatorFound = false;
        decimalFirst = false;
        decimalSecond = false;
        return;
    }

    display.textContent = remaining;

    if (removed === '.') {
        if (operatorFound) decimalSecond = false;
        else decimalFirst = false;
    } else if (operators.includes(removed)) {
        const stillHasOp = [...remaining].some((c, i) => i > 0 && operators.includes(c));
        operatorFound = stillHasOp;
        if (!operatorFound) decimalSecond = false;
    }
}

function handleClear() {
    operatorFound = false;
    decimalFirst = false;
    decimalSecond = false;
    calcDone = false;
    lastOp = '';
    lastOperand = '';
    display.textContent = '_';
}

document.addEventListener('keydown', (e) => {
    if (!powerOn) return;
    if (e.key >= '0' && e.key <= '9') handleDigitClick(e.key);
    else if (e.key === '+' || e.key === '-' || e.key === '*') handleDigitClick(e.key);
    else if (e.key === '/') { e.preventDefault(); handleDigitClick('/'); }
    else if (e.key === '.') handleDigitClick('.');
    else if (e.key === 'Enter' || e.key === '=') handleDigitClick('=');
    else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') handleClear();
    else if (e.key === 'Backspace') handleBackspace();
});

function handleDigitClick(n) {
    if (n === '÷') n = '/';

    if (n === '=') {
        if (calcDone && lastOp && lastOperand) {
            performCalc(display.textContent + lastOp + lastOperand);
            return;
        }
        const lastChar = display.textContent.slice(-1);
        if (operatorFound && !operators.includes(lastChar)) {
            performCalc(display.textContent);
        }
        return;
    }

    if (calcDone) {
        if (!operators.includes(n)) {
            display.textContent = n === '.' ? '0.' : n;
            decimalFirst = n === '.';
            operatorFound = false;
            calcDone = false;
            return;
        } else {
            calcDone = false;
        }
    }

    if (display.textContent === '_') {
        if (n === '-') {
            display.textContent = '-';
            return;
        }
        if (operators.includes(n)) return;
        display.textContent = n === '.' ? '0.' : n;
        if (n === '.') decimalFirst = true;
        return;
    }

    if (operators.includes(n)) {
        const lastChar = display.textContent.slice(-1);
        let expressionLength= display.textContent.length
        if (!operatorFound && display.textContent !== '-') {
            display.textContent += n;
            operatorFound = true;
            return;
        }
        if (n === '-' && operatorFound && operators.includes(lastChar) && lastChar === '-') {
            
            display.textContent = display.textContent.slice(0, expressionLength - 1) + '+';
            return;
        }
        if (n === '-' && operatorFound && operators.includes(lastChar) && lastChar === '+') {
            display.textContent = display.textContent.slice(0, expressionLength - 1) + '-';
            return;
        }
        if (n === '-' && operatorFound && operators.includes(lastChar) && lastChar !== '-') {
            display.textContent += n;
            return;
        }
        return;
    }

    if (n === '.') {
        if (!operatorFound && !decimalFirst) {
            display.textContent += '.';
            decimalFirst = true;
        } else if (operatorFound && !decimalSecond) {
            const lastChar = display.textContent.slice(-1);
            display.textContent += operators.includes(lastChar) ? '0.' : '.';
            decimalSecond = true;
        }
        return;
    }

    if (!isNaN(n) && display.textContent.length < MAX_DIGITS) {
        display.textContent += n;
    }
}

function performCalc(value) {
    let firstNumStr = '';
    let secondNumStr = '';
    let op = '';
    let opSet = false;
    const chars = [...value];

    for (let i = 0; i < chars.length; i++) {
        if (i === 0 && chars[i] === '-') {
            firstNumStr += chars[i];
            continue;
        }
        if (operators.includes(chars[i]) && !opSet) {
            op = chars[i];
            opSet = true;
            continue;
        }
        if (!opSet) firstNumStr += chars[i];
        else secondNumStr += chars[i];
    }

    const n1 = parseFloat(firstNumStr);
    const n2 = parseFloat(secondNumStr);
    let res = 0;

    if (op === '+') res = n1 + n2;
    else if (op === '-') res = n1 - n2;
    else if (op === '*') res = n1 * n2;
    else if (op === '/') {
        if (n2 === 0) {
            display.textContent = 'ERR: DIV 0';
            calcDone = true;
            operatorFound = false;
            lastOp = '';
            lastOperand = '';
            return;
        }
        res = n1 / n2;
    }

    lastOp = op;
    lastOperand = secondNumStr;
    display.classList.remove('flash');
    void display.offsetWidth;
    display.textContent = Number(res.toFixed(2)).toString();
    display.classList.add('flash');
    calcDone = true;
    operatorFound = false;
    decimalFirst = display.textContent.includes('.');
    decimalSecond = false;
}

themeCheckbox.addEventListener('change', () => {
    document.body.classList.toggle('light-mode', themeCheckbox.checked);
});
