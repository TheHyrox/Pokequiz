/**
 * @brief Pokemon description service
 * @description Fetches and processes Pokemon descriptions from PokeAPI
 */

import { generationToId } from '../../../shared/utils/pokemonUtils.js';
import { truncateDescription, scrambleDescription } from '../../../shared/utils/descriptionUtils.js';
import { POKEMON_NAME_PLACEHOLDERS, LANGUAGE_ID_TO_CODE } from '../../../shared/constants/index.js';

/**
 * @brief Fetches Pokemon descriptions from PokeAPI
 * @param pokemon - Pokemon ID or name
 * @param languageId - PokeAPI language ID as string
 * @param generation - Generation filter (optional, null for all)
 * @returns Array of unique description strings
 * @example
 * await getPokemonDescription("25", "9", null) // All English Pikachu descriptions
 * await getPokemonDescription("25", "9", "1") // Gen 1 English descriptions only
 */
export async function getPokemonDescription(
    pokemon: string,
    languageId: string,
    generation: string | null
): Promise<string[] | undefined> {
    let generationId: number[] | null = null;
    let descriptions: string[] = [];
    const langId = parseInt(languageId);

    if (generation != null) {
        generationId = await generationToId(generation);
    }

    const langCode = LANGUAGE_ID_TO_CODE[langId];
    if (langCode) {
        try {
            const { getServerDataDir } = await import('./utils/' + 'utils.js');
            const fs = await import('fs');
            const path = await import('path');

            const filePath = path.join(getServerDataDir(), 'pokemon-descriptions', `${langCode}.json`);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf-8');
                const allDescriptions: { [key: string]: { descriptions: Array<{ text: string; version: string }> } } = JSON.parse(content);
                const pokemonData = allDescriptions[pokemon];

                if (pokemonData && Array.isArray(pokemonData.descriptions)) {
                    descriptions = pokemonData.descriptions.map((d: any) => d.text.replace(/\n/g, ' '));
                    if (descriptions.length > 0) {
                        return descriptions;
                    }
                }
            }
        } catch (e) {
            console.error('Error reading local descriptions:', e);
        }
    }

    try {
        const url = `https://pokeapi.co/api/v2/pokemon-species/${pokemon}/`;
        const response = await fetch(url);
        const data = await response.json() as { flavor_text_entries: Array<{ language: { url: string }; version: { url: string }; flavor_text: string }>; names: { name: string; language: { url: string } }[] };

        for (const entry of data.flavor_text_entries) {
            const entryLangId = parseInt(
                entry.language.url.split('/').filter((part: string) => part).pop() || '0'
            );

            if (generationId == null && generation == null) {
                if (entryLangId === langId) {
                    descriptions.push(entry.flavor_text.replace(/\n/g, ' '));
                }
            } else if (generationId != null) {
                for (const genVersionId of generationId) {
                    if (entryLangId === langId && entry.version.url.endsWith(`/${genVersionId}/`)) {
                        descriptions.push(entry.flavor_text.replace(/\n/g, ' '));
                    }
                }
            }
        }

        return await noSpoilerDescription(descriptions, languageId, data);
    } catch (e) {
        console.error('Error fetching Pokemon description from PokeAPI:', e);
        return undefined;
    }
}

/**
 * @brief Replaces Pokemon name with placeholder in descriptions
 * @param descriptions - Array of description texts
 * @param lang - Language ID as string
 * @param data - Pokemon species data from API containing names
 * @returns Descriptions with Pokemon names replaced by placeholders
 */
async function noSpoilerDescription(
    descriptions: string[],
    lang: string,
    data: { names: Array<{ name: string; language: { url: string } }> }
): Promise<string[]> {
    const nameLocalized = data.names.find(
        (name) => name.language.url.endsWith(`/${lang}/`)
    );

    const placeholder = POKEMON_NAME_PLACEHOLDERS[lang] || 'this Pokemon';

    for (let i = 0; i < descriptions.length; i++) {
        if (nameLocalized) {
            descriptions[i] = descriptions[i].replace(
                new RegExp(nameLocalized.name, 'gi'),
                placeholder
            );
        }
    }

    return removeDuplicateDescriptions(descriptions);
}

/**
 * @brief Removes duplicate descriptions from array
 * @param descriptions - Array of description strings
 * @returns Array with duplicates removed
 */
function removeDuplicateDescriptions(descriptions: string[]): string[] {
    return [...new Set(descriptions)];
}

/**
 * @brief Truncates description by masking words
 * @description Exported from shared utility module
 */
export { truncateDescription } from '../../../shared/utils/descriptionUtils.js';

/**
 * @brief Scrambles word order in description
 * @description Exported from shared utility module
 */
export { scrambleDescription } from '../../../shared/utils/descriptionUtils.js';
