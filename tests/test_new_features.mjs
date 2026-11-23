import assert from 'node:assert/strict';
import {
    BASE_URL,
    DESKTOP_VIEWPORTS,
    TestRunner,
    checkDesktopLayout,
    createPage,
    evalJS,
    getPokemonNameById,
    navigateHome,
    openGameSettings,
    setViewport,
    sleep,
    waitFor
} from './cdp_helpers.mjs';

export async function runNewFunctionalityTests() {
    const runner = new TestRunner('New Functionality (Stats, Daily Seeded RNG, URL Share Params, Pokédex Mini-Card, Shortcuts)');
    const page = await createPage();
    const { cdp, networkErrors, consoleErrors, runtimeExceptions } = page;

    try {
        // ============================================================
        // 1. CLIENT-SIDE PERSONAL STATS & STREAKS (LOCAL STORAGE)
        // ============================================================
        await runner.test('stats-1', 'Personal Stats modal opens from Hub, tracks games/scores/streaks/avg guesses, and resets cleanly', async () => {
            await navigateHome(cdp);
            await evalJS(cdp, `localStorage.clear()`);

            // Play a fast Pokedle game to record a win in 1 guess
            await openGameSettings(cdp, 'Quiz Pokedle');
            await evalJS(cdp, `document.querySelector('.start-button').click()`);
            await waitFor(cdp, `document.querySelector('input[type="text"]')`);

            // Find the target Pokemon from the API call in window.__apiLog
            const targetInfo = await evalJS(cdp, `(() => {
                const call = [...(window.__apiLog || [])].reverse().find(l => /\\/api\\/pokemon\\/\\d+\\/\\d+$/.test(l.url));
                return call?.data ? { id: call.data.id, name: call.data.name } : null;
            })()`);
            assert.ok(targetInfo?.name, 'Pokedle target Pokemon should be loaded');

            // Guess exact target on first try
            await evalJS(cdp, `(() => {
                const input = document.querySelector('input[type="text"]');
                input.focus();
                input.value = ${JSON.stringify(targetInfo.name)};
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
            })()`);
            await waitFor(cdp, `document.querySelector('.modal-content.win')`, 10000);

            // Verify localStorage has pokequiz_personal_stats recorded
            const rawStats = await evalJS(cdp, `JSON.parse(localStorage.getItem('pokequiz_personal_stats') || '{}')`);
            assert.equal(rawStats.modes?.['pokedle:wordle']?.totalGamesPlayed, 1, 'Total games played should be 1');
            assert.equal(rawStats.modes?.['pokedle:wordle']?.bestScore, 1, 'Best score (fewest guesses) should be 1');
            assert.equal(rawStats.modes?.['pokedle:wordle']?.longestStreak, 1, 'Longest streak should be 1');
            assert.equal(rawStats.modes?.['pokedle:wordle']?.totalGuessesInWins, 1, 'Total guesses in wins should be 1');

            // Return home and open Personal Stats modal
            await navigateHome(cdp);
            await evalJS(cdp, `document.querySelector('.personal-stats-btn').click()`);
            await waitFor(cdp, `document.querySelector('.stats-modal-content')`);

            const statsSummary = await evalJS(cdp, `({
                games: document.querySelector('.stats-global-games')?.textContent?.trim(),
                streak: document.querySelector('.stats-global-streak')?.textContent?.trim(),
                avg: document.querySelector('.stats-pokedle-avg')?.textContent?.trim()
            })`);
            assert.equal(statsSummary.games, '1');
            assert.equal(statsSummary.streak, '1');
            assert.equal(statsSummary.avg, '1.0');

            // Check layout across viewports while stats modal is open
            await checkDesktopLayout(cdp, 'personal-stats-modal');

            // Click Reset Stats (2-step confirmation)
            await evalJS(cdp, `document.querySelector('.reset-stats-btn').click()`);
            await sleep(80);
            await evalJS(cdp, `document.querySelector('.reset-stats-btn').click()`);
            await sleep(100);

            const afterResetGames = await evalJS(cdp, `document.querySelector('.stats-global-games')?.textContent?.trim()`);
            assert.equal(afterResetGames, '0', 'Stats should reset to 0');
            const storageAfterReset = await evalJS(cdp, `localStorage.getItem('pokequiz_personal_stats')`);
            assert.equal(storageAfterReset, null, 'localStorage key should be cleared after reset');
        });

        // ============================================================
        // 2. DAILY CHALLENGE (SEEDED RNG, NO RETRY, VIEW RUN, CLEARED DAILY)
        // ============================================================
        await runner.test('daily-seeded-rng', 'Daily Challenge uses YYYY-MM-DD deterministic PRNG seed, blocks retries, visualizes completed run, and prunes old days', async () => {
            await navigateHome(cdp);
            await evalJS(cdp, `localStorage.clear()`);

            // Test 1: Pokedle Daily Challenge twice -> same target Pokemon ID
            await navigateHome(cdp);
            await evalJS(cdp, `window.__apiLog = []`);
            await evalJS(cdp, `document.querySelector('.daily-pokedle-btn').click()`);
            await waitFor(cdp, `document.querySelector('input[type="text"]')`);
            await waitFor(cdp, `(window.__apiLog || []).some(l => /\\/api\\/pokemon\\/\\d+\\/\\d+$/.test(l.url))`);
            const pokedleDailyTarget = await evalJS(cdp, `(() => {
                const call = [...window.__apiLog].reverse().find(l => /\\/api\\/pokemon\\/\\d+\\/\\d+$/.test(l.url));
                return call?.data ? { id: call.data.id, name: call.data.name } : null;
            })()`);
            const pokedleDailyId1 = pokedleDailyTarget?.id;
            assert.ok(pokedleDailyId1 >= 1 && pokedleDailyId1 <= 1025, `Valid Pokedle daily ID: ${pokedleDailyId1}`);

            // Restart Pokedle Daily Challenge before making a guess and verify identical Pokemon ID
            await navigateHome(cdp);
            await evalJS(cdp, `window.__apiLog = []`);
            await evalJS(cdp, `document.querySelector('.daily-pokedle-btn').click()`);
            await waitFor(cdp, `document.querySelector('input[type="text"]')`);
            await waitFor(cdp, `(window.__apiLog || []).some(l => /\\/api\\/pokemon\\/\\d+\\/\\d+$/.test(l.url))`);
            const pokedleDailyId2 = await evalJS(cdp, `(() => {
                const call = [...window.__apiLog].reverse().find(l => /\\/api\\/pokemon\\/\\d+\\/\\d+$/.test(l.url));
                return call?.data?.id;
            })()`);
            assert.equal(pokedleDailyId1, pokedleDailyId2, 'Pokedle Daily Challenge must deterministically pick the same Pokemon');

            // Complete the Pokedle Daily Challenge by guessing the target Pokemon
            await evalJS(cdp, `(() => {
                const input = document.querySelector('input[type="text"]');
                input.focus();
                input.value = ${JSON.stringify(pokedleDailyTarget.name)};
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
            })()`);
            await waitFor(cdp, `document.querySelector('.modal-content.win')`, 10000);

            // Verify Retry button is replaced by View Run button in Daily Challenge End Modal
            const hasRetryBtn = await evalJS(cdp, `Boolean(document.querySelector('.modal-content .retry-btn'))`);
            const hasViewRunBtn = await evalJS(cdp, `Boolean(document.querySelector('.modal-content .view-run-btn'))`);
            assert.equal(hasRetryBtn, false, 'Daily Challenge end modal must not allow Retry');
            assert.equal(hasViewRunBtn, true, 'Daily Challenge end modal must show View Run button');

            // Click View Run button -> closes modal, input is disabled, and daily run summary is shown
            await evalJS(cdp, `document.querySelector('.modal-content .view-run-btn').click()`);
            await sleep(100);
            const runViewState1 = await evalJS(cdp, `({
                inputDisabled: document.querySelector('input[type="text"]')?.disabled,
                guessRows: document.querySelectorAll('table tbody tr').length,
                hasSummaryBanner: Boolean(document.querySelector('.daily-run-summary'))
            })`);
            assert.equal(runViewState1.inputDisabled, true, 'Input must be disabled after completing daily challenge');
            assert.equal(runViewState1.guessRows, 1, 'Completed guess row must be visible');
            assert.equal(runViewState1.hasSummaryBanner, true, 'Daily completed summary banner must be visible');

            // Navigate back to Hub and re-open Pokedle Daily Challenge -> must restore and visualize our run (no retry!)
            await navigateHome(cdp);
            await evalJS(cdp, `document.querySelector('.daily-pokedle-btn').click()`);
            await waitFor(cdp, `document.querySelector('.daily-run-summary')`);
            const runViewState2 = await evalJS(cdp, `({
                inputDisabled: document.querySelector('input[type="text"]')?.disabled,
                guessRows: document.querySelectorAll('table tbody tr').length
            })`);
            assert.equal(runViewState2.inputDisabled, true, 'Re-opening completed daily challenge must keep input disabled');
            assert.equal(runViewState2.guessRows, 1, 'Re-opening completed daily challenge must restore previous guesses');

            // Clicking the return button in Daily Quiz Pokedle must return to the home menu (hub), not settings
            await evalJS(cdp, `document.querySelector('.pokedle-back-btn').click()`);
            await waitFor(cdp, `document.querySelectorAll('.game-card').length >= 5`);
            const onSettings = await evalJS(cdp, `Boolean(document.querySelector('.settings-container'))`);
            assert.equal(onSettings, false, 'Daily Quiz Pokedle back button must return to home menu, not settings');

            // Verify automatic daily cleanup of old days' dailyChallenges records
            await evalJS(cdp, `(() => {
                const store = JSON.parse(localStorage.getItem('pokequiz_personal_stats') || '{}');
                store.dailyChallenges = store.dailyChallenges || {};
                store.dailyChallenges['pokedle:1999-01-01'] = {
                    date: '1999-01-01',
                    quiz: 'pokedle',
                    completed: true,
                    score: 3
                };
                localStorage.setItem('pokequiz_personal_stats', JSON.stringify(store));
            })()`);
            await navigateHome(cdp);
            const hasExpiredDaily = await evalJS(cdp, `(() => {
                const store = JSON.parse(localStorage.getItem('pokequiz_personal_stats') || '{}');
                return Boolean(store.dailyChallenges?.['pokedle:1999-01-01']);
            })()`);
            assert.equal(hasExpiredDaily, false, 'Expired daily challenge records from previous days must be automatically cleared');

            // Test 2: Number Quiz Daily Challenge twice -> same target Pokemon ID
            await navigateHome(cdp);
            await evalJS(cdp, `document.querySelector('.daily-number-btn').click()`);
            await waitFor(cdp, `document.querySelector('.sprite-img')?.complete`);
            const numberDailyId1 = await evalJS(cdp, `parseInt(document.querySelector('.sprite-img').src.match(/\\/(\\d+)\\.png/)[1], 10)`);

            await navigateHome(cdp);
            await evalJS(cdp, `document.querySelector('.daily-number-btn').click()`);
            await waitFor(cdp, `document.querySelector('.sprite-img')?.complete`);
            const numberDailyId2 = await evalJS(cdp, `parseInt(document.querySelector('.sprite-img').src.match(/\\/(\\d+)\\.png/)[1], 10)`);
            assert.equal(numberDailyId1, numberDailyId2, 'Number Quiz Daily Challenge must deterministically pick the same Pokemon');

            // Test 3: Description Quiz Daily Challenge twice -> same target Pokemon ID
            await navigateHome(cdp);
            await evalJS(cdp, `window.__apiLog = []`);
            await evalJS(cdp, `document.querySelector('.daily-description-btn').click()`);
            await waitFor(cdp, `document.querySelectorAll('.pokemon-grid-item').length === 4`);
            const descDailyId1 = await evalJS(cdp, `(() => {
                const call = [...window.__apiLog].reverse().find(l => l.url.includes('/description/'));
                const m = call?.url?.match(/\\/api\\/pokemon\\/(\\d+)\\/description/);
                return m ? parseInt(m[1], 10) : null;
            })()`);

            await navigateHome(cdp);
            await evalJS(cdp, `window.__apiLog = []`);
            await evalJS(cdp, `document.querySelector('.daily-description-btn').click()`);
            await waitFor(cdp, `document.querySelectorAll('.pokemon-grid-item').length === 4`);
            const descDailyId2 = await evalJS(cdp, `(() => {
                const call = [...window.__apiLog].reverse().find(l => l.url.includes('/description/'));
                const m = call?.url?.match(/\\/api\\/pokemon\\/(\\d+)\\/description/);
                return m ? parseInt(m[1], 10) : null;
            })()`);
            assert.equal(descDailyId1, descDailyId2, 'Description Daily Challenge must deterministically pick the same Pokemon');
        });

        // ============================================================
        // 3. SHAREABLE QUIZ SETTINGS VIA URL QUERY PARAMS
        // ============================================================
        await runner.test('url-share-params', 'Encodes and decodes URL query params (?quiz=sprites&gen=1,2&silhouette=1&hardcore=1)', async () => {
            const customUrl = `${BASE_URL}/?quiz=sprites&gen=1,2&silhouette=1&hardcore=1`;
            await cdp.send('Page.navigate', { url: customUrl });
            await waitFor(cdp, `document.querySelector('.settings-container')`);

            // Verify settings UI reflects gen=1,2, silhouette=1, hardcore=1
            const settingsState = await evalJS(cdp, `(() => {
                const hardcoreChecked = document.querySelector('input[name="gameMode"][value="hardcore"]')?.checked;
                const genCheckboxes = Array.from(document.querySelectorAll('.generation-checkbox input[type="checkbox"]'));
                const checkedGens = genCheckboxes.map((cb, idx) => cb.checked ? idx + 1 : null).filter(Boolean);
                const effectCheckboxes = Array.from(document.querySelectorAll('.sprite-effects-selector input[type="checkbox"]'));
                const silhouetteChecked = effectCheckboxes[2]?.checked;
                return { hardcoreChecked, checkedGens, silhouetteChecked };
            })()`);

            assert.equal(settingsState.hardcoreChecked, true, 'Hardcore mode should be selected from URL param hardcore=1');
            assert.deepEqual(settingsState.checkedGens, [1, 2], 'Generations 1 and 2 should be selected from gen=1,2');
            assert.equal(settingsState.silhouetteChecked, true, 'Silhouette should be enabled from silhouette=1');

            // Click Share Settings button and verify URL query string is updated
            await evalJS(cdp, `document.querySelector('.share-settings-btn').click()`);
            await sleep(100);
            const currentSearch = await evalJS(cdp, `window.location.search`);
            assert.ok(currentSearch.includes('quiz=sprites'), `Expected quiz=sprites in search: ${currentSearch}`);
            assert.ok(currentSearch.includes('gen=1%2C2') || currentSearch.includes('gen=1,2'), `Expected gen=1,2 in search: ${currentSearch}`);
            assert.ok(currentSearch.includes('silhouette=1'), `Expected silhouette=1 in search: ${currentSearch}`);
            assert.ok(currentSearch.includes('hardcore=1'), `Expected hardcore=1 in search: ${currentSearch}`);
        });

        // ============================================================
        // 4. POST-ROUND "POKÉDEX MINI-CARD" (TYPES, STATS, DESC, SHINY TOGGLE)
        // ============================================================
        await runner.test('pokedex-minicard', 'Clicking a Pokémon on round end or review screen opens Pokédex Mini-Card with types, stats, description & shiny toggle', async () => {
            // Start Number Quiz in Normal mode and win immediately to open QuizEndModal
            await openGameSettings(cdp, 'Number Quiz');
            await evalJS(cdp, `document.querySelector('input[name="numberSubMode"][value="normal"]')?.click()`);
            await evalJS(cdp, `document.querySelector('.start-button').click()`);
            await waitFor(cdp, `document.querySelector('.sprite-img')?.complete`);

            const targetId = await evalJS(cdp, `parseInt(document.querySelector('.sprite-img').src.match(/\\/(\\d+)\\.png/)[1], 10)`);
            await evalJS(cdp, `(() => {
                const input = document.querySelector('.number-input');
                input.value = String(${targetId});
                input.dispatchEvent(new Event('input', { bubbles: true }));
            })()`);
            await sleep(50);
            await evalJS(cdp, `document.querySelector('.submit-btn').click()`);
            await waitFor(cdp, `document.querySelector('.modal-content.win .answer-card')`);

            // Click the Pokémon answer card in QuizEndModal to open the Pokédex Mini-Card
            await evalJS(cdp, `document.querySelector('.modal-content.win .answer-card').click()`);
            await waitFor(cdp, `document.querySelector('.pokedex-minicard')`);
            await waitFor(cdp, `!document.querySelector('.pokedex-minicard').innerText.includes('Loading...')`);

            const miniCardState = await evalJS(cdp, `(() => {
                const card = document.querySelector('.pokedex-minicard');
                const sprite = card.querySelector('.pokedex-minicard-sprite');
                const desc = card.querySelector('.pokedex-minicard-description')?.innerText || '';
                return {
                    text: card.innerText,
                    normalSrc: sprite?.src || '',
                    hasDesc: desc.length > 5
                };
            })()`);

            assert.ok(miniCardState.text.includes(`#${String(targetId).padStart(4, '0')}`), 'Mini-card should show Pokédex ID');
            assert.ok(miniCardState.text.includes('HP') && miniCardState.text.includes('ATK'), 'Mini-card should display base stats');
            assert.equal(miniCardState.hasDesc, true, 'Mini-card should display localized Pokédex description');
            assert.ok(!miniCardState.normalSrc.includes('/shiny/'), 'Initial sprite should be normal');

            // Toggle Shiny sprite
            await evalJS(cdp, `document.querySelector('.shiny-toggle-shiny').click()`);
            await sleep(100);
            const shinySrc = await evalJS(cdp, `document.querySelector('.pokedex-minicard-sprite')?.src || ''`);
            assert.ok(shinySrc.includes('/shiny/'), `Expected shiny sprite URL after toggle, got: ${shinySrc}`);

            // Toggle back to Normal sprite
            await evalJS(cdp, `document.querySelector('.shiny-toggle-normal').click()`);
            await sleep(100);
            const backToNormalSrc = await evalJS(cdp, `document.querySelector('.pokedex-minicard-sprite')?.src || ''`);
            assert.ok(!backToNormalSrc.includes('/shiny/'), 'Should switch back to normal sprite');

            await checkDesktopLayout(cdp, 'pokedex-minicard-open');
        });

        // ============================================================
        // 5. KEYBOARD SHORTCUTS & ACCESSIBILITY (ENTER & SPACE)
        // ============================================================
        await runner.test('keyboard-shortcuts', 'Space reveals hint / switches description, Enter advances to next round', async () => {
            // Test Space in Information Quiz Normal mode -> reveals next hint
            await openGameSettings(cdp, 'Information Quiz');
            await evalJS(cdp, `document.querySelector('input[type="radio"][value="normal"]')?.click()`);
            await evalJS(cdp, `document.querySelector('.start-button').click()`);
            await waitFor(cdp, `document.querySelectorAll('.hint-item').length >= 1`);

            const initialHints = await evalJS(cdp, `document.querySelectorAll('.hint-item').length`);
            await evalJS(cdp, `window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))`);
            await sleep(150);
            const afterSpaceHints = await evalJS(cdp, `document.querySelectorAll('.hint-item').length`);
            assert.equal(afterSpaceHints, initialHints + 1, 'Pressing Space in Information Quiz Normal mode should reveal a hint');

            // Test Enter in Number Quiz Points mode after round reveal -> advances to Round 2
            await openGameSettings(cdp, 'Number Quiz');
            await evalJS(cdp, `document.querySelector('input[name="numberSubMode"][value="points"]')?.click()`);
            await evalJS(cdp, `document.querySelector('.start-button').click()`);
            await waitFor(cdp, `document.querySelector('.number-input')`);

            // Submit guess 25 via Enter on input
            await evalJS(cdp, `(() => {
                const input = document.querySelector('.number-input');
                input.focus();
                input.value = '25';
                input.dispatchEvent(new Event('input', { bubbles: true }));
            })()`);
            await sleep(50);
            await evalJS(cdp, `(() => {
                const input = document.querySelector('.number-input');
                input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
            })()`);
            await waitFor(cdp, `document.querySelector('.next-round-btn')`);

            // Press Enter globally to advance to Round 2
            await evalJS(cdp, `window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))`);
            await waitFor(cdp, `document.querySelector('.number-input')`);
            const headerSubtitle = await evalJS(cdp, `document.querySelector('.quiz-header-row')?.innerText || ''`);
            assert.ok(headerSubtitle.includes('2/10'), `Expected Question 2/10 after Enter shortcut, got: ${headerSubtitle}`);
        });

        await runner.test('api-clean', 'Zero API/network/console/runtime errors in New Functionality suite', async () => {
            assert.deepEqual(networkErrors, []);
            assert.deepEqual(consoleErrors, []);
            assert.deepEqual(runtimeExceptions, []);
        });
    } finally {
        await page.close();
    }

    return runner.summary();
}
