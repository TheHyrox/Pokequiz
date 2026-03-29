<script lang="ts">
    import { getPokemonDescription } from '../../server/src/lib/description';
    import { getPokemonNameLocalized } from '../../server/src/lib/name';
    import { getRandomInt } from '../../server/src/lib/utils/utils';
    import Pokecard from '../components/pokecard.svelte';
    import Toast from '../components/Toast.svelte';

    export let onBackToHub: () => void;

    export let settings = {
        hasTimeLimit: false,
        timeLimit: 15,
        gameMode: 'score' as 'score' | 'infinite',
        changeDescription: false
    };

    interface PokemonOption {
        name: string;
        id: number;
        isCorrect: boolean;
    }

    let currentQuestion = 1;
    let totalQuestions = settings.gameMode === 'infinite' ? 999 : 10;
    let description = '';
    let pokemonOptions: PokemonOption[] = [];
    let loading = true;
    let correctPokemon = '';
    let score = 0;
    let timeRemaining = settings.timeLimit;
    let timerActive = false;
    let currentDescriptionIndex = 0;
    let allDescriptions: string[] = [];
    let cardErrorStates: Map<number, boolean> = new Map();
    let disabledCards = false;
    let toastMessage = '';
    let toastType: 'error' | 'success' | 'info' = 'info';
    let showToast = false;

    // Timer
    let timerInterval: NodeJS.Timeout | null = null;

    function startTimer() {
        if (!settings.hasTimeLimit) return;
        
        timerActive = true;
        timeRemaining = settings.timeLimit;
        
        timerInterval = setInterval(() => {
            timeRemaining--;
            if (timeRemaining <= 0) {
                clearInterval(timerInterval!);
                handleTimeout();
            }
        }, 1000);
    }

    function handleTimeout() {
        timerActive = false;
        disabledCards = true;
        showErrorToast('Time\'s up! Wrong answer.');
        
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

    async function loadQuestion() {
        if (timerInterval) clearInterval(timerInterval);
        
        loading = true;
        pokemonOptions = [];
        allDescriptions = [];
        currentDescriptionIndex = 0;
        cardErrorStates.clear();
        disabledCards = false;
        showToast = false;
        
        // Get 4 different random pokemon IDs
        const selectedPokemon = new Set<number>();
        const pokemonIds: number[] = [];
        
        let correctId = getRandomInt(1025);
        while (selectedPokemon.has(correctId)) {
            correctId = getRandomInt(1025);
        }
        selectedPokemon.add(correctId);
        pokemonIds.push(correctId);
        correctPokemon = correctId.toString();
        
        // Get 3 more random different pokemon
        while (pokemonIds.length < 4) {
            const randomId = getRandomInt(1025);
            if (!selectedPokemon.has(randomId)) {
                selectedPokemon.add(randomId);
                pokemonIds.push(randomId);
            }
        }
        
        // Get descriptions for the correct pokemon
        const descriptions = await getPokemonDescription(correctId.toString(), '5', null);
        allDescriptions = descriptions || ['No description found'];
        description = allDescriptions[0];
        
        // Create options with localized names
        const options: PokemonOption[] = [];
        for (const pokemonId of pokemonIds) {
            const name = await getPokemonNameLocalized(pokemonId, 'en');
            options.push({
                name: name || pokemonId.toString(),
                id: pokemonId,
                isCorrect: pokemonId === correctId
            });
        }
        
        // Shuffle options
        pokemonOptions = options.sort(() => Math.random() - 0.5);
        loading = false;
        startTimer();
    }

    function changeDescription() {
        if (currentDescriptionIndex < allDescriptions.length - 1) {
            currentDescriptionIndex++;
            description = allDescriptions[currentDescriptionIndex];
        }
    }

    function endQuiz() {
        if (timerInterval) clearInterval(timerInterval);
        showSuccessToast(`Quiz completed! Final score: ${score}`);
        setTimeout(() => {
            onBackToHub();
        }, 2000);
    }

    function handleAnswer(isCorrect: boolean) {
        if (timerInterval) clearInterval(timerInterval);
        timerActive = false;

        if (isCorrect) {
            // Calculate points based on mode
            if (settings.gameMode === 'score') {
                // Score decreases with time used
                const timeUsed = settings.timeLimit - timeRemaining;
                const points = Math.max(10 - timeUsed, 1);
                score += points;
            } else {
                // Infinite mode: 1 point per correct answer
                score += 1;
            }

            if (settings.gameMode === 'infinite') {
                // Continue loading new questions
                loadQuestion();
            } else if (currentQuestion < totalQuestions) {
                currentQuestion++;
                loadQuestion();
            } else {
                endQuiz();
            }
        } else {
            // Show error state on card
            disabledCards = true;
            cardErrorStates.set(-1, true); // Mark that there's an error

            if (settings.gameMode === 'infinite') {
                // End infinite mode on wrong answer
                showErrorToast('Wrong answer! Quiz ended.');
                setTimeout(() => {
                    onBackToHub();
                }, 2000);
            } else {
                // Score mode: show error then continue
                showErrorToast('Wrong answer! But keep going.');
                setTimeout(() => {
                    if (currentQuestion < totalQuestions) {
                        currentQuestion++;
                        loadQuestion();
                    } else {
                        endQuiz();
                    }
                }, 2000);
            }
        }
    }

    loadQuestion();



</script>

<main class="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-8 flex items-center justify-center">
    <div class="max-w-4xl mx-auto w-full">
        <!-- Header -->
        <div class="flex justify-between items-center mb-8">
            <div>
                <h1 class="text-4xl font-bold text-gray-800 mb-2">Pokequiz - Description quiz</h1>
                {#if settings.gameMode === 'infinite'}
                    <p class="text-lg text-gray-600">Score: {score} | Mode: Infini</p>
                {:else}
                    <p class="text-lg text-gray-600">Question {currentQuestion}/{totalQuestions} | Score: {score}</p>
                {/if}
            </div>
            <button
                on:click={onBackToHub}
                class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
                ← Back
            </button>
        </div>

        {#if loading}
            <div class="text-center py-12">
                <p class="text-gray-600">Loading...</p>
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
                            Voir une autre description
                        </button>
                    </div>
                {/if}
            </div>

            <!-- Pokemon Cards Grid -->
            <div class="grid grid-cols-2 gap-6 md:grid-cols-4">
                {#each pokemonOptions as pokemon (pokemon.name)}
                    <Pokecard 
                        {pokemon}
                        disabled={disabledCards}
                        on:selected={() => handleAnswer(pokemon.isCorrect)}
                    />
                {/each}
            </div>
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

<style>
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
