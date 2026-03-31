<script lang="ts">
    /**
     * @brief Quiz settings configuration panel
     * @description Provides UI for configuring quiz options before starting
     */
    import Slider from './Slider.svelte';
    import ToggleOption from './ToggleOption.svelte';
    import NumberStepper from './NumberStepper.svelte';
    import GameModeSelector from './quiz/GameModeSelector.svelte';
    import GenerationSelector from './quiz/GenerationSelector.svelte';
    import Toast from './Toast.svelte';
    import { getLabel } from '../src/lib/translations';
    import { createToastHandlers } from '../src/lib/toastUtils';
    import { ALL_GENERATIONS } from '../../shared/constants';
    import type { DescriptionQuizSettings, GameMode, ToastState } from '../../shared/types';

    /** Callback when quiz starts with settings */
    export let onStartQuiz: (settings: DescriptionQuizSettings) => void;
    /** Current language code for translations */
    export let languageCode: string = 'en';
    /** Initial settings from cache (or null if new game) */
    export let initialSettings: DescriptionQuizSettings | null = null;

    // Settings state - initialize from cache if available
    let timeLimit = initialSettings?.timeLimit ?? 15;
    let hasTimeLimit = initialSettings?.hasTimeLimit ?? false;
    let gameMode: GameMode = initialSettings?.gameMode ?? 'score';
    let changeDescription = initialSettings?.changeDescription ?? false;
    let selectedGenerations: Set<number> = new Set(initialSettings?.selectedGenerations ?? ALL_GENERATIONS);
    let truncateStrength: number = initialSettings?.truncateStrength ?? 0;
    let enableScramble: boolean = initialSettings?.enableScramble ?? false;
    let numberOfOptions: number = initialSettings?.numberOfOptions ?? 4;

    // Reactively update state when initialSettings changes (when returning from quiz)
    $: if (initialSettings) {
        timeLimit = initialSettings.timeLimit ?? 15;
        hasTimeLimit = initialSettings.hasTimeLimit ?? false;
        gameMode = initialSettings.gameMode ?? 'score';
        changeDescription = initialSettings.changeDescription ?? false;
        selectedGenerations = new Set(initialSettings.selectedGenerations ?? ALL_GENERATIONS);
        truncateStrength = initialSettings.truncateStrength ?? 0;
        enableScramble = initialSettings.enableScramble ?? false;
        numberOfOptions = initialSettings.numberOfOptions ?? 4;
    }

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
     * @brief Validates settings and starts the quiz
     */
    function handleStartQuiz(): void {
        if (selectedGenerations.size === 0) {
            showErrorToast(getLabel(languageCode, 'selectAtLeastOneGeneration'));
            return;
        }

        const finalSettings: DescriptionQuizSettings = {
            hasTimeLimit,
            timeLimit,
            gameMode,
            changeDescription,
            selectedGenerations: Array.from(selectedGenerations),
            truncateStrength,
            enableScramble,
            numberOfOptions
        };
        onStartQuiz(finalSettings);
    }
</script>

<div class="settings-container">
    <div class="settings-grid">
        <!-- LEFT COLUMN: Game Modes -->
        <div class="settings-column">
            <GameModeSelector {languageCode} bind:gameMode />
        </div>

        <!-- VERTICAL SEPARATOR -->
        <div class="separator"></div>

        <!-- RIGHT COLUMN: Game Options -->
        <div class="settings-column">
            <!-- Time Management Section -->
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
                            max={30}
                            bind:value={timeLimit}
                        />
                    </div>
                {/if}
            </div>

            <!-- Change Description Section -->
            <div class="settings-section">
                <h3 class="settings-section-title">{getLabel(languageCode, 'changeDescription')}</h3>
                <p class="section-description">{getLabel(languageCode, 'multipleDescriptions')}</p>
                <ToggleOption
                    label={getLabel(languageCode, 'enableChangeDescription')}
                    bind:enabled={changeDescription}
                />
            </div>

            <!-- Pokemon Generations Section -->
            <GenerationSelector {languageCode} bind:selectedGenerations />

            <!-- Description Effects Section -->
            <div class="settings-section">
                <!-- Truncate Description -->
                <h3 class="settings-section-title">{getLabel(languageCode, 'truncateDescription')}</h3>
                <p class="strength-value">
                    {getLabel(languageCode, 'truncateStrengthHelp')}
                </p>
                <Slider
                    label={getLabel(languageCode, 'truncateStrength')}
                    min={0}
                    max={3}
                    bind:value={truncateStrength}
                />

                <!-- Scramble Description -->
                <h3 class="settings-section-title mt-6">{getLabel(languageCode, 'scrambleDescription')}</h3>
                <p class="section-description">{getLabel(languageCode, 'scrambleDescriptionInfo')}</p>
                <label class="scramble-toggle">
                    <input
                        type="checkbox"
                        bind:checked={enableScramble}
                        class="toggle-input"
                    />
                    <span class="toggle-label">{getLabel(languageCode, 'scrambleDescription')}</span>
                </label>
            </div>

            <!-- Number of Pokemon Options Section -->
            <div class="settings-section">
                <h3 class="settings-section-title">{getLabel(languageCode, 'numberOfPokemonOptions') || 'Number of Options'}</h3>
                <p class="section-description">{getLabel(languageCode, 'pokemonOptionsDescription') || 'Choose how many Pokemon options to display per question'}</p>
                <NumberStepper
                    label={getLabel(languageCode, 'pokemonOptions') || 'Options'}
                    min={2}
                    max={24}
                    bind:value={numberOfOptions}
                />
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

    .strength-value {
        @apply text-sm text-blue-600 font-semibold mb-2;
    }

    .scramble-toggle {
        @apply flex items-center gap-3 cursor-pointer;
    }

    .toggle-input {
        @apply w-4 h-4 accent-blue-500 cursor-pointer;
    }

    .toggle-label {
        @apply font-medium text-gray-700;
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

    .mt-6 {
        margin-top: 1.5rem;
    }

    .ml-8 {
        margin-left: 2rem;
    }
</style>
