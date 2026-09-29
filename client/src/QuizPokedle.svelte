<script lang="ts">
    import { onMount } from 'svelte';
    import Autocomplete from '../components/Autocomplete.svelte';
    import QuizEndModal from '../components/quiz/QuizEndModal.svelte';
    import Toast from '../components/Toast.svelte';
    import { getLabel } from './lib/translations';
    import { createToastHandlers } from './lib/toastUtils';
    import { getRandomPokemonId } from '../../shared/utils/pokemonUtils';
    import { getPokemonInformationData } from './lib/pokemonInformationClient';
    import { preloadPokemonNames, getPokemonNameSync, getAllPokemonNamesSync } from './lib/pokemonNamesClient';
    import { normalizeText } from '../../shared/utils/textUtils';
    import { savePokedleSettings } from './lib/storage';
    import type { PokedleQuizSettings, PokedleColumn, ToastState } from '../../shared/types';
    import { fly, fade } from 'svelte/transition';

    export let settings: PokedleQuizSettings;
    export let onBackToHub: () => void;
    export let onBackToSettings: () => void;
    export let languageCode: string = 'en';
    export let languageId: number = 9;

    let targetPokemonData: any = null;
    let guesses: any[] = [];
    let isGameOver: boolean = false;
    let hasWon: boolean = false;
    let showEndModal: boolean = false;
    let isLoading: boolean = true;
    let isSubmitting: boolean = false;
    let currentInputValue: string = '';

    let toastState: ToastState = {
        message: '',
        type: 'info',
        show: false
    };

    const { showErrorToast } = createToastHandlers((state: ToastState) => {
        toastState = state;
    });

    onMount(async () => {
        savePokedleSettings(settings);
        await preloadPokemonNames(languageId);
        await startNewGame();
    });

    async function startNewGame() {
        isLoading = true;
        isGameOver = false;
        hasWon = false;
        showEndModal = false;
        guesses = [];
        currentInputValue = '';
        
        let correctId = getRandomPokemonId(settings.selectedGenerations);
        targetPokemonData = await getPokemonInformationData(correctId, languageId);
        
        if (!targetPokemonData) {
            showErrorToast('Failed to load target Pokemon data.');
        }
        
        isLoading = false;
    }

    async function handleGuess(selectedOption: { id: number; name: string }) {
        if (isGameOver || isSubmitting || guesses.length >= settings.guessLimit) return;

        if (guesses.some(g => Number(g.id) === Number(selectedOption.id))) {
            showErrorToast(getLabel(languageCode, 'pokedle_alreadyGuessed' as any));
            return;
        }

        isSubmitting = true;
        
        try {
            const guessData = await getPokemonInformationData(selectedOption.id, languageId);
            if (!guessData) {
                showErrorToast('Failed to load guessed Pokemon data.');
                isSubmitting = false;
                return;
            }

            guesses = [...guesses, guessData];

            if (Number(selectedOption.id) === Number(targetPokemonData.id)) {
                hasWon = true;
                isGameOver = true;
                showEndModal = true;
            } else if (guesses.length >= settings.guessLimit) {
                hasWon = false;
                isGameOver = true;
                showEndModal = true;
            }
        } catch (error) {
            showErrorToast('Error checking guess.');
        } finally {
            isSubmitting = false;
        }
    }

    function handleEnterSubmit() {
        if (isGameOver || isSubmitting || guesses.length >= settings.guessLimit || !currentInputValue.trim()) return;

        const normalizedInput = normalizeText(currentInputValue);
        const allPokemon = Object.entries(getAllPokemonNamesSync(languageId));
        
        const matched = allPokemon.find(([id, name]) => normalizeText(name as string) === normalizedInput);
        
        if (matched) {
            currentInputValue = '';
            handleGuess({ id: Number(matched[0]), name: matched[1] as string });
        } else {
            showErrorToast('Pokemon not found.');
        }
    }

    function getColumnLabel(col: PokedleColumn): string {
        return getLabel(languageCode, `pokedle_col_${col}` as any);
    }

    function checkMatch(guessedData: any, col: PokedleColumn): { state: 'green' | 'yellow' | 'red', arrow?: 'up' | 'down' } {
        const target = targetPokemonData;
        
        switch (col) {
            case 'type1':
            case 'type2': {
                const isType1 = col === 'type1';
                const guessedType = isType1 ? guessedData.types[0]?.name : guessedData.types[1]?.name;
                const targetType = isType1 ? target.types[0]?.name : target.types[1]?.name;
                
                if (guessedType === targetType) return { state: 'green' };
                if (!guessedType) return { state: 'red' }; // Guessed has no type2, target might have one
                
                // Yellow if it matches the OTHER type
                const otherTargetType = isType1 ? target.types[1]?.name : target.types[0]?.name;
                if (guessedType === otherTargetType) return { state: 'yellow' };
                
                return { state: 'red' };
            }
            case 'weight':
            case 'height':
            case 'generation': {
                const guessedVal = Number(guessedData[col]);
                const targetVal = Number(target[col]);
                
                if (guessedVal === targetVal) return { state: 'green' };
                
                const arrow = guessedVal < targetVal ? 'up' : 'down';
                return { state: 'red', arrow: settings.showMoreLessIndicators ? arrow : undefined };
            }
            case 'color':
            case 'shape':
            case 'category':
            case 'habitat': {
                const guessedVal = String(guessedData[col] || '').toLowerCase();
                const targetVal = String(target[col] || '').toLowerCase();
                return { state: guessedVal === targetVal ? 'green' : 'red' };
            }
            case 'abilities':
            case 'eggGroup': {
                const isAbilities = col === 'abilities';
                const guessedArr = isAbilities ? guessedData.abilities.map((a: any) => a.name) : guessedData.eggGroups;
                const targetArr = isAbilities ? target.abilities.map((a: any) => a.name) : target.eggGroups;
                
                const guessedSet = new Set(guessedArr);
                const targetSet = new Set(targetArr);
                
                // Check exact match
                if (guessedSet.size === targetSet.size && [...guessedSet].every(x => targetSet.has(x))) {
                    return { state: 'green' };
                }
                
                // Check partial match
                if ([...guessedSet].some(x => targetSet.has(x))) {
                    return { state: 'yellow' };
                }
                
                return { state: 'red' };
            }
            default:
                return { state: 'red' };
        }
    }

    function formatValue(guessedData: any, col: PokedleColumn): string {
        switch (col) {
            case 'type1': return guessedData.types[0]?.name || '-';
            case 'type2': return guessedData.types[1]?.name || '-';
            case 'weight': return `${(guessedData.weight / 10).toFixed(1)} kg`;
            case 'height': return `${(guessedData.height / 10).toFixed(1)} m`;
            case 'color': return guessedData.color || '-';
            case 'shape': return guessedData.shape || '-';
            case 'category': return guessedData.category || '-';
            case 'habitat': return guessedData.habitat || '-';
            case 'generation': return String(guessedData.generation);
            case 'abilities': return guessedData.abilities.map((a: any) => a.name).join(', ') || '-';
            case 'eggGroup': return guessedData.eggGroups.join(', ') || '-';
            default: return '-';
        }
    }
