<script lang="ts">
    /**
     * @brief Information quiz game component
     * @description Main quiz gameplay for guessing Pokemon from characteristics
     */
    import { onMount } from 'svelte';
    import { getPokemonNameLocalized } from '../../server/src/lib/name';
    import { getRandomPokemonId } from '../../server/src/lib/utils/utils';
    import Pokecard from '../components/pokecard.svelte';
    import Toast from '../components/Toast.svelte';
    import QuizHeader from '../components/quiz/QuizHeader.svelte';
    import TimerDisplay from '../components/quiz/TimerDisplay.svelte';
    import QuizEndModal from '../components/quiz/QuizEndModal.svelte';
    import { getLabel } from './lib/translations';
    import { createToastHandlers } from './lib/toastUtils';
    import { saveInformationSettings } from './lib/storage';
    import { CHALLENGE_QUESTION_COUNT, DEFAULT_INFORMATION_QUIZ_SETTINGS } from '../../shared/constants';
    import type { InformationQuizSettings, PokemonOption, ToastState, InformationHint, InformationChallengeQuestion } from '../../shared/types';

    /** Callback to return to hub */
    export let onBackToHub: () => void;
    /** Callback to return to settings */
    export let onBackToSettings: (() => void) | null = null;
    /** Current language code */
    export let languageCode: string = 'en';
    /** Current language ID */
    export let languageId: number = 9;
    /** Quiz settings */
    export let settings: InformationQuizSettings = DEFAULT_INFORMATION_QUIZ_SETTINGS;

    // Quiz state
    let currentQuestion = 1;
    let pokemonOptions: PokemonOption[] = [];
    let score = 0;
    let timeRemaining = settings.timeLimit;
    let wrongAnsweredIds: Set<number> = new Set();
    let disabledCards = false;
    let selectedLanguageId = languageId;

    // Hints state
    let currentHints: InformationHint[] = [];
    let revealedHints: InformationHint[] = [];
    let hardcoreTimeRemaining = 30;
    let hintRevealTimer: any = null;
    let hardcoreHintIndex = 0;

    // Challenge mode state
    let challengeQuestions: InformationChallengeQuestion[] = [];
    let showChallengeReview = false;

    // Modal states
    let showEndModal = false;
    let correctAnswer: PokemonOption | null = null;
    let lastCorrectId = 0;
    let isWin = false;

    // Timer
    let timerInterval: any = null;

    const { showErrorToast } = createToastHandlers((state: ToastState) => {
        toastState = state;
    });

    // Toast state
    let toastState: ToastState = {
        message: '',
        type: 'info',
        show: false
    };

    /**
     * @brief Map app language codes to PokeAPI language codes
     */
    function getPokeApiLanguageCode(appLanguageCode: string): string {
        const languageMap: { [key: string]: string } = {
            'en': 'en',
            'fr': 'fr',
            'de': 'de',
            'es': 'es',
            'it': 'it',
            'ja': 'ja',
            'ja-hrkt': 'ja',
            'ko': 'ko',
            'zh-hans': 'zh_Hans',
            'zh-hant': 'zh_Hant'
        };
        return languageMap[appLanguageCode] || 'en';
    }

    /**
     * @brief Cache for localized Pokemon data
     */
    const localizationCache: { [key: string]: { [key: string]: string } } = {};

    /**
     * @brief Fetch localized name from server or PokeAPI
     */
    async function getLocalizedName(endpoint: string, name: string, languageCode: string): Promise<string> {
        const cacheKey = `${endpoint}-${name}-${languageCode}`;
        
        if (localizationCache[cacheKey]) {
            return localizationCache[cacheKey][languageCode] || name;
        }

        try {
            // Try to fetch from server first (local data)
            const serverResponse = await fetch(`/api/localized/${endpoint}/${name}/${languageCode}`);
            if (serverResponse.ok) {
                const data = await serverResponse.json();
                localizationCache[cacheKey] = localizationCache[cacheKey] || {};
                localizationCache[cacheKey][languageCode] = data.name;
                return data.name;
            }
        } catch (error) {
            console.warn(`Failed to fetch from server: ${error}`);
        }

        // Fallback to PokeAPI
        try {
            const response = await fetch(`https://pokeapi.co/api/v2/${endpoint}/${name.toLowerCase().replace(/ /g, '-')}`);
            if (!response.ok) return capitalizeWords(name);
            
            const data = await response.json();
            const names = data.names || [];
            const pokeLanguage = getPokeApiLanguageCode(languageCode);
            
            const localizedEntry = names.find((n: any) => n.language.name === pokeLanguage);
            const result = localizedEntry?.name || capitalizeWords(name);
            
            localizationCache[cacheKey] = localizationCache[cacheKey] || {};
            localizationCache[cacheKey][languageCode] = result;
            
            return result;
        } catch (error) {
            console.error(`Failed to fetch localized ${endpoint}:`, error);
            return capitalizeWords(name);
        }
    }

    /**
     * @brief Capitalize each word in a string
     */
    function capitalizeWords(str: string): string {
        return str
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * @brief Convert roman numerals to arabic numbers
     * @example "generation-iv" -> "Generation 4"
     */
    function romanToArabic(text: string): string {
        const romanMap: { [key: string]: number } = {
            'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5,
            'vi': 6, 'vii': 7, 'viii': 8, 'ix': 9
        };
        
        const match = text.match(/generation-(.+)/i);
        if (match) {
            const roman = match[1].toLowerCase();
            const number = romanMap[roman];
            return number ? `Generation ${number}` : text;
        }
        return text;
    }

    /**
     * @brief Get all hints for a Pokemon
     */
    async function getHintsForPokemon(pokemonId: number): Promise<InformationHint[]> {
        const hints: InformationHint[] = [];
        let hintIndex = 0;

        try {
            const pokemonData = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`).then(r => r.json());
            const speciesData = await fetch(pokemonData.species.url).then(r => r.json());

            for (const infoType of settings.selectedInformations) {
                let value = '';
                let isFake = settings.enableFakeInformation && Math.random() * 100 < settings.fakeInformationRate;

                switch (infoType) {
                    case 'weight':
                        value = `${pokemonData.weight / 10} kg`;
                        break;
                    case 'height':
                        value = `${pokemonData.height / 10} m`;
                        break;
                    case 'abilities':
                        value = (await Promise.all(
                            pokemonData.abilities.map((a: any) =>
                                getLocalizedName('ability', a.ability.name, languageCode)
                            )
                        )).join(', ');
                        break;
                    case 'eggGroup':
                        value = (await Promise.all(
                            speciesData.egg_groups.map((g: any) =>
                                getLocalizedName('egg-group', g.name, languageCode)
                            )
                        )).join(', ');
                        break;
                    case 'generation':
                        value = romanToArabic(speciesData.generation.name);
                        break;
                    case 'shape':
                        value = await getLocalizedName('pokemon-shape', speciesData.shape.name, languageCode);
                        break;
                    case 'color':
                        value = await getLocalizedName('pokemon-color', speciesData.color.name, languageCode);
                        break;
                    case 'types':
                        value = (await Promise.all(
                            pokemonData.types.map((t: any) =>
                                getLocalizedName('type', t.type.name, languageCode)
                            )
                        )).join(', ');
                        break;
                }

                hints.push({
                    type: infoType,
                    value,
                    isFake,
                    revealOrder: hintIndex++
                });
            }
        } catch (error) {
            console.error('Failed to fetch hints:', error);
        }

        return hints;
    }

    /**
     * @brief Load a new question
     */
    async function loadQuestion(): Promise<void> {
        wrongAnsweredIds.clear();
        wrongAnsweredIds = wrongAnsweredIds;
        revealedHints = [];
        hardcoreHintIndex = 0;
        currentHints = [];

        try {
            // Get correct Pokemon
            let correctId = getRandomPokemonId(settings.selectedGenerations);
            lastCorrectId = correctId;

            // Get all hints
            currentHints = await getHintsForPokemon(correctId);

            // For easy mode, show all hints
            if (settings.gameMode === 'easy') {
                revealedHints = [...currentHints];
            }
            // For normal mode, start with 1 random hint
            else if (settings.gameMode === 'normal') {
                const randomHint = currentHints[Math.floor(Math.random() * currentHints.length)];
                revealedHints = [randomHint];
            }
            // For challenge mode, show 3 random hints
            else if (settings.gameMode === 'challenge') {
                const shuffled = [...currentHints].sort(() => Math.random() - 0.5);
                revealedHints = shuffled.slice(0, Math.min(3, shuffled.length));
            }
            // For hardcore mode, start with 2 random hints
            else if (settings.gameMode === 'hardcore') {
                const shuffled = [...currentHints].sort(() => Math.random() - 0.5);
                revealedHints = shuffled.slice(0, Math.min(2, shuffled.length));
                hardcoreHintIndex = 2;

                // Start hint reveal timer every 4 seconds
                if (hintRevealTimer) clearInterval(hintRevealTimer);
                hintRevealTimer = setInterval(() => {
                    if (hardcoreHintIndex < currentHints.length) {
                        revealedHints = [...revealedHints, currentHints[hardcoreHintIndex]];
                        hardcoreHintIndex++;
                    }
                }, 4000);
            }

            // Generate Pokemon options
            const pokemonIds: number[] = [correctId];
            const selectedPokemon = new Set<number>();
            selectedPokemon.add(correctId);

            while (pokemonIds.length < settings.numberOfOptions) {
                const randomId = getRandomPokemonId(settings.selectedGenerations);
                if (!selectedPokemon.has(randomId)) {
                    selectedPokemon.add(randomId);
                    pokemonIds.push(randomId);
                }
            }

            // Fetch Pokemon names
            pokemonOptions = [];
            for (const id of pokemonIds) {
                const name = await getPokemonNameLocalized(id, selectedLanguageId);
                pokemonOptions.push({
                    id,
                    name: name || '',
                    isCorrect: id === correctId
                });
            }

            // Shuffle options
            pokemonOptions = pokemonOptions.sort(() => Math.random() - 0.5);

            // Start timer if enabled
            if (settings.hasTimeLimit && settings.gameMode !== 'hardcore') {
                timeRemaining = settings.timeLimit;
                startTimer(true);
            }

            if (settings.gameMode === 'hardcore' && !hardcoreTimeRemaining) {
                hardcoreTimeRemaining = 30;
                startHardcoreTimer();
            }
        } catch (error) {
            console.error('Failed to load question:', error);
            showErrorToast(getLabel(languageCode, 'loading'));
        }
    }

    /**
     * @brief Start/continue timer
     */
    function startTimer(reset: boolean): void {
        if (timerInterval) clearInterval(timerInterval);
        if (reset) timeRemaining = settings.timeLimit;

        timerInterval = setInterval(() => {
            timeRemaining--;
            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                handleTimeout();
            }
        }, 1000);
    }

    /**
     * @brief Start hardcore timer
     */
    function startHardcoreTimer(): void {
        if (timerInterval) clearInterval(timerInterval);
        hardcoreTimeRemaining = 30;

        timerInterval = setInterval(() => {
            hardcoreTimeRemaining--;
            if (hardcoreTimeRemaining <= 0) {
                clearInterval(timerInterval);
                handleTimeout();
            }
        }, 1000);
    }

    /**
     * @brief Handle timer timeout
     */
    function handleTimeout(): void {
        handleAnswer(false, -1);
    }

    /**
     * @brief Reveal next hint (for normal mode)
     */
    function revealNextHint(): void {
        const unrevealed = currentHints.filter(h => !revealedHints.find(r => r.type === h.type && r.value === h.value));
        if (unrevealed.length > 0) {
            const nextHint = unrevealed[0];
            revealedHints = [...revealedHints, nextHint];
        }
    }

    /**
     * @brief Calculate points for current answer
     */
    function calculatePoints(): number {
        if (settings.gameMode === 'easy') {
            if (wrongAnsweredIds.size === 0) return 3;
            if (wrongAnsweredIds.size === 1) return 1;
            return 0;
        } else if (settings.gameMode === 'normal') {
            const points = Math.max(0, 5 - wrongAnsweredIds.size);
            return points;
        } else if (settings.gameMode === 'hardcore') {
            // Points decrease with time used
            const timeUsed = 30 - hardcoreTimeRemaining;
            const basePoints = Math.max(0, 10 - Math.floor(timeUsed / 3));
            return basePoints;
        }
        return 0;
    }

    /**
     * @brief Handle answer selection
     */
    function handleAnswer(isCorrect: boolean, pokemonId: number): void {
        if (timerInterval) clearInterval(timerInterval);
        if (hintRevealTimer) clearInterval(hintRevealTimer);
        if (disabledCards) return;

        // Challenge Mode: Always advance regardless of answer
        if (settings.gameMode === 'challenge') {
            const correctOption = pokemonOptions.find(p => p.isCorrect);
            challengeQuestions.push({
                questionNumber: currentQuestion,
                revealedHints: [...revealedHints],
                correctPokemonName: correctOption?.name || '',
                correctPokemonId: lastCorrectId,
                userAnswerId: pokemonId === -1 ? -1 : pokemonId,
                userAnswerName: pokemonId === -1 ? '' : (pokemonOptions.find(p => p.id === pokemonId)?.name || ''),
                allOptions: [...pokemonOptions],
                isCorrect: isCorrect && pokemonId !== -1
            });

            if (currentQuestion < CHALLENGE_QUESTION_COUNT) {
                currentQuestion++;
                loadQuestion();
            } else {
                showChallengeReview = true;
            }
            return;
        }

        // Normal and Easy Modes: Check if wrong answer
        if (!isCorrect && pokemonId !== -1) {
            wrongAnsweredIds.add(pokemonId);
            wrongAnsweredIds = wrongAnsweredIds;

            // Normal mode: reveal next hint on wrong answer
            if (settings.gameMode === 'normal') {
                revealNextHint();
                startTimer(false);
            }
            return;
        }

        // Correct answer or no more attempts
        const points = calculatePoints();
        score += points;

        // Save settings before quiz ends
        saveInformationSettings(settings);

        if (currentQuestion < 10) {
            currentQuestion++;
            loadQuestion();
        } else {
            const correctOption = pokemonOptions.find(p => p.isCorrect);
            if (correctOption) {
                correctAnswer = correctOption;
            }
            isWin = true;
            showEndModal = true;
        }
    }

    /**
     * @brief Handle end modal actions
     */
    function handleEndModalHome(): void {
        showEndModal = false;
        onBackToHub();
    }

    function handleEndModalChangeSettings(): void {
        showEndModal = false;
        if (onBackToSettings) onBackToSettings();
    }

    function handleEndModalRetry(): void {
        showEndModal = false;
        currentQuestion = 1;
        score = 0;
        challengeQuestions = [];
        wrongAnsweredIds.clear();
        loadQuestion();
    }

    function handleChallengeReviewBack(): void {
        showChallengeReview = false;
        onBackToHub();
    }

    // Save settings on mount
    saveInformationSettings(settings);

    onMount(async () => {
        await loadQuestion();
    });

    onMount(() => {
        return () => {
            if (timerInterval) clearInterval(timerInterval);
            if (hintRevealTimer) clearInterval(hintRevealTimer);
        };
    });
</script>

<main class="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-8 flex items-center justify-center">
    {#if showEndModal && correctAnswer}
        <QuizEndModal
            {isWin}
            {score}
            totalQuestions={10}
            {correctAnswer}
            {languageCode}
            gameMode={settings.gameMode === 'easy' || settings.gameMode === 'normal' ? 'score' : settings.gameMode}
            on:home={handleEndModalHome}
            on:changeSettings={handleEndModalChangeSettings}
            on:retry={handleEndModalRetry}
        />
    {/if}
    <div class="max-w-4xl mx-auto w-full">
        {#if showChallengeReview}
            <div class="text-center py-12">
                <h2 class="text-3xl font-bold mb-6">{getLabel(languageCode, 'quizCompleted')}</h2>
                <p class="text-2xl mb-8">Score: {score}/10</p>
                <button 
                    on:click={handleChallengeReviewBack}
                    class="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600"
                >
                    {getLabel(languageCode, 'back')}
                </button>
            </div>
        {:else}
            <!-- Quiz Header -->
            <div class="quiz-header-row">
                <QuizHeader
                    languageCode={languageCode}
                    quizTitleLabel="information_quiz"
                    gameMode={settings.gameMode === 'easy' || settings.gameMode === 'normal' ? 'score' : settings.gameMode}
                    currentQuestion={currentQuestion}
                    totalQuestions={10}
                    score={parseInt(score.toString())}
                    {onBackToHub}
                />
            </div>

            <!-- Hints Display -->
            <div class="bg-white rounded-lg shadow-lg p-8 mb-8">
                <h3 class="text-lg font-semibold mb-4">{getLabel(languageCode, 'information_hints')}</h3>
                <div class="hints-list space-y-2">
                    {#each revealedHints as hint (hint.type)}
                        <div class="hint-item" class:fake={hint.isFake}>
                            <span class="hint-type font-semibold capitalize">{getLabel(languageCode, `information_${hint.type}`)}:</span>
                            <span class="hint-value">{hint.value}</span>
                            {#if hint.isFake}
                                <span class="fake-badge">({getLabel(languageCode, 'information_fakeHint')})</span>
                            {/if}
                        </div>
                    {/each}
                </div>

                {#if settings.gameMode === 'normal'}
                    <button on:click={revealNextHint} class="mt-4 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">
                        {getLabel(languageCode, 'information_revealNextHint')}
                    </button>
                {/if}
            </div>

            <!-- Timer Display -->
            {#if settings.hasTimeLimit}
                <div class="mb-8">
                    <TimerDisplay timeRemaining={timeRemaining} />
                </div>
            {/if}

            <!-- Pokemon Cards Grid -->
            <div class="pokemon-grid">
                {#each pokemonOptions as pokemon (pokemon.id)}
                    <Pokecard
                        {pokemon}
                        showError={wrongAnsweredIds.has(pokemon.id)}
                        disabled={disabledCards}
                        showSprite={settings.showSprites}
                        on:selected={() => handleAnswer(pokemon.isCorrect, pokemon.id)}
                    />
                {/each}
            </div>
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

    .pokemon-grid {
        @apply grid grid-cols-2 gap-4;
    }

    .pokemon-grid:md {
        @apply grid-cols-3;
    }

    .pokemon-grid:lg {
        @apply grid-cols-4;
    }

    .hints-list {
        @apply space-y-3;
    }

    .hint-item {
        @apply p-3 bg-blue-50 border-l-4 border-blue-400 rounded;
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

    .fake-badge {
        @apply text-yellow-600 text-sm ml-2;
    }
</style>
