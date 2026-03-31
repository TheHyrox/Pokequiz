<script lang="ts">
    /**
     * @brief Main application component
     * @description Hub for navigating between games and settings
     */
    import { onMount } from 'svelte';
    import DescriptionQuizSettings from '../components/DescriptionQuizSettings.svelte';
    import SpriteQuizSettings from '../components/SpriteQuizSettings.svelte';
    import InformationQuizSettings from '../components/InformationQuizSettings.svelte';
    import DescriptionQuiz from './QuizDescription.svelte';
    import SpritesQuiz from './QuizSprites.svelte';
    import QuizInformation from './QuizInformation.svelte';
    import LanguageSelector from '../components/LanguageSelector.svelte';
    import { getLabel, LANGUAGE_ID_TO_CODE } from './lib/translations';
    import { getCachedDescriptionSettings, getCachedSpriteSettings, getCachedInformationSettings } from './lib/storage';
    import type { DescriptionQuizSettings as QuizSettingsType, SpriteQuizSettings as SpriteQuizSettingsType, InformationQuizSettings as InformationQuizSettingsType } from '../../shared/types';

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
        },
        {
            id: 'information-quiz',
            name: 'Information Quiz',
            description: 'Guess the Pokemon from its characteristics',
            icon: 'ℹ️'
        },
        {
            id: 'sprites-quiz',
            name: 'Sprites Quiz',
            description: 'Guess the Pokemon from its sprite',
            icon: '🎮'
        }
    ];

    let selectedGame: Game | null = null;
    let quizStarted = false;
    let quizSettings: QuizSettingsType | null = null;
    let spriteQuizSettings: SpriteQuizSettingsType | null = null;
    let informationQuizSettings: InformationQuizSettingsType | null = null;
    let selectedLanguageId: number = typeof window !== 'undefined' && localStorage.getItem('selectedLanguageId') 
        ? parseInt(localStorage.getItem('selectedLanguageId')!) 
        : 9;
    let showingSettingsAfterQuiz = false;

    // Derive language code from shared constants (removes duplicate mapping)
    $: currentLanguageCode = LANGUAGE_ID_TO_CODE[selectedLanguageId] || 'en';

    // Persist language selection
    $: if (typeof window !== 'undefined') {
        localStorage.setItem('selectedLanguageId', selectedLanguageId.toString());
    }

    onMount(() => {
        // Language is already loaded from localStorage at initialization
    });

    /**
     * @brief Selects a game to configure
     */
    function selectGame(game: Game): void {
        selectedGame = game;
        quizStarted = false;
    }

    /**
     * @brief Starts the description quiz with given settings
     */
    function handleStartDescriptionQuiz(settings: QuizSettingsType): void {
        quizSettings = settings;
        quizStarted = true;
    }

    /**
     * @brief Starts the sprites quiz with given settings
     */
    function handleStartSpritesQuiz(settings: SpriteQuizSettingsType): void {
        spriteQuizSettings = settings;
        quizStarted = true;
    }

    /**
     * @brief Starts the information quiz with given settings
     */
    function handleStartInformationQuiz(settings: InformationQuizSettingsType): void {
        informationQuizSettings = settings;
        quizStarted = true;
    }

    /**
     * @brief Returns to the main hub
     */
    function backToHub(): void {
        selectedGame = null;
        quizStarted = false;
        quizSettings = null;
        spriteQuizSettings = null;
        informationQuizSettings = null;
        showingSettingsAfterQuiz = false;
    }

    /**
     * @brief Returns to settings from quiz with changeSettings button
     */
    function backToSettingsFromQuiz(): void {
        quizStarted = false;
        showingSettingsAfterQuiz = true;
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
                            {getLabel(currentLanguageCode, game.id === 'description-quiz' ? 'description_quiz' : game.id === 'information-quiz' ? 'information_quiz' : 'sprites_quiz')}
                        </h2>
                        <p class="game-description">
                            {getLabel(currentLanguageCode, game.id === 'description-quiz' ? 'description_guessFromDescription' : game.id === 'information-quiz' ? 'information_guessFromInfo' : 'sprites_guessFromSprite')}
                        </p>
                    </button>
                {/each}
            </div>
        </div>
    {:else if !quizStarted}
        <!-- Settings Page -->
        <div class="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-8 flex flex-col">
            <button
                on:click={() => {
                    if (showingSettingsAfterQuiz) {
                        backToHub();
                    } else {
                        backToHub();
                    }
                }}
                class="mb-6 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors w-fit"
            >
                {getLabel(currentLanguageCode, 'back')}
            </button>
            <div class="flex items-center justify-center flex-1">
                <div class="w-full">
                    {#if selectedGame?.id === 'description-quiz'}
                        <DescriptionQuizSettings
                            onStartQuiz={handleStartDescriptionQuiz}
                            languageCode={currentLanguageCode}
                            initialSettings={getCachedDescriptionSettings()}
                        />
                    {:else if selectedGame?.id === 'information-quiz'}
                        <InformationQuizSettings
                            onStartQuiz={handleStartInformationQuiz}
                            languageCode={currentLanguageCode}
                            initialSettings={getCachedInformationSettings()}
                        />
                    {:else if selectedGame?.id === 'sprites-quiz'}
                        <SpriteQuizSettings
                            onStartQuiz={handleStartSpritesQuiz}
                            languageCode={currentLanguageCode}
                            initialSettings={getCachedSpriteSettings()}
                        />
                    {/if}
                </div>
            </div>
        </div>
    {:else if selectedGame?.id === 'description-quiz' && quizStarted && quizSettings}
        <!-- Description Quiz Game -->
        <DescriptionQuiz
            settings={quizSettings}
            onBackToHub={backToHub}
            onBackToSettings={backToSettingsFromQuiz}
            languageCode={currentLanguageCode}
            languageId={selectedLanguageId}
        />
    {:else if selectedGame?.id === 'information-quiz' && quizStarted && informationQuizSettings}
        <!-- Information Quiz Game -->
        <QuizInformation
            settings={informationQuizSettings}
            onBackToHub={backToHub}
            onBackToSettings={backToSettingsFromQuiz}
            languageCode={currentLanguageCode}
            languageId={selectedLanguageId}
        />
    {:else if selectedGame?.id === 'sprites-quiz' && quizStarted && spriteQuizSettings}
        <!-- Sprites Quiz Game -->
        <SpritesQuiz
            settings={spriteQuizSettings}
            onBackToHub={backToHub}
            onBackToSettings={backToSettingsFromQuiz}
            languageCode={currentLanguageCode}
            languageId={selectedLanguageId}
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
