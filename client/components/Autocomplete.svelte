<script context="module" lang="ts">
    /**
     * @brief Pokemon option interface for autocomplete
     * @deprecated Use Pokemon from shared/types instead
     */
    export interface PokemonOption {
        id: number;
        name: string;
    }
</script>

<script lang="ts">
    /**
     * @brief Autocomplete input for Pokemon selection
     * @description Provides filtered dropdown suggestions as user types
     */
    import { createEventDispatcher } from 'svelte';
    import { normalizeText } from '../src/lib/utils/textUtils';
    import { getSpriteUrl } from '../../shared/constants/sprites';

    export type { PokemonOption };

    /** List of Pokemon to search */
    export let pokemonList: PokemonOption[] = [];
    /** Placeholder text */
    export let placeholder: string = '';
    /** Current input value (two-way binding) */
    export let value: string = '';
    /** Whether input is disabled */
    export let disabled: boolean = false;
    /** Whether to auto-focus on mount */
    export let autofocus: boolean = false;

    let inputElement: HTMLInputElement;
    let showSuggestions = false;
    let filteredList: PokemonOption[] = [];

    const dispatch = createEventDispatcher();
    const MAX_SUGGESTIONS = 15;

    /**
     * @brief Programmatically focus the input
     */
    export function focus(): void {
        inputElement?.focus();
    }

    /**
     * @brief Filters Pokemon list based on current input
     */
    function filterPokemon(): void {
        if (!value.trim()) {
            filteredList = pokemonList.slice(0, MAX_SUGGESTIONS);
            showSuggestions = true;
            return;
        }

        const searchTerm = normalizeText(value);
        filteredList = pokemonList
            .filter(p => normalizeText(p.name).startsWith(searchTerm))
            .slice(0, MAX_SUGGESTIONS);

        showSuggestions = filteredList.length > 0;
    }

    /**
     * @brief Handles selection of a Pokemon from suggestions
     * @param pokemon - Selected Pokemon option
     */
    function selectPokemon(pokemon: PokemonOption): void {
        value = pokemon.name;
        showSuggestions = false;
        dispatch('select', { pokemon });
    }

    /**
     * @brief Handles keyboard navigation
     */
    function handleKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Enter') {
            showSuggestions = false;
            dispatch('submit');
        } else if (event.key === 'Escape') {
            showSuggestions = false;
        }
    }

    function handleInput(): void {
        filterPokemon();
    }

    function handleFocus(): void {
        filterPokemon();
        dispatchEvent(new Event('focus', { bubbles: true }));
    }

    function handleBlur(): void {
        setTimeout(() => {
            showSuggestions = false;
        }, 200);
        dispatchEvent(new Event('blur', { bubbles: true }));
    }
</script>

<div class="autocomplete-container">
    <!-- svelte-ignore a11y-autofocus -->
    <input
        bind:this={inputElement}
        type="text"
        {placeholder}
        bind:value
        {disabled}
        {autofocus}
        on:keydown={handleKeyDown}
        on:input={handleInput}
        on:focus={handleFocus}
        on:blur={handleBlur}
        class="text-input"
        autocomplete="off"
    />

    {#if showSuggestions && filteredList.length > 0}
        <div class="suggestions-dropdown">
            {#each filteredList as pokemon (pokemon.id)}
                <button
                    type="button"
                    on:click={() => selectPokemon(pokemon)}
                    class="suggestion-item"
                >
                    <img
                        src={getSpriteUrl(pokemon.id)}
                        alt={pokemon.name}
                        class="pokemon-icon"
                        on:error
                    />
                    <div class="suggestion-text">
                        <span class="pokemon-id">#{pokemon.id}</span>
                        <span class="pokemon-name">{pokemon.name}</span>
                    </div>
                </button>
            {/each}
        </div>
    {/if}
</div>

<style lang="postcss">
    .autocomplete-container {
        @apply relative w-full;
    }

    .text-input {
        @apply w-full px-4 py-3 border-2 border-gray-300 rounded-lg;
        @apply text-lg font-medium transition-all;
    }

    .text-input:focus {
        @apply outline-none border-blue-500 ring-2 ring-blue-200;
    }

    .text-input:disabled {
        @apply bg-gray-100 cursor-not-allowed opacity-50;
    }

    .text-input::placeholder {
        @apply text-gray-400;
    }

    .suggestions-dropdown {
        @apply absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg z-50;
        @apply max-h-80 overflow-y-auto;
    }

    .suggestion-item {
        @apply w-full flex items-center gap-3 px-4 py-2 transition-colors;
        @apply border-none bg-transparent cursor-pointer text-left;
        @apply border-b border-gray-100;
    }

    .suggestion-item:hover {
        @apply bg-blue-50;
    }

    .suggestion-item:last-child {
        @apply border-b-0;
    }

    .pokemon-icon {
        @apply w-8 h-8 object-contain flex-shrink-0;
    }

    .suggestion-text {
        @apply flex flex-col flex-grow;
    }

    .pokemon-id {
        @apply text-xs text-gray-500 font-semibold;
    }

    .pokemon-name {
        @apply text-sm font-medium text-gray-800;
    }
</style>
