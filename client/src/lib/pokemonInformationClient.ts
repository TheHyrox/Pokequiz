/**
 * Client-side wrapper for pokemon information quiz data
 * Uses an in-memory Map cache to avoid redundant network requests
 */

const pokemonInfoCache = new Map<string, any>();

export async function getPokemonInformationData(
    pokemonId: string | number,
    languageId: string | number
): Promise<any> {
    const cacheKey = `${pokemonId}:${languageId}`;
    if (pokemonInfoCache.has(cacheKey)) {
        return pokemonInfoCache.get(cacheKey);
    }

    try {
        const res = await fetch(`/api/pokemon/${pokemonId}/${languageId}`);
        if (!res.ok) return undefined;
        const data = await res.json();
        pokemonInfoCache.set(cacheKey, data);
        return data;
    } catch (e) {
        console.error('Error fetching information data from server:', e);
        return undefined;
    }
}

export async function getPokemonInformationBatch(
    pokemonIds: Array<string | number>,
    languageId: string | number
): Promise<Record<string, any>> {
    const result: Record<string, any> = {};
    const missingIds: Array<string | number> = [];

    for (const id of pokemonIds) {
        const cacheKey = `${id}:${languageId}`;
        if (pokemonInfoCache.has(cacheKey)) {
            result[String(id)] = pokemonInfoCache.get(cacheKey);
        } else {
            missingIds.push(id);
        }
    }

    if (missingIds.length === 0) {
        return result;
    }

    try {
        const res = await fetch(`/api/pokemon/batch/${languageId}?ids=${missingIds.join(',')}`);
        if (res.ok) {
            const batchData = await res.json() as Record<string, any>;
            for (const [id, data] of Object.entries(batchData)) {
                pokemonInfoCache.set(`${id}:${languageId}`, data);
                result[id] = data;
            }
        }
    } catch (e) {
        console.error('Error fetching batch information data from server:', e);
    }

    return result;
}

export function clearPokemonInformationCache(): void {
    pokemonInfoCache.clear();
}
