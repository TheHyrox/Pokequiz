import assert from 'node:assert/strict';
import {
    BASE_URL,
    DESKTOP_VIEWPORTS,
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

export async function runSudokuQuizTests() {
    const runner = new TestRunner('PokéSudoku Quiz (2x2 to 5x5 Grid, Restrictions, Soft Lock Guard, Single Answers, Dark Mode)');
    const page = await createPage();
    const { cdp, networkErrors, consoleErrors, runtimeExceptions } = page;

    try {
        await runner.test('sudoku-normal-3x3-modal-errors-retry-win', 'Normal Mode (3x3, 10 guesses): modal contains EVERY Pokémon (1025), invalid guess shows red border & allows retry, valid solution wins', async () => {
            await openGameSettings(cdp, 'PokéSudoku');
            await evalJS(cdp, `(() => {
                document.querySelector('input[name="sudokuGameMode"][value="normal"]')?.click();
            })()`);
            await sleep(80);
            await evalJS(cdp, `window.__apiLog = []`);
            await evalJS(cdp, `document.querySelector('.start-button').click()`);
            await waitFor(cdp, `document.querySelectorAll('.sudoku-cell').length === 9`);

            // Extract board payload from API log
            const boardData = await evalJS(cdp, `(() => {
                const call = [...(window.__apiLog || [])].reverse().find(l => l.url.includes('/api/sudoku/board'));
                return call?.data || null;
            })()`);
            assert.ok(boardData, 'Sudoku board API response should be captured');
            assert.equal(boardData.gridSize, 3, 'Normal mode must be 3x3');
            assert.equal(boardData.rowRestrictions.length, 3, 'Must have 3 row restrictions');
            assert.equal(boardData.colRestrictions.length, 3, 'Must have 3 column restrictions');

            // Click cell (0, 0) to open search modal
            await evalJS(cdp, `document.querySelector('.sudoku-cell[data-cell="0-0"]').click()`);
            await waitFor(cdp, `document.querySelector('.sudoku-search-modal')`);

            // Verify the autocomplete component exists and EVERY Pokémon (1025) + alternate forms are loaded
            const namesCount = await evalJS(cdp, `(() => {
                const input = document.querySelector('.sudoku-autocomplete-wrapper input.text-input');
                if (input) input.focus();
                return Object.keys(window.__apiLog.find(l => l.url.includes('/api/pokemon/names/'))?.data || []).length;
            })()`);
            assert.equal(namesCount, 1025, 'Modal must load EVERY Pokémon (1025)');

            const formsCount = await evalJS(cdp, `(() => {
                const forms = window.__apiLog.find(l => l.url.includes('/api/sudoku/forms/'))?.data || [];
                return {
                    count: forms.length,
                    hasMegaCharizardX: forms.some(f => f.id === 10034),
                    hasKyuremBlack: forms.some(f => f.id === 10022),
                    hasNecrozmaDuskMane: forms.some(f => f.id === 10155),
                    hasCharizardGmax: forms.some(f => f.id === 10196)
                };
            })()`);
            assert.ok(formsCount.count > 100, `Expected >100 curated alternate forms, got ${formsCount.count}`);
            assert.equal(formsCount.hasMegaCharizardX, true, 'Mega Charizard X must be selectable');
            assert.equal(formsCount.hasKyuremBlack, true, 'Kyurem Black must be selectable');
            assert.equal(formsCount.hasNecrozmaDuskMane, true, 'Necrozma Dusk Mane must be selectable');
            assert.equal(formsCount.hasCharizardGmax, true, 'Charizard Gigantamax must be selectable');

            // Pick an INVALID Pokémon for cell (0, 0) to test error handling & red border
            const validIds00 = new Set(boardData.cellValidPokemonIds[0][0]);
            let invalidId = 1;
            while (validIds00.has(invalidId) && invalidId < 1025) {
                invalidId++;
            }

            // Type the invalid Pokémon ID into search query and click it in the modal
            await evalJS(cdp, `(() => {
                const input = document.querySelector('.sudoku-autocomplete-wrapper input.text-input');
                input.value = String(${invalidId});
                input.dispatchEvent(new Event('input', { bubbles: true }));
            })()`);
            await sleep(100);
            await evalJS(cdp, `document.querySelector('.sudoku-picker-item[data-pokemon-id="${invalidId}"]').click()`);
            await waitFor(cdp, `!document.querySelector('.sudoku-search-modal')`);

            // Verify cell (0, 0) is filled with the Pokémon name, has a red border (.sudoku-cell-invalid), and guesses left decreased to 9
            const invalidCellState = await evalJS(cdp, `(() => {
                const cell = document.querySelector('.sudoku-cell[data-cell="0-0"]');
                return {
                    isInvalidClass: cell.classList.contains('sudoku-cell-invalid'),
                    dataValid: cell.getAttribute('data-cell-valid'),
                    nameText: cell.querySelector('.sudoku-cell-pokemon-name')?.textContent?.trim() || '',
                    guessesBadge: document.querySelector('.sudoku-guesses-badge')?.textContent?.trim() || ''
                };
            })()`);
            assert.equal(invalidCellState.isInvalidClass, true, 'Invalid cell must have red border class (.sudoku-cell-invalid)');
            assert.equal(invalidCellState.dataValid, 'false', 'data-cell-valid must be false');
            assert.equal(invalidCellState.nameText, '', 'Cell must NOT be filled with the invalid Pokémon');
            assert.ok(invalidCellState.guessesBadge.includes('9'), `Expected 9 guesses left, got: ${invalidCellState.guessesBadge}`);

            // Now retry cell (0, 0) and fill all 9 cells with guaranteedSolutionIds to win in 10 total guesses!
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                    const solId = boardData.guaranteedSolutionIds[r][c];
                    await evalJS(cdp, `document.querySelector('.sudoku-cell[data-cell="${r}-${c}"]').click()`);
                    await waitFor(cdp, `document.querySelector('.sudoku-search-modal')`);
                    await evalJS(cdp, `(() => {
                        const input = document.querySelector('.sudoku-autocomplete-wrapper input.text-input');
                        input.value = String(${solId});
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                    })()`);
                    await waitFor(cdp, `document.querySelector('.sudoku-picker-item[data-pokemon-id="${solId}"]')`);
                    await evalJS(cdp, `document.querySelector('.sudoku-picker-item[data-pokemon-id="${solId}"]').click()`);
                    if (r < 2 || c < 2) {
                        await waitFor(cdp, `document.querySelector('.sudoku-cell[data-cell="${r}-${c}"][data-cell-valid="true"]')`);
                    }
                }
            }

            await waitFor(cdp, `document.querySelector('.modal-content.win')`, 8000);
        });

        await runner.test('sudoku-custom-sizes-2x2-to-5x5-and-single-answer-guard', 'Custom Mode: grouped dropdown restriction selector, 2x2 to 5x5 grids, timer, unlimited guesses, and enforces Single Answers Only', async () => {
            // Test Custom Mode Settings UI: grouped dropdown restriction selector & translated enableTimeLimit
            await openGameSettings(cdp, 'PokéSudoku');
            await evalJS(cdp, `document.querySelector('input[name="sudokuGameMode"][value="custom"]')?.click()`);
            await waitFor(cdp, `document.querySelectorAll('.sudoku-restriction-group').length === 4`);

            const customSettingsCheck = await evalJS(cdp, `(() => {
                const bodyText = document.querySelector('.settings-container')?.innerText || '';
                const groupCount = document.querySelectorAll('.sudoku-restriction-group').length;
                // Open the Region group dropdown
                document.querySelector('.sudoku-restriction-group[data-restriction-group="region"] .sudoku-group-header')?.click();
                return {
                    hasUntranslatedKey: bodyText.includes('enableTimeLimit') || bodyText.includes('timePerQuestion'),
                    groupCount
                };
            })()`);
            assert.equal(customSettingsCheck.hasUntranslatedKey, false, 'enableTimeLimit and timePerQuestion must be properly translated');
            assert.equal(customSettingsCheck.groupCount, 4, 'Should display 4 grouped dropdown menus (Regions, Types, Evolutions, Special Categories)');

            await waitFor(cdp, `document.querySelectorAll('.sudoku-restriction-group[data-restriction-group="region"] .sudoku-restriction-item').length === 10`);

            // Uncheck an individual region (Kanto) and toggle the whole Region group checkbox
            const afterToggleCount = await evalJS(cdp, `(() => {
                const kantoCb = document.querySelector('.sudoku-restriction-item[data-restriction-id="region:kanto"] input[type="checkbox"]');
                kantoCb?.click();
                return document.querySelectorAll('.sudoku-restriction-group[data-restriction-group="region"] .sudoku-restriction-item input[type="checkbox"]:checked').length;
            })()`);
            assert.equal(afterToggleCount, 9, 'Unchecking Kanto should leave 9/10 regions checked');

            // Test 2x2 grid via Settings UI (select 2x2, enable unlimited guesses & timer, and click Start Quiz)
            await evalJS(cdp, `(() => {
                document.querySelector('.sudoku-size-btn[data-grid-size="2"]')?.click();
                const toggles = Array.from(document.querySelectorAll('.toggle-input'));
                if (toggles[0] && !toggles[0].checked) toggles[0].click(); // Unlimited guesses
                if (toggles[1] && !toggles[1].checked) toggles[1].click(); // Enable Timer
            })()`);
            await sleep(80);
            await evalJS(cdp, `window.__apiLog = []`);
            await evalJS(cdp, `document.querySelector('.start-button').click()`);
            await waitFor(cdp, `document.querySelectorAll('.sudoku-cell').length === 4`);

            const hasTimer = await evalJS(cdp, `Boolean(document.querySelector('.timer-display'))`);
            assert.equal(hasTimer, true, 'Timer display should be visible in Custom mode when timer is enabled');

            const boardData = await evalJS(cdp, `(() => {
                const call = [...(window.__apiLog || [])].reverse().find(l => l.url.includes('/api/sudoku/board'));
                return call?.data || null;
            })()`);
            assert.equal(boardData.gridSize, 2, 'Custom grid size 2 should generate a 2x2 board');

            // Place guaranteedSolutionIds[0][0] into cell (0, 0)
            const firstId = boardData.guaranteedSolutionIds[0][0];
            await evalJS(cdp, `document.querySelector('.sudoku-cell[data-cell="0-0"]').click()`);
            await waitFor(cdp, `document.querySelector('.sudoku-search-modal')`);
            await evalJS(cdp, `(() => {
                const input = document.querySelector('.sudoku-autocomplete-wrapper input.text-input');
                input.value = String(${firstId});
                input.dispatchEvent(new Event('input', { bubbles: true }));
            })()`);
            await waitFor(cdp, `document.querySelector('.sudoku-picker-item[data-pokemon-id="${firstId}"]')`);
            await evalJS(cdp, `document.querySelector('.sudoku-picker-item[data-pokemon-id="${firstId}"]').click()`);
            await waitFor(cdp, `document.querySelector('.sudoku-cell[data-cell="0-0"][data-cell-valid="true"]')`);

            // Try to place the SAME Pokémon into cell (0, 1) -> Single Answers guard must block it and keep modal open with error toast
            await evalJS(cdp, `document.querySelector('.sudoku-cell[data-cell="0-1"]').click()`);
            await waitFor(cdp, `document.querySelector('.sudoku-search-modal')`);
            await evalJS(cdp, `(() => {
                const input = document.querySelector('.sudoku-autocomplete-wrapper input.text-input');
                input.value = String(${firstId});
                input.dispatchEvent(new Event('input', { bubbles: true }));
            })()`);
            await waitFor(cdp, `document.querySelector('.sudoku-picker-item[data-pokemon-id="${firstId}"]')`);
            await evalJS(cdp, `document.querySelector('.sudoku-picker-item[data-pokemon-id="${firstId}"]').click()`);
            await sleep(150);

            const cell01State = await evalJS(cdp, `document.querySelector('.sudoku-cell[data-cell="0-1"]').getAttribute('data-cell-valid')`);
            assert.equal(cell01State, 'empty', 'Duplicate Pokémon must be blocked when Single Answers Only is enabled');
            await evalJS(cdp, `document.querySelector('.sudoku-modal-close').click()`);

            // Test 5x5 grid layout across all desktop viewports via Settings UI
            await openGameSettings(cdp, 'PokéSudoku');
            await evalJS(cdp, `document.querySelector('input[name="sudokuGameMode"][value="custom"]')?.click()`);
            await waitFor(cdp, `document.querySelector('.sudoku-size-btn[data-grid-size="5"]')`);
            await evalJS(cdp, `document.querySelector('.sudoku-size-btn[data-grid-size="5"]').click()`);
            await sleep(80);
            await evalJS(cdp, `document.querySelector('.start-button').click()`);
            await waitFor(cdp, `document.querySelectorAll('.sudoku-cell').length === 25`);

            for (const vp of DESKTOP_VIEWPORTS) {
                await setViewport(cdp, vp);
                await checkDesktopLayout(cdp, `sudoku-5x5-${vp.id}`);
            }
            await setViewport(cdp, DESKTOP_VIEWPORTS[0]);
        });

        await runner.test('sudoku-daily-mode-and-dark-mode', 'Daily Mode (3x3, seeded, 10 guesses) & Dark Mode styling verification', async () => {
            await navigateHome(cdp);
            await evalJS(cdp, `localStorage.clear()`);

            // Enable dark mode
            await evalJS(cdp, `(() => {
                if (!document.documentElement.classList.contains('dark')) {
                    document.querySelector('.theme-toggle-btn:not(.personal-stats-btn)')?.click();
                }
            })()`);
            await sleep(100);
            const isDark = await evalJS(cdp, `document.documentElement.classList.contains('dark')`);
            assert.equal(isDark, true, 'Dark mode should be active');

            // Start Daily Sudoku from Hub banner
            await evalJS(cdp, `window.__apiLog = []`);
            await evalJS(cdp, `document.querySelector('.daily-sudoku-btn').click()`);
            await waitFor(cdp, `document.querySelectorAll('.sudoku-cell').length === 9`);

            const dailyBoard1 = await evalJS(cdp, `(() => {
                const call = [...(window.__apiLog || [])].reverse().find(l => l.url.includes('/api/sudoku/board'));
                return call?.data || null;
            })()`);
            assert.equal(dailyBoard1.gridSize, 3, 'Daily Sudoku must be 3x3');

            // Verify dark mode styles on Sudoku cells & headers
            const darkStyles = await evalJS(cdp, `(() => {
                const cell = document.querySelector('.sudoku-cell-empty');
                const header = document.querySelector('.sudoku-col-header');
                return {
                    cellBg: getComputedStyle(cell).backgroundColor,
                    headerBg: getComputedStyle(header).backgroundColor
                };
            })()`);
            assert.notEqual(darkStyles.cellBg, 'rgb(255, 255, 255)', `Sudoku cell should use dark background in dark mode, got ${darkStyles.cellBg}`);
            assert.notEqual(darkStyles.headerBg, 'rgb(255, 255, 255)', `Sudoku header should use dark background in dark mode, got ${darkStyles.headerBg}`);

            // Re-open Daily Sudoku and verify deterministic seed produces identical restrictions
            await navigateHome(cdp);
            await evalJS(cdp, `window.__apiLog = []`);
            await evalJS(cdp, `document.querySelector('.daily-sudoku-btn').click()`);
            await waitFor(cdp, `document.querySelectorAll('.sudoku-cell').length === 9 && (window.__apiLog || []).some(l => l.url.includes('/api/sudoku/board'))`);
            const dailyBoard2 = await evalJS(cdp, `(() => {
                const call = [...(window.__apiLog || [])].reverse().find(l => l.url.includes('/api/sudoku/board'));
                return call?.data || null;
            })()`);
            assert.deepEqual(
                dailyBoard1.rowRestrictions.map(r => r.id),
                dailyBoard2.rowRestrictions.map(r => r.id),
                'Daily Sudoku must deterministically generate the exact same row restrictions'
            );
            assert.deepEqual(
                dailyBoard1.colRestrictions.map(r => r.id),
                dailyBoard2.colRestrictions.map(r => r.id),
                'Daily Sudoku must deterministically generate the exact same column restrictions'
            );

            // Reset dark mode back to light mode
            await evalJS(cdp, `localStorage.clear()`);
        });

        await runner.test('api-clean', 'Zero API/network/console/runtime errors in PokéSudoku Quiz suite', async () => {
            assert.deepEqual(networkErrors, []);
            assert.deepEqual(consoleErrors, []);
            assert.deepEqual(runtimeExceptions, []);
        });
    } finally {
        await page.close();
    }

    return runner.summary();
}