</script>

{#if isLoading}
    <div class="min-h-screen flex items-center justify-center">
        <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
    </div>
{:else}
    <div class="p-8 w-full">
        <!-- Header -->
        <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 mb-8">
            <button
                class="text-gray-600 hover:text-gray-800 font-medium flex items-center gap-2"
                on:click={onBackToSettings}
            >
                {getLabel(languageCode, 'back')}
            </button>
            <div class="text-2xl font-bold text-gray-800">
                {getLabel(languageCode, 'pokedle_quiz' as any)}
            </div>
            <div class="text-sm font-semibold text-white bg-blue-500 px-4 py-2 rounded-full shadow-sm">
                {getLabel(languageCode, 'pokedle_guessesLeft' as any).replace('{0}', String(Math.max(0, settings.guessLimit - guesses.length)))}
            </div>
        </div>

        <div class="max-w-7xl mx-auto">
            <!-- Autocomplete Search Input -->
            <div class="max-w-md mx-auto mb-8 relative z-30">
                <Autocomplete
                    pokemonList={Object.entries(getAllPokemonNamesSync(languageId)).map(([id, name]) => ({
                        id: Number(id),
                        name: name as string
                    }))}
                    placeholder="Type a Pokemon name..."
                    bind:value={currentInputValue}
                    selectedGenerations={settings.selectedGenerations}
                    disabled={isGameOver || isSubmitting || guesses.length >= settings.guessLimit}
                    on:select={(e) => {
                        currentInputValue = '';
                        handleGuess(e.detail.pokemon);
                    }}
                    on:submit={handleEnterSubmit}
                />
            </div>

            <!-- Game Grid -->
            <div class="overflow-x-auto bg-white rounded-xl shadow-lg border border-gray-100">
                <table class="w-full text-left border-collapse min-w-max">
                    <thead>
                        <tr class="bg-gray-50 border-b-2 border-gray-200">
                            <th class="py-3 px-4 font-bold text-gray-700 text-center sticky left-0 bg-gray-50 z-10 border-r border-gray-200">Pokemon</th>
                            {#each settings.selectedColumns as col}
                                <th class="py-3 px-4 font-bold text-gray-700 text-center capitalize">{getColumnLabel(col)}</th>
                            {/each}
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        {#each guesses as guess (guess.id)}
                            <tr transition:fade={{ duration: 300 }}>
                                <!-- Pokemon Name and Sprite -->
                                <td class="py-3 px-4 sticky left-0 bg-white z-10 border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                    <div class="flex flex-col items-center gap-1 min-w-[100px]">
                                        <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${guess.id}.png`} alt={guess.name} class="w-16 h-16 object-contain" />
                                        <span class="font-bold text-gray-800 text-sm text-center">{guess.name}</span>
                                    </div>
                                </td>
                                
                                <!-- Attributes -->
                                {#each settings.selectedColumns as col}
                                    {@const match = checkMatch(guess, col)}
                                    <td class="py-3 px-4">
                                        <div class="flex items-center justify-center w-full h-full min-h-[60px] rounded-lg shadow-sm border
                                            {match.state === 'green' ? 'bg-green-500 border-green-600 text-white' : 
                                             match.state === 'yellow' ? 'bg-yellow-400 border-yellow-500 text-white' : 
                                             'bg-red-500 border-red-600 text-white'}">
                                            
                                            <div class="flex items-center gap-2 px-3 py-2 text-center text-sm font-semibold whitespace-nowrap">
                                                <span>{formatValue(guess, col)}</span>
                                                
                                                {#if match.arrow === 'up'}
                                                    <svg class="w-5 h-5 text-white/90 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 15l7-7 7 7" />
                                                    </svg>
                                                {:else if match.arrow === 'down'}
                                                    <svg class="w-5 h-5 text-white/90 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                {/if}
                                            </div>
                                        </div>
                                    </td>
                                {/each}
                            </tr>
                        {/each}
                    </tbody>
                </table>
                {#if guesses.length === 0}
                    <div class="text-center py-12 text-gray-400 font-medium">
                        Start typing a Pokemon name above to begin!
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}

{#if showEndModal && targetPokemonData}
    <QuizEndModal
        isWin={hasWon}
        score={guesses.length}
        correctAnswer={{ id: targetPokemonData.id, name: targetPokemonData.name }}
        {languageCode}
        gameMode="pokedle"
        on:home={onBackToHub}
        on:changeSettings={onBackToSettings}
        on:retry={startNewGame}
        on:close={() => { showEndModal = false; }}
    />
{/if}

{#if toastState.show}
    <Toast
        message={toastState.message}
        type={toastState.type}
        autoClose={true}
        duration={2000}
        onClose={() => { toastState.show = false; }}
    />
{/if}
