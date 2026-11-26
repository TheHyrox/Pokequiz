import assert from 'node:assert/strict';
import {
    DESKTOP_VIEWPORTS,
    MOBILE_VIEWPORTS,
    TestRunner,
    checkDesktopLayout,
    createPage,
    evalJS,
    navigateHome,
    openGameSettings,
    setViewport,
    sleep,
    waitFor
} from './cdp_helpers.mjs';

export async function runScreenMatrixTests() {
    const runner = new TestRunner('Desktop & Mobile Screen Matrix (Desktop / Ultra-Wide / macOS / iOS / Android)');
    const page = await createPage();
    const { cdp, networkErrors, consoleErrors, runtimeExceptions } = page;

    const games = [
        'Description Quiz',
        'Information Quiz',
        'Sprites Quiz',
        'Zoomed Sprite Quiz',
        'Shiny Quiz',
        'Quiz Pokedle',
        'Number Quiz',
        'PokéSudoku'
    ];

    try {
        await runner.test('hub-all-viewports', `Hub renders cleanly across all ${DESKTOP_VIEWPORTS.length} desktop resolutions`, async () => {
            await navigateHome(cdp);
            for (const vp of DESKTOP_VIEWPORTS) {
                await setViewport(cdp, vp);
                await checkDesktopLayout(cdp, `hub-${vp.id}`);
            }
        });

        await runner.test('hub-mobile-viewports', `Hub renders cleanly with zero horizontal overflow across all ${MOBILE_VIEWPORTS.length} mobile & tablet viewports`, async () => {
            await navigateHome(cdp);
            for (const vp of MOBILE_VIEWPORTS) {
                await setViewport(cdp, vp);
                await checkDesktopLayout(cdp, `hub-mobile-${vp.id}`);
                // Ensure top controls do not overlap the main title text on mobile
                const noTitleOverlap = await evalJS(cdp, `(() => {
                    const topBar = document.querySelector('.top-controls-bar');
                    const h1 = document.querySelector('h1');
                    if (!topBar || !h1) return true;
                    const rBar = topBar.getBoundingClientRect();
                    const range = document.createRange();
                    range.selectNodeContents(h1);
                    const rText = range.getBoundingClientRect();
                    return rText.top >= rBar.bottom - 4 || rText.right <= rBar.left + 4;
                })()`);
                assert.equal(noTitleOverlap, true, `[hub-mobile-${vp.id}] Top controls overlapped main title`);
            }
        });

        for (const game of games) {
            await runner.test(`settings-${game}`, `${game} Settings renders cleanly across all ${DESKTOP_VIEWPORTS.length} desktop resolutions`, async () => {
                await setViewport(cdp, DESKTOP_VIEWPORTS[0]);
                await openGameSettings(cdp, game);
                for (const vp of DESKTOP_VIEWPORTS) {
                    await setViewport(cdp, vp);
                    await checkDesktopLayout(cdp, `settings-${game}-${vp.id}`);
                    if (game !== 'Quiz Pokedle') {
                        await waitFor(cdp, `(() => {
                            const cols = document.querySelectorAll('.settings-column');
                            if (cols.length < 2) return true;
                            const r0 = cols[0].getBoundingClientRect();
                            const r1 = cols[1].getBoundingClientRect();
                            return r1.left > r0.left;
                        })()`);
                    }
                }
            });

            await runner.test(`mobile-settings-and-play-${game}`, `${game} Settings & Active Quiz render cleanly on mobile viewports`, async () => {
                await setViewport(cdp, MOBILE_VIEWPORTS[1]); // iPhone 14 (390x844)
                await openGameSettings(cdp, game);

                for (const vp of MOBILE_VIEWPORTS) {
                    await setViewport(cdp, vp);
                    await checkDesktopLayout(cdp, `mobile-settings-${game}-${vp.id}`);
                    if (vp.width < 768) {
                        // On mobile phones (< 768px), the 2 settings columns must stack vertically
                        const stacked = await evalJS(cdp, `(() => {
                            const cols = document.querySelectorAll('.settings-column');
                            if (cols.length < 2) return true;
                            const r0 = cols[0].getBoundingClientRect();
                            const r1 = cols[1].getBoundingClientRect();
                            return r1.top >= r0.bottom - 2;
                        })()`);
                        assert.equal(stacked, true, `[mobile-settings-${game}-${vp.id}] Settings columns did not stack vertically on mobile`);
                    }
                }

                // Start the quiz on mobile (iPhone SE 375x667) and verify active gameplay layout has zero horizontal overflow
                await setViewport(cdp, MOBILE_VIEWPORTS[0]);
                await evalJS(cdp, `document.querySelector('.start-button')?.click()`);
                await sleep(400);
                await waitFor(cdp, `!document.querySelector('.settings-container')`);
                await sleep(300);
                await checkDesktopLayout(cdp, `mobile-active-quiz-${game}`);
            });
        }

        await runner.test('mobile-modals', 'Personal Stats Modal renders cleanly on mobile viewports without overflow', async () => {
            await setViewport(cdp, MOBILE_VIEWPORTS[0]); // iPhone SE (375x667)
            await navigateHome(cdp);
            await evalJS(cdp, `document.querySelector('.personal-stats-btn')?.click()`);
            await waitFor(cdp, `document.querySelector('.stats-modal-content')`);
            await checkDesktopLayout(cdp, 'mobile-personal-stats-modal');
            await evalJS(cdp, `document.querySelector('.stats-modal-overlay button[aria-label]')?.click()`);
        });

        await runner.test('api-clean', 'Zero API/network/console/runtime errors across all screen renders', async () => {
            if (networkErrors.length > 0) throw new Error(`Network errors: ${JSON.stringify(networkErrors)}`);
            if (consoleErrors.length > 0) throw new Error(`Console errors: ${JSON.stringify(consoleErrors)}`);
            if (runtimeExceptions.length > 0) throw new Error(`Runtime exceptions: ${JSON.stringify(runtimeExceptions)}`);
        });
    } finally {
        await page.close();
    }

    return runner.summary();
}
