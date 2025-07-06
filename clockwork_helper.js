// ==UserScript==
// @name         Clockwork Codebreaker Helper
// @namespace    GreaseMonkey
// @version      1.0
// @description  Helper for the game Clockwork Codebreaker that deduces the right combination
// @author       @willnjohnson
// @match        *://*.neopets.com/games/game.phtml?game_id=1173*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const stages = {
        1: { slots: 4, colors: ['BLANK', 'SILVER', 'MAGENTA', 'ORANGE', 'RED'] },
        2: { slots: 5, colors: ['BLANK', 'SILVER', 'PURPLE', 'MAGENTA', 'YELLOW', 'ORANGE', 'RED'] },
        3: { slots: 6, colors: ['BLANK', 'SILVER', 'PURPLE', 'MAGENTA', 'CYAN', 'GREEN', 'YELLOW', 'ORANGE', 'RED'] }
    };

    let stage, guessColors = [], slots = 0, feedback = [], currentGuess = '';
    const state = { usedColors: [], discoveryMode: true, attempt: 0, possibleCodes: [] };

    // Create UI
    const ui = document.createElement('div');
    Object.assign(ui.style, {
        position: 'fixed', top: '10px', right: '10px', backgroundColor: '#222', color: 'white',
        padding: '15px', border: '2px solid white', zIndex: '9999', fontFamily: 'Arial, sans-serif',
        fontSize: '14px', width: '350px', minHeight: '80px', borderRadius: '12px'
    });

    const title = document.createElement('div');
    title.textContent = 'Clockwork Codebreaker Helper';
    Object.assign(title.style, { fontWeight: 'bold', fontSize: '16px', marginBottom: '8px' });
    ui.appendChild(title);

    const stageRow = document.createElement('div');
    Object.assign(stageRow.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'center' });

    const stageLabel = document.createElement('div');
    stageLabel.textContent = 'Select Stage:';
    stageLabel.style.fontWeight = 'bold';
    stageRow.appendChild(stageLabel);

    const stageButtons = document.createElement('div');
    [1, 2, 3].forEach(n => {
        const btn = document.createElement('button');
        btn.textContent = n;
        btn.style.marginLeft = '5px';
        styleButton(btn, '#00e0ff', true);
        btn.onclick = () => {
            initStage(n);
            tableWrapper.style.display = 'block';
            infoDisplay.style.display = 'block';
            ui.style.minHeight = '240px';
            [...stageButtons.children].forEach(b => { b.style.backgroundColor = '#444'; b.disabled = true; });
            btn.style.backgroundColor = '#00e0ff';
        };
        stageButtons.appendChild(btn);
    });
    stageRow.appendChild(stageButtons);
    ui.appendChild(stageRow);

    const tableWrapper = document.createElement('div');
    Object.assign(tableWrapper.style, { display: 'none', marginTop: '15px' });

    const table = document.createElement('table');
    Object.assign(table.style, { width: '100%', borderCollapse: 'collapse' });

    const headerRow = document.createElement('tr');
    ['Code to Test', 'Indicator Result', ''].forEach((text, i) => {
        const th = document.createElement('th');
        th.textContent = text;
        Object.assign(th.style, {
            fontWeight: 'bold', padding: '4px', textAlign: i === 2 ? 'right' : 'center',
            width: ['35%', '35%', '30%'][i]
        });
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    const tbody = document.createElement('tbody');
    table.appendChild(tbody);
    tableWrapper.appendChild(table);
    ui.appendChild(tableWrapper);

    const infoDisplay = document.createElement('div');
    Object.assign(infoDisplay.style, { color: '#ff4c4c', marginTop: '10px', minHeight: '24px', display: 'none' });
    ui.appendChild(infoDisplay);

    document.body.appendChild(ui);

    function styleButton(btn, color, rounded = false) {
        Object.assign(btn.style, {
            backgroundColor: '#444', color: 'white', border: 'none', padding: '5px 10px',
            cursor: 'pointer', transition: 'background 0.3s',
            borderRadius: rounded ? '6px' : '0'
        });
        btn.onmouseover = () => { if (!btn.disabled) btn.style.backgroundColor = color; };
        btn.onmouseout = () => { if (!btn.disabled) btn.style.backgroundColor = '#444'; };
    }

    function resetToStageSelection() {
        tableWrapper.style.display = 'none';
        infoDisplay.style.display = 'none';
        ui.style.minHeight = '80px';
        [...stageButtons.children].forEach(b => { b.style.backgroundColor = '#444'; b.disabled = false; });
        tbody.innerHTML = '';
        stage = null;
        guessColors = [];
        feedback = [];
        slots = 0;
        currentGuess = '';
        Object.assign(state, { usedColors: [], discoveryMode: true, attempt: 0, possibleCodes: [] });
        infoDisplay.textContent = '';
    }

    function initStage(n) {
        stage = n;
        guessColors = [];
        feedback = [];
        slots = stages[n].slots;
        const colors = stages[n].colors;
        
        Object.assign(state, { usedColors: [], discoveryMode: true, attempt: 0, possibleCodes: generateCodes(colors, slots) });
        tbody.innerHTML = '';

        Array.from({ length: slots }, (_, i) => {
            const row = document.createElement('tr');

            const colorCell = document.createElement('td');
            Object.assign(colorCell.style, { padding: '4px', textAlign: 'center', verticalAlign: 'middle', height: '32px' });
            const color = document.createElement('div');
            color.textContent = 'BLANK';
            colorCell.appendChild(color);
            guessColors.push(color);

            const fbCell = document.createElement('td');
            Object.assign(fbCell.style, { padding: '4px', textAlign: 'center', verticalAlign: 'middle', height: '32px' });
            const fbWrapper = document.createElement('div');
            Object.assign(fbWrapper.style, { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' });

            const [upBtn, status, downBtn] = ['▲', '❔', '▼'].map((text, idx) => {
                if (idx === 1) {
                    const span = document.createElement('span');
                    span.textContent = text;
                    span.dataset.index = i;
                    return span;
                }
                const btn = document.createElement('button');
                btn.textContent = text;
                styleButton(btn, '#666', true);
                return btn;
            });

            const cycles = [['🔴', '🟡', '🟢'], ['🟢', '🟡', '🔴']];
            [upBtn, downBtn].forEach((btn, idx) => {
                btn.onclick = () => {
                    const cycle = cycles[idx];
                    const pos = cycle.indexOf(status.textContent.trim());
                    status.textContent = cycle[(pos + 1) % 3] || cycle[0];
                    infoDisplay.textContent = '';
                };
            });

            fbWrapper.append(upBtn, status, downBtn);
            fbCell.appendChild(fbWrapper);

            const actionCell = document.createElement('td');
            Object.assign(actionCell.style, { padding: '4px', textAlign: 'right', verticalAlign: 'middle', height: '32px' });

            if (i === 0) {
                const testBtn = document.createElement('button');
                testBtn.textContent = 'Test';
                styleButton(testBtn, '#00e0ff', true);
                testBtn.onclick = runTest;
                actionCell.appendChild(testBtn);
            } else if (i === 1) {
                const resetBtn = document.createElement('button');
                resetBtn.textContent = 'Reset';
                styleButton(resetBtn, '#ff4c4c', true);
                resetBtn.onclick = resetToStageSelection;
                actionCell.appendChild(resetBtn);
            }

            row.append(colorCell, fbCell, actionCell);
            tbody.appendChild(row);
            feedback.push(status);
        });

        suggestNextGuess();
    }

    function suggestNextGuess() {
        const colors = stages[stage].colors;
        
        if (state.discoveryMode) {
            const nextColor = colors.find(c => !state.usedColors.includes(c));
            currentGuess = nextColor ? Array(slots).fill(nextColor) : (state.discoveryMode = false, state.possibleCodes[0] || Array(slots).fill(colors[1]));
        } else {
            currentGuess = state.possibleCodes[0] || Array(slots).fill(colors[1]);
        }

        guessColors.forEach((el, i) => el.textContent = currentGuess[i] || 'BLANK');
    }

    function runTest() {
        if (feedback.some(f => f.textContent === '❔')) {
            infoDisplay.style.color = '#ff4c4c';
            infoDisplay.textContent = 'Please set all indicator results first.';
            return;
        }

        const [greens, yellows, reds] = ['🟢', '🟡', '🔴'].map(emoji => feedback.filter(f => f.textContent === emoji).length);

        if (greens === slots) {
            infoDisplay.style.color = '#00e0ff';
            infoDisplay.textContent = 'Puzzle Solved! Select Reset for new stage.';
            tbody.querySelector('button').disabled = true;
            return;
        }

        infoDisplay.textContent = '';
        const guess = Array.isArray(currentGuess) ? currentGuess : Array(slots).fill(stages[stage].colors[1]);

        if (state.discoveryMode) {
            const testedColor = guess[0];
            if (!state.usedColors.includes(testedColor)) state.usedColors.push(testedColor);
        }

        if (state.discoveryMode && (greens > 0 || yellows > 0)) state.discoveryMode = false;

        state.possibleCodes = state.possibleCodes.filter(code => {
            const [g, y, r] = getFeedback(guess, code);
            return g === greens && y === yellows && r === reds;
        });

        suggestNextGuess();
        feedback.forEach(f => f.textContent = '❔');
    }

    function getFeedback(guess, solution) {
        const green = guess.filter((g, i) => g === solution[i]).length;
        const count = arr => arr.reduce((acc, item) => ({ ...acc, [item]: (acc[item] || 0) + 1 }), {});
        const [guessCount, solCount] = [count(guess), count(solution)];
        const common = Object.keys(guessCount).reduce((sum, key) => sum + Math.min(guessCount[key] || 0, solCount[key] || 0), 0);
        const yellow = common - green;
        return [green, yellow, guess.length - green - yellow];
    }

    function generateCodes(arr, repeat) {
        return repeat === 1 ? arr.map(item => [item]) : arr.flatMap(item => generateCodes(arr, repeat - 1).map(rest => [item, ...rest]));
    }
})();
