/**
 * @brief Pokemon description service
 * @description Fetches and processes Pokemon descriptions from PokeAPI
 */

import { generationToId } from '../../../shared/utils/pokemonUtils.js';
import { truncateDescription, scrambleDescription } from '../../../shared/utils/descriptionUtils.js';
import { POKEMON_NAME_PLACEHOLDERS, LANGUAGE_ID_TO_CODE } from '../../../shared/constants/index.js';
import { getPokemonNameLocalized } from './name.js';

/**
 * @brief Fetches Pokemon descriptions from PokeAPI or local data
 * @param pokemon - Pokemon ID or name
 * @param languageId - PokeAPI language ID as string
 * @param generation - Generation filter (optional, null for all)
 * @returns Array of unique description strings with names masked
 */
export async function getPokemonDescription(
    pokemon: string,
    languageId: string,
    generation: string | null
): Promise<string[] | undefined> {
    let descriptions: string[] = [];
    const langId = parseInt(languageId);
    const pokemonId = parseInt(pokemon);

    const pokemonName = await getPokemonNameLocalized(pokemonId, langId);

    const langCode = LANGUAGE_ID_TO_CODE[langId];
    if (langCode) {
        try {
            const { getServerDataDir } = await import('./utils/utils.js');
            const fs = await import('fs');
            const path = await import('path');

            const filePath = path.join(getServerDataDir(), 'pokemon-descriptions', `${langCode}.json`);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf-8');
                const allDescriptions: { [key: string]: { descriptions: Array<{ text: string; version: string }> } } = JSON.parse(content);
                const pokemonData = allDescriptions[pokemon];

                if (pokemonData && Array.isArray(pokemonData.descriptions)) {
                    descriptions = pokemonData.descriptions.map((d: any) => d.text);
                }
            }
        } catch (e) {
            console.error('Error reading local descriptions:', e);
        }
    }

    if (descriptions.length === 0) {
        try {
            const url = `https://pokeapi.co/api/v2/pokemon-species/${pokemon}/`;
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json() as { 
                    flavor_text_entries: Array<{ 
                        language: { url: string }; 
                        version: { url: string }; 
                        flavor_text: string 
                    }> 
                };

                let generationId: number[] | null = null;
                if (generation != null) {
                    generationId = await generationToId(generation);
                }

                for (const entry of data.flavor_text_entries) {
                    const entryLangId = parseInt(
                        entry.language.url.split('/').filter((part: string) => part).pop() || '0'
                    );

                    if (entryLangId === langId) {
                        if (generationId == null) {
                            descriptions.push(entry.flavor_text);
                        } else {
                            for (const genVersionId of generationId) {
                                if (entry.version.url.endsWith(`/${genVersionId}/`)) {
                                    descriptions.push(entry.flavor_text);
                                }
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Error fetching Pokemon description from PokeAPI:', e);
        }
    }

    if (descriptions.length === 0) return undefined;

    return noSpoilerDescription(descriptions, languageId, pokemonName);
}

/**
 * @brief Replaces Pokemon name with placeholder in descriptions
 * @param descriptions - Array of description texts
 * @param langId - Language ID as string
 * @param name - Localized Pokemon name for masking
 * @returns Descriptions with Pokemon names replaced by placeholders and cleaned formatting
 */
function noSpoilerDescription(
    descriptions: string[],
    langId: string,
    name: string | null
): string[] {
    const placeholder = POKEMON_NAME_PLACEHOLDERS[langId] || 'this Pokemon';
    
    const processed = descriptions.map(desc => {
        let text = desc.replace(/[\n\f\r]/g, ' ').replace(/\u00ad/g, '');

        if (name) {
            const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escapedName, 'gi');
            text = text.replace(regex, placeholder);
        }

        text = text.replace(/\s+/g, ' ').trim();
        const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return text.replace(new RegExp(escapedPlaceholder, 'gi'), `<i>${placeholder}</i>`);
    });

    return removeDuplicateDescriptions(processed);
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
