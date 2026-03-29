<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    
    interface Pokemon {
        name: string;
        id: number;
        isCorrect: boolean;
    }
    
    export let pokemon: Pokemon;
    export let showError: boolean = false;
    export let disabled: boolean = false;

    const dispatch = createEventDispatcher();
    
    const pokemonId = pokemon.id.toString() || '0';
    const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${pokemonId}.png`;
    
    function handleClick() {
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
        <img 
            src={spriteUrl}
            alt={pokemon.name}
            class="pokemon-image"
        />
        <p class="pokemon-name">
            {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
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