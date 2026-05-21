<script lang="ts">
    /**
     * @brief Information quiz game component
     * @description Main quiz gameplay for guessing Pokemon from characteristics
     */
    import { onMount } from 'svelte';
    import { getPokemonNameLocalized, preloadPokemonNames } from './lib/pokemonNamesClient';
    import { getPokemonInformationData } from './lib/pokemonInformationClient';
    import { getRandomPokemonId } from '../../shared/utils/pokemonUtils';
    import Pokecard from '../components/pokecard.svelte';
    import Toast from '../components/Toast.svelte';
    import QuizHeader from '../components/quiz/QuizHeader.svelte';
    import TimerDisplay from '../components/quiz/TimerDisplay.svelte';
    import QuizEndModal from '../components/quiz/QuizEndModal.svelte';
    import ChallengeReviewScreen from '../components/quiz/ChallengeReviewScreen.svelte';
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
     * @brief Cache for localized data files (abilities, colors, etc.)
     */
    const localizedDataCache: { [key: string]: any[] } = {};

    /**
     * @brief Fetch localized data items from server
     */
    async function getLocalizedDataItems(dataType: string, languageCode: string): Promise<any[]> {
        const cacheKey = `${dataType}-${languageCode}`;
        
        if (localizedDataCache[cacheKey]) {
            return localizedDataCache[cacheKey];
        }

        try {
            const response = await fetch(`/api/${dataType}/${languageCode}`);
            if (response.ok) {
                const data = await response.json();
                const items = Array.isArray(data) ? data : Object.values(data);
                localizedDataCache[cacheKey] = items;
                return items;
            }
        } catch (error) {
            console.warn(`Failed to fetch ${dataType} data:`, error);
        }
        
        return [];
    }

    /**
     * @brief Generate a fake value for a hint using localized data
     */
    async function generateFakeValue(infoType: string, realValue: string): Promise<string> {
        switch (infoType) {
            case 'weight': {
                const fakeWeight = Math.floor(Math.random() * 999) + 1;
                return `${fakeWeight} kg`;
            }
            case 'height': {
                const fakeHeight = (Math.random() * 19.9 + 0.1).toFixed(1);
                return `${fakeHeight} m`;
            }
            case 'abilities': {
                const abilities = await getLocalizedDataItems('ability', languageCode);
                if (abilities.length > 0) {
                    const randomAbility = abilities[Math.floor(Math.random() * abilities.length)];
                    return randomAbility.localizedName || randomAbility.name;
                }
                return 'Unknown Ability';
            }
            case 'eggGroup': {
                const eggGroups = await getLocalizedDataItems('egggroup', languageCode);
                if (eggGroups.length > 0) {
                    const randomEggGroup = eggGroups[Math.floor(Math.random() * eggGroups.length)];
                    return randomEggGroup.localizedName || randomEggGroup.name;
                }
                return 'Unknown Egg Group';
            }
            case 'shape': {
                const shapes = await getLocalizedDataItems('shape', languageCode);
                if (shapes.length > 0) {
                    const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
                    return randomShape.localizedName || randomShape.name;
                }
                return 'Unknown Shape';
            }
            case 'color': {
                const colors = await getLocalizedDataItems('color', languageCode);
                if (colors.length > 0) {
                    const randomColor = colors[Math.floor(Math.random() * colors.length)];
                    return randomColor.localizedName || randomColor.name;
                }
                return 'Unknown Color';
            }
            case 'types': {
                const types = await getLocalizedDataItems('type', languageCode);
                if (types.length > 0) {
                    const randomType = types[Math.floor(Math.random() * types.length)];
                    return randomType.localizedName || randomType.name;
                }
                return 'Unknown Type';
            }
            case 'category': {
                const category = await getLocalizedDataItems('category', languageCode);
                if (category.length > 0) {
                    const randomCategory = category[Math.floor(Math.random() * category.length)];
                    return randomCategory.localizedName || randomCategory.name;
                }
                return 'Unknown Category';
            }
            case 'habitat': {
                const habitats = await getLocalizedDataItems('habitat', languageCode);
                if (habitats.length > 0) {
                    const randomHabitat = habitats[Math.floor(Math.random() * habitats.length)];
                    return randomHabitat.name;
                }
                return 'Unknown Habitat';
            }
            case 'generation': {
                const generations = ['Generation 1', 'Generation 2', 'Generation 3', 'Generation 4', 'Generation 5', 'Generation 6', 'Generation 7', 'Generation 8', 'Generation 9'];
                return generations[Math.floor(Math.random() * generations.length)];
            }
            default:
                return realValue;
        }
    }

    /**
     * @brief Convert roman numerals to arabic numbers
     * @example "generation-iv" -> "Generation 4"
     */
    function romanToArabic(text: string | number): string {
        if (typeof text === 'number') {
            return `${text}`;
        }

        const romanMap: { [key: string]: number } = {
            'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5,
            'vi': 6, 'vii': 7, 'viii': 8, 'ix': 9
        };
        
        const match = text.match(/generation-(.+)/i);
        if (match) {
            const roman = match[1].toLowerCase();
            const number = romanMap[roman];
            return number ? `${number}` : text;
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
            let enrichedData = await getPokemonInformationData(pokemonId, languageId);
            if (!enrichedData) {
                const pokemonData = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`).then(r => r.json());
                const speciesData = await fetch(pokemonData.species.url).then(r => r.json());
                enrichedData = { pokemon: pokemonData, species: speciesData };
            }
            for (const infoType of settings.selectedInformations) {
                let value = '';
                let isFake = settings.enableFakeInformation && Math.random() * 100 < settings.fakeInformationRate;

                switch (infoType) {
                    case 'weight':
                        value = enrichedData.weight ? `${enrichedData.weight / 10} kg` : 'Unknown';
                        break;
                    case 'height':
                        value = enrichedData.height ? `${enrichedData.height / 10} m` : 'Unknown';
                        break;
                    case 'abilities':
                        if (enrichedData.abilities) {
                            if (enrichedData.abilities[0]?.name && typeof enrichedData.abilities[0].name === 'string') {
                                value = enrichedData.abilities.map((a: any) => a.name).join(', ');
                            } else if (enrichedData.pokemon?.abilities) {
                                value = enrichedData.pokemon.abilities.map((a: any) => {
                                    const name = a.ability.name;
                                    return name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ');
                                }).join(', ');
                            }
                        }
                        break;
                    case 'eggGroup':
                        if (enrichedData.eggGroups) {
                            value = enrichedData.eggGroups.join(', ');
                        }
                        break;
                    case 'generation':
                        value = enrichedData.generation ? romanToArabic(enrichedData.generation) : 'Unknown';
                        break;
                    case 'shape':
                        value = enrichedData.shape || 'Unknown';
                        break;
                    case 'color':
                        value = enrichedData.color || 'Unknown';
                        break;
                    case 'types':
                        if (enrichedData.types) {
                            if (enrichedData.types[0]?.name && typeof enrichedData.types[0].name === 'string') {
                                value = enrichedData.types.map((t: any) => t.name).join(', ');
                            } else if (enrichedData.pokemon?.types) {
                                value = enrichedData.pokemon.types.map((t: any) => {
                                    const name = t.type.name;
                                    return name.charAt(0).toUpperCase() + name.slice(1);
                                }).join(', ');
                            }
                        }
                        break;
                    case 'genera':
                        if (enrichedData.id) {
                            try {
                                const genusData = await fetch(`/api/genera/${enrichedData.id}/${languageCode}`).then(r => r.json());
                                value = genusData.name || 'Unknown';
                            } catch {
                                value = 'Unknown';
                            }
                        }
                        break;
                    case 'habitat':
                        value = enrichedData.habitat?.name || 'Unknown';
                        break;
                }

                if (isFake) {
                    value = await generateFakeValue(infoType, value);
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
                        const nextHint = currentHints[hardcoreHintIndex];
                        // Check if hint is not already revealed to avoid duplicates
                        if (!revealedHints.find(h => h.type === nextHint.type && h.value === nextHint.value)) {
                            revealedHints = [...revealedHints, nextHint];
                        }
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
        // Preload all pokemon names to avoid repeated fetch requests during quiz
        await preloadPokemonNames(languageId);
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
            <ChallengeReviewScreen
                {languageCode}
                {challengeQuestions}
                onBackToHub={handleChallengeReviewBack}
            />
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
                    {#each revealedHints as hint, hintIndex (hintIndex)}
                        <div class="hint-item">
                            <span class="hint-type font-semibold capitalize">{getLabel(languageCode, `information_${hint.type}`)}:</span>
                            <span class="hint-value">{hint.value}</span>
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
                    <div class="pokemon-grid-item">
                        <Pokecard
                            {pokemon}
                            showError={wrongAnsweredIds.has(pokemon.id)}
                            disabled={disabledCards}
                            showSprite={settings.showSprites}
                            on:selected={() => handleAnswer(pokemon.isCorrect, pokemon.id)}
                        />
                    </div>
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

    .hints-list {
        @apply space-y-3;
    }

    .hint-item {
        @apply p-3 bg-blue-50 border-l-4 border-blue-400 rounded;
    }

    .hint-type {
        @apply text-gray-700;
    }

    .hint-value {
        @apply text-gray-600 ml-2;
    }
</style>
