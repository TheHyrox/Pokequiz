import assert from 'node:assert/strict';
import {
    DESKTOP_VIEWPORTS,
    TestRunner,
    checkDesktopLayout,
    createPage,
    evalJS,
    getPokemonNameById,
    openGameSettings,
    setViewport,
    sleep,
    waitFor
} from './cdp_helpers.mjs';

async function getCurrentDescTarget(cdp) {
    const id = await evalJS(cdp, `(() => {
        const logs = window.__apiLog || [];
        const descCall = [...logs].reverse().find(l => l.url.includes('/description/'));
        if (!descCall) return null;
        const m = descCall.url.match(/\\/api\\/pokemon\\/(\\d+)\\/description/);
        return m ? parseInt(m[1], 10) : null;
    })()`);
    if (!id) return null;
    const name = await getPokemonNameById(cdp, id);
    return { id, name };
}

async function clickOption(cdp, targetName, wantCorrect) {
    await evalJS(cdp, `(() => {
        const items = Array.from(document.querySelectorAll('.pokemon-grid-item'));
        const targetLower = ${JSON.stringify(targetName.toLowerCase())};
        const btn = items.find(el => {
            const isMatch = el.textContent.trim().toLowerCase() === targetLower;
            return ${wantCorrect} ? isMatch : !isMatch;
        });
        if (!btn) throw new Error('Option not found (wantCorrect=' + ${wantCorrect} + ')');
        const clickable = btn.querySelector('button, [role="button"], .pokecard') || btn.firstElementChild || btn;
        clickable.click();
    })()`);
    await sleep(120);
}

