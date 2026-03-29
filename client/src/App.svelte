<script lang="ts">
    import QuizSettings from '../components/QuizSettings.svelte';
    import DescriptionQuiz from './quiz_description.svelte';

    interface Game {
        id: string;
        name: string;
        description: string;
        icon: string;
    }

    interface QuizSettingsType {
        hasTimeLimit: boolean;
        timeLimit: number;
        gameMode: 'score' | 'infinite';
        changeDescription: boolean;
    }

    const games: Game[] = [
        {
            id: 'description-quiz',
            name: 'Description Quiz',
            description: 'Guess the Pokemon from its Pokédex description',
            icon: '📝'
        }
    ];

    let selectedGame: Game | null = null;
    let quizStarted = false;
    let quizSettings: QuizSettingsType | null = null;

    function selectGame(game: Game) {
        selectedGame = game;
        quizStarted = false;
    }

    function handleStartQuiz(settings: QuizSettingsType) {
        quizSettings = settings;
        quizStarted = true;
    }

    function backToHub() {
        selectedGame = null;
        quizStarted = false;
        quizSettings = null;
    }
</script>

<main class="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
    <!-- Main Hub -->
    {#if !selectedGame}
        <div class="flex flex-col items-center justify-center min-h-screen px-4">
            <div class="text-center mb-12">
                <h1 class="text-5xl font-bold text-gray-800 mb-4">Pokequiz</h1>
                <p class="text-lg text-gray-600">Test your Pokemon knowledge!</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                {#each games as game (game.id)}
                    <button
                        on:click={() => selectGame(game)}
                        class="game-card"
                    >
                        <div class="game-icon">{game.icon}</div>
                        <h2 class="game-name">{game.name}</h2>
                        <p class="game-description">{game.description}</p>
                    </button>
                {/each}
            </div>
        </div>
    {:else if !quizStarted}
        <!-- Settings Page -->
        <div class="flex items-center justify-center min-h-screen px-4">
            <div class="w-full">
                <button
                    on:click={backToHub}
                    class="mb-6 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                    ← Back
                </button>
                <div class="flex justify-center">
                    <QuizSettings onStartQuiz={handleStartQuiz} />
                </div>
            </div>
        </div>
    {:else if selectedGame.id === 'description-quiz' && quizStarted && quizSettings}
        <!-- Quiz Game -->
        <DescriptionQuiz 
            settings={quizSettings}
            onBackToHub={backToHub}
        />
    {/if}
</main>

<style lang="postcss">
    :global(body) {
        margin: 0;
        padding: 0;
    }

    .game-card {
        @apply bg-white rounded-xl shadow-md p-8 transition-all duration-300 cursor-pointer;
        @apply border-4 border-transparent;
    }

    .game-card:hover {
        @apply shadow-xl scale-110 border-blue-500;
    }

    .game-icon {
        @apply text-6xl mb-4;
    }

    .game-name {
        @apply text-2xl font-bold text-gray-800 mb-2;
    }

    .game-description {
        @apply text-gray-600;
    }
</style>
