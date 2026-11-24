<script lang="ts">
    /**
     * @brief Zoomed / Cropped Sprite Quiz gameplay component
     * @description Shows a small 25%–40% cropped region of the official artwork (OFFICIAL / HOME)
     *              and zooms out slightly with each wrong guess or hint.
     */
    import { onMount } from 'svelte';
    import { getPokemonNameLocalized, preloadPokemonNames } from './lib/pokemonNamesClient';
    import { getRandomPokemonId } from '../../shared/utils/pokemonUtils';
    import Pokecard from '../components/pokecard.svelte';
    import Toast from '../components/Toast.svelte';
    import Autocomplete from '../components/Autocomplete.svelte';
    import QuizHeader from '../components/quiz/QuizHeader.svelte';
    import TimerDisplay from '../components/quiz/TimerDisplay.svelte';
    import ZoomedSpriteViewport from '../components/quiz/ZoomedSpriteViewport.svelte';
    import SpriteChallengeReviewScreen from '../components/quiz/SpriteChallengeReviewScreen.svelte';
    import HardcoreLivesDisplay from '../components/quiz/HardcoreLivesDisplay.svelte';
    import QuizEndModal from '../components/quiz/QuizEndModal.svelte';
    import PokedexMiniCardModal from '../components/quiz/PokedexMiniCardModal.svelte';
    import { getLabel } from './lib/translations';
    import { createToastHandlers } from './lib/toastUtils';
    import { normalizeText } from '../../shared/utils/textUtils.js';
    import { ArtworkCropper, computeZoomStepSchedule } from './lib/utils/imageEffects';
    import { saveZoomSettings, recordQuizGameResult } from './lib/storage';
    import { getQuizSpriteUrlWithFallback } from '../../shared/constants/sprites';
    import {
        CHALLENGE_QUESTION_COUNT,
        DEFAULT_ZOOM_QUIZ_SETTINGS,
        HARDCORE_INITIAL_STATE,
        HARDCORE_MAX_LIVES,
        HARDCORE_LIFE_REWARD_THRESHOLD
    } from '../../shared/constants';
    import type {
        ZoomQuizSettings,
        PokemonOption,
        ToastState,
        HardcoreModeState,
        SpriteChallengeQuestion
    } from '../../shared/types';

    /** Callback to return to hub */
    export let onBackToHub: () => void;
    /** Callback to return to settings */
    export let onBackToSettings: (() => void) | null = null;
    /** Current language code */
    export let languageCode: string = 'en';
    /** Current language ID */
    export let languageId: number = 9;
    /** Quiz settings */
    export let settings: ZoomQuizSettings = DEFAULT_ZOOM_QUIZ_SETTINGS;

    // Quiz state
    let currentQuestion = 1;
    $: totalQuestions = ['infinite', 'hardcore'].includes(settings.gameMode) ? 999 : CHALLENGE_QUESTION_COUNT;
    let croppedSpriteUrl = '';
    let originalSpriteUrl = '';
    let currentPokemonId = 0;
    let pokemonOptions: PokemonOption[] = [];
    let loading = true;
    let score = 0;
    let timeRemaining = settings.timeLimit;
    let wrongAnsweredIds: Set<number> = new Set();
    let revealCorrectAnswer = false;
    let disabledCards = false;
    let errorCountThisQuestion = 0;
    let hintCountThisQuestion = 0;
    let selectedLanguageId = languageId;

    // Zoom & Crop state for active question
    let activeCropper: ArtworkCropper | null = null;
    let cropSchedule: number[] = computeZoomStepSchedule(settings.initialCropSize, settings.zoomStep);
    let currentStepIndex = 0;
    $: currentCropPercent = cropSchedule[currentStepIndex] ?? settings.initialCropSize;

    // Challenge mode state
    let challengeQuestions: SpriteChallengeQuestion[] = [];
    let showChallengeReview = false;

    // Hardcore mode state
    let hardcoreUserInput: string = '';
    let correctPokemonName: string = '';
    let allPokemonList: Array<{ id: number; name: string }> = [];
    let autocompleteRef: any;
    let hardcoreState: HardcoreModeState = { ...HARDCORE_INITIAL_STATE };

    // End modal state
    let showEndModal = false;
    let lastCorrectAnswer: PokemonOption = { id: 0, name: '', isCorrect: true };
    let isWin = false;
    let currentStreakInRun = 0;
    let bestStreakInRun = 0;
    let selectedPokedexPokemon: { id: number; name: string } | null = null;

    // Toast state
    let toastState: ToastState = {
        message: '',
        type: 'info',
        show: false
    };

    const { showErrorToast, showSuccessToast, showInfoToast } = createToastHandlers((state: ToastState) => {
        toastState = state;
    });

    // Timer
    let timerInterval: ReturnType<typeof setInterval> | null = null;

    function startTimer(reset: boolean = true): void {
        if (!settings.hasTimeLimit) return;
        if (timerInterval) clearInterval(timerInterval);

        if (reset) {
            timeRemaining = settings.timeLimit;
        }

        timerInterval = setInterval(() => {
            timeRemaining--;
            if (timeRemaining <= 0) {
                clearInterval(timerInterval!);
                handleTimeout();
            }
        }, 1000);
    }

    /**
     * @brief Zooms out one step on the current artwork (called on wrong guess or manual hint)
     */
    function zoomOutStep(isManualHint: boolean = false): void {
        if (!activeCropper) return;
        if (currentStepIndex < cropSchedule.length - 1) {
            currentStepIndex++;
            const nextPct = cropSchedule[currentStepIndex];
            croppedSpriteUrl = activeCropper.renderCrop(nextPct);
            if (isManualHint) {
                hintCountThisQuestion++;
                showInfoToast(getLabel(languageCode, 'zoom_zoomedOutToast'));
            }
        }
    }

    function handleTimeout(): void {
        disabledCards = true;
        showErrorToast(getLabel(languageCode, 'timeUp'));

        if (settings.gameMode === 'challenge') {
            const correctOption = pokemonOptions.find(p => p.isCorrect);
            challengeQuestions.push({
                questionNumber: currentQuestion,
                spriteUrl: croppedSpriteUrl || originalSpriteUrl,
                originalSpriteUrl: originalSpriteUrl,
                correctPokemonName: correctOption?.name || '',
                correctPokemonId: correctOption?.id || 0,
                userAnswerId: -1,
                userAnswerName: 'Timeout',
                allOptions: [...pokemonOptions],
                isCorrect: false
            });
        }

        setTimeout(() => {
            if (settings.gameMode === 'infinite') {
                handleGameEnd();
            } else if (settings.gameMode === 'challenge') {
                if (currentQuestion < CHALLENGE_QUESTION_COUNT) {
                    currentQuestion++;
                    loadQuestion();
                } else {
                    const correctCount = challengeQuestions.filter(q => q.isCorrect).length;
                    recordZoomStats(correctCount >= 5, correctCount);
                    showChallengeReview = true;
                }
            } else {
                currentQuestion++;
                if (currentQuestion <= totalQuestions) {
                    loadQuestion();
                } else {
                    endQuiz();
                }
            }
        }, 2000);
    }

    function handleHardcoreSubmit(): void {
        if (disabledCards) return;
        if (timerInterval) clearInterval(timerInterval);

        const userInputNormalized = normalizeText(hardcoreUserInput);
        const correctNameNormalized = normalizeText(correctPokemonName);
        const isCorrect = userInputNormalized === correctNameNormalized;

        if (isCorrect) {
            disabledCards = true;
            revealCorrectAnswer = true;
            score += 1;
            hardcoreState.consecutiveCorrect++;
            currentStreakInRun++;
            if (currentStreakInRun > bestStreakInRun) bestStreakInRun = currentStreakInRun;

            if (
                hardcoreState.consecutiveCorrect % HARDCORE_LIFE_REWARD_THRESHOLD === 0 &&
                hardcoreState.lives < HARDCORE_MAX_LIVES
            ) {
                hardcoreState.lives++;
                showSuccessToast(getLabel(languageCode, 'lifeGained'));
            } else {
                showSuccessToast(getLabel(languageCode, 'correct'));
            }

            setTimeout(() => {
                currentQuestion++;
                loadQuestion();
            }, 1200);
        } else {
            currentStreakInRun = 0;
            hardcoreState.lives--;
            hardcoreState.consecutiveCorrect = 0;
            // Zoom out slightly on wrong guess in Hardcore mode
            zoomOutStep(false);

            if (hardcoreState.lives <= 0) {
                disabledCards = true;
                handleGameEnd();
            } else {
                showErrorToast(`${getLabel(languageCode, 'incorrect')} - ${hardcoreState.lives} ${getLabel(languageCode, 'livesRemaining')}`);
                setTimeout(() => {
                    hardcoreUserInput = '';
                    autocompleteRef?.focus();
                }, 800);
            }
        }
    }

    async function loadAllPokemonNames(): Promise<void> {
        if (settings.gameMode === 'hardcore') {
            try {
                const response = await fetch(`/api/pokemon/names/${selectedLanguageId}`);
                if (response.ok) {
                    allPokemonList = await response.json();
                }
            } catch {
                showErrorToast(getLabel(languageCode, 'loading'));
            }
        }
    }

    interface PreparedZoomQuestion {
        correctId: number;
        correctName: string;
        pokemonOptions: PokemonOption[];
        originalSpriteUrl: string;
        initialCroppedUrl: string;
        cropper: ArtworkCropper;
        schedule: number[];
        usedFallback: boolean;
    }

    let preloadedNextQuestion: PreparedZoomQuestion | null = null;
    let preloadingNextPromise: Promise<void> | null = null;

    async function prepareQuestionData(): Promise<PreparedZoomQuestion> {
        const selectedPokemon = new Set<number>();
        const pokemonIds: number[] = [];

        let correctId = getRandomPokemonId(settings.selectedGenerations);
        while (selectedPokemon.has(correctId)) {
            correctId = getRandomPokemonId(settings.selectedGenerations);
        }
        selectedPokemon.add(correctId);
        pokemonIds.push(correctId);

        while (pokemonIds.length < settings.numberOfOptions) {
            const randomId = getRandomPokemonId(settings.selectedGenerations);
            if (!selectedPokemon.has(randomId)) {
                selectedPokemon.add(randomId);
                pokemonIds.push(randomId);
            }
        }

        const spriteResult = await getQuizSpriteUrlWithFallback(correctId, 'front', settings.spriteSource);
        const origUrl = spriteResult.url;
        const schedule = computeZoomStepSchedule(settings.initialCropSize, settings.zoomStep);

        const cropper = new ArtworkCropper();
        let initialCroppedUrl = origUrl;
        try {
            await cropper.load(origUrl);
            initialCroppedUrl = cropper.renderCrop(schedule[0]);
        } catch {
            initialCroppedUrl = origUrl;
        }

        const correctName = (await getPokemonNameLocalized(correctId, selectedLanguageId)) || '';
        const options: PokemonOption[] = [];
        for (const pid of pokemonIds) {
            const name = await getPokemonNameLocalized(pid, selectedLanguageId);
            options.push({
                name: name || pid.toString(),
                id: pid,
                isCorrect: pid === correctId
            });
        }

        return {
            correctId,
            correctName,
            pokemonOptions: options.sort(() => Math.random() - 0.5),
            originalSpriteUrl: origUrl,
            initialCroppedUrl,
            cropper,
            schedule,
            usedFallback: spriteResult.usedFallback
        };
    }

    function preloadNextQuestionInBackground(): void {
        if (preloadedNextQuestion || preloadingNextPromise) return;
        preloadingNextPromise = prepareQuestionData()
            .then((data) => {
                preloadedNextQuestion = data;
            })
            .catch(() => {})
            .finally(() => {
                preloadingNextPromise = null;
            });
    }

    async function loadQuestion(): Promise<void> {
        if (timerInterval) clearInterval(timerInterval);

        wrongAnsweredIds.clear();
        wrongAnsweredIds = wrongAnsweredIds;
        disabledCards = false;
        revealCorrectAnswer = false;
        toastState.show = false;
        errorCountThisQuestion = 0;
        hintCountThisQuestion = 0;
        hardcoreUserInput = '';

        let qData = preloadedNextQuestion;
        preloadedNextQuestion = null;

        if (!qData) {
            loading = true;
            pokemonOptions = [];
            croppedSpriteUrl = '';
            qData = await prepareQuestionData();
        }

        if (qData.usedFallback) {
            showErrorToast(getLabel(languageCode, 'spriteFallbackUsed'));
        }

        currentPokemonId = qData.correctId;
        originalSpriteUrl = qData.originalSpriteUrl;
        activeCropper = qData.cropper;
        cropSchedule = qData.schedule;
        currentStepIndex = 0;
        croppedSpriteUrl = qData.initialCroppedUrl;
        correctPokemonName = qData.correctName;
        pokemonOptions = qData.pokemonOptions;
        lastCorrectAnswer = pokemonOptions.find(p => p.isCorrect) || {
            id: qData.correctId,
            name: correctPokemonName,
            isCorrect: true
        };

        loading = false;
        startTimer();
        preloadNextQuestionInBackground();

        if (settings.gameMode === 'hardcore') {
            setTimeout(() => {
                autocompleteRef?.focus();
            }, 100);
        }
    }

    function calculatePoints(): number {
        const options = settings.numberOfOptions;
        const effectivePenalties = errorCountThisQuestion + Math.floor(hintCountThisQuestion / 2);

        if (settings.gameMode === 'score') {
            if (options >= 5) {
                if (effectivePenalties === 0) return 5;
                if (effectivePenalties === 1) return 3;
                if (effectivePenalties === 2) return 2;
                if (effectivePenalties === 3) return 1;
                return errorCountThisQuestion < getMaxErrorsAllowed(options) ? 1 : 0;
            } else if (options === 4) {
                if (effectivePenalties === 0) return 4;
                if (effectivePenalties === 1) return 2;
                if (effectivePenalties === 2) return 1;
                return errorCountThisQuestion < getMaxErrorsAllowed(options) ? 1 : 0;
            } else if (options === 3) {
                if (effectivePenalties === 0) return 3;
                if (effectivePenalties === 1) return 1;
                return 0;
            } else {
                return errorCountThisQuestion === 0 ? 1 : 0;
            }
        }

        if (settings.gameMode === 'infinite') {
            if (options >= 10) return 5;
            if (options >= 5) return 3;
            if (options === 4 || options === 3) return 2;
            return 1;
        }

        return 1;
    }

    function getMaxErrorsAllowed(options: number): number {
        if (options >= 5) return 4;
        if (options === 4) return 3;
        if (options === 3) return 2;
        return 1;
    }

    function recordZoomStats(won: boolean, finalScore: number): void {
        recordQuizGameResult({
            quizSlug: 'zoom',
            modeKey: settings.gameMode,
            isWin: won,
            score: finalScore,
            runStreak: Math.max(bestStreakInRun, currentStreakInRun)
        });
    }

    function endQuiz(): void {
        if (timerInterval) clearInterval(timerInterval);
        isWin = true;
        recordZoomStats(true, score);
        showEndModal = true;
    }

    function handleGameEnd(): void {
        if (timerInterval) clearInterval(timerInterval);
        isWin = false;
        recordZoomStats(settings.gameMode === 'infinite' && score > 0, score);
        showEndModal = true;
    }

    function handleEndModalHome(): void {
        onBackToHub();
    }

    function handleEndModalRetry(): void {
        currentQuestion = 1;
        score = 0;
        currentStreakInRun = 0;
        bestStreakInRun = 0;
        hardcoreState = { ...HARDCORE_INITIAL_STATE };
        challengeQuestions = [];
        showEndModal = false;
        preloadedNextQuestion = null;
        loadQuestion();
    }

    function handleEndModalChangeSettings(): void {
        if (onBackToSettings) {
            onBackToSettings();
        } else {
            onBackToHub();
        }
    }

    function handleAnswer(isCorrect: boolean, pokemonId: number): void {
        if (timerInterval) clearInterval(timerInterval);

        if (settings.gameMode === 'challenge') {
            const selectedOption = pokemonOptions.find(p => p.id === pokemonId);
            const correctOption = pokemonOptions.find(p => p.isCorrect);

            challengeQuestions.push({
                questionNumber: currentQuestion,
                spriteUrl: croppedSpriteUrl || originalSpriteUrl,
                originalSpriteUrl: originalSpriteUrl,
                correctPokemonName: correctOption?.name || '',
                correctPokemonId: correctOption?.id || 0,
                userAnswerId: pokemonId,
                userAnswerName: selectedOption?.name || '',
                allOptions: [...pokemonOptions],
                isCorrect: isCorrect
            });

            if (currentQuestion < CHALLENGE_QUESTION_COUNT) {
                currentQuestion++;
                loadQuestion();
            } else {
                const correctCount = challengeQuestions.filter(q => q.isCorrect).length;
                recordZoomStats(correctCount >= 5, correctCount);
                showChallengeReview = true;
            }
            return;
        }

        if (isCorrect) {
            if (errorCountThisQuestion === 0) {
                currentStreakInRun++;
                if (currentStreakInRun > bestStreakInRun) bestStreakInRun = currentStreakInRun;
            }
            wrongAnsweredIds.clear();
            wrongAnsweredIds = wrongAnsweredIds;
            revealCorrectAnswer = false;

            const points = calculatePoints();
            score += points;
            errorCountThisQuestion = 0;

            if (settings.gameMode === 'infinite') {
                loadQuestion();
            } else if (currentQuestion < totalQuestions) {
                currentQuestion++;
                loadQuestion();
            } else {
                endQuiz();
            }
        } else {
            currentStreakInRun = 0;
            errorCountThisQuestion++;
            wrongAnsweredIds.add(pokemonId);
            wrongAnsweredIds = wrongAnsweredIds;

            // Zoom out slightly on every wrong guess
            zoomOutStep(false);

            if (settings.hasTimeLimit) {
                timeRemaining = Math.max(0, timeRemaining - 3);
                if (timeRemaining <= 0) {
                    handleTimeout();
                    return;
                }
                startTimer(false);
            }

            if (settings.gameMode === 'infinite') {
                disabledCards = true;
                handleGameEnd();
            } else if (settings.gameMode === 'score') {
                const maxErrors = getMaxErrorsAllowed(settings.numberOfOptions);
                if (errorCountThisQuestion >= maxErrors) {
                    revealCorrectAnswer = true;
                    const correctOption = pokemonOptions.find(p => p.isCorrect);
                    showErrorToast(`${getLabel(languageCode, 'wrongAnswer')} - ${correctOption?.name}`);
                } else {
                    showErrorToast(`${getLabel(languageCode, 'wrongAnswer')} ${getLabel(languageCode, 'keepGoing')}`);
                }
            } else {
                showErrorToast(`${getLabel(languageCode, 'wrongAnswer')} ${getLabel(languageCode, 'keepGoing')}`);
            }
        }
    }

    function handleGlobalKeydown(event: KeyboardEvent): void {
        if (loading || showEndModal || showChallengeReview || selectedPokedexPokemon) return;
        const active = document.activeElement as HTMLElement | null;
        const isInputFocused =
            active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT');

        if (event.key === ' ' && !isInputFocused && settings.allowManualHints && !revealCorrectAnswer) {
            event.preventDefault();
            zoomOutStep(true);
            return;
        }

        if (event.key === 'Enter' && !isInputFocused) {
            if (revealCorrectAnswer) {
                event.preventDefault();
                if (currentQuestion < totalQuestions) {
                    currentQuestion++;
                    loadQuestion();
                } else {
                    endQuiz();
                }
            }
        }
    }

    saveZoomSettings(settings);
    loadQuestion();

    onMount(async () => {
        await preloadPokemonNames(languageId);
        if (settings.gameMode === 'hardcore') {
            await loadAllPokemonNames();
        }
    });
