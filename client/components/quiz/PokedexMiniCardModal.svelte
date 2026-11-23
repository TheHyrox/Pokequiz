<script lang="ts">
    /**
     * @brief Post-Round "Pokédex Mini-Card" Modal Component
     * @description Displays full localized info (types, base stats, Pokédex descriptions,
     *              abilities, height/weight, and Normal vs. Shiny sprite toggle) when a user
     *              clicks a Pokémon on round end or in the Challenge review screen.
     */
    import { onMount, createEventDispatcher } from 'svelte';
    import { getPokemonInformationData } from '../../src/lib/pokemonInformationClient';
    import { getPokemonDescription } from '../../src/lib/pokemonDescriptionClient';
    import { getSpriteUrl } from '../../../shared/constants/sprites';
    import { LANGUAGE_CODE_TO_ID } from '../../../shared/constants';
    import { capitalizeFirst } from '../../../shared/utils/textUtils';
    import { getLabel, type LabelKey } from '../../src/lib/translations';

    /** National Pokédex ID of the Pokémon to inspect */
    export let pokemonId: number;
    /** Optional localized name fallback */
    export let pokemonName: string = '';
    /** Current language code (e.g. 'en', 'fr') */
    export let languageCode: string = 'en';

    const dispatch = createEventDispatcher();

    let isLoading = true;
    let isShiny = false;
    let pokemonData: any = null;
    let descriptions: string[] = [];
    let currentDescIndex = 0;

    $: languageId = LANGUAGE_CODE_TO_ID[languageCode] ?? 9;

    $: currentSpriteUrl = isShiny
        ? getSpriteUrl(pokemonId, 'home_shiny')
        : getSpriteUrl(pokemonId, 'home');

    $: fallbackSpriteUrl = isShiny
        ? getSpriteUrl(pokemonId, 'shiny')
        : getSpriteUrl(pokemonId, 'default');

    function l(key: LabelKey): string {
        return getLabel(languageCode, key);
    }

    function handleClose(): void {
        dispatch('close');
    }

    function handleKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
            event.stopPropagation();
            handleClose();
        }
    }

    function nextDescription(): void {
        if (descriptions.length > 1) {
            currentDescIndex = (currentDescIndex + 1) % descriptions.length;
        }
    }

    const TYPE_BADGE_COLORS: Record<string, string> = {
        '1': 'bg-gray-400 text-white',       // Normal
        '2': 'bg-red-700 text-white',        // Fighting
        '3': 'bg-indigo-400 text-white',     // Flying
        '4': 'bg-purple-600 text-white',     // Poison
        '5': 'bg-amber-600 text-white',      // Ground
        '6': 'bg-yellow-700 text-white',     // Rock
        '7': 'bg-lime-600 text-white',       // Bug
        '8': 'bg-purple-800 text-white',     // Ghost
        '9': 'bg-slate-500 text-white',      // Steel
        '10': 'bg-orange-500 text-white',    // Fire
        '11': 'bg-blue-500 text-white',      // Water
        '12': 'bg-green-500 text-white',     // Grass
        '13': 'bg-yellow-400 text-gray-900', // Electric
        '14': 'bg-pink-500 text-white',      // Psychic
        '15': 'bg-cyan-400 text-gray-900',   // Ice
        '16': 'bg-indigo-700 text-white',    // Dragon
        '17': 'bg-stone-800 text-white',     // Dark
        '18': 'bg-pink-400 text-white'       // Fairy
    };

    function getTypeBadgeClass(typeId: string | number): string {
        return TYPE_BADGE_COLORS[String(typeId)] || 'bg-blue-600 text-white';
    }

    function getStatBarColor(val: number): string {
        if (val >= 120) return 'bg-emerald-500';
        if (val >= 90) return 'bg-green-500';
        if (val >= 60) return 'bg-amber-400';
        return 'bg-orange-500';
    }

    async function loadPokedexDetails(): Promise<void> {
        if (!pokemonId) return;
        isLoading = true;
        currentDescIndex = 0;
        try {
            const [info, descs] = await Promise.all([
                getPokemonInformationData(pokemonId, languageId),
                getPokemonDescription(String(pokemonId), String(languageId), null)
            ]);
            pokemonData = info || null;
            // Unmask placeholder italics in description if present so the mini-card reads cleanly
            const displayName = capitalizeFirst(info?.name || pokemonName || `#${pokemonId}`);
            descriptions = (descs || []).map(d =>
                d.replace(/<i>.*?<\/i>/gi, displayName)
            );
        } catch (err) {
            console.error('Failed to load Pokédex Mini-Card details:', err);
        } finally {
            isLoading = false;
        }
    }

    $: if (pokemonId && languageCode) {
        loadPokedexDetails();
    }

    onMount(() => {
        const onWindowKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                handleClose();
            }
        };
        window.addEventListener('keydown', onWindowKey, true);
        return () => window.removeEventListener('keydown', onWindowKey, true);
    });
