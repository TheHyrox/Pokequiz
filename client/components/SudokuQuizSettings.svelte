<script lang="ts">
    /**
     * @brief Sudoku (PokéSudoku) Quiz Settings configuration panel
     * @description Supports three game modes:
     *              - Daily: 3x3, guaranteed solvable, 10 guesses
     *              - Normal: 3x3, guaranteed solvable, 10 guesses (training)
     *              - Custom: user chooses grid size (2x2 to 5x5), unlimited guesses, timer,
     *                        soft lock guard, single answers only, and allowed restriction categories
     */
    import Slider from './Slider.svelte';
    import ToggleOption from './ToggleOption.svelte';
    import SudokuRestrictionSelector from './quiz/SudokuRestrictionSelector.svelte';
    import Toast from './Toast.svelte';
    import { getLabel, type LabelKey } from '../src/lib/translations';
    import { createToastHandlers } from '../src/lib/toastUtils';
    import { buildShareableQuizUrl } from '../src/lib/urlSettings';
    import { getTodayDateString } from '../../shared/utils/seededRng';
    import {
        ALL_SUDOKU_RESTRICTION_CATEGORIES,
        ALL_SUDOKU_RESTRICTION_IDS,
        ALL_SUDOKU_RESTRICTIONS,
        DEFAULT_SUDOKU_QUIZ_SETTINGS
    } from '../../shared/constants';
    import { saveSudokuSettings, getDailyChallengeStatus } from '../src/lib/storage';
    import type {
        SudokuQuizSettings,
        SudokuGameMode,
        SudokuGridSize,
        SudokuRestrictionCategory,
        ToastState
    } from '../../shared/types';

    export let onStartQuiz: (settings: SudokuQuizSettings) => void;
    export let languageCode: string = 'en';
    export let initialSettings: SudokuQuizSettings | null = null;

    $: dailyCompletedToday = Boolean(getDailyChallengeStatus('sudoku', getTodayDateString())?.completed);

    const defaults = DEFAULT_SUDOKU_QUIZ_SETTINGS;

    let gameMode: SudokuGameMode = initialSettings?.gameMode ?? defaults.gameMode;
    let gridSize: SudokuGridSize = initialSettings?.gridSize ?? defaults.gridSize;
    let unlimitedGuesses: boolean = initialSettings?.unlimitedGuesses ?? defaults.unlimitedGuesses;
    let guessLimit: number = initialSettings?.guessLimit ?? defaults.guessLimit;
    let hasTimeLimit: boolean = initialSettings?.hasTimeLimit ?? defaults.hasTimeLimit;
    let timeLimit: number = initialSettings?.timeLimit ?? defaults.timeLimit;
    let softLockGuard: boolean = initialSettings?.softLockGuard ?? defaults.softLockGuard;
    let uniquePokemonOnly: boolean = initialSettings?.uniquePokemonOnly ?? defaults.uniquePokemonOnly;

    function computeInitialRestrictions(): Set<string> {
        if (initialSettings?.allowedRestrictions && initialSettings.allowedRestrictions.length > 0) {
            return new Set(initialSettings.allowedRestrictions);
        }
        if (initialSettings?.allowedCategories && initialSettings.allowedCategories.length > 0) {
            const catSet = new Set(initialSettings.allowedCategories);
            return new Set(
                ALL_SUDOKU_RESTRICTIONS.filter(r => catSet.has(r.category)).map(r => r.id)
            );
        }
        return new Set(ALL_SUDOKU_RESTRICTION_IDS);
    }

    let selectedRestrictions: Set<string> = computeInitialRestrictions();

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

    function buildCurrentSettings(forceDaily: boolean = false): SudokuQuizSettings {
        const effectiveMode: SudokuGameMode = forceDaily ? 'daily' : gameMode;
        const isStandard3x3 = effectiveMode === 'daily' || effectiveMode === 'normal';
        const isDaily = effectiveMode === 'daily';

        const chosenRestrictions = isStandard3x3
            ? [...ALL_SUDOKU_RESTRICTION_IDS]
            : Array.from(selectedRestrictions);

        const derivedCategories = Array.from(
            new Set(
                ALL_SUDOKU_RESTRICTIONS
                    .filter(r => chosenRestrictions.includes(r.id))
                    .map(r => r.category)
            )
        ) as SudokuRestrictionCategory[];

        return {
            gameMode: effectiveMode,
            gridSize: isStandard3x3 ? 3 : (gridSize as SudokuGridSize),
            unlimitedGuesses: isStandard3x3 ? false : unlimitedGuesses,
            guessLimit: isStandard3x3 ? 10 : guessLimit,
            hasTimeLimit: isStandard3x3 ? false : hasTimeLimit,
            timeLimit: timeLimit,
            softLockGuard: isStandard3x3 ? true : softLockGuard,
            uniquePokemonOnly: isStandard3x3 ? true : uniquePokemonOnly,
            allowedCategories: isStandard3x3
                ? [...ALL_SUDOKU_RESTRICTION_CATEGORIES]
                : derivedCategories,
            allowedRestrictions: chosenRestrictions,
            isDailyChallenge: isDaily,
            dailySeed: isDaily ? getTodayDateString() : undefined
        };
    }

    function handleStartQuiz(): void {
        if (gameMode === 'custom' && selectedRestrictions.size < gridSize * 2) {
            showErrorToast(l('sudoku_allowedCategories'));
            return;
        }
        const settings = buildCurrentSettings(gameMode === 'daily');
        saveSudokuSettings(settings);
        onStartQuiz(settings);
    }

    function handleStartDailyChallenge(): void {
        const settings = buildCurrentSettings(true);
        saveSudokuSettings(settings);
        onStartQuiz(settings);
    }

    async function handleShareSettings(): Promise<void> {
        if (gameMode === 'custom' && selectedRestrictions.size < gridSize * 2) {
            showErrorToast(l('sudoku_allowedCategories'));
            return;
        }
        const url = buildShareableQuizUrl('sudoku', buildCurrentSettings(false), false);
        if (typeof window !== 'undefined') {
            window.history.replaceState(window.history.state, '', url);
            try {
                await navigator.clipboard?.writeText(url);
            } catch {}
        }
        showSuccessToast(l('shareLinkCopied'));
    }

    const GRID_SIZES: SudokuGridSize[] = [2, 3, 4, 5];
