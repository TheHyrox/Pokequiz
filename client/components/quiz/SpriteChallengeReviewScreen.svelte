<script lang="ts">
    /**
     * @brief Sprite challenge review screen component
     * @description Displays sprite quiz results after challenge mode completion
     */
    import { getLabel } from '../../src/lib/translations';
    import type { SpriteChallengeQuestion } from '../../../shared/types';
    import { CHALLENGE_QUESTION_COUNT } from '../../../shared/constants';

    /** Current language code for translations */
    export let languageCode: string;
    /** Array of questions with user answers */
    export let challengeQuestions: SpriteChallengeQuestion[];
    /** Callback when back button is clicked */
    export let onBackToHub: () => void;

    $: correctCount = challengeQuestions.filter(q => q.isCorrect).length;
</script>

<div class="review-container">
    <button on:click={onBackToHub} class="back-button-top">
        {getLabel(languageCode, 'back')}
    </button>

    <div class="summary-card">
        <h2 class="summary-title">{getLabel(languageCode, 'reviewAnswers')}</h2>
        <p class="summary-score">
            {getLabel(languageCode, 'score')}: {correctCount}/{CHALLENGE_QUESTION_COUNT}
        </p>
    </div>

    <div class="questions-list">
        {#each challengeQuestions as question (question.questionNumber)}
            <div class="question-card">
                <h3 class="question-header" class:correct={question.isCorrect} class:incorrect={!question.isCorrect}>
                    {getLabel(languageCode, 'question')} {question.questionNumber}/{CHALLENGE_QUESTION_COUNT}
                </h3>

                <img
                    src={question.isCorrect ? question.originalSpriteUrl : question.spriteUrl}
                    alt="Pokemon sprite"
                    class="sprite-preview"
                />

                <div class="options-grid">
                    {#each question.allOptions as option (option.id)}
                        <div
                            class="option-card"
                            class:option-correct={option.isCorrect}
                            class:option-wrong={option.id === question.userAnswerId && !option.isCorrect}
                            class:option-neutral={!option.isCorrect && option.id !== question.userAnswerId}
                        >
                            <p class="option-name">{option.name}</p>
                            {#if option.isCorrect}
                                <p class="option-label correct-label">✓ {getLabel(languageCode, 'correct')}</p>
                            {/if}
                            {#if option.id === question.userAnswerId && !option.isCorrect}
                                <p class="option-label wrong-label">✗ {getLabel(languageCode, 'yourAnswer')}</p>
                            {/if}
                        </div>
                    {/each}
                </div>
            </div>
        {/each}
    </div>

    <button on:click={onBackToHub} class="back-button-bottom">
        {getLabel(languageCode, 'back')}
    </button>
</div>

<style lang="postcss">
    .review-container {
        @apply w-full;
    }

    .back-button-top {
        @apply mb-6 px-4 py-2 bg-gray-500 text-white rounded-lg transition-colors;
    }

    .back-button-top:hover {
        @apply bg-gray-600;
    }

    .summary-card {
        @apply bg-white rounded-lg shadow-lg p-8 mb-8;
    }

    .summary-title {
        @apply text-3xl font-bold text-gray-800 mb-2;
    }

    .summary-score {
        @apply text-xl text-gray-600;
    }

    .questions-list {
        @apply space-y-8;
    }

    .question-card {
        @apply bg-white rounded-lg shadow-lg p-6;
    }

    .question-header {
        @apply text-2xl font-bold mb-4;
    }

    .question-header.correct {
        @apply text-green-600;
    }

    .question-header.incorrect {
        @apply text-red-600;
    }

    .sprite-preview {
        @apply w-32 h-32 mx-auto mb-6 image-rendering-pixelated;
    }

    .options-grid {
        @apply grid grid-cols-2 gap-4;
    }

    .option-grid:md {
        @apply grid-cols-4;
    }

    .option-card {
        @apply p-4 border-2 rounded-lg text-center transition-all;
    }

    .option-correct {
        @apply border-green-500 bg-green-50;
    }

    .option-wrong {
        @apply border-red-500 bg-red-50;
    }

    .option-neutral {
        @apply border-gray-200 bg-gray-50;
    }

    .option-name {
        @apply font-semibold text-gray-800 mb-2;
    }

    .option-label {
        @apply text-sm font-bold;
    }

    .correct-label {
        @apply text-green-600;
    }

    .wrong-label {
        @apply text-red-600;
    }

    .back-button-bottom {
        @apply mt-8 w-full px-4 py-3 bg-gray-500 text-white rounded-lg transition-colors;
    }

    .back-button-bottom:hover {
        @apply bg-gray-600;
    }

    :global(.image-rendering-pixelated) {
        image-rendering: pixelated;
        image-rendering: -moz-crisp-edges;
        image-rendering: crisp-edges;
    }
</style>
