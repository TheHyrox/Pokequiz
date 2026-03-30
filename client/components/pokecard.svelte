<script lang="ts">
    /**
     * @brief Pokemon card component
     * @description Clickable card displaying a Pokemon with sprite and name
     */
    import { createEventDispatcher } from 'svelte';
    import { capitalizeFirst } from '../src/lib/utils/textUtils';
    import { getSpriteUrl } from '../../shared/constants/sprites';
    import type { PokemonOption } from '../../shared/types';

    /** Pokemon data to display */
    export let pokemon: PokemonOption;
    /** Show error styling (wrong answer) */
    export let showError: boolean = false;
    /** Disable interactions */
    export let disabled: boolean = false;
<<<<<<< HEAD
=======
    /** Show sprite image (defaults to true for backward compatibility) */
    export let showSprite: boolean = true;
>>>>>>> main

    const dispatch = createEventDispatcher();
    const spriteUrl = getSpriteUrl(pokemon.id, 'home');

    /**
     * @brief Handles card click/selection
     */
    function handleClick(): void {
        if (!disabled) {
            dispatch('selected', { pokemon });
        }
    }
</script>

<div
    class={`pokemon-card ${showError ? 'error' : ''} ${disabled ? 'disabled' : ''}`}
    on:click={handleClick}
    role="button"
    tabindex="0"
    on:keydown={(e) => e.key === 'Enter' && handleClick()}
>
    <div class="card-inner">
<<<<<<< HEAD
        <img
            src={spriteUrl}
            alt={pokemon.name}
            class="pokemon-image"
        />
=======
        {#if showSprite}
            <img
                src={spriteUrl}
                alt={pokemon.name}
                class="pokemon-image"
            />
        {/if}
>>>>>>> main
        <p class="pokemon-name">
            {capitalizeFirst(pokemon.name)}
        </p>
    </div>
</div>

<style lang="postcss">
    .pokemon-card {
        @apply cursor-pointer h-full;
    }

    .pokemon-card.disabled {
        @apply cursor-not-allowed;
    }

    .card-inner {
        @apply bg-white rounded-xl shadow-md p-6 flex flex-col items-center justify-center h-full;
        @apply transition-all duration-300 ease-out;
        @apply border-4 border-transparent;
    }

    .pokemon-card:not(.disabled) .card-inner:hover {
        @apply scale-110 shadow-xl border-blue-500;
    }

    .pokemon-card.error .card-inner {
        @apply border-red-500;
        animation: shake 0.5s ease-in-out;
    }

    .pokemon-card.disabled .card-inner {
        @apply bg-gray-300 opacity-50;
    }

    .pokemon-card:focus-visible .card-inner {
        @apply border-blue-500 outline-none;
    }

    .pokemon-image {
        @apply w-24 h-24 object-contain mb-4;
        @apply transition-transform duration-300;
    }

    .pokemon-card.disabled .pokemon-image {
        @apply grayscale;
    }

    .pokemon-name {
        @apply text-lg font-semibold text-gray-800;
        @apply transition-colors duration-300;
    }

    .pokemon-card:not(.disabled):hover .pokemon-name {
        @apply text-blue-600;
    }

    .pokemon-card.disabled .pokemon-name {
        @apply text-gray-500;
    }

    @keyframes shake {
        0%, 100% {
            transform: translateX(0);
        }
        10%, 30%, 50%, 70%, 90% {
            transform: translateX(-5px);
        }
        20%, 40%, 60%, 80% {
            transform: translateX(5px);
        }
    }
</style>