</script>

<div class="settings-container max-w-5xl mx-auto">
    <div class="settings-grid flex-col md:flex-row">
        <!-- LEFT COLUMN: Game Mode & Rules -->
        <div class="settings-column">
            <!-- Three Game Modes: Daily, Normal, Custom -->
            <div class="settings-section">
                <h3 class="settings-section-title">{l('gameMode')}</h3>
                <p class="section-description">{l('gameModeDescription')}</p>
                <div class="game-mode-options">
                    <label class="radio-label">
                        <input
                            type="radio"
                            name="sudokuGameMode"
                            value="daily"
                            bind:group={gameMode}
                            class="radio-input"
                        />
                        <span class="radio-text">{l('sudoku_mode_daily')}</span>
                        <span class="radio-description">{l('sudoku_mode_daily_desc')}</span>
                    </label>

                    <label class="radio-label">
                        <input
                            type="radio"
                            name="sudokuGameMode"
                            value="normal"
                            bind:group={gameMode}
                            class="radio-input"
                        />
                        <span class="radio-text">{l('sudoku_mode_normal')}</span>
                        <span class="radio-description">{l('sudoku_mode_normal_desc')}</span>
                    </label>

                    <label class="radio-label">
                        <input
                            type="radio"
                            name="sudokuGameMode"
                            value="custom"
                            bind:group={gameMode}
                            class="radio-input"
                        />
                        <span class="radio-text">{l('sudoku_mode_custom')}</span>
                        <span class="radio-description">{l('sudoku_mode_custom_desc')}</span>
                    </label>
                </div>
            </div>

            {#if gameMode === 'custom'}
                <!-- Grid Size Selector (2x2 to 5x5) -->
                <div class="settings-section">
                    <h3 class="settings-section-title">{l('sudoku_gridSize')}</h3>
                    <p class="section-description">{l('sudoku_gridSize_desc')}</p>
                    <div class="grid grid-cols-4 gap-3">
                        {#each GRID_SIZES as size (size)}
                            <button
                                type="button"
                                data-grid-size={size}
                                on:click={() => { gridSize = size; }}
                                class="sudoku-size-btn py-2.5 px-3 rounded-xl font-bold text-sm border-2 transition-all cursor-pointer
                                    {gridSize === size
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 shadow-sm'
                                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-blue-400'}"
                            >
                                {size}×{size}
                            </button>
                        {/each}
                    </div>
                </div>
            {:else}
                <!-- Standard 3x3 Rules Info Banner for Daily & Normal -->
                <div class="settings-section">
                    <div class="p-4 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-700 rounded-xl text-blue-900 dark:text-blue-100 text-sm space-y-2">
                        <div class="font-bold flex items-center gap-2">
                            {gameMode === 'daily' ? l('sudoku_mode_daily') : l('sudoku_mode_normal')}
                        </div>
                        <ul class="text-xs leading-relaxed text-blue-800 dark:text-blue-200 list-disc list-inside space-y-1">
                            <li>{l('sudoku_gridSize')}: <strong>3×3 (9 cells)</strong></li>
                            <li>{l('sudoku_guessLimit')}: <strong>10</strong></li>
                            <li>{l('sudoku_softLockGuard')}: <strong>ON</strong></li>
                            <li>{l('sudoku_uniquePokemonOnly')}: <strong>ON</strong></li>
                        </ul>
                    </div>
                </div>
            {/if}
        </div>

        <!-- VERTICAL SEPARATOR -->
        <div class="separator hidden md:block"></div>

        <!-- RIGHT COLUMN: Over-the-Game Settings & Restriction Categories -->
        <div class="settings-column">
            <!-- Game Settings: Unlimited guess, Timer, Soft Lock guard, Allow single answers -->
            <div class="settings-section">
                <h3 class="settings-section-title">{l('gameSettings')}</h3>
                <p class="section-description">{l('sudoku_description')}</p>

                <div class="space-y-4 mt-4">
                    <!-- Unlimited Guesses -->
                    <div>
                        <ToggleOption
                            label={l('sudoku_unlimitedGuesses')}
                            bind:enabled={unlimitedGuesses}
                            disabled={gameMode !== 'custom'}
                        />
                        {#if !unlimitedGuesses && gameMode === 'custom'}
                            <div class="ml-8 mt-2">
                                <Slider
                                    label={l('sudoku_guessLimit')}
                                    bind:value={guessLimit}
                                    min={gridSize * gridSize}
                                    max={40}
                                />
                            </div>
                        {/if}
                    </div>

                    <!-- Timer -->
                    <div>
                        <ToggleOption
                            label={l('enableTimeLimit')}
                            bind:enabled={hasTimeLimit}
                            disabled={gameMode !== 'custom'}
                        />
                        {#if hasTimeLimit && gameMode === 'custom'}
                            <div class="ml-8 mt-2">
                                <Slider
                                    label={l('timePerQuestion')}
                                    bind:value={timeLimit}
                                    min={30}
                                    max={600}
                                />
                            </div>
                        {/if}
                    </div>

                    <!-- Soft Lock Guard -->
                    <div>
                        <ToggleOption
                            label={l('sudoku_softLockGuard')}
                            bind:enabled={softLockGuard}
                            disabled={gameMode !== 'custom'}
                        />
                        <p class="text-xs text-gray-500 dark:text-gray-400 ml-8 -mt-2">
                            {l('sudoku_softLockGuard_desc')}
                        </p>
                    </div>

                    <!-- Allow Single Answers (Unique Pokémon Only) -->
                    <div>
                        <ToggleOption
                            label={l('sudoku_uniquePokemonOnly')}
                            bind:enabled={uniquePokemonOnly}
                            disabled={gameMode !== 'custom'}
                        />
                        <p class="text-xs text-gray-500 dark:text-gray-400 ml-8 -mt-2">
                            {l('sudoku_uniquePokemonOnly_desc')}
                        </p>
                    </div>
                </div>
            </div>

            {#if gameMode === 'custom'}
                <!-- Grouped Dropdown Restriction Selector -->
                <SudokuRestrictionSelector
                    {languageCode}
                    bind:selectedRestrictions
                />
            {/if}
        </div>
    </div>

    <!-- Action Buttons: Start, Daily Challenge & Share Settings -->
    <div class="flex flex-col sm:flex-row gap-3">
        <button on:click={handleStartQuiz} class="start-button flex-1">
            {l('startQuiz')}
        </button>
        <button
            type="button"
            on:click={handleStartDailyChallenge}
            class="daily-challenge-btn px-5 py-3 {dailyCompletedToday ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-500 hover:bg-amber-600'} text-white font-bold rounded-lg transition-colors cursor-pointer"
        >
            {l('dailyChallenge')} ({getTodayDateString()}) {dailyCompletedToday ? `• ✓ ${l('dailyViewRun')}` : ''}
        </button>
        <button
            type="button"
            on:click={handleShareSettings}
            class="share-settings-btn px-5 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-lg transition-colors cursor-pointer"
        >
            {l('shareSettings')}
        </button>
    </div>
</div>

{#if toastState.show}
    <Toast
        message={toastState.message}
        type={toastState.type}
        autoClose={true}
        duration={2000}
        onClose={() => { toastState.show = false; }}
    />
{/if}

<style lang="postcss">
    .settings-container {
        @apply bg-white rounded-lg shadow-lg p-8 w-full;
    }

    .settings-grid {
        @apply flex gap-8 mb-8;
    }

    .settings-column {
        @apply flex-1;
    }

    .separator {
        @apply w-px bg-gray-300;
    }

    .settings-section {
        @apply mb-8;
    }

    .settings-section-title {
        @apply text-lg font-semibold text-gray-700 mb-2;
    }

    .section-description {
        @apply text-sm text-gray-600 mb-4 italic;
    }

    .game-mode-options {
        @apply space-y-3;
    }

    .radio-label {
        @apply flex flex-col p-3 border-2 border-gray-200 rounded-lg cursor-pointer transition-all;
    }

    .radio-label:hover {
        @apply border-blue-400 bg-blue-50;
    }

    .radio-label:has(input:checked) {
        @apply border-blue-500 bg-blue-50;
    }

    .radio-input {
        @apply w-4 h-4 accent-blue-500 cursor-pointer mb-2;
    }

    .radio-text {
        @apply font-medium text-gray-700;
    }

    .radio-description {
        @apply text-sm text-gray-500 mt-1;
    }

    .start-button {
        @apply w-full bg-blue-500 text-white font-bold py-3 px-4 rounded-lg;
        @apply transition-colors duration-200 cursor-pointer;
    }

    .start-button:hover {
        @apply bg-blue-600;
    }

    .start-button:active {
        @apply bg-blue-700;
    }
</style>
