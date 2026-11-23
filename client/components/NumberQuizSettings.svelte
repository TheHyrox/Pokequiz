<script lang="ts">
    /**
     * @brief Number quiz settings configuration panel
     * @description Provides UI for configuring Number Quiz options before starting
     */
    import Slider from './Slider.svelte';
    import ToggleOption from './ToggleOption.svelte';
    import GenerationSelector from './quiz/GenerationSelector.svelte';
    import SpriteEffectsSelector from './quiz/SpriteEffectsSelector.svelte';
    import Toast from './Toast.svelte';
    import { getLabel } from '../src/lib/translations';
    import { createToastHandlers } from '../src/lib/toastUtils';
    import { ALL_GENERATIONS, DEFAULT_NUMBER_QUIZ_SETTINGS } from '../../shared/constants';
    import { saveNumberSettings } from '../src/lib/storage';
    import type { NumberQuizSettings, NumberQuizSubMode, SpriteEffectSettings, ToastState } from '../../shared/types';

    /** Callback when quiz starts with settings */
    export let onStartQuiz: (settings: NumberQuizSettings) => void;
    /** Current language code for translations */
    export let languageCode: string = 'en';
    /** Initial settings from cache (or null if new game) */
    export let initialSettings: NumberQuizSettings | null = null;

    const defaults = DEFAULT_NUMBER_QUIZ_SETTINGS;

    let subMode: NumberQuizSubMode = initialSettings?.subMode ?? defaults.subMode;
    let hasGuessLimit: boolean = initialSettings?.hasGuessLimit ?? defaults.hasGuessLimit;
    let guessLimit: number = initialSettings?.guessLimit ?? defaults.guessLimit;
    let selectedGenerations: Set<number> = new Set(initialSettings?.selectedGenerations ?? ALL_GENERATIONS);
    let showHigherLower: boolean = initialSettings?.showHigherLower ?? defaults.showHigherLower;
    let effects: SpriteEffectSettings = {
        blurEnabled: initialSettings?.blurEnabled ?? defaults.blurEnabled,
        blurStrength: initialSettings?.blurStrength ?? defaults.blurStrength,
        pixelateEnabled: initialSettings?.pixelateEnabled ?? defaults.pixelateEnabled,
        pixelateStrength: initialSettings?.pixelateStrength ?? defaults.pixelateStrength,
        silhouetteEnabled: initialSettings?.silhouetteEnabled ?? defaults.silhouetteEnabled,
        rotationEnabled: initialSettings?.rotationEnabled ?? defaults.rotationEnabled
    };

    let toastState: ToastState = {
        message: '',
        type: 'info',
        show: false
    };

    const { showErrorToast } = createToastHandlers((state: ToastState) => {
        toastState = state;
    });

    function handleStartQuiz(): void {
        if (selectedGenerations.size === 0) {
            showErrorToast(getLabel(languageCode, 'selectAtLeastOneGeneration'));
            return;
        }

        const settings: NumberQuizSettings = {
            subMode,
            hasGuessLimit,
            guessLimit,
            selectedGenerations: Array.from(selectedGenerations),
            showHigherLower,
            blurEnabled: effects.blurEnabled,
            blurStrength: effects.blurStrength,
            pixelateEnabled: effects.pixelateEnabled,
            pixelateStrength: effects.pixelateStrength,
            silhouetteEnabled: effects.silhouetteEnabled,
            rotationEnabled: effects.rotationEnabled
        };
        saveNumberSettings(settings);
        onStartQuiz(settings);
    }

    function l(key: string): string {
        return getLabel(languageCode, key as any);
    }
</script>

<div class="settings-container">
    <div class="settings-grid">
        <!-- LEFT COLUMN: Game Modes & Rules -->
        <div class="settings-column">
            <div class="settings-section">
                <h3 class="settings-section-title">{l('number_subMode')}</h3>
                <p class="section-description">{getLabel(languageCode, 'gameModeDescription')}</p>
                <div class="game-mode-options">
                    <label class="radio-label">
                        <input
                            type="radio"
                            name="numberSubMode"
                            value="normal"
                            bind:group={subMode}
                            class="radio-input"
                        />
                        <span class="radio-text">{l('number_subModeNormal')}</span>
                        <span class="radio-description">{l('number_normalModeDescription')}</span>
                    </label>
                    <label class="radio-label">
                        <input
                            type="radio"
                            name="numberSubMode"
                            value="points"
                            bind:group={subMode}
                            class="radio-input"
                        />
                        <span class="radio-text">{l('number_subModePoints')}</span>
                        <span class="radio-description">{l('number_pointsModeDescription')}</span>
                    </label>
                </div>
            </div>

            {#if subMode === 'normal'}
                <!-- Guess Limit Section -->
                <div class="settings-section">
                    <h3 class="settings-section-title">{l('number_guessLimit')}</h3>
                    <ToggleOption
                        label={hasGuessLimit ? l('number_limitedMode') : l('number_unlimitedMode')}
                        bind:enabled={hasGuessLimit}
                    />
                    {#if hasGuessLimit}
                        <div class="ml-8">
                            <Slider
                                label={l('number_guessLimit')}
                                bind:value={guessLimit}
                                min={5}
                                max={10}
                                step={1}
                            />
                        </div>
                    {/if}
                </div>

                <!-- Show Higher/Lower Section -->
                <div class="settings-section">
                    <h3 class="settings-section-title">{l('number_showHigherLower')}</h3>
                    <ToggleOption
                        label={l('number_showHigherLower')}
                        bind:enabled={showHigherLower}
                    />
                </div>
            {:else}
                <!-- Points Mode Info Box -->
                <div class="settings-section">
                    <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-sm space-y-2">
                        <div class="font-semibold flex items-center gap-2">
                            <span>ℹ️</span> {l('number_subModePoints')} (10 Rounds)
                        </div>
                        <p class="text-xs leading-relaxed text-blue-800">
                            • {l('number_pointsRule1')}<br />
                            • {l('number_pointsRule2')}<br />
                            • {l('number_pointsRule3')}
                        </p>
                    </div>
                </div>
            {/if}
        </div>

        <!-- VERTICAL SEPARATOR -->
        <div class="separator hidden md:block"></div>

        <!-- RIGHT COLUMN: Generations & Sprite Effects -->
        <div class="settings-column">
            <!-- Pokemon Generations Section -->
            <GenerationSelector {languageCode} bind:selectedGenerations />

            <!-- Sprite Effects Selector (shared with Sprite Quiz) -->
            <div class="settings-section">
                <SpriteEffectsSelector
                    {languageCode}
                    bind:effects
                    spriteSource="home"
                    selectedSpriteTypes={['front']}
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
        @apply flex flex-col md:flex-row gap-8 mb-8;
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
        @apply transition-colors duration-200;
    }

    .start-button:hover {
        @apply bg-blue-600;
    }

    .start-button:active {
        @apply bg-blue-700;
    }

    .ml-8 {
        margin-left: 2rem;
    }
</style>
