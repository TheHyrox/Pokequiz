<script lang="ts">
    /**
     * @brief Main application component
     * @description Hub for navigating between games and settings with URL hash routing and dark mode
     */
    import { onMount } from 'svelte';
    import LanguageSelector from '../components/LanguageSelector.svelte';
    import PersonalStatsModal from '../components/PersonalStatsModal.svelte';
    import { getLabel, LANGUAGE_ID_TO_CODE } from './lib/translations';
    import {
        getCachedLanguageId,
        saveLanguageId,
        getCachedDarkMode,
        saveDarkMode,
        getDailyChallengeStatus
    } from './lib/storage';
    import { QUIZ_REGISTRY, QUIZ_REGISTRY_MAP, type QuizRegistryEntry } from './lib/quizRegistry';
    import { parseQuizSettingsFromUrl, encodeQuizSettingsToParams, type QuizSlug } from './lib/urlSettings';
    import { getTodayDateString } from '../../shared/utils/seededRng';
    import {
        DEFAULT_QUIZ_SETTINGS,
        DEFAULT_POKEDLE_QUIZ_SETTINGS,
        DEFAULT_NUMBER_QUIZ_SETTINGS
    } from '../../shared/constants';

    let games: QuizRegistryEntry[] = QUIZ_REGISTRY;
    let selectedGame: QuizRegistryEntry | null = null;
    let quizStarted = false;
    let activeQuizSettings: any = null;
    let selectedLanguageId: number = getCachedLanguageId() ?? 9;
    let isDarkMode: boolean = getCachedDarkMode();
    let isHandlingPopState = false;
    let showStatsModal = false;
    let statsRefreshKey = 0;

    $: todayDateStr = getTodayDateString();
    $: dailyStatuses = {
        statsRefreshKey,
        pokedle: getDailyChallengeStatus('pokedle', todayDateStr),
        description: getDailyChallengeStatus('description', todayDateStr),
        number: getDailyChallengeStatus('number', todayDateStr)
    };

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
     * @brief Sync current state to window.location.hash & search params / History API
     */
    function updateUrlHash(replace: boolean = false): void {
        if (typeof window === 'undefined' || isHandlingPopState) return;

        let targetHash = '';
        let targetSearch = '';
        if (selectedGame) {
            targetHash = quizStarted
                ? `#/${selectedGame.slug}/play`
                : `#/${selectedGame.slug}`;
            if (activeQuizSettings) {
                const params = encodeQuizSettingsToParams(
                    selectedGame.slug as QuizSlug,
                    activeQuizSettings
                );
                const qs = params.toString();
                if (qs) targetSearch = `?${qs}`;
            }
        }

        const currentHash = window.location.hash || '';
        const currentSearch = window.location.search || '';
        if (currentHash === targetHash && currentSearch === targetSearch) return;

        const newUrl = `${window.location.pathname}${targetSearch}${targetHash}`;
        if (replace) {
            window.history.replaceState({ gameId: selectedGame?.id ?? null, quizStarted }, '', newUrl);
        } else {
            window.history.pushState({ gameId: selectedGame?.id ?? null, quizStarted }, '', newUrl);
        }
    }

    /**
     * @brief Restore state from window.location.search and window.location.hash
     */
    function syncStateFromUrl(): void {
        if (typeof window === 'undefined') return;
        isHandlingPopState = true;

        try {
            const parsedUrlConfig = parseQuizSettingsFromUrl(window.location.search, window.location.hash);
            const rawHash = window.location.hash.replace(/^#\/?/, '').split('?')[0].trim();

            if (parsedUrlConfig) {
                const matchedGame = QUIZ_REGISTRY_MAP[parsedUrlConfig.quizSlug];
                if (matchedGame) {
                    selectedGame = matchedGame;
                    activeQuizSettings = parsedUrlConfig.settings;
                    quizStarted = parsedUrlConfig.autoStart;
                    return;
                }
            }

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
        if (window.location.hash || window.location.search) {
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
        // Clear any previous URL query params when picking a game from the hub so cached settings are used
        activeQuizSettings = null;
        if (typeof window !== 'undefined') {
            window.history.pushState({ gameId: game.id, quizStarted: false }, '', `${window.location.pathname}#/${game.slug}`);
        }
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
        statsRefreshKey++;
        updateUrlHash();
    }

    /**
     * @brief Returns to settings from quiz
     */
    function backToSettingsFromQuiz(): void {
        quizStarted = false;
        statsRefreshKey++;
        updateUrlHash();
    }

    /**
     * @brief Starts a Daily Challenge directly from the Hub
     */
    function startDailyChallenge(quizSlug: 'pokedle' | 'description' | 'number'): void {
        const game = QUIZ_REGISTRY_MAP[quizSlug];
        if (!game) return;
        const seed = getTodayDateString();
        selectedGame = game;

        if (quizSlug === 'pokedle') {
            activeQuizSettings = {
                ...DEFAULT_POKEDLE_QUIZ_SETTINGS,
                isDailyChallenge: true,
                dailySeed: seed
            };
        } else if (quizSlug === 'description') {
            activeQuizSettings = {
                ...DEFAULT_QUIZ_SETTINGS,
                isDailyChallenge: true,
                dailySeed: seed
            };
        } else {
            activeQuizSettings = {
                ...DEFAULT_NUMBER_QUIZ_SETTINGS,
                subMode: 'normal',
                hasGuessLimit: true,
                guessLimit: 8,
                showHigherLower: true,
                isDailyChallenge: true,
                dailySeed: seed
            };
        }

        quizStarted = true;
        updateUrlHash();
    }
</script>

<main class="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
    <!-- Top Right Controls: Personal Stats, Dark Mode Toggle & Language Selector -->
    <div class="absolute top-6 right-6 z-40 flex items-center gap-3">
        <button
            type="button"
            on:click={() => { statsRefreshKey++; showStatsModal = true; }}
            class="theme-toggle-btn personal-stats-btn flex items-center gap-1.5 font-semibold text-sm"
            aria-label={getLabel(currentLanguageCode, 'personalStats')}
            title={getLabel(currentLanguageCode, 'personalStats')}
        >
            <span>📊</span>
            <span class="hidden sm:inline">{getLabel(currentLanguageCode, 'personalStats')}</span>
        </button>
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
            <div class="text-center mb-10">
                <h1 class="text-5xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                    {getLabel(currentLanguageCode, 'pokequiz')}
                </h1>
                <p class="text-lg text-gray-600 dark:text-gray-300">
                    {getLabel(currentLanguageCode, 'testYourKnowledge')}
                </p>
            </div>

            <!-- Daily Challenge Banner (Seeded RNG: Pokedle, Description, Number Quiz) -->
            <div class="daily-challenge-banner max-w-5xl w-full mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-2 border-amber-300 dark:border-amber-600">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="text-2xl">📅</span>
                            <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100">
                                {getLabel(currentLanguageCode, 'dailyChallenge')}
                            </h2>
                            <span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 daily-date-badge">
                                {todayDateStr}
                            </span>
                        </div>
                        <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {getLabel(currentLanguageCode, 'dailyChallengeSubtitle')}
                        </p>
                    </div>

                    <div class="flex flex-wrap gap-3">
                        <button
                            type="button"
                            on:click={() => startDailyChallenge('pokedle')}
                            class="daily-pokedle-btn px-4 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all cursor-pointer shadow-sm {dailyStatuses.pokedle?.completed ? 'bg-green-100 dark:bg-green-900/60 text-green-800 dark:text-green-200 border border-green-400' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}"
                        >
                            <span>🟩</span>
                            <span>{getLabel(currentLanguageCode, 'pokedle_quiz')}</span>
                            {#if dailyStatuses.pokedle?.completed}
                                <span class="text-xs">✓</span>
                            {/if}
                        </button>

                        <button
                            type="button"
                            on:click={() => startDailyChallenge('description')}
                            class="daily-description-btn px-4 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all cursor-pointer shadow-sm {dailyStatuses.description?.completed ? 'bg-green-100 dark:bg-green-900/60 text-green-800 dark:text-green-200 border border-green-400' : 'bg-blue-500 hover:bg-blue-600 text-white'}"
                        >
                            <span>📝</span>
                            <span>{getLabel(currentLanguageCode, 'description_quiz')}</span>
                            {#if dailyStatuses.description?.completed}
                                <span class="text-xs">✓</span>
                            {/if}
                        </button>

                        <button
                            type="button"
                            on:click={() => startDailyChallenge('number')}
                            class="daily-number-btn px-4 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all cursor-pointer shadow-sm {dailyStatuses.number?.completed ? 'bg-green-100 dark:bg-green-900/60 text-green-800 dark:text-green-200 border border-green-400' : 'bg-amber-500 hover:bg-amber-600 text-white'}"
                        >
                            <span>🔢</span>
                            <span>{getLabel(currentLanguageCode, 'number_quiz')}</span>
                            {#if dailyStatuses.number?.completed}
                                <span class="text-xs">✓</span>
                            {/if}
                        </button>
                    </div>
                </div>
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
    {#if showStatsModal}
        <PersonalStatsModal
            languageCode={currentLanguageCode}
            on:close={() => { showStatsModal = false; statsRefreshKey++; }}
            on:reset={() => { statsRefreshKey++; }}
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
