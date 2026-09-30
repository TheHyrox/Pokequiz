<script lang="ts">
    import Slider from './Slider.svelte';
    import ToggleOption from './ToggleOption.svelte';
    import GenerationSelector from './quiz/GenerationSelector.svelte';
    import Toast from './Toast.svelte';
    import { getLabel } from '../src/lib/translations';
    import { createToastHandlers } from '../src/lib/toastUtils';
    import { ALL_GENERATIONS, DEFAULT_NUMBER_QUIZ_SETTINGS } from '../../shared/constants';
    import { saveNumberSettings } from '../src/lib/storage';
    import type { NumberQuizSettings, NumberQuizSubMode, ToastState } from '../../shared/types';

    export let onStartQuiz: (settings: NumberQuizSettings) => void;
    export let languageCode: string = 'en';
    export let initialSettings: NumberQuizSettings | null = null;

    const defaults = DEFAULT_NUMBER_QUIZ_SETTINGS;

    let subMode: NumberQuizSubMode = initialSettings?.subMode ?? defaults.subMode;
    let hasGuessLimit: boolean = initialSettings?.hasGuessLimit ?? defaults.hasGuessLimit;
    let guessLimit: number = initialSettings?.guessLimit ?? defaults.guessLimit;
    let selectedGenerations: Set<number> = new Set(initialSettings?.selectedGenerations ?? ALL_GENERATIONS);
    let showHigherLower: boolean = initialSettings?.showHigherLower ?? defaults.showHigherLower;
    let blurEnabled: boolean = initialSettings?.blurEnabled ?? defaults.blurEnabled;
    let blurStrength: number = initialSettings?.blurStrength ?? defaults.blurStrength;
    let pixelateEnabled: boolean = initialSettings?.pixelateEnabled ?? defaults.pixelateEnabled;
    let pixelateStrength: number = initialSettings?.pixelateStrength ?? defaults.pixelateStrength;
    let silhouetteEnabled: boolean = initialSettings?.silhouetteEnabled ?? defaults.silhouetteEnabled;
    let rotationEnabled: boolean = initialSettings?.rotationEnabled ?? defaults.rotationEnabled;

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
            blurEnabled,
            blurStrength,
            pixelateEnabled,
            pixelateStrength,
            silhouetteEnabled,
            rotationEnabled
        };
        saveNumberSettings(settings);
        onStartQuiz(settings);
    }

    function l(key: string): string {
        return getLabel(languageCode, key as any);
    }
</script>

<div class="settings-container">
    <div class="settings-grid flex-col md:flex-row">
        <!-- LEFT COLUMN: Game mode & rules -->
        <div class="settings-column">
            <!-- Sub Mode Section -->
            <div class="settings-section">
                <h3 class="settings-section-title">{l('number_subMode')}</h3>
                <div class="mode-tabs">
                    <button
                        class="mode-tab {subMode === 'normal' ? 'active' : ''}"
                        on:click={() => { subMode = 'normal'; }}
                    >
                        🎯 {l('number_subModeNormal')}
                    </button>
                    <button
                        class="mode-tab {subMode === 'points' ? 'active' : ''}"
                        on:click={() => { subMode = 'points'; }}
                    >
                        🏆 {l('number_subModePoints')}
                    </button>
                </div>
                <p class="section-description mt-3">
                    {subMode === 'normal' ? l('number_normalModeDescription') : l('number_pointsModeDescription')}
                </p>
            </div>

            <!-- Normal Mode specific options -->
            {#if subMode === 'normal'}
                <!-- Guess Limit Section -->
                <div class="settings-section">
                    <h3 class="settings-section-title">{l('number_guessLimit')}</h3>
                    <ToggleOption
                        label={hasGuessLimit ? l('number_limitedMode') : l('number_unlimitedMode')}
                        bind:enabled={hasGuessLimit}
                    />
                    {#if hasGuessLimit}
                        <div class="mt-3">
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
                    <ToggleOption
                        label={l('number_showHigherLower')}
                        bind:enabled={showHigherLower}
                    />
                </div>
            {:else}
                <!-- Points Mode Info Box -->
                <div class="settings-section">
                    <div class="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-sm space-y-2">
                        <div class="font-bold flex items-center gap-2">
                            <span>ℹ️</span> {l('number_subModePoints')} (10 Rounds)
                        </div>
                        <p class="text-xs leading-relaxed text-blue-800">
                            • 1 seul essai par Pokémon.<br />
                            • Score de 0 à 1000 points par round calculé selon l'écart.<br />
                            • Score maximum total : 10 000 points.
                        </p>
                    </div>
                </div>
            {/if}
        </div>

        <!-- VERTICAL SEPARATOR -->
        <div class="separator hidden md:block"></div>

        <!-- RIGHT COLUMN: Generations & Sprite Effects -->
        <div class="settings-column">
            <!-- Generation Selector -->
            <GenerationSelector {languageCode} bind:selectedGenerations />

            <!-- Sprite Effects Section -->
            <div class="settings-section">
                <h3 class="settings-section-title">🎨 Effets sur le sprite</h3>

                <!-- Blur -->
                <ToggleOption
                    label={l('number_blurEffect')}
                    bind:enabled={blurEnabled}
                />
                {#if blurEnabled}
                    <div class="mt-2 mb-3">
                        <Slider
                            label={l('number_blurStrength')}
                            bind:value={blurStrength}
                            min={3}
                            max={10}
                            step={1}
                        />
                    </div>
                {/if}

                <!-- Pixelation -->
                <ToggleOption
                    label={l('number_pixelateEffect')}
                    bind:enabled={pixelateEnabled}
                />
                {#if pixelateEnabled}
                    <div class="mt-2 mb-3">
                        <Slider
                            label={l('number_pixelateStrength')}
                            bind:value={pixelateStrength}
                            min={4}
                            max={12}
                            step={1}
                        />
                    </div>
                {/if}

                <!-- Silhouette -->
                <ToggleOption
                    label={l('number_silhouette')}
                    bind:enabled={silhouetteEnabled}
                />

                <!-- Random Rotation -->
                <ToggleOption
                    label={l('number_randomRotation')}
                    bind:enabled={rotationEnabled}
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
        @apply text-lg font-semibold text-gray-700;
        margin-bottom: 0.75rem;
    }

    .section-description {
        @apply text-sm text-gray-600 italic;
    }

    .mode-tabs {
        @apply flex gap-2;
    }

    .mode-tab {
        @apply flex-1 py-2.5 px-3 rounded-lg border-2 border-gray-200 font-semibold text-gray-600 text-sm;
        @apply transition-all duration-200 cursor-pointer bg-white text-center;
    }

    .mode-tab:hover {
        @apply border-blue-400 text-blue-600;
    }

    .mode-tab.active {
        @apply border-blue-500 bg-blue-500 text-white;
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
</style>
