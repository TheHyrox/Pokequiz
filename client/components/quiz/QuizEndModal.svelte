<script lang="ts">
    /**
     * @brief Quiz end modal component
     * @description Modal displayed at end of quiz with score, correct answer, and action buttons
     */
    import { createEventDispatcher } from 'svelte';
    import { capitalizeFirst } from '../../src/lib/utils/textUtils';
    import { getSpriteUrl } from '../../../shared/constants/sprites';
    import { getLabel } from '../../src/lib/translations';
    import Confetti from './Confetti.svelte';
    import type { PokemonOption } from '../../../shared/types';

    /** Whether quiz was won (true) or lost (false) */
    export let isWin: boolean;
    /** Final score achieved */
    export let score: number;
    /** Total questions in quiz */
    export let totalQuestions: number;
    /** The correct answer for the current/last question */
    export let correctAnswer: PokemonOption;
    /** Current language code */
    export let languageCode: string;
    /** Game mode (determines if answer is shown) */
    export let gameMode: 'score' | 'infinite' | 'challenge' | 'hardcore' = 'score';

    const dispatch = createEventDispatcher();

    /**
     * @brief Emits event for home action
     */
    function handleHome(): void {
        dispatch('home');
    }

    /**
     * @brief Emits event for settings/change mode action
     */
    function handleChangeSettings(): void {
        dispatch('changeSettings');
    }

    /**
     * @brief Emits event for retry action
     */
    function handleRetry(): void {
        dispatch('retry');
    }

    const spriteUrl = getSpriteUrl(correctAnswer.id, 'home');
</script>

{#if isWin}
    <Confetti />
{/if}

<div class="modal-overlay" on:click|self={handleHome}>
    <div class="modal-content" class:win={isWin} class:lose={!isWin}>
        <!-- Header -->
        <div class="modal-header" class:win={isWin} class:lose={!isWin}>
            <h1 class="modal-title">
                {isWin ? getLabel(languageCode, 'youWin') : getLabel(languageCode, 'gameOver')}
            </h1>
        </div>

        <!-- Score Section -->
        <div class="score-section">
            <div class="score-display">
                <p class="score-label">{getLabel(languageCode, 'finalScore')}</p>
                <p class="score-value">{score}</p>
            </div>
        </div>

        <!-- Correct Answer Section (only for hardcore/infinite modes) -->
        {#if gameMode === 'hardcore' || gameMode === 'infinite'}
            <div class="answer-section">
                <p class="answer-label">{getLabel(languageCode, 'correctAnswer')}:</p>
                <div class="answer-card">
                    <img
                        src={spriteUrl}
                        alt={correctAnswer.name}
                        class="answer-sprite"
                    />
                    <p class="answer-name">{capitalizeFirst(correctAnswer.name)}</p>
                </div>
            </div>
        {/if}

        <!-- Action Buttons -->
        <div class="action-buttons">
            <button
                on:click={handleHome}
                class="action-btn"
            >
                {getLabel(languageCode, 'home')}
            </button>

            <button
                on:click={handleChangeSettings}
                class="action-btn"
            >
                {getLabel(languageCode, 'changeSettings')}
            </button>

            <button
                on:click={handleRetry}
                class="action-btn"
            >
                {getLabel(languageCode, 'retry')}
            </button>
        </div>
    </div>
</div>

<style lang="postcss">
    .modal-overlay {
        @apply fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50;
        backdrop-filter: blur(4px);
    }

    .modal-content {
        @apply bg-white rounded-2xl shadow-2xl max-w-md w-full p-8;
        @apply transform transition-all duration-300 ease-out;
        animation: modalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .modal-header {
        @apply text-center mb-6;
        min-height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .modal-header.win {
        @apply bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl;
    }

    .modal-header.lose {
        @apply bg-gradient-to-r from-red-100 to-orange-100 rounded-xl;
    }

    .modal-title {
        @apply text-3xl font-black text-center;
    }

    .modal-header.win .modal-title {
        @apply text-green-600;
    }

    .modal-header.lose .modal-title {
        @apply text-red-600;
    }

    .score-section {
        @apply bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6;
    }

    .score-display {
        @apply text-center;
    }

    .score-label {
        @apply text-gray-600 text-sm font-semibold uppercase tracking-wide mb-2;
    }

    .score-value {
        @apply text-5xl font-black text-blue-600 mb-1;
    }

    .score-breakdown {
        @apply text-lg text-gray-700 font-semibold;
    }

    .answer-section {
        @apply mb-6;
    }

    .answer-label {
        @apply text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 block;
    }

    .answer-card {
        @apply bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6;
        @apply border-2 border-purple-200 flex flex-col items-center;
        @apply transition-transform duration-300;
    }

    .answer-card:hover {
        @apply scale-105;
    }

    .answer-sprite {
        @apply max-w-xs max-h-40 mb-3;
        image-rendering: pixelated;
        image-rendering: -moz-crisp-edges;
        image-rendering: crisp-edges;
    }

    .answer-name {
        @apply text-xl font-bold text-purple-700;
    }

    .action-buttons {
        @apply flex gap-3;
    }

    .action-btn {
        @apply flex-1 py-3 px-4 rounded-lg font-bold text-sm text-white;
        @apply transition-colors duration-200;
        @apply border-none cursor-pointer;
    }

    .action-btn:nth-child(1) {
        @apply bg-gray-500;
    }

    .action-btn:nth-child(1):hover {
        @apply bg-gray-600;
    }

    .action-btn:nth-child(2) {
        @apply bg-amber-500;
    }

    .action-btn:nth-child(2):hover {
        @apply bg-amber-600;
    }

    .action-btn:nth-child(3) {
        @apply bg-blue-500;
    }

    .action-btn:nth-child(3):hover {
        @apply bg-blue-600;
    }

    .action-btn:active {
        @apply scale-95;
    }

    @keyframes modalSlideIn {
        from {
            opacity: 0;
            transform: scale(0.95) translateY(20px);
        }
        to {
            opacity: 1;
            transform: scale(1) translateY(0);
        }
    }
</style>
