/**
 * @brief Pokemon description service
 * @description Fetches and processes Pokemon descriptions from PokeAPI
 */

import { generationToId } from './utils/utils';
import { POKEMON_NAME_PLACEHOLDERS } from '../../../shared/constants';

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
    const url = `https://pokeapi.co/api/v2/pokemon-species/${pokemon}/`;

    let generationId: number[] | null = null;
    let descriptions: string[] = [];
    const langId = parseInt(languageId);

    if (generation != null) {
        generationId = await generationToId(generation);
    }

    try {
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
        console.error('Error fetching Pokemon description:', e);
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
 * @param description - Original description text
 * @param strength - Truncation strength (1-3), higher = more words masked
 * @returns Description with some words replaced by blocks
 * @example
 * truncateDescription("Pikachu is a yellow mouse", 1)
 * // returns "██████ is a ██████ mouse"
 */
export function truncateDescription(description: string, strength: number): string {
    const words = description.split(' ');

    const maskedWords = words.map((word, index) => {
        let shouldMask = false;

        if (strength === 1 && index % 2 === 0) {
            shouldMask = true;
        } else if (strength === 2 && index % 3 === 0) {
            shouldMask = true;
        } else if (strength === 3 && index % 4 === 0) {
            shouldMask = true;
        }

        if (shouldMask) {
            return '█'.repeat(Math.max(word.length, 1));
        }
        return word;
    });

    return maskedWords.join(' ');
}

/**
 * @brief Scrambles word order in description
 * @param description - Original description text
 * @returns Description with words reordered using random algorithm
 * @description Uses one of 5 scrambling algorithms:
 * - Alphabetical order
 * - Shortest to longest
 * - Longest to shortest
 * - Most vowels first
 * - Complete random shuffle
 */
export function scrambleDescription(description: string): string {
    const words = description.split(' ');
    const algorithm = Math.floor(Math.random() * 5);

    let scrambledWords = [...words];

    switch (algorithm) {
        case 0: // Alphabetical order
            scrambledWords.sort((a, b) =>
                a.toLowerCase().localeCompare(b.toLowerCase())
            );
            break;

        case 1: // Shortest to longest
            scrambledWords.sort((a, b) => a.length - b.length);
            break;

        case 2: // Longest to shortest
            scrambledWords.sort((a, b) => b.length - a.length);
            break;

        case 3: // Most vowels first
            scrambledWords.sort((a, b) => {
                const vowelPattern = /[aeiouàâäæëéèêïîôöœùûüœAEIOUÀÂÄÆËÉÈÊÏÎÔÖŒÙÛÜŒ]/gi;
                const vowelsA = (a.match(vowelPattern) || []).length;
                const vowelsB = (b.match(vowelPattern) || []).length;
                return vowelsB - vowelsA;
            });
            break;

        case 4: // Fisher-Yates shuffle
            for (let i = scrambledWords.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [scrambledWords[i], scrambledWords[j]] = [scrambledWords[j], scrambledWords[i]];
            }
            break;
    }

    return scrambledWords.join(' ');
}
