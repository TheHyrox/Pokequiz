<script lang="ts">
    import { onMount } from 'svelte';
    import QuizEndModal from '../components/quiz/QuizEndModal.svelte';
    import NumberPointsReviewScreen from '../components/quiz/NumberPointsReviewScreen.svelte';
    import Toast from '../components/Toast.svelte';
    import { getLabel } from './lib/translations';
    import { createToastHandlers } from './lib/toastUtils';
    import { getRandomPokemonId } from '../../shared/utils/pokemonUtils';
    import { getSpriteUrl } from '../../shared/constants/sprites';
    import { GENERATION_RANGES, CHALLENGE_QUESTION_COUNT } from '../../shared/constants';
    import { preloadPokemonNames, getPokemonNameSync } from './lib/pokemonNamesClient';
    import { capitalizeFirst } from '../../shared/utils/textUtils';
    import { pixelateImage, getCssFilters, getRandomRotation } from './lib/utils/imageEffects';
    import { saveNumberSettings } from './lib/storage';
    import type { NumberQuizSettings, NumberPointsRound, ToastState, PokemonOption } from '../../shared/types';
    import { fade, scale } from 'svelte/transition';

    export let settings: NumberQuizSettings;
    export let onBackToHub: () => void;
    export let onBackToSettings: () => void;
    export let languageCode: string = 'en';
    export let languageId: number = 9;

    const TOTAL_ROUNDS = CHALLENGE_QUESTION_COUNT; // 10 rounds

    // Common Game state
    let targetPokemonId: number = 0;
    let targetPokemonName: string = '';
    let originalSpriteUrl: string = '';
    let processedSpriteUrl: string = '';
    let currentRotation: number = 0;
    let currentNumberInput: string = '';
    let isLoading: boolean = true;
    let inputRef: HTMLInputElement;

    // Normal mode state
    let guesses: { value: number; label: string; isCorrect: boolean; direction: 'higher' | 'lower' | null }[] = [];
    let isGameOver: boolean = false;
    let hasWon: boolean = false;
    let showEndModal: boolean = false;
    let finalNormalScore: number = 0;

    // Points mode state (10 rounds)
    let currentRound: number = 1;
    let pointsTotalScore: number = 0;
    let roundPointsEarned: number = 0;
    let roundDistance: number = 0;
    let roundUserGuess: number = 0;
    let roundRevealed: boolean = false;
    let pointsRoundsHistory: NumberPointsRound[] = [];
    let showPointsReview: boolean = false;

    let toastState: ToastState = {
        message: '',
        type: 'info',
        show: false
    };

    const { showErrorToast } = createToastHandlers((state: ToastState) => {
        toastState = state;
    });

    function l(key: string): string {
        return getLabel(languageCode, key as any);
    }

    /**
     * @brief Computes the span of Pokemon IDs covered by selected generations
     */
    function getTotalRange(): number {
        if (!settings.selectedGenerations || settings.selectedGenerations.length === 0) return 1024;
        const min = Math.min(...settings.selectedGenerations.map(g => GENERATION_RANGES[g]?.min ?? 1));
        const max = Math.max(...settings.selectedGenerations.map(g => GENERATION_RANGES[g]?.max ?? 1025));
        return Math.max(1, max - min);
    }

    /**
     * @brief Computes points for a round (0 - 1000) based on distance and generation span
     */
    function calculateRoundPoints(distance: number): number {
        if (distance === 0) return 1000;
        const totalRange = getTotalRange();
        const ratio = distance / totalRange;
        return Math.max(0, Math.min(1000, Math.round(1000 * (1 - ratio))));
    }

    /**
     * @brief Applies pixelation effect if enabled
     */
    async function applySpriteEffects(baseUrl: string): Promise<string> {
        let result = baseUrl;
        if (settings.pixelateEnabled && settings.pixelateStrength > 1) {
            try {
                result = await pixelateImage(baseUrl, settings.pixelateStrength);
            } catch (error) {
                console.error('Sprite pixelation failed:', error);
            }
        }
        return result;
    }

    /**
     * @brief Computes CSS filter string for blur and silhouette
     */
    function getSpriteFilters(isRevealedState: boolean): string {
        if (isRevealedState) return 'none';
        return getCssFilters({
            blur: { enabled: settings.blurEnabled, strength: settings.blurStrength },
            silhouette: settings.silhouetteEnabled
        });
    }

    /**
     * @brief Loads a question/round with effects
     */
    async function loadQuestion(): Promise<void> {
        isLoading = true;
        currentNumberInput = '';

        // Pick random pokemon from selected generations
        targetPokemonId = getRandomPokemonId(settings.selectedGenerations);
        targetPokemonName = getPokemonNameSync(targetPokemonId, languageId) || `#${targetPokemonId}`;

        // Get Home sprite URL
        originalSpriteUrl = getSpriteUrl(targetPokemonId, 'home');

        // Apply pixelation effect if needed
        processedSpriteUrl = await applySpriteEffects(originalSpriteUrl);

        // Rotation
        currentRotation = settings.rotationEnabled ? getRandomRotation() : 0;

        isLoading = false;
        setTimeout(() => {
            inputRef?.focus();
        }, 100);
    }

    /**
     * @brief Starts/restarts the entire quiz
     */
    async function startQuiz(): Promise<void> {
        // Reset Normal mode state
        isGameOver = false;
        hasWon = false;
        showEndModal = false;
        guesses = [];
        finalNormalScore = 0;

        // Reset Points mode state
        currentRound = 1;
        pointsTotalScore = 0;
        roundPointsEarned = 0;
        roundDistance = 0;
        roundUserGuess = 0;
        roundRevealed = false;
        pointsRoundsHistory = [];
        showPointsReview = false;

        await loadQuestion();
    }

    onMount(async () => {
        saveNumberSettings(settings);
        await preloadPokemonNames(languageId);
        await startQuiz();
    });

    /**
     * @brief Handles submit action for both modes
     */
    function handleSubmit(): void {
        if (isLoading || isGameOver || roundRevealed) return;

        const valStr = String(currentNumberInput ?? '').trim();
        if (!valStr) return;

        const parsed = parseInt(valStr, 10);
        if (isNaN(parsed) || parsed < 1 || parsed > 1025) {
            showErrorToast(l('number_notFound'));
            return;
        }

        if (settings.subMode === 'normal') {
            handleNormalGuess(parsed);
        } else {
            handlePointsGuess(parsed);
        }
    }

    /**
     * @brief Normal mode guess handler
     */
    function handleNormalGuess(parsed: number): void {
        if (guesses.some(g => g.value === parsed)) {
            showErrorToast(l('number_alreadyGuessed'));
            return;
        }

        const isCorrect = parsed === targetPokemonId;
        const direction: 'higher' | 'lower' | null = isCorrect ? null : (parsed < targetPokemonId ? 'higher' : 'lower');
        guesses = [...guesses, {
            value: parsed,
            label: `#${String(parsed).padStart(4, '0')}`,
            isCorrect,
            direction
        }];
        currentNumberInput = '';

        if (isCorrect) {
            hasWon = true;
            isGameOver = true;
            finalNormalScore = guesses.length;
            showEndModal = true;
        } else if (settings.hasGuessLimit && guesses.length >= settings.guessLimit) {
            hasWon = false;
            isGameOver = true;
            finalNormalScore = guesses.length;
            showEndModal = true;
        } else {
            setTimeout(() => {
                inputRef?.focus();
            }, 50);
        }
    }

    /**
     * @brief Points mode guess handler (1 guess per round)
     */
    function handlePointsGuess(parsed: number): void {
        roundUserGuess = parsed;
        roundDistance = Math.abs(parsed - targetPokemonId);
        roundPointsEarned = calculateRoundPoints(roundDistance);
        pointsTotalScore += roundPointsEarned;

        // Save round history
        pointsRoundsHistory = [
            ...pointsRoundsHistory,
            {
                roundNumber: currentRound,
                pokemonId: targetPokemonId,
                pokemonName: targetPokemonName,
                spriteUrl: processedSpriteUrl,
                originalSpriteUrl: originalSpriteUrl,
                userGuess: parsed,
                distance: roundDistance,
                points: roundPointsEarned
            }
        ];

        // Reveal round feedback
        roundRevealed = true;
    }

    /**
     * @brief Advances to the next round or review screen in Points mode
     */
    async function handleNextRound(): Promise<void> {
        if (currentRound < TOTAL_ROUNDS) {
            currentRound++;
            roundRevealed = false;
            await loadQuestion();
        } else {
            showPointsReview = true;
        }
    }

    function handleKeydown(event: KeyboardEvent): void {
        if (event.key === 'Enter') {
            if (roundRevealed && settings.subMode === 'points') {
                handleNextRound();
            } else {
                handleSubmit();
            }
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            if (isGameOver || roundRevealed) return;
            const current = parseInt(String(currentNumberInput || '').trim(), 10);
            if (isNaN(current)) {
                currentNumberInput = '1';
            } else {
                currentNumberInput = String(Math.min(1025, current + 1));
            }
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (isGameOver || roundRevealed) return;
            const current = parseInt(String(currentNumberInput || '').trim(), 10);
            if (isNaN(current)) {
                currentNumberInput = '1';
            } else {
                currentNumberInput = String(Math.max(1, current - 1));
            }
        }
    }

    $: guessesLeft = settings.hasGuessLimit ? settings.guessLimit - guesses.length : null;

    $: endModalAnswer = {
        id: targetPokemonId,
        name: targetPokemonName,
        isCorrect: hasWon
    } as PokemonOption;
