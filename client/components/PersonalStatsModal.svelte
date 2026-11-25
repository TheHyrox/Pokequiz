<script lang="ts">
    /**
     * @brief Personal Stats & Streaks Modal Component
     * @description Displays client-side personal bests per quiz/mode (best score, longest streak,
     *              average guesses in Pokedle, total games played) stored purely in localStorage,
     *              with an option to reset stats.
     */
    import { createEventDispatcher } from 'svelte';
    import { getPersonalStats, resetPersonalStats } from '../src/lib/storage';
    import { getLabel, type LabelKey } from '../src/lib/translations';
    import type { PersonalStatsStore, QuizModeStatEntry } from '../../shared/types';

    export let languageCode: string = 'en';

    const dispatch = createEventDispatcher();

    let statsStore: PersonalStatsStore = getPersonalStats();
    let confirmReset = false;
    let resetMessageShown = false;

    function l(key: LabelKey): string {
        return getLabel(languageCode, key);
    }

    function handleClose(): void {
        dispatch('close');
    }

    function handleResetClick(): void {
        if (!confirmReset) {
            confirmReset = true;
            return;
        }
        statsStore = resetPersonalStats();
        confirmReset = false;
        resetMessageShown = true;
        dispatch('reset');
        setTimeout(() => {
            resetMessageShown = false;
        }, 3000);
    }

    function getStat(store: PersonalStatsStore, quizSlug: string, modeKey: string): QuizModeStatEntry {
        const entry = store.modes[`${quizSlug}:${modeKey}`];
        return entry || {
            totalGamesPlayed: 0,
            totalWins: 0,
            bestScore: null,
            currentStreak: 0,
            longestStreak: 0,
            totalGuessesInWins: 0
        };
    }

    function getAvgGuesses(entry: QuizModeStatEntry): string {
        if (!entry.totalWins || !entry.totalGuessesInWins) return '-';
        return (entry.totalGuessesInWins / entry.totalWins).toFixed(1);
    }

    interface QuizStatsSection {
        slug: string;
        icon: string;
        titleKey: LabelKey;
        isGuessBased?: boolean;
        modes: Array<{ key: string; label: string; isGuessBased?: boolean }>;
    }

    $: sections = [
        {
            slug: 'pokedle',
            icon: '🟩',
            titleKey: 'pokedle_quiz',
            isGuessBased: true,
            modes: [
                { key: 'wordle', label: 'Wordle', isGuessBased: true },
                { key: 'daily', label: l('dailyChallenge'), isGuessBased: true }
            ]
        },
        {
            slug: 'description',
            icon: '📝',
            titleKey: 'description_quiz',
            modes: [
                { key: 'score', label: l('scoreMode') },
                { key: 'infinite', label: l('infiniteMode') },
                { key: 'challenge', label: l('challengeMode') },
                { key: 'hardcore', label: l('hardcoreMode') },
                { key: 'daily', label: l('dailyChallenge') }
            ]
        },
        {
            slug: 'sprites',
            icon: '🎮',
            titleKey: 'sprites_quiz',
            modes: [
                { key: 'score', label: l('scoreMode') },
                { key: 'infinite', label: l('infiniteMode') },
                { key: 'challenge', label: l('challengeMode') },
                { key: 'hardcore', label: l('hardcoreMode') }
            ]
        },
        {
            slug: 'zoom',
            icon: '🔍',
            titleKey: 'zoom_quiz',
            modes: [
                { key: 'score', label: l('scoreMode') },
                { key: 'infinite', label: l('infiniteMode') },
                { key: 'challenge', label: l('challengeMode') },
                { key: 'hardcore', label: l('hardcoreMode') }
            ]
        },
        {
            slug: 'shiny',
            icon: '✨',
            titleKey: 'shiny_quiz',
            modes: [
                { key: 'score', label: l('scoreMode') },
                { key: 'infinite', label: l('infiniteMode') },
                { key: 'challenge', label: l('challengeMode') },
                { key: 'hardcore', label: l('hardcoreMode') }
            ]
        },
        {
            slug: 'information',
            icon: 'ℹ️',
            titleKey: 'information_quiz',
            modes: [
                { key: 'easy', label: l('information_easyMode') },
                { key: 'normal', label: l('information_normalMode') },
                { key: 'challenge', label: l('information_challengeMode') },
                { key: 'hardcore', label: l('information_hardcoreMode') }
            ]
        },
        {
            slug: 'number',
            icon: '🔢',
            titleKey: 'number_quiz',
            modes: [
                { key: 'normal', label: l('number_subModeNormal'), isGuessBased: true },
                { key: 'points', label: l('number_subModePoints') },
                { key: 'daily', label: l('dailyChallenge') }
            ]
        },
        {
            slug: 'sudoku',
            icon: '🧩',
            titleKey: 'sudoku_quiz',
            modes: [
                { key: 'daily', label: l('sudoku_mode_daily') },
                { key: 'normal', label: l('sudoku_mode_normal') },
                { key: 'custom', label: l('sudoku_mode_custom') }
            ]
        }
    ] as QuizStatsSection[];

    $: totalAllGames = Object.values(statsStore.modes).reduce((sum, m) => sum + (m.totalGamesPlayed || 0), 0);
    $: globalBestStreak = Object.values(statsStore.modes).reduce((max, m) => Math.max(max, m.longestStreak || 0), 0);
    $: pokedleCombinedWins =
        (getStat(statsStore, 'pokedle', 'wordle').totalWins || 0) +
        (getStat(statsStore, 'pokedle', 'daily').totalWins || 0);
    $: pokedleCombinedGuesses =
        (getStat(statsStore, 'pokedle', 'wordle').totalGuessesInWins || 0) +
        (getStat(statsStore, 'pokedle', 'daily').totalGuessesInWins || 0);
    $: pokedleGlobalAvgGuesses =
        pokedleCombinedWins > 0 ? (pokedleCombinedGuesses / pokedleCombinedWins).toFixed(1) : '-';
