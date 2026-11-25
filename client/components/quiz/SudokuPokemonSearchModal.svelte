<script lang="ts">
    /**
     * @brief Reusable Sudoku Pokemon Search Modal component
     * @description Opens when a user clicks on a Sudoku grid cell. Displays the cell's row & column
     *              restrictions and uses the existing Autocomplete component (with EVERY Pokémon loaded)
     *               plus a direct scrollable list of matching suggestions so the user can click on a
     *              Pokémon to validate it.
     */
    import { onMount, createEventDispatcher } from 'svelte';
    import TextInput from '../TextInput.svelte';
    import type { PokemonOption } from '../Autocomplete.svelte';
    import { getLabel, type LabelKey } from '../../src/lib/translations';
    import { getSpriteUrl } from '../../../shared/constants/sprites';
    import { normalizeText } from '../../../shared/utils/textUtils';
    import type { SudokuRestriction } from '../../../shared/types';

    /** Row index (0-based) */
    export let rowIndex: number;
    /** Column index (0-based) */
    export let colIndex: number;
    /** Restriction for the selected cell's row */
    export let rowRestriction: SudokuRestriction;
    /** Restriction for the selected cell's column */
    export let colRestriction: SudokuRestriction;
    /** Complete list of all 1025 Pokémon (must contain EVERY Pokémon so user can make errors) */
    export let allPokemonList: PokemonOption[] = [];
    /** Set of already used Pokémon IDs across the grid (for visual badge when single answers is active) */
    export let usedPokemonIds: Set<number> = new Set();
    /** Whether single answers only is enabled */
    export let uniquePokemonOnly: boolean = true;
    /** Current language code */
    export let languageCode: string = 'en';

    const dispatch = createEventDispatcher<{
        select: { pokemon: PokemonOption };
        close: void;
    }>();

    let searchQuery: string = '';
    let searchInputRef: TextInput;

    function l(key: LabelKey): string {
        return getLabel(languageCode, key);
    }

    function getRestrictionLabel(r: SudokuRestriction): string {
        return getLabel(languageCode, r.labelKey as LabelKey);
    }

    function getCategoryLabel(r: SudokuRestriction): string {
        return getLabel(languageCode, `sudoku_cat_${r.category}` as LabelKey);
    }

    function handleSelectPokemon(pokemon: PokemonOption): void {
        dispatch('select', { pokemon });
    }

    function handleClose(): void {
        dispatch('close');
    }

    $: quickResults = (() => {
        const term = normalizeText(searchQuery.trim());
        if (!term) {
            return allPokemonList.slice(0, 24);
        }
        return allPokemonList
            .filter(p => normalizeText(p.name).includes(term) || String(p.id) === term)
            .slice(0, 30);
    })();

    onMount(() => {
        setTimeout(() => {
            searchInputRef?.focus();
        }, 50);

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                handleClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    });
</script>

<div
    class="sudoku-modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    on:click|self={handleClose}
    on:keydown={(e) => e.key === 'Escape' && handleClose()}
    role="dialog"
    aria-modal="true"
    aria-label="Select Pokémon"
    tabindex="-1"
>
    <div class="sudoku-search-modal bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-gray-200 dark:border-gray-700 flex flex-col max-h-[88vh]">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-black text-gray-800 dark:text-gray-100">
                {l('sudoku_selectPokemonForCell')
                    .replace('{0}', String(rowIndex + 1))
                    .replace('{1}', String(colIndex + 1))}
            </h2>
            <button
                type="button"
                on:click={handleClose}
                class="sudoku-modal-close w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-200 font-bold transition-colors cursor-pointer"
                aria-label={l('close')}
            >
                ✕
            </button>
        </div>

        <!-- Row & Column Restrictions Banner -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            <div class="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center gap-3">
                <div class="min-w-0">
                    <span class="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                        {l('sudoku_rowRestriction')} ({getCategoryLabel(rowRestriction)})
                    </span>
                    <span class="text-sm font-black text-gray-900 dark:text-gray-100 leading-snug break-words block">
                        {getRestrictionLabel(rowRestriction)}
                    </span>
                </div>
            </div>

            <div class="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center gap-3">
                <div class="min-w-0">
                    <span class="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                        {l('sudoku_colRestriction')} ({getCategoryLabel(colRestriction)})
                    </span>
                    <span class="text-sm font-black text-gray-900 dark:text-gray-100 leading-snug break-words block">
                        {getRestrictionLabel(colRestriction)}
                    </span>
                </div>
            </div>
        </div>

        <!-- Existing Reusable TextInput Component (filters the picker grid below without a dropdown) -->
        <div class="mb-3 relative z-30 sudoku-autocomplete-wrapper">
            <TextInput
                bind:this={searchInputRef}
                placeholder={l('sudoku_searchPlaceholder')}
                bind:value={searchQuery}
                autofocus={true}
            />
        </div>

        <p class="text-xs text-gray-500 dark:text-gray-400 mb-3 italic">
            {l('sudoku_clickToSelect')}
        </p>

        <!-- Scrollable Quick-Pick Pokemon Grid (shows all matching Pokémon so user can click directly) -->
        <div class="sudoku-pokemon-picker-list flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2 pr-1 max-h-64 border-t border-gray-100 dark:border-gray-700 pt-3">
            {#each quickResults as pokemon (pokemon.id)}
                {@const isUsed = uniquePokemonOnly && usedPokemonIds.has(pokemon.id)}
                <button
                    type="button"
                    data-pokemon-id={pokemon.id}
                    on:click={() => handleSelectPokemon(pokemon)}
                    class="sudoku-picker-item flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer
                        {isUsed
                            ? 'bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700 opacity-60'
                            : 'bg-gray-50 dark:bg-gray-700/60 hover:bg-blue-50 dark:hover:bg-blue-900/40 border-gray-200 dark:border-gray-600 hover:border-blue-400'}"
                >
                    <img
                        src={getSpriteUrl(pokemon.id)}
                        alt={pokemon.name}
                        class="w-10 h-10 object-contain shrink-0"
                        loading="lazy"
                    />
                    <div class="min-w-0 flex-1">
                        <span class="text-xs font-bold text-gray-800 dark:text-gray-100 truncate block">
                            {pokemon.name}
                        </span>
                    </div>
                </button>
            {/each}
        </div>
    </div>
</div>
