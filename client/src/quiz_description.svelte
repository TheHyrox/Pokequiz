<script lang="ts">
    import { onMount } from 'svelte';
    import { getPokemonDescription } from '../../server/src/lib/description';
    import { getPokemonNameLocalized } from '../../server/src/lib/name';
    import { getRandomInt } from '../../server/src/lib/utils/utils';
    import Pokecard from '../components/pokecard.svelte';
    import Toast from '../components/Toast.svelte';
    import Autocomplete from '../components/Autocomplete.svelte';
    import { getLabel } from './lib/translations';

    export let onBackToHub: () => void;
    export let languageCode: string = 'en';
    export let languageId: number = 9;

    export let settings = {
        hasTimeLimit: false,
        timeLimit: 15,
        gameMode: 'score' as 'score' | 'infinite' | 'challenge' | 'hardcore',
        changeDescription: false
    };

    interface PokemonOption {
        name: string;
        id: number;
        isCorrect: boolean;
    }

    interface ChallengeQuestion {
        questionNumber: number;
        description: string;
        correctPokemonName: string;
        correctPokemonId: number;
        userAnswerId: number;
        userAnswerName: string;
        allOptions: PokemonOption[];
        isCorrect: boolean;
    }

    let currentQuestion = 1;
    let totalQuestions = settings.gameMode === 'infinite' ? 999 : 10;
    let description = '';
    let pokemonOptions: PokemonOption[] = [];
    let loading = true;
    let score = 0;
    let timeRemaining = settings.timeLimit;
    let currentDescriptionIndex = 0;
    let allDescriptions: string[] = [];
    let wrongAnsweredIds: Set<number> = new Set();
    let disabledCards = false;
    let toastMessage = '';
    let toastType: 'error' | 'success' | 'info' = 'info';
    let showToast = false;
    let errorCountThisQuestion = 0;
    let selectedLanguageId = languageId;
    let challengeQuestions: ChallengeQuestion[] = [];
    let showChallengeReview = false;
    let hardcoreUserInput: string = '';
    let correctPokemonName: string = '';
    let allPokemonList: Array<{ id: number; name: string }> = [];
    let autocompleteRef: any;

    // Timer
    let timerInterval: NodeJS.Timeout | null = null;

    function startTimer(reset: boolean = true) {
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

    function handleTimeout() {
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

    function handleHardcoreSubmit() {
        if (timerInterval) clearInterval(timerInterval);
        
        const userInputNormalized = normalizeText(hardcoreUserInput);
        const correctNameNormalized = normalizeText(correctPokemonName);
        const isCorrect = userInputNormalized === correctNameNormalized;

        if (isCorrect) {
            score += 1;
            showSuccessToast(getLabel(languageCode, 'correct'));
            
            setTimeout(() => {
                if (currentQuestion < 10) {
                    currentQuestion++;
                    loadQuestion();
                } else {
                    endQuiz();
                }
            }, 1500);
        } else {
            errorCountThisQuestion++;
            showErrorToast(getLabel(languageCode, 'incorrect'));
            setTimeout(() => {
                hardcoreUserInput = '';
                autocompleteRef?.focus();
            }, 1500);
        }
    }

    function showErrorToast(message: string) {
        toastMessage = message;
        toastType = 'error';
        showToast = true;
    }

    function showSuccessToast(message: string) {
        toastMessage = message;
        toastType = 'success';
        showToast = true;
    }

    function normalizeText(text: string): string {
        return text
            .toLowerCase()
            .trim()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    async function loadAllPokemonNames() {
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

    async function loadQuestion() {
        if (timerInterval) clearInterval(timerInterval);
        
        loading = true;
        pokemonOptions = [];
        allDescriptions = [];
        currentDescriptionIndex = 0;
        wrongAnsweredIds.clear();
        disabledCards = false;
        showToast = false;
        errorCountThisQuestion = 0;
        hardcoreUserInput = '';
        
        // Get 4 different random pokemon IDs
        const selectedPokemon = new Set<number>();
        const pokemonIds: number[] = [];
        
        let correctId = getRandomInt(1025);
        while (selectedPokemon.has(correctId)) {
            correctId = getRandomInt(1025);
        }
        selectedPokemon.add(correctId);
        pokemonIds.push(correctId);
        
        // Get 3 more random different pokemon
        while (pokemonIds.length < 4) {
            const randomId = getRandomInt(1025);
            if (!selectedPokemon.has(randomId)) {
                selectedPokemon.add(randomId);
                pokemonIds.push(randomId);
            }
        }

        const descriptions = await getPokemonDescription(correctId.toString(), selectedLanguageId.toString(), null);
        allDescriptions = descriptions || ['No description found'];
        description = allDescriptions[0];

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
        loading = false;
        startTimer();

        if (settings.gameMode === 'hardcore') {
            setTimeout(() => {
                autocompleteRef?.focus();
            }, 100);
        }
    }

    function changeDescription() {
        if (currentDescriptionIndex < allDescriptions.length - 1) {
            currentDescriptionIndex++;
            description = allDescriptions[currentDescriptionIndex];
        }
    }

    function calculatePoints(): number {
        if (settings.gameMode === 'infinite') {
            return 1; 
        }

        if (settings.hasTimeLimit) {
            const timeUsed = settings.timeLimit - timeRemaining;
            if (timeUsed < 2) {
                return 10; 
            } else if (timeUsed < 5) {
                return 5; 
            } else if (timeUsed < 15) {
                return 3; 
            } else if (timeUsed < 25) {
                return 2;
            }
            return 1;
        } else {
            if (errorCountThisQuestion === 0) {
                return 3;
            } else if (errorCountThisQuestion === 1) {
                return 2;
            } else if (errorCountThisQuestion === 2) {
                return 1;
            }
            return 0; 
        }
    }

    function endQuiz() {
        if (timerInterval) clearInterval(timerInterval);
        showSuccessToast(`${getLabel(languageCode, 'quizCompleted')} ${score}`);
        setTimeout(() => {
            onBackToHub();
        }, 2000);
    }

    function handleAnswer(isCorrect: boolean, pokemonId: number) {
        if (timerInterval) clearInterval(timerInterval);

        if (settings.gameMode === 'challenge') {
            const selectedOption = pokemonOptions.find(p => p.id === pokemonId);
            const correctOption = pokemonOptions.find(p => p.isCorrect);
            
            challengeQuestions.push({
                questionNumber: currentQuestion,
                description: description,
                correctPokemonName: correctOption?.name || '',
                correctPokemonId: correctOption?.id || 0,
                userAnswerId: pokemonId,
                userAnswerName: selectedOption?.name || '',
                allOptions: [...pokemonOptions],
                isCorrect: isCorrect
            });

            if (currentQuestion < 10) {
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
                showErrorToast(getLabel(languageCode, 'quizEnded'));
                setTimeout(() => {
                    onBackToHub();
                }, 2000);
            } else {
                showErrorToast(`${getLabel(languageCode, 'wrongAnswer')} ${getLabel(languageCode, 'keepGoing')}`);
            }
        }
    }

    loadQuestion();

    onMount(async () => {
        if (settings.gameMode === 'hardcore') {
            await loadAllPokemonNames();
        }
    });
</script>

<main class="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-8 flex items-center justify-center">
    <div class="max-w-4xl mx-auto w-full">
        {#if showChallengeReview}
            <!-- Challenge Review Screen -->
            <div>
                <button
                    on:click={onBackToHub}
                    class="mb-6 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                    {getLabel(languageCode, 'back')}
                </button>
                
                <div class="bg-white rounded-lg shadow-lg p-8 mb-8">
                    <h2 class="text-3xl font-bold text-gray-800 mb-2">{getLabel(languageCode, 'reviewAnswers')}</h2>
                    <p class="text-xl text-gray-600 mb-6">{getLabel(languageCode, 'score')}: {challengeQuestions.filter(q => q.isCorrect).length}/10</p>
                </div>

                <!-- Challenge Questions Review -->
                <div class="space-y-8">
                    {#each challengeQuestions as question (question.questionNumber)}
                        <div class="bg-white rounded-lg shadow-lg p-6">
                            <h3 class={`text-2xl font-bold mb-4 ${question.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                {getLabel(languageCode, 'question')} {question.questionNumber}/10
                            </h3>
                            
                            <p class="text-xl text-gray-800 mb-6 italic">"{question.description}"</p>
                            
                            <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
                                {#each question.allOptions as option}
                                    <div class={`p-4 border-2 rounded-lg text-center transition-all
                                        ${option.isCorrect ? 'border-green-500 bg-green-50' : 
                                          option.id === question.userAnswerId && !option.isCorrect ? 'border-red-500 bg-red-50' : 
                                          'border-gray-200 bg-gray-50'}`}>
                                        <p class="font-semibold text-gray-800">{option.name}</p>
                                        {#if option.isCorrect}
                                            <p class="text-sm text-green-600 mt-2">✓ {getLabel(languageCode, 'correctAnswer')}</p>
                                        {/if}
                                        {#if option.id === question.userAnswerId && !option.isCorrect}
                                            <p class="text-sm text-red-600 mt-2">✗ {getLabel(languageCode, 'yourAnswer')}</p>
                                        {/if}
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/each}
                </div>

                <button
                    on:click={onBackToHub}
                    class="mt-8 w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-bold text-lg"
                >
                    {getLabel(languageCode, 'back')}
                </button>
            </div>
        {:else}
            <!-- Normal Quiz Screen -->
        <!-- Header -->
        <div class="flex justify-between items-center mb-8">
            <div>
                <h1 class="text-4xl font-bold text-gray-800 mb-2">Pokequiz - {getLabel(languageCode, 'descriptionQuiz')}</h1>
                {#if settings.gameMode === 'infinite'}
                    <p class="text-lg text-gray-600">{getLabel(languageCode, 'score')}: {score} | {getLabel(languageCode, 'infiniteModeLabel')}</p>
                {:else if settings.gameMode === 'challenge'}
                    <p class="text-lg text-gray-600">{getLabel(languageCode, 'question')} {currentQuestion}/10</p>
                {:else if settings.gameMode === 'hardcore'}
                    <p class="text-lg text-gray-600">{getLabel(languageCode, 'question')} {currentQuestion}/10 | {getLabel(languageCode, 'score')}: {score}</p>
                {:else}
                    <p class="text-lg text-gray-600">{getLabel(languageCode, 'question')} {currentQuestion}/{totalQuestions} | {getLabel(languageCode, 'score')}: {score}</p>
                {/if}
            </div>
            <button
                on:click={onBackToHub}
                class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
                {getLabel(languageCode, 'back')}
            </button>
        </div>

        {#if loading}
            <div class="text-center py-12">
                <p class="text-gray-600">{getLabel(languageCode, 'loading')}</p>
            </div>
        {:else}
            <!-- Timer Display -->
            {#if settings.hasTimeLimit}
                <div class="mb-6 text-center">
                    <div class={`timer-display ${timeRemaining <= 5 ? 'timer-danger' : ''}`}>
                        {timeRemaining}s
                    </div>
                </div>
            {/if}

            <!-- Description Section -->
            <div class="bg-white rounded-lg shadow-lg p-8 mb-8">
                <p class="text-2xl text-gray-800 text-center leading-relaxed">
                    "{description}"
                </p>
                
                <!-- Description Change Button -->
                {#if settings.changeDescription && currentDescriptionIndex < allDescriptions.length - 1}
                    <div class="text-center mt-6">
                        <button
                            on:click={changeDescription}
                            class="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                        >
                            {getLabel(languageCode, 'changeDescriptionBtn')}
                        </button>
                    </div>
                {/if}
            </div>

            <!-- Pokemon Cards Grid or Hardcore Input -->
            {#if settings.gameMode === 'hardcore'}
                <!-- Hardcore Mode - Autocomplete Input -->
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
                <!-- Normal Mode - Pokemon Cards Grid -->
                <div class="grid grid-cols-2 gap-6 md:grid-cols-4">
                    {#each pokemonOptions as pokemon (pokemon.name)}
                        <Pokecard 
                            {pokemon}
                            showError={wrongAnsweredIds.has(pokemon.id)}
                            disabled={disabledCards}
                            on:selected={() => handleAnswer(pokemon.isCorrect, pokemon.id)}
                        />
                    {/each}
                </div>
            {/if}
        {/if}
        {/if}
    </div>
</main>

<!-- Toast -->
{#if showToast}
    <Toast 
        message={toastMessage}
        type={toastType}
        autoClose={true}
        duration={2000}
        onClose={() => { showToast = false; }}
    />
{/if}

<style lang="postcss">
    :global(body) {
        margin: 0;
        padding: 0;
    }

    .timer-display {
        @apply text-6xl font-bold text-blue-600 p-4 bg-blue-100 rounded-lg;
    }

    .timer-danger {
        @apply text-red-600 bg-red-100;
        animation: pulse 0.5s infinite;
    }

    @keyframes pulse {
        0%, 100% {
            opacity: 1;
        }
        50% {
            opacity: 0.7;
        }
    }
</style>