</script>

<div
    class="stats-modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    on:click|self={handleClose}
    on:keydown={(e) => e.key === 'Escape' && handleClose()}
    role="dialog"
    aria-modal="true"
    aria-label={l('personalStats')}
    tabindex="-1"
>
    <div class="stats-modal-content bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col max-h-[88vh]">
        <!-- Header -->
        <div class="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white shrink-0">
            <div>
                <h2 class="text-2xl font-black flex items-center gap-2">
                    <span>📊</span> {l('personalStats')}
                </h2>
                <p class="text-xs text-blue-100 mt-0.5">{l('statsSubtitle')}</p>
            </div>
            <button
                type="button"
                on:click={handleClose}
                class="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white font-bold transition-colors cursor-pointer"
                aria-label={l('close')}
            >
                ✕
            </button>
        </div>

        <!-- Body -->
        <div class="p-6 overflow-y-auto space-y-6 flex-1">
            {#if resetMessageShown}
                <div class="p-3 rounded-xl bg-green-100 dark:bg-green-950/70 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-200 text-sm font-semibold text-center">
                    ✓ {l('statsResetSuccess')}
                </div>
            {/if}

            <!-- Top Global Overview Cards -->
            <div class="grid grid-cols-3 gap-4">
                <div class="bg-blue-50 dark:bg-gray-700/60 border border-blue-100 dark:border-gray-600 rounded-xl p-4 text-center">
                    <span class="text-xs font-bold uppercase text-gray-500 dark:text-gray-300 block">{l('totalGamesPlayed')}</span>
                    <span class="text-3xl font-black text-blue-600 dark:text-blue-400 stats-global-games">{totalAllGames}</span>
                </div>
                <div class="bg-amber-50 dark:bg-gray-700/60 border border-amber-100 dark:border-gray-600 rounded-xl p-4 text-center">
                    <span class="text-xs font-bold uppercase text-gray-500 dark:text-gray-300 block">🔥 {l('longestStreak')}</span>
                    <span class="text-3xl font-black text-amber-600 dark:text-amber-400 stats-global-streak">{globalBestStreak}</span>
                </div>
                <div class="bg-emerald-50 dark:bg-gray-700/60 border border-emerald-100 dark:border-gray-600 rounded-xl p-4 text-center">
                    <span class="text-xs font-bold uppercase text-gray-500 dark:text-gray-300 block">🟩 Pokedle {l('averageGuesses')}</span>
                    <span class="text-3xl font-black text-emerald-600 dark:text-emerald-400 stats-pokedle-avg">{pokedleGlobalAvgGuesses}</span>
                </div>
            </div>

            <!-- Per-Quiz Mode Breakdown Table -->
            <div class="space-y-4">
                {#each sections as section (section.slug)}
                    <div class="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50/50 dark:bg-gray-900/30">
                        <div class="px-4 py-2.5 bg-gray-100 dark:bg-gray-700/80 border-b border-gray-200 dark:border-gray-700 font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 text-sm">
                            <span>{section.icon}</span>
                            <span>{l(section.titleKey)}</span>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="w-full text-left text-sm">
                                <thead>
                                    <tr class="text-xs uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                                        <th class="py-2 px-4">{l('gameMode')}</th>
                                        <th class="py-2 px-4 text-center">{l('totalGamesPlayed')}</th>
                                        <th class="py-2 px-4 text-center">{l('bestScore')}</th>
                                        <th class="py-2 px-4 text-center">{l('currentStreak')}</th>
                                        <th class="py-2 px-4 text-center">{l('longestStreak')}</th>
                                        {#if section.slug === 'pokedle' || section.slug === 'number'}
                                            <th class="py-2 px-4 text-center">{l('averageGuesses')}</th>
                                        {/if}
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-200/60 dark:divide-gray-700/60">
                                    {#each section.modes as m (m.key)}
                                        {@const st = getStat(statsStore, section.slug, m.key)}
                                        <tr class="bg-white dark:bg-gray-800/70" data-stat-row="{section.slug}:{m.key}">
                                            <td class="py-2.5 px-4 font-semibold text-gray-800 dark:text-gray-100">{m.label}</td>
                                            <td class="py-2.5 px-4 text-center font-mono text-gray-700 dark:text-gray-200">{st.totalGamesPlayed}</td>
                                            <td class="py-2.5 px-4 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                                                {st.bestScore !== null ? st.bestScore : '-'}
                                            </td>
                                            <td class="py-2.5 px-4 text-center font-mono text-gray-700 dark:text-gray-200">{st.currentStreak}</td>
                                            <td class="py-2.5 px-4 text-center font-mono font-bold text-amber-600 dark:text-amber-400">{st.longestStreak}</td>
                                            {#if section.slug === 'pokedle' || section.slug === 'number'}
                                                <td class="py-2.5 px-4 text-center font-mono text-emerald-600 dark:text-emerald-400">
                                                    {m.isGuessBased ? getAvgGuesses(st) : '-'}
                                                </td>
                                            {/if}
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>
                    </div>
                {/each}
            </div>
        </div>

        <!-- Footer with Reset Stats and Close -->
        <div class="px-6 py-3.5 bg-gray-50 dark:bg-gray-900/60 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div class="flex items-center gap-2">
                <button
                    type="button"
                    on:click={handleResetClick}
                    class="reset-stats-btn px-4 py-2 rounded-lg font-bold text-xs transition-colors cursor-pointer {confirmReset ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-100 hover:bg-red-200 dark:bg-red-950/70 dark:hover:bg-red-900 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800'}"
                >
                    {confirmReset ? `⚠️ ${l('resetStatsConfirm')}` : `🗑️ ${l('resetStats')}`}
                </button>
                {#if confirmReset}
                    <button
                        type="button"
                        on:click={() => { confirmReset = false; }}
                        class="px-3 py-2 rounded-lg text-xs font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 cursor-pointer"
                    >
                        Cancel
                    </button>
                {/if}
            </div>

            <button
                type="button"
                on:click={handleClose}
                class="px-5 py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold text-sm rounded-lg transition-colors cursor-pointer"
            >
                {l('close')}
            </button>
        </div>
    </div>
</div>
