<script lang="ts">
    /**
     * @brief Main application component
     * @description Hub for navigating between games and settings
     */
    import { onMount } from 'svelte';
    import QuizSettings from '../components/QuizSettings.svelte';
<<<<<<< HEAD
    import DescriptionQuiz from './QuizDescription.svelte';
    import LanguageSelector from '../components/LanguageSelector.svelte';
    import { getLabel, LANGUAGE_ID_TO_CODE } from './lib/translations';
    import type { QuizSettings as QuizSettingsType } from '../../shared/types';
=======
    import SpriteQuizSettings from '../components/SpriteQuizSettings.svelte';
    import DescriptionQuiz from './QuizDescription.svelte';
    import SpritesQuiz from './QuizSprites.svelte';
    import LanguageSelector from '../components/LanguageSelector.svelte';
    import { getLabel, LANGUAGE_ID_TO_CODE } from './lib/translations';
    import type { QuizSettings as QuizSettingsType, SpriteQuizSettings as SpriteQuizSettingsType } from '../../shared/types';
>>>>>>> main

    interface Game {
        id: string;
        name: string;
        description: string;
        icon: string;
    }

    const games: Game[] = [
        {
            id: 'description-quiz',
            name: 'Description Quiz',
            description: 'Guess the Pokemon from its Pokédex description',
            icon: '📝'
<<<<<<< HEAD
=======
        },
        {
            id: 'sprites-quiz',
            name: 'Sprites Quiz',
            description: 'Guess the Pokemon from its sprite',
            icon: '🎮'
>>>>>>> main
        }
    ];

    let selectedGame: Game | null = null;
    let quizStarted = false;
    let quizSettings: QuizSettingsType | null = null;
<<<<<<< HEAD
=======
    let spriteQuizSettings: SpriteQuizSettingsType | null = null;
>>>>>>> main
    let selectedLanguageId: number = 9;

    // Derive language code from shared constants (removes duplicate mapping)
    $: currentLanguageCode = LANGUAGE_ID_TO_CODE[selectedLanguageId] || 'en';

    // Persist language selection
    $: if (typeof window !== 'undefined') {
        localStorage.setItem('selectedLanguageId', selectedLanguageId.toString());
    }

    onMount(() => {
        const savedLanguageId = localStorage.getItem('selectedLanguageId');
        if (savedLanguageId) {
            selectedLanguageId = parseInt(savedLanguageId);
        }
    });

    /**
     * @brief Selects a game to configure
     */
    function selectGame(game: Game): void {
        selectedGame = game;
        quizStarted = false;
    }

    /**
<<<<<<< HEAD
     * @brief Starts the quiz with given settings
     */
    function handleStartQuiz(settings: QuizSettingsType): void {
=======
     * @brief Starts the description quiz with given settings
     */
    function handleStartDescriptionQuiz(settings: QuizSettingsType): void {
>>>>>>> main
        quizSettings = settings;
        quizStarted = true;
    }

    /**
<<<<<<< HEAD
=======
     * @brief Starts the sprites quiz with given settings
     */
    function handleStartSpritesQuiz(settings: SpriteQuizSettingsType): void {
        spriteQuizSettings = settings;
        quizStarted = true;
    }

    /**
>>>>>>> main
     * @brief Returns to the main hub
     */
    function backToHub(): void {
        selectedGame = null;
        quizStarted = false;
        quizSettings = null;
<<<<<<< HEAD
=======
        spriteQuizSettings = null;
>>>>>>> main
    }
</script>

<main class="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
    <!-- Language Selector -->
    <div class="absolute top-6 right-6">
        <LanguageSelector
            bind:selectedLanguageId
            currentLanguageCode={currentLanguageCode}
        />
    </div>

    <!-- Main Hub -->
    {#if !selectedGame}
        <div class="flex flex-col items-center justify-center min-h-screen px-4">
            <div class="text-center mb-12">
                <h1 class="text-5xl font-bold text-gray-800 mb-4">
                    {getLabel(currentLanguageCode, 'pokequiz')}
                </h1>
                <p class="text-lg text-gray-600">
                    {getLabel(currentLanguageCode, 'testYourKnowledge')}
                </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                {#each games as game (game.id)}
                    <button on:click={() => selectGame(game)} class="game-card">
                        <div class="game-icon">{game.icon}</div>
                        <h2 class="game-name">
<<<<<<< HEAD
                            {getLabel(currentLanguageCode, 'descriptionQuiz')}
                        </h2>
                        <p class="game-description">
                            {getLabel(currentLanguageCode, 'guessFromDescription')}
=======
                            {getLabel(currentLanguageCode, game.id === 'description-quiz' ? 'description_quiz' : 'sprites_quiz')}
                        </h2>
                        <p class="game-description">
                            {getLabel(currentLanguageCode, game.id === 'description-quiz' ? 'description_guessFromDescription' : 'sprites_guessFromSprite')}
>>>>>>> main
                        </p>
                    </button>
                {/each}
            </div>
        </div>
    {:else if !quizStarted}
        <!-- Settings Page -->
<<<<<<< HEAD
        <div class="flex items-center justify-center min-h-screen px-4">
            <div class="w-full">
                <button
                    on:click={backToHub}
                    class="mb-6 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                    {getLabel(currentLanguageCode, 'back')}
                </button>
                <div class="flex justify-center">
                    <QuizSettings
                        onStartQuiz={handleStartQuiz}
                        languageCode={currentLanguageCode}
                    />
                </div>
            </div>
        </div>
    {:else if selectedGame.id === 'description-quiz' && quizStarted && quizSettings}
        <!-- Quiz Game -->
=======
        <div class="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-8 flex flex-col">
            <button
                on:click={backToHub}
                class="mb-6 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors w-fit"
            >
                {getLabel(currentLanguageCode, 'back')}
            </button>
            <div class="flex items-center justify-center flex-1">
                <div class="w-full">
                    {#if selectedGame?.id === 'description-quiz'}
                        <QuizSettings
                            onStartQuiz={handleStartDescriptionQuiz}
                            languageCode={currentLanguageCode}
                        />
                    {:else if selectedGame?.id === 'sprites-quiz'}
                        <SpriteQuizSettings
                            onStartQuiz={handleStartSpritesQuiz}
                            languageCode={currentLanguageCode}
                        />
                    {/if}
                </div>
            </div>
        </div>
    {:else if selectedGame?.id === 'description-quiz' && quizStarted && quizSettings}
        <!-- Description Quiz Game -->
>>>>>>> main
        <DescriptionQuiz
            settings={quizSettings}
            onBackToHub={backToHub}
            languageCode={currentLanguageCode}
            languageId={selectedLanguageId}
        />
<<<<<<< HEAD
=======
    {:else if selectedGame?.id === 'sprites-quiz' && quizStarted && spriteQuizSettings}
        <!-- Sprites Quiz Game -->
        <SpritesQuiz
            settings={spriteQuizSettings}
            onBackToHub={backToHub}
            languageCode={currentLanguageCode}
            languageId={selectedLanguageId}
        />
>>>>>>> main
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
