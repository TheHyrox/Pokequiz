<script lang="ts">
    /**
     * @brief Shiny vs. Normal Quiz settings configuration panel
     * @description Reuses GameModeSelector, GenerationSelector, SpriteSourceSelector, Slider, ToggleOption, and NumberStepper
     */
    import Slider from './Slider.svelte';
    import ToggleOption from './ToggleOption.svelte';
    import NumberStepper from './NumberStepper.svelte';
    import GameModeSelector from './quiz/GameModeSelector.svelte';
    import GenerationSelector from './quiz/GenerationSelector.svelte';
    import SpriteSourceSelector from './quiz/SpriteSourceSelector.svelte';
    import Toast from './Toast.svelte';
    import { getLabel } from '../src/lib/translations';
    import { createToastHandlers } from '../src/lib/toastUtils';
    import { buildShareableQuizUrl } from '../src/lib/urlSettings';
    import { ALL_GENERATIONS, DEFAULT_SHINY_QUIZ_SETTINGS } from '../../shared/constants';
    import type { ShinyQuizSettings, ShinyQuizVariant, SpriteSource, GameMode, ToastState } from '../../shared/types';

    /** Callback when quiz starts with settings */
    export let onStartQuiz: (settings: ShinyQuizSettings) => void;
    /** Current language code for translations */
    export let languageCode: string = 'en';
    /** Initial settings from cache (or null if new game) */
    export let initialSettings: ShinyQuizSettings | null = null;

    const defaults = DEFAULT_SHINY_QUIZ_SETTINGS;

    let variant: ShinyQuizVariant = initialSettings?.variant ?? defaults.variant;
    let gameMode: GameMode = initialSettings?.gameMode ?? defaults.gameMode;
    let hasTimeLimit: boolean = initialSettings?.hasTimeLimit ?? defaults.hasTimeLimit;
    let timeLimit: number = initialSettings?.timeLimit ?? defaults.timeLimit;
    let selectedGenerations: Set<number> = new Set(initialSettings?.selectedGenerations ?? ALL_GENERATIONS);
    let spriteSource: SpriteSource = initialSettings?.spriteSource ?? defaults.spriteSource;
    let numberOfFakes: number = initialSettings?.numberOfFakes ?? defaults.numberOfFakes;
    let showPokemonName: boolean = initialSettings?.showPokemonName ?? defaults.showPokemonName;
    let showNormalReference: boolean = initialSettings?.showNormalReference ?? defaults.showNormalReference;

    let toastState: ToastState = {
        message: '',
        type: 'info',
        show: false
    };

    $: if (gameMode === 'hardcore') {
        hasTimeLimit = false;
    }

    const { showErrorToast, showSuccessToast } = createToastHandlers((state: ToastState) => {
        toastState = state;
    });

    function buildCurrentSettings(): ShinyQuizSettings {
        return {
            variant,
            gameMode,
            hasTimeLimit,
            timeLimit,
            selectedGenerations: Array.from(selectedGenerations),
            spriteSource,
            numberOfFakes,
            showPokemonName,
            showNormalReference
        };
    }

    async function handleShareSettings(): Promise<void> {
        if (selectedGenerations.size === 0) {
            showErrorToast(getLabel(languageCode, 'selectAtLeastOneGeneration'));
            return;
        }
        const url = buildShareableQuizUrl('shiny', buildCurrentSettings(), false);
        if (typeof window !== 'undefined') {
            window.history.replaceState(window.history.state, '', url);
            try {
                await navigator.clipboard?.writeText(url);
            } catch {}
        }
        showSuccessToast(getLabel(languageCode, 'shareLinkCopied'));
    }

    function handleStartQuiz(): void {
        if (selectedGenerations.size === 0) {
            showErrorToast(getLabel(languageCode, 'selectAtLeastOneGeneration'));
            return;
        }
        onStartQuiz(buildCurrentSettings());
    }
</script>

