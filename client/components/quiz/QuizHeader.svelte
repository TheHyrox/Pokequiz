<script lang="ts">
    /**
     * @brief Quiz header component
     * @description Displays quiz title, score, question counter, and back button
     */
    import { getLabel, type LabelKey } from '../../src/lib/translations';
    import type { GameMode } from '../../../shared/types';
    import { CHALLENGE_QUESTION_COUNT } from '../../../shared/constants';

    /** Current language code for translations */
    export let languageCode: string;
    /** Quiz title label key for getLabel() */
    export let quizTitleLabel: LabelKey = 'description_quiz';
    /** Current game mode */
    export let gameMode: GameMode;
    /** Current question number */
    export let currentQuestion: number;
    /** Total number of questions */
    export let totalQuestions: number;
    /** Current score */
    export let score: number = 0;
    /** Optional custom subtitle override */
    export let customSubtitle: string = '';
    /** Callback when back button is clicked */
    export let onBackToHub: () => void;

    /**
     * @brief Get the quiz title
     */
    function getQuizTitle(): string {
        return getLabel(languageCode, quizTitleLabel);
    }
</script>

<div class="header">
    <button on:click={onBackToHub} class="back-button">
        {getLabel(languageCode, 'back')}
    </button>
    <div class="flex-1">
        <h1 class="title">Pokequiz - {getQuizTitle()}</h1>
        {#if customSubtitle}
            <p class="subtitle">{customSubtitle}</p>
        {:else if gameMode === 'infinite'}
            <p class="subtitle">
                {getLabel(languageCode, 'score')}: {score} | {getLabel(languageCode, 'infiniteModeLabel')}
            </p>
        {:else if gameMode === 'challenge'}
            <p class="subtitle">
                {getLabel(languageCode, 'question')} {currentQuestion}/{CHALLENGE_QUESTION_COUNT}
            </p>
        {:else if gameMode === 'hardcore'}
            <p class="subtitle">
                {getLabel(languageCode, 'question')} {currentQuestion} | {getLabel(languageCode, 'score')}: {score}
            </p>
        {:else}
            <p class="subtitle">
                {getLabel(languageCode, 'question')} {currentQuestion}/{totalQuestions} | {getLabel(languageCode, 'score')}: {score}
            </p>
        {/if}
    </div>
</div>

<style lang="postcss">
    .header {
        @apply flex flex-col sm:flex-row justify-between items-start mb-5 sm:mb-8 gap-3 sm:gap-4 w-full;
    }

    .title {
        @apply text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-1 sm:mb-2 leading-tight;
    }

    .subtitle {
        @apply text-sm sm:text-base md:text-lg text-gray-600;
    }

    .back-button {
        @apply px-3.5 py-1.5 sm:px-4 sm:py-2 bg-gray-500 text-white rounded-lg transition-colors flex-shrink-0 whitespace-nowrap text-sm sm:text-base;
    }
    
    .back-button:hover {
        @apply bg-gray-600;
    }
</style>