<script lang="ts">
    /**
     * @brief Main application component
     * @description Hub for navigating between games and settings with URL hash routing and dark mode
     */
    import { onMount } from 'svelte';
    import LanguageSelector from '../components/LanguageSelector.svelte';
    import { getLabel, LANGUAGE_ID_TO_CODE } from './lib/translations';
    import {
        getCachedLanguageId,
        saveLanguageId,
        getCachedDarkMode,
        saveDarkMode
    } from './lib/storage';
    import { QUIZ_REGISTRY, QUIZ_REGISTRY_MAP, type QuizRegistryEntry } from './lib/quizRegistry';

    let games: QuizRegistryEntry[] = QUIZ_REGISTRY;
    let selectedGame: QuizRegistryEntry | null = null;
    let quizStarted = false;
    let activeQuizSettings: any = null;
    let selectedLanguageId: number = getCachedLanguageId() ?? 9;
    let isDarkMode: boolean = getCachedDarkMode();
    let isHandlingPopState = false;

    // Derive language code from shared constants
    $: currentLanguageCode = LANGUAGE_ID_TO_CODE[selectedLanguageId] || 'en';

    // Persist language selection via storage.ts
    $: if (typeof window !== 'undefined') {
        saveLanguageId(selectedLanguageId);
    }

    // Apply and persist dark mode
    $: if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', isDarkMode);
        saveDarkMode(isDarkMode);
    }

    function toggleDarkMode(): void {
        isDarkMode = !isDarkMode;
    }

    /**
     * @brief Sync current state to window.location.hash / History API
     */
    function updateUrlHash(replace: boolean = false): void {
        if (typeof window === 'undefined' || isHandlingPopState) return;

        let targetHash = '';
        if (selectedGame) {
            targetHash = quizStarted
                ? `#/${selectedGame.slug}/play`
                : `#/${selectedGame.slug}`;
        }

        const currentHash = window.location.hash || '';
        if (currentHash === targetHash) return;

        const newUrl = targetHash || window.location.pathname + window.location.search;
        if (replace) {
            window.history.replaceState({ gameId: selectedGame?.id ?? null, quizStarted }, '', newUrl);
        } else {
            window.history.pushState({ gameId: selectedGame?.id ?? null, quizStarted }, '', newUrl);
        }
    }

    /**
     * @brief Restore state from window.location.hash
     */
    function syncStateFromUrl(): void {
        if (typeof window === 'undefined') return;
        isHandlingPopState = true;

        try {
            const rawHash = window.location.hash.replace(/^#\/?/, '').trim();
            if (!rawHash) {
                selectedGame = null;
                quizStarted = false;
                activeQuizSettings = null;
                return;
            }

            const [gameKey, subRoute] = rawHash.split('/');
            const matchedGame = QUIZ_REGISTRY_MAP[gameKey];

            if (!matchedGame) {
                selectedGame = null;
                quizStarted = false;
                activeQuizSettings = null;
                return;
            }

            selectedGame = matchedGame;

            if (subRoute === 'play') {
                const cached = activeQuizSettings ?? matchedGame.getCachedSettings();
                if (cached) {
                    activeQuizSettings = cached;
                    quizStarted = true;
                } else {
                    quizStarted = false;
                }
            } else {
                quizStarted = false;
            }
        } finally {
            isHandlingPopState = false;
        }
    }

    onMount(() => {
        if (window.location.hash) {
            syncStateFromUrl();
        } else {
            updateUrlHash(true);
        }

        const handleRouteChange = () => {
            syncStateFromUrl();
        };

        window.addEventListener('popstate', handleRouteChange);
        window.addEventListener('hashchange', handleRouteChange);

        return () => {
            window.removeEventListener('popstate', handleRouteChange);
            window.removeEventListener('hashchange', handleRouteChange);
        };
    });

    /**
     * @brief Selects a game to configure
     */
    function selectGame(game: QuizRegistryEntry): void {
        selectedGame = game;
        quizStarted = false;
        activeQuizSettings = null;
        updateUrlHash();
    }

    /**
     * @brief Starts the currently selected quiz with given settings
     */
    function handleStartQuiz(settings: any): void {
        activeQuizSettings = settings;
        quizStarted = true;
        updateUrlHash();
    }

    /**
     * @brief Returns to the main hub
     */
    function backToHub(): void {
        selectedGame = null;
        quizStarted = false;
        activeQuizSettings = null;
        updateUrlHash();
    }

    /**
     * @brief Returns to settings from quiz
     */
    function backToSettingsFromQuiz(): void {
        quizStarted = false;
        updateUrlHash();
    }
</script>

<main class="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
    <!-- Top Right Controls: Dark Mode Toggle & Language Selector -->
    <div class="absolute top-6 right-6 z-40 flex items-center gap-3">
        <button
            type="button"
            on:click={toggleDarkMode}
            class="theme-toggle-btn"
            aria-label={isDarkMode ? getLabel(currentLanguageCode, 'lightMode') : getLabel(currentLanguageCode, 'darkMode')}
            title={isDarkMode ? getLabel(currentLanguageCode, 'lightMode') : getLabel(currentLanguageCode, 'darkMode')}
        >
            {isDarkMode ? '☀️' : '🌙'}
        </button>
        <LanguageSelector
            bind:selectedLanguageId
            currentLanguageCode={currentLanguageCode}
        />
    </div>

    <!-- Main Hub -->
    {#if !selectedGame}
        <div class="flex flex-col items-center justify-center min-h-screen px-4 py-16">
            <div class="text-center mb-12">
                <h1 class="text-5xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                    {getLabel(currentLanguageCode, 'pokequiz')}
                </h1>
                <p class="text-lg text-gray-600 dark:text-gray-300">
                    {getLabel(currentLanguageCode, 'testYourKnowledge')}
                </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl w-full">
                {#each games as game (game.id)}
                    <button on:click={() => selectGame(game)} class="game-card">
                        <div class="game-icon">{game.icon}</div>
                        <h2 class="game-name">
                            {getLabel(currentLanguageCode, game.titleKey)}
                        </h2>
                        <p class="game-description">
                            {getLabel(currentLanguageCode, game.descriptionKey)}
                        </p>
                    </button>
                {/each}
            </div>
        </div>
    {:else if !quizStarted}
        <!-- Settings Page -->
        <div class="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-8 flex flex-col">
            <button
                on:click={backToHub}
                class="mb-6 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors w-fit"
            >
                {getLabel(currentLanguageCode, 'back')}
            </button>
            <div class="flex items-center justify-center flex-1">
                <div class="w-full">
                    <svelte:component
                        this={selectedGame.SettingsComponent}
                        onStartQuiz={handleStartQuiz}
                        languageCode={currentLanguageCode}
                        initialSettings={activeQuizSettings ?? selectedGame.getCachedSettings()}
                    />
                </div>
            </div>
        </div>
    {:else if selectedGame && quizStarted && activeQuizSettings}
        <!-- Active Quiz Game -->
        <svelte:component
            this={selectedGame.QuizComponent}
            settings={activeQuizSettings}
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

    .theme-toggle-btn {
        @apply px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg;
        @apply bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100;
        @apply transition-all duration-200 cursor-pointer text-lg leading-none shadow-sm;
    }

    .theme-toggle-btn:hover {
        @apply border-blue-400 shadow-md;
    }

    .game-card {
        @apply bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 transition-all duration-200 cursor-pointer;
        @apply border-2 border-transparent flex flex-col items-center text-center relative;
    }

    .game-card:hover {
        @apply shadow-xl -translate-y-1 border-blue-500;
    }

    .game-icon {
        @apply text-6xl mb-4;
    }

    .game-name {
        @apply text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2;
    }

    .game-description {
        @apply text-gray-600 dark:text-gray-300 text-sm;
    }
</style>
