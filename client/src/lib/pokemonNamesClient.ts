/**
 * Client-side wrapper to fetch localized pokemon names from server API
 */

export async function getPokemonNameLocalized(pokemon: number, languageId: number): Promise<string | null> {
    try {
        const res = await fetch(`/api/pokemon/names/${languageId}`);
        if (!res.ok) return null;
        const list = await res.json() as Array<{ id: number; name: string }>;
        const entry = list.find(e => Number(e.id) === Number(pokemon));
        return entry ? entry.name : null;
    } catch (e) {
        console.error('Error fetching localized name from server:', e);
        return null;
    }
}
