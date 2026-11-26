<script lang="ts">
    /**
     * @brief Challenge review screen component
     * @description Displays all questions and answers after challenge mode completion
     */
    import { getLabel } from '../../src/lib/translations';
    import type { ChallengeQuestion, InformationChallengeQuestion } from '../../../shared/types';
    import { CHALLENGE_QUESTION_COUNT } from '../../../shared/constants';
    import { getSpriteUrl } from '../../../shared/constants/sprites';
    import PokedexMiniCardModal from './PokedexMiniCardModal.svelte';

    /** Current language code for translations */
    export let languageCode: string;
    /** Array of questions with user answers */
    export let challengeQuestions: Array<ChallengeQuestion & Partial<InformationChallengeQuestion>>;
    /** Callback when back button is clicked */
    export let onBackToHub: () => void;
    /** Optional custom score override (e.g. for Daily Challenge score mode) */
    export let customScoreText: string = '';
    /** Optional Daily Challenge notice banner */
    export let dailyNoticeText: string = '';

    let selectedPokedexPokemon: { id: number; name: string } | null = null;

    $: correctCount = challengeQuestions.filter(q => q.isCorrect).length;
</script>

<div class="review-container">
    <button on:click={onBackToHub} class="back-button-top">
        {getLabel(languageCode, 'back')}
    </button>

    <div class="summary-card">
        <h2 class="summary-title">{getLabel(languageCode, 'reviewAnswers')}</h2>
        {#if dailyNoticeText}
            <div class="daily-run-summary mb-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-sm font-bold">
                📅 {dailyNoticeText}
            </div>
        {/if}
        <p class="summary-score">
            {getLabel(languageCode, 'score')}: {customScoreText || `${correctCount}/${CHALLENGE_QUESTION_COUNT}`}
        </p>
        <p class="text-sm text-blue-600 dark:text-blue-400 font-medium mt-2">
            📖 {getLabel(languageCode, 'clickPokemonForInfo')}
        </p>
    </div>

    <div class="questions-list">
        {#each challengeQuestions as question (question.questionNumber)}
            <div class="question-card">
                <h3 class="question-header" class:correct={question.isCorrect} class:incorrect={!question.isCorrect}>
                    {getLabel(languageCode, 'question')} {question.questionNumber}/{CHALLENGE_QUESTION_COUNT}
                </h3>

                {#if question.description}
                    <p class="description">"{@html question.description}"</p>
                {:else if question.revealedHints}
                    <div class="hints-container">
                        <h4 class="hints-title">{getLabel(languageCode, 'information_hints')}</h4>
                        <div class="hints-list">
                            {#each question.revealedHints as hint, hintIndex (question.questionNumber + '-' + hintIndex)}
                                <div class="hint-item" class:fake={hint.isFake}>
                                    <span class="hint-type font-semibold capitalize">{getLabel(languageCode, `information_${hint.type}`)}:</span>
                                    <span class="hint-value">{hint.value}</span>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}

                <div class="options-grid">
                    {#each question.allOptions as option (option.id)}
                        <div
                            class="option-card cursor-pointer hover:shadow-md hover:scale-[1.02]"
                            class:option-correct={option.isCorrect}
                            class:option-wrong={option.id === question.userAnswerId && !option.isCorrect}
                            class:option-neutral={!option.isCorrect && option.id !== question.userAnswerId}
                            role="button"
                            tabindex="0"
                            title={getLabel(languageCode, 'clickPokemonForInfo')}
                            on:click={() => { selectedPokedexPokemon = { id: option.id, name: option.name }; }}
                            on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectedPokedexPokemon = { id: option.id, name: option.name }; } }}
                        >
                            <img
                                src={getSpriteUrl(option.id)}
                                alt={option.name}
                                class="option-sprite"
                            />
                            <p class="option-name">{option.name}</p>
                            {#if option.isCorrect}
                                <p class="option-label correct-label">✓ {getLabel(languageCode, 'correctAnswer')}</p>
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

{#if selectedPokedexPokemon}
    <PokedexMiniCardModal
        pokemonId={selectedPokedexPokemon.id}
        pokemonName={selectedPokedexPokemon.name}
        {languageCode}
        on:close={() => { selectedPokedexPokemon = null; }}
    />
{/if}

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
        @apply bg-white rounded-lg shadow-lg p-5 sm:p-8 mb-6 sm:mb-8;
    }

    .summary-title {
        @apply text-2xl sm:text-3xl font-bold text-gray-800 mb-2;
    }

    .summary-score {
        @apply text-lg sm:text-xl text-gray-600;
    }

    .questions-list {
        @apply space-y-6 sm:space-y-8;
    }

    .question-card {
        @apply bg-white rounded-lg shadow-lg p-4 sm:p-6;
    }

    .question-header {
        @apply text-xl sm:text-2xl font-bold mb-3 sm:mb-4;
    }

    .question-header.correct {
        @apply text-green-600;
    }

    .question-header.incorrect {
        @apply text-red-600;
    }

    .description {
        @apply text-base sm:text-xl text-gray-800 mb-4 sm:mb-6 italic break-words;
    }

    .hints-container {
        @apply mb-6 bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400;
    }

    .hints-title {
        @apply text-lg font-semibold mb-3 text-gray-800;
    }

    .hints-list {
        @apply space-y-2;
    }

    .hint-item {
        @apply p-2 bg-blue-50 border-l-4 border-blue-400 rounded text-gray-700;
    }

    .hint-item.fake {
        @apply bg-yellow-50 border-yellow-400;
    }

    .hint-type {
        @apply text-gray-700;
    }

    .hint-value {
        @apply text-gray-600 ml-2;
    }

    .options-grid {
        @apply grid grid-cols-2 gap-2.5 sm:gap-4;
    }

    @screen md {
        .options-grid {
            @apply grid-cols-4;
        }
    }

    .option-card {
        @apply p-2.5 sm:p-4 border-2 rounded-lg text-center transition-all;
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

    .option-sprite {
        @apply w-16 h-16 mx-auto mb-2;
    }

    .option-name {
        @apply font-semibold text-gray-800;
    }

    .option-label {
        @apply text-sm mt-2;
    }

    .correct-label {
        @apply text-green-600;
    }

    .wrong-label {
        @apply text-red-600;
    }

    .back-button-bottom {
        @apply mt-8 w-full px-4 py-3 bg-blue-500 text-white rounded-lg transition-colors font-bold text-lg;
    }

    .back-button-bottom:hover {
        @apply bg-blue-600;
    }
</style>
