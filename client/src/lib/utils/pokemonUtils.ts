/**
 * @brief Pokemon-related utility functions for the client
 * @description Provides random Pokemon selection and generation utilities
 */

import { GENERATION_RANGES, TOTAL_POKEMON } from '../../../../shared/constants';
import type { GenerationRange } from '../../../../shared/types';

/**
 * @brief Gets a random integer from 0 to max-1
 * @param max - Upper bound (exclusive)
 * @returns Random integer in range [0, max)
 * @example
 * getRandomInt(10) // returns 0-9
 */
export function getRandomInt(max: number): number {
    return Math.floor(Math.random() * max);
}

/**
 * @brief Gets a random Pokemon ID from selected generations
 * @param selectedGenerations - Array of generation numbers to include (1-9)
 * @returns Random Pokemon ID within the selected generations
 * @example
 * getRandomPokemonId([1]) // returns ID between 1-151
 * getRandomPokemonId([1, 2]) // returns ID between 1-251
 * getRandomPokemonId([]) // returns ID between 1-1025
 */
export function getRandomPokemonId(selectedGenerations: number[]): number {
    if (selectedGenerations.length === 0) {
        return getRandomInt(TOTAL_POKEMON) + 1;
    }

    const validRanges: GenerationRange[] = selectedGenerations
        .filter(gen => GENERATION_RANGES[gen])
        .map(gen => GENERATION_RANGES[gen]);

    if (validRanges.length === 0) {
        return getRandomInt(TOTAL_POKEMON) + 1;
    }

    const randomRange = validRanges[getRandomInt(validRanges.length)];
    const offset = getRandomInt(randomRange.max - randomRange.min + 1);
    return randomRange.min + offset;
}

/**
 * @brief Gets multiple unique random Pokemon IDs
 * @param count - Number of unique IDs to generate
 * @param selectedGenerations - Array of generation numbers to include
 * @returns Array of unique Pokemon IDs
 * @example
 * getMultipleRandomPokemonIds(4, [1]) // returns 4 unique IDs from Gen 1
 */
export function getMultipleRandomPokemonIds(
    count: number,
    selectedGenerations: number[]
): number[] {
    const selected = new Set<number>();
    const ids: number[] = [];

    while (ids.length < count) {
        const id = getRandomPokemonId(selectedGenerations);
        if (!selected.has(id)) {
            selected.add(id);
            ids.push(id);
        }
    }

    return ids;
}

/**
 * @brief Checks if a Pokemon ID is valid
 * @param id - Pokemon ID to check
 * @returns True if ID is in valid range (1-1025)
 */
export function isValidPokemonId(id: number): boolean {
    return Number.isInteger(id) && id >= 1 && id <= TOTAL_POKEMON;
}

/**
 * @brief Gets the generation number for a Pokemon ID
 * @param pokemonId - Pokemon National Pokedex ID
 * @returns Generation number (1-9) or null if invalid
 * @example
 * getGenerationForPokemon(25) // returns 1 (Pikachu)
 * getGenerationForPokemon(152) // returns 2 (Chikorita)
 */
export function getGenerationForPokemon(pokemonId: number): number | null {
    for (const [gen, range] of Object.entries(GENERATION_RANGES)) {
        if (pokemonId >= range.min && pokemonId <= range.max) {
            return parseInt(gen);
        }
    }
    return null;
}
