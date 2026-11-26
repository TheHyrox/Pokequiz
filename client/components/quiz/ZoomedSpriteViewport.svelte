<script lang="ts">
    /**
     * @brief Reusable zoomed/cropped artwork viewport component
     * @description Displays the cropped region of official/Home artwork with zoom progress indicators
     *              and a manual zoom-out hint button
     */
    import { createEventDispatcher } from 'svelte';
    import { getLabel } from '../../src/lib/translations';

    /** Data URL of the current cropped region */
    export let croppedSpriteUrl: string = '';
    /** Full original artwork URL */
    export let originalSpriteUrl: string = '';
    /** Target Pokemon ID (exposed via data attribute for inspection/testing) */
    export let pokemonId: number = 0;
    /** Current visible crop percentage (25-100) */
    export let currentCropPercent: number = 30;
    /** Full schedule of crop percentages for this round */
    export let cropSchedule: number[] = [30, 45, 60, 75, 90, 100];
    /** Current index in cropSchedule */
    export let currentStepIndex: number = 0;
    /** Whether manual zoom-out hints are enabled in settings */
    export let allowManualHints: boolean = true;
    /** Whether the answer is revealed */
    export let revealed: boolean = false;
    /** Name of the Pokemon (shown when revealed) */
    export let revealedPokemonName: string = '';
    /** Current language code */
    export let languageCode: string = 'en';

    const dispatch = createEventDispatcher<{
        zoomOut: void;
        inspectPokedex: void;
        nextQuestion: void;
    }>();

    $: canZoomOut = currentCropPercent < 100 && currentStepIndex < cropSchedule.length - 1 && !revealed;
    $: displayPercent = revealed ? 100 : currentCropPercent;
    $: displayUrl = revealed && originalSpriteUrl ? originalSpriteUrl : croppedSpriteUrl;
</script>

<div class="zoom-viewport-card bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 flex flex-col items-center border border-gray-200 dark:border-gray-700">
    <!-- Top Bar: Visible Region Badge, Step Pills & Zoom Out Hint Button -->
    <div class="w-full flex flex-wrap items-center justify-between gap-2 sm:gap-3 mb-4">
        <div class="flex items-center gap-2">
            <span class="zoom-crop-badge px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
                🔍 {getLabel(languageCode, 'zoom_cropBadge')}: {displayPercent}%
            </span>
            {#if displayPercent >= 100}
                <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                    {getLabel(languageCode, 'zoom_fullyZoomedOut')}
                </span>
            {/if}
        </div>

        <!-- Step Progress Pills -->
        <div class="flex flex-wrap items-center gap-1 sm:gap-1.5" aria-label="Zoom progression steps">
            {#each cropSchedule as stepPct, idx (stepPct)}
                <span
                    class="px-1.5 sm:px-2 py-0.5 rounded text-[11px] sm:text-xs font-mono font-bold transition-all {idx === currentStepIndex && !revealed ? 'bg-blue-600 text-white scale-105' : idx < currentStepIndex || revealed ? 'bg-blue-100 dark:bg-gray-700 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500'}"
                >
                    {stepPct}%
                </span>
            {/each}
        </div>

        {#if allowManualHints}
            <button
                type="button"
                on:click={() => dispatch('zoomOut')}
                disabled={!canZoomOut}
                class="zoom-out-hint-btn px-3 sm:px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer {canZoomOut ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm' : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'}"
            >
                <span>🔎</span>
                <span>{getLabel(languageCode, 'zoom_zoomOutHintBtn')}</span>
                <span class="hidden sm:inline opacity-75 font-mono">[Space]</span>
            </button>
        {/if}
    </div>

    <!-- Cropped Artwork Frame -->
    <div class="zoom-frame relative w-56 h-56 sm:w-72 sm:h-72 max-w-full aspect-square rounded-xl overflow-hidden border-2 border-blue-200 dark:border-gray-600 bg-gradient-to-br from-slate-50 to-blue-50/60 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center shadow-inner">
        {#if displayUrl}
            <img
                src={displayUrl}
                alt="Zoomed Pokemon artwork"
                class="pokemon-sprite zoom-cropped-sprite w-full h-full object-contain transition-all duration-200"
                data-original-src={originalSpriteUrl}
                data-pokemon-id={pokemonId}
                data-crop-percent={displayPercent}
            />
        {/if}
    </div>

    {#if revealed && revealedPokemonName}
        <div class="mt-4 flex flex-wrap items-center justify-center gap-3">
            <button
                type="button"
                on:click={() => dispatch('inspectPokedex')}
                class="pokedex-inspect-btn px-4 py-2 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 font-bold text-sm rounded-lg transition-colors cursor-pointer"
            >
                📖 {getLabel(languageCode, 'pokedexMiniCard')}: {revealedPokemonName}
            </button>
            <button
                type="button"
                on:click={() => dispatch('nextQuestion')}
                class="next-question-btn px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm rounded-lg transition-colors cursor-pointer"
            >
                {getLabel(languageCode, 'number_nextRound')} →
            </button>
        </div>
    {/if}
</div>
