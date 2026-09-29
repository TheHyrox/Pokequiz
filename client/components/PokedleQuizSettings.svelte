<script lang="ts">
    import Slider from './Slider.svelte';
    import ToggleOption from './ToggleOption.svelte';
    import GenerationSelector from './quiz/GenerationSelector.svelte';
    import Toast from './Toast.svelte';
    import { getLabel } from '../src/lib/translations';
    import { createToastHandlers } from '../src/lib/toastUtils';
    import { ALL_GENERATIONS, ALL_POKEDLE_COLUMNS, DEFAULT_POKEDLE_QUIZ_SETTINGS } from '../../shared/constants';
    import { savePokedleSettings } from '../src/lib/storage';
    import type { PokedleQuizSettings, PokedleColumn, ToastState } from '../../shared/types';

    export let onStartQuiz: (settings: PokedleQuizSettings) => void;
    export let languageCode: string = 'en';
    export let initialSettings: PokedleQuizSettings | null = null;

    let guessLimit: number = initialSettings?.guessLimit ?? DEFAULT_POKEDLE_QUIZ_SETTINGS.guessLimit;
    let selectedGenerations: Set<number> = new Set(initialSettings?.selectedGenerations ?? ALL_GENERATIONS);
    let selectedColumns: Set<PokedleColumn> = new Set(initialSettings?.selectedColumns ?? ALL_POKEDLE_COLUMNS);
    let showMoreLessIndicators: boolean = initialSettings?.showMoreLessIndicators ?? true;

    let toastState: ToastState = {
        message: '',
        type: 'info',
        show: false
    };

    const { showErrorToast } = createToastHandlers((state: ToastState) => {
        toastState = state;
    });

    function toggleColumn(col: PokedleColumn): void {
        if (selectedColumns.has(col)) {
            selectedColumns.delete(col);
        } else {
            selectedColumns.add(col);
        }
        selectedColumns = selectedColumns;
    }

    function getColumnLabel(col: PokedleColumn): string {
        return getLabel(languageCode, `pokedle_col_${col}` as any);
    }

    function handleStartQuiz(): void {
        if (selectedGenerations.size === 0) {
            showErrorToast(getLabel(languageCode, 'selectAtLeastOneGeneration'));
            return;
        }

        if (selectedColumns.size === 0) {
            showErrorToast(getLabel(languageCode, 'pokedle_columns' as any)); // You must select at least one column
            return;
        }

        const settings: PokedleQuizSettings = {
            guessLimit,
            selectedGenerations: Array.from(selectedGenerations),
            selectedColumns: Array.from(selectedColumns),
            showMoreLessIndicators
        };
        savePokedleSettings(settings);
        onStartQuiz(settings);
    }
</script>

<div class="settings-container">
    <div class="settings-grid flex-col md:flex-row">
        <!-- LEFT COLUMN -->
        <div class="settings-column">
            <!-- Game Options Section -->
            <div class="settings-section">
                <h3 class="settings-section-title">{getLabel(languageCode, 'gameSettings')}</h3>
                <p class="section-description">Configure specific mechanics for Pokedle mode.</p>
                <div class="mt-4">
                    <ToggleOption
                        label={getLabel(languageCode, 'pokedle_showIndicators' as any)}
                        bind:enabled={showMoreLessIndicators}
                    />
                </div>
            </div>

            <!-- Guess Limit Section -->
            <div class="settings-section">
                <h3 class="settings-section-title">{getLabel(languageCode, 'pokedle_guessLimit' as any)}</h3>
                <p class="section-description">Maximum number of attempts to find the Pokemon.</p>
                <div class="mt-4">
                    <Slider
                        label={getLabel(languageCode, 'pokedle_guessLimit' as any)}
                        bind:value={guessLimit}
                        min={5}
                        max={10}
                        step={1}
                        unit=""
                    />
                </div>
            </div>
        </div>

        <!-- VERTICAL SEPARATOR -->
        <div class="separator hidden md:block"></div>

        <!-- RIGHT COLUMN -->
        <div class="settings-column">
            <!-- Pokemon Generations Section -->
            <GenerationSelector {languageCode} bind:selectedGenerations />

            <!-- Columns Section -->
            <div class="settings-section">
                <h3 class="settings-section-title">{getLabel(languageCode, 'pokedle_columns' as any)}</h3>
                <p class="section-description">Select which attributes to display in the game grid.</p>
                
                <div class="information-grid">
                    {#each ALL_POKEDLE_COLUMNS as col (col)}
                        <label class="information-checkbox">
                            <input
                                type="checkbox"
                                checked={selectedColumns.has(col)}
                                on:change={() => toggleColumn(col)}
                            />
                            <span>{getColumnLabel(col)}</span>
                        </label>
                    {/each}
                </div>
            </div>
        </div>
    </div>

    <!-- Start Button -->
    <button on:click={handleStartQuiz} class="start-button">
        {getLabel(languageCode, 'startQuiz')}
    </button>
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
        @apply bg-white rounded-lg shadow-lg p-8 w-full max-w-4xl mx-auto;
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

    .information-grid {
        @apply grid grid-cols-2 gap-3 mb-2;
    }

    .information-checkbox {
        @apply flex items-center cursor-pointer;
    }

    .information-checkbox input {
        @apply w-4 h-4 accent-blue-500 cursor-pointer mr-2;
    }

    .information-checkbox span {
        @apply text-gray-700 text-sm;
    }

    .start-button {
        @apply w-full bg-blue-500 text-white font-bold py-3 px-4 rounded-lg;
        @apply transition-colors duration-200;
    }

    .start-button:hover {
        @apply bg-blue-600;
    }

    .start-button:active {
        @apply bg-blue-700;
    }

    .mt-4 {
        margin-top: 1rem;
    }
</style>
