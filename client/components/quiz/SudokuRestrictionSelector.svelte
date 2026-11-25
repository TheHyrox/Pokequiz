<script lang="ts">
    /**
     * @brief Grouped dropdown selector for Custom Sudoku Restrictions
     * @description Allows expanding/collapsing grouped dropdown menus for:
     *              - Regions (Kanto, Johto, Hoenn, Sinnoh, Unova, Kalos, Alola, Galar, Hisui, Paldea)
     *              - Types (All 18 types)
     *              - Evolutions (Basic, Stage 1, Stage 2, Friendship, Trade, Item, Level Up)
     *              - Special Traits & Forms (Dual Type, Monotype, Baby, Starter, Fossil, Legendary/Mythical/UB/Paradox, Mega/Primal/Gigantamax)
     *              Each group header has a master checkbox to check/uncheck every item in that group,
     *              and each individual item inside the dropdown can be checked or unchecked independently.
     */
    import { getLabel, type LabelKey } from '../../src/lib/translations';
    import { ALL_SUDOKU_RESTRICTIONS, ALL_SUDOKU_RESTRICTION_IDS } from '../../../shared/constants';
    import type { SudokuRestriction } from '../../../shared/types';

    export let languageCode: string = 'en';
    export let selectedRestrictions: Set<string> = new Set(ALL_SUDOKU_RESTRICTION_IDS);

    function l(key: LabelKey): string {
        return getLabel(languageCode, key);
    }

    interface RestrictionGroup {
        id: 'region' | 'type' | 'evolution' | 'traits';
        titleKey: LabelKey;
        icon: string;
        items: SudokuRestriction[];
    }

    let openGroups: Record<string, boolean> = {
        region: false,
        type: false,
        evolution: false,
        traits: false
    };

    $: groups = [
        {
            id: 'region',
            titleKey: 'sudoku_group_region',
            icon: '',
            items: ALL_SUDOKU_RESTRICTIONS.filter(r => r.category === 'region')
        },
        {
            id: 'type',
            titleKey: 'sudoku_group_type',
            icon: '',
            items: ALL_SUDOKU_RESTRICTIONS.filter(r => r.category === 'type')
        },
        {
            id: 'evolution',
            titleKey: 'sudoku_group_evolution',
            icon: '',
            items: ALL_SUDOKU_RESTRICTIONS.filter(r => r.category === 'evolution')
        },
        {
            id: 'traits',
            titleKey: 'sudoku_group_traits',
            icon: '',
            items: ALL_SUDOKU_RESTRICTIONS.filter(
                r => r.category !== 'region' && r.category !== 'type' && r.category !== 'evolution'
            )
        }
    ] as RestrictionGroup[];

    function toggleGroupOpen(groupId: string): void {
        openGroups[groupId] = !openGroups[groupId];
        openGroups = { ...openGroups };
    }

    function toggleRestriction(id: string): void {
        if (selectedRestrictions.has(id)) {
            selectedRestrictions.delete(id);
        } else {
            selectedRestrictions.add(id);
        }
        selectedRestrictions = new Set(selectedRestrictions);
    }

    function isGroupFullySelected(items: SudokuRestriction[], currentSet: Set<string>): boolean {
        return items.length > 0 && items.every(item => currentSet.has(item.id));
    }

    function isGroupPartiallySelected(items: SudokuRestriction[], currentSet: Set<string>): boolean {
        const count = items.filter(item => currentSet.has(item.id)).length;
        return count > 0 && count < items.length;
    }

    function getGroupSelectedCount(items: SudokuRestriction[], currentSet: Set<string>): number {
        return items.filter(item => currentSet.has(item.id)).length;
    }

    function toggleWholeGroup(items: SudokuRestriction[], event: Event): void {
        event.stopPropagation();
        const allChecked = isGroupFullySelected(items, selectedRestrictions);
        if (allChecked) {
            for (const item of items) {
                selectedRestrictions.delete(item.id);
            }
        } else {
            for (const item of items) {
                selectedRestrictions.add(item.id);
            }
        }
        selectedRestrictions = new Set(selectedRestrictions);
    }

    function selectAllGlobal(): void {
        selectedRestrictions = new Set(ALL_SUDOKU_RESTRICTION_IDS);
    }

    function deselectAllGlobal(): void {
        selectedRestrictions = new Set();
    }
</script>