</script>

{#if showPointsReview}
    <!-- Points Mode 10-Round Summary Screen -->
    <NumberPointsReviewScreen
        {languageCode}
        rounds={pointsRoundsHistory}
        totalScore={pointsTotalScore}
        on:home={onBackToHub}
        on:changeSettings={onBackToSettings}
        on:retry={startQuiz}
    />
{:else if isLoading}
    <div class="min-h-screen flex items-center justify-center">
        <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
    </div>
{:else}
    <div class="p-4 md:p-6 w-full max-w-2xl mx-auto">
        <!-- Header -->
        <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
            <button
                class="text-gray-600 hover:text-gray-800 font-medium flex items-center gap-2"
                on:click={onBackToSettings}
            >
                {l('back')}
            </button>
            <div class="text-xl md:text-2xl font-bold text-gray-800">
                {l('number_quiz')}
                <span class="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full ml-2">
                    {settings.subMode === 'normal' ? l('number_subModeNormal') : l('number_subModePoints')}
                </span>
            </div>

            <!-- Header Badge / Counter -->
            {#if settings.subMode === 'normal'}
                {#if settings.hasGuessLimit && guessesLeft !== null}
                    <div class="text-xs md:text-sm font-semibold text-white bg-blue-500 px-3.5 py-1.5 rounded-full shadow-sm">
                        {l('number_guessesLeft').replace('{0}', String(Math.max(0, guessesLeft)))}
                    </div>
                {:else}
                    <div class="text-xs md:text-sm font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {l('number_unlimitedMode')}
                    </div>
                {/if}
            {:else}
                <!-- Points Mode Round indicator & running score -->
                <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                        {l('number_round').replace('{0}', String(currentRound)).replace('{1}', String(TOTAL_ROUNDS))}
                    </span>
                    <span class="text-xs font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                        {pointsTotalScore.toLocaleString()} pts
                    </span>
                </div>
            {/if}
        </div>

        <!-- Sprite Box -->
        <div class="sprite-card mb-6">
            <div class="sprite-frame">
                <img
                    src={roundRevealed ? originalSpriteUrl : processedSpriteUrl}
                    alt="Pokemon sprite"
                    class="sprite-img"
                    style="filter: {getSpriteFilters(roundRevealed)}; transform: rotate({roundRevealed ? 0 : currentRotation}deg);"
                />
            </div>

            <!-- Revealed feedback banner in Points mode -->
            {#if roundRevealed && settings.subMode === 'points'}
                <div transition:scale={{ duration: 250 }} class="mt-4 w-full text-center">
                    <div class="p-4 rounded-xl {roundDistance === 0 ? 'bg-green-100 border border-green-300' : 'bg-blue-50 border border-blue-200'}">
                        <div class="text-2xl font-black {roundDistance === 0 ? 'text-green-700' : 'text-blue-700'} mb-1">
                            +{roundPointsEarned} pts {roundDistance === 0 ? '🎯' : ''}
                        </div>
                        <div class="text-sm font-semibold text-gray-700">
                            {l('number_targetWas')} <span class="font-black text-gray-900">#{String(targetPokemonId).padStart(4, '0')}</span> ({capitalizeFirst(targetPokemonName)})
                        </div>
                        <div class="text-xs text-gray-500 mt-1">
                            {l('number_yourGuess')} #{String(roundUserGuess).padStart(4, '0')} • {l('number_difference')} {roundDistance === 0 ? '0' : (roundUserGuess > targetPokemonId ? `+${roundDistance}` : `-${roundDistance}`)}
                        </div>
                    </div>

                    <button
                        on:click={handleNextRound}
                        class="mt-4 w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-base shadow-lg transition-transform active:scale-95 cursor-pointer"
                    >
                        {currentRound < TOTAL_ROUNDS ? l('number_nextRound') : l('number_finishQuiz')}
                    </button>
                </div>
            {/if}
        </div>

        <!-- Input Row (when not revealed) -->
        {#if !roundRevealed}
            <div class="input-row mb-6">
                <input
                    bind:this={inputRef}
                    type="text"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    placeholder={l('number_enterNumber')}
                    bind:value={currentNumberInput}
                    on:keydown={handleKeydown}
                    disabled={isGameOver || roundRevealed}
                    class="number-input"
                />
                <button
                    on:click={handleSubmit}
                    disabled={isGameOver || !String(currentNumberInput ?? '').trim()}
                    class="submit-btn"
                >
                    ✓
                </button>
            </div>
        {/if}

        <!-- Normal Mode Guess History -->
        {#if settings.subMode === 'normal' && guesses.length > 0}
            <div class="guess-history">
                {#each [...guesses].reverse() as guess, i (guesses.length - i - 1)}
                    <div
                        transition:fade={{ duration: 200 }}
                        class="guess-row {guess.isCorrect ? 'correct' : 'wrong'}"
                    >
                        <div class="guess-attempt">
                            {l('number_attempt')} {guesses.length - i}
                        </div>
                        <div class="guess-value">
                            <span class="guess-label">{guess.label}</span>
                        </div>
                        <div class="guess-result">
                            {#if guess.isCorrect}
                                <span class="result-correct">{l('number_correct')}</span>
                            {:else if settings.showHigherLower && guess.direction}
                                <span class="result-hint {guess.direction === 'higher' ? 'hint-higher' : 'hint-lower'}">
                                    {guess.direction === 'higher' ? l('number_higher') : l('number_lower')}
                                </span>
                            {:else}
                                <span class="result-wrong">✗</span>
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
{/if}

<!-- Normal Mode End Modal -->
{#if showEndModal && targetPokemonId && settings.subMode === 'normal'}
    <QuizEndModal
        isWin={hasWon}
        score={finalNormalScore}
        correctAnswer={endModalAnswer}
        {languageCode}
        gameMode="pokedle"
        on:home={onBackToHub}
        on:changeSettings={onBackToSettings}
        on:retry={startQuiz}
        on:close={() => { showEndModal = false; }}
    />
{/if}

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
    .sprite-card {
        @apply bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center border border-gray-100;
    }

    .sprite-frame {
        @apply w-56 h-56 md:w-64 md:h-64 flex items-center justify-center p-2;
    }

    .sprite-img {
        @apply max-w-full max-h-full object-contain transition-all duration-300;
    }

    .input-row {
        @apply flex gap-3 max-w-md mx-auto;
    }

    .number-input {
        @apply flex-1 border-2 border-gray-300 rounded-xl px-4 py-3 text-lg font-semibold text-center;
        @apply focus:outline-none focus:border-blue-500 ring-2 ring-transparent focus:ring-blue-100 transition-all;
    }

    .number-input:disabled {
        @apply opacity-50 cursor-not-allowed;
    }

    /* Remove spinner arrows from number input */
    .number-input::-webkit-outer-spin-button,
    .number-input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    .submit-btn {
        @apply bg-blue-500 hover:bg-blue-600 text-white font-bold px-6 py-3 rounded-xl;
        @apply transition-all duration-200 text-xl shadow-md;
        @apply disabled:opacity-50 disabled:cursor-not-allowed active:scale-95;
    }

    .guess-history {
        @apply space-y-2 mt-4;
    }

    .guess-row {
        @apply flex items-center gap-4 p-3 rounded-xl border-2 font-semibold transition-all;
    }

    .guess-row.correct {
        @apply bg-green-50 border-green-400;
    }

    .guess-row.wrong {
        @apply bg-red-50 border-red-200;
    }

    .guess-attempt {
        @apply text-xs font-bold text-gray-500 uppercase w-20 shrink-0;
    }

    .guess-value {
        @apply flex items-center gap-2 flex-1;
    }

    .guess-label {
        @apply text-lg font-bold text-gray-800;
    }

    .guess-result {
        @apply text-right shrink-0;
    }

    .result-correct {
        @apply text-green-600 font-bold text-sm;
    }

    .result-wrong {
        @apply text-red-500 font-bold text-lg;
    }

    .result-hint {
        @apply font-bold text-xs px-2.5 py-1 rounded-md;
    }

    .hint-higher {
        @apply text-blue-700 bg-blue-100;
    }

    .hint-lower {
        @apply text-orange-700 bg-orange-100;
    }
</style>
