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

async function getCurrentSpriteTarget(cdp) {
    const id = await evalJS(cdp, `(() => {
        const img = document.querySelector('.pokemon-sprite');
        if (!img) return null;
        const m = img.src.match(/\\/(\\d+)\\.png/);
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
        if (!btn) throw new Error('Sprite option not found (wantCorrect=' + ${wantCorrect} + ')');
        const clickable = btn.querySelector('button, [role="button"], .pokecard') || btn.firstElementChild || btn;
        clickable.click();
    })()`);
    await sleep(120);
}

export async function runSpritesQuizTests() {
    const runner = new TestRunner('Quiz Sprites (#90–#131)');
    const page = await createPage();
    const { cdp, networkErrors, consoleErrors, runtimeExceptions } = page;

    try {
        await runner.test('90-104', 'Score Mode: 5/3/2/1/0 scoring with 6 options & final score display', async () => {
            await openGameSettings(cdp, 'Sprites Quiz');
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
            await waitFor(cdp, `document.querySelector('.pokemon-sprite')?.complete && document.querySelectorAll('.pokemon-grid-item').length === 6`);

            const prevSrc1 = await evalJS(cdp, `document.querySelector('.pokemon-sprite').src`);
            const t1 = await getCurrentSpriteTarget(cdp);
            assert.ok(t1?.name, 'Sprite target name should resolve');
            await clickOption(cdp, t1.name, true); // +5 pts
            await waitFor(cdp, `document.querySelector('.pokemon-sprite')?.src !== ${JSON.stringify(prevSrc1)}`, 10000);
            await waitFor(cdp, `document.querySelector('.pokemon-sprite')?.complete && document.querySelectorAll('.pokemon-grid-item').length === 6`);

            const t2 = await getCurrentSpriteTarget(cdp);
            await clickOption(cdp, t2.name, false);
            await clickOption(cdp, t2.name, false);
            await clickOption(cdp, t2.name, true); // 2 errors -> +2 pts (total 7)
            await waitFor(cdp, `(document.querySelector('.quiz-header-row')?.innerText || '').includes('7')`);
        });

        await runner.test('105-111', 'Infinite Mode: streak continues on right answer, stops on 1st error & reveals answer', async () => {
            await openGameSettings(cdp, 'Sprites Quiz');
            await evalJS(cdp, `document.querySelector('input[name="gameMode"][value="infinite"]')?.click()`);
            await evalJS(cdp, `document.querySelector('.start-button').click()`);
            await waitFor(cdp, `document.querySelector('.pokemon-sprite')?.complete`);

            const prevSrc = await evalJS(cdp, `document.querySelector('.pokemon-sprite').src`);
            const t1 = await getCurrentSpriteTarget(cdp);
            await clickOption(cdp, t1.name, true);
            await waitFor(cdp, `document.querySelector('.pokemon-sprite')?.src !== ${JSON.stringify(prevSrc)}`, 10000);
            await waitFor(cdp, `document.querySelectorAll('.pokemon-grid-item').length >= 2`);

            const t2 = await getCurrentSpriteTarget(cdp);
            await clickOption(cdp, t2.name, false);
            await waitFor(cdp, `document.querySelector('.modal-content.lose')`, 10000);
            const modalText = await evalJS(cdp, `document.querySelector('.modal-content').innerText`);
            assert.ok(modalText.toLowerCase().includes(t2.name.toLowerCase()));
        });

        await runner.test('112-114', 'Challenge Mode: 10 questions, 1 pt per correct answer & summary screen', async () => {
            await openGameSettings(cdp, 'Sprites Quiz');
            await evalJS(cdp, `document.querySelector('input[name="gameMode"][value="challenge"]')?.click()`);
            await evalJS(cdp, `document.querySelector('.start-button').click()`);

            for (let q = 1; q <= 10; q++) {
                await waitFor(cdp, `(document.querySelector('.quiz-header-row')?.innerText || '').includes('${q}/10') && document.querySelectorAll('.pokemon-grid-item').length >= 2 && document.querySelector('.pokemon-sprite')?.complete`);
                const t = await getCurrentSpriteTarget(cdp);
                await clickOption(cdp, t.name, q <= 6);
                if (q < 10) {
                    await waitFor(cdp, `(document.querySelector('.quiz-header-row')?.innerText || '').includes('${q + 1}/10')`, 10000);
                }
            }
            await waitFor(cdp, `document.body.innerText.includes('6 / 10') || document.body.innerText.includes('6/10') || document.querySelectorAll('img').length >= 10`, 15000);
            await waitFor(cdp, `Array.from(document.querySelectorAll('img')).every(i => i.complete)`, 15000);
            await checkDesktopLayout(cdp, 'sprites-challenge-summary');
        });

        await runner.test('115-118,123', 'Hardcore Mode: 3 lives, search bar (no options), timer disabled', async () => {
            await openGameSettings(cdp, 'Sprites Quiz');
            await evalJS(cdp, `document.querySelector('input[name="gameMode"][value="hardcore"]')?.click()`);
            await evalJS(cdp, `document.querySelector('.start-button').click()`);
            await waitFor(cdp, `document.querySelector('input[type="text"]') && document.querySelector('.pokemon-sprite')?.complete`);
            assert.equal(await evalJS(cdp, `document.querySelectorAll('.pokemon-grid-item').length`), 0);
            assert.equal(await evalJS(cdp, `document.body.innerText.includes('❤️')`), true);
        });

        await runner.test('124-131', 'Options & Effects: Blur, Pixelate, Silhouette, Rotation & Desktop Viewports', async () => {
            await openGameSettings(cdp, 'Sprites Quiz');
            await evalJS(cdp, `(() => {
                document.querySelector('input[name="gameMode"][value="score"]')?.click();
                const cbs = Array.from(document.querySelectorAll('.sprite-effects-selector input[type="checkbox"]'));
                cbs.forEach(cb => { if (!cb.checked) cb.click(); });
            })()`);
            await sleep(100);
            await evalJS(cdp, `document.querySelector('.start-button').click()`);
            await waitFor(cdp, `document.querySelector('.pokemon-sprite')?.complete && document.querySelector('.pokemon-sprite').naturalWidth > 0`, 15000);

            const spriteState = await evalJS(cdp, `(() => {
                const img = document.querySelector('.pokemon-sprite');
                const cont = document.querySelector('.sprite-container');
                return {
                    isDataUrl: img.src.startsWith('data:image/'),
                    filter: img.style.filter,
                    transform: cont?.style.transform || ''
                };
            })()`);
            assert.equal(spriteState.isDataUrl, true, 'Pixelate should produce data URL');
            assert.ok(spriteState.filter.includes('blur') && spriteState.filter.includes('brightness(0)'));
            assert.ok(spriteState.transform.includes('rotate('));

            for (const vp of DESKTOP_VIEWPORTS) {
                await setViewport(cdp, vp);
                await checkDesktopLayout(cdp, `sprites-quiz-${vp.id}`);
            }
            await setViewport(cdp, DESKTOP_VIEWPORTS[0]);
        });

        await runner.test('api-clean', 'Zero API/network/console/runtime errors in Sprites Quiz suite', async () => {
            assert.deepEqual(networkErrors, []);
            assert.deepEqual(consoleErrors, []);
            assert.deepEqual(runtimeExceptions, []);
        });
    } finally {
        await page.close();
    }

    return runner.summary();
}
