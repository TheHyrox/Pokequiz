<script lang="ts">
    import { getPokemonDescription } from '../../server/src/lib/description';

    getPokemonDescription('pikachu', '5', null).then(description => {
        console.log(description);
    });
</script>

<main class="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex items-center justify-center">
    <div class="text-center">
        <h1 class="text-4xl font-bold text-gray-800 mb-4">Welcome to Pokequiz</h1>
        <p class="text-gray-600 mb-8">Test your Pokemon knowledge!</p>
    </div>
</main>

<style>
    :global(body) {
        margin: 0;
        padding: 0;
    }
</style>