</script>

<div
    class="pokedex-minicard-overlay fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70]"
    on:click|self={handleClose}
    on:keydown={handleKeyDown}
    role="dialog"
    aria-modal="true"
    aria-label={l('pokedexMiniCard')}
    tabindex="-1"
>
    <div class="pokedex-minicard bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 dark:border-gray-700 animate-fadeIn">
        <!-- Header Bar -->
        <div class="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-4 flex items-center justify-between text-white">
            <div class="flex items-center gap-3">
                <span class="px-2.5 py-1 rounded-full bg-black/25 font-mono font-bold text-sm">
                    #{String(pokemonId).padStart(4, '0')}
                </span>
                <div>
                    <h2 class="text-xl font-black tracking-tight leading-tight">
                        {capitalizeFirst(pokemonData?.name || pokemonName || `#${pokemonId}`)}
                    </h2>
                    {#if pokemonData?.category}
                        <p class="text-xs text-red-100 font-medium">{pokemonData.category}</p>
                    {/if}
                </div>
            </div>
            <button
                type="button"
                on:click={handleClose}
                class="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white font-bold transition-colors cursor-pointer"
                aria-label={l('close')}
            >
                ✕
            </button>
        </div>

        {#if isLoading}
            <div class="p-12 text-center text-gray-500 dark:text-gray-300 font-medium">
                {l('loading')}
            </div>
        {:else}
            <div class="p-6 max-h-[80vh] overflow-y-auto space-y-5">
                <!-- Top Section: Sprite + Normal/Shiny Toggle + Types & Physical Info -->
                <div class="flex flex-col sm:flex-row items-center gap-6">
                    <!-- Sprite Display & Toggle -->
                    <div class="flex flex-col items-center shrink-0">
                        <div class="w-36 h-36 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-700 dark:to-gray-900 border border-gray-200 dark:border-gray-600 flex items-center justify-center p-3 relative shadow-inner">
                            <img
                                src={currentSpriteUrl}
                                alt={pokemonData?.name || pokemonName}
                                class="w-full h-full object-contain transition-transform duration-300 hover:scale-105 pokedex-minicard-sprite"
                                on:error={(e) => {
                                    const img = e.currentTarget as HTMLImageElement;
                                    if (img.src !== fallbackSpriteUrl) {
                                        img.src = fallbackSpriteUrl;
                                    }
                                }}
                            />
                        </div>

                        <!-- Normal vs Shiny Toggle -->
                        <div class="mt-2.5 inline-flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1 border border-gray-200 dark:border-gray-600">
                            <button
                                type="button"
                                on:click={() => { isShiny = false; }}
                                class="shiny-toggle-normal px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer {!isShiny ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-300'}"
                            >
                                {l('normalSprite')}
                            </button>
                            <button
                                type="button"
                                on:click={() => { isShiny = true; }}
                                class="shiny-toggle-shiny px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer {isShiny ? 'bg-amber-400 text-gray-900 shadow-sm' : 'text-gray-600 dark:text-gray-300'}"
                            >
                                {l('shinySprite')}
                            </button>
                        </div>
                    </div>

                    <!-- Types, Height, Weight, Generation, Abilities -->
                    <div class="flex-1 w-full space-y-3">
                        <!-- Types -->
                        {#if pokemonData?.types?.length}
                            <div>
                                <span class="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400 block mb-1">
                                    {l('information_types')}
                                </span>
                                <div class="flex flex-wrap gap-2">
                                    {#each pokemonData.types as t (t.id)}
                                        <span class="px-3 py-1 rounded-full text-xs font-bold shadow-sm {getTypeBadgeClass(t.id)}">
                                            {t.name}
                                        </span>
                                    {/each}
                                </div>
                            </div>
                        {/if}

                        <!-- Physical Metrics Grid -->
                        <div class="grid grid-cols-3 gap-2 bg-gray-50 dark:bg-gray-700/60 p-2.5 rounded-xl border border-gray-100 dark:border-gray-600 text-center">
                            <div>
                                <span class="text-[10px] font-bold uppercase text-gray-400 block">{l('information_generation')}</span>
                                <span class="text-sm font-bold text-gray-800 dark:text-gray-100">Gen {pokemonData?.generation ?? '-'}</span>
                            </div>
                            <div>
                                <span class="text-[10px] font-bold uppercase text-gray-400 block">{l('information_height')}</span>
                                <span class="text-sm font-bold text-gray-800 dark:text-gray-100">
                                    {pokemonData?.height ? `${(pokemonData.height / 10).toFixed(1)} m` : '-'}
                                </span>
                            </div>
                            <div>
                                <span class="text-[10px] font-bold uppercase text-gray-400 block">{l('information_weight')}</span>
                                <span class="text-sm font-bold text-gray-800 dark:text-gray-100">
                                    {pokemonData?.weight ? `${(pokemonData.weight / 10).toFixed(1)} kg` : '-'}
                                </span>
                            </div>
                        </div>

                        <!-- Abilities -->
                        {#if pokemonData?.abilities?.length}
                            <div>
                                <span class="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1">
                                    {l('information_abilities')}
                                </span>
                                <div class="flex flex-wrap gap-1.5">
                                    {#each pokemonData.abilities as ab, idx (idx)}
                                        <span class="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
                                            {ab.name}
                                        </span>
                                    {/each}
                                </div>
                            </div>
                        {/if}
                    </div>
                </div>

                <!-- Pokédex Description -->
                {#if descriptions.length > 0}
                    <div class="bg-amber-50/70 dark:bg-gray-700/50 border border-amber-200 dark:border-gray-600 rounded-xl p-4">
                        <div class="flex items-center justify-between mb-1.5">
                            <span class="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                                📖 {l('pokedexDescription')}
                            </span>
                            {#if descriptions.length > 1}
                                <button
                                    type="button"
                                    on:click={nextDescription}
                                    class="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                >
                                    {l('description_changeDescriptionBtn')} ({currentDescIndex + 1}/{descriptions.length})
                                </button>
                            {/if}
                        </div>
                        <p class="text-sm text-gray-800 dark:text-gray-100 italic leading-relaxed pokedex-minicard-description">
                            "{@html descriptions[currentDescIndex]}"
                        </p>
                    </div>
                {/if}

                <!-- Base Stats -->
                {#if pokemonData?.baseStats}
                    {@const stats = [
                        { label: l('statHP'), val: pokemonData.baseStats.hp },
                        { label: l('statAttack'), val: pokemonData.baseStats.attack },
                        { label: l('statDefense'), val: pokemonData.baseStats.defense },
                        { label: l('statSpAtk'), val: pokemonData.baseStats.specialAttack },
                        { label: l('statSpDef'), val: pokemonData.baseStats.specialDefense },
                        { label: l('statSpeed'), val: pokemonData.baseStats.speed }
                    ]}
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                📊 {l('baseStats')}
                            </span>
                            <span class="text-xs font-bold text-gray-700 dark:text-gray-200">
                                {l('statTotal')}: {pokemonData.baseStats.total}
                            </span>
                        </div>
                        <div class="space-y-1.5">
                            {#each stats as st (st.label)}
                                <div class="flex items-center gap-2 text-xs">
                                    <span class="w-16 font-bold text-gray-600 dark:text-gray-300 text-right shrink-0">{st.label}</span>
                                    <span class="w-8 font-mono font-bold text-gray-800 dark:text-gray-100 text-right shrink-0">{st.val}</span>
                                    <div class="flex-1 h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            class="h-full rounded-full transition-all duration-300 {getStatBarColor(st.val)}"
                                            style="width: {Math.min(100, Math.round((st.val / 255) * 100))}%;"
                                        ></div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>
        {/if}

        <!-- Footer -->
        <div class="px-6 py-3 bg-gray-50 dark:bg-gray-900/60 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <button
                type="button"
                on:click={handleClose}
                class="px-5 py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold text-sm rounded-lg transition-colors cursor-pointer"
            >
                {l('close')}
            </button>
        </div>
    </div>
</div>
