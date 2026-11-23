import {
    DESKTOP_VIEWPORTS,
    TestRunner,
    checkDesktopLayout,
    createPage,
    navigateHome,
    openGameSettings,
    setViewport,
    waitFor
} from './cdp_helpers.mjs';

export async function runScreenMatrixTests() {
    const runner = new TestRunner('Desktop Screen Matrix (1080p / 1440p / 2160p / Ultra-Wide / macOS)');
    const page = await createPage();
    const { cdp, networkErrors, consoleErrors, runtimeExceptions } = page;

    const games = [
        'Description Quiz',
        'Information Quiz',
        'Sprites Quiz',
        'Quiz Pokedle',
        'Number Quiz'
    ];

    try {
        await runner.test('hub-all-viewports', `Hub renders cleanly across all ${DESKTOP_VIEWPORTS.length} desktop resolutions`, async () => {
            await navigateHome(cdp);
            for (const vp of DESKTOP_VIEWPORTS) {
                await setViewport(cdp, vp);
                await checkDesktopLayout(cdp, `hub-${vp.id}`);
            }
        });

        for (const game of games) {
            await runner.test(`settings-${game}`, `${game} Settings renders cleanly across all ${DESKTOP_VIEWPORTS.length} desktop resolutions`, async () => {
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
        }

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
