<script lang="ts">
    import Slider from './Slider.svelte';
    import ToggleOption from './ToggleOption.svelte';
    import { getLabel } from '../src/lib/translations';
    import { createToastHandlers, type ToastState } from '../src/lib/toastUtils';
    import Toast from '../components/Toast.svelte';

    export let onStartQuiz: (settings: QuizSettings) => void;
    export let languageCode: string = 'en';

    interface QuizSettings {
        hasTimeLimit: boolean;
        timeLimit: number;
        gameMode: 'score' | 'infinite' | 'challenge' | 'hardcore';
        changeDescription: boolean;
        selectedGenerations: number[];
        truncateStrength: number;
        enableScramble: boolean;
    }

    let timeLimit = 15;
    let hasTimeLimit = false;
    let gameMode: 'score' | 'infinite' | 'challenge' | 'hardcore' = 'score';
    let changeDescription = false;
    let selectedGenerations: Set<number> = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    let truncateStrength: number = 0;
    let enableScramble: boolean = false;

    let toastState: ToastState = {
        message: '',
        type: 'info',
        show: false
    };

    const { showErrorToast } = createToastHandlers((state: ToastState) => {
        toastState = state;
    });

    const generations = [
        { id: 1, label: 'Gen 1' },
        { id: 2, label: 'Gen 2' },
        { id: 3, label: 'Gen 3' },
        { id: 4, label: 'Gen 4' },
        { id: 5, label: 'Gen 5' },
        { id: 6, label: 'Gen 6' },
        { id: 7, label: 'Gen 7' },
        { id: 8, label: 'Gen 8' },
        { id: 9, label: 'Gen 9' }
    ];

    function toggleGeneration(genId: number) {
        if (selectedGenerations.has(genId)) {
            selectedGenerations.delete(genId);
        } else {
            selectedGenerations.add(genId);
        }
        selectedGenerations = selectedGenerations;
    }

    function selectAllGenerations() {
        selectedGenerations = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    }

    function deselectAllGenerations() {
        selectedGenerations = new Set();
    }

    function handleStartQuiz() {
        if (selectedGenerations.size === 0) {
            showErrorToast(getLabel(languageCode, 'selectAtLeastOneGeneration') || 'Please select at least one generation');
            return;
        }

        const finalSettings: QuizSettings = {
            hasTimeLimit,
            timeLimit,
            gameMode,
            changeDescription,
            selectedGenerations: Array.from(selectedGenerations),
            truncateStrength,
            enableScramble
        };
        onStartQuiz(finalSettings);
    }

</script>

