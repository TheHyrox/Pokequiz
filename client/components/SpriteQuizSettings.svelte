<script lang="ts">
    /**
     * @brief Sprite quiz settings configuration panel
     * @description Provides UI for configuring sprite quiz options
     */
    import Slider from './Slider.svelte';
    import ToggleOption from './ToggleOption.svelte';
    import NumberStepper from './NumberStepper.svelte';
    import GameModeSelector from './quiz/GameModeSelector.svelte';
    import GenerationSelector from './quiz/GenerationSelector.svelte';
    import SpriteTypeSelector from './quiz/SpriteTypeSelector.svelte';
    import SpriteSourceSelector from './quiz/SpriteSourceSelector.svelte';
    import SpriteEffectsSelector from './quiz/SpriteEffectsSelector.svelte';
    import Toast from './Toast.svelte';
    import { getLabel } from '../src/lib/translations';
    import { createToastHandlers } from '../src/lib/toastUtils';
    import { ALL_GENERATIONS, DEFAULT_SPRITE_EFFECTS } from '../../shared/constants';
    import type { SpriteQuizSettings, GameMode, ToastState, SpriteType, SpriteSource, SpriteEffectSettings } from '../../shared/types';

    /** Callback when quiz starts with settings */
    export let onStartQuiz: (settings: SpriteQuizSettings) => void;
    /** Current language code for translations */
    export let languageCode: string = 'en';
    /** Initial settings from cache (or null if new game) */
    export let initialSettings: SpriteQuizSettings | null = null;

    // Settings state - initialize from cache if available
    let timeLimit = initialSettings?.timeLimit ?? 15;
    let hasTimeLimit = initialSettings?.hasTimeLimit ?? false;
    let gameMode: GameMode = initialSettings?.gameMode ?? 'score';
    let selectedGenerations: Set<number> = new Set(initialSettings?.selectedGenerations ?? ALL_GENERATIONS);
    let selectedSpriteTypes: SpriteType[] = initialSettings?.selectedSpriteTypes ?? ['front'];
    let spriteSource: SpriteSource = initialSettings?.spriteSource ?? 'home';
    let effects: SpriteEffectSettings = initialSettings?.effects ?? { ...DEFAULT_SPRITE_EFFECTS };
    let numberOfOptions: number = initialSettings?.numberOfOptions ?? 4;

    // Reactively update state when initialSettings changes (when returning from quiz)
    $: if (initialSettings) {
        timeLimit = initialSettings.timeLimit ?? 15;
        hasTimeLimit = initialSettings.hasTimeLimit ?? false;
        gameMode = initialSettings.gameMode ?? 'score';
        selectedGenerations = new Set(initialSettings.selectedGenerations ?? ALL_GENERATIONS);
        selectedSpriteTypes = initialSettings.selectedSpriteTypes ?? ['front'];
        spriteSource = initialSettings.spriteSource ?? 'home';
        effects = initialSettings.effects ?? { ...DEFAULT_SPRITE_EFFECTS };
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

        if (selectedSpriteTypes.length === 0) {
            showErrorToast(getLabel(languageCode, 'sprites_selectAtLeastOneSpriteType'));
            return;
        }

        const finalSettings: SpriteQuizSettings = {
            hasTimeLimit,
            timeLimit,
            gameMode,
            selectedGenerations: Array.from(selectedGenerations),
            selectedSpriteTypes,
            spriteSource,
            effects,
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

            <!-- Pokemon Generations Section -->
            <GenerationSelector {languageCode} bind:selectedGenerations />

            <!-- Sprite Type Selector -->
            <div class="settings-section">
                <SpriteTypeSelector {languageCode} bind:selectedSpriteTypes {spriteSource} />
            </div>

            <!-- Sprite Source Selector -->
            <div class="settings-section">
                <SpriteSourceSelector {languageCode} bind:spriteSource />
            </div>

            <!-- Sprite Effects Selector -->
            <div class="settings-section">
                <SpriteEffectsSelector {languageCode} bind:effects {spriteSource} {selectedSpriteTypes} />
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
