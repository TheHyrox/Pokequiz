<script lang="ts">
    import Slider from './Slider.svelte';
    import ToggleOption from './ToggleOption.svelte';

    export let onStartQuiz: (settings: QuizSettings) => void;

    interface QuizSettings {
        hasTimeLimit: boolean;
        timeLimit: number;
        gameMode: 'score' | 'infinite';
        changeDescription: boolean;
    }

    let settings: QuizSettings = {
        hasTimeLimit: false,
        timeLimit: 15,
        gameMode: 'score',
        changeDescription: false
    };

    let timeLimit = 15;
    let hasTimeLimit = false;
    let gameMode: 'score' | 'infinite' = 'score';
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
    <div class="settings-header">
        <h2 class="text-2xl font-bold text-gray-800 mb-6">Game Settings</h2>
    </div>

    <!-- Time Limit Section -->
    <div class="settings-section">
        <h3 class="settings-section-title">Time Management</h3>
        <ToggleOption 
            label="Limite de temps par round" 
            bind:enabled={hasTimeLimit}
        />
        {#if hasTimeLimit}
            <div class="ml-8">
                <Slider 
                    label="Temps limite (secondes)"
                    min={5}
                    max={30}
                    bind:value={timeLimit}
                />
            </div>
        {/if}
    </div>

    <!-- Game Mode Section -->
    <div class="settings-section">
        <h3 class="settings-section-title">Game Mode</h3>
        <div class="game-mode-options">
            <label class="radio-label">
                <input
                    type="radio"
                    name="gameMode"
                    value="score"
                    bind:group={gameMode}
                    class="radio-input"
                />
                <span class="radio-text">Mode Score</span>
                <span class="radio-description">Trouvez du premier coup = plus de points</span>
            </label>
            <label class="radio-label">
                <input
                    type="radio"
                    name="gameMode"
                    value="infinite"
                    bind:group={gameMode}
                    class="radio-input"
                />
                <span class="radio-text">Mode Infini</span>
                <span class="radio-description">Continuez tant que vous ne vous trompez pas (1 point par réussite)</span>
            </label>
        </div>
    </div>

    <!-- Game Options Section -->
    <div class="settings-section">
        <h3 class="settings-section-title">Options de Jeu</h3>
        <ToggleOption 
            label="Changement de description" 
            bind:enabled={changeDescription}
        />
        <p class="option-description">Passez d'une description Pokédex à une autre</p>
    </div>

    <!-- Start Button -->
    <button 
        on:click={handleStartQuiz}
        class="start-button"
    >
        Commencer le Quiz
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