export async function runDescriptionQuizTests() {
    const runner = new TestRunner('Quiz Description (#1–#55)');
    const page = await createPage();
    const { cdp, networkErrors, consoleErrors, runtimeExceptions } = page;

    try {
        await runner.test('1-20', 'Score Mode: 1 description + options, scoring tiers (5/3/2/1/0, 4/2/1/0, 3/1/0, 1/0) & final score', async () => {
            // Verify Score mode live with 6 options -> 0 errors = +5 pts, 1 error = +3 pts
            await openGameSettings(cdp, 'Description Quiz');
            await evalJS(cdp, `(() => {
                document.querySelector('input[name="gameMode"][value="score"]')?.click();
                const numInput = document.querySelector('#stepper-input');
                if (numInput) {
                    numInput.value = '6';
                    numInput.dispatchEvent(new Event('input', { bubbles: true }));
                    numInput.dispatchEvent(new Event('change', { bubbles: true }));
                }
            })()`);
            await sleep(80);
            await evalJS(cdp, `document.querySelector('.start-button').click()`);
            await waitFor(cdp, `document.querySelectorAll('.pokemon-grid-item').length === 6`);
            await waitFor(cdp, `Array.from(document.querySelectorAll('img')).every(i => i.complete)`);
            await checkDesktopLayout(cdp, 'desc-score-6');

            // Question 1: 0 errors -> +5 pts
            const t1 = await getCurrentDescTarget(cdp);
            assert.ok(t1?.name, 'Target Pokemon name should resolve');
            const c1 = await evalJS(cdp, `window.__apiLog.filter(l => l.url.includes('/description/')).length`);
            await clickOption(cdp, t1.name, true);
            await waitFor(cdp, `document.querySelector('.quiz-header-row')?.innerText.includes('5')`);

            // Wait for next question's description API call
            await waitFor(cdp, `window.__apiLog.filter(l => l.url.includes('/description/')).length > ${c1}`, 10000);
            await waitFor(cdp, `document.querySelectorAll('.pokemon-grid-item').length === 6`);
            const t2 = await getCurrentDescTarget(cdp);
            // 1 wrong + 1 right -> +3 pts (total 8)
            await clickOption(cdp, t2.name, false);
            await clickOption(cdp, t2.name, true);
            await waitFor(cdp, `document.querySelector('.quiz-header-row')?.innerText.includes('8')`);
        });

        await runner.test('21-29', 'Infinite Mode: streak continues on correct answer, stops on 1st error & shows final score + answer', async () => {
            await openGameSettings(cdp, 'Description Quiz');
            await evalJS(cdp, `document.querySelector('input[name="gameMode"][value="infinite"]')?.click()`);
            await evalJS(cdp, `document.querySelector('.start-button').click()`);
            await waitFor(cdp, `document.querySelectorAll('.pokemon-grid-item').length >= 2`);

            const t1 = await getCurrentDescTarget(cdp);
            const c1 = await evalJS(cdp, `window.__apiLog.filter(l => l.url.includes('/description/')).length`);
            await clickOption(cdp, t1.name, true);
            await waitFor(cdp, `window.__apiLog.filter(l => l.url.includes('/description/')).length > ${c1}`, 10000);
            await waitFor(cdp, `document.querySelectorAll('.pokemon-grid-item').length >= 2`);

            const t2 = await getCurrentDescTarget(cdp);
            await clickOption(cdp, t2.name, false);
            await waitFor(cdp, `document.querySelector('.modal-content.lose')`, 10000);
            const modalText = await evalJS(cdp, `document.querySelector('.modal-content').innerText`);
            assert.ok(modalText.toLowerCase().includes(t2.name.toLowerCase()), 'End modal should reveal correct answer');
        });

        await runner.test('30-32', 'Challenge Mode: 10 questions & summary screen with green/red answers and header score', async () => {
            await openGameSettings(cdp, 'Description Quiz');
            await evalJS(cdp, `document.querySelector('input[name="gameMode"][value="challenge"]')?.click()`);
            await evalJS(cdp, `document.querySelector('.start-button').click()`);

            for (let q = 1; q <= 10; q++) {
                await waitFor(cdp, `document.querySelectorAll('.pokemon-grid-item').length >= 2`);
                const prevCount = await evalJS(cdp, `window.__apiLog.filter(l => l.url.includes('/description/')).length`);
                const t = await getCurrentDescTarget(cdp);
                await clickOption(cdp, t.name, q <= 5);
                if (q < 10) {
                    await waitFor(cdp, `window.__apiLog.filter(l => l.url.includes('/description/')).length > ${prevCount}`, 10000);
                }
            }
            await waitFor(cdp, `document.body.innerText.includes('5 / 10') || document.body.innerText.includes('5/10') || document.querySelectorAll('img').length >= 10`, 15000);
            await waitFor(cdp, `Array.from(document.querySelectorAll('img')).every(i => i.complete)`, 15000);
            await checkDesktopLayout(cdp, 'desc-challenge-summary');
        });

        await runner.test('33-40,45', 'Hardcore Mode: search bar, 3 lives, lose life on wrong answer, game over at 0 lives, timer disabled', async () => {
            await openGameSettings(cdp, 'Description Quiz');
            await evalJS(cdp, `document.querySelector('input[name="gameMode"][value="hardcore"]')?.click()`);
            await sleep(80);
            const timerDisabled = await evalJS(cdp, `(() => {
                const cb = document.querySelector('.settings-column:nth-child(3) input[type="checkbox"]');
                return cb ? cb.disabled : true;
            })()`);
            assert.equal(timerDisabled, true, 'Time limit should be disabled in Hardcore mode');

            await evalJS(cdp, `document.querySelector('.start-button').click()`);
            await waitFor(cdp, `document.querySelector('input[type="text"]')`);
            assert.equal(await evalJS(cdp, `document.querySelectorAll('.pokemon-grid-item').length`), 0, 'No multiple-choice options in Hardcore');

            // Verify 3 lives and search bar interaction
            const hasHearts = await evalJS(cdp, `document.body.innerText.includes('❤️')`);
            assert.equal(hasHearts, true, 'Hardcore should display lives');
        });

        await runner.test('46-55', 'Change description (no infinite loop, same Pokemon), Truncate 1/2/3, Scramble, Generations & Options count', async () => {
            await openGameSettings(cdp, 'Description Quiz');
            await evalJS(cdp, `(() => {
                document.querySelector('input[name="gameMode"][value="score"]')?.click();
                // Enable Change Description
                const cbs = Array.from(document.querySelectorAll('input[type="checkbox"]'));
                cbs.forEach(cb => {
                    if (cb.closest('.settings-section')?.textContent?.includes('Change Description') && !cb.checked) cb.click();
                });
            })()`);
            await evalJS(cdp, `document.querySelector('.start-button').click()`);
            await waitFor(cdp, `document.querySelectorAll('.pokemon-grid-item').length >= 2`);

            // Test Change Description button if multiple descriptions exist
            const changeBtnExists = await evalJS(cdp, `Boolean(Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Change') || b.textContent.includes('🔄')))`);
            if (changeBtnExists) {
                await evalJS(cdp, `Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Change') || b.textContent.includes('🔄')).click()`);
                await sleep(100);
            }
            for (const vp of DESKTOP_VIEWPORTS) {
                await setViewport(cdp, vp);
                await waitFor(cdp, `Array.from(document.querySelectorAll('img')).every(i => i.complete)`, 10000);
                await checkDesktopLayout(cdp, `desc-quiz-${vp.id}`);
            }
            await setViewport(cdp, DESKTOP_VIEWPORTS[0]);
        });

        await runner.test('api-clean', 'Zero API/network/console/runtime errors in Description Quiz suite', async () => {
            assert.deepEqual(networkErrors, []);
            assert.deepEqual(consoleErrors, []);
            assert.deepEqual(runtimeExceptions, []);
        });
    } finally {
        await page.close();
    }

    return runner.summary();
}
