const powerToggle = document.getElementById('power-button');
const display = document.getElementById('lcd-real');
const allKeys = document.querySelectorAll(
    '.digit button, .operator button, .clear-screen button, .decimal-point button, .equals-button button',
);
const powerB = document.getElementById('power-button');
const allKeysAndPower = [...allKeys, powerB];

let powerOn = false;
let decimalFirst = false;
let decimalSecond = false;
let operatorFound = false;
let calcDone = false;
let operators = ['+', '-', '*', '/'];
const welcomeStr = 'WELCOME';
const goodbyeStr = 'GOODBYE';
const MAX_DIGITS = 12;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

allKeys.forEach((key) => key.classList.add('disabled-keys'));
powerToggle.classList.add('red-key');
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
    await showWelcome();
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
        else if (targetButton === 'C') {
            operatorFound = false;
            decimalFirst = false;
            decimalSecond = false;
            calcDone = false;
            display.textContent = '_';
        } else handleDigitClick(targetButton);
    });
});

function handleDigitClick(n) {
    if (n === '÷') n = '/';

    if (n === '=') {
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
            return;
        }
        res = n1 / n2;
    }

    display.textContent = Number(res.toFixed(2)).toString();
    calcDone = true;
    operatorFound = false;
    decimalFirst = display.textContent.includes('.');
    decimalSecond = false;
}
