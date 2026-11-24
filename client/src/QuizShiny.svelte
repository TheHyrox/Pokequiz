<script lang="ts">
    /**
     * @brief Shiny vs. Normal Quiz gameplay component
     * @description Supports two variants using SPRITE_URLS.SHINY / HOME_SHINY / OFFICIAL_SHINY:
     *              1. "binary" ("Is this sprite shiny?" fast-paced binary mode)
     *              2. "spot" ("Pick the real shiny among 4–6 color-shifted fakes" via Canvas hue-shift)
     */
    import { onMount } from 'svelte';
    import { getPokemonNameLocalized, preloadPokemonNames } from './lib/pokemonNamesClient';
    import { getRandomPokemonId } from '../../shared/utils/pokemonUtils';
    import Toast from '../components/Toast.svelte';
    import QuizHeader from '../components/quiz/QuizHeader.svelte';
    import TimerDisplay from '../components/quiz/TimerDisplay.svelte';
    import ShinyBinaryControls from '../components/quiz/ShinyBinaryControls.svelte';
    import ShinyFakeGrid from '../components/quiz/ShinyFakeGrid.svelte';
    import ShinyChallengeReviewScreen from '../components/quiz/ShinyChallengeReviewScreen.svelte';
    import HardcoreLivesDisplay from '../components/quiz/HardcoreLivesDisplay.svelte';
    import QuizEndModal from '../components/quiz/QuizEndModal.svelte';
    import PokedexMiniCardModal from '../components/quiz/PokedexMiniCardModal.svelte';
    import { getLabel } from './lib/translations';
    import { createToastHandlers } from './lib/toastUtils';
    import { generateFakeHueAngles, hueShiftImage } from './lib/utils/imageEffects';
    import { saveShinySettings, recordQuizGameResult } from './lib/storage';
    import { getShinySpritePairWithFallback } from '../../shared/constants/sprites';
    import {
        CHALLENGE_QUESTION_COUNT,
        DEFAULT_SHINY_QUIZ_SETTINGS,
        HARDCORE_INITIAL_STATE,
        HARDCORE_MAX_LIVES,
        HARDCORE_LIFE_REWARD_THRESHOLD
    } from '../../shared/constants';
    import type {
        ShinyQuizSettings,
        ShinyFakeOption,
        ShinyChallengeQuestion,
        PokemonOption,
        ToastState,
        HardcoreModeState
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
    export let settings: ShinyQuizSettings = DEFAULT_SHINY_QUIZ_SETTINGS;

    // Quiz state
    let currentQuestion = 1;
    $: totalQuestions = ['infinite', 'hardcore'].includes(settings.gameMode) ? 999 : CHALLENGE_QUESTION_COUNT;
    let currentPokemonId = 0;
    let currentPokemonName = '';
    let normalSpriteUrl = '';
    let shinySpriteUrl = '';
    let shownSpriteUrl = '';
    let isTargetShiny = false;
    let fakeOptions: ShinyFakeOption[] = [];
    let wrongOptionIds: Set<string> = new Set();
    let userBinaryAnswer: boolean | null = null;

    let loading = true;
    let score = 0;
    let timeRemaining = settings.timeLimit;
    let revealCorrectAnswer = false;
    let disabledControls = false;
    let errorCountThisQuestion = 0;
    let selectedLanguageId = languageId;

    // Challenge mode state
    let challengeQuestions: ShinyChallengeQuestion[] = [];
    let showChallengeReview = false;

    // Hardcore mode state (3 lives)
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

    const { showErrorToast, showSuccessToast } = createToastHandlers((state: ToastState) => {
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

    function handleTimeout(): void {
        disabledControls = true;
        showErrorToast(getLabel(languageCode, 'timeUp'));

        if (settings.gameMode === 'challenge') {
            challengeQuestions.push({
                questionNumber: currentQuestion,
                variant: settings.variant,
                pokemonId: currentPokemonId,
                pokemonName: currentPokemonName,
                normalSpriteUrl,
                shinySpriteUrl,
                shownSpriteUrl,
                wasTargetShiny: isTargetShiny,
                userGuessedShiny: null,
                fakeOptions: settings.variant === 'spot' ? [...fakeOptions] : undefined,
                userSelectedOptionId: 'timeout',
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
                    recordShinyStats(correctCount >= 5, correctCount);
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
        }, 1500);
    }

    interface PreparedShinyQuestion {
        pokemonId: number;
        pokemonName: string;
        normalUrl: string;
        shinyUrl: string;
        shownUrl: string;
        isTargetShiny: boolean;
        fakeOptions: ShinyFakeOption[];
        usedFallback: boolean;
    }

    let preloadedNextQuestion: PreparedShinyQuestion | null = null;
    let preloadingNextPromise: Promise<void> | null = null;

    async function prepareQuestionData(): Promise<PreparedShinyQuestion> {
        const pokemonId = getRandomPokemonId(settings.selectedGenerations);
        const pair = await getShinySpritePairWithFallback(pokemonId, settings.spriteSource);
        const pokemonName = (await getPokemonNameLocalized(pokemonId, selectedLanguageId)) || `#${pokemonId}`;

        const targetShiny = settings.variant === 'binary' ? Math.random() < 0.5 : true;
        const shownUrl = targetShiny ? pair.shinyUrl : pair.normalUrl;

        let generatedOptions: ShinyFakeOption[] = [];
        if (settings.variant === 'spot') {
            const totalCount = Math.max(4, Math.min(6, settings.numberOfFakes || 4));
            const angles = generateFakeHueAngles(totalCount);

            const fakePromises = angles.map(async (deg, idx): Promise<ShinyFakeOption> => {
                try {
                    const shiftedDataUrl = await hueShiftImage(pair.shinyUrl, deg);
                    return {
                        id: `fake-${idx + 1}`,
                        spriteUrl: shiftedDataUrl,
                        isRealShiny: false,
                        hueShiftDegrees: deg
                    };
                } catch {
                    return {
                        id: `fake-${idx + 1}`,
                        spriteUrl: pair.normalUrl,
                        isRealShiny: false,
                        hueShiftDegrees: deg
                    };
                }
            });

            const fakes = await Promise.all(fakePromises);
            generatedOptions = [
                {
                    id: 'real',
                    spriteUrl: pair.shinyUrl,
                    isRealShiny: true,
                    hueShiftDegrees: 0
                },
                ...fakes
            ].sort(() => Math.random() - 0.5);
        }

        // Warm browser image cache
        if (typeof Image !== 'undefined') {
            const img1 = new Image();
            img1.src = pair.normalUrl;
            const img2 = new Image();
            img2.src = pair.shinyUrl;
        }

        return {
            pokemonId,
            pokemonName,
            normalUrl: pair.normalUrl,
            shinyUrl: pair.shinyUrl,
            shownUrl,
            isTargetShiny: targetShiny,
            fakeOptions: generatedOptions,
            usedFallback: pair.usedFallback
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

        wrongOptionIds.clear();
        wrongOptionIds = wrongOptionIds;
        userBinaryAnswer = null;
        disabledControls = false;
        revealCorrectAnswer = false;
        toastState.show = false;
        errorCountThisQuestion = 0;

        let qData = preloadedNextQuestion;
        preloadedNextQuestion = null;

        if (!qData) {
            loading = true;
            qData = await prepareQuestionData();
        }

        if (qData.usedFallback) {
            showErrorToast(getLabel(languageCode, 'spriteFallbackUsed'));
        }

        currentPokemonId = qData.pokemonId;
        currentPokemonName = qData.pokemonName;
        normalSpriteUrl = qData.normalUrl;
        shinySpriteUrl = qData.shinyUrl;
        shownSpriteUrl = qData.shownUrl;
        isTargetShiny = qData.isTargetShiny;
        fakeOptions = qData.fakeOptions;
        lastCorrectAnswer = {
            id: qData.pokemonId,
            name: qData.pokemonName,
            isCorrect: true
        };

        loading = false;
        startTimer();
        preloadNextQuestionInBackground();
    }

    function recordShinyStats(won: boolean, finalScore: number): void {
        recordQuizGameResult({
            quizSlug: 'shiny',
            modeKey: settings.gameMode,
            isWin: won,
            score: finalScore,
            runStreak: Math.max(bestStreakInRun, currentStreakInRun)
        });
    }

    function endQuiz(): void {
        if (timerInterval) clearInterval(timerInterval);
        isWin = true;
        recordShinyStats(true, score);
        showEndModal = true;
    }

    function handleGameEnd(): void {
        if (timerInterval) clearInterval(timerInterval);
        isWin = false;
        recordShinyStats(settings.gameMode === 'infinite' && score > 0, score);
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

    /**
     * @brief Handles answer in "Is this sprite shiny?" binary mode
     */
    function handleBinaryAnswer(guessedShiny: boolean): void {
        if (disabledControls) return;
        if (timerInterval) clearInterval(timerInterval);

        userBinaryAnswer = guessedShiny;
        const isCorrect = guessedShiny === isTargetShiny;

        if (settings.gameMode === 'challenge') {
            challengeQuestions.push({
                questionNumber: currentQuestion,
                variant: 'binary',
                pokemonId: currentPokemonId,
                pokemonName: currentPokemonName,
                normalSpriteUrl,
                shinySpriteUrl,
                shownSpriteUrl,
                wasTargetShiny: isTargetShiny,
                userGuessedShiny: guessedShiny,
                isCorrect
            });

            if (currentQuestion < CHALLENGE_QUESTION_COUNT) {
                currentQuestion++;
                loadQuestion();
            } else {
                const correctCount = challengeQuestions.filter(q => q.isCorrect).length;
                recordShinyStats(correctCount >= 5, correctCount);
                showChallengeReview = true;
            }
            return;
        }

        if (settings.gameMode === 'hardcore') {
            if (isCorrect) {
                disabledControls = true;
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
                currentQuestion++;
                loadQuestion();
            } else {
                currentStreakInRun = 0;
                hardcoreState.lives--;
                hardcoreState.consecutiveCorrect = 0;
                if (hardcoreState.lives <= 0) {
                    disabledControls = true;
                    handleGameEnd();
                } else {
                    showErrorToast(`${getLabel(languageCode, 'incorrect')} - ${hardcoreState.lives} ${getLabel(languageCode, 'livesRemaining')}`);
                    currentQuestion++;
                    loadQuestion();
                }
            }
            return;
        }

        if (isCorrect) {
            currentStreakInRun++;
            if (currentStreakInRun > bestStreakInRun) bestStreakInRun = currentStreakInRun;
            score += 2;

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
            if (settings.gameMode === 'infinite') {
                disabledControls = true;
                handleGameEnd();
            } else {
                // Score mode: binary question allows 1 attempt; reveal comparison or advance
                if (currentQuestion < totalQuestions) {
                    showErrorToast(getLabel(languageCode, 'wrongAnswer'));
                    currentQuestion++;
                    loadQuestion();
                } else {
                    endQuiz();
                }
            }
        }
    }

    function calculateSpotPoints(): number {
        const count = settings.numberOfFakes || 4;
        if (settings.gameMode === 'score') {
            if (count >= 5) {
                if (errorCountThisQuestion === 0) return 5;
                if (errorCountThisQuestion === 1) return 3;
                if (errorCountThisQuestion === 2) return 2;
                if (errorCountThisQuestion === 3) return 1;
                return 0;
            }
            if (errorCountThisQuestion === 0) return 4;
            if (errorCountThisQuestion === 1) return 2;
            if (errorCountThisQuestion === 2) return 1;
            return 0;
        }
        return count >= 5 ? 3 : 2;
    }

    function getMaxSpotErrors(): number {
        return (settings.numberOfFakes || 4) >= 5 ? 4 : 3;
    }

    /**
     * @brief Handles option selection in "Pick the real shiny among 4–6 color-shifted fakes"
     */
    function handleSpotAnswer(option: ShinyFakeOption): void {
        if (disabledControls) return;
        if (timerInterval) clearInterval(timerInterval);

        const isCorrect = option.isRealShiny;

        if (settings.gameMode === 'challenge') {
            challengeQuestions.push({
                questionNumber: currentQuestion,
                variant: 'spot',
                pokemonId: currentPokemonId,
                pokemonName: currentPokemonName,
                normalSpriteUrl,
                shinySpriteUrl,
                shownSpriteUrl: option.spriteUrl,
                fakeOptions: [...fakeOptions],
                userSelectedOptionId: option.id,
                isCorrect
            });

            if (currentQuestion < CHALLENGE_QUESTION_COUNT) {
                currentQuestion++;
                loadQuestion();
            } else {
                const correctCount = challengeQuestions.filter(q => q.isCorrect).length;
                recordShinyStats(correctCount >= 5, correctCount);
                showChallengeReview = true;
            }
            return;
        }

        if (settings.gameMode === 'hardcore') {
            if (isCorrect) {
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
                currentQuestion++;
                loadQuestion();
            } else {
                currentStreakInRun = 0;
                hardcoreState.lives--;
                hardcoreState.consecutiveCorrect = 0;
                wrongOptionIds.add(option.id);
                wrongOptionIds = wrongOptionIds;

                if (hardcoreState.lives <= 0) {
                    disabledControls = true;
                    handleGameEnd();
                } else {
                    showErrorToast(`${getLabel(languageCode, 'incorrect')} - ${hardcoreState.lives} ${getLabel(languageCode, 'livesRemaining')}`);
                }
            }
            return;
        }

        if (isCorrect) {
            if (errorCountThisQuestion === 0) {
                currentStreakInRun++;
                if (currentStreakInRun > bestStreakInRun) bestStreakInRun = currentStreakInRun;
            }
            wrongOptionIds.clear();
            wrongOptionIds = wrongOptionIds;
            revealCorrectAnswer = false;
            score += calculateSpotPoints();
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
            wrongOptionIds.add(option.id);
            wrongOptionIds = wrongOptionIds;

            if (settings.hasTimeLimit) {
                timeRemaining = Math.max(0, timeRemaining - 3);
                if (timeRemaining <= 0) {
                    handleTimeout();
                    return;
                }
                startTimer(false);
            }

            if (settings.gameMode === 'infinite') {
                disabledControls = true;
                handleGameEnd();
            } else if (settings.gameMode === 'score') {
                if (errorCountThisQuestion >= getMaxSpotErrors()) {
                    revealCorrectAnswer = true;
                    showErrorToast(getLabel(languageCode, 'wrongAnswer'));
                } else {
                    showErrorToast(`${getLabel(languageCode, 'wrongAnswer')} ${getLabel(languageCode, 'keepGoing')}`);
                }
            }
        }
    }

    function handleGlobalKeydown(event: KeyboardEvent): void {
        if (loading || showEndModal || showChallengeReview || selectedPokedexPokemon) return;
        const active = document.activeElement as HTMLElement | null;
        const isInputFocused =
            active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT');
        if (isInputFocused) return;

        if (event.key === 'Enter' && revealCorrectAnswer) {
            event.preventDefault();
            if (currentQuestion < totalQuestions) {
                currentQuestion++;
                loadQuestion();
            } else {
                endQuiz();
            }
        }
    }

    saveShinySettings(settings);
    loadQuestion();

    onMount(async () => {
        await preloadPokemonNames(languageId);
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
            <ShinyChallengeReviewScreen
                {languageCode}
                {challengeQuestions}
                {onBackToHub}
            />
        {:else}
            <!-- Quiz Header -->
            <div class="quiz-header-row flex justify-between items-start mb-8 gap-8">
                <QuizHeader
                    {languageCode}
                    quizTitleLabel="shiny_quiz"
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

                {#if settings.variant === 'binary'}
                    <ShinyBinaryControls
                        {shownSpriteUrl}
                        {normalSpriteUrl}
                        {shinySpriteUrl}
                        pokemonId={currentPokemonId}
                        pokemonName={currentPokemonName}
                        {isTargetShiny}
                        showPokemonName={settings.showPokemonName}
                        disabled={disabledControls}
                        revealed={revealCorrectAnswer}
                        userAnswerShiny={userBinaryAnswer}
                        {languageCode}
                        on:answer={(e) => handleBinaryAnswer(e.detail.guessedShiny)}
                        on:inspectPokedex={() => {
                            selectedPokedexPokemon = { id: currentPokemonId, name: currentPokemonName };
                        }}
                    />
                {:else}
                    <ShinyFakeGrid
                        options={fakeOptions}
                        {normalSpriteUrl}
                        pokemonId={currentPokemonId}
                        pokemonName={currentPokemonName}
                        showPokemonName={settings.showPokemonName}
                        showNormalReference={settings.showNormalReference}
                        {wrongOptionIds}
                        {revealCorrectAnswer}
                        disabled={disabledControls}
                        {languageCode}
                        on:select={(e) => handleSpotAnswer(e.detail.option)}
                        on:inspectPokedex={() => {
                            selectedPokedexPokemon = { id: currentPokemonId, name: currentPokemonName };
                        }}
                    />
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