<div class="settings-container">
    <div class="settings-grid">
        <!-- LEFT COLUMN: Quiz Variant & Game Mode -->
        <div class="settings-column">
            <!-- Shiny Variant Selector -->
            <div class="settings-section shiny-variant-selector">
                <h3 class="settings-section-title">{getLabel(languageCode, 'shiny_variantHeader')}</h3>
                <p class="section-description">{getLabel(languageCode, 'shiny_variantDescription')}</p>
                <div class="variant-options space-y-3">
                    <label class="variant-radio-label">
                        <input
                            type="radio"
                            name="shinyVariant"
                            value="binary"
                            bind:group={variant}
                            class="radio-input"
                        />
                        <span class="radio-text">✨ {getLabel(languageCode, 'shiny_variantBinary')}</span>
                        <span class="radio-description">{getLabel(languageCode, 'shiny_variantBinaryDesc')}</span>
                    </label>
                    <label class="variant-radio-label">
                        <input
                            type="radio"
                            name="shinyVariant"
                            value="spot"
                            bind:group={variant}
                            class="radio-input"
                        />
                        <span class="radio-text">🎨 {getLabel(languageCode, 'shiny_variantSpot')}</span>
                        <span class="radio-description">{getLabel(languageCode, 'shiny_variantSpotDesc')}</span>
                    </label>
                </div>
            </div>

            <!-- Standard Game Modes (Score, Infinite, Challenge, Hardcore) -->
            <GameModeSelector {languageCode} bind:gameMode />
        </div>

        <!-- VERTICAL SEPARATOR -->
        <div class="separator"></div>

        <!-- RIGHT COLUMN: Time, Generations, Sprite Source & Variant Options -->
        <div class="settings-column">
            <!-- Time Management Section -->
            <div class="settings-section">
                <h3 class="settings-section-title">{getLabel(languageCode, 'timeManagement')}</h3>
                <p class="section-description">{getLabel(languageCode, 'timeManagementDescription')}</p>
                <ToggleOption
                    label={getLabel(languageCode, 'timeLimit')}
                    bind:enabled={hasTimeLimit}
                    disabled={gameMode === 'hardcore'}
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

            <!-- Pokemon Generations Section -->
            <GenerationSelector {languageCode} bind:selectedGenerations />

            <!-- Sprite Source Selector (Default uses SPRITE_URLS.SHINY, Home uses HOME_SHINY, Official uses OFFICIAL_SHINY) -->
            <div class="settings-section">
                <SpriteSourceSelector
                    {languageCode}
                    bind:spriteSource
                    allowedSources={['default', 'home', 'official']}
                />
            </div>

            <!-- Variant-specific Options -->
            <div class="settings-section">
                <h3 class="settings-section-title">{getLabel(languageCode, 'gameOptions')}</h3>
                <div class="space-y-4">
                    <ToggleOption
                        label={getLabel(languageCode, 'shiny_showPokemonName')}
                        bind:enabled={showPokemonName}
                    />

                    {#if variant === 'spot'}
                        <ToggleOption
                            label={getLabel(languageCode, 'shiny_showNormalReference')}
                            bind:enabled={showNormalReference}
                        />
                        <div class="pt-2">
                            <p class="section-description">{getLabel(languageCode, 'shiny_numberOfFakesDesc')}</p>
                            <NumberStepper
                                label={getLabel(languageCode, 'shiny_numberOfFakes')}
                                min={4}
                                max={6}
                                bind:value={numberOfFakes}
                            />
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </div>

    <!-- Action Buttons: Start & Share Settings -->
    <div class="flex flex-col sm:flex-row gap-3">
        <button on:click={handleStartQuiz} class="start-button flex-1">
            {getLabel(languageCode, 'startQuiz')}
        </button>
        <button
            type="button"
            on:click={handleShareSettings}
            class="share-settings-btn px-5 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-lg transition-colors cursor-pointer"
        >
            🔗 {getLabel(languageCode, 'shareSettings')}
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
        @apply bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8;
    }

    .settings-grid {
        @apply flex flex-col md:flex-row gap-6 md:gap-8 mb-6 md:mb-8;
    }

    .settings-column {
        @apply flex-1 min-w-0;
    }

    .separator {
        @apply hidden md:block w-px bg-gray-300;
    }

    .settings-section {
        @apply mb-6 md:mb-8;
    }

    .settings-section-title {
        @apply text-lg font-semibold text-gray-700 mb-2;
    }

    .section-description {
        @apply text-sm text-gray-600 mb-4 italic;
    }

    .variant-radio-label {
        @apply flex flex-col p-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer transition-all;
    }

    .variant-radio-label:hover {
        @apply border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/40;
    }

    .variant-radio-label:has(input:checked) {
        @apply border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/60;
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
        margin-left: 1rem;
    }

    @media (min-width: 640px) {
        .ml-8 {
            margin-left: 2rem;
        }
    }
</style>
