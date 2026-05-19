/**
 * Client-side wrappers for pokemon descriptions
 */

import { truncateDescription, scrambleDescription } from '../../../shared/utils/descriptionUtils.js';

export { truncateDescription, scrambleDescription };

export async function getPokemonDescription(pokemon: string, languageId: string, generation: string | null): Promise<string[] | undefined> {
    try {
        const res = await fetch(`/api/pokemon/${pokemon}/description/${languageId}`);
        if (!res.ok) return undefined;
        const data = await res.json();
        return data?.descriptions || undefined;
    } catch (e) {
        console.error('Error fetching description from server:', e);
        return undefined;
    }
}
