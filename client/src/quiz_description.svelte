<script lang="ts">
    import { getPokemonDescription } from '../../server/src/lib/description';
    import { getPokemonNameLocalized } from '../../server/src/lib/name';
    import { getRandomInt } from '../../server/src/lib/utils/utils';
    import Pokecard from '../components/pokecard.svelte';

    interface PokemonOption {
        name: string;
        id: number;
        isCorrect: boolean;
    }

    let currentQuestion = 1;
    let totalQuestions = 10;
    let description = '';
    let pokemonOptions: PokemonOption[] = [];
    let loading = true;
    let correctPokemon = '';

    async function loadQuestion() {
        loading = true;
        pokemonOptions = [];
        
        // Get 4 different random pokemon IDs
        const selectedPokemon = new Set<number>();
        const pokemonIds: number[] = [];
        
        let correctId = getRandomInt(1025);
        while (selectedPokemon.has(correctId)) {
            correctId = getRandomInt(1025);
        }
        selectedPokemon.add(correctId);
        pokemonIds.push(correctId);
        correctPokemon = correctId.toString();
        
        // Get 3 more random different pokemon
        while (pokemonIds.length < 4) {
            const randomId = getRandomInt(1025);
            if (!selectedPokemon.has(randomId)) {
                selectedPokemon.add(randomId);
                pokemonIds.push(randomId);
            }
        }
        
        // Get description for the correct pokemon
        const descriptions = await getPokemonDescription(correctId.toString(), '5', null);
        description = descriptions?.[0] || 'No description found';
        
        // Create options with localized names
        const options: PokemonOption[] = [];
        for (const pokemonId of pokemonIds) {
            const name = await getPokemonNameLocalized(pokemonId, 'en');
            options.push({
                name: name || pokemonId.toString(),
                id: pokemonId,
                isCorrect: pokemonId === correctId
            });
        }
        
        // Shuffle options
        pokemonOptions = options.sort(() => Math.random() - 0.5);
        loading = false;
    }

    loadQuestion();

    function handleAnswer(isCorrect: boolean) {
        if (isCorrect) {
            if (currentQuestion < totalQuestions) {
                currentQuestion++;
                loadQuestion();
            } else {
                alert('Quiz completed! Great job!');
            }
        } else {
            alert('Wrong answer! Try again.');
        }
    }

</script>

<main class="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-8 flex items-center justify-center">
    <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="text-center mb-8">
            <h1 class="text-4xl font-bold text-gray-800 mb-2">Pokequiz - Description quiz</h1>
            <p class="text-lg text-gray-600">Question {currentQuestion}/{totalQuestions}</p>
        </div>

        {#if loading}
            <div class="text-center py-12">
                <p class="text-gray-600">Loading...</p>
            </div>
        {:else}
            <!-- Description Section -->
            <div class="bg-white rounded-lg shadow-lg p-8 mb-12">
                <p class="text-2xl text-gray-800 text-center leading-relaxed">
                    "{description}"
                </p>
            </div>

            <!-- Pokemon Cards Grid -->
            <div class="grid grid-cols-2 gap-6 md:grid-cols-4">
                {#each pokemonOptions as pokemon (pokemon.name)}
                    <Pokecard 
                        {pokemon}
                        on:selected={() => handleAnswer(pokemon.isCorrect)}
                    />
                {/each}
            </div>
        {/if}
    </div>
</main>

<style>
    :global(body) {
        margin: 0;
        padding: 0;
    }
</style>