<div class="settings-container">
    <div class="settings-grid">
        <!-- LEFT COLUMN: Game Modes -->
        <div class="settings-column">
            <div class="settings-section">
                <h3 class="settings-section-title">{getLabel(languageCode, 'gameMode')}</h3>
                <p class="section-description">{getLabel(languageCode, 'gameModeDescription') || 'Choose how you want to play'}</p>
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
                    <label class="radio-label">
                        <input
                            type="radio"
                            name="gameMode"
                            value="hardcore"
                            bind:group={gameMode}
                            class="radio-input"
                        />
                        <span class="radio-text">{getLabel(languageCode, 'hardcoreMode')}</span>
                        <span class="radio-description">{getLabel(languageCode, 'typeThePokemonName')}</span>
                    </label>
                </div>
            </div>
        </div>

        <!-- VERTICAL SEPARATOR -->
        <div class="separator"></div>

        <!-- RIGHT COLUMN: Game Options -->
        <div class="settings-column">
            <!-- Time Management Section -->
            <div class="settings-section">
                <h3 class="settings-section-title">{getLabel(languageCode, 'timeManagement')}</h3>
                <p class="section-description">{getLabel(languageCode, 'timeManagementDescription') || 'Set a time limit for answering questions'}</p>
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
                    label={getLabel(languageCode, 'enableChangeDescription') || 'Enable'}
                    bind:enabled={changeDescription}
                />
            </div>

            <!-- Pokemon Generations Section -->
            <div class="settings-section">
                <h3 class="settings-section-title">{getLabel(languageCode, 'pokemonGenerations') || 'Pokemon Generations'}</h3>
                <p class="section-description">{getLabel(languageCode, 'chooseGenerationsDescription') || 'Select which Pokemon generations you want to play with'}</p>
                <div class="generation-buttons">
                    <button on:click={selectAllGenerations} class="select-button select-all">
                        {getLabel(languageCode, 'selectAll') || 'Select All'}
                    </button>
                    <button on:click={deselectAllGenerations} class="select-button deselect-all">
                        {getLabel(languageCode, 'deselectAll') || 'Deselect All'}
                    </button>
                </div>
                <div class="generation-grid">
                    {#each generations as gen (gen.id)}
                        <label class="generation-checkbox">
                            <input
                                type="checkbox"
                                checked={selectedGenerations.has(gen.id)}
                                on:change={() => toggleGeneration(gen.id)}
                                class="checkbox-input"
                            />
                            <span class="checkbox-label">{gen.label}</span>
                        </label>
                    {/each}
                </div>
            </div>

            <!-- Description Effects Section -->
            <div class="settings-section">
                <!-- Truncate Description -->
                    <h3 class="settings-section-title">{getLabel(languageCode, 'truncateDescription') || 'Truncate Description'}</h3>
                    <p class="strength-value">{truncateStrength === 0 ? '0' : `${truncateStrength}/3`} word is truncated</p>
                    <Slider 
                        label={getLabel(languageCode, 'truncateStrength') || 'Truncate Strength'}
                        min={0}
                        max={3}
                        bind:value={truncateStrength}
                    />

                    <!-- Scramble Description -->
                    <h3 class="settings-section-title">{getLabel(languageCode, 'scrambleDescription') || 'Scramble Description'}</h3>
                    <p class="section-description">{getLabel(languageCode, 'scrambleDescriptionInfo') || 'Words are randomly reordered using different algorithms'}</p>
                    <input
                        type="checkbox"
                        bind:checked={enableScramble}
                        class="toggle-input"
                    />
                    <span class="toggle-label">{getLabel(languageCode, 'scrambleDescription') || 'Scramble Description'}</span>
            </div>
        </div>
    </div>

    <!-- Start Button -->
    <button 
        on:click={handleStartQuiz}
        class="start-button"
    >
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

    .section-description {
        @apply text-sm text-gray-600 mb-4 italic;
    }

    .generation-buttons {
        @apply flex gap-3 mb-4;
    }

    .select-button {
        @apply px-4 py-2 border-2 rounded-lg font-medium transition-all cursor-pointer text-sm;
    }

    .select-all {
        @apply border-green-500 text-green-600;
    }

    .select-all:hover {
        @apply bg-green-50;
    }

    .deselect-all {
        @apply border-red-500 text-red-600;
    }

    .deselect-all:hover {
        @apply bg-red-50;
    }

    .generation-grid {
        @apply grid grid-cols-2 gap-2;
    }

    .generation-checkbox {
        @apply flex items-center p-2 border-2 border-gray-200 rounded-lg cursor-pointer transition-all text-sm;
    }

    .generation-checkbox:hover {
        @apply border-blue-400 bg-blue-50;
    }

    .generation-checkbox:has(input:checked) {
        @apply border-blue-500 bg-blue-50;
    }

    .checkbox-input {
        @apply w-4 h-4 accent-blue-500 cursor-pointer mr-3 flex-shrink-0;
    }

    .checkbox-label {
        @apply text-gray-700 font-medium;
    }

    .effect-option {
        @apply mb-4 p-4 border-2 border-gray-200 rounded-lg transition-all;
    }

    .effect-label {
        @apply flex justify-between items-center font-medium text-gray-700 mb-3;
    }

    .strength-value {
        @apply text-sm text-blue-600 font-semibold;
    }

    .effect-description {
        @apply text-sm text-gray-600 ml-0 mt-2 p-2 bg-gray-50 rounded;
    }

    .effect-toggle {
        @apply flex items-center cursor-pointer p-3 border-2 border-gray-200 rounded-lg transition-all;
    }

    .effect-toggle:hover {
        @apply border-blue-400 bg-blue-50;
    }

    .effect-toggle:has(input:checked) {
        @apply border-blue-500 bg-blue-50;
    }

    .toggle-input {
        @apply w-4 h-4 accent-blue-500 cursor-pointer mr-3 flex-shrink-0;
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
</style>
