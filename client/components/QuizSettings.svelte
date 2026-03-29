<script lang="ts">
    import Slider from './Slider.svelte';
    import ToggleOption from './ToggleOption.svelte';
    import { getLabel } from '../src/lib/translations';

    export let onStartQuiz: (settings: QuizSettings) => void;
    export let languageCode: string = 'en';

    interface QuizSettings {
        hasTimeLimit: boolean;
        timeLimit: number;
        gameMode: 'score' | 'infinite' | 'challenge';
        changeDescription: boolean;
    }

    let timeLimit = 15;
    let hasTimeLimit = false;
    let gameMode: 'score' | 'infinite' | 'challenge' = 'score';
    let changeDescription = false;

    function handleStartQuiz() {
        const finalSettings: QuizSettings = {
            hasTimeLimit,
            timeLimit,
            gameMode,
            changeDescription
        };
        onStartQuiz(finalSettings);
    }
</script>

<div class="settings-container">

    <!-- Time Limit Section -->
    <div class="settings-section">
        <h3 class="settings-section-title">{getLabel(languageCode, 'timeManagement')}</h3>
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

    <!-- Game Mode Section -->
    <div class="settings-section">
        <h3 class="settings-section-title">{getLabel(languageCode, 'gameMode')}</h3>
        <div class="game-mode-options">
            <label class="radio-label">
                <input
                    type="radio"
                    name="gameMode"
                    value="score"
                    bind:group={gameMode}
                    class="radio-input"
                />
                <span class="radio-text">{getLabel(languageCode, 'scoreMode')}</span>
                <span class="radio-description">{getLabel(languageCode, 'scoreFirst')}</span>
            </label>
            <label class="radio-label">
                <input
                    type="radio"
                    name="gameMode"
                    value="infinite"
                    bind:group={gameMode}
                    class="radio-input"
                />
                <span class="radio-text">{getLabel(languageCode, 'infiniteMode')}</span>
                <span class="radio-description">{getLabel(languageCode, 'continueUntilWrong')}</span>
            </label>
            <label class="radio-label">
                <input
                    type="radio"
                    name="gameMode"
                    value="challenge"
                    bind:group={gameMode}
                    class="radio-input"
                />
                <span class="radio-text">{getLabel(languageCode, 'challengeMode')}</span>
                <span class="radio-description">{getLabel(languageCode, 'tenQuestionsChallenge')}</span>
            </label>
        </div>
    </div>

    <!-- Game Options Section -->
    <div class="settings-section">
        <h3 class="settings-section-title">{getLabel(languageCode, 'gameOptions')}</h3>
        <ToggleOption 
            label={getLabel(languageCode, 'changeDescription')}
            bind:enabled={changeDescription}
        />
        <p class="option-description">{getLabel(languageCode, 'multipleDescriptions')}</p>
    </div>

    <!-- Start Button -->
    <button 
        on:click={handleStartQuiz}
        class="start-button"
    >
        {getLabel(languageCode, 'startQuiz')}
    </button>
</div>

<style lang="postcss">
    .settings-container {
        @apply bg-white rounded-lg shadow-lg p-8 max-w-xl;
    }

    .settings-header {
        @apply border-b border-gray-200 pb-6 mb-6;
    }

    .settings-section {
        @apply mb-8;
    }

    .settings-section-title {
        @apply text-lg font-semibold text-gray-700 mb-4;
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

    .option-description {
        @apply text-sm text-gray-500 ml-8 mt-2;
    }

    .start-button {
        @apply w-full bg-blue-500 text-white font-bold py-3 px-4 rounded-lg;
        @apply transition-colors duration-200 mt-8;
    }

    .start-button:hover {
        @apply bg-blue-600;
    }

    .start-button:active {
        @apply bg-blue-700;
    }
</style>