<div class="settings-section sudoku-restriction-selector">
    <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h3 class="settings-section-title mb-0">{l('sudoku_allowedCategories')}</h3>
        <div class="flex items-center gap-2">
            <button
                type="button"
                on:click={selectAllGlobal}
                class="select-all px-2.5 py-1 border-2 border-green-500 text-green-600 dark:text-green-400 rounded-lg text-xs font-bold hover:bg-green-50 dark:hover:bg-green-900/40 transition-colors cursor-pointer"
            >
                {l('selectAll')}
            </button>
            <button
                type="button"
                on:click={deselectAllGlobal}
                class="deselect-all px-2.5 py-1 border-2 border-red-500 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/40 transition-colors cursor-pointer"
            >
                {l('deselectAll')}
            </button>
        </div>
    </div>

    <p class="section-description">{l('sudoku_allowedCategories_desc')}</p>

    <div class="space-y-2.5">
        {#each groups as group (group.id)}
            {@const selectedCount = getGroupSelectedCount(group.items, selectedRestrictions)}
            {@const allChecked = isGroupFullySelected(group.items, selectedRestrictions)}
            {@const partial = isGroupPartiallySelected(group.items, selectedRestrictions)}
            {@const isOpen = Boolean(openGroups[group.id])}

            <div
                class="sudoku-restriction-group border-2 rounded-xl overflow-hidden transition-colors
                    {selectedCount > 0
                        ? 'border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-800'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60'}"
                data-restriction-group={group.id}
            >
                <!-- Group Dropdown Header -->
                <div
                    class="sudoku-group-header flex items-center justify-between px-3.5 py-2.5 cursor-pointer select-none hover:bg-blue-50/60 dark:hover:bg-gray-700/70 transition-colors"
                    on:click={() => toggleGroupOpen(group.id)}
                    on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleGroupOpen(group.id)}
                    role="button"
                    tabindex="0"
                    aria-expanded={isOpen}
                >
                    <div class="flex items-center gap-2.5">
                        <!-- Master Group Checkbox (checks/unchecks every item in this group) -->
                        <input
                            type="checkbox"
                            checked={allChecked}
                            indeterminate={partial}
                            on:click={(e) => toggleWholeGroup(group.items, e)}
                            class="sudoku-group-master-checkbox w-4 h-4 accent-blue-500 cursor-pointer"
                            aria-label={l(group.titleKey)}
                        />
                        <span class="text-lg">{group.icon}</span>
                        <span class="font-bold text-sm text-gray-800 dark:text-gray-100">
                            {l(group.titleKey)}
                        </span>
                    </div>

                    <div class="flex items-center gap-2.5">
                        <span
                            class="px-2 py-0.5 rounded-full text-xs font-bold
                                {selectedCount === group.items.length
                                    ? 'bg-blue-100 dark:bg-blue-900/70 text-blue-700 dark:text-blue-200'
                                    : selectedCount > 0
                                    ? 'bg-amber-100 dark:bg-amber-900/70 text-amber-800 dark:text-amber-200'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}"
                        >
                            {l('sudoku_selectedCount')
                                .replace('{0}', String(selectedCount))
                                .replace('{1}', String(group.items.length))}
                        </span>
                        <span
                            class="text-gray-500 dark:text-gray-300 text-xs font-bold transition-transform duration-200 inline-block"
                            style="transform: rotate({isOpen ? '180deg' : '0deg'});"
                        >
                            ▼
                        </span>
                    </div>
                </div>

                <!-- Dropdown Menu Content -->
                {#if isOpen}
                    <div class="sudoku-group-dropdown-items p-3 bg-gray-50/70 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-2">
                        {#each group.items as item (item.id)}
                            <label
                                class="sudoku-restriction-item inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-xs cursor-pointer transition-all max-w-full
                                    {selectedRestrictions.has(item.id)
                                        ? 'border-blue-400 dark:border-blue-600 bg-blue-50/80 dark:bg-blue-950/60 text-gray-900 dark:text-gray-100 font-semibold'
                                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-blue-300'}"
                                data-restriction-id={item.id}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedRestrictions.has(item.id)}
                                    on:change={() => toggleRestriction(item.id)}
                                    class="w-3.5 h-3.5 accent-blue-500 cursor-pointer shrink-0"
                                />
                                {#if item.icon}
                                    <span class="shrink-0">{item.icon}</span>
                                {/if}
                                <span class="leading-snug break-words">{l(item.labelKey as LabelKey)}</span>
                            </label>
                        {/each}
                    </div>
                {/if}
            </div>
        {/each}
    </div>
</div>
