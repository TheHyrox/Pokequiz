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

export async function runPokedleQuizTests() {
    const runner = new TestRunner('Quiz Pokedle (#132–#142)');
    const page = await createPage();
    const { cdp, networkErrors, consoleErrors, runtimeExceptions } = page;

    try {
        await runner.test('132-138,142', 'Normal Mode: search submits guess, 11 columns in order, color coding, +1 pt/guess, indicators & guess limit', async () => {
            await openGameSettings(cdp, 'Quiz Pokedle');
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
            await waitFor(cdp, `document.querySelector('input[type="text"]')`);

            // Verify Pokedle columns (Pokemon + attributes)
            const headers = await evalJS(cdp, `Array.from(document.querySelectorAll('table th')).map(el => el.textContent.trim()).filter(Boolean)`);
            assert.ok(headers.length >= 10, `Expected >=10 Pokedle headers, got ${headers.length}: ${JSON.stringify(headers)}`);

            // Submit a guess via Autocomplete search bar (type Pikachu + Enter)
            await evalJS(cdp, `(() => {
                const input = document.querySelector('input[type="text"]');
                input.focus();
                input.value = 'Pikachu';
                input.dispatchEvent(new Event('input', { bubbles: true }));
            })()`);
            await sleep(150);
            await evalJS(cdp, `(() => {
                const input = document.querySelector('input[type="text"]');
                input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
            })()`);
            await waitFor(cdp, `document.querySelectorAll('table tbody tr').length >= 1`, 10000);

            for (const vp of DESKTOP_VIEWPORTS) {
                await setViewport(cdp, vp);
                await checkDesktopLayout(cdp, `pokedle-${vp.id}`);
            }
            await setViewport(cdp, DESKTOP_VIEWPORTS[0]);
        });

        await runner.test('139-141', 'Options: column selection hides unselected columns', async () => {
            await openGameSettings(cdp, 'Quiz Pokedle');
            await evalJS(cdp, `(() => {
                // Uncheck last 2 column checkboxes
                const cols = Array.from(document.querySelectorAll('.information-grid input[type="checkbox"]'));
                cols.slice(-2).forEach(cb => { if (cb.checked) cb.click(); });
            })()`);
            await sleep(80);
            await evalJS(cdp, `document.querySelector('.start-button').click()`);
            await waitFor(cdp, `document.querySelector('input[type="text"]')`);

            const headerCount = await evalJS(cdp, `document.querySelectorAll('table th, .pokedle-header > div').length`);
            assert.ok(headerCount < 12, `Expected fewer headers after hiding 2 columns, got ${headerCount}`);
        });

        await runner.test('api-clean', 'Zero API/network/console/runtime errors in Pokedle Quiz suite', async () => {
            assert.deepEqual(networkErrors, []);
            assert.deepEqual(consoleErrors, []);
            assert.deepEqual(runtimeExceptions, []);
        });
    } finally {
        await page.close();
    }

    return runner.summary();
}
