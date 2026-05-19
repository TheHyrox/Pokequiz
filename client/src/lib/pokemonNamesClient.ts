/**
 * Client-side wrapper to fetch localized pokemon names from server API
 * Uses caching to avoid repeated fetch requests
 */

// Cache for pokemon names per language: { languageId: { pokemonId: name } }
const pokemonNamesCache: { [languageId: number]: { [id: number]: string } } = {};

/**
 * Pre-load all pokemon names for a language into memory
 * Call this once at quiz start to avoid repeated fetch requests
 */
export async function preloadPokemonNames(languageId: number): Promise<boolean> {
    // Return if already cached
    if (pokemonNamesCache[languageId]) {
        return true;
    }

    try {
        const res = await fetch(`/api/pokemon/names/${languageId}`);
        if (!res.ok) return false;
        const list = await res.json() as Array<{ id: number; name: string }>;
        
        // Build map for O(1) lookups
        const nameMap: { [id: number]: string } = {};
        list.forEach(entry => {
            nameMap[Number(entry.id)] = entry.name;
        });
        
        pokemonNamesCache[languageId] = nameMap;
        console.log(`✓ Preloaded ${list.length} pokemon names for language ${languageId}`);
        return true;
    } catch (e) {
        console.error('Error preloading pokemon names from server:', e);
        return false;
    }
}

/**
 * Get a pokemon name from cache (must call preloadPokemonNames first)
 * Returns null if not preloaded or name not found
 */
export function getPokemonNameSync(pokemon: number, languageId: number): string | null {
    const languageCache = pokemonNamesCache[languageId];
    if (!languageCache) return null;
    return languageCache[pokemon] || null;
}

/**
 * Get a pokemon name with automatic preload fallback
 * For compatibility, falls back to preload if not cached
 */
export async function getPokemonNameLocalized(pokemon: number, languageId: number): Promise<string | null> {
    // Try cache first
    let name = getPokemonNameSync(pokemon, languageId);
    if (name) return name;

    // Preload if not cached
    const preloaded = await preloadPokemonNames(languageId);
    if (!preloaded) return null;

    // Try again after preload
    return getPokemonNameSync(pokemon, languageId);
}
