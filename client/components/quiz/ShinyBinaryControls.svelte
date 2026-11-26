<script lang="ts">
    /**
     * @brief Reusable binary controls component for Shiny vs. Normal Quiz ("Is this sprite shiny?")
     * @description Renders the target sprite and fast-paced binary Shiny / Normal choice buttons
     */
    import { createEventDispatcher } from 'svelte';
    import { getLabel } from '../../src/lib/translations';
    import { capitalizeFirst } from '../../../shared/utils/textUtils';

    /** Sprite URL shown to the user */
    export let shownSpriteUrl: string = '';
    /** Normal sprite URL (for post-answer comparison) */
    export let normalSpriteUrl: string = '';
    /** Real shiny sprite URL (for post-answer comparison) */
    export let shinySpriteUrl: string = '';
    /** Target Pokemon ID */
    export let pokemonId: number = 0;
    /** Target Pokemon Name */
    export let pokemonName: string = '';
    /** Whether the shown sprite is shiny */
    export let isTargetShiny: boolean = false;
    /** Whether to display the Pokemon's name & Pokedex # */
    export let showPokemonName: boolean = true;
    /** Whether buttons are disabled during transition */
    export let disabled: boolean = false;
    /** Whether answer has been revealed */
    export let revealed: boolean = false;
    /** User's binary answer (true = shiny, false = normal, null = none) */
    export let userAnswerShiny: boolean | null = null;
    /** Current language code */
    export let languageCode: string = 'en';

    const dispatch = createEventDispatcher<{
        answer: { guessedShiny: boolean };
        inspectPokedex: void;
    }>();
</script>

<div class="shiny-binary-card bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 sm:p-8 mb-6 sm:mb-8 flex flex-col items-center border border-gray-200 dark:border-gray-700">
    {#if showPokemonName && pokemonName}
        <div class="mb-3 text-center">
            <span class="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                #{String(pokemonId).padStart(4, '0')}
            </span>
            <h2 class="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1">
                {capitalizeFirst(pokemonName)}
            </h2>
        </div>
    {/if}

    <p class="text-sm font-medium text-gray-600 dark:text-gray-300 mb-4 text-center">
        {getLabel(languageCode, 'shiny_isThisShinyQuestion')}
    </p>

    <!-- Main Sprite Frame -->
    <div class="w-48 h-48 sm:w-56 sm:h-56 rounded-xl bg-gradient-to-br from-amber-50/70 to-blue-50/70 dark:from-gray-900 dark:to-gray-800 border-2 border-amber-200 dark:border-gray-600 flex items-center justify-center p-4 mb-5 sm:mb-6 shadow-inner">
        {#if shownSpriteUrl}
            <img
                src={shownSpriteUrl}
                alt="Pokemon sprite"
                class="pokemon-sprite shiny-binary-sprite w-36 h-36 sm:w-44 sm:h-44 object-contain image-rendering-pixelated"
                data-pokemon-id={pokemonId}
                data-is-shiny={isTargetShiny ? '1' : '0'}
            />
        {/if}
    </div>

    <!-- Binary Choice Buttons -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full max-w-lg">
        <button
            type="button"
            disabled={disabled}
            on:click={() => dispatch('answer', { guessedShiny: true })}
            class="shiny-choice-btn choice-shiny py-3.5 sm:py-4 px-5 sm:px-6 rounded-xl font-black text-base sm:text-lg transition-all cursor-pointer border-2 flex items-center justify-center gap-2 shadow-sm
                {revealed && isTargetShiny ? 'bg-green-500 text-white border-green-600 scale-105' :
                 revealed && userAnswerShiny === true && !isTargetShiny ? 'bg-red-500 text-white border-red-600' :
                 'bg-amber-400 hover:bg-amber-500 text-gray-900 border-amber-500 hover:shadow-md'}"
        >
            <span>{getLabel(languageCode, 'shiny_yesShinyBtn')}</span>
        </button>

        <button
            type="button"
            disabled={disabled}
            on:click={() => dispatch('answer', { guessedShiny: false })}
            class="shiny-choice-btn choice-normal py-3.5 sm:py-4 px-5 sm:px-6 rounded-xl font-black text-base sm:text-lg transition-all cursor-pointer border-2 flex items-center justify-center gap-2 shadow-sm
                {revealed && !isTargetShiny ? 'bg-green-500 text-white border-green-600 scale-105' :
                 revealed && userAnswerShiny === false && isTargetShiny ? 'bg-red-500 text-white border-red-600' :
                 'bg-slate-100 hover:bg-slate-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 border-slate-300 dark:border-gray-500 hover:shadow-md'}"
        >
            <span>{getLabel(languageCode, 'shiny_noNormalBtn')}</span>
        </button>
    </div>

    <!-- Side-by-side Comparison when revealed -->
    {#if revealed}
        <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 w-full flex flex-col items-center">
            <div class="flex items-center justify-center gap-6">
                <div class="flex flex-col items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-900/60 border {!isTargetShiny ? 'border-green-500' : 'border-gray-200 dark:border-gray-700'}">
                    <img src={normalSpriteUrl} alt="Normal sprite" class="w-20 h-20 object-contain image-rendering-pixelated" />
                    <span class="text-xs font-bold text-gray-700 dark:text-gray-200 mt-1">{getLabel(languageCode, 'normalSprite')}</span>
                </div>
                <div class="flex flex-col items-center p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/40 border {isTargetShiny ? 'border-green-500' : 'border-amber-200 dark:border-amber-700'}">
                    <img src={shinySpriteUrl} alt="Shiny sprite" class="w-20 h-20 object-contain image-rendering-pixelated" />
                    <span class="text-xs font-bold text-amber-700 dark:text-amber-300 mt-1">{getLabel(languageCode, 'shinySprite')}</span>
                </div>
            </div>
            <button
                type="button"
                on:click={() => dispatch('inspectPokedex')}
                class="pokedex-inspect-btn mt-4 px-4 py-2 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 font-bold text-sm rounded-lg transition-colors cursor-pointer"
            >
                📖 {getLabel(languageCode, 'pokedexMiniCard')}: {capitalizeFirst(pokemonName)}
            </button>
        </div>
    {/if}
</div>

<style lang="postcss">
    :global(.image-rendering-pixelated) {
        image-rendering: pixelated;
        image-rendering: -moz-crisp-edges;
        image-rendering: crisp-edges;
    }
</style>
