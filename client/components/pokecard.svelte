<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    
    interface Pokemon {
        name: string;
        id: number;
        isCorrect: boolean;
    }
    
    export let pokemon: Pokemon;
    const dispatch = createEventDispatcher();
    
    const pokemonId = pokemon.id.toString() || '0';
    const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${pokemonId}.png`;
    
    function handleClick() {
        dispatch('selected', { pokemon });
    }
</script>

<div 
    class="pokemon-card"
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

    .card-inner {
        @apply bg-white rounded-xl shadow-md p-6 flex flex-col items-center justify-center h-full;
        @apply transition-all duration-300 ease-out;
        @apply border-4 border-transparent;
    }

    .card-inner:hover {
        @apply scale-110 shadow-xl border-blue-500;
    }

    .pokemon-card:focus-visible .card-inner {
        @apply border-blue-500 outline-none;
    }

    .pokemon-image {
        @apply w-24 h-24 object-contain mb-4;
        @apply transition-transform duration-300;
    }

    .pokemon-name {
        @apply text-lg font-semibold text-gray-800;
        @apply transition-colors duration-300;
    }

    .pokemon-card:hover .pokemon-name {
        @apply text-blue-600;
    }
</style>