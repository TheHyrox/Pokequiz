<script lang="ts">
    /**
     * @brief Number quiz points mode review screen component
     * @description Displays comprehensive recap of all 10 rounds with score breakdown
     */
    import { createEventDispatcher } from 'svelte';
    import { capitalizeFirst } from '../../../shared/utils/textUtils.js';
    import { getLabel } from '../../src/lib/translations';
    import Confetti from './Confetti.svelte';
    import type { NumberPointsRound } from '../../../shared/types';

    /** Current language code for translations */
    export let languageCode: string = 'en';
    /** Array of 10 rounds completed */
    export let rounds: NumberPointsRound[];
    /** Total score accumulated */
    export let totalScore: number;

    const dispatch = createEventDispatcher();

    function l(key: string): string {
        return getLabel(languageCode, key as any);
    }

    function handleHome(): void {
        dispatch('home');
    }

    function handleChangeSettings(): void {
        dispatch('changeSettings');
    }

    function handleRetry(): void {
        dispatch('retry');
    }

    $: perfectRoundsCount = rounds.filter(r => r.distance === 0).length;
    $: averagePoints = rounds.length > 0 ? Math.round(totalScore / rounds.length) : 0;
    $: isGreatScore = totalScore >= 7500;
</script>

{#if isGreatScore}
    <Confetti />
{/if}

<div class="review-container max-w-4xl mx-auto p-4 md:p-6">
    <!-- Top back button -->
    <div class="flex justify-between items-center mb-6">
        <button on:click={handleHome} class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors">
            {l('back')}
        </button>
        <div class="text-sm font-semibold text-gray-500">
            {l('number_quiz')} • {l('number_subModePoints')}
        </div>
    </div>

    <!-- Summary Total Card -->
    <div class="summary-hero-card mb-8">
        <div class="text-center">
            <h1 class="text-3xl md:text-4xl font-black text-gray-800 mb-2">
                {l('number_summary')}
            </h1>
            <p class="text-gray-600 font-medium mb-6">
                {perfectRoundsCount > 0 ? `🎯 ${perfectRoundsCount} ${l('number_exact')}` : ''}
            </p>

            <div class="score-badge-container">
                <div class="score-circle">
                    <span class="score-number">{totalScore.toLocaleString()}</span>
                    <span class="score-denom">/ 10,000 pts</span>
                </div>
            </div>

            <!-- Stats row -->
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 max-w-lg mx-auto">
                <div class="stat-box">
                    <span class="stat-label">{l('number_score')}</span>
                    <span class="stat-value">{Math.round((totalScore / 10000) * 100)}%</span>
                </div>
                <div class="stat-box">
                    <span class="stat-label">Moyenne / round</span>
                    <span class="stat-value">{averagePoints} pts</span>
                </div>
                <div class="stat-box col-span-2 md:col-span-1">
                    <span class="stat-label">Exacts</span>
                    <span class="stat-value">{perfectRoundsCount} / 10</span>
                </div>
            </div>
        </div>
    </div>

    <!-- 10 Rounds Details List -->
    <div class="rounds-grid mb-8">
        {#each rounds as round (round.roundNumber)}
            <div class="round-card {round.distance === 0 ? 'border-green-400 bg-green-50/40' : round.points >= 750 ? 'border-blue-300 bg-white' : 'border-gray-200 bg-white'}">
                <!-- Round header -->
                <div class="round-header">
                    <span class="round-tag">
                        {l('number_round').replace('{0}', String(round.roundNumber)).replace('{1}', '10')}
                    </span>
                    <span class="round-points-tag {round.distance === 0 ? 'bg-green-500 text-white' : round.points >= 750 ? 'bg-blue-500 text-white' : round.points >= 500 ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-700'}">
                        +{round.points} pts
                    </span>
                </div>

                <!-- Sprite and Name -->
                <div class="round-body">
                    <div class="sprite-wrapper">
                        <img
                            src={round.originalSpriteUrl}
                            alt={round.pokemonName}
                            class="round-sprite"
                        />
                    </div>
                    <div class="round-info">
                        <h3 class="round-pokemon-name">{capitalizeFirst(round.pokemonName)}</h3>
                        
                        <div class="comparison-grid">
                            <div class="comp-item">
                                <span class="comp-label">{l('number_targetWas')}</span>
                                <span class="comp-val text-green-700 font-black">#{String(round.pokemonId).padStart(4, '0')}</span>
                            </div>
                            <div class="comp-item">
                                <span class="comp-label">{l('number_yourGuess')}</span>
                                <span class="comp-val {round.distance === 0 ? 'text-green-700 font-black' : 'text-gray-800 font-bold'}">#{String(round.userGuess).padStart(4, '0')}</span>
                            </div>
                            <div class="comp-item">
                                <span class="comp-label">{l('number_difference')}</span>
                                <span class="comp-val {round.distance === 0 ? 'text-green-600 font-bold' : 'text-orange-600 font-bold'}">
                                    {#if round.distance === 0}
                                        ✓ 0
                                    {:else if round.userGuess > round.pokemonId}
                                        +{round.distance}
                                    {:else}
                                        -{round.distance}
                                    {/if}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        {/each}
    </div>

    <!-- Action Buttons -->
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <button on:click={handleHome} class="btn-action bg-gray-500 hover:bg-gray-600">
            {l('home')}
        </button>
        <button on:click={handleChangeSettings} class="btn-action bg-amber-500 hover:bg-amber-600">
            {l('changeSettings')}
        </button>
        <button on:click={handleRetry} class="btn-action bg-blue-500 hover:bg-blue-600">
            {l('number_playAgain')}
        </button>
    </div>
</div>

<style lang="postcss">
    .summary-hero-card {
        @apply bg-white rounded-2xl shadow-xl p-8 border border-gray-100;
    }

    .score-badge-container {
        @apply flex justify-center items-center my-4;
    }

    .score-circle {
        @apply flex flex-col items-center justify-center w-48 h-48 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg p-4;
    }

    .score-number {
        @apply text-4xl md:text-5xl font-black tracking-tight;
    }

    .score-denom {
        @apply text-xs md:text-sm font-semibold opacity-90 uppercase tracking-wider mt-1;
    }

    .stat-box {
        @apply flex flex-col items-center justify-center p-3 bg-gray-50 rounded-xl border border-gray-100;
    }

    .stat-label {
        @apply text-xs font-semibold text-gray-500 uppercase tracking-wide;
    }

    .stat-value {
        @apply text-lg font-bold text-gray-800;
    }

    .rounds-grid {
        @apply grid grid-cols-1 md:grid-cols-2 gap-4;
    }

    .round-card {
        @apply rounded-xl shadow-md p-4 border-2 transition-transform duration-200;
    }

    .round-card:hover {
        @apply scale-[1.01] shadow-lg;
    }

    .round-header {
        @apply flex justify-between items-center mb-3;
    }

    .round-tag {
        @apply text-xs font-bold text-gray-500 uppercase tracking-wider;
    }

    .round-points-tag {
        @apply text-xs font-bold px-3 py-1 rounded-full shadow-sm;
    }

    .round-body {
        @apply flex items-center gap-4;
    }

    .sprite-wrapper {
        @apply w-20 h-20 bg-gray-50 rounded-lg p-1 flex items-center justify-center border border-gray-100 shrink-0;
    }

    .round-sprite {
        @apply w-full h-full object-contain;
    }

    .round-info {
        @apply flex-1 min-w-0;
    }

    .round-pokemon-name {
        @apply text-base font-bold text-gray-800 truncate mb-2;
    }

    .comparison-grid {
        @apply grid grid-cols-3 gap-2 text-xs bg-gray-50 p-2 rounded-lg border border-gray-100;
    }

    .comp-item {
        @apply flex flex-col;
    }

    .comp-label {
        @apply text-[10px] text-gray-500 font-semibold uppercase;
    }

    .comp-val {
        @apply text-xs truncate;
    }

    .btn-action {
        @apply py-3 px-6 rounded-xl font-bold text-white shadow-md transition-all text-center cursor-pointer;
    }

    .btn-action:active {
        @apply scale-95;
    }
</style>
