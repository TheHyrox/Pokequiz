<script lang="ts">
    /**
     * @brief Quiz header component
     * @description Displays quiz title, score, question counter, and back button
     */
    import { getLabel } from '../../src/lib/translations';
    import type { GameMode } from '../../../shared/types';
    import { CHALLENGE_QUESTION_COUNT } from '../../../shared/constants';

    /** Current language code for translations */
    export let languageCode: string;
<<<<<<< HEAD
=======
    /** Quiz title label key for getLabel() */
    export let quizTitleLabel: string = 'description_quiz';
>>>>>>> main
    /** Current game mode */
    export let gameMode: GameMode;
    /** Current question number */
    export let currentQuestion: number;
    /** Total number of questions */
    export let totalQuestions: number;
    /** Current score */
    export let score: number;
    /** Callback when back button is clicked */
    export let onBackToHub: () => void;
<<<<<<< HEAD
=======

    /**
     * @brief Get the quiz title with proper type casting
     */
    function getQuizTitle(): string {
        return getLabel(languageCode, quizTitleLabel as string);
    }
>>>>>>> main
</script>

<div class="header">
    <div>
<<<<<<< HEAD
        <h1 class="title">Pokequiz - {getLabel(languageCode, 'descriptionQuiz')}</h1>
=======
        <h1 class="title">Pokequiz - {getQuizTitle()}</h1>
>>>>>>> main
        {#if gameMode === 'infinite'}
            <p class="subtitle">
                {getLabel(languageCode, 'score')}: {score} | {getLabel(languageCode, 'infiniteModeLabel')}
            </p>
        {:else if gameMode === 'challenge'}
            <p class="subtitle">
                {getLabel(languageCode, 'question')} {currentQuestion}/{CHALLENGE_QUESTION_COUNT}
            </p>
        {:else if gameMode === 'hardcore'}
            <p class="subtitle">
                {getLabel(languageCode, 'question')} {currentQuestion}/{CHALLENGE_QUESTION_COUNT} | {getLabel(languageCode, 'score')}: {score}
            </p>
        {:else}
            <p class="subtitle">
                {getLabel(languageCode, 'question')} {currentQuestion}/{totalQuestions} | {getLabel(languageCode, 'score')}: {score}
            </p>
        {/if}
    </div>
    <button on:click={onBackToHub} class="back-button">
        {getLabel(languageCode, 'back')}
    </button>
</div>

<style lang="postcss">
    .header {
<<<<<<< HEAD
        @apply flex justify-between items-center mb-8;
=======
        @apply flex justify-between items-start mb-8 gap-4;
>>>>>>> main
    }

    .title {
        @apply text-4xl font-bold text-gray-800 mb-2;
    }

    .subtitle {
        @apply text-lg text-gray-600;
    }

    .back-button {
<<<<<<< HEAD
        @apply px-4 py-2 bg-gray-500 text-white rounded-lg transition-colors;
=======
        @apply px-4 py-2 bg-gray-500 text-white rounded-lg transition-colors flex-shrink-0 whitespace-nowrap;
        margin-top: 0.25rem;
>>>>>>> main
    }
    
    .back-button:hover {
        @apply bg-gray-600;
    }
</style>
