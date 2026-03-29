/**
 * @brief Pokemon name cache service
 * @description Manages cached Pokemon names loaded from local JSON files by language
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { LANGUAGE_ID_TO_CODE } from '../../../shared/constants';
import type { Pokemon } from '../../../shared/types';

// Re-export Pokemon type for backward compatibility
export type { Pokemon };

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** In-memory cache for Pokemon names by language code */
let pokemonCache: Record<string, Pokemon[]> = {};

/**
 * @brief Retrieves all Pokemon names for a given language
 * @param languageId - PokeAPI language ID
 * @returns Promise resolving to array of Pokemon with id and localized name
 * @throws Error if language ID is invalid or file not found
 * @example
 * const pokemon = await getAllPokemonNames(9); // English names
 */
export async function getAllPokemonNames(languageId: number): Promise<Pokemon[]> {
    const langCode = LANGUAGE_ID_TO_CODE[languageId];

    if (!langCode) {
        throw new Error(`Invalid language ID: ${languageId}`);
    }

    // Return cached data if available
    if (pokemonCache[langCode]) {
        return pokemonCache[langCode];
    }

    const filePath = path.join(__dirname, '../data/pokemon-names', `${langCode}.json`);

    if (!fs.existsSync(filePath)) {
        throw new Error(`Pokemon names file not found for language: ${langCode}. Path: ${filePath}`);
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const pokemonList = JSON.parse(fileContent) as Pokemon[];

    // Store in cache for future requests
    pokemonCache[langCode] = pokemonList;

    return pokemonList;
}

/**
 * @brief Clears the Pokemon name cache
 * @description Useful for testing or forcing a reload of data
 */
export function clearPokemonCache(): void {
    pokemonCache = {};
}
