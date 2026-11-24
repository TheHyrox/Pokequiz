<script lang="ts">
    /**
     * @brief Reusable grid component for "Pick the real shiny among 4–6 color-shifted fakes"
     * @description Displays an optional normal reference sprite and 4-6 color-shifted candidate cards
     */
    import { createEventDispatcher } from 'svelte';
    import { getLabel } from '../../src/lib/translations';
    import { capitalizeFirst } from '../../../shared/utils/textUtils';
    import type { ShinyFakeOption } from '../../../shared/types';

    /** Array of 4-6 sprite options (1 real shiny + N-1 Canvas hue-shifted fakes) */
    export let options: ShinyFakeOption[] = [];
    /** Normal sprite URL for color reference */
    export let normalSpriteUrl: string = '';
    /** Target Pokemon ID */
    export let pokemonId: number = 0;
    /** Target Pokemon Name */
    export let pokemonName: string = '';
    /** Show Pokemon name and Pokedex ID */
    export let showPokemonName: boolean = true;
    /** Show normal sprite reference header */
    export let showNormalReference: boolean = true;
    /** Set of option IDs that were clicked and wrong */
    export let wrongOptionIds: Set<string> = new Set();
    /** Whether the real shiny answer is revealed */
    export let revealCorrectAnswer: boolean = false;
    /** Whether cards are disabled */
    export let disabled: boolean = false;
    /** Current language code */
    export let languageCode: string = 'en';

    const dispatch = createEventDispatcher<{
        select: { option: ShinyFakeOption };
        inspectPokedex: void;
    }>();
</script>

<div class="shiny-spot-container">
    <!-- Top Header Card: Pokemon Identity & Optional Normal Reference -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 flex flex-col items-center border border-gray-200 dark:border-gray-700">
        {#if showPokemonName && pokemonName}
            <div class="flex items-center gap-2 mb-2">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                    #{String(pokemonId).padStart(4, '0')}
                </span>
                <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    {capitalizeFirst(pokemonName)}
                </h2>
            </div>
        {/if}

        <p class="text-sm font-medium text-gray-600 dark:text-gray-300 text-center mb-3">
            {getLabel(languageCode, 'shiny_pickRealShinyQuestion')}
        </p>

        {#if showNormalReference && normalSpriteUrl}
            <div class="shiny-normal-reference flex items-center gap-3 px-4 py-2 rounded-lg bg-slate-50 dark:bg-gray-900/60 border border-slate-200 dark:border-gray-700">
                <img
                    src={normalSpriteUrl}
                    alt="Normal sprite reference"
                    class="w-14 h-14 object-contain image-rendering-pixelated"
                />
                <div class="text-left">
                    <span class="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 block">
                        {getLabel(languageCode, 'shiny_normalReferenceBadge')}
                    </span>
                    <span class="text-sm font-semibold text-gray-800 dark:text-gray-100">
                        {getLabel(languageCode, 'normalSprite')}
                    </span>
                </div>
            </div>
        {/if}

        {#if revealCorrectAnswer}
            <button
                type="button"
                on:click={() => dispatch('inspectPokedex')}
                class="pokedex-inspect-btn mt-4 px-4 py-2 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 font-bold text-sm rounded-lg transition-colors cursor-pointer"
            >
                📖 {getLabel(languageCode, 'pokedexMiniCard')}: {capitalizeFirst(pokemonName)}
            </button>
        {/if}
    </div>

    <!-- 4–6 Color-Shifted Sprite Cards Grid -->
    <div class="shiny-fake-grid grid grid-cols-2 sm:grid-cols-3 gap-4">
        {#each options as option, idx (option.id)}
            {@const isWrong = wrongOptionIds.has(option.id)}
            {@const isSuccess = revealCorrectAnswer && option.isRealShiny}
            <button
                type="button"
                disabled={disabled || isWrong}
                on:click={() => dispatch('select', { option })}
                data-option-id={option.id}
                data-is-real-shiny={option.isRealShiny ? '1' : '0'}
                data-hue-shift={option.hueShiftDegrees}
                class="shiny-fake-option-card pokemon-grid-item rounded-xl p-5 flex flex-col items-center justify-center transition-all border-2 cursor-pointer shadow-md
                    {isSuccess ? 'border-green-500 bg-green-50 dark:bg-green-950/60 scale-105' :
                     isWrong ? 'border-red-500 bg-red-50 dark:bg-red-950/50 opacity-75 cursor-not-allowed' :
                     'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-amber-400 hover:shadow-lg hover:-translate-y-0.5'}"
            >
                <div class="w-32 h-32 flex items-center justify-center">
                    <img
                        src={option.spriteUrl}
                        alt="Candidate shiny sprite {idx + 1}"
                        class="pokemon-sprite shiny-option-sprite w-28 h-28 object-contain image-rendering-pixelated"
                    />
                </div>

                <div class="mt-2 flex items-center gap-1.5">
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-bold
                        {isSuccess ? 'bg-green-200 text-green-900' :
                         isWrong ? 'bg-red-200 text-red-900' :
                         'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}">
                        {#if isSuccess}
                            {getLabel(languageCode, 'shiny_realShinyBadge')}
                        {:else if isWrong || revealCorrectAnswer}
                            {getLabel(languageCode, 'shiny_fakeHueBadge')} (+{option.hueShiftDegrees}°)
                        {:else}
                            #{idx + 1}
                        {/if}
                    </span>
                </div>
            </button>
        {/each}
    </div>
</div>
