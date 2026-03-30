<script lang="ts">
    /**
     * @brief Sprites quiz game component
     * @description Main quiz gameplay with multiple game modes for sprite guessing
     */
    import { onMount } from 'svelte';
    import { getPokemonNameLocalized } from '../../server/src/lib/name';
    import { getRandomPokemonId } from '../../server/src/lib/utils/utils';
    import Pokecard from '../components/pokecard.svelte';
    import Toast from '../components/Toast.svelte';
    import Autocomplete from '../components/Autocomplete.svelte';
    import QuizHeader from '../components/quiz/QuizHeader.svelte';
    import TimerDisplay from '../components/quiz/TimerDisplay.svelte';
    import SpriteChallengeReviewScreen from '../components/quiz/SpriteChallengeReviewScreen.svelte';
    import HardcoreLivesDisplay from '../components/quiz/HardcoreLivesDisplay.svelte';
    import QuizEndModal from '../components/quiz/QuizEndModal.svelte';
    import { getLabel } from './lib/translations';
    import { createToastHandlers } from './lib/toastUtils';
    import { normalizeText } from './lib/utils/textUtils';
    import { pixelateImage, getCssFiltersFromSettings, getRandomRotation } from './lib/utils/imageEffects';
    import { saveSpriteSettings } from './lib/storage';
    import { getQuizSpriteUrlWithFallback } from '../../shared/constants/sprites';
    import type { SpriteUrlResult } from '../../shared/constants/sprites';
    import { CHALLENGE_QUESTION_COUNT, DEFAULT_SPRITE_QUIZ_SETTINGS, HARDCORE_INITIAL_STATE, HARDCORE_MAX_LIVES, HARDCORE_LIFE_REWARD_THRESHOLD } from '../../shared/constants';
    import type { SpriteQuizSettings, PokemonOption, ToastState, HardcoreModeState, SpriteChallengeQuestion } from '../../shared/types';

    /** Callback to return to hub */
    export let onBackToHub: () => void;
    /** Callback to return to settings */
    export let onBackToSettings: (() => void) | null = null;
    /** Current language code */
    export let languageCode: string = 'en';
    /** Current language ID */
    export let languageId: number = 9;
    /** Quiz settings */
    export let settings: SpriteQuizSettings = DEFAULT_SPRITE_QUIZ_SETTINGS;

    // Quiz state
    let currentQuestion = 1;
    let totalQuestions = settings.gameMode === 'infinite' ? 999 : CHALLENGE_QUESTION_COUNT;
    let spriteUrl = '';
    let pokemonOptions: PokemonOption[] = [];
    let loading = true;
    let score = 0;
    let timeRemaining = settings.timeLimit;
    let wrongAnsweredIds: Set<number> = new Set();
    let disabledCards = false;
    let errorCountThisQuestion = 0;
    let selectedLanguageId = languageId;
    let currentRotation = 0;

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

    /**
     * @brief Starts or resets the countdown timer
     */
    function startTimer(reset: boolean = true): void {
        if (!settings.hasTimeLimit) return;

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
     * @brief Handles timer expiration
     */
    function handleTimeout(): void {
        disabledCards = true;
        showErrorToast(getLabel(languageCode, 'timeUp'));

        setTimeout(() => {
            if (settings.gameMode === 'infinite') {
                loadQuestion();
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

    /**
     * @brief Handles hardcore mode answer submission with 3-life system
     */
    function handleHardcoreSubmit(): void {
        // Prevent multiple submissions during transition
        if (disabledCards) return;
        
        if (timerInterval) clearInterval(timerInterval);

        const userInputNormalized = normalizeText(hardcoreUserInput);
        const correctNameNormalized = normalizeText(correctPokemonName);
        const isCorrect = userInputNormalized === correctNameNormalized;

        if (isCorrect) {
            disabledCards = true;
            
            score += 1;
            hardcoreState.consecutiveCorrect++;

            // Gain life every HARDCORE_LIFE_REWARD_THRESHOLD consecutive correct (max HARDCORE_MAX_LIVES)
            if (hardcoreState.consecutiveCorrect % HARDCORE_LIFE_REWARD_THRESHOLD === 0
                && hardcoreState.lives < HARDCORE_MAX_LIVES) {
                hardcoreState.lives++;
                showSuccessToast(getLabel(languageCode, 'lifeGained'));
            } else {
                showSuccessToast(getLabel(languageCode, 'correct'));
            }

            setTimeout(() => {
                currentQuestion++;
                loadQuestion();
            }, 1500);
        } else {
            hardcoreState.lives--;
            hardcoreState.consecutiveCorrect = 0;

            if (hardcoreState.lives <= 0) {
                disabledCards = true;
                handleGameEnd();
            } else {
                showErrorToast(`${getLabel(languageCode, 'incorrect')} - ${hardcoreState.lives} ${getLabel(languageCode, 'livesRemaining')}`);
                setTimeout(() => {
                    hardcoreUserInput = '';
                    autocompleteRef?.focus();
                }, 1500);
            }
        }
    }

    /**
     * @brief Loads Pokemon names for hardcore mode autocomplete
     */
    async function loadAllPokemonNames(): Promise<void> {
        if (settings.gameMode === 'hardcore') {
            try {
                const response = await fetch(`/api/pokemon/names/${selectedLanguageId}`);
                if (!response.ok) {
                    throw new Error('Failed to load pokemon names');
                }
                allPokemonList = await response.json();
            } catch (error) {
                showErrorToast(getLabel(languageCode, 'loading'));
            }
        }
    }

    /**
     * @brief Apply image effects to sprite
     */
    async function applyEffects(baseUrl: string): Promise<string> {
        let processedUrl = baseUrl;

        // Apply pixelation if enabled
        if (settings.effects.pixelateEnabled) {
            try {
                processedUrl = await pixelateImage(baseUrl, settings.effects.pixelateStrength);
            } catch (error) {
                console.error('Pixelation failed, using base sprite:', error);
            }
        }

        return processedUrl;
    }

    /**
     * @brief Get CSS filters for effects
     */
    function getEffectFilters(): string {
        return getCssFiltersFromSettings(settings.effects);
    }

    /**
     * @brief Get random sprite type from selected types
     */
    function getRandomSpriteType() {
        return settings.selectedSpriteTypes[Math.floor(Math.random() * settings.selectedSpriteTypes.length)];
    }

    /**
     * @brief Loads a new quiz question
     */
    async function loadQuestion(): Promise<void> {
        if (timerInterval) clearInterval(timerInterval);

        loading = true;
        pokemonOptions = [];
        spriteUrl = '';
        wrongAnsweredIds.clear();
        disabledCards = false;
        toastState.show = false;
        errorCountThisQuestion = 0;
        hardcoreUserInput = '';
        currentRotation = 0;

        // Get unique random pokemon IDs based on numberOfOptions
        const selectedPokemon = new Set<number>();
        const pokemonIds: number[] = [];

        let correctId = getRandomPokemonId(settings.selectedGenerations);
        while (selectedPokemon.has(correctId)) {
            correctId = getRandomPokemonId(settings.selectedGenerations);
        }
        selectedPokemon.add(correctId);
        pokemonIds.push(correctId);

        // Get remaining unique random pokemon
        while (pokemonIds.length < settings.numberOfOptions) {
            const randomId = getRandomPokemonId(settings.selectedGenerations);
            if (!selectedPokemon.has(randomId)) {
                selectedPokemon.add(randomId);
                pokemonIds.push(randomId);
            }
        }

        // Get sprite URL
        const spriteType = getRandomSpriteType();
        const spriteResult: SpriteUrlResult = await getQuizSpriteUrlWithFallback(correctId, spriteType, settings.spriteSource);
        
        // Show toast if fallback was used
        if (spriteResult.usedFallback) {
            showErrorToast(getLabel(languageCode, 'spriteFallbackUsed'));
        }
        
        // Apply effects
        spriteUrl = await applyEffects(spriteResult.url);

        // Set rotation if enabled
        if (settings.effects.rotationEnabled) {
            currentRotation = getRandomRotation();
        }

        const correctName = await getPokemonNameLocalized(correctId, selectedLanguageId);
        correctPokemonName = correctName || '';

        const options: PokemonOption[] = [];
        for (const pokemonId of pokemonIds) {
            const name = await getPokemonNameLocalized(pokemonId, selectedLanguageId);
            options.push({
                name: name || pokemonId.toString(),
                id: pokemonId,
                isCorrect: pokemonId === correctId
            });
        }

        pokemonOptions = options.sort(() => Math.random() - 0.5);
        
        // Store the correct answer for end modal
        lastCorrectAnswer = pokemonOptions.find(p => p.isCorrect) || { id: correctId, name: correctPokemonName, isCorrect: true };
        
        loading = false;
        startTimer();

        if (settings.gameMode === 'hardcore') {
            setTimeout(() => {
                autocompleteRef?.focus();
            }, 100);
        }
    }

    /**
     * @brief Calculates points based on game mode and performance
     */
    function calculatePoints(): number {
        if (settings.gameMode === 'infinite') {
            return 1;
        }

        if (settings.hasTimeLimit) {
            const timeUsed = settings.timeLimit - timeRemaining;
            if (timeUsed < 2) return 10;
            if (timeUsed < 5) return 5;
            if (timeUsed < 15) return 3;
            if (timeUsed < 25) return 2;
            return 1;
        } else {
            if (errorCountThisQuestion === 0) return 3;
            if (errorCountThisQuestion === 1) return 2;
            if (errorCountThisQuestion === 2) return 1;
            return 0;
        }
    }

    /**
     * @brief Ends the quiz and shows results
     */
    function endQuiz(): void {
        if (timerInterval) clearInterval(timerInterval);
        isWin = true;
        showEndModal = true;
    }

    /**
     * @brief Handles end game (loss)
     */
    function handleGameEnd(): void {
        if (timerInterval) clearInterval(timerInterval);
        isWin = false;
        showEndModal = true;
    }

    /**
     * @brief Handles end modal home button
     */
    function handleEndModalHome(): void {
        onBackToHub();
    }

    /**
     * @brief Handles end modal retry button
     */
    function handleEndModalRetry(): void {
        // Reset quiz state
        currentQuestion = 1;
        score = 0;
        hardcoreState = { ...HARDCORE_INITIAL_STATE };
        challengeQuestions = [];
        showEndModal = false;
        loadQuestion();
    }

    /**
     * @brief Handles end modal settings button
     */
    function handleEndModalChangeSettings(): void {
        if (onBackToSettings) {
            onBackToSettings();
        } else {
            onBackToHub();
        }
    }

    /**
     * @brief Handles answer selection
     */
    function handleAnswer(isCorrect: boolean, pokemonId: number): void {
        if (timerInterval) clearInterval(timerInterval);

        if (settings.gameMode === 'challenge') {
            const selectedOption = pokemonOptions.find(p => p.id === pokemonId);
            const correctOption = pokemonOptions.find(p => p.isCorrect);

            challengeQuestions.push({
                questionNumber: currentQuestion,
                spriteUrl: spriteUrl,
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
                showChallengeReview = true;
            }
            return;
        }

        if (isCorrect) {
            wrongAnsweredIds.clear();
            wrongAnsweredIds = wrongAnsweredIds;

            const points = calculatePoints();
            score += points;

            if (settings.gameMode === 'infinite') {
                loadQuestion();
            } else if (currentQuestion < totalQuestions) {
                currentQuestion++;
                loadQuestion();
            } else {
                endQuiz();
            }
        } else {
            errorCountThisQuestion++;
            wrongAnsweredIds.add(pokemonId);
            wrongAnsweredIds = wrongAnsweredIds;

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
            } else {
                showErrorToast(`${getLabel(languageCode, 'wrongAnswer')} ${getLabel(languageCode, 'keepGoing')}`);
            }
        }
    }

    // Save settings to local storage
    saveSpriteSettings(settings);

    loadQuestion();

    onMount(async () => {
        if (settings.gameMode === 'hardcore') {
            await loadAllPokemonNames();
        }
    });
</script>

<main class="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-8 flex items-center justify-center">
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
                    quizTitleLabel="sprites_quiz"
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
                    <p class="text-gray-600">{getLabel(languageCode, 'loading')}</p>
                </div>
            {:else}
                <!-- Timer Display -->
                {#if settings.hasTimeLimit}
                    <TimerDisplay {timeRemaining} />
                {/if}

                <!-- Sprite Section -->
                <div class="bg-white rounded-lg shadow-lg p-8 mb-8 flex justify-center items-center">
                    <div class="sprite-container" style="transform: rotate({currentRotation}deg);">
                        <img
                            src={spriteUrl}
                            alt="Pokemon sprite"
                            class="pokemon-sprite"
                            style="filter: {getEffectFilters()};"
                        />
                    </div>
                </div>

                <!-- Pokemon Cards Grid or Hardcore Input -->
                {#if settings.gameMode === 'hardcore'}
                    <div class="max-w-2xl mx-auto">
                        <div class="bg-white rounded-lg shadow-lg p-8 mb-8">
                            <div class="mb-4">
                                <span class="block text-lg font-semibold text-gray-700 mb-2">
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
                    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                        {#each pokemonOptions as pokemon (pokemon.name)}
                            <Pokecard
                                {pokemon}
                                showError={wrongAnsweredIds.has(pokemon.id)}
                                disabled={disabledCards}
                                showSprite={false}
                                on:selected={() => handleAnswer(pokemon.isCorrect, pokemon.id)}
                            />
                        {/each}
                    </div>
                {/if}
            {/if}
        {/if}
    </div>
</main>

{#if toastState.show}
    <Toast
        message={toastState.message}
        type={toastState.type}
        autoClose={true}
        duration={5000}
        onClose={() => { toastState.show = false; }}
    />
{/if}

<style lang="postcss">
    :global(body) {
        margin: 0;
        padding: 0;
    }

    .quiz-header-row {
        @apply flex justify-between items-start mb-8 gap-8;
    }

    .sprite-container {
        @apply transition-transform duration-200;
    }

    .pokemon-sprite {
        @apply max-w-xs max-h-80 image-rendering-pixelated;
    }

    :global(.image-rendering-pixelated) {
        image-rendering: pixelated;
        image-rendering: -moz-crisp-edges;
        image-rendering: crisp-edges;
    }
</style>
