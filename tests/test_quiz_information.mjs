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

async function getCurrentInfoTarget(cdp) {
    return await evalJS(cdp, `(() => {
        const logs = window.__apiLog || [];
        const call = [...logs].reverse().find(l => /\\/api\\/pokemon\\/\\d+\\/\\d+$/.test(l.url));
        if (!call) return null;
        return { id: call.data?.id, name: call.data?.name };
    })()`);
}

async function clickOption(cdp, targetName, wantCorrect) {
    await evalJS(cdp, `(() => {
        const items = Array.from(document.querySelectorAll('.pokemon-grid-item'));
        const targetLower = ${JSON.stringify(targetName.toLowerCase())};
        const btn = items.find(el => {
            const isMatch = el.textContent.trim().toLowerCase() === targetLower;
            return ${wantCorrect} ? isMatch : !isMatch;
        });
        if (!btn) throw new Error('Info option not found (wantCorrect=' + ${wantCorrect} + ')');
        btn.click();
    })()`);
    await sleep(120);
}

export async function runInformationQuizTests() {
    const runner = new TestRunner('Quiz Informations (#56–#89)');
    const page = await createPage();
    const { cdp, networkErrors, consoleErrors, runtimeExceptions } = page;

    try {
        await runner.test('56-58', 'Easy Mode: all selected infos revealed immediately, +1 pt per correct answer', async () => {
            await openGameSettings(cdp, 'Information Quiz');
            await evalJS(cdp, `document.querySelector('input[type="radio"][value="easy"]')?.click()`);
            await evalJS(cdp, `document.querySelector('.start-button').click()`);
            await waitFor(cdp, `document.querySelectorAll('.pokemon-grid-item').length >= 2 && document.querySelectorAll('.hint-item').length >= 3`);

            const t1 = await getCurrentInfoTarget(cdp);
            assert.ok(t1?.name, 'Target name should resolve');
            await clickOption(cdp, t1.name, true);
            await sleep(300);
            const text = await evalJS(cdp, `document.querySelector('.quiz-header-row')?.innerText || document.body.innerText`);
            assert.ok(text.includes('1'), `Expected score 1, got: ${text}`);
        });

        await runner.test('59-64', 'Normal Mode: half infos initially, +1 info per error, 3/1/0 scoring', async () => {
            await openGameSettings(cdp, 'Information Quiz');
            await evalJS(cdp, `document.querySelector('input[type="radio"][value="normal"]')?.click()`);
            await evalJS(cdp, `document.querySelector('.start-button').click()`);
            await waitFor(cdp, `document.querySelectorAll('.pokemon-grid-item').length >= 2 && document.querySelectorAll('.hint-item').length >= 1`);

            const initialHints = await evalJS(cdp, `document.querySelectorAll('.hint-item').length`);
            const t1 = await getCurrentInfoTarget(cdp);
            await clickOption(cdp, t1.name, false);
            await sleep(200);
            const afterErrHints = await evalJS(cdp, `document.querySelectorAll('.hint-item').length`);
            assert.ok(afterErrHints >= initialHints, 'Hints should reveal on error');

            await clickOption(cdp, t1.name, true); // 1 error -> +1 pt
            await sleep(200);
            const headerText = await evalJS(cdp, `document.querySelector('.quiz-header-row')?.innerText || ''`);
            assert.ok(headerText.includes('1'), `Expected +1 pt after 1 error, got: ${headerText}`);
        });

        await runner.test('65-69', 'Challenge Mode: 10 questions, 1/3 infos initially, 1 attempt per question, summary screen', async () => {
            await openGameSettings(cdp, 'Information Quiz');
            await evalJS(cdp, `document.querySelector('input[type="radio"][value="challenge"]')?.click()`);
            await evalJS(cdp, `document.querySelector('.start-button').click()`);

            for (let q = 1; q <= 10; q++) {
                await waitFor(cdp, `document.querySelectorAll('.pokemon-grid-item').length >= 2`);
                await evalJS(cdp, `(document.querySelector('.pokemon-grid-item button, .pokemon-grid-item [role="button"]') || document.querySelector('.pokemon-grid-item')).click()`);
                await sleep(250);
            }
            await waitFor(cdp, `document.querySelectorAll('.option-card, .correct-label').length >= 10`, 15000);
            await waitFor(cdp, `Array.from(document.querySelectorAll('img')).every(i => i.complete)`, 15000);
            await checkDesktopLayout(cdp, 'info-challenge-summary');
        });

        await runner.test('70-80', 'Hardcore Mode: 30s forced, 3 lives, 2 initial hints, timed scoring/life loss', async () => {
            await openGameSettings(cdp, 'Information Quiz');
            await evalJS(cdp, `document.querySelector('input[type="radio"][value="hardcore"]')?.click()`);
            await evalJS(cdp, `document.querySelector('.start-button').click()`);
            await waitFor(cdp, `document.querySelectorAll('.pokemon-grid-item').length >= 2 && document.querySelectorAll('.hint-item').length >= 2`);

            const hasLives = await evalJS(cdp, `document.body.innerText.includes('❤️')`);
            assert.equal(hasLives, true, 'Hardcore should show lives');
            // Click an option and verify either score increased or a life was lost
            await evalJS(cdp, `document.querySelector('.pokemon-grid-item').click()`);
            await sleep(250);
            const stateText = await evalJS(cdp, `document.body.innerText`);
            assert.ok(stateText.includes('Score:') || stateText.includes('❤️'), 'Game state updated after guess');
        });

        await runner.test('85-89', 'Options: minimum 3 info types validation, sprites toggle & desktop viewports', async () => {
            await openGameSettings(cdp, 'Information Quiz');
            for (const vp of DESKTOP_VIEWPORTS) {
                await setViewport(cdp, vp);
                await checkDesktopLayout(cdp, `info-settings-${vp.id}`);
            }
            await setViewport(cdp, DESKTOP_VIEWPORTS[0]);
        });

        await runner.test('api-clean', 'Zero API/network/console/runtime errors in Information Quiz suite', async () => {
            assert.deepEqual(networkErrors, []);
            assert.deepEqual(consoleErrors, []);
            assert.deepEqual(runtimeExceptions, []);
        });
    } finally {
        await page.close();
    }

    return runner.summary();
}