</script>

<svelte:window on:keydown={handleGlobalKeydown} />

<main class="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-8 flex items-center justify-center">
    <div class="max-w-4xl mx-auto w-full">
        {#if showEndModal}
            <QuizEndModal
                {isWin}
                {score}
                {totalQuestions}
                correctAnswer={lastCorrectAnswer}
                {languageCode}
                gameMode={settings.gameMode}
                on:home={handleEndModalHome}
                on:changeSettings={handleEndModalChangeSettings}
                on:retry={handleEndModalRetry}
            />
        {:else if showChallengeReview}
            <SpriteChallengeReviewScreen
                {languageCode}
                {challengeQuestions}
                {onBackToHub}
            />
        {:else}
            <!-- Quiz Header -->
            <div class="quiz-header-row">
                <QuizHeader
                    {languageCode}
                    quizTitleLabel="zoom_quiz"
                    gameMode={settings.gameMode}
                    {currentQuestion}
                    {totalQuestions}
                    {score}
                    {onBackToHub}
                />
                {#if settings.gameMode === 'hardcore'}
                    <HardcoreLivesDisplay lives={hardcoreState.lives} />
                {/if}
            </div>

            {#if loading}
                <div class="text-center py-12">
                    <p class="text-gray-600 dark:text-gray-300">{getLabel(languageCode, 'loading')}</p>
                </div>
            {:else}
                {#if settings.hasTimeLimit}
                    <TimerDisplay {timeRemaining} />
                {/if}

                <!-- Reusable Zoomed / Cropped Artwork Viewport -->
                <ZoomedSpriteViewport
                    {croppedSpriteUrl}
                    {originalSpriteUrl}
                    pokemonId={currentPokemonId}
                    {currentCropPercent}
                    {cropSchedule}
                    {currentStepIndex}
                    allowManualHints={settings.allowManualHints}
                    revealed={revealCorrectAnswer}
                    revealedPokemonName={lastCorrectAnswer.name}
                    {languageCode}
                    on:zoomOut={() => zoomOutStep(true)}
                    on:inspectPokedex={() => {
                        selectedPokedexPokemon = { id: lastCorrectAnswer.id, name: lastCorrectAnswer.name };
                    }}
                />

                <!-- Pokemon Cards Grid or Hardcore Input -->
                {#if settings.gameMode === 'hardcore'}
                    <div class="max-w-2xl mx-auto">
                        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8 border border-transparent dark:border-gray-700">
                            <div class="mb-4">
                                <span class="block text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                    {getLabel(languageCode, 'enterPokemonName')}
                                </span>
                                <Autocomplete
                                    bind:this={autocompleteRef}
                                    pokemonList={allPokemonList}
                                    placeholder={getLabel(languageCode, 'enterPokemonName')}
                                    bind:value={hardcoreUserInput}
                                    disabled={disabledCards}
                                    autofocus={true}
                                    selectedGenerations={settings.selectedGenerations}
                                    on:submit={handleHardcoreSubmit}
                                />
                            </div>
                            <button
                                on:click={handleHardcoreSubmit}
                                disabled={disabledCards || !hardcoreUserInput.trim()}
                                class="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
                            >
                                {getLabel(languageCode, 'submit')}
                            </button>
                        </div>
                    </div>
                {:else}
                    <div class="pokemon-grid">
                        {#each pokemonOptions as pokemon (pokemon.id)}
                            <div class="pokemon-grid-item">
                                <Pokecard
                                    {pokemon}
                                    showError={wrongAnsweredIds.has(pokemon.id)}
                                    showSuccess={revealCorrectAnswer && pokemon.isCorrect}
                                    disabled={disabledCards}
                                    showSprite={false}
                                    on:selected={() => handleAnswer(pokemon.isCorrect, pokemon.id)}
                                />
                            </div>
                        {/each}
                    </div>
                {/if}
            {/if}
        {/if}
    </div>
</main>

{#if selectedPokedexPokemon}
    <PokedexMiniCardModal
        pokemonId={selectedPokedexPokemon.id}
        pokemonName={selectedPokedexPokemon.name}
        {languageCode}
        on:close={() => {
            selectedPokedexPokemon = null;
        }}
    />
{/if}

{#if toastState.show}
    <Toast
        message={toastState.message}
        type={toastState.type}
        autoClose={true}
        duration={4000}
        onClose={() => {
            toastState.show = false;
        }}
    />
{/if}

<style lang="postcss">
    .quiz-header-row {
        @apply flex justify-between items-start mb-8 gap-8;
    }

    .pokemon-grid {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 1rem;
    }

    .pokemon-grid-item {
        flex: 1 1 100%;
        max-width: 20rem;
    }

    @media (min-width: 768px) {
        .pokemon-grid {
            gap: 1.5rem;
        }
    }

    @media (min-width: 640px) {
        .pokemon-grid-item {
            flex-basis: calc(50% - 0.5rem);
        }
    }

    @media (min-width: 1024px) {
        .pokemon-grid-item {
            flex-basis: calc(25% - 1.125rem);
        }
    }
</style>
