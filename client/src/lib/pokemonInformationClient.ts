/**
 * Client-side wrapper for pokemon information quiz data
 */

export async function getPokemonInformationData(
    pokemonId: string | number,
    languageId: string | number
): Promise<any> {
    try {
        const res = await fetch(`/api/pokemon/${pokemonId}/${languageId}`);
        if (!res.ok) return undefined;
        const data = await res.json();
        return data;
    } catch (e) {
        console.error('Error fetching information data from server:', e);
        return undefined;
    }
}
