<script lang="ts">
    /**
     * @brief Zoomed / Cropped Sprite Quiz settings configuration panel
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
    import { ALL_GENERATIONS, DEFAULT_ZOOM_QUIZ_SETTINGS } from '../../shared/constants';
    import type { ZoomQuizSettings, ZoomArtworkSource, SpriteSource, GameMode, ToastState } from '../../shared/types';

    /** Callback when quiz starts with settings */
    export let onStartQuiz: (settings: ZoomQuizSettings) => void;
    /** Current language code for translations */
    export let languageCode: string = 'en';
    /** Initial settings from cache (or null if new game) */
    export let initialSettings: ZoomQuizSettings | null = null;

    const defaults = DEFAULT_ZOOM_QUIZ_SETTINGS;

    let timeLimit: number = initialSettings?.timeLimit ?? defaults.timeLimit;
    let hasTimeLimit: boolean = initialSettings?.hasTimeLimit ?? defaults.hasTimeLimit;
    let gameMode: GameMode = initialSettings?.gameMode ?? defaults.gameMode;
    let selectedGenerations: Set<number> = new Set(initialSettings?.selectedGenerations ?? ALL_GENERATIONS);
    let spriteSource: SpriteSource = (initialSettings?.spriteSource ?? defaults.spriteSource) as SpriteSource;
    let initialCropSize: number = initialSettings?.initialCropSize ?? defaults.initialCropSize;
    let zoomStep: number = initialSettings?.zoomStep ?? defaults.zoomStep;
    let allowManualHints: boolean = initialSettings?.allowManualHints ?? defaults.allowManualHints;
    let numberOfOptions: number = initialSettings?.numberOfOptions ?? defaults.numberOfOptions;

    let toastState: ToastState = {
        message: '',
        type: 'info',
        show: false
    };

    $: if (gameMode === 'hardcore') {
        hasTimeLimit = false;
    }

    $: normalizedZoomSource = (spriteSource === 'home' ? 'home' : 'official') as ZoomArtworkSource;

    const { showErrorToast, showSuccessToast } = createToastHandlers((state: ToastState) => {
        toastState = state;
    });

    function buildCurrentSettings(): ZoomQuizSettings {
        return {
            hasTimeLimit,
            timeLimit,
            gameMode,
            selectedGenerations: Array.from(selectedGenerations),
            spriteSource: normalizedZoomSource,
            initialCropSize,
            zoomStep,
            allowManualHints,
            numberOfOptions
        };
    }

    async function handleShareSettings(): Promise<void> {
        if (selectedGenerations.size === 0) {
            showErrorToast(getLabel(languageCode, 'selectAtLeastOneGeneration'));
            return;
        }
        const url = buildShareableQuizUrl('zoom', buildCurrentSettings(), false);
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
        <!-- LEFT COLUMN: Game Modes & Zoom Parameters -->
        <div class="settings-column">
            <GameModeSelector {languageCode} bind:gameMode />

            <!-- Zoom & Crop Window Configuration -->
            <div class="settings-section zoom-crop-settings">
                <h3 class="settings-section-title">{getLabel(languageCode, 'zoom_settingsHeader')}</h3>
                <p class="section-description">{getLabel(languageCode, 'zoom_settingsDescription')}</p>

                <div class="mb-4">
                    <Slider
                        label={getLabel(languageCode, 'zoom_initialCropSize')}
                        min={10}
                        max={40}
                        step={5}
                        bind:value={initialCropSize}
                    />
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{getLabel(languageCode, 'zoom_initialCropDescription')}</p>
                </div>

                <div class="mb-4">
                    <Slider
                        label={getLabel(languageCode, 'zoom_zoomStep')}
                        min={10}
                        max={25}
                        step={5}
                        bind:value={zoomStep}
                    />
                </div>

                <ToggleOption
                    label={getLabel(languageCode, 'zoom_allowManualHints')}
                    bind:enabled={allowManualHints}
                />
            </div>
        </div>

        <!-- VERTICAL SEPARATOR -->
        <div class="separator"></div>

        <!-- RIGHT COLUMN: Time, Generations, Artwork Source & Options -->
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

            <!-- Artwork Source Selector (OFFICIAL or HOME) -->
            <div class="settings-section">
                <SpriteSourceSelector
                    {languageCode}
                    bind:spriteSource
                    allowedSources={['official', 'home']}
                />
            </div>

            <!-- Number of Pokemon Options Section -->
            {#if gameMode !== 'hardcore'}
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
            {/if}
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
