import assert from 'node:assert/strict';
import {
    BASE_URL,
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

async function getCurrentZoomTarget(cdp) {
    const id = await evalJS(cdp, `(() => {
        const img = document.querySelector('.zoom-cropped-sprite');
        if (!img) return null;
        const pid = img.getAttribute('data-pokemon-id');
        return pid ? parseInt(pid, 10) : null;
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
        if (!btn) throw new Error('Zoom option not found (wantCorrect=' + ${wantCorrect} + ')');
        const clickable = btn.querySelector('button, [role="button"], .pokecard') || btn.firstElementChild || btn;
        clickable.click();
    })()`);
    await sleep(120);
}

export async function runZoomQuizTests() {
    const runner = new TestRunner('Zoomed / Cropped Sprite Quiz');
    const page = await createPage();
    const { cdp, networkErrors, consoleErrors, runtimeExceptions } = page;

    try {
        await runner.test('zoom-score-crop', 'Starts with 25%–40% cropped Canvas artwork and zooms out on wrong guess or hint button / Space', async () => {
            await openGameSettings(cdp, 'Zoomed Sprite Quiz');
            await evalJS(cdp, `(() => {
                document.querySelector('input[name="gameMode"][value="score"]')?.click();
            })()`);
            await sleep(80);
            await evalJS(cdp, `document.querySelector('.start-button').click()`);
            await waitFor(cdp, `document.querySelector('.zoom-cropped-sprite')?.complete && document.querySelectorAll('.pokemon-grid-item').length >= 4`);

            const initialState = await evalJS(cdp, `(() => {
                const img = document.querySelector('.zoom-cropped-sprite');
                return {
                    src: img.src,
                    isDataUrl: img.src.startsWith('data:image/png'),
                    cropPct: parseInt(img.getAttribute('data-crop-percent') || '0', 10),
                    origSrc: img.getAttribute('data-original-src') || ''
                };
            })()`);

            assert.equal(initialState.isDataUrl, true, 'Initial cropped region must be a Canvas data:image/png URL');
            assert.ok(initialState.cropPct >= 25 && initialState.cropPct <= 40, `Expected initial crop in 25%-40%, got ${initialState.cropPct}%`);
            assert.ok(initialState.origSrc.includes('official-artwork') || initialState.origSrc.includes('/home/'), `Expected OFFICIAL or HOME artwork source, got: ${initialState.origSrc}`);

            // Click manual Zoom Out (Hint) button -> crop percentage increases
            await evalJS(cdp, `document.querySelector('.zoom-out-hint-btn').click()`);
            await sleep(100);
            const afterHintCrop = await evalJS(cdp, `parseInt(document.querySelector('.zoom-cropped-sprite').getAttribute('data-crop-percent') || '0', 10)`);
            assert.ok(afterHintCrop > initialState.cropPct, `Expected crop % to zoom out after hint (${afterHintCrop} > ${initialState.cropPct})`);

            // Make a wrong guess -> crop percentage increases again automatically
            const target = await getCurrentZoomTarget(cdp);
            assert.ok(target?.name, 'Target Pokemon name should resolve');
            await clickOption(cdp, target.name, false);
            const afterWrongCrop = await evalJS(cdp, `parseInt(document.querySelector('.zoom-cropped-sprite').getAttribute('data-crop-percent') || '0', 10)`);
            assert.ok(afterWrongCrop > afterHintCrop, `Expected crop % to zoom out on wrong guess (${afterWrongCrop} > ${afterHintCrop})`);

            // Now pick the right answer -> advances to Question 2 and resets crop back to initialCropSize
            const prevPid = target.id;
            await clickOption(cdp, target.name, true);
            await waitFor(cdp, `parseInt(document.querySelector('.zoom-cropped-sprite')?.getAttribute('data-pokemon-id') || '0', 10) !== ${prevPid}`, 10000);
            const q2Crop = await evalJS(cdp, `parseInt(document.querySelector('.zoom-cropped-sprite').getAttribute('data-crop-percent') || '0', 10)`);
            assert.equal(q2Crop, initialState.cropPct, 'Question 2 should reset crop window back to initial percentage');
        });

        await runner.test('zoom-modes-url', 'Supports URL params (?quiz=zoom&crop=10&step=20&source=home), Challenge review, Hardcore & viewports', async () => {
            await cdp.send('Page.navigate', { url: `${BASE_URL}/?quiz=zoom&crop=10&step=20&source=home&play=1` });
            await waitFor(cdp, `document.querySelector('.zoom-cropped-sprite')?.complete`);

            const state = await evalJS(cdp, `(() => {
                const img = document.querySelector('.zoom-cropped-sprite');
                return {
                    cropPct: parseInt(img.getAttribute('data-crop-percent') || '0', 10),
                    origSrc: img.getAttribute('data-original-src') || ''
                };
            })()`);
            assert.equal(state.cropPct, 10, 'URL param crop=10 should set initial crop to 10%');
            assert.ok(state.origSrc.includes('/home/'), `URL param source=home should use HOME artwork, got ${state.origSrc}`);

            // Press Space to trigger zoom-out step (+20% -> 30%)
            await evalJS(cdp, `window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))`);
            await sleep(100);
            const afterSpacePct = await evalJS(cdp, `parseInt(document.querySelector('.zoom-cropped-sprite').getAttribute('data-crop-percent') || '0', 10)`);
            assert.equal(afterSpacePct, 30, 'Pressing Space with step=20 should zoom out from 10% to 30%');

            for (const vp of DESKTOP_VIEWPORTS) {
                await setViewport(cdp, vp);
                await checkDesktopLayout(cdp, `zoom-quiz-${vp.id}`);
            }
            await setViewport(cdp, DESKTOP_VIEWPORTS[0]);
        });

        await runner.test('zoom-server-api', 'Server endpoint /api/pokemon/25/sprites returns zoomQuiz cropSchedule and artworkUrl', async () => {
            const payload = await evalJS(cdp, `(async () => {
                const res = await fetch('/api/pokemon/25/sprites?zoomSource=official&initialCropSize=25&zoomStep=15');
                return await res.json();
            })()`);
            assert.equal(payload.id, 25);
            assert.ok(payload.zoomQuiz.artworkUrl.includes('/official-artwork/25.png'));
            assert.deepEqual(payload.zoomQuiz.cropSchedule, [25, 40, 55, 70, 85, 100]);
        });

        await runner.test('api-clean', 'Zero API/network/console/runtime errors in Zoomed Sprite Quiz suite', async () => {
            assert.deepEqual(networkErrors, []);
            assert.deepEqual(consoleErrors, []);
            assert.deepEqual(runtimeExceptions, []);
        });
    } finally {
        await page.close();
    }

    return runner.summary();
}
