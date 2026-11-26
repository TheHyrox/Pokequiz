<script lang="ts">
    /**
     * @brief PokéSudoku Quiz Game Component
     * @description Renders a 2x2 to 5x5 grid with row & column restrictions.
     *              - Clicking a cell opens SudokuPokemonSearchModal containing EVERY Pokémon.
     *              - Clicking a Pokémon validates it and fills the cell with the Pokémon name.
     *              - If the Pokémon doesn't respect restrictions, a red border appears around the cell
     *                and the user can retry.
     *              - Supports Soft Lock Guard (prevents valid picks that would leave the remaining grid unsolvable),
     *                Single Answers Only (unique Pokémon across the grid), Unlimited Guesses, and Timer.
     */
    import { onMount, onDestroy } from 'svelte';
    import QuizHeader from '../components/quiz/QuizHeader.svelte';
    import TimerDisplay from '../components/quiz/TimerDisplay.svelte';
    import QuizEndModal from '../components/quiz/QuizEndModal.svelte';
    import PokedexMiniCardModal from '../components/quiz/PokedexMiniCardModal.svelte';
    import SudokuGrid from '../components/quiz/SudokuGrid.svelte';
    import SudokuPokemonSearchModal from '../components/quiz/SudokuPokemonSearchModal.svelte';
    import Toast from '../components/Toast.svelte';
    import { getLabel, type LabelKey } from './lib/translations';
    import { createToastHandlers } from './lib/toastUtils';
    import { getTodayDateString } from '../../shared/utils/seededRng';
    import { preloadPokemonNames, getAllPokemonNamesSync, getPokemonNameSync } from './lib/pokemonNamesClient';
    import {
        saveSudokuSettings,
        recordQuizGameResult,
        getDailyChallengeStatus,
        saveDailyChallengeRun
    } from './lib/storage';
    import type {
        SudokuQuizSettings,
        SudokuBoardPayload,
        SudokuCellState,
        SudokuGridSize,
        ToastState,
        PokemonOption
    } from '../../shared/types';

    export let settings: SudokuQuizSettings;
    export let onBackToHub: () => void;
    export let onBackToSettings: () => void;
    export let languageCode: string = 'en';
    export let languageId: number = 9;

    let board: SudokuBoardPayload | null = null;
    let cells: SudokuCellState[][] = [];
    let allPokemonList: Array<{ id: number; name: string }> = [];
    let isLoading: boolean = true;
    let isGameOver: boolean = false;
    let hasWon: boolean = false;
    let showEndModal: boolean = false;
    let guessesUsed: number = 0;

    // Active cell modal state
    let activeCellModal: { row: number; col: number } | null = null;
    let selectedPokedexPokemon: { id: number; name: string } | null = null;

    // Timer state
    let timeRemaining: number = settings.timeLimit || 180;
    let timerInterval: ReturnType<typeof setInterval> | null = null;

    $: isDailyMode = Boolean(settings.isDailyChallenge || settings.gameMode === 'daily');
    $: dailySeedStr = settings.dailySeed || getTodayDateString();
    $: effectiveGridSize = (isDailyMode || settings.gameMode === 'normal' ? 3 : settings.gridSize) as SudokuGridSize;
    $: totalCells = effectiveGridSize * effectiveGridSize;
    $: filledValidCellsCount = cells.reduce(
        (sum, row) => sum + row.filter(c => c.isValid === true).length,
        0
    );
    $: usedPokemonIds = new Set<number>(
        cells.flatMap(row => row.filter(c => c.isValid === true && c.pokemonId !== null).map(c => c.pokemonId as number))
    );

    let toastState: ToastState = {
        message: '',
        type: 'info',
        show: false
    };

    const { showErrorToast, showSuccessToast } = createToastHandlers((state: ToastState) => {
        toastState = state;
    });

    function l(key: LabelKey): string {
        return getLabel(languageCode, key);
    }

    function stopTimer(): void {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    function startTimer(): void {
        stopTimer();
        if (!settings.hasTimeLimit || isDailyMode || settings.gameMode === 'normal') return;
        timeRemaining = settings.timeLimit || 180;
        timerInterval = setInterval(() => {
            if (isGameOver) {
                stopTimer();
                return;
            }
            timeRemaining -= 1;
            if (timeRemaining <= 0) {
                timeRemaining = 0;
                stopTimer();
                finishGame(false);
            }
        }, 1000);
    }

    onDestroy(() => {
        stopTimer();
    });

    /**
     * @brief Client-side backtracking solver to verify if placing `candidatePokemonId` at `(targetRow, targetCol)`
     *        leaves a valid disjoint assignment for all remaining unfilled/invalid cells (Soft Lock Guard).
     */
    function canCompleteRemainingGrid(targetRow: number, targetCol: number, candidatePokemonId: number): boolean {
        if (!board) return true;
        const n = board.gridSize;
        const requireUnique = settings.uniquePokemonOnly;
        if (!requireUnique) return true;

        const usedIds = new Set<number>([candidatePokemonId]);
        const remainingCells: Array<{ r: number; c: number; candidates: number[] }> = [];

        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
                if (r === targetRow && c === targetCol) continue;
                const cell = cells[r]?.[c];
                if (cell && cell.isValid === true && cell.pokemonId !== null) {
                    if (usedIds.has(cell.pokemonId)) return false;
                    usedIds.add(cell.pokemonId);
                } else {
                    const cands = board.cellValidPokemonIds[r]?.[c] || [];
                    remainingCells.push({ r, c, candidates: cands });
                }
            }
        }

        remainingCells.sort((a, b) => a.candidates.length - b.candidates.length);

        let steps = 0;
        const MAX_BACKTRACK_STEPS = 5000;

        function backtrack(idx: number): boolean {
            if (idx >= remainingCells.length) return true;
            if (++steps > MAX_BACKTRACK_STEPS) return true;
            const item = remainingCells[idx];
            for (const id of item.candidates) {
                if (!usedIds.has(id)) {
                    usedIds.add(id);
                    if (backtrack(idx + 1)) return true;
                    usedIds.delete(id);
                    if (steps > MAX_BACKTRACK_STEPS) return true;
                }
            }
            return false;
        }

        return backtrack(0);
    }

    let alternateFormsList: Array<{ id: number; name: string }> = [];

    async function loadAlternateForms(langId: number): Promise<void> {
        try {
            const res = await fetch(`/api/sudoku/forms/${langId}`);
            if (res.ok) {
                alternateFormsList = await res.json();
            }
        } catch {
            alternateFormsList = [];
        }
    }

    function refreshAllPokemonList(): void {
        const namesMap = getAllPokemonNamesSync(languageId);
        const baseList = Object.entries(namesMap)
            .map(([id, name]) => ({ id: Number(id), name: String(name) }))
            .sort((a, b) => a.id - b.id);
        allPokemonList = [...baseList, ...alternateFormsList];
    }

    async function startNewGame(isRetry: boolean = false): Promise<void> {
        if (isDailyMode && isRetry) {
            showEndModal = false;
            return;
        }
        stopTimer();
        isLoading = true;
        isGameOver = false;
        hasWon = false;
        showEndModal = false;
        activeCellModal = null;
        guessesUsed = 0;

        try {
            await Promise.all([preloadPokemonNames(languageId), loadAlternateForms(languageId)]);
            refreshAllPokemonList();

            const params = new URLSearchParams();
            params.set('size', String(effectiveGridSize));
            params.set('unique', settings.uniquePokemonOnly ? '1' : '0');
            if (isDailyMode) {
                params.set('seed', dailySeedStr);
            } else if (settings.dailySeed) {
                params.set('seed', settings.dailySeed);
            }
            if (settings.gameMode === 'custom') {
                if (settings.allowedRestrictions?.length) {
                    params.set('restrictions', settings.allowedRestrictions.join(','));
                } else if (settings.allowedCategories?.length) {
                    params.set('categories', settings.allowedCategories.join(','));
                }
            }

            const res = await fetch(`/api/sudoku/board?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch Sudoku board');
            const payload = (await res.json()) as SudokuBoardPayload;
            board = payload;

            // Initialize cell states
            const initialCells: SudokuCellState[][] = [];
            for (let r = 0; r < payload.gridSize; r++) {
                const rowArr: SudokuCellState[] = [];
                for (let c = 0; c < payload.gridSize; c++) {
                    const validIds = payload.cellValidPokemonIds[r]?.[c] || [];
                    rowArr.push({
                        row: r,
                        col: c,
                        pokemonId: null,
                        pokemonName: null,
                        isValid: null,
                        validCandidateCount: validIds.length,
                        sampleValidPokemonId: payload.guaranteedSolutionIds?.[r]?.[c] ?? validIds[0]
                    });
                }
                initialCells.push(rowArr);
            }
            cells = initialCells;

            // Restore saved Daily Challenge progress if playing today's Daily Challenge
            if (isDailyMode) {
                const savedDaily = getDailyChallengeStatus('sudoku', dailySeedStr);
                if (savedDaily?.runData?.sudokuState) {
                    const st = savedDaily.runData.sudokuState;
                    guessesUsed = st.guessesUsed || 0;
                    for (const savedCell of st.cells || []) {
                        if (cells[savedCell.row]?.[savedCell.col]) {
                            const localizedName =
                                savedCell.pokemonId
                                    ? getPokemonNameSync(savedCell.pokemonId, languageId) || savedCell.pokemonName
                                    : null;
                            cells[savedCell.row][savedCell.col] = {
                                ...cells[savedCell.row][savedCell.col],
                                pokemonId: savedCell.pokemonId,
                                pokemonName: localizedName,
                                isValid: savedCell.isValid
                            };
                        }
                    }
                    cells = cells;
                    if (savedDaily.completed) {
                        isGameOver = true;
                        hasWon = Boolean(savedDaily.isWin);
                        showEndModal = false;
                    }
                }
            }

            if (!isGameOver && settings.hasTimeLimit && settings.gameMode === 'custom') {
                startTimer();
            }
        } catch (err) {
            console.error(err);
            showErrorToast('Failed to generate Sudoku board.');
        } finally {
            isLoading = false;
        }
    }

    function buildDailySnapshot() {
        return {
            gridSize: effectiveGridSize,
            guessesUsed,
            cells: cells.flatMap(row =>
                row.map(c => ({
                    row: c.row,
                    col: c.col,
                    pokemonId: c.pokemonId,
                    pokemonName: c.pokemonName,
                    isValid: c.isValid
                }))
            )
        };
    }

    function finishGame(won: boolean): void {
        stopTimer();
        isGameOver = true;
        hasWon = won;
        activeCellModal = null;

        const firstSampleId = board?.guaranteedSolutionIds?.[0]?.[0] || 1;
        const firstSampleName = getPokemonNameSync(firstSampleId, languageId) || `#${firstSampleId}`;

        recordQuizGameResult({
            quizSlug: 'sudoku',
            modeKey: isDailyMode ? 'daily' : settings.gameMode,
            isWin: won,
            score: won ? filledValidCellsCount : filledValidCellsCount,
            guessesUsed,
            dailyChallenge: isDailyMode
                ? {
                    date: dailySeedStr,
                    pokemonId: firstSampleId,
                    pokemonName: firstSampleName,
                    runData: {
                        sudokuState: buildDailySnapshot()
                    }
                }
                : undefined
        });

        showEndModal = true;
    }

    function handleOpenCellModal(event: CustomEvent<{ row: number; col: number; cell: SudokuCellState }>): void {
        if (isGameOver) return;
        const { row, col } = event.detail;
        activeCellModal = { row, col };
    }

    function handleSelectPokemonForCell(event: CustomEvent<{ pokemon: { id: number; name: string } }>): void {
        if (!activeCellModal || !board || isGameOver) return;
        const { row, col } = activeCellModal;
        const picked = event.detail.pokemon;

        // 1. Check duplicate answer restriction ("Allow single answers")
        if (settings.uniquePokemonOnly) {
            const alreadyUsedElsewhere = cells.some((rArr, rIdx) =>
                rArr.some((cItem, cIdx) =>
                    (rIdx !== row || cIdx !== col) &&
                    cItem.isValid === true &&
                    cItem.pokemonId === picked.id
                )
            );
            if (alreadyUsedElsewhere) {
                showErrorToast(l('sudoku_duplicatePokemon').replace('{0}', picked.name));
                return;
            }
        }

        const validIdsForCell = board.cellValidPokemonIds[row]?.[col] || [];
        const matchesCellRestrictions = validIdsForCell.includes(picked.id);

        // 2. If it matches the cell's restrictions and Soft Lock Guard is enabled, ensure it doesn't soft-lock remaining cells
        if (matchesCellRestrictions && settings.softLockGuard && settings.uniquePokemonOnly) {
            const solvableAfterPick = canCompleteRemainingGrid(row, col, picked.id);
            if (!solvableAfterPick) {
                showErrorToast(l('sudoku_softLockPrevented').replace('{0}', picked.name));
                return;
            }
        }

        // Consume a guess; only fill the cell if it matches the restrictions
        guessesUsed += 1;
        cells[row][col] = {
            ...cells[row][col],
            pokemonId: matchesCellRestrictions ? picked.id : null,
            pokemonName: matchesCellRestrictions ? picked.name : null,
            isValid: matchesCellRestrictions
        };
        cells = cells;
        activeCellModal = null;

        if (!matchesCellRestrictions) {
            showErrorToast(l('sudoku_invalidChoice').replace('{0}', picked.name));
        }

        // Check win or loss condition
        const currentValidCount = cells.reduce(
            (sum, rArr) => sum + rArr.filter(c => c.isValid === true).length,
            0
        );

        const maxGuessesAllowed = settings.unlimitedGuesses ? Infinity : settings.guessLimit;

        if (currentValidCount >= totalCells) {
            finishGame(true);
        } else if (guessesUsed >= maxGuessesAllowed) {
            finishGame(false);
        } else if (isDailyMode) {
            saveDailyChallengeRun({
                date: dailySeedStr,
                quiz: 'sudoku',
                completed: false,
                score: currentValidCount,
                runData: {
                    sudokuState: buildDailySnapshot()
                }
            });
        }
    }

    onMount(async () => {
        saveSudokuSettings(settings);
        await startNewGame();
    });

    // Update localized names if language changes
    let lastLanguageId: number = languageId;
    $: if (languageId && languageId !== lastLanguageId && cells.length > 0) {
        lastLanguageId = languageId;
        Promise.all([preloadPokemonNames(languageId), loadAlternateForms(languageId)]).then(() => {
            refreshAllPokemonList();
            const formNameMap = new Map(alternateFormsList.map(f => [f.id, f.name]));
            cells = cells.map(row =>
                row.map(c => ({
                    ...c,
                    pokemonName: c.pokemonId
                        ? formNameMap.get(c.pokemonId) || getPokemonNameSync(c.pokemonId, languageId) || c.pokemonName
                        : null
                }))
            );
        });
    }

    $: guessesRemaining = settings.unlimitedGuesses
        ? null
        : Math.max(0, settings.guessLimit - guessesUsed);

    $: headerSubtitle = (() => {
        const modeLabel =
            isDailyMode
                ? `${l('dailyChallenge')} (${dailySeedStr})`
                : settings.gameMode === 'normal'
                ? l('sudoku_mode_normal')
                : `${l('sudoku_mode_custom')} (${effectiveGridSize}×${effectiveGridSize})`;
        const cellsInfo = l('sudoku_cellsFilled')
            .replace('{0}', String(filledValidCellsCount))
            .replace('{1}', String(totalCells));
        const guessInfo =
            guessesRemaining !== null
                ? l('sudoku_guessesLeft').replace('{0}', String(guessesRemaining))
                : l('sudoku_guessesUsed').replace('{0}', String(guessesUsed));
        return `${modeLabel} | ${cellsInfo} | ${guessInfo}`;
    })();

    $: sampleCorrectAnswer = (() => {
        const sampleId = board?.guaranteedSolutionIds?.[0]?.[0] || 1;
        const sampleName = getPokemonNameSync(sampleId, languageId) || 'Bulbasaur';
        return {
            id: sampleId,
            name: sampleName,
            isCorrect: hasWon
        } as PokemonOption;
    })();
</script>

{#if isLoading}
    <div class="min-h-screen flex items-center justify-center">
        <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
    </div>
{:else if board}
    <div class="px-3 pt-16 pb-6 sm:p-6 md:p-8 max-w-6xl mx-auto w-full">
        <!-- Header -->
        <QuizHeader
            {languageCode}
            quizTitleLabel="sudoku_quiz"
            gameMode="score"
            currentQuestion={filledValidCellsCount}
            totalQuestions={totalCells}
            score={filledValidCellsCount}
            customSubtitle={headerSubtitle}
            onBackToHub={isDailyMode ? onBackToHub : onBackToSettings}
        />

        <!-- Optional Countdown Timer -->
        {#if settings.hasTimeLimit && settings.gameMode === 'custom' && !isGameOver}
            <TimerDisplay {timeRemaining} dangerThreshold={15} />
        {/if}

        <!-- Daily Run Completed Banner -->
        {#if isDailyMode && isGameOver}
            <div class="daily-run-summary max-w-2xl mx-auto mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/60 border-2 border-amber-300 dark:border-amber-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <div class="font-bold text-amber-900 dark:text-amber-200 text-sm">
                        {l('dailyAlreadyPlayed')}
                    </div>
                    <div class="text-xs text-amber-800 dark:text-amber-300 mt-1">
                        {l('sudoku_cellsFilled').replace('{0}', String(filledValidCellsCount)).replace('{1}', String(totalCells))}
                        • {l('sudoku_guessesUsed').replace('{0}', String(guessesUsed))}
                    </div>
                </div>
            </div>
        {/if}

        <!-- Status Pills Row -->
        <div class="flex flex-wrap items-center justify-center gap-3 mb-6">
            <span class="sudoku-guesses-badge px-4 py-1.5 rounded-full text-sm font-bold bg-blue-600 text-white shadow-sm">
                {#if guessesRemaining !== null}
                    {l('sudoku_guessesLeft').replace('{0}', String(guessesRemaining))}
                {:else}
                    ∞ {l('sudoku_guessesUsed').replace('{0}', String(guessesUsed))}
                {/if}
            </span>

            <span class="sudoku-cells-badge px-4 py-1.5 rounded-full text-sm font-bold bg-emerald-600 text-white shadow-sm">
                {l('sudoku_cellsFilled').replace('{0}', String(filledValidCellsCount)).replace('{1}', String(totalCells))}
            </span>

            {#if settings.softLockGuard}
                <span class="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700">
                    {l('sudoku_softLockGuard')}
                </span>
            {/if}

            {#if settings.uniquePokemonOnly}
                <span class="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-700">
                    {l('sudoku_uniquePokemonOnly')}
                </span>
            {/if}
        </div>

        <!-- Sudoku Grid Component -->
        <SudokuGrid
            gridSize={board.gridSize}
            rowRestrictions={board.rowRestrictions}
            colRestrictions={board.colRestrictions}
            {cells}
            {isGameOver}
            {languageCode}
            on:cellClick={handleOpenCellModal}
            on:inspectPokemon={(e) => { selectedPokedexPokemon = e.detail; }}
        />
    </div>
{/if}

<!-- Cell Pokémon Search Modal -->
{#if activeCellModal && board}
    <SudokuPokemonSearchModal
        rowIndex={activeCellModal.row}
        colIndex={activeCellModal.col}
        rowRestriction={board.rowRestrictions[activeCellModal.row]}
        colRestriction={board.colRestrictions[activeCellModal.col]}
        {allPokemonList}
        {usedPokemonIds}
        uniquePokemonOnly={settings.uniquePokemonOnly}
        {languageCode}
        on:select={handleSelectPokemonForCell}
        on:close={() => { activeCellModal = null; }}
    />
{/if}

<!-- End Game Modal -->
{#if showEndModal}
    <QuizEndModal
        isWin={hasWon}
        score={filledValidCellsCount}
        totalQuestions={totalCells}
        correctAnswer={sampleCorrectAnswer}
        {languageCode}
        gameMode="score"
        isDailyChallenge={isDailyMode}
        showAnswerOnWin={false}
        on:home={onBackToHub}
        on:changeSettings={onBackToSettings}
        on:retry={() => startNewGame(true)}
        on:close={() => { showEndModal = false; }}
    />
{/if}

<!-- Pokédex Mini-Card Modal -->
{#if selectedPokedexPokemon}
    <PokedexMiniCardModal
        pokemonId={selectedPokedexPokemon.id}
        pokemonName={selectedPokedexPokemon.name}
        {languageCode}
        on:close={() => { selectedPokedexPokemon = null; }}
    />
{/if}

<!-- Toast Notification -->
{#if toastState.show}
    <Toast
        message={toastState.message}
        type={toastState.type}
        autoClose={true}
        duration={2500}
        onClose={() => { toastState.show = false; }}
    />
{/if}
