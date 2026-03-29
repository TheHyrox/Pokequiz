<script context="module" lang="ts">
    export interface PokemonOption {
        id: number;
        name: string;
    }
</script>

<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    export type { PokemonOption };


    export let pokemonList: PokemonOption[] = [];
    export let placeholder: string = '';
    export let value: string = '';
    export let disabled: boolean = false;
    export let autofocus: boolean = false;

    let inputElement: HTMLInputElement;
    let showSuggestions = false;
    let filteredList: PokemonOption[] = [];

    const dispatch = createEventDispatcher();

    export function focus() {
        inputElement?.focus();
    }

    function filterPokemon() {
        if (!value.trim()) {
            filteredList = pokemonList.slice(0, 15);
            showSuggestions = true;
            return;
        }

        const searchTerm = value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        filteredList = pokemonList
            .filter(p => 
                p.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').startsWith(searchTerm)
            )
            .slice(0, 15);

        showSuggestions = filteredList.length > 0;
    }

    function selectPokemon(pokemon: PokemonOption) {
        value = pokemon.name;
        showSuggestions = false;
        dispatch('select', { pokemon });
    }

    function handleKeyDown(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            showSuggestions = false;
            dispatch('submit');
        } else if (event.key === 'Escape') {
            showSuggestions = false;
        }
    }

    function handleInput() {
        filterPokemon();
    }

    function handleFocus() {
        filterPokemon(); 
        dispatchEvent(new Event('focus', { bubbles: true }));
    }

    function handleBlur() {
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
                        src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{pokemon.id}.png"
                        alt="{pokemon.name}"
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
