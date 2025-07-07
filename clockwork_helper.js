// ==UserScript==
// @name         Clockwork Codebreaker Helper
// @namespace    GreaseMonkey
// @version      1.1
// @description  Helper for the game Clockwork Codebreaker that deduces the right combination
// @author       @willnjohnson + Updated
// @match        *://*.neopets.com/games/game.phtml?game_id=1173*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const stages = {
        1: { slots: 4, colors: ['BLANK', 'SILVER', 'MAGENTA', 'ORANGE', 'RED'] },
        2: { slots: 5, colors: ['BLANK', 'SILVER', 'PURPLE', 'MAGENTA', 'YELLOW', 'ORANGE', 'RED'] },
        3: { slots: 6, colors: ['BLANK', 'SILVER', 'PURPLE', 'MAGENTA', 'CYAN', 'GREEN', 'YELLOW', 'ORANGE', 'RED'] }
    };

    let stage = null, guessColors = [], slots = 0, currentGuess = '', feedback = [], lastFeedback = null;
    const state = { usedColors: [], discoveryMode: true, attempt: 0, possibleCodes: [] };

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
            if (stage === n) return;
            resetToStageSelection();
            initStage(n);
            tableWrapper.style.display = 'block';
            infoDisplay.style.display = 'block';
            ui.style.minHeight = '240px';
            [...stageButtons.children].forEach(b => {
                b.style.backgroundColor = '#444';
                b.disabled = false;
            });
            btn.style.backgroundColor = '#00e0ff';
            btn.disabled = true;
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
        [...stageButtons.children].forEach(b => {
            b.style.backgroundColor = '#444';
            b.disabled = false;
        });
        tbody.innerHTML = '';
        stage = null;
        guessColors = [];
        feedback = [];
        lastFeedback = null;
        slots = 0;
        currentGuess = '';
        Object.assign(state, { usedColors: [], discoveryMode: true, attempt: 0, possibleCodes: [] });
        infoDisplay.textContent = '';
    }

    function initStage(n) {
        stage = n;
        guessColors = [];
        feedback = [];
        lastFeedback = null;
        slots = stages[n].slots;
        const colors = stages[n].colors;
        Object.assign(state, {
            usedColors: [], discoveryMode: true, attempt: 0,
            possibleCodes: generateCodes(colors, slots)
        });
        tbody.innerHTML = '';

        for (let i = 0; i < slots; i++) {
            const row = document.createElement('tr');

            const colorCell = document.createElement('td');
            const color = document.createElement('div');
            color.textContent = 'BLANK';
            guessColors.push(color);
            colorCell.appendChild(color);
            row.appendChild(colorCell);

            const fbCell = document.createElement('td');
            const fbWrapper = document.createElement('div');
            Object.assign(fbWrapper.style, { display: 'flex', justifyContent: 'center', gap: '8px' });

            const fbGroup = [];
            ['🟢', '🟡', '🔴'].forEach(symbol => {
                const square = document.createElement('div');
                square.textContent = symbol;
                square.dataset.index = i;
                Object.assign(square.style, {
                    width: '26px', height: '26px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', borderRadius: '6px', backgroundColor: '#333',
                    cursor: 'pointer', fontSize: '18px', border: '2px solid transparent'
                });
                square.onclick = () => {
                    fbGroup.forEach(el => el.style.borderColor = 'transparent');
                    square.style.borderColor = '#00e0ff';
                    fbGroup.selected = symbol;
                };
                fbGroup.push(square);
                fbWrapper.appendChild(square);
            });

            feedback.push(fbGroup);
            fbCell.appendChild(fbWrapper);
            row.appendChild(fbCell);

            const actionCell = document.createElement('td');
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
            } else if (i === 3) {
                const restoreBtn = document.createElement('button');
                restoreBtn.textContent = 'Select Prev.';
                styleButton(restoreBtn, '#00e0ff', true);
                restoreBtn.onclick = () => {
                    const restore = lastFeedback || Array(slots).fill('🔴');
                    feedback.forEach((group, i) => {
                        group.forEach(el => el.style.borderColor = 'transparent');
                        const match = group.find(el => el.textContent === restore[i]);
                        if (match) {
                            match.style.borderColor = '#00e0ff';
                            group.selected = restore[i];
                        }
                    });
                };
                actionCell.appendChild(restoreBtn);
            }
            row.appendChild(actionCell);
            tbody.appendChild(row);
        }

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
        const selected = feedback.map(group => group.selected);
        if (selected.includes(undefined)) {
            infoDisplay.style.color = '#ff4c4c';
            infoDisplay.textContent = 'Please set all indicator results first.';
            return;
        }
        lastFeedback = [...selected];
        const [greens, yellows, reds] = [
            selected.filter(f => f === '🟢').length,
            selected.filter(f => f === '🟡').length,
            selected.filter(f => f === '🔴').length
        ];
        if (greens === slots) {
            infoDisplay.style.color = '#00e0ff';
            infoDisplay.textContent = 'Puzzle Solved!';
            tbody.querySelector('button').disabled = true;
            return;
        }
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
        feedback.forEach(group => {
            group.forEach(el => el.style.borderColor = 'transparent');
            group.selected = undefined;
        });
    }

    function getFeedback(guess, solution) {
        const green = guess.filter((g, i) => g === solution[i]).length;
        const count = arr => arr.reduce((acc, item) => {
            acc[item] = (acc[item] || 0) + 1;
            return acc;
        }, {});
        const [guessCount, solCount] = [count(guess), count(solution)];
        const common = Object.keys(guessCount).reduce((sum, key) => sum + Math.min(guessCount[key] || 0, solCount[key] || 0), 0);
        const yellow = common - green;
        return [green, yellow, guess.length - green - yellow];
    }

    function generateCodes(arr, repeat) {
        return repeat === 1 ? arr.map(item => [item]) : arr.flatMap(item => generateCodes(arr, repeat - 1).map(rest => [item, ...rest]));
    }
})();
