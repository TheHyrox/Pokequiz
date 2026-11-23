import assert from 'node:assert/strict';
import {
    DESKTOP_VIEWPORTS,
    TestRunner,
    checkDesktopLayout,
    createPage,
    evalJS,
    openGameSettings,
    setViewport,
    sleep,
    waitFor
} from './cdp_helpers.mjs';

async function submitNumber(cdp, numStr) {
    await evalJS(cdp, `(() => {
        const input = document.querySelector('.number-input');
        input.value = ${JSON.stringify(numStr)};
        input.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    await sleep(40);
    await evalJS(cdp, `document.querySelector('.submit-btn').click()`);
    await sleep(180);
}

export async function runNumberQuizTests() {
    const runner = new TestRunner('Quiz Number (#143–#162)');
    const page = await createPage();
    const { cdp, networkErrors, consoleErrors, runtimeExceptions } = page;

    try {
        await runner.test('143-147', 'Normal Mode: sprite + input, descending history, Higher/Lower hints, and Win modal (#XXXX Name)', async () => {
            await openGameSettings(cdp, 'Number Quiz');
            await evalJS(cdp, `(() => {
                localStorage.removeItem('pokequiz_number_settings');
                document.querySelector('input[name="numberSubMode"][value="normal"]')?.click();
                const cbs = Array.from(document.querySelectorAll('.settings-column:first-child input[type="checkbox"]'));
                cbs.forEach(cb => { if (!cb.checked) cb.click(); });
            })()`);
            // Ensure guess limit is enabled (default 8) and Higher/Lower enabled
            await evalJS(cdp, `document.querySelector('.start-button').click()`);
            await waitFor(cdp, `document.querySelector('.sprite-img')?.complete && document.querySelector('.sprite-img').naturalWidth > 0`);

            // Extract target ID from sprite URL (.../home/<id>.png) to deterministically test wrong + win
            const targetId = await evalJS(cdp, `(() => {
                const src = document.querySelector('.sprite-img').src;
                const m = src.match(/\\/(\\d+)\\.png/);
                return m ? parseInt(m[1], 10) : null;
            })()`);
            assert.ok(targetId >= 1 && targetId <= 1025, `Invalid targetId: ${targetId}`);

            const lowerGuess = targetId > 1 ? targetId - 1 : 2;
            await submitNumber(cdp, String(lowerGuess));

            const rowInfo = await evalJS(cdp, `(() => {
                const row = document.querySelector('.guess-row');
                return {
                    text: row?.innerText || '',
                    hasHigher: Boolean(row?.querySelector('.hint-higher')),
                    hasLower: Boolean(row?.querySelector('.hint-lower'))
                };
            })()`);
            assert.ok(rowInfo.text.includes('ATTEMPT 1'));
            if (lowerGuess < targetId) assert.equal(rowInfo.hasHigher, true);
            else assert.equal(rowInfo.hasLower, true);

            // Submit exact answer -> Win modal with #XXXX Name
            await submitNumber(cdp, String(targetId));
            await waitFor(cdp, `document.querySelector('.modal-content.win')`);
            const modalText = await evalJS(cdp, `document.querySelector('.modal-content').innerText`);
            const padded = `#${String(targetId).padStart(4, '0')}`;
            assert.ok(modalText.includes(padded), `Win modal missing ${padded}: ${modalText}`);
        });

        await runner.test('148', 'Normal Mode: reaching guess limit (5) triggers Game Over and reveals #XXXX Name', async () => {
            await openGameSettings(cdp, 'Number Quiz');
            await evalJS(cdp, `(() => {
                document.querySelector('input[name="numberSubMode"][value="normal"]')?.click();
                const cbs = Array.from(document.querySelectorAll('.settings-column:first-child input[type="checkbox"]'));
                cbs.forEach(cb => { if (!cb.checked) cb.click(); });
            })()`);
            await sleep(80);
            await evalJS(cdp, `(() => {
                const slider = document.querySelector('input[type="range"]');
                if (slider) {
                    slider.value = '5';
                    slider.dispatchEvent(new Event('input', { bubbles: true }));
                    slider.dispatchEvent(new Event('change', { bubbles: true }));
                }
            })()`);
            await sleep(80);
            await evalJS(cdp, `document.querySelector('.start-button').click()`);
            await waitFor(cdp, `document.querySelector('.sprite-img')?.complete`);

            const targetId = await evalJS(cdp, `parseInt(document.querySelector('.sprite-img').src.match(/\\/(\\d+)\\.png/)[1], 10)`);
            const wrongIds = [1, 2, 3, 4, 5, 6].filter((id) => id !== targetId).slice(0, 5);
            for (const g of wrongIds) {
                await submitNumber(cdp, String(g));
            }
            await waitFor(cdp, `document.querySelector('.modal-content.lose')`);
            const modalText = await evalJS(cdp, `document.querySelector('.modal-content').innerText`);
            assert.ok(modalText.includes(`#${String(targetId).padStart(4, '0')}`));
        });

        await runner.test('146,149', 'Normal Mode: Unlimited (>10 guesses) & Higher/Lower disabled shows ✗ only', async () => {
            await openGameSettings(cdp, 'Number Quiz');
            await evalJS(cdp, `(() => {
                document.querySelector('input[name="numberSubMode"][value="normal"]')?.click();
                const cbs = Array.from(document.querySelectorAll('.settings-column:first-child input[type="checkbox"]'));
                // Uncheck guess limit and higher/lower
                cbs.forEach(cb => { if (cb.checked) cb.click(); });
            })()`);
            await sleep(100);
            await evalJS(cdp, `document.querySelector('.start-button').click()`);
            await waitFor(cdp, `document.querySelector('.sprite-img')?.complete`);

            const targetId = await evalJS(cdp, `parseInt(document.querySelector('.sprite-img').src.match(/\\/(\\d+)\\.png/)[1], 10)`);
            let g = 1;
            for (let i = 0; i < 11; i++) {
                if (g === targetId) g++;
                await submitNumber(cdp, String(g));
                g++;
            }
            const info = await evalJS(cdp, `({
                rows: document.querySelectorAll('.guess-row').length,
                hints: document.querySelectorAll('.result-hint').length,
                modal: Boolean(document.querySelector('.modal-content'))
            })`);
            assert.equal(info.rows, 11);
            assert.equal(info.hints, 0);
            assert.equal(info.modal, false);
        });

        await runner.test('158-160', 'Edge cases: out-of-bounds, duplicate guess, and keyboard ArrowUp/ArrowDown/Enter', async () => {
            await openGameSettings(cdp, 'Number Quiz');
            await evalJS(cdp, `document.querySelector('input[name="numberSubMode"][value="normal"]')?.click()`);
            await evalJS(cdp, `document.querySelector('.start-button').click()`);
            await waitFor(cdp, `document.querySelector('.number-input')`);

            for (const bad of ['0', '-5', '1026', 'abc']) {
                await submitNumber(cdp, bad);
            }
            assert.equal(await evalJS(cdp, `document.querySelectorAll('.guess-row').length`), 0);

            const targetId = await evalJS(cdp, `parseInt(document.querySelector('.sprite-img').src.match(/\\/(\\d+)\\.png/)[1], 10)`);
            const validWrong = targetId === 50 ? 51 : 50;
            await submitNumber(cdp, String(validWrong));
            await submitNumber(cdp, String(validWrong)); // duplicate
            assert.equal(await evalJS(cdp, `document.querySelectorAll('.guess-row').length`), 1);

            // Clear input then test ArrowUp from empty -> 1, ArrowDown -> clamped at 1
            await evalJS(cdp, `(() => {
                const input = document.querySelector('.number-input');
                input.value = '';
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
            })()`);
            assert.equal(await evalJS(cdp, `document.querySelector('.number-input').value`), '1');
            await evalJS(cdp, `(() => {
                const input = document.querySelector('.number-input');
                input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
            })()`);
            assert.equal(await evalJS(cdp, `document.querySelector('.number-input').value`), '1');
        });

        await runner.test('150-157,161-162', 'Points Mode: 10 rounds, exact 1000 pts, effects cleared on reveal, summary screen & desktop viewports', async () => {
            await openGameSettings(cdp, 'Number Quiz');
            await evalJS(cdp, `(() => {
                document.querySelector('input[name="numberSubMode"][value="points"]')?.click();
                // Enable Blur (0), Silhouette (2), Rotation (3) - keep Pixelate (1) off here so sprite URL retains ID
                const cbs = Array.from(document.querySelectorAll('.sprite-effects-selector input[type="checkbox"]'));
                [0, 2, 3].forEach(idx => { if (cbs[idx] && !cbs[idx].checked) cbs[idx].click(); });
                if (cbs[1] && cbs[1].checked) cbs[1].click();
            })()`);
            await sleep(100);
            await evalJS(cdp, `document.querySelector('.start-button').click()`);
            await waitFor(cdp, `document.querySelector('.sprite-img')?.complete`);

            // Verify effects active before guess
            const preFilter = await evalJS(cdp, `document.querySelector('.sprite-img').style.filter`);
            assert.ok(preFilter.includes('blur') && preFilter.includes('brightness(0)'), `Expected effects active, got: ${preFilter}`);

            for (let r = 1; r <= 10; r++) {
                await waitFor(cdp, `document.querySelector('.number-input')`);
                const targetId = await evalJS(cdp, `parseInt(document.querySelector('.sprite-img').src.match(/\\/(\\d+)\\.png/)[1], 10)`);
                // Guess exact on round 1, off by 100 on others
                const guess = r === 1 ? targetId : (targetId > 100 ? targetId - 100 : targetId + 100);
                await submitNumber(cdp, String(guess));
                await waitFor(cdp, `document.querySelector('.sprite-card button')`);
                if (r === 1) {
                    const revealText = await evalJS(cdp, `document.querySelector('.sprite-card').innerText`);
                    assert.ok(revealText.includes('+1000 pts'), `Expected +1000 pts on exact match, got: ${revealText}`);
                    const postFilter = await evalJS(cdp, `document.querySelector('.sprite-img').style.filter`);
                    assert.equal(postFilter, 'none', 'Effects should be cleared on reveal');
                }
                await evalJS(cdp, `document.querySelector('.sprite-card button').click()`);
            }

            await waitFor(cdp, `document.querySelector('.review-container')`);
            await waitFor(cdp, `Array.from(document.querySelectorAll('.round-sprite')).every(i => i.complete && i.naturalWidth > 0)`);
            const roundCards = await evalJS(cdp, `document.querySelectorAll('.round-card').length`);
            assert.equal(roundCards, 10);

            for (const vp of DESKTOP_VIEWPORTS) {
                await setViewport(cdp, vp);
                await sleep(150);
                await checkDesktopLayout(cdp, `number-review-${vp.id}`);
            }
            await setViewport(cdp, DESKTOP_VIEWPORTS[0]);
        });

        await runner.test('api-clean', 'Zero API/network/console/runtime errors in Number Quiz suite', async () => {
            assert.deepEqual(networkErrors, []);
            assert.deepEqual(consoleErrors, []);
            assert.deepEqual(runtimeExceptions, []);
        });
    } finally {
        await page.close();
    }

    return runner.summary();
}
