<script lang="ts">
    import { onMount } from 'svelte';
    import Autocomplete from '../components/Autocomplete.svelte';
    import QuizEndModal from '../components/quiz/QuizEndModal.svelte';
    import Toast from '../components/Toast.svelte';
    import { getLabel } from './lib/translations';
    import { createToastHandlers } from './lib/toastUtils';
    import { getRandomPokemonId } from '../../shared/utils/pokemonUtils';
    import { createSeededRng, getTodayDateString } from '../../shared/utils/seededRng';
    import { getPokemonInformationData } from './lib/pokemonInformationClient';
    import { preloadPokemonNames, getPokemonNameSync, getAllPokemonNamesSync } from './lib/pokemonNamesClient';
    import { normalizeText } from '../../shared/utils/textUtils';
    import { savePokedleSettings, recordQuizGameResult, getDailyChallengeStatus, saveDailyChallengeRun } from './lib/storage';
    import PokedexMiniCardModal from '../components/quiz/PokedexMiniCardModal.svelte';
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
    let selectedPokedexPokemon: { id: number; name: string } | null = null;
    let gameIndex: number = 0;
    $: isDailyMode = Boolean(settings.isDailyChallenge || settings.dailySeed);
    $: dailySeedStr = settings.dailySeed || getTodayDateString();

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

    async function startNewGame(allowRetry: boolean = false) {
        if (isDailyMode && allowRetry) {
            // Daily Challenge cannot be retried — just show the completed run
            showEndModal = false;
            return;
        }
        isLoading = true;
        isGameOver = false;
        hasWon = false;
        showEndModal = false;
        guesses = [];
        currentInputValue = '';
        
        let correctId: number;
        if (isDailyMode) {
            const rng = createSeededRng(`${dailySeedStr}:pokedle:round:0`);
            correctId = getRandomPokemonId(settings.selectedGenerations, rng);
        } else {
            correctId = getRandomPokemonId(settings.selectedGenerations);
        }
        gameIndex++;
        targetPokemonData = await getPokemonInformationData(correctId, languageId);
        
        if (!targetPokemonData) {
            showErrorToast('Failed to load target Pokemon data.');
        }

        // Restore saved Daily Challenge run if already played today
        if (isDailyMode && targetPokemonData) {
            const savedDaily = getDailyChallengeStatus('pokedle', dailySeedStr);
            if (savedDaily && savedDaily.runData?.pokedleGuessedIds?.length) {
                const loadedGuesses: any[] = [];
                for (const gId of savedDaily.runData.pokedleGuessedIds) {
                    const gData = await getPokemonInformationData(gId, languageId);
                    if (gData) loadedGuesses.push(gData);
                }
                guesses = loadedGuesses;
                if (savedDaily.completed) {
                    isGameOver = true;
                    hasWon = Boolean(savedDaily.isWin ?? guesses.some(g => Number(g.id) === Number(targetPokemonData.id)));
                    showEndModal = false;
                }
            }
        }
        
        isLoading = false;
    }

    function recordPokedleStats(won: boolean, guessCount: number) {
        const modeKey = isDailyMode ? 'daily' : 'wordle';
        recordQuizGameResult({
            quizSlug: 'pokedle',
            modeKey,
            isWin: won,
            score: guessCount,
            guessesUsed: guessCount,
            lowerIsBetter: true,
            dailyChallenge: isDailyMode
                ? {
                    date: dailySeedStr,
                    pokemonId: Number(targetPokemonData?.id),
                    pokemonName: targetPokemonData?.name,
                    runData: {
                        pokedleGuessedIds: guesses.map(g => Number(g.id))
                    }
                }
                : undefined
        });
    }

    async function handleGuess(selectedOption: { id: number; name: string }) {
        if (isGameOver || isSubmitting || guesses.length >= settings.guessLimit) return;

        if (guesses.some(g => Number(g.id) === Number(selectedOption.id))) {
            showErrorToast(getLabel(languageCode, 'pokedle_alreadyGuessed'));
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
                recordPokedleStats(true, guesses.length);
                showEndModal = true;
            } else if (guesses.length >= settings.guessLimit) {
                hasWon = false;
                isGameOver = true;
                recordPokedleStats(false, guesses.length);
                showEndModal = true;
            } else if (isDailyMode) {
                // Save in-progress daily guesses so refreshing doesn't reset the daily attempt
                saveDailyChallengeRun({
                    date: dailySeedStr,
                    quiz: 'pokedle',
                    completed: false,
                    score: guesses.length,
                    pokemonId: Number(targetPokemonData?.id),
                    pokemonName: targetPokemonData?.name,
                    runData: {
                        pokedleGuessedIds: guesses.map(g => Number(g.id))
                    }
                });
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
        return getLabel(languageCode, `pokedle_col_${col}`);
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
                class="pokedle-back-btn text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white font-medium flex items-center gap-2"
                on:click={isDailyMode ? onBackToHub : onBackToSettings}
            >
                {getLabel(languageCode, 'back')}
            </button>
            <div class="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <span>{getLabel(languageCode, 'pokedle_quiz')}</span>
                {#if settings.isDailyChallenge || settings.dailySeed}
                    <span class="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-300">
                        📅 {settings.dailySeed || getTodayDateString()}
                    </span>
                {/if}
            </div>
            <div class="text-sm font-semibold text-white bg-blue-500 px-4 py-2 rounded-full shadow-sm">
                {getLabel(languageCode, 'pokedle_guessesLeft').replace('{0}', String(Math.max(0, settings.guessLimit - guesses.length)))}
            </div>
        </div>

        <div class="max-w-7xl mx-auto">
            {#if isDailyMode && isGameOver && targetPokemonData}
                <div class="daily-run-summary max-w-2xl mx-auto mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/60 border-2 border-amber-300 dark:border-amber-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <div class="font-bold text-amber-900 dark:text-amber-200 text-sm">
                            📅 {getLabel(languageCode, 'dailyAlreadyPlayed')}
                        </div>
                        <div class="text-xs text-amber-800 dark:text-amber-300 mt-1">
                            {getLabel(languageCode, 'correctAnswer')}: <span class="font-black">{targetPokemonData.name}</span> ({guesses.length}/{settings.guessLimit})
                        </div>
                    </div>
                    <button
                        type="button"
                        on:click={() => { selectedPokedexPokemon = { id: Number(targetPokemonData.id), name: targetPokemonData.name }; }}
                        class="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shrink-0 cursor-pointer"
                    >
                        📖 {getLabel(languageCode, 'pokedexMiniCard')}: {targetPokemonData.name}
                    </button>
                </div>
            {/if}

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
            <div class="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
                <table class="w-full text-left border-collapse min-w-max">
                    <thead>
                        <tr class="bg-gray-50 dark:bg-gray-900/70 border-b-2 border-gray-200 dark:border-gray-700">
                            <th class="py-3 px-4 font-bold text-gray-700 dark:text-gray-200 text-center sticky left-0 bg-gray-50 dark:bg-gray-900 z-10 border-r border-gray-200 dark:border-gray-700">Pokemon</th>
                            {#each settings.selectedColumns as col}
                                <th class="py-3 px-4 font-bold text-gray-700 dark:text-gray-200 text-center capitalize">{getColumnLabel(col)}</th>
                            {/each}
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                        {#each guesses as guess (guess.id)}
                            <tr transition:fade={{ duration: 300 }}>
                                <!-- Pokemon Name and Sprite (clickable to view Pokédex Mini-Card) -->
                                <td class="py-3 px-4 sticky left-0 bg-white dark:bg-gray-800 z-10 border-r border-gray-100 dark:border-gray-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                    <button
                                        type="button"
                                        on:click={() => { selectedPokedexPokemon = { id: Number(guess.id), name: guess.name }; }}
                                        title={getLabel(languageCode, 'clickPokemonForInfo')}
                                        class="flex flex-col items-center gap-1 min-w-[100px] w-full cursor-pointer hover:scale-105 transition-transform bg-transparent border-none"
                                    >
                                        <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${guess.id}.png`} alt={guess.name} class="w-16 h-16 object-contain" />
                                        <span class="font-bold text-gray-800 dark:text-gray-100 text-sm text-center">{guess.name}</span>
                                    </button>
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
        correctAnswer={{ id: targetPokemonData.id, name: targetPokemonData.name, isCorrect: true }}
        {languageCode}
        gameMode="pokedle"
        isDailyChallenge={isDailyMode}
        on:home={onBackToHub}
        on:changeSettings={onBackToSettings}
        on:retry={() => startNewGame(true)}
        on:close={() => { showEndModal = false; }}
    />
{/if}

{#if selectedPokedexPokemon}
    <PokedexMiniCardModal
        pokemonId={selectedPokedexPokemon.id}
        pokemonName={selectedPokedexPokemon.name}
        {languageCode}
        on:close={() => { selectedPokedexPokemon = null; }}
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
