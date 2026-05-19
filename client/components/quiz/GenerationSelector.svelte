<script lang="ts">
    /**
     * @brief Generation selector component
     * @description Checkbox grid for selecting Pokemon generations with select/deselect all
     */
    import { getLabel } from '../../src/lib/translations';
    import { ALL_GENERATIONS, GENERATION_LABELS } from '../../../shared/constants';

    /** Current language code for translations */
    export let languageCode: string;
    /** Set of selected generation IDs (two-way binding) */
    export let selectedGenerations: Set<number>;

    /**
     * @brief Toggles a generation's selection state
     * @param genId - Generation ID to toggle
     */
    function toggleGeneration(genId: number): void {
        if (selectedGenerations.has(genId)) {
            selectedGenerations.delete(genId);
        } else {
            selectedGenerations.add(genId);
        }
        selectedGenerations = selectedGenerations;
    }

    /**
     * @brief Selects all generations
     */
    function selectAll(): void {
        selectedGenerations = new Set(ALL_GENERATIONS);
    }

    /**
     * @brief Deselects all generations
     */
    function deselectAll(): void {
        selectedGenerations = new Set();
    }
</script>

<div class="settings-section">
    <h3 class="settings-section-title">{getLabel(languageCode, 'pokemonGenerations')}</h3>
    <p class="section-description">{getLabel(languageCode, 'chooseGenerationsDescription')}</p>
    <div class="generation-buttons">
        <button on:click={selectAll} class="select-button select-all">
            {getLabel(languageCode, 'selectAll')}
        </button>
        <button on:click={deselectAll} class="select-button deselect-all">
            {getLabel(languageCode, 'deselectAll')}
        </button>
    </div>
    <div class="generation-grid">
        {#each GENERATION_LABELS as gen (gen.id)}
            <label class="generation-checkbox">
                <input
                    type="checkbox"
                    checked={selectedGenerations.has(gen.id)}
                    on:change={() => toggleGeneration(gen.id)}
                    class="checkbox-input"
                />
                <span class="checkbox-label">{gen.label}</span>
            </label>
        {/each}
    </div>
</div>

<style lang="postcss">
    .settings-section {
        @apply mb-8;
    }

    .settings-section-title {
        @apply text-lg font-semibold text-gray-700 mb-2;
    }

    .section-description {
        @apply text-sm text-gray-600 mb-4 italic;
    }

    .generation-buttons {
        @apply flex gap-3 mb-4;
    }

    .select-button {
        @apply px-4 py-2 border-2 rounded-lg font-medium transition-all cursor-pointer text-sm;
    }

    .select-all {
        @apply border-green-500 text-green-600;
    }

    .select-all:hover {
        @apply bg-green-50;
    }

    .deselect-all {
        @apply border-red-500 text-red-600;
    }

    .deselect-all:hover {
        @apply bg-red-50;
    }

    .generation-grid {
        @apply grid grid-cols-2 gap-2;
    }

    .generation-checkbox {
        @apply flex items-center p-2 border-2 border-gray-200 rounded-lg cursor-pointer transition-all text-sm;
    }

    .generation-checkbox:hover {
        @apply border-blue-400 bg-blue-50;
    }

    .generation-checkbox:has(input:checked) {
        @apply border-blue-500 bg-blue-50;
    }

    .checkbox-input {
        @apply w-4 h-4 accent-blue-500 cursor-pointer mr-3 flex-shrink-0;
    }

    .checkbox-label {
        @apply text-gray-700 font-medium;
    }
</style>
