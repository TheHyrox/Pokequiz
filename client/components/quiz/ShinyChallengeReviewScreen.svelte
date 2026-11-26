<script lang="ts">
    /**
     * @brief Challenge review screen for Shiny vs. Normal Quiz
     * @description Displays all 10 questions after Challenge Mode in either Binary or Spot-the-Shiny variant
     */
    import { getLabel } from '../../src/lib/translations';
    import { capitalizeFirst } from '../../../shared/utils/textUtils';
    import { CHALLENGE_QUESTION_COUNT } from '../../../shared/constants';
    import PokedexMiniCardModal from './PokedexMiniCardModal.svelte';
    import type { ShinyChallengeQuestion } from '../../../shared/types';

    export let languageCode: string = 'en';
    export let challengeQuestions: ShinyChallengeQuestion[] = [];
    export let onBackToHub: () => void;

    let selectedPokedexPokemon: { id: number; name: string } | null = null;

    $: correctCount = challengeQuestions.filter(q => q.isCorrect).length;
</script>

<div class="review-container w-full">
    <button on:click={onBackToHub} class="mb-6 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors">
        {getLabel(languageCode, 'back')}
    </button>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-5 sm:p-8 mb-6 sm:mb-8">
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            {getLabel(languageCode, 'reviewAnswers')}
        </h2>
        <p class="text-lg sm:text-xl text-gray-600 dark:text-gray-300">
            {getLabel(languageCode, 'score')}: {correctCount}/{CHALLENGE_QUESTION_COUNT}
        </p>
        <p class="text-sm text-blue-600 dark:text-blue-400 font-medium mt-2">
            📖 {getLabel(languageCode, 'clickPokemonForInfo')}
        </p>
    </div>

    <div class="space-y-6">
        {#each challengeQuestions as q (q.questionNumber)}
            <div class="question-card bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
                <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <h3 class="text-lg sm:text-2xl font-bold {q.isCorrect ? 'text-green-600' : 'text-red-600'}">
                        {getLabel(languageCode, 'question')} {q.questionNumber}/{CHALLENGE_QUESTION_COUNT} — #{String(q.pokemonId).padStart(4, '0')} {capitalizeFirst(q.pokemonName)}
                    </h3>
                    <button
                        type="button"
                        on:click={() => { selectedPokedexPokemon = { id: q.pokemonId, name: q.pokemonName }; }}
                        class="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 cursor-pointer"
                    >
                        📖 {getLabel(languageCode, 'pokedexMiniCard')}
                    </button>
                </div>

                {#if q.variant === 'binary'}
                    <div class="flex flex-wrap items-center justify-center gap-6 my-4">
                        <div class="flex flex-col items-center p-4 rounded-xl border-2 {q.isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-950/40' : 'border-red-500 bg-red-50 dark:bg-red-950/40'}">
                            <img src={q.shownSpriteUrl} alt={q.pokemonName} class="w-24 h-24 object-contain image-rendering-pixelated" />
                            <span class="text-xs font-bold mt-2 text-gray-800 dark:text-gray-100">
                                {q.wasTargetShiny ? getLabel(languageCode, 'shinySprite') : getLabel(languageCode, 'normalSprite')}
                            </span>
                        </div>
                        <div class="text-sm space-y-1 text-gray-700 dark:text-gray-200">
                            <p class="font-bold {q.isCorrect ? 'text-green-600' : 'text-red-600'}">
                                {q.isCorrect ? `✓ ${getLabel(languageCode, 'correct')}` : `✗ ${getLabel(languageCode, 'incorrect')}`}
                            </p>
                            <p>
                                {getLabel(languageCode, 'yourAnswer')}:
                                <strong>
                                    {q.userGuessedShiny === null || q.userGuessedShiny === undefined
                                        ? 'Timeout'
                                        : q.userGuessedShiny
                                        ? getLabel(languageCode, 'shinySprite')
                                        : getLabel(languageCode, 'normalSprite')}
                                </strong>
                            </p>
                        </div>
                    </div>
                {:else if q.fakeOptions}
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                        {#each q.fakeOptions as opt (opt.id)}
                            <div
                                class="option-card p-3 rounded-lg border-2 flex flex-col items-center text-center
                                    {opt.isRealShiny ? 'border-green-500 bg-green-50 dark:bg-green-950/40' :
                                     opt.id === q.userSelectedOptionId && !opt.isRealShiny ? 'border-red-500 bg-red-50 dark:bg-red-950/40' :
                                     'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40'}"
                            >
                                <img src={opt.spriteUrl} alt={q.pokemonName} class="w-20 h-20 object-contain image-rendering-pixelated" />
                                {#if opt.isRealShiny}
                                    <span class="correct-label text-xs font-bold text-green-600 mt-1">
                                        ✓ {getLabel(languageCode, 'shiny_realShinyBadge')}
                                    </span>
                                {:else}
                                    <span class="text-xs text-gray-500 mt-1">
                                        +{opt.hueShiftDegrees}°
                                    </span>
                                {/if}
                                {#if opt.id === q.userSelectedOptionId && !opt.isRealShiny}
                                    <span class="text-xs font-bold text-red-600 mt-0.5">
                                        ✗ {getLabel(languageCode, 'yourAnswer')}
                                    </span>
                                {/if}
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        {/each}
    </div>

    <button on:click={onBackToHub} class="mt-8 w-full px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors">
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
