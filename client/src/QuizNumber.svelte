<script lang="ts">
    import { onMount } from 'svelte';
    import QuizHeader from '../components/quiz/QuizHeader.svelte';
    import QuizEndModal from '../components/quiz/QuizEndModal.svelte';
    import NumberPointsReviewScreen from '../components/quiz/NumberPointsReviewScreen.svelte';
    import Toast from '../components/Toast.svelte';
    import { getLabel, type LabelKey } from './lib/translations';
    import { createToastHandlers } from './lib/toastUtils';
    import { getRandomPokemonId } from '../../shared/utils/pokemonUtils';
    import { createSeededRng, getTodayDateString } from '../../shared/utils/seededRng';
    import { getQuizSpriteUrl, getSpriteUrl } from '../../shared/constants/sprites';
    import { GENERATION_RANGES, CHALLENGE_QUESTION_COUNT } from '../../shared/constants';
    import { preloadPokemonNames, getPokemonNameSync } from './lib/pokemonNamesClient';
    import { capitalizeFirst } from '../../shared/utils/textUtils';
    import { pixelateImage, getCssFilters, getRandomRotation } from './lib/utils/imageEffects';
    import { saveNumberSettings, recordQuizGameResult, getDailyChallengeStatus, saveDailyChallengeRun } from './lib/storage';
    import PokedexMiniCardModal from '../components/quiz/PokedexMiniCardModal.svelte';
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
    let selectedPokedexPokemon: { id: number; name: string } | null = null;
    $: isDailyMode = Boolean(settings.isDailyChallenge || settings.dailySeed);
    $: dailySeedStr = settings.dailySeed || getTodayDateString();

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

    function l(key: LabelKey): string {
        return getLabel(languageCode, key);
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

    // Preloaded next round state (for instant transitions between Points rounds)
    let preloadedNextRound: {
        pokemonId: number;
        pokemonName: string;
        originalSpriteUrl: string;
        processedSpriteUrl: string;
        rotation: number;
    } | null = null;
    let preloadingPromise: Promise<void> | null = null;

    async function prepareRoundData(roundNum: number = currentRound) {
        let pokemonId: number;
        if (settings.isDailyChallenge || settings.dailySeed) {
            const seedDate = settings.dailySeed || getTodayDateString();
            const rng = createSeededRng(`${seedDate}:number:round:${roundNum - 1}`);
            pokemonId = getRandomPokemonId(settings.selectedGenerations, rng);
        } else {
            pokemonId = getRandomPokemonId(settings.selectedGenerations);
        }
        const pokemonName = getPokemonNameSync(pokemonId, languageId) || `#${pokemonId}`;
        const origUrl = getQuizSpriteUrl(pokemonId, 'front', 'home');
        const procUrl = await applySpriteEffects(origUrl);

        if (typeof Image !== 'undefined') {
            const img = new Image();
            img.src = procUrl;
            if (origUrl !== procUrl) {
                const origImg = new Image();
                origImg.src = origUrl;
            }
        }

        const rotation = settings.rotationEnabled ? getRandomRotation() : 0;
        return {
            pokemonId,
            pokemonName,
            originalSpriteUrl: origUrl,
            processedSpriteUrl: procUrl,
            rotation
        };
    }

    function preloadNextRoundInBackground(): void {
        if (settings.subMode !== 'points' || currentRound >= TOTAL_ROUNDS) return;
        if (preloadedNextRound || preloadingPromise) return;
        preloadingPromise = prepareRoundData(currentRound + 1)
            .then((data) => {
                preloadedNextRound = data;
            })
            .catch(() => {})
            .finally(() => {
                preloadingPromise = null;
            });
    }

    /**
     * @brief Loads a question/round with effects
     */
    async function loadQuestion(): Promise<void> {
        currentNumberInput = '';

        let roundData = preloadedNextRound;
        preloadedNextRound = null;

        if (!roundData) {
            isLoading = true;
            roundData = await prepareRoundData();
        }

        targetPokemonId = roundData.pokemonId;
        targetPokemonName = roundData.pokemonName;
        originalSpriteUrl = roundData.originalSpriteUrl;
        processedSpriteUrl = roundData.processedSpriteUrl;
        currentRotation = roundData.rotation;

        isLoading = false;
        setTimeout(() => {
            inputRef?.focus();
        }, 100);
    }

    /**
     * @brief Starts/restarts the entire quiz
     */
    async function startQuiz(isRetry: boolean = false): Promise<void> {
        if (isDailyMode && isRetry) {
            showEndModal = false;
            return;
        }
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
        preloadedNextRound = null;

        await loadQuestion();

        // Restore saved Daily Challenge run if already played today
        if (isDailyMode) {
            const savedDaily = getDailyChallengeStatus('number', dailySeedStr);
            if (savedDaily) {
                if (settings.subMode === 'normal' && savedDaily.runData?.numberGuesses?.length) {
                    guesses = [...savedDaily.runData.numberGuesses];
                    if (savedDaily.completed) {
                        isGameOver = true;
                        hasWon = Boolean(savedDaily.isWin ?? guesses.some(g => g.isCorrect));
                        finalNormalScore = guesses.length;
                        showEndModal = false;
                    }
                } else if (settings.subMode === 'points' && savedDaily.runData?.numberPointsRounds?.length) {
                    pointsRoundsHistory = [...savedDaily.runData.numberPointsRounds];
                    pointsTotalScore = pointsRoundsHistory.reduce((sum, r) => sum + r.points, 0);
                    if (savedDaily.completed || pointsRoundsHistory.length >= TOTAL_ROUNDS) {
                        showPointsReview = true;
                    }
                }
            }
        }
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
            recordQuizGameResult({
                quizSlug: 'number',
                modeKey: isDailyMode ? 'daily' : 'normal',
                isWin: true,
                score: finalNormalScore,
                guessesUsed: finalNormalScore,
                lowerIsBetter: true,
                dailyChallenge: isDailyMode
                    ? {
                        date: dailySeedStr,
                        pokemonId: targetPokemonId,
                        pokemonName: targetPokemonName,
                        runData: { numberGuesses: [...guesses] }
                    }
                    : undefined
            });
            showEndModal = true;
        } else if (settings.hasGuessLimit && guesses.length >= settings.guessLimit) {
            hasWon = false;
            isGameOver = true;
            finalNormalScore = guesses.length;
            recordQuizGameResult({
                quizSlug: 'number',
                modeKey: isDailyMode ? 'daily' : 'normal',
                isWin: false,
                score: finalNormalScore,
                guessesUsed: finalNormalScore,
                lowerIsBetter: true,
                dailyChallenge: isDailyMode
                    ? {
                        date: dailySeedStr,
                        pokemonId: targetPokemonId,
                        pokemonName: targetPokemonName,
                        runData: { numberGuesses: [...guesses] }
                    }
                    : undefined
            });
            showEndModal = true;
        } else {
            if (isDailyMode) {
                saveDailyChallengeRun({
                    date: dailySeedStr,
                    quiz: 'number',
                    completed: false,
                    score: guesses.length,
                    pokemonId: targetPokemonId,
                    pokemonName: targetPokemonName,
                    runData: { numberGuesses: [...guesses] }
                });
            }
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

        // Preload the next round's sprite in the background during result state
        preloadNextRoundInBackground();
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
            recordQuizGameResult({
                quizSlug: 'number',
                modeKey: isDailyMode ? 'daily' : 'points',
                isWin: pointsTotalScore >= 5000,
                score: pointsTotalScore,
                dailyChallenge: isDailyMode
                    ? {
                        date: dailySeedStr,
                        pokemonId: targetPokemonId,
                        pokemonName: targetPokemonName,
                        runData: { numberPointsRounds: [...pointsRoundsHistory] }
                    }
                    : undefined
            });
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

    function handleGlobalKeydown(event: KeyboardEvent): void {
        if (selectedPokedexPokemon || showEndModal || showPointsReview) return;
        if (event.key === 'Enter' && roundRevealed && settings.subMode === 'points') {
            // Avoid double-triggering if the keydown originated from the number input that just revealed the round
            const target = event.target as HTMLElement | null;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'BUTTON')) return;
            const active = document.activeElement as HTMLElement | null;
            if (active && active.tagName === 'BUTTON') return;
            event.preventDefault();
            handleNextRound();
        }
    }

    $: guessesLeft = settings.hasGuessLimit ? settings.guessLimit - guesses.length : null;

    $: endModalAnswer = {
        id: targetPokemonId,
        name: targetPokemonName,
        isCorrect: hasWon
    } as PokemonOption;
