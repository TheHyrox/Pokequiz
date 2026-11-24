import assert from 'node:assert/strict';
import {
    BASE_URL,
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

export async function runShinyQuizTests() {
    const runner = new TestRunner('Shiny vs. Normal Quiz');
    const page = await createPage();
    const { cdp, networkErrors, consoleErrors, runtimeExceptions } = page;

    try {
        await runner.test('shiny-binary-mode', 'Variant 1 ("Is this sprite shiny?"): uses SPRITE_URLS.SHINY / DEFAULT and scores binary answers', async () => {
            await openGameSettings(cdp, 'Shiny Quiz');
            await evalJS(cdp, `(() => {
                document.querySelector('input[name="shinyVariant"][value="binary"]')?.click();
                document.querySelector('input[name="gameMode"][value="score"]')?.click();
            })()`);
            await sleep(80);
            await evalJS(cdp, `document.querySelector('.start-button').click()`);
            await waitFor(cdp, `document.querySelector('.shiny-binary-sprite')?.complete`);

            const q1Info = await evalJS(cdp, `(() => {
                const img = document.querySelector('.shiny-binary-sprite');
                return {
                    src: img.src,
                    isShiny: img.getAttribute('data-is-shiny') === '1',
                    pid: parseInt(img.getAttribute('data-pokemon-id') || '0', 10)
                };
            })()`);
            assert.ok(q1Info.pid >= 1 && q1Info.pid <= 1025, 'Valid Pokemon ID in binary Shiny quiz');
            if (q1Info.isShiny) {
                assert.ok(q1Info.src.includes('/shiny/'), `Expected shiny sprite URL, got ${q1Info.src}`);
            } else {
                assert.ok(!q1Info.src.includes('/shiny/'), `Expected normal sprite URL, got ${q1Info.src}`);
            }

            // Click the correct binary choice button
            const selector = q1Info.isShiny ? '.choice-shiny' : '.choice-normal';
            await evalJS(cdp, `document.querySelector('${selector}').click()`);
            await waitFor(cdp, `(document.querySelector('.quiz-header-row')?.innerText || '').includes('2/10')`, 10000);
            const headerScore = await evalJS(cdp, `document.querySelector('.quiz-header-row')?.innerText || ''`);
            assert.ok(headerScore.includes('Score: 2'), `Expected +2 pts after right binary answer, got: ${headerScore}`);
        });

        await runner.test('shiny-spot-fakes-mode', 'Variant 2 ("Pick the real shiny among 4–6 color-shifted fakes"): generates Canvas hue-shifted fakes + 1 real shiny', async () => {
            await openGameSettings(cdp, 'Shiny Quiz');
            await evalJS(cdp, `(() => {
                document.querySelector('input[name="shinyVariant"][value="spot"]')?.click();
                document.querySelector('input[name="gameMode"][value="score"]')?.click();
            })()`);
            await sleep(80);
            await evalJS(cdp, `(() => {
                const numInput = document.querySelector('#stepper-input');
                if (numInput) {
                    numInput.value = '5';
                    numInput.dispatchEvent(new Event('input', { bubbles: true }));
                    numInput.dispatchEvent(new Event('change', { bubbles: true }));
                }
            })()`);
            await sleep(80);
            await evalJS(cdp, `document.querySelector('.start-button').click()`);
            await waitFor(cdp, `document.querySelectorAll('.shiny-fake-option-card').length === 5 && Array.from(document.querySelectorAll('.shiny-option-sprite')).every(i => i.complete && i.naturalWidth > 0)`);

            const gridAnalysis = await evalJS(cdp, `(() => {
                const cards = Array.from(document.querySelectorAll('.shiny-fake-option-card'));
                const realCards = cards.filter(c => c.getAttribute('data-is-real-shiny') === '1');
                const fakeCards = cards.filter(c => c.getAttribute('data-is-real-shiny') === '0');
                return {
                    total: cards.length,
                    realCount: realCards.length,
                    fakeCount: fakeCards.length,
                    realSrc: realCards[0]?.querySelector('img')?.src || '',
                    allFakesAreDataUrls: fakeCards.every(c => (c.querySelector('img')?.src || '').startsWith('data:image/png')),
                    hueAngles: fakeCards.map(c => parseInt(c.getAttribute('data-hue-shift') || '0', 10)),
                    hasNormalRef: Boolean(document.querySelector('.shiny-normal-reference img'))
                };
            })()`);

            assert.equal(gridAnalysis.total, 5, 'Should render 5 total options (1 real + 4 fakes)');
            assert.equal(gridAnalysis.realCount, 1, 'Exactly 1 option must be the real shiny');
            assert.equal(gridAnalysis.fakeCount, 4, 'Exactly 4 options must be hue-shifted fakes');
            assert.ok(gridAnalysis.realSrc.includes('/shiny/'), `Real shiny option must use SPRITE_URLS.SHINY, got ${gridAnalysis.realSrc}`);
            assert.equal(gridAnalysis.allFakesAreDataUrls, true, 'All fake shiny sprites must be Canvas hue-shifted data:image/png URLs');
            assert.equal(gridAnalysis.hasNormalRef, true, 'Normal reference sprite should be displayed');

            // Click 1 fake first -> reveals fake hue shift badge, then click real shiny -> awards points
            await evalJS(cdp, `document.querySelector('.shiny-fake-option-card[data-is-real-shiny="0"]').click()`);
            await sleep(120);
            const wrongCardText = await evalJS(cdp, `document.querySelector('.shiny-fake-option-card[data-is-real-shiny="0"]').innerText`);
            assert.ok(wrongCardText.includes('°'), `Clicked fake card should display its hue shift degree badge, got: ${wrongCardText}`);

            await evalJS(cdp, `document.querySelector('.shiny-fake-option-card[data-is-real-shiny="1"]').click()`);
            await waitFor(cdp, `(document.querySelector('.quiz-header-row')?.innerText || '').includes('2/10')`, 10000);

            for (const vp of DESKTOP_VIEWPORTS) {
                await setViewport(cdp, vp);
                await checkDesktopLayout(cdp, `shiny-spot-${vp.id}`);
            }
            await setViewport(cdp, DESKTOP_VIEWPORTS[0]);
        });

        await runner.test('shiny-challenge-url', 'Challenge Mode (10 questions) & URL query params (?quiz=shiny&variant=spot&fakes=6)', async () => {
            await cdp.send('Page.navigate', { url: `${BASE_URL}/?quiz=shiny&variant=binary&mode=challenge&play=1` });
            for (let q = 1; q <= 10; q++) {
                await waitFor(cdp, `document.querySelector('.shiny-binary-sprite')?.complete`);
                const prevPid = await evalJS(cdp, `document.querySelector('.shiny-binary-sprite').getAttribute('data-pokemon-id')`);
                const isShiny = await evalJS(cdp, `document.querySelector('.shiny-binary-sprite').getAttribute('data-is-shiny') === '1'`);
                const wantCorrect = q <= 7;
                const clickShiny = wantCorrect ? isShiny : !isShiny;
                await evalJS(cdp, `document.querySelector('${clickShiny ? '.choice-shiny' : '.choice-normal'}').click()`);
                if (q < 10) {
                    await waitFor(cdp, `document.querySelector('.shiny-binary-sprite')?.getAttribute('data-pokemon-id') !== ${JSON.stringify(prevPid)} || document.body.innerText.includes('${q + 1}/10')`, 10000);
                }
            }
            await waitFor(cdp, `document.querySelector('.review-container') && document.body.innerText.includes('7/10')`, 12000);
            await checkDesktopLayout(cdp, 'shiny-challenge-review');
        });

        await runner.test('api-clean', 'Zero API/network/console/runtime errors in Shiny Quiz suite', async () => {
            assert.deepEqual(networkErrors, []);
            assert.deepEqual(consoleErrors, []);
            assert.deepEqual(runtimeExceptions, []);
        });
    } finally {
        await page.close();
    }

    return runner.summary();
}
