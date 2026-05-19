<script lang="ts">
    /**
     * @brief Information quiz settings configuration panel
     * @description Provides UI for configuring information quiz options before starting
     */
    import Slider from './Slider.svelte';
    import ToggleOption from './ToggleOption.svelte';
    import NumberStepper from './NumberStepper.svelte';
    import GenerationSelector from './quiz/GenerationSelector.svelte';
    import Toast from './Toast.svelte';
    import { getLabel } from '../src/lib/translations';
    import { createToastHandlers } from '../src/lib/toastUtils';
    import { ALL_GENERATIONS, ALL_INFORMATION_TYPES, DEFAULT_INFORMATION_QUIZ_SETTINGS } from '../../shared/constants';
    import type { InformationQuizSettings, InformationType, ToastState } from '../../shared/types';

    /** Callback when quiz starts with settings */
    export let onStartQuiz: (settings: InformationQuizSettings) => void;
    /** Current language code for translations */
    export let languageCode: string = 'en';
    /** Initial settings from cache (or null if new game) */
    export let initialSettings: InformationQuizSettings | null = null;

    // Settings state - initialize from cache if available
    let gameMode: 'easy' | 'normal' | 'challenge' | 'hardcore' = initialSettings?.gameMode ?? 'easy';
    let selectedGenerations: Set<number> = new Set(initialSettings?.selectedGenerations ?? ALL_GENERATIONS);
    let selectedInformations: Set<InformationType> = new Set(initialSettings?.selectedInformations ?? DEFAULT_INFORMATION_QUIZ_SETTINGS.selectedInformations);
    let numberOfOptions: number = initialSettings?.numberOfOptions ?? 10;
    let showSprites: boolean = initialSettings?.showSprites ?? false;
    let enableFakeInformation: boolean = initialSettings?.enableFakeInformation ?? false;
    let fakeInformationRate: number = initialSettings?.fakeInformationRate ?? 5;
    let hasTimeLimit: boolean = initialSettings?.hasTimeLimit ?? false;
    let timeLimit: number = initialSettings?.timeLimit ?? 30;

    // Toast state
    let toastState: ToastState = {
        message: '',
        type: 'info',
        show: false
    };

    const { showErrorToast } = createToastHandlers((state: ToastState) => {
        toastState = state;
    });

    /**
     * @brief Toggle an information type
     */
    function toggleInformation(info: InformationType): void {
        if (selectedInformations.has(info)) {
            selectedInformations.delete(info);
        } else {
            selectedInformations.add(info);
        }
        selectedInformations = selectedInformations;
    }

    /**
     * @brief Get label for information type
     */
    function getInformationLabel(info: InformationType): string {
        return getLabel(languageCode, `information_${info}`);
    }

    /**
     * @brief Validates settings and starts the quiz
     */
    function handleStartQuiz(): void {
        if (selectedGenerations.size === 0) {
            showErrorToast(getLabel(languageCode, 'selectAtLeastOneGeneration'));
            return;
        }

        if (selectedInformations.size < 3) {
            showErrorToast(getLabel(languageCode, 'information_minimumRequired'));
            return;
        }

        const finalSettings: InformationQuizSettings = {
            hasTimeLimit,
            timeLimit,
            gameMode,
            selectedGenerations: Array.from(selectedGenerations),
            selectedInformations: Array.from(selectedInformations),
            numberOfOptions,
            showSprites,
            enableFakeInformation,
            fakeInformationRate
        };
        onStartQuiz(finalSettings);
    }
</script>

