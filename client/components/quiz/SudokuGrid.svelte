<script lang="ts">
    /**
     * @brief Reusable Sudoku Grid (2x2 to 5x5) component
     * @description Renders the column headers, row headers, and interactive cells.
     *              Valid cells show a green border and Pokémon sprite + name;
     *              Invalid attempts show a red border around the cell with the Pokémon name
     *              so the user can click the cell to retry.
     */
    import { createEventDispatcher } from 'svelte';
    import { getLabel, type LabelKey } from '../../src/lib/translations';
    import { getSpriteUrl } from '../../../shared/constants/sprites';
    import type { SudokuCellState, SudokuRestriction, SudokuGridSize } from '../../../shared/types';

    export let gridSize: SudokuGridSize = 3;
    export let rowRestrictions: SudokuRestriction[] = [];
    export let colRestrictions: SudokuRestriction[] = [];
    export let cells: SudokuCellState[][] = [];
    export let isGameOver: boolean = false;
    export let languageCode: string = 'en';

    const dispatch = createEventDispatcher<{
        cellClick: { row: number; col: number; cell: SudokuCellState };
        inspectPokemon: { id: number; name: string };
    }>();

    function l(key: LabelKey): string {
        return getLabel(languageCode, key);
    }

    function getRestrictionLabel(r: SudokuRestriction): string {
        return getLabel(languageCode, r.labelKey as LabelKey);
    }

    function getCategoryLabel(r: SudokuRestriction): string {
        return getLabel(languageCode, `sudoku_cat_${r.category}` as LabelKey);
    }

    function handleCellClick(row: number, col: number, cell: SudokuCellState): void {
        if (isGameOver) {
            if (cell.pokemonId && cell.pokemonName) {
                dispatch('inspectPokemon', { id: cell.pokemonId, name: cell.pokemonName });
            }
            return;
        }
        // If already validly filled, clicking opens mini-card or does nothing
        if (cell.isValid === true && cell.pokemonId && cell.pokemonName) {
            dispatch('inspectPokemon', { id: cell.pokemonId, name: cell.pokemonName });
            return;
        }
        dispatch('cellClick', { row, col, cell });
    }
</script>

<div class="sudoku-board-wrapper overflow-x-auto pb-4">
    <div
        class="sudoku-board-grid mx-auto"
        style="--sudoku-cols: {gridSize};"
    >
        <!-- Top-Left Corner Cell -->
        <div class="sudoku-corner-cell flex flex-col items-center justify-center p-2 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md">
            <span class="text-base font-black uppercase tracking-wider">{gridSize}×{gridSize}</span>
        </div>

        <!-- Column Restriction Headers -->
        {#each colRestrictions as colRest, cIdx (cIdx)}
            <div
                class="sudoku-col-header flex flex-col items-center justify-center text-center p-2.5 rounded-xl bg-white dark:bg-gray-800 border-2 border-indigo-200 dark:border-indigo-800 shadow-sm"
                data-col-header={cIdx}
            >
                <span class="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    {getCategoryLabel(colRest)}
                </span>
                <span class="text-xs sm:text-sm font-black text-gray-800 dark:text-gray-100 leading-tight mt-0.5">
                    {getRestrictionLabel(colRest)}
                </span>
            </div>
        {/each}

        <!-- Rows: Row Header + N Cells -->
        {#each rowRestrictions as rowRest, rIdx (rIdx)}
            <!-- Row Restriction Header -->
            <div
                class="sudoku-row-header flex flex-col items-center justify-center text-center p-2.5 rounded-xl bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-800 shadow-sm"
                data-row-header={rIdx}
            >
                <span class="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    {getCategoryLabel(rowRest)}
                </span>
                <span class="text-xs sm:text-sm font-black text-gray-800 dark:text-gray-100 leading-tight mt-0.5">
                    {getRestrictionLabel(rowRest)}
                </span>
            </div>

            <!-- Row Cells -->
            {#each cells[rIdx] || [] as cell, cIdx (`${rIdx}-${cIdx}`)}
                <button
                    type="button"
                    data-cell="{rIdx}-{cIdx}"
                    data-cell-valid={cell.isValid === true ? 'true' : cell.isValid === false ? 'false' : 'empty'}
                    on:click={() => handleCellClick(rIdx, cIdx, cell)}
                    class="sudoku-cell group relative flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl transition-all duration-200 cursor-pointer select-none
                        {cell.isValid === true
                            ? 'sudoku-cell-valid bg-emerald-50 dark:bg-emerald-950/60 border-4 border-emerald-500 dark:border-emerald-500 shadow-md'
                            : cell.isValid === false
                            ? 'sudoku-cell-invalid bg-red-50 dark:bg-red-950/60 border-4 border-red-500 dark:border-red-500 shadow-md animate-shake'
                            : 'sudoku-cell-empty bg-white dark:bg-gray-800 hover:bg-blue-50/70 dark:hover:bg-gray-700 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-400 shadow-sm'}"
                >
                    {#if cell.pokemonId && cell.pokemonName}
                        <img
                            src={getSpriteUrl(cell.pokemonId, 'home')}
                            alt={cell.pokemonName}
                            class="w-12 h-12 sm:w-16 sm:h-16 object-contain transition-transform group-hover:scale-105"
                            on:error={(e) => {
                                const img = e.currentTarget as HTMLImageElement;
                                const fallback = getSpriteUrl(cell.pokemonId || 1, 'default');
                                if (img.src !== fallback) img.src = fallback;
                            }}
                        />
                        <span
                            class="sudoku-cell-pokemon-name text-xs sm:text-sm font-bold text-center leading-tight mt-1 px-1.5 py-0.5 rounded max-w-full truncate
                                {cell.isValid === true
                                    ? 'text-emerald-900 dark:text-emerald-200 bg-emerald-100/80 dark:bg-emerald-900/60'
                                    : 'text-red-900 dark:text-red-200 bg-red-100/80 dark:bg-red-900/60'}"
                        >
                            {cell.pokemonName}
                        </span>
                        {#if cell.isValid === false && !isGameOver}
                            <span class="text-[10px] font-extrabold uppercase text-red-600 dark:text-red-300 mt-0.5">
                                ↻ {l('sudoku_retryCell')}
                            </span>
                        {/if}
                    {:else}
                        <div class="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                            <span class="text-2xl sm:text-3xl font-light leading-none">+</span>
                            <span class="text-[10px] font-semibold mt-1 opacity-80">
                                {l('sudoku_clickCellToFill')}
                            </span>
                        </div>
                    {/if}
                </button>
            {/each}
        {/each}
    </div>
</div>

<style lang="postcss">
    .sudoku-board-grid {
        display: grid;
        grid-template-columns: minmax(95px, 135px) repeat(var(--sudoku-cols, 3), minmax(105px, 150px));
        gap: 0.65rem;
        width: fit-content;
    }

    .sudoku-cell {
        min-height: 110px;
    }

    @media (min-width: 640px) {
        .sudoku-cell {
            min-height: 132px;
        }
    }

    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-4px); }
        75% { transform: translateX(4px); }
    }

    .animate-shake {
        animation: shake 0.3s ease-in-out;
    }
</style>