</script>

<svelte:window on:keydown={handleGlobalKeydown} />

{#if showPointsReview}
    <!-- Points Mode 10-Round Summary Screen -->
    <NumberPointsReviewScreen
        {languageCode}
        rounds={pointsRoundsHistory}
        totalScore={pointsTotalScore}
        isDailyChallenge={isDailyMode}
        on:home={onBackToHub}
        on:changeSettings={onBackToSettings}
        on:retry={() => startQuiz(true)}
    />
{:else if isLoading}
    <div class="min-h-screen flex items-center justify-center">
        <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
    </div>
{:else}
    <main class="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 px-3 pt-16 pb-6 sm:p-6 md:p-8 flex items-center justify-center">
        <div class="max-w-4xl mx-auto w-full">
            <!-- Quiz Header (harmonized with Description & Information quizzes) -->
            <div class="quiz-header-row">
                <QuizHeader
                    {languageCode}
                    quizTitleLabel="number_quiz"
                    gameMode="score"
                    currentQuestion={currentRound}
                    totalQuestions={TOTAL_ROUNDS}
                    score={pointsTotalScore}
                    customSubtitle={settings.subMode === 'normal'
                        ? (settings.hasGuessLimit && guessesLeft !== null
                            ? `${l('number_subModeNormal')} | ${l('number_guessesLeft').replace('{0}', String(Math.max(0, guessesLeft)))}`
                            : `${l('number_subModeNormal')} | ${l('number_unlimitedMode')}`)
                        : ''}
                    {onBackToHub}
                />
            </div>

            <!-- Sprite Box -->
            <div class="sprite-card mb-6 max-w-2xl mx-auto">
            <div class="sprite-frame">
                <img
                    src={(roundRevealed || (isDailyMode && isGameOver)) ? originalSpriteUrl : processedSpriteUrl}
                    alt="Pokemon sprite"
                    class="sprite-img"
                    style="filter: {getSpriteFilters(roundRevealed || (isDailyMode && isGameOver))}; transform: rotate({(roundRevealed || (isDailyMode && isGameOver)) ? 0 : currentRotation}deg);"
                    on:error={() => {
                        const fallback = getSpriteUrl(targetPokemonId, 'default');
                        if (originalSpriteUrl !== fallback) {
                            originalSpriteUrl = fallback;
                            processedSpriteUrl = fallback;
                        }
                    }}
                />
            </div>

            {#if isDailyMode && isGameOver && settings.subMode === 'normal'}
                <div class="daily-run-summary mt-4 w-full p-4 rounded-xl bg-amber-50 dark:bg-amber-950/60 border-2 border-amber-300 dark:border-amber-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div class="text-left">
                        <div class="font-bold text-amber-900 dark:text-amber-200 text-sm">
                            📅 {l('dailyAlreadyPlayed')}
                        </div>
                        <div class="text-xs text-amber-800 dark:text-amber-300 mt-1">
                            {l('number_targetWas')} <span class="font-black">#{String(targetPokemonId).padStart(4, '0')} ({capitalizeFirst(targetPokemonName)})</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        on:click={() => { selectedPokedexPokemon = { id: targetPokemonId, name: targetPokemonName }; }}
                        class="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shrink-0 cursor-pointer"
                    >
                        📖 {l('pokedexMiniCard')}: {capitalizeFirst(targetPokemonName)}
                    </button>
                </div>
            {/if}

            <!-- Revealed feedback banner in Points mode -->
            {#if roundRevealed && settings.subMode === 'points'}
                <div transition:scale={{ duration: 250 }} class="mt-4 w-full text-center">
                    <div
                        class="p-4 rounded-xl cursor-pointer transition-transform hover:scale-[1.01] {roundDistance === 0 ? 'bg-green-100 dark:bg-green-950/70 border border-green-300 dark:border-green-600' : 'bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-700'}"
                        role="button"
                        tabindex="0"
                        title={l('clickPokemonForInfo')}
                        on:click={() => { selectedPokedexPokemon = { id: targetPokemonId, name: targetPokemonName }; }}
                        on:keydown={(e) => { if (e.key === ' ') { e.preventDefault(); selectedPokedexPokemon = { id: targetPokemonId, name: targetPokemonName }; } }}
                    >
                        <div class="text-2xl font-black {roundDistance === 0 ? 'text-green-700 dark:text-green-300' : 'text-blue-700 dark:text-blue-300'} mb-1">
                            +{roundPointsEarned} pts {roundDistance === 0 ? '🎯' : ''}
                        </div>
                        <div class="text-sm font-semibold text-gray-700 dark:text-gray-200">
                            {l('number_targetWas')} <span class="font-black text-gray-900 dark:text-white">#{String(targetPokemonId).padStart(4, '0')}</span> ({capitalizeFirst(targetPokemonName)})
                        </div>
                        <div class="text-xs text-gray-500 dark:text-gray-300 mt-1">
                            {l('number_yourGuess')} #{String(roundUserGuess).padStart(4, '0')} • {l('number_difference')} {roundDistance === 0 ? '0' : (roundUserGuess > targetPokemonId ? `+${roundDistance}` : `-${roundDistance}`)}
                        </div>
                        <div class="mt-2 inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-300 bg-white/80 dark:bg-gray-800/80 px-2.5 py-0.5 rounded-full">
                            📖 {l('pokedexMiniCard')}
                        </div>
                    </div>

                    <button
                        on:click={handleNextRound}
                        class="next-round-btn mt-4 w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-base shadow-lg transition-transform active:scale-95 cursor-pointer"
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
                    enterkeyhint="go"
                    autocomplete="off"
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
            <div class="guess-history max-w-2xl mx-auto">
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
    </main>
{/if}

<!-- Normal Mode End Modal -->
{#if showEndModal && targetPokemonId && settings.subMode === 'normal'}
    <QuizEndModal
        isWin={hasWon}
        score={finalNormalScore}
        correctAnswer={endModalAnswer}
        {languageCode}
        gameMode="number"
        isDailyChallenge={isDailyMode}
        on:home={onBackToHub}
        on:changeSettings={onBackToSettings}
        on:retry={() => startQuiz(true)}
        on:close={() => { showEndModal = false; }}
    />
{/if}

{#if selectedPokedexPokemon}
    <PokedexMiniCardModal
        pokemonId={selectedPokedexPokemon.id}
        pokemonName={selectedPokedexPokemon.name}
        {languageCode}
        on:close={() => { selectedPokedexPokemon = null; }}
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
    .quiz-header-row {
        @apply flex flex-col sm:flex-row justify-between items-start mb-5 sm:mb-8 gap-3 sm:gap-8;
    }

    .sprite-card {
        @apply bg-white rounded-2xl shadow-lg p-4 sm:p-6 flex flex-col items-center justify-center border border-gray-100 overflow-hidden;
    }

    .sprite-frame {
        @apply w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 flex items-center justify-center p-2;
    }

    .sprite-img {
        @apply max-w-full max-h-full object-contain transition-all duration-300;
    }

    .input-row {
        @apply flex gap-3 max-w-md mx-auto;
    }

    .number-input {
        @apply flex-1 min-w-0 border-2 border-gray-300 rounded-xl px-3 sm:px-4 py-3 text-base sm:text-lg font-semibold text-center;
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
        @apply flex items-center gap-2 sm:gap-4 p-2.5 sm:p-3 rounded-xl border-2 font-semibold transition-all;
    }

    .guess-row.correct {
        @apply bg-green-50 border-green-400;
    }

    .guess-row.wrong {
        @apply bg-red-50 border-red-200;
    }

    .guess-attempt {
        @apply text-xs font-bold text-gray-500 uppercase w-16 sm:w-20 shrink-0;
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