<div class="settings-container">
    <div class="settings-grid">
        <!-- LEFT COLUMN: Game Modes -->
        <div class="settings-column">
            <div class="settings-section">
                <h3 class="settings-section-title">{getLabel(languageCode, 'information_gameModes')}</h3>
                <div class="game-modes">
                    <label class="game-mode-option">
                        <input
                            type="radio"
                            bind:group={gameMode}
                            value="easy"
                        />
                        <div class="mode-content">
                            <span class="mode-name">{getLabel(languageCode, 'information_easyMode')}</span>
                            <span class="mode-description">{getLabel(languageCode, 'information_easyDescription')}</span>
                        </div>
                        <div class="tooltip-container">
                            <span class="tooltip-icon">ℹ️</span>
                            <div class="tooltip-box">
                                <span class="tooltip-title">{getLabel(languageCode, 'pointsCalculation')}</span>
                                <span class="tooltip-line">{getLabel(languageCode, 'easyFirstTry')}</span>
                                <span class="tooltip-line">{getLabel(languageCode, 'easySecondTry')}</span>
                                <span class="tooltip-line">{getLabel(languageCode, 'easyThirdPlus')}</span>
                            </div>
                        </div>
                    </label>
                    <label class="game-mode-option">
                        <input
                            type="radio"
                            bind:group={gameMode}
                            value="normal"
                        />
                        <div class="mode-content">
                            <span class="mode-name">{getLabel(languageCode, 'information_normalMode')}</span>
                            <span class="mode-description">{getLabel(languageCode, 'information_normalDescription')}</span>
                        </div>
                        <div class="tooltip-container">
                            <span class="tooltip-icon">ℹ️</span>
                            <div class="tooltip-box">
                                <span class="tooltip-title">{getLabel(languageCode, 'pointsCalculation')}</span>
                                <span class="tooltip-line">{getLabel(languageCode, 'normalBase')}</span>
                                <span class="tooltip-line">{getLabel(languageCode, 'normalPenalty')}</span>
                                <span class="tooltip-line">{getLabel(languageCode, 'normalMinimum')}</span>
                            </div>
                        </div>
                    </label>
                    <label class="game-mode-option">
                        <input
                            type="radio"
                            bind:group={gameMode}
                            value="challenge"
                        />
                        <div class="mode-content">
                            <span class="mode-name">{getLabel(languageCode, 'information_challengeMode')}</span>
                            <span class="mode-description">{getLabel(languageCode, 'information_challengeDescription')}</span>
                        </div>
                        <div class="tooltip-container">
                            <span class="tooltip-icon">ℹ️</span>
                            <div class="tooltip-box">
                                <span class="tooltip-title">{getLabel(languageCode, 'pointsCalculation')}</span>
                                <span class="tooltip-line">{getLabel(languageCode, 'challengeConsecutive')}</span>
                                <span class="tooltip-line">{getLabel(languageCode, 'challengeAlwaysProgress')}</span>
                                <span class="tooltip-line">{getLabel(languageCode, 'challengeScoreShown')}</span>
                            </div>
                        </div>
                    </label>
                    <label class="game-mode-option">
                        <input
                            type="radio"
                            bind:group={gameMode}
                            value="hardcore"
                        />
                        <div class="mode-content">
                            <span class="mode-name">{getLabel(languageCode, 'information_hardcoreMode')}</span>
                            <span class="mode-description">{getLabel(languageCode, 'information_hardcoreDescription')}</span>
                        </div>
                        <div class="tooltip-container">
                            <span class="tooltip-icon">ℹ️</span>
                            <div class="tooltip-box">
                                <span class="tooltip-title">{getLabel(languageCode, 'pointsCalculation')}</span>
                                <span class="tooltip-line">{getLabel(languageCode, 'hardcoreTimePerQuestion')}</span>
                                <span class="tooltip-line">{getLabel(languageCode, 'hardcoreUnder2Seconds')}</span>
                                <span class="tooltip-line">{getLabel(languageCode, 'hardcoreUnder5Seconds')}</span>
                                <span class="tooltip-line">{getLabel(languageCode, 'hardcoreUnder15Seconds')}</span>
                                <span class="tooltip-line">{getLabel(languageCode, 'hardcoreLives')}</span>
                            </div>
                        </div>
                    </label>
                </div>
            </div>
        </div>

        <!-- VERTICAL SEPARATOR -->
        <div class="separator"></div>

        <!-- RIGHT COLUMN: Game Options -->
        <div class="settings-column">
            <!-- Pokemon Generations Section -->
            <GenerationSelector {languageCode} bind:selectedGenerations />

            <!-- Information Types Section -->
            <div class="settings-section">
                <h3 class="settings-section-title">{getLabel(languageCode, 'information_selectInformations')}</h3>
                <p class="section-description">{getLabel(languageCode, 'information_selectInformationsHelp')}</p>
                
                <div class="information-grid">
                    {#each ALL_INFORMATION_TYPES as infoType (infoType)}
                        <label class="information-checkbox">
                            <input
                                type="checkbox"
                                checked={selectedInformations.has(infoType)}
                                on:change={() => toggleInformation(infoType)}
                            />
                            <span>{getInformationLabel(infoType)}</span>
                        </label>
                    {/each}
                </div>
                {#if selectedInformations.size < 3}
                    <p class="error-text">{getLabel(languageCode, 'information_minimumRequired')}</p>
                {/if}
            </div>

            <!-- Number of Options Section -->
            <div class="settings-section">
                <h3 class="settings-section-title">{getLabel(languageCode, 'numberOfPokemonOptions')}</h3>
                <p class="section-description">{getLabel(languageCode, 'pokemonOptionsDescription')}</p>
                <NumberStepper
                    label={getLabel(languageCode, 'pokemonOptions')}
                    min={2}
                    max={24}
                    bind:value={numberOfOptions}
                />
            </div>

            <!-- Sprite Display Section -->
            <div class="settings-section">
                <h3 class="settings-section-title">{getLabel(languageCode, 'information_showSprites')}</h3>
                <p class="section-description">{getLabel(languageCode, 'information_showSpritesHelp')}</p>
                <ToggleOption
                    label={getLabel(languageCode, 'information_showSprites')}
                    bind:enabled={showSprites}
                />
            </div>

            <!-- Fake Information Section -->
            <div class="settings-section">
                <h3 class="settings-section-title">{getLabel(languageCode, 'information_fakeInformation')}</h3>
                <p class="section-description">{getLabel(languageCode, 'information_fakeInformationHelp')}</p>
                <ToggleOption
                    label={getLabel(languageCode, 'information_fakeInformation')}
                    bind:enabled={enableFakeInformation}
                />
                {#if enableFakeInformation}
                    <div class="mt-4">
                        <Slider
                            label={getLabel(languageCode, 'information_fakeInformationRate')}
                            min={1}
                            max={100}
                            bind:value={fakeInformationRate}
                        />
                    </div>
                {/if}
            </div>

            <!-- Time Limit Section (for non-hardcore modes) -->
            {#if gameMode !== 'hardcore'}
                <div class="settings-section">
                    <h3 class="settings-section-title">{getLabel(languageCode, 'timeManagement')}</h3>
                    <p class="section-description">{getLabel(languageCode, 'timeManagementDescription')}</p>
                    <ToggleOption
                        label={getLabel(languageCode, 'timeLimit')}
                        bind:enabled={hasTimeLimit}
                    />
                    {#if hasTimeLimit}
                        <div class="ml-8">
                            <Slider
                                label={getLabel(languageCode, 'timeSeconds')}
                                min={5}
                                max={60}
                                bind:value={timeLimit}
                            />
                        </div>
                    {/if}
                </div>
            {/if}
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
        @apply bg-white rounded-lg shadow-lg p-8;
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

    .error-text {
        @apply text-sm text-red-500 font-semibold mt-2;
    }

    .game-modes {
        @apply space-y-3;
    }

    .game-mode-option {
        @apply flex gap-3 cursor-pointer p-4 border border-gray-200 rounded-lg transition-colors items-start;
        position: relative;
    }

    .game-mode-option:hover {
        @apply bg-blue-50 border-blue-300;
    }

    .game-mode-option input {
        @apply w-4 h-4 accent-blue-500 cursor-pointer flex-shrink-0 mt-1;
    }

    .mode-content {
        @apply flex-1 flex flex-col;
    }

    .mode-name {
        @apply font-semibold text-gray-800 block;
    }

    .mode-description {
        @apply text-sm text-gray-600 block mt-1;
    }

    .tooltip-container {
        @apply relative flex-shrink-0;
    }

    .tooltip-icon {
        @apply text-lg cursor-help;
    }

    .tooltip-box {
        @apply absolute right-0 top-full mt-2 bg-gray-900 text-white p-3 rounded-lg shadow-lg z-50;
        @apply text-xs whitespace-nowrap min-w-max opacity-0 pointer-events-none transition-opacity duration-200;
        width: 220px;
        white-space: normal;
    }

    .tooltip-container:hover .tooltip-box {
        @apply opacity-100;
    }

    .tooltip-title {
        @apply font-bold block mb-2 text-sm;
    }

    .tooltip-line {
        @apply block mb-1 text-xs;
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
        @apply text-gray-700;
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

    .ml-8 {
        margin-left: 2rem;
    }
</style>
