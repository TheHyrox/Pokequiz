/**
 * @brief Server-side utility functions for Pokemon quiz logic
 * @description Provides random Pokemon selection and generation mapping utilities
 */

import { GENERATION_RANGES, GENERATION_VERSION_IDS, TOTAL_POKEMON } from '../../../../shared/constants';
import type { GenerationRange } from '../../../../shared/types';

// Re-export for backward compatibility
export { GENERATION_RANGES };

/**
 * @brief Maps generation string to PokeAPI version group IDs
 * @param generation - Generation number as string (1-9)
 * @returns Array of version group IDs for that generation, or null if invalid
 * @example
 * await generationToId("1") // returns [32, 31, 46, 45, 44, 3, 2, 1]
 */
export async function generationToId(generation: string): Promise<number[] | null> {
    return GENERATION_VERSION_IDS[generation] ?? null;
}

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
 * @param selectedGenerations - Array of generation numbers to include
 * @returns Random Pokemon ID within the selected generations
 * @example
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

    const randomRange = validRanges[Math.floor(Math.random() * validRanges.length)];
    const offset = Math.floor(Math.random() * (randomRange.max - randomRange.min + 1));
    return randomRange.min + offset;
}
